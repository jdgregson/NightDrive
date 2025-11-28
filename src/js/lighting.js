function getAllEdges(cars = []) {
    profiler.start('getAllEdges');
    const edges = [];
    const buffer = 600;
    const minX = camera.x - buffer;
    const maxX = camera.x + canvas.width + buffer;
    const minY = camera.y - buffer;
    const maxY = camera.y + canvas.height + buffer;
    
    for (const obs of obstacles) {
        if (obs.x + obs.width < minX || obs.x > maxX || obs.y + obs.height < minY || obs.y > maxY) continue;
        edges.push(
            [{ x: obs.x, y: obs.y }, { x: obs.x + obs.width, y: obs.y }],
            [{ x: obs.x + obs.width, y: obs.y }, { x: obs.x + obs.width, y: obs.y + obs.height }],
            [{ x: obs.x + obs.width, y: obs.y + obs.height }, { x: obs.x, y: obs.y + obs.height }],
            [{ x: obs.x, y: obs.y + obs.height }, { x: obs.x, y: obs.y }]
        );
    }
    for (const obj of interactiveObjects) {
        if (obj.hit) continue;
        if (obj.x < minX || obj.x > maxX || obj.y < minY || obj.y > maxY) continue;
        if (obj.type === 'mailbox') {
            edges.push(
                [{ x: obj.x - 4, y: obj.y - 10 }, { x: obj.x + 4, y: obj.y - 10 }],
                [{ x: obj.x + 4, y: obj.y - 10 }, { x: obj.x + 4, y: obj.y + 2 }],
                [{ x: obj.x + 4, y: obj.y + 2 }, { x: obj.x - 4, y: obj.y + 2 }],
                [{ x: obj.x - 4, y: obj.y + 2 }, { x: obj.x - 4, y: obj.y - 10 }]
            );
        } else {
            const hsize = 9;
            edges.push(
                [{ x: obj.x - hsize, y: obj.y - hsize }, { x: obj.x + hsize, y: obj.y - hsize }],
                [{ x: obj.x + hsize, y: obj.y - hsize }, { x: obj.x + hsize, y: obj.y + hsize }],
                [{ x: obj.x + hsize, y: obj.y + hsize }, { x: obj.x - hsize, y: obj.y + hsize }],
                [{ x: obj.x - hsize, y: obj.y + hsize }, { x: obj.x - hsize, y: obj.y - hsize }]
            );
        }
    }
    for (const c of cars) {
        const cos = Math.cos(c.angle);
        const sin = Math.sin(c.angle);
        const hw = c.width / 2;
        const hh = c.height / 2;
        const corners = [
            { x: c.x + cos * hh - sin * hw, y: c.y + sin * hh + cos * hw },
            { x: c.x + cos * hh + sin * hw, y: c.y + sin * hh - cos * hw },
            { x: c.x - cos * hh + sin * hw, y: c.y - sin * hh - cos * hw },
            { x: c.x - cos * hh - sin * hw, y: c.y - sin * hh + cos * hw }
        ];
        edges.push(
            [corners[0], corners[1]],
            [corners[1], corners[2]],
            [corners[2], corners[3]],
            [corners[3], corners[0]]
        );
    }
    profiler.end('getAllEdges');
    return edges;
}

function raycast(origin, angle, maxDist = 1000, isStreetLight = false, cars = []) {
    if (isStreetLight) maxDist = 250;
    const dx = Math.cos(angle);
    const dy = Math.sin(angle);
    let minDist = maxDist;
    let hitPoint = null;

    const edges = getAllEdges(cars);

    for (const [p1, p2] of edges) {
        const x1 = p1.x - origin.x;
        const y1 = p1.y - origin.y;
        const x2 = p2.x - origin.x;
        const y2 = p2.y - origin.y;

        const x3 = p2.x - p1.x;
        const y3 = p2.y - p1.y;

        const den = x3 * dy - y3 * dx;
        if (Math.abs(den) < 0.0001) continue;

        const t = (x3 * y1 - y3 * x1) / den;
        const u = (dx * y1 - dy * x1) / den;

        if (t > 0 && u >= 0 && u <= 1 && t < minDist) {
            minDist = t;
            hitPoint = { x: origin.x + dx * t, y: origin.y + dy * t };
        }
    }

    return { dist: minDist, hit: hitPoint };
}

function castLightCone(origin, angle, spread, rays = 500, isStreetLight = false, cars = []) {
    profiler.start('castLightCone');
    const points = [origin];
    const hitPoints = [];

    for (let i = 0; i < rays; i++) {
        const a = angle - spread / 2 + (spread * i) / (rays - 1);
        const { dist, hit } = raycast(origin, a, 1000, isStreetLight, cars);
        points.push({
            x: origin.x + Math.cos(a) * dist,
            y: origin.y + Math.sin(a) * dist
        });
        if (hit) hitPoints.push(hit);
    }

    profiler.end('castLightCone');
    return { points, hitPoints };
}

function isPointLit(x, y) {
    const headlightOffset = 35;
    const leftLight = {
        x: car.x + Math.cos(car.angle) * headlightOffset - Math.sin(car.angle) * 10,
        y: car.y + Math.sin(car.angle) * headlightOffset + Math.cos(car.angle) * 10
    };
    const rightLight = {
        x: car.x + Math.cos(car.angle) * headlightOffset + Math.sin(car.angle) * 10,
        y: car.y + Math.sin(car.angle) * headlightOffset - Math.cos(car.angle) * 10
    };
    
    if (headlightsOn) {
        const distLeft = Math.hypot(x - leftLight.x, y - leftLight.y);
        const angleToLeft = Math.atan2(y - leftLight.y, x - leftLight.x);
        const diffLeft = Math.abs(angleToLeft - car.angle);
        if (distLeft < 400 && diffLeft < Math.PI / 2.5) return true;
        
        const distRight = Math.hypot(x - rightLight.x, y - rightLight.y);
        const angleToRight = Math.atan2(y - rightLight.y, x - rightLight.x);
        const diffRight = Math.abs(angleToRight - car.angle);
        if (distRight < 400 && diffRight < Math.PI / 2.5) return true;
    }
    
    const streetLightPos = { x: streetLight.x, y: streetLight.y - streetLight.poleHeight };
    const distStreet = Math.hypot(x - streetLightPos.x, y - streetLightPos.y);
    if (distStreet < 250) return true;
    
    if (spotlightActive) {
        const cos = Math.cos(car.angle);
        const sin = Math.sin(car.angle);
        const driverSidePos = {
            x: car.x + cos * 10 + sin * (car.width / 2 + 5),
            y: car.y + sin * 10 - cos * (car.width / 2 + 5)
        };
        const distSpot = Math.hypot(x - driverSidePos.x, y - driverSidePos.y);
        const angleToSpot = Math.atan2(y - driverSidePos.y, x - driverSidePos.x);
        const spotAngle = Math.atan2(mouseWorldY - driverSidePos.y, mouseWorldX - driverSidePos.x);
        const diffSpot = Math.abs(angleToSpot - spotAngle);
        if (distSpot < 600 && diffSpot < Math.PI / 18) return true;
    }
    
    return false;
}

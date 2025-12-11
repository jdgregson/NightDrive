function getCarCorners(carObj, widthBuffer = 0, heightBuffer = 0) {
    const cos = Math.cos(carObj.angle);
    const sin = Math.sin(carObj.angle);
    const hw = (carObj.width + widthBuffer) / 2;
    const hh = (carObj.height + heightBuffer) / 2;

    return [
        { x: carObj.x + (-hw * cos - hh * sin), y: carObj.y + (-hw * sin + hh * cos) },
        { x: carObj.x + (hw * cos - hh * sin), y: carObj.y + (hw * sin + hh * cos) },
        { x: carObj.x + (hw * cos + hh * sin), y: carObj.y + (hw * sin - hh * cos) },
        { x: carObj.x + (-hw * cos + hh * sin), y: carObj.y + (-hw * sin - hh * cos) }
    ];
}

function drawCollisionBox(carObj, widthBuffer, heightBuffer) {
    const corners = getCarCorners(carObj, widthBuffer, heightBuffer);
    ctx.strokeStyle = '#ff0000';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(corners[0].x - camera.x, corners[0].y - camera.y);
    for (let i = 1; i < corners.length; i++) {
        ctx.lineTo(corners[i].x - camera.x, corners[i].y - camera.y);
    }
    ctx.closePath();
    ctx.stroke();
}

const COLLISION_WIDTH_BUFFER = 50;
const COLLISION_HEIGHT_BUFFER = -50;

function checkCarToCarCollision(car1, car2) {
    const corners1 = getCarCorners(car1, COLLISION_WIDTH_BUFFER, COLLISION_HEIGHT_BUFFER);
    const corners2 = getCarCorners(car2, COLLISION_WIDTH_BUFFER, COLLISION_HEIGHT_BUFFER);

    const axes = [
        { x: Math.cos(car1.angle), y: Math.sin(car1.angle) },
        { x: -Math.sin(car1.angle), y: Math.cos(car1.angle) },
        { x: Math.cos(car2.angle), y: Math.sin(car2.angle) },
        { x: -Math.sin(car2.angle), y: Math.cos(car2.angle) }
    ];

    for (const axis of axes) {
        let min1 = Infinity, max1 = -Infinity;
        let min2 = Infinity, max2 = -Infinity;

        for (const corner of corners1) {
            const proj = corner.x * axis.x + corner.y * axis.y;
            min1 = Math.min(min1, proj);
            max1 = Math.max(max1, proj);
        }

        for (const corner of corners2) {
            const proj = corner.x * axis.x + corner.y * axis.y;
            min2 = Math.min(min2, proj);
            max2 = Math.max(max2, proj);
        }

        if (max1 < min2 || max2 < min1) {
            return false;
        }
    }

    return true;
}

function checkCollision(carObj, otherCar) {
    profiler.start('collision_check');
    const corners = getCarCorners(carObj, COLLISION_WIDTH_BUFFER, COLLISION_HEIGHT_BUFFER);
    const buffer = 500;
    const edgeBuffer = 3;
    
    const frontCorners = carObj.speed >= 0 ? [corners[1], corners[2]] : [corners[0], corners[3]];
    
    for (const corner of frontCorners) {
        let cornerOnBridge = false;
        for (const bridge of bridges) {
            for (const c of bridge.crossings) {
                const dx = corner.x - c.roadPt.x;
                const dy = corner.y - c.roadPt.y;
                const along = dx * Math.cos(c.angle) + dy * Math.sin(c.angle);
                const across = -dx * Math.sin(c.angle) + dy * Math.cos(c.angle);
                if (Math.abs(across) < 100 && Math.abs(along) < bridge.length / 2) {
                    cornerOnBridge = true;
                    break;
                }
            }
            if (cornerOnBridge) break;
        }
        
        if (!cornerOnBridge) {
            for (const water of waterPaths) {
                for (let i = 0; i < water.path.length - 1; i++) {
                    const w1 = water.path[i];
                    const w2 = water.path[i + 1];
                    const dx = w2.x - w1.x;
                    const dy = w2.y - w1.y;
                    const len2 = dx * dx + dy * dy;
                    if (len2 === 0) continue;
                    let t = ((corner.x - w1.x) * dx + (corner.y - w1.y) * dy) / len2;
                    t = Math.max(0, Math.min(1, t));
                    const projX = w1.x + t * dx;
                    const projY = w1.y + t * dy;
                    const dist = Math.hypot(corner.x - projX, corner.y - projY);
                    if (dist < water.width / 2) {
                        profiler.end('collision_check');
                        return true;
                    }
                }
            }
        }
    }

    for (const obs of obstacles) {
        if (Math.abs(obs.x - carObj.x) > buffer || Math.abs(obs.y - carObj.y) > buffer) continue;
        for (const corner of corners) {
            if (corner.x >= obs.x - edgeBuffer && corner.x <= obs.x + obs.width + edgeBuffer &&
                corner.y >= obs.y - edgeBuffer && corner.y <= obs.y + obs.height + edgeBuffer) {
                
                const dx = carObj.x - (obs.x + obs.width / 2);
                const dy = carObj.y - (obs.y + obs.height / 2);
                const pushDist = 5;
                const angle = Math.atan2(dy, dx);
                carObj.x += Math.cos(angle) * pushDist;
                carObj.y += Math.sin(angle) * pushDist;
                
                const now = performance.now();
                if (now - lastSparkTime > 200) {
                    lastSparkTime = now;
                    const sparkAngle = Math.atan2(carObj.y - (obs.y + obs.height / 2), carObj.x - (obs.x + obs.width / 2));
                    for (let i = 0; i < 5; i++) {
                        const spread = (Math.random() - 0.5) * Math.PI / 2;
                        const speed = 2 + Math.random() * 2;
                        debris.push({
                            x: corner.x,
                            y: corner.y,
                            vx: Math.cos(sparkAngle + spread) * speed,
                            vy: Math.sin(sparkAngle + spread) * speed,
                            size: 2,
                            color: i < 2 ? '#ffaa00' : (i < 3 ? '#ffff00' : '#1a1a1a'),
                            rotation: 0,
                            rotSpeed: 0,
                            lifetime: 20,
                            glow: i < 3
                        });
                    }
                }
                
                const velX = Math.cos(carObj.angle) * carObj.speed + carObj.vx;
                const velY = Math.sin(carObj.angle) * carObj.speed + carObj.vy;
                const velMag = Math.hypot(velX, velY);
                
                if (velMag > 0.1) {
                    const nx = Math.cos(angle);
                    const ny = Math.sin(angle);
                    const dot = velX * nx + velY * ny;
                    const impactAngle = Math.acos(Math.abs(dot) / velMag);
                    
                    const GLANCING_THRESHOLD = Math.PI / 6;
                    if (impactAngle > GLANCING_THRESHOLD) {
                        const reflectX = velX - 2 * dot * nx;
                        const reflectY = velY - 2 * dot * ny;
                        
                        carObj.vx = reflectX * 0.2;
                        carObj.vy = reflectY * 0.2;
                        carObj.speed *= 0.85;
                        
                        const angleFactor = (impactAngle - GLANCING_THRESHOLD) / (Math.PI / 2 - GLANCING_THRESHOLD);
                        const spinForce = (velX * ny - velY * nx) * 0.05 * angleFactor;
                        carObj.angle += spinForce;
                        
                        carObj.glancingBlow = true;
                        profiler.end('collision_check');
                        return false;
                    }
                }
                
                return true;
            }
        }
    }

    if (otherCar && checkCarToCarCollision(carObj, otherCar)) {
        const now = performance.now();
        if (now - lastSparkTime > 200) {
            lastSparkTime = now;
            const midX = (carObj.x + otherCar.x) / 2;
            const midY = (carObj.y + otherCar.y) / 2;
            for (let i = 0; i < 5; i++) {
                debris.push({
                    x: midX,
                    y: midY,
                    vx: (Math.random() - 0.5) * 6,
                    vy: (Math.random() - 0.5) * 6,
                    size: 2,
                    color: i < 2 ? '#ffaa00' : (i < 3 ? '#ffff00' : '#1a1a1a'),
                    rotation: 0,
                    rotSpeed: 0,
                    lifetime: 20,
                    glow: i < 3
                });
            }
        }
        profiler.end('collision_check');
        return true;
    }

    profiler.end('collision_check');
    return false;
}

function checkObjectCollision(carObj) {
    const carSpeed = Math.hypot(carObj.vx, carObj.vy) || Math.abs(carObj.speed);
    const corners = getCarCorners(carObj, COLLISION_WIDTH_BUFFER, COLLISION_HEIGHT_BUFFER);
    const buffer = 100;

    for (const obj of interactiveObjects) {
        if (obj.hit || Math.abs(obj.x - carObj.x) > buffer || Math.abs(obj.y - carObj.y) > buffer) continue;

        let hit = false;
        
        for (const corner of corners) {
            if (obj.type === 'mailbox') {
                if (corner.x >= obj.x - 4 && corner.x <= obj.x + 4 &&
                    corner.y >= obj.y - 10 && corner.y <= obj.y + 2) {
                    hit = true;
                    break;
                }
            } else {
                const dist = Math.hypot(corner.x - obj.x, corner.y - obj.y);
                if (dist < 9) {
                    hit = true;
                    break;
                }
            }
        }
        
        if (!hit) {
            let inside = true;
            for (let i = 0; i < corners.length; i++) {
                const j = (i + 1) % corners.length;
                const edge = {
                    x1: corners[i].x, y1: corners[i].y,
                    x2: corners[j].x, y2: corners[j].y
                };
                const cross = (edge.x2 - edge.x1) * (obj.y - edge.y1) - (edge.y2 - edge.y1) * (obj.x - edge.x1);
                if (cross > 0) {
                    inside = false;
                    break;
                }
            }
            if (inside) hit = true;
        }

        if (hit && carSpeed > 0.5) {
            obj.hit = true;
            const angle = Math.atan2(obj.y - carObj.y, obj.x - carObj.x);
            const force = carSpeed * 2;

            for (let i = 0; i < 5; i++) {
                const spread = (Math.random() - 0.5) * Math.PI / 3;
                const speed = carSpeed * 0.8;
                debris.push({
                    x: obj.x,
                    y: obj.y,
                    vx: Math.cos(angle + spread) * speed,
                    vy: Math.sin(angle + spread) * speed,
                    size: 2,
                    color: i < 2 ? '#ffaa00' : (i < 3 ? '#ffff00' : '#1a1a1a'),
                    rotation: 0,
                    rotSpeed: 0,
                    lifetime: 20,
                    glow: i < 3
                });
            }

            if (obj.type === 'mailbox') {
                for (let i = 0; i < 8; i++) {
                    const colors = ['#1a1a1a', '#2a2a2a', '#3a3a3a', '#4a4a4a', '#5a5a5a'];
                    debris.push({
                        x: obj.x,
                        y: obj.y,
                        vx: Math.cos(angle + (Math.random() - 0.5) * 1.5) * (carSpeed * 0.5 + Math.random() * 0.5),
                        vy: Math.sin(angle + (Math.random() - 0.5) * 1.5) * (carSpeed * 0.5 + Math.random() * 0.5),
                        size: 4 + Math.random() * 4,
                        color: colors[Math.floor(Math.random() * colors.length)],
                        rotation: Math.random() * Math.PI * 2,
                        rotSpeed: (Math.random() - 0.5) * 0.3
                    });
                }
            } else {
                const trashColors = ['#000000', '#0a0a0a', '#1a1a1a', '#2a2a2a', '#3a3a3a', '#4a4a4a'];
                for (let i = 0; i < 12; i++) {
                    debris.push({
                        x: obj.x,
                        y: obj.y,
                        vx: Math.cos(angle + (Math.random() - 0.5) * 2) * (carSpeed * 0.6 + Math.random() * 0.8),
                        vy: Math.sin(angle + (Math.random() - 0.5) * 2) * (carSpeed * 0.6 + Math.random() * 0.8),
                        size: 3 + Math.random() * 5,
                        color: trashColors[Math.floor(Math.random() * trashColors.length)],
                        rotation: Math.random() * Math.PI * 2,
                        rotSpeed: (Math.random() - 0.5) * 0.4
                    });
                }
                debris.push({
                    x: obj.x,
                    y: obj.y,
                    vx: Math.cos(angle) * carSpeed * 0.8,
                    vy: Math.sin(angle) * carSpeed * 0.8,
                    size: 18,
                    color: obj.color,
                    shape: obj.shape,
                    rotation: 0,
                    rotSpeed: (Math.random() - 0.5) * 0.2,
                    isContainer: true
                });
            }
        }
    }
}

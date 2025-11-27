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
    const corners = getCarCorners(carObj, COLLISION_WIDTH_BUFFER, COLLISION_HEIGHT_BUFFER);

    for (const obs of obstacles) {
        for (const corner of corners) {
            if (corner.x >= obs.x && corner.x <= obs.x + obs.width &&
                corner.y >= obs.y && corner.y <= obs.y + obs.height) {
                return true;
            }
        }
    }

    if (otherCar && checkCarToCarCollision(carObj, otherCar)) {
        return true;
    }

    return false;
}

function checkObjectCollision() {
    const carSpeed = Math.abs(car.speed);

    for (const obj of interactiveObjects) {
        if (obj.hit) continue;

        const size = obj.type === 'mailbox' ? 20 : 18;
        const dist = Math.hypot(car.x - obj.x, car.y - obj.y);

        if (dist < size + 15 && carSpeed > 0.5) {
            obj.hit = true;
            const angle = Math.atan2(obj.y - car.y, obj.x - car.x);
            const force = carSpeed * 2;

            if (obj.type === 'mailbox') {
                for (let i = 0; i < 8; i++) {
                    const colors = ['#ffffff', '#ff6b6b', '#4ecdc4', '#ffe66d'];
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
                const trashColors = ['#8b4513', '#a0522d', '#cd853f', '#daa520', '#b8860b'];
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

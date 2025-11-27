function getCarCorners() {
    const cos = Math.cos(car.angle);
    const sin = Math.sin(car.angle);
    const hw = car.width / 2;
    const hh = car.height / 2;

    return [
        { x: car.x + (-hw * cos - hh * sin), y: car.y + (-hw * sin + hh * cos) },
        { x: car.x + (hw * cos - hh * sin), y: car.y + (hw * sin + hh * cos) },
        { x: car.x + (hw * cos + hh * sin), y: car.y + (hw * sin - hh * cos) },
        { x: car.x + (-hw * cos + hh * sin), y: car.y + (-hw * sin - hh * cos) }
    ];
}

function checkCollision() {
    const corners = getCarCorners();

    for (const obs of obstacles) {
        for (const corner of corners) {
            if (corner.x >= obs.x && corner.x <= obs.x + obs.width &&
                corner.y >= obs.y && corner.y <= obs.y + obs.height) {
                return true;
            }
        }
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

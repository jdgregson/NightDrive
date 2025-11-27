const playerCar = createPoliceCar(0, 0);
const aiCar = createPoliceCar(-150, 0);
const car = playerCar;

const AI_FOLLOW = false;

function updateAICar() {
    const prevX = aiCar.x;
    const prevY = aiCar.y;
    
    if (AI_FOLLOW) {
        const dx = playerCar.x - aiCar.x;
        const dy = playerCar.y - aiCar.y;
        const dist = Math.hypot(dx, dy);
        const targetAngle = Math.atan2(dy, dx);
        
        let angleDiff = targetAngle - aiCar.angle;
        while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
        while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
        
        aiCar.angle += angleDiff * 0.05;
        
        if (dist > 150) {
            aiCar.speed = Math.min(aiCar.speed + aiCar.acceleration, aiCar.maxSpeed);
        } else if (dist < 120) {
            aiCar.speed = Math.max(aiCar.speed - aiCar.acceleration, 0);
        }
        
        aiCar.speed *= aiCar.friction;
    }
    
    aiCar.x += Math.cos(aiCar.angle) * aiCar.speed + aiCar.vx;
    aiCar.y += Math.sin(aiCar.angle) * aiCar.speed + aiCar.vy;
    
    aiCar.vx *= 0.9;
    aiCar.vy *= 0.9;
    if (Math.abs(aiCar.vx) < 0.01) aiCar.vx = 0;
    if (Math.abs(aiCar.vy) < 0.01) aiCar.vy = 0;
    
    if (checkCollision(aiCar, null)) {
        aiCar.x = prevX;
        aiCar.y = prevY;
        aiCar.vx *= -0.3;
        aiCar.vy *= -0.3;
        aiCar.speed *= 0.3;
    }
    
    if (checkCollision(aiCar, playerCar)) {
        aiCar.x = prevX;
        aiCar.y = prevY;
        
        const dx2 = aiCar.x - playerCar.x;
        const dy2 = aiCar.y - playerCar.y;
        const dist2 = Math.hypot(dx2, dy2);
        if (dist2 > 0) {
            const bounceAngle = Math.atan2(dy2, dx2);
            aiCar.speed = -aiCar.speed * 0.3;
            aiCar.x += Math.cos(bounceAngle) * 3;
            aiCar.y += Math.sin(bounceAngle) * 3;
        }
    }
    
    const aiSpeed = Math.hypot(aiCar.vx, aiCar.vy);
    for (const obj of interactiveObjects) {
        if (obj.hit) continue;
        const size = obj.type === 'mailbox' ? 20 : 18;
        const dist = Math.hypot(aiCar.x - obj.x, aiCar.y - obj.y);
        if (dist < size + 15 && aiSpeed > 0.5) {
            obj.hit = true;
            const angle = Math.atan2(obj.y - aiCar.y, obj.x - aiCar.x);
            if (obj.type === 'mailbox') {
                for (let i = 0; i < 8; i++) {
                    const colors = ['#ffffff', '#ff6b6b', '#4ecdc4', '#ffe66d'];
                    debris.push({
                        x: obj.x, y: obj.y,
                        vx: Math.cos(angle + (Math.random() - 0.5) * 1.5) * (aiSpeed * 0.5 + Math.random() * 0.5),
                        vy: Math.sin(angle + (Math.random() - 0.5) * 1.5) * (aiSpeed * 0.5 + Math.random() * 0.5),
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
                        x: obj.x, y: obj.y,
                        vx: Math.cos(angle + (Math.random() - 0.5) * 2) * (aiSpeed * 0.6 + Math.random() * 0.8),
                        vy: Math.sin(angle + (Math.random() - 0.5) * 2) * (aiSpeed * 0.6 + Math.random() * 0.8),
                        size: 3 + Math.random() * 5,
                        color: trashColors[Math.floor(Math.random() * trashColors.length)],
                        rotation: Math.random() * Math.PI * 2,
                        rotSpeed: (Math.random() - 0.5) * 0.4
                    });
                }
                debris.push({
                    x: obj.x, y: obj.y,
                    vx: Math.cos(angle) * aiSpeed * 0.8,
                    vy: Math.sin(angle) * aiSpeed * 0.8,
                    size: 18, color: obj.color, shape: obj.shape,
                    rotation: 0, rotSpeed: (Math.random() - 0.5) * 0.2,
                    isContainer: true
                });
            }
        }
    }
}

function update() {
    updatePoliceCar(playerCar, aiCar);
    updateAICar();

    for (const d of debris) {
        d.x += d.vx;
        d.y += d.vy;
        d.vx *= 0.98;
        d.vy *= 0.98;
        d.rotation += d.rotSpeed;
        d.rotSpeed *= 0.99;
    }

    camera.x = car.x - canvas.width / 2;
    camera.y = car.y - canvas.height / 2;
}

function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

gameLoop();

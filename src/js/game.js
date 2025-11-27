const playerCar = createPoliceCar(0, 0);
const aiCar = createPoliceCar(-150, 0);
const car = playerCar;

function updateAICar() {
    const prevX = aiCar.x;
    const prevY = aiCar.y;
    
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
    
    aiCar.x += Math.cos(aiCar.angle) * aiCar.speed;
    aiCar.y += Math.sin(aiCar.angle) * aiCar.speed;
    
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

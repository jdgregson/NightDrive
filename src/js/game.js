const playerCar = createPoliceCar(0, 0);
const aiCar = createPoliceCar(-150, 0);
const aiCar2 = createPoliceCar(150, 150, playerCar);
const regularCar = createRegularCar(-400, -300, '#1a4d8f', playerCar);
const car = playerCar;
const aiCars = [aiCar, aiCar2];

function updateAICar(aiCar, allCars) {
    const prevX = aiCar.x;
    const prevY = aiCar.y;
    
    aiCar.prevSpeed = aiCar.speed;
    
    if (aiCar.followTarget) {
        const dx = aiCar.followTarget.x - aiCar.x;
        const dy = aiCar.followTarget.y - aiCar.y;
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
    
    for (const otherCar of allCars) {
        if (otherCar === aiCar) continue;
        if (checkCollision(aiCar, otherCar)) {
            aiCar.x = prevX;
            aiCar.y = prevY;
            
            const dx2 = aiCar.x - otherCar.x;
            const dy2 = aiCar.y - otherCar.y;
            const dist2 = Math.hypot(dx2, dy2);
            if (dist2 > 0) {
                const bounceAngle = Math.atan2(dy2, dx2);
                aiCar.speed = -aiCar.speed * 0.3;
                aiCar.x += Math.cos(bounceAngle) * 3;
                aiCar.y += Math.sin(bounceAngle) * 3;
            }
            break;
        }
    }
    
    checkObjectCollision(aiCar);
}

function update() {
    profiler.start('update_total');
    
    profiler.start('update_cars');
    const allCars = [playerCar, ...aiCars];
    updatePoliceCar(playerCar, aiCar);
    for (const ai of aiCars) {
        updateAICar(ai, allCars);
    }
    updateAICar(regularCar, allCars);
    profiler.end('update_cars');

    profiler.start('update_debris');
    for (const d of debris) {
        d.x += d.vx;
        d.y += d.vy;
        d.vx *= 0.98;
        d.vy *= 0.98;
        d.rotation += d.rotSpeed;
        d.rotSpeed *= 0.99;
    }
    profiler.end('update_debris');

    camera.x = car.x - canvas.width / 2;
    camera.y = car.y - canvas.height / 2;
    
    profiler.end('update_total');
}

function gameLoop() {
    update();
    draw();
    profiler.frame();
    requestAnimationFrame(gameLoop);
}

gameLoop();

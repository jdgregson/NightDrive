function update() {
    const prevX = car.x;
    const prevY = car.y;

    if (keys['w']) car.speed = Math.min(car.speed + car.acceleration, car.maxSpeed);
    if (keys['s']) car.speed = Math.max(car.speed - car.acceleration, -car.maxSpeed / 2);

    car.speed *= car.friction;
    if (Math.abs(car.speed) < 0.01) car.speed = 0;

    if (keys['a']) car.angle -= car.turnSpeed * Math.abs(car.speed) / car.maxSpeed;
    if (keys['d']) car.angle += car.turnSpeed * Math.abs(car.speed) / car.maxSpeed;

    car.x += Math.cos(car.angle) * car.speed;
    car.y += Math.sin(car.angle) * car.speed;

    if (checkCollision()) {
        car.x = prevX;
        car.y = prevY;
        car.speed = 0;
    }

    checkObjectCollision();

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

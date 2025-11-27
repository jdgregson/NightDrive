function createRegularCar(x, y, color, followTarget = null) {
    return {
        x: x,
        y: y,
        width: 30,
        height: 80,
        angle: 0,
        speed: 0,
        prevSpeed: 0,
        maxSpeed: 5,
        acceleration: 0.3,
        friction: 0.95,
        turnSpeed: 0.05,
        vx: 0,
        vy: 0,
        followTarget: followTarget,
        color: color,
        lightColor: lightenColor(color)
    };
}

function lightenColor(color) {
    const r = parseInt(color.slice(1, 3), 16);
    const g = parseInt(color.slice(3, 5), 16);
    const b = parseInt(color.slice(5, 7), 16);
    
    const lighten = (c) => Math.min(255, Math.floor(c + (255 - c) * 0.2));
    
    const lr = lighten(r).toString(16).padStart(2, '0');
    const lg = lighten(g).toString(16).padStart(2, '0');
    const lb = lighten(b).toString(16).padStart(2, '0');
    
    return `#${lr}${lg}${lb}`;
}

function drawRegularCar(car, lightsEnabled = true) {
    ctx.save();
    ctx.translate(car.x, car.y);
    ctx.rotate(car.angle - Math.PI / 2);
    ctx.fillStyle = car.color;
    ctx.fillRect(-car.width / 2, -car.height / 2, car.width, car.height);
    ctx.fillStyle = car.lightColor;
    ctx.fillRect(-car.width / 2, -14, car.width, 28);

    if (lightsEnabled) {
        ctx.fillStyle = '#ffff00';
        ctx.fillRect(-14, car.height / 2 - 2, 8, 3);
        ctx.fillRect(6, car.height / 2 - 2, 8, 3);

        ctx.fillStyle = '#ff0000';
        ctx.fillRect(-car.width / 2 + 2, -car.height / 2, 6, 3);
        ctx.fillRect(car.width / 2 - 8, -car.height / 2, 6, 3);
    }
    ctx.restore();

    if (lightsEnabled) {
        ctx.globalCompositeOperation = 'lighter';

        const cos = Math.cos(car.angle);
        const sin = Math.sin(car.angle);
        const tailLeftPos = {
            x: car.x - cos * (car.height / 2 - 3) - sin * (car.width / 2 - 5),
            y: car.y - sin * (car.height / 2 - 3) + cos * (car.width / 2 - 5)
        };
        const tailRightPos = {
            x: car.x - cos * (car.height / 2 - 3) + sin * (car.width / 2 - 5),
            y: car.y - sin * (car.height / 2 - 3) - cos * (car.width / 2 - 5)
        };

        const isBraking = car.speed > 0.1 && car.prevSpeed - car.speed > 0.01;
        const isReversing = car.speed < -0.1;
        let brightness = isBraking ? 0.9 : 0.3;

        ctx.filter = 'blur(6px)';
        if (isReversing) {
            ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
            ctx.beginPath();
            ctx.arc(tailLeftPos.x, tailLeftPos.y, 8, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(tailRightPos.x, tailRightPos.y, 8, 0, Math.PI * 2);
            ctx.fill();
        } else {
            ctx.fillStyle = `rgba(255, 0, 0, ${brightness})`;
            ctx.beginPath();
            ctx.arc(tailLeftPos.x, tailLeftPos.y, 8, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(tailRightPos.x, tailRightPos.y, 8, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.filter = 'none';
    }

    ctx.globalCompositeOperation = 'source-over';

    ctx.save();
    ctx.translate(car.x, car.y);
    ctx.rotate(car.angle - Math.PI / 2);
    ctx.restore();
}

function updateRegularCar(car, otherCar) {
    const prevX = car.x;
    const prevY = car.y;
    
    car.prevSpeed = car.speed;

    if (keys['w']) car.speed = Math.min(car.speed + car.acceleration, car.maxSpeed);
    if (keys['s']) car.speed = Math.max(car.speed - car.acceleration, -car.maxSpeed / 2);

    car.speed *= car.friction;
    if (Math.abs(car.speed) < 0.01) car.speed = 0;

    if (keys['a']) car.angle -= car.turnSpeed * Math.abs(car.speed) / car.maxSpeed;
    if (keys['d']) car.angle += car.turnSpeed * Math.abs(car.speed) / car.maxSpeed;

    car.x += Math.cos(car.angle) * car.speed + car.vx;
    car.y += Math.sin(car.angle) * car.speed + car.vy;

    car.vx *= 0.9;
    car.vy *= 0.9;
    if (Math.abs(car.vx) < 0.01) car.vx = 0;
    if (Math.abs(car.vy) < 0.01) car.vy = 0;

    if (checkCollision(car, null)) {
        car.x = prevX;
        car.y = prevY;
        car.vx = 0;
        car.vy = 0;
        car.speed = 0;
    }

    if (otherCar && checkCollision(car, otherCar)) {
        const dx = car.x - otherCar.x;
        const dy = car.y - otherCar.y;
        const dist = Math.hypot(dx, dy);

        if (dist > 0) {
            const nx = dx / dist;
            const ny = dy / dist;

            const carVelX = Math.cos(car.angle) * car.speed + car.vx;
            const carVelY = Math.sin(car.angle) * car.speed + car.vy;
            const otherVelX = Math.cos(otherCar.angle) * otherCar.speed + otherCar.vx;
            const otherVelY = Math.sin(otherCar.angle) * otherCar.speed + otherCar.vy;

            const relVelX = carVelX - otherVelX;
            const relVelY = carVelY - otherVelY;
            const relVelDotNormal = relVelX * nx + relVelY * ny;

            if (relVelDotNormal < 0) {
                const restitution = 0.3;
                const impulse = -(1 + restitution) * relVelDotNormal / 2;

                car.vx += impulse * nx;
                car.vy += impulse * ny;

                const testVx = otherCar.vx - impulse * nx;
                const testVy = otherCar.vy - impulse * ny;
                const testX = otherCar.x + testVx;
                const testY = otherCar.y + testVy;
                const origX = otherCar.x;
                const origY = otherCar.y;
                otherCar.x = testX;
                otherCar.y = testY;

                if (checkCollision(otherCar, null)) {
                    otherCar.x = origX;
                    otherCar.y = origY;
                } else {
                    otherCar.x = origX;
                    otherCar.y = origY;
                    otherCar.vx = testVx;
                    otherCar.vy = testVy;
                    otherCar.angle += (Math.random() - 0.5) * 0.4;
                }

                car.speed *= 0.5;
                otherCar.speed *= 0.5;
            }

            const minDist = 90;
            const overlap = minDist - dist;
            if (overlap > 0) {
                const separationX = nx * overlap * 0.5;
                const separationY = ny * overlap * 0.5;
                car.x += separationX;
                car.y += separationY;
                const tempX = otherCar.x;
                const tempY = otherCar.y;
                otherCar.x -= separationX;
                otherCar.y -= separationY;
                if (checkCollision(otherCar, null)) {
                    otherCar.x = tempX;
                    otherCar.y = tempY;
                    otherCar.vx = 0;
                    otherCar.vy = 0;
                }
            }
        }
    }

    checkObjectCollision(car);
}

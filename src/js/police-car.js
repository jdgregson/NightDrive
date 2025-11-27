const car = {
    x: 0,
    y: 0,
    width: 30,
    height: 80,
    angle: 0,
    speed: 0,
    maxSpeed: 5,
    acceleration: 0.3,
    friction: 0.95,
    turnSpeed: 0.05
};

function drawPoliceCar() {
    ctx.save();
    ctx.translate(car.x, car.y);
    ctx.rotate(car.angle - Math.PI / 2);
    ctx.fillStyle = '#000000';
    ctx.fillRect(-car.width / 2, -car.height / 2, car.width, car.height);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(-car.width / 2, -14, car.width, 28);

    let redOn = false;
    let blueOn = false;

    if (lightsOn) {
        const frame = Math.floor(Date.now() / 50) % 12;
        if (frame < 2 || (frame >= 3 && frame < 5)) {
            redOn = true;
        } else if (frame >= 6 && frame < 8 || (frame >= 9 && frame < 11)) {
            blueOn = true;
        }
    }

    ctx.restore();

    ctx.globalCompositeOperation = 'lighter';

    const cos = Math.cos(car.angle);
    const sin = Math.sin(car.angle);
    const blueLightPos = {
        x: car.x + cos * (car.height / 2 - 33) - sin * (car.width / 4 - 1),
        y: car.y + sin * (car.height / 2 - 33) + cos * (car.width / 4 - 1)
    };
    const redLightPos = {
        x: car.x + cos * (car.height / 2 - 33) + sin * (car.width / 4 - 1),
        y: car.y + sin * (car.height / 2 - 33) - cos * (car.width / 4 - 1)
    };

    if (redOn) {
        const redCone = castLightCone(redLightPos, 0, Math.PI * 2, 100);
        ctx.filter = 'blur(15px)';
        ctx.fillStyle = 'rgba(255, 0, 0, 0.08)';
        ctx.beginPath();
        ctx.moveTo(redCone.points[0].x, redCone.points[0].y);
        for (let i = 1; i < redCone.points.length; i++) {
            ctx.lineTo(redCone.points[i].x, redCone.points[i].y);
        }
        ctx.closePath();
        ctx.fill();
        ctx.filter = 'none';
        ctx.fillStyle = 'rgba(255, 0, 0, 0.05)';
        ctx.beginPath();
        ctx.moveTo(redCone.points[0].x, redCone.points[0].y);
        for (let i = 1; i < redCone.points.length; i++) {
            ctx.lineTo(redCone.points[i].x, redCone.points[i].y);
        }
        ctx.closePath();
        ctx.fill();

    }

    if (blueOn) {
        const blueCone = castLightCone(blueLightPos, 0, Math.PI * 2, 100);
        ctx.filter = 'blur(15px)';
        ctx.fillStyle = 'rgba(0, 0, 255, 0.1)';
        ctx.beginPath();
        ctx.moveTo(blueCone.points[0].x, blueCone.points[0].y);
        for (let i = 1; i < blueCone.points.length; i++) {
            ctx.lineTo(blueCone.points[i].x, blueCone.points[i].y);
        }
        ctx.closePath();
        ctx.fill();
        ctx.filter = 'none';
        ctx.fillStyle = 'rgba(0, 0, 255, 0.1)';
        ctx.beginPath();
        ctx.moveTo(blueCone.points[0].x, blueCone.points[0].y);
        for (let i = 1; i < blueCone.points.length; i++) {
            ctx.lineTo(blueCone.points[i].x, blueCone.points[i].y);
        }
        ctx.closePath();
        ctx.fill();

    }

    ctx.globalCompositeOperation = 'source-over';

    ctx.save();
    ctx.translate(car.x, car.y);
    ctx.rotate(car.angle - Math.PI / 2);

    if (headlightsOn) {
        ctx.fillStyle = '#ffff00';
        ctx.fillRect(-14, car.height / 2 - 2, 8, 3);
        ctx.fillRect(6, car.height / 2 - 2, 8, 3);
    }

    ctx.fillStyle = '#ff0000';
    ctx.fillRect(-car.width / 2 + 2, -car.height / 2 + 2, 6, 3);
    ctx.fillRect(car.width / 2 - 8, -car.height / 2 + 2, 6, 3);
    ctx.restore();

    {
        ctx.globalCompositeOperation = 'lighter';

        const tailLeftPos = {
            x: car.x - cos * (car.height / 2 - 3) - sin * (car.width / 2 - 5),
            y: car.y - sin * (car.height / 2 - 3) + cos * (car.width / 2 - 5)
        };
        const tailRightPos = {
            x: car.x - cos * (car.height / 2 - 3) + sin * (car.width / 2 - 5),
            y: car.y - sin * (car.height / 2 - 3) - cos * (car.width / 2 - 5)
        };

        ctx.filter = 'blur(6px)';
        ctx.fillStyle = 'rgba(255, 0, 0, 0.3)';
        ctx.beginPath();
        ctx.arc(tailLeftPos.x, tailLeftPos.y, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(tailRightPos.x, tailRightPos.y, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.filter = 'none';
    }

    ctx.globalCompositeOperation = 'source-over';

    ctx.save();
    ctx.translate(car.x, car.y);
    ctx.rotate(car.angle - Math.PI / 2);
    ctx.restore();

    ctx.globalCompositeOperation = 'lighter';

    if (redOn) {
        const redGlowX = redLightPos.x;
        const redGlowY = redLightPos.y;
        ctx.filter = 'blur(12px)';
        ctx.fillStyle = 'rgba(255, 0, 0, 0.8)';
        ctx.beginPath();
        ctx.arc(redGlowX, redGlowY, 20, 0, Math.PI * 2);
        ctx.fill();
        ctx.filter = 'blur(4px)';
        ctx.fillStyle = 'rgba(255, 0, 0, 1)';
        ctx.beginPath();
        ctx.arc(redGlowX, redGlowY, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.filter = 'none';
    }

    if (blueOn) {
        const blueGlowX = blueLightPos.x;
        const blueGlowY = blueLightPos.y;
        ctx.filter = 'blur(12px)';
        ctx.fillStyle = 'rgba(0, 0, 255, 0.8)';
        ctx.beginPath();
        ctx.arc(blueGlowX, blueGlowY, 20, 0, Math.PI * 2);
        ctx.fill();
        ctx.filter = 'blur(4px)';
        ctx.fillStyle = 'rgba(0, 0, 255, 1)';
        ctx.beginPath();
        ctx.arc(blueGlowX, blueGlowY, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.filter = 'none';
    }

    ctx.globalCompositeOperation = 'source-over';

    ctx.save();
    ctx.translate(car.x, car.y);
    ctx.rotate(car.angle - Math.PI / 2);

    ctx.fillStyle = redOn ? '#ff0000' : '#330000';
    ctx.fillRect(0, car.height / 2 - 36, car.width / 2 - 2, 6);
    ctx.fillStyle = blueOn ? '#b2c2ffff' : '#000033';
    ctx.fillRect(-car.width / 2 + 2, car.height / 2 - 36, car.width / 2 - 2, 6);
    ctx.restore();
}

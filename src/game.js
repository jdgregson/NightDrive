const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const car = {
    x: 0,
    y: 0,
    width: 40,
    height: 60,
    angle: 0,
    speed: 0,
    maxSpeed: 5,
    acceleration: 0.3,
    friction: 0.95,
    turnSpeed: 0.05
};

const camera = {
    x: 0,
    y: 0
};

const obstacles = [
    {
        x: 200,
        y: -100,
        width: 100,
        height: 80
    },
    {
        x: -250,
        y: 50,
        width: 120,
        height: 60
    }
];

const keys = {};

window.addEventListener('keydown', e => keys[e.key.toLowerCase()] = true);
window.addEventListener('keyup', e => keys[e.key.toLowerCase()] = false);

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

function getAllEdges() {
    const edges = [];
    for (const obs of obstacles) {
        edges.push(
            [{ x: obs.x, y: obs.y }, { x: obs.x + obs.width, y: obs.y }],
            [{ x: obs.x + obs.width, y: obs.y }, { x: obs.x + obs.width, y: obs.y + obs.height }],
            [{ x: obs.x + obs.width, y: obs.y + obs.height }, { x: obs.x, y: obs.y + obs.height }],
            [{ x: obs.x, y: obs.y + obs.height }, { x: obs.x, y: obs.y }]
        );
    }
    return edges;
}

function raycast(origin, angle, maxDist = 1000) {
    const dx = Math.cos(angle);
    const dy = Math.sin(angle);
    let minDist = maxDist;
    let hitPoint = null;

    const edges = getAllEdges();

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

function castLightCone(origin, angle, spread, rays = 500) {
    const points = [origin];
    const hitPoints = [];

    for (let i = 0; i < rays; i++) {
        const a = angle - spread / 2 + (spread * i) / (rays - 1);
        const { dist, hit } = raycast(origin, a);
        points.push({
            x: origin.x + Math.cos(a) * dist,
            y: origin.y + Math.sin(a) * dist
        });
        if (hit) hitPoints.push(hit);
    }

    return { points, hitPoints };
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
    
    camera.x = car.x - canvas.width / 2;
    camera.y = car.y - canvas.height / 2;
}

function draw() {
    ctx.fillStyle = '#0a1a0a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.save();
    ctx.translate(-camera.x, -camera.y);

    ctx.globalCompositeOperation = 'lighter';

    const headlightOffset = 25;
    const leftLight = {
        x: car.x + Math.cos(car.angle) * headlightOffset - Math.sin(car.angle) * 10,
        y: car.y + Math.sin(car.angle) * headlightOffset + Math.cos(car.angle) * 10
    };
    const rightLight = {
        x: car.x + Math.cos(car.angle) * headlightOffset + Math.sin(car.angle) * 10,
        y: car.y + Math.sin(car.angle) * headlightOffset - Math.cos(car.angle) * 10
    };

    const lightAngle = car.angle;
    const spread = Math.PI / 3;

    const wideSpread = Math.PI / 1.5;
    const leftWide = castLightCone(leftLight, lightAngle, wideSpread);
    const rightWide = castLightCone(rightLight, lightAngle, wideSpread);

    ctx.filter = 'blur(8px)';
    ctx.fillStyle = 'rgba(255, 255, 200, 0.08)';
    ctx.beginPath();
    ctx.moveTo(leftWide.points[0].x, leftWide.points[0].y);
    for (let i = 1; i < leftWide.points.length; i++) {
        ctx.lineTo(leftWide.points[i].x, leftWide.points[i].y);
    }
    ctx.closePath();
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(rightWide.points[0].x, rightWide.points[0].y);
    for (let i = 1; i < rightWide.points.length; i++) {
        ctx.lineTo(rightWide.points[i].x, rightWide.points[i].y);
    }
    ctx.closePath();
    ctx.fill();

    const leftCone = castLightCone(leftLight, lightAngle, spread);
    const rightCone = castLightCone(rightLight, lightAngle, spread);

    ctx.fillStyle = 'rgba(255, 255, 200, 0.2)';
    ctx.beginPath();
    ctx.moveTo(leftCone.points[0].x, leftCone.points[0].y);
    for (let i = 1; i < leftCone.points.length; i++) {
        ctx.lineTo(leftCone.points[i].x, leftCone.points[i].y);
    }
    ctx.closePath();
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(rightCone.points[0].x, rightCone.points[0].y);
    for (let i = 1; i < rightCone.points.length; i++) {
        ctx.lineTo(rightCone.points[i].x, rightCone.points[i].y);
    }
    ctx.closePath();
    ctx.fill();
    
    ctx.filter = 'none';
    
    ctx.fillStyle = 'rgba(255, 255, 200, 0.15)';
    ctx.beginPath();
    ctx.moveTo(leftCone.points[0].x, leftCone.points[0].y);
    for (let i = 1; i < leftCone.points.length; i++) {
        ctx.lineTo(leftCone.points[i].x, leftCone.points[i].y);
    }
    ctx.closePath();
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(rightCone.points[0].x, rightCone.points[0].y);
    for (let i = 1; i < rightCone.points.length; i++) {
        ctx.lineTo(rightCone.points[i].x, rightCone.points[i].y);
    }
    ctx.closePath();
    ctx.fill();

    ctx.globalCompositeOperation = 'source-over';

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.lineWidth = 2;

    for (let i = 0; i < leftCone.hitPoints.length - 1; i++) {
        const p1 = leftCone.hitPoints[i];
        const p2 = leftCone.hitPoints[i + 1];
        const dist = Math.hypot(p2.x - p1.x, p2.y - p1.y);
        if (dist < 20) {
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.stroke();
        }
    }

    for (let i = 0; i < rightCone.hitPoints.length - 1; i++) {
        const p1 = rightCone.hitPoints[i];
        const p2 = rightCone.hitPoints[i + 1];
        const dist = Math.hypot(p2.x - p1.x, p2.y - p1.y);
        if (dist < 20) {
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.stroke();
        }
    }

    ctx.save();
    ctx.translate(car.x, car.y);
    ctx.rotate(car.angle - Math.PI / 2);
    ctx.fillStyle = '#cc0000';
    ctx.fillRect(-car.width / 2, -car.height / 2, car.width, car.height);
    ctx.fillStyle = '#ffff00';
    ctx.fillRect(-10, -car.height / 2 - 5, 8, 5);
    ctx.fillRect(2, -car.height / 2 - 5, 8, 5);
    ctx.restore();
    
    ctx.restore();
}

function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

gameLoop();

console.log('%c🚓 Night Drive - Police Car Simulator', 'font-size: 16px; font-weight: bold;');
console.log('%cDebug Info:', 'font-weight: bold;');
console.log('  • Enable profiler: profiler.enabled = true');
console.log('%cControls:', 'font-weight: bold;');
console.log('  • WASD to drive');
console.log('  • SHIFT + W to drive fast');
console.log('  • Toggle headlights: H key');
console.log('  • Toggle police lights: L key');
console.log('  • Toggle police sirens: K key');
console.log('  • Toggle camera mode: X key');
console.log('  • Spotlight: Hold mouse button');
console.log('  • Ambient light: +/- keys');
console.log('%cPerformance Tip:', 'font-weight: bold; color: orange;');
console.log('  If running slow, disable browser JIT restrictions (e.g., Edge Super Duper Secure Mode)');


const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

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

const streetLight = {
    x: 150,
    y: 150,
    poleWidth: 8,
    poleHeight: 60
};

const interactiveObjects = [
    { type: 'mailbox', x: -100, y: -200, hit: false },
    { type: 'trashcan', shape: 'round', color: '#4a4a4a', x: 300, y: 100, hit: false },
    { type: 'trashcan', shape: 'square', color: '#2a5a2a', x: -200, y: 200, hit: false },
    { type: 'trashcan', shape: 'round', color: '#5a2a2a', x: 100, y: -150, hit: false },
    { type: 'trashcan', shape: 'square', color: '#2a2a5a', x: -300, y: -50, hit: false }
];

const debris = [];

const keys = {};
let lightsOn = false;
let headlightsOn = true;
let lKeyPressed = false;
let hKeyPressed = false;
let spotlightActive = false;
let mouseWorldX = 0;
let mouseWorldY = 0;

window.addEventListener('keydown', e => {
    const key = e.key.toLowerCase();
    keys[key] = true;
    if (key === 'l' && !lKeyPressed) {
        lKeyPressed = true;
        lightsOn = !lightsOn;
    }
    if (key === 'h' && !hKeyPressed) {
        hKeyPressed = true;
        headlightsOn = !headlightsOn;
    }
});
window.addEventListener('keyup', e => {
    const key = e.key.toLowerCase();
    keys[key] = false;
    if (key === 'l') lKeyPressed = false;
    if (key === 'h') hKeyPressed = false;
});

canvas.addEventListener('mousedown', () => {
    spotlightActive = true;
});

canvas.addEventListener('mouseup', () => {
    spotlightActive = false;
});

canvas.addEventListener('mousemove', e => {
    mouseWorldX = e.clientX + camera.x;
    mouseWorldY = e.clientY + camera.y;
});

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
    for (const obj of interactiveObjects) {
        if (obj.hit) continue;
        const size = obj.type === 'mailbox' ? 20 : 18;
        const hsize = size / 2;
        edges.push(
            [{ x: obj.x - hsize, y: obj.y - hsize }, { x: obj.x + hsize, y: obj.y - hsize }],
            [{ x: obj.x + hsize, y: obj.y - hsize }, { x: obj.x + hsize, y: obj.y + hsize }],
            [{ x: obj.x + hsize, y: obj.y + hsize }, { x: obj.x - hsize, y: obj.y + hsize }],
            [{ x: obj.x - hsize, y: obj.y + hsize }, { x: obj.x - hsize, y: obj.y - hsize }]
        );
    }
    return edges;
}

function raycast(origin, angle, maxDist = 1000, isStreetLight = false) {
    if (isStreetLight) maxDist = 250;
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

function castLightCone(origin, angle, spread, rays = 500, isStreetLight = false) {
    const points = [origin];
    const hitPoints = [];

    for (let i = 0; i < rays; i++) {
        const a = angle - spread / 2 + (spread * i) / (rays - 1);
        const { dist, hit } = raycast(origin, a, 1000, isStreetLight);
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

function isPointLit(x, y) {
    const headlightOffset = 35;
    const leftLight = {
        x: car.x + Math.cos(car.angle) * headlightOffset - Math.sin(car.angle) * 10,
        y: car.y + Math.sin(car.angle) * headlightOffset + Math.cos(car.angle) * 10
    };
    const rightLight = {
        x: car.x + Math.cos(car.angle) * headlightOffset + Math.sin(car.angle) * 10,
        y: car.y + Math.sin(car.angle) * headlightOffset - Math.cos(car.angle) * 10
    };

    if (headlightsOn) {
        const distLeft = Math.hypot(x - leftLight.x, y - leftLight.y);
        const angleToLeft = Math.atan2(y - leftLight.y, x - leftLight.x);
        const diffLeft = Math.abs(angleToLeft - car.angle);
        if (distLeft < 400 && diffLeft < Math.PI / 2.5) return true;

        const distRight = Math.hypot(x - rightLight.x, y - rightLight.y);
        const angleToRight = Math.atan2(y - rightLight.y, x - rightLight.x);
        const diffRight = Math.abs(angleToRight - car.angle);
        if (distRight < 400 && diffRight < Math.PI / 2.5) return true;
    }

    const streetLightPos = { x: streetLight.x, y: streetLight.y - streetLight.poleHeight };
    const distStreet = Math.hypot(x - streetLightPos.x, y - streetLightPos.y);
    if (distStreet < 250) return true;

    if (spotlightActive) {
        const cos = Math.cos(car.angle);
        const sin = Math.sin(car.angle);
        const driverSidePos = {
            x: car.x + cos * 10 + sin * (car.width / 2 + 5),
            y: car.y + sin * 10 - cos * (car.width / 2 + 5)
        };
        const distSpot = Math.hypot(x - driverSidePos.x, y - driverSidePos.y);
        const angleToSpot = Math.atan2(y - driverSidePos.y, x - driverSidePos.x);
        const spotAngle = Math.atan2(mouseWorldY - driverSidePos.y, mouseWorldX - driverSidePos.x);
        const diffSpot = Math.abs(angleToSpot - spotAngle);
        if (distSpot < 600 && diffSpot < Math.PI / 18) return true;
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

function draw() {
    ctx.fillStyle = '#0a0a1a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.save();
    ctx.translate(-camera.x, -camera.y);

    ctx.globalCompositeOperation = 'lighter';

    const headlightOffset = 35;
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

    const streetLightPos = { x: streetLight.x, y: streetLight.y - streetLight.poleHeight };
    const streetLightCone = castLightCone(streetLightPos, 0, Math.PI * 2, 500, true);

    ctx.filter = 'blur(20px)';
    ctx.fillStyle = 'rgba(255, 240, 200, 0.06)';
    ctx.beginPath();
    ctx.moveTo(streetLightCone.points[0].x, streetLightCone.points[0].y);
    for (let i = 1; i < streetLightCone.points.length; i++) {
        ctx.lineTo(streetLightCone.points[i].x, streetLightCone.points[i].y);
    }
    ctx.closePath();
    ctx.fill();

    ctx.filter = 'blur(12px)';
    ctx.fillStyle = 'rgba(255, 240, 200, 0.05)';
    ctx.beginPath();
    ctx.moveTo(streetLightCone.points[0].x, streetLightCone.points[0].y);
    for (let i = 1; i < streetLightCone.points.length; i++) {
        ctx.lineTo(streetLightCone.points[i].x, streetLightCone.points[i].y);
    }
    ctx.closePath();
    ctx.fill();

    ctx.filter = 'none';
    ctx.fillStyle = 'rgba(255, 240, 200, 0.04)';
    ctx.beginPath();
    ctx.moveTo(streetLightCone.points[0].x, streetLightCone.points[0].y);
    for (let i = 1; i < streetLightCone.points.length; i++) {
        ctx.lineTo(streetLightCone.points[i].x, streetLightCone.points[i].y);
    }
    ctx.closePath();
    ctx.fill();

    const leftCone = castLightCone(leftLight, lightAngle, spread);
    const rightCone = castLightCone(rightLight, lightAngle, spread);

    if (headlightsOn) {
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
    }

    ctx.globalCompositeOperation = 'source-over';

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

    if (spotlightActive) {
        ctx.globalCompositeOperation = 'lighter';
        const driverSidePos = {
            x: car.x + cos * 10 + sin * (car.width / 2 + 5),
            y: car.y + sin * 10 - cos * (car.width / 2 + 5)
        };
        const spotAngle = Math.atan2(mouseWorldY - driverSidePos.y, mouseWorldX - driverSidePos.x);
        const spotCone = castLightCone(driverSidePos, spotAngle, Math.PI / 10, 300);

        ctx.filter = 'blur(15px)';
        ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
        ctx.beginPath();
        ctx.moveTo(spotCone.points[0].x, spotCone.points[0].y);
        for (let i = 1; i < spotCone.points.length; i++) {
            ctx.lineTo(spotCone.points[i].x, spotCone.points[i].y);
        }
        ctx.closePath();
        ctx.fill();

        ctx.filter = 'blur(8px)';
        ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.beginPath();
        ctx.moveTo(spotCone.points[0].x, spotCone.points[0].y);
        for (let i = 1; i < spotCone.points.length; i++) {
            ctx.lineTo(spotCone.points[i].x, spotCone.points[i].y);
        }
        ctx.closePath();
        ctx.fill();

        ctx.filter = 'none';
        ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
        ctx.beginPath();
        ctx.moveTo(spotCone.points[0].x, spotCone.points[0].y);
        for (let i = 1; i < spotCone.points.length; i++) {
            ctx.lineTo(spotCone.points[i].x, spotCone.points[i].y);
        }
        ctx.closePath();
        ctx.fill();

        ctx.filter = 'blur(8px)';
        ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        ctx.beginPath();
        ctx.arc(driverSidePos.x, driverSidePos.y, 6, 0, Math.PI * 2);
        ctx.fill();

        ctx.filter = 'none';
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.beginPath();
        ctx.arc(driverSidePos.x, driverSidePos.y, 3, 0, Math.PI * 2);
        ctx.fill();

        ctx.globalCompositeOperation = 'source-over';
    }

    for (const d of debris) {
        ctx.save();
        ctx.translate(d.x, d.y);
        ctx.rotate(d.rotation);
        ctx.fillStyle = '#000000';
        if (d.isContainer) {
            if (d.shape === 'round') {
                ctx.beginPath();
                ctx.arc(0, 0, d.size/2, 0, Math.PI * 2);
                ctx.fill();
            } else {
                ctx.fillRect(-d.size/2, -d.size/2, d.size, d.size);
            }
        } else {
            ctx.fillRect(-d.size/2, -d.size/2, d.size, d.size);
        }
        ctx.restore();
    }


    ctx.fillStyle = '#444444';
    ctx.fillRect(streetLight.x - streetLight.poleWidth / 2, streetLight.y - streetLight.poleHeight, streetLight.poleWidth, streetLight.poleHeight);
    ctx.fillStyle = '#666666';
    ctx.fillRect(streetLight.x - 12, streetLight.y - streetLight.poleHeight - 8, 24, 8);

    ctx.globalCompositeOperation = 'lighter';

    if (headlightsOn) {
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
    }

    if (spotlightActive) {
        const driverSidePos = {
            x: car.x + cos * 10 + sin * (car.width / 2 + 5),
            y: car.y + sin * 10 - cos * (car.width / 2 + 5)
        };
        const spotAngle = Math.atan2(mouseWorldY - driverSidePos.y, mouseWorldX - driverSidePos.x);
        const spotCone = castLightCone(driverSidePos, spotAngle, Math.PI / 10, 300);

        ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.lineWidth = 2;

        for (let i = 0; i < spotCone.hitPoints.length - 1; i++) {
            const p1 = spotCone.hitPoints[i];
            const p2 = spotCone.hitPoints[i + 1];
            const dist = Math.hypot(p2.x - p1.x, p2.y - p1.y);
            if (dist < 20) {
                ctx.beginPath();
                ctx.moveTo(p1.x, p1.y);
                ctx.lineTo(p2.x, p2.y);
                ctx.stroke();
            }
        }
    }

    ctx.globalCompositeOperation = 'source-over';

    ctx.restore();
}

function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

gameLoop();

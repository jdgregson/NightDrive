const playerCar = createPoliceCar(0, 0);
const aiCar = createPoliceCar(-150, 0);
const aiCar2 = createPoliceCar(150, 150, playerCar);
const regularCar = createRegularCar(-400, -300, '#1a4d8f', aiCar2);
const car = playerCar;
const aiCars = [aiCar, aiCar2];

const audioContext = new (window.AudioContext || window.webkitAudioContext)();
let sirenBuffer = null;
fetch('audio/woop.mp3')
    .then(response => response.arrayBuffer())
    .then(arrayBuffer => audioContext.decodeAudioData(arrayBuffer))
    .then(buffer => { sirenBuffer = buffer; });

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
    
    // Lane assistance for AI
    const laneAssist = roadSystem.getLaneAssist(aiCar);
    if (laneAssist && Math.abs(aiCar.speed) > 0.5) {
        const targetAngle = laneAssist.roadAngle + laneAssist.correctionAngle;
        let angleDiff = targetAngle - aiCar.angle;
        while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
        while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
        aiCar.angle += angleDiff * 0.05 * laneAssist.strength;
    }

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

function updateSirens() {
    if (!sirenBuffer) return;
    const allPoliceCars = [playerCar, ...aiCars];
    for (const car of allPoliceCars) {
        if (car.followTarget && car.followTarget.sirenOn && !car.sirenOn) {
            car.sirenDelay = Math.random() * 300;
            setTimeout(() => { car.sirenOn = true; }, car.sirenDelay);
        }
        if (car.followTarget && !car.followTarget.sirenOn && car.sirenOn) {
            car.sirenOn = false;
        }
        if (car.sirenOn && !car.sirenSource) {
            const source = audioContext.createBufferSource();
            source.buffer = sirenBuffer;
            source.loop = true;
            const gainNode = audioContext.createGain();
            const isPlayer = car === playerCar;
            gainNode.gain.value = isPlayer ? 0.5 : 0.2;
            source.connect(gainNode).connect(audioContext.destination);
            const offset = Math.random() * sirenBuffer.duration;
            source.start(0, offset);
            car.sirenSource = source;
            car.sirenGain = gainNode;
        } else if (!car.sirenOn && car.sirenSource) {
            car.sirenSource.stop();
            car.sirenSource = null;
            car.sirenGain = null;
        }
        if (car.sirenGain && car !== playerCar) {
            const isMoving = Math.abs(car.speed) > 0.1;
            if (isMoving) {
                const dist = Math.hypot(car.x - playerCar.x, car.y - playerCar.y);
                const volume = Math.max(0, 0.2 * (1 - dist / 1000));
                car.sirenGain.gain.value = volume;
            } else {
                car.sirenGain.gain.value = 0;
            }
        }
    }
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

    updateSirens();

    profiler.start('update_debris');
    for (let i = debris.length - 1; i >= 0; i--) {
        const d = debris[i];
        d.x += d.vx;
        d.y += d.vy;
        d.vx *= 0.98;
        d.vy *= 0.98;
        d.rotation += d.rotSpeed;
        d.rotSpeed *= 0.99;
        if (d.lifetime !== undefined) {
            d.lifetime--;
            if (d.lifetime <= 0) {
                debris.splice(i, 1);
            }
        }
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

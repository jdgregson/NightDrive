let debugMode = false;
let slashKeyPressed = false;

window.addEventListener('keydown', e => {
    if (e.key === '/' && !slashKeyPressed) {
        slashKeyPressed = true;
        debugMode = !debugMode;
    }
});

window.addEventListener('keyup', e => {
    if (e.key === '/') {
        slashKeyPressed = false;
    }
});

function drawDebugBoundingBoxes() {
    if (!debugMode) return;

    ctx.strokeStyle = '#00ff00';
    ctx.lineWidth = 2;

    const corners = getCarCorners(playerCar, COLLISION_WIDTH_BUFFER, COLLISION_HEIGHT_BUFFER);
    ctx.beginPath();
    ctx.moveTo(corners[0].x, corners[0].y);
    for (let i = 1; i < corners.length; i++) {
        ctx.lineTo(corners[i].x, corners[i].y);
    }
    ctx.closePath();
    ctx.stroke();

    for (const ai of aiCars) {
        const aiCorners = getCarCorners(ai, COLLISION_WIDTH_BUFFER, COLLISION_HEIGHT_BUFFER);
        ctx.beginPath();
        ctx.moveTo(aiCorners[0].x, aiCorners[0].y);
        for (let i = 1; i < aiCorners.length; i++) {
            ctx.lineTo(aiCorners[i].x, aiCorners[i].y);
        }
        ctx.closePath();
        ctx.stroke();
    }

    const regularCorners = getCarCorners(regularCar, COLLISION_WIDTH_BUFFER, COLLISION_HEIGHT_BUFFER);
    ctx.beginPath();
    ctx.moveTo(regularCorners[0].x, regularCorners[0].y);
    for (let i = 1; i < regularCorners.length; i++) {
        ctx.lineTo(regularCorners[i].x, regularCorners[i].y);
    }
    ctx.closePath();
    ctx.stroke();

    for (const obs of obstacles) {
        ctx.strokeRect(obs.x, obs.y, obs.width, obs.height);
    }

    for (const obj of interactiveObjects) {
        if (obj.hit) continue;
        if (obj.type === 'mailbox') {
            ctx.strokeRect(obj.x - 4, obj.y - 10, 8, 12);
        } else {
            ctx.beginPath();
            ctx.arc(obj.x, obj.y, 9, 0, Math.PI * 2);
            ctx.stroke();
        }
    }

    ctx.strokeRect(
        streetLight.x - streetLight.poleWidth / 2,
        streetLight.y - streetLight.poleHeight,
        streetLight.poleWidth,
        streetLight.poleHeight
    );
}

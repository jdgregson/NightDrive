window.addEventListener('keydown', e => {
    const key = e.key.toLowerCase();
    keys[key] = true;
    if (key === 'm') showFullMap = true;
    if (key === 'x') rotateWorld = !rotateWorld;
    if (key === 'l' && !lKeyPressed) {
        lKeyPressed = true;
        lightsOn = !lightsOn;
    }
    if (key === 'h' && !hKeyPressed) {
        hKeyPressed = true;
        headlightsOn = !headlightsOn;
    }
    if (key === 'b' && !bKeyPressed) {
        bKeyPressed = true;
        brightsOn = !brightsOn;
    }
    if (key === 'k' && !kKeyPressed) {
        kKeyPressed = true;
        playerCar.sirenOn = !playerCar.sirenOn;
    }
    if (e.key === '+' || e.key === '=') {
        ambientLight = Math.min(ambientLight + 0.01, 0.3);
    }
    if (e.key === '-' || e.key === '_') {
        ambientLight = Math.max(ambientLight - 0.01, 0);
    }
});
window.addEventListener('keyup', e => {
    const key = e.key.toLowerCase();
    keys[key] = false;
    if (key === 'm') showFullMap = false;
    if (key === 'l') lKeyPressed = false;
    if (key === 'h') hKeyPressed = false;
    if (key === 'b') bKeyPressed = false;
    if (key === 'k') kKeyPressed = false;
});

canvas.addEventListener('mousedown', () => {
    spotlightActive = true;
});

canvas.addEventListener('mouseup', () => {
    spotlightActive = false;
});

canvas.addEventListener('mousemove', e => {
    if (rotateWorld) {
        const dx = e.clientX - canvas.width / 2;
        const dy = e.clientY - canvas.height / 2;
        const rotatedAngle = -cameraAngle - Math.PI / 2;
        const cos = Math.cos(-rotatedAngle);
        const sin = Math.sin(-rotatedAngle);
        mouseWorldX = car.x + (dx * cos - dy * sin);
        mouseWorldY = car.y + (dx * sin + dy * cos);
    } else {
        mouseWorldX = e.clientX + camera.x;
        mouseWorldY = e.clientY + camera.y;
    }
});

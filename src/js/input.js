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
    if (key === 'b' && !bKeyPressed) {
        bKeyPressed = true;
        brightsOn = !brightsOn;
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
    if (key === 'l') lKeyPressed = false;
    if (key === 'h') hKeyPressed = false;
    if (key === 'b') bKeyPressed = false;
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

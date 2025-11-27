function generateWorld() {
    const worldSize = 2000;
    const gridSize = 350;
    
    obstacles.length = 0;
    interactiveObjects.length = 0;
    
    for (let x = -worldSize; x <= worldSize; x += gridSize) {
        for (let y = -worldSize; y <= worldSize; y += gridSize) {
            if (Math.abs(x) < 300 && Math.abs(y) < 300) continue;
            const seed = (x * 73 + y * 31) % 100;
            if (seed < 35) {
                obstacles.push({
                    x: x + (seed * 3) % 80 - 40,
                    y: y + (seed * 7) % 80 - 40,
                    width: 80 + (seed % 40),
                    height: 60 + (seed % 30)
                });
            }
        }
    }
    
    const trashColors = ['#4a4a4a', '#2a5a2a', '#5a2a2a', '#2a2a5a'];
    const shapes = ['round', 'square'];
    
    for (let i = 0; i < 60; i++) {
        const angle = (i * 137.5) * Math.PI / 180;
        const radius = 200 + (i * 30);
        interactiveObjects.push({
            type: 'trashcan',
            shape: shapes[i % 2],
            color: trashColors[i % 4],
            x: Math.cos(angle) * radius,
            y: Math.sin(angle) * radius,
            hit: false
        });
    }
    
    for (let i = 0; i < 15; i++) {
        const angle = (i * 73) * Math.PI / 180;
        const radius = 300 + (i * 50);
        interactiveObjects.push({
            type: 'mailbox',
            x: Math.cos(angle) * radius,
            y: Math.sin(angle) * radius,
            hit: false
        });
    }
}

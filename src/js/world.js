const worldZones = [
    { name: 'downtown', x: 0, y: 0, width: 2000, height: 2000, color: '#2a2a3a' },
    { name: 'suburbs', x: 2000, y: 0, width: 3000, height: 2000, color: '#1a3a1a' },
    { name: 'beach', x: 0, y: 2000, width: 2000, height: 2000, color: '#d4a574' },
    { name: 'mountains', x: 2000, y: 2000, width: 3000, height: 2000, color: '#4a3a2a' },
    { name: 'highway', x: 5000, y: 0, width: 1000, height: 4000, color: '#1a1a1a' }
];

function getZoneAt(x, y) {
    for (const zone of worldZones) {
        if (x >= zone.x && x < zone.x + zone.width && y >= zone.y && y < zone.y + zone.height) {
            return zone;
        }
    }
    return { name: 'wilderness', color: '#0a2a0a' };
}

function generateWorld() {
    obstacles.length = 0;
    interactiveObjects.length = 0;
    
    generateDowntown();
    generateSuburbs();
    generateBeach();
    generateMountains();
}

function generateDowntown() {
    const zone = worldZones[0];
    const streetWidth = 80;
    const alleyWidth = 40;
    
    for (let bx = 0; bx < 4; bx++) {
        for (let by = 0; by < 4; by++) {
            const blockX = zone.x + bx * 500;
            const blockY = zone.y + by * 500;
            
            if (bx === 0 && by === 0) continue;
            
            const seed = (bx * 11 + by * 17) % 100;
            
            if (seed > 70) {
                obstacles.push(
                    { x: blockX, y: blockY, width: 180, height: 180 },
                    { x: blockX + 180 + alleyWidth, y: blockY, width: 180, height: 180 },
                    { x: blockX, y: blockY + 180 + alleyWidth, width: 180, height: 180 },
                    { x: blockX + 180 + alleyWidth, y: blockY + 180 + alleyWidth, width: 180, height: 180 }
                );
            } else {
                obstacles.push({
                    x: blockX,
                    y: blockY,
                    width: 400,
                    height: 400
                });
            }
        }
    }
}

function generateSuburbs() {
    const zone = worldZones[1];
    const lotSize = 150;
    
    for (let x = zone.x; x < zone.x + zone.width; x += lotSize) {
        for (let y = zone.y; y < zone.y + zone.height; y += lotSize) {
            const seed = (x * 41 + y * 67) % 100;
            if (seed < 60) {
                obstacles.push({
                    x: x + 30,
                    y: y + 30,
                    width: 60 + seed % 30,
                    height: 50 + seed % 20,
                    zone: 'suburbs'
                });
            }
            if (seed % 3 === 0) {
                interactiveObjects.push({
                    type: 'mailbox',
                    x: x + 20,
                    y: y + 10,
                    hit: false
                });
            }
        }
    }
}

function generateBeach() {
    const zone = worldZones[2];
    for (let i = 0; i < 30; i++) {
        const x = zone.x + (i % 10) * 200 + 50;
        const y = zone.y + Math.floor(i / 10) * 300 + 100;
        obstacles.push({
            x: x,
            y: y,
            width: 80,
            height: 60,
            zone: 'beach'
        });
    }
}

function generateMountains() {
    const zone = worldZones[3];
    for (let i = 0; i < 80; i++) {
        const angle = (i * 137.5) * Math.PI / 180;
        const radius = 200 + i * 30;
        const x = zone.x + zone.width / 2 + Math.cos(angle) * radius;
        const y = zone.y + zone.height / 2 + Math.sin(angle) * radius;
        const seed = (i * 13) % 100;
        obstacles.push({
            x: x,
            y: y,
            width: 40 + seed % 40,
            height: 40 + seed % 40,
            zone: 'mountains'
        });
    }
}

function drawMinimap() {
    const minimapSize = 150;
    const minimapX = canvas.width - minimapSize - 20;
    const minimapY = 20;
    const worldWidth = 6000;
    const worldHeight = 4000;
    const scale = minimapSize / Math.max(worldWidth, worldHeight);
    
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(minimapX, minimapY, minimapSize, minimapSize * (worldHeight / worldWidth));
    
    for (const zone of worldZones) {
        ctx.fillStyle = zone.color;
        ctx.fillRect(
            minimapX + zone.x * scale,
            minimapY + zone.y * scale,
            zone.width * scale,
            zone.height * scale
        );
    }
    
    ctx.fillStyle = '#ff0000';
    ctx.beginPath();
    ctx.arc(
        minimapX + playerCar.x * scale,
        minimapY + playerCar.y * scale,
        3, 0, Math.PI * 2
    );
    ctx.fill();
    
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.strokeRect(minimapX, minimapY, minimapSize, minimapSize * (worldHeight / worldWidth));
}

function drawTerrain() {
    ctx.fillStyle = '#0a0a1a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
}

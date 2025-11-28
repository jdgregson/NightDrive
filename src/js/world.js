const worldZones = [
    { name: 'downtown', x: 0, y: 0, width: 2000, height: 2000, color: '#2a2a3a' },
    { name: 'suburbs', x: 2000, y: 0, width: 3000, height: 2000, color: '#1a3a1a' },
    { name: 'beach', x: 0, y: 2000, width: 2000, height: 2000, color: '#d4a574' },
    { name: 'mountains', x: 2000, y: 2000, width: 3000, height: 2000, color: '#4a3a2a' },
    { name: 'highway', x: 5000, y: 0, width: 1000, height: 4000, color: '#1a1a1a' }
];

// Roads now managed by road-system.js

function getZoneAt(x, y) {
    for (const zone of worldZones) {
        if (x >= zone.x && x < zone.x + zone.width && y >= zone.y && y < zone.y + zone.height) {
            return zone;
        }
    }
    return { name: 'wilderness', color: '#0a2a0a' };
}

function isValidBuildingPlacement(x, y, width, height) {
    const margin = 20; // Safety margin beyond road edge
    const points = [
        { x: x - margin, y: y - margin },
        { x: x + width + margin, y: y - margin },
        { x: x - margin, y: y + height + margin },
        { x: x + width + margin, y: y + height + margin },
        { x: x + width / 2, y: y - margin },
        { x: x + width / 2, y: y + height + margin },
        { x: x - margin, y: y + height / 2 },
        { x: x + width + margin, y: y + height / 2 }
    ];
    
    for (const point of points) {
        if (roadSystem.isOnRoad(point.x, point.y).onRoad) {
            return false;
        }
    }
    return true;
}

function generateWorld() {
    obstacles.length = 0;
    interactiveObjects.length = 0;
    
    // Top-left block
    const buildings = [
        { x: -2100, y: -2100, width: 300, height: 250 },
        { x: -1700, y: -2100, width: 280, height: 200 },
        { x: -2100, y: -1750, width: 250, height: 280 },
        { x: -1700, y: -1750, width: 300, height: 300 },
        { x: -2100, y: -1350, width: 280, height: 200 },
        // Top-center block
        { x: -900, y: -2100, width: 320, height: 280 },
        { x: -500, y: -2100, width: 250, height: 250 },
        { x: 150, y: -2100, width: 300, height: 200 },
        { x: -900, y: -1700, width: 280, height: 300 },
        { x: 150, y: -1700, width: 250, height: 280 },
        { x: -500, y: -1350, width: 300, height: 250 },
        // Top-right block
        { x: 1350, y: -2100, width: 280, height: 300 },
        { x: 1750, y: -2100, width: 300, height: 250 },
        { x: 1350, y: -1700, width: 250, height: 280 },
        { x: 1750, y: -1700, width: 280, height: 300 },
        { x: 1350, y: -1350, width: 300, height: 200 },
        // Middle-left block
        { x: -2100, y: -900, width: 300, height: 280 },
        { x: -1700, y: -900, width: 280, height: 250 },
        { x: -2100, y: -500, width: 250, height: 300 },
        { x: -1700, y: 150, width: 300, height: 280 },
        { x: -2100, y: 550, width: 280, height: 250 },
        // Center block
        { x: -900, y: -900, width: 300, height: 300 },
        { x: -500, y: -900, width: 280, height: 250 },
        { x: 150, y: -900, width: 250, height: 280 },
        { x: -900, y: -450, width: 280, height: 300 },
        { x: 150, y: 200, width: 300, height: 280 },
        { x: -500, y: 550, width: 250, height: 250 },
        // Middle-right block
        { x: 1350, y: -900, width: 280, height: 300 },
        { x: 1750, y: -900, width: 300, height: 250 },
        { x: 1350, y: -500, width: 250, height: 280 },
        { x: 1750, y: 150, width: 280, height: 300 },
        { x: 1350, y: 550, width: 300, height: 250 },
        // Bottom-left block
        { x: -2100, y: 1350, width: 300, height: 280 },
        { x: -1700, y: 1350, width: 280, height: 250 },
        { x: -2100, y: 1750, width: 250, height: 300 },
        { x: -1700, y: 1750, width: 300, height: 280 },
        // Bottom-center block
        { x: -900, y: 1350, width: 280, height: 300 },
        { x: -500, y: 1350, width: 300, height: 250 },
        { x: 150, y: 1350, width: 250, height: 280 },
        { x: -900, y: 1750, width: 300, height: 300 },
        { x: 150, y: 1750, width: 280, height: 250 },
        // Bottom-right block
        { x: 1350, y: 1350, width: 300, height: 280 },
        { x: 1750, y: 1350, width: 280, height: 300 },
        { x: 1350, y: 1750, width: 250, height: 250 },
        { x: 1750, y: 1750, width: 300, height: 280 }
    ];
    
    // Validate and add buildings
    for (const building of buildings) {
        if (isValidBuildingPlacement(building.x, building.y, building.width, building.height)) {
            obstacles.push(building);
        }
    }
    
    // Mailboxes on sidewalks
    const mailboxes = [
        { x: -2000, y: -1350 }, { x: -800, y: -1350 }, { x: 400, y: -1350 }, { x: 1600, y: -1350 },
        { x: -2000, y: -150 }, { x: 1600, y: -150 },
        { x: -2000, y: 1050 }, { x: -800, y: 1050 }, { x: 400, y: 1050 }, { x: 1600, y: 1050 }
    ];
    
    for (const pos of mailboxes) {
        interactiveObjects.push({ type: 'mailbox', x: pos.x, y: pos.y, hit: false });
    }
}

function drawFullMap() {
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    
    for (const road of roadSystem.roads) {
        if (road.isCurved) {
            minX = Math.min(minX, road.centerX - road.radius);
            maxX = Math.max(maxX, road.centerX + road.radius);
            minY = Math.min(minY, road.centerY - road.radius);
            maxY = Math.max(maxY, road.centerY + road.radius);
        } else if (road.isPath) {
            for (const seg of road.segments) {
                minX = Math.min(minX, seg.p1.x, seg.p2.x);
                maxX = Math.max(maxX, seg.p1.x, seg.p2.x);
                minY = Math.min(minY, seg.p1.y, seg.p2.y);
                maxY = Math.max(maxY, seg.p1.y, seg.p2.y);
            }
        } else {
            minX = Math.min(minX, road.x1, road.x2);
            maxX = Math.max(maxX, road.x1, road.x2);
            minY = Math.min(minY, road.y1, road.y2);
            maxY = Math.max(maxY, road.y1, road.y2);
        }
    }
    for (const building of obstacles) {
        minX = Math.min(minX, building.x);
        maxX = Math.max(maxX, building.x + building.width);
        minY = Math.min(minY, building.y);
        maxY = Math.max(maxY, building.y + building.height);
    }
    
    const worldWidth = maxX - minX;
    const worldHeight = maxY - minY;
    const padding = 50;
    const scale = Math.min(
        (canvas.width - padding * 2) / worldWidth,
        (canvas.height - padding * 2) / worldHeight
    );
    const offsetX = (canvas.width - worldWidth * scale) / 2 - minX * scale;
    const offsetY = (canvas.height - worldHeight * scale) / 2 - minY * scale;
    
    ctx.fillStyle = 'rgba(10, 15, 20, 0.95)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.fillStyle = '#666';
    for (const building of obstacles) {
        ctx.fillRect(
            offsetX + building.x * scale,
            offsetY + building.y * scale,
            building.width * scale,
            building.height * scale
        );
    }
    
    ctx.lineWidth = 2;
    for (const road of roadSystem.roads) {
        if (road.isCurved) {
            ctx.strokeStyle = road.roadType.color;
            ctx.lineWidth = road.width * scale;
            ctx.beginPath();
            ctx.arc(offsetX + road.centerX * scale, offsetY + road.centerY * scale, road.radius * scale, road.startAngle, road.endAngle);
            ctx.stroke();
        } else if (road.isPath) {
            ctx.strokeStyle = '#555';
            ctx.lineWidth = 2;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            ctx.beginPath();
            ctx.moveTo(offsetX + road.segments[0].p1.x * scale, offsetY + road.segments[0].p1.y * scale);
            for (const seg of road.segments) {
                ctx.bezierCurveTo(
                    offsetX + seg.cp1.x * scale, offsetY + seg.cp1.y * scale,
                    offsetX + seg.cp2.x * scale, offsetY + seg.cp2.y * scale,
                    offsetX + seg.p2.x * scale, offsetY + seg.p2.y * scale
                );
            }
            ctx.stroke();
        } else {
            ctx.strokeStyle = '#555';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(offsetX + road.x1 * scale, offsetY + road.y1 * scale);
            ctx.lineTo(offsetX + road.x2 * scale, offsetY + road.y2 * scale);
            ctx.stroke();
        }
    }
    
    ctx.fillStyle = '#ff0000';
    ctx.beginPath();
    ctx.arc(
        offsetX + playerCar.x * scale,
        offsetY + playerCar.y * scale,
        5, 0, Math.PI * 2
    );
    ctx.fill();
    
    ctx.fillStyle = '#ffffff';
    ctx.font = '20px sans-serif';
    ctx.fillText('Hold M to view map', canvas.width / 2 - 90, 30);
}

function drawMinimap() {
    const minimapSize = 150;
    const minimapX = canvas.width - minimapSize - 20;
    const minimapY = 20;
    const viewRadius = 1500;
    const scale = minimapSize / (viewRadius * 2);
    
    ctx.save();
    
    // Solid background
    ctx.fillStyle = 'rgba(20, 25, 30, 0.9)';
    ctx.fillRect(minimapX, minimapY, minimapSize, minimapSize);
    
    // Clip to minimap bounds
    ctx.beginPath();
    ctx.rect(minimapX, minimapY, minimapSize, minimapSize);
    ctx.clip();
    
    // Draw buildings
    ctx.fillStyle = '#666';
    for (const building of obstacles) {
        ctx.fillRect(
            minimapX + (building.x - playerCar.x + viewRadius) * scale,
            minimapY + (building.y - playerCar.y + viewRadius) * scale,
            building.width * scale,
            building.height * scale
        );
    }
    
    // Draw roads centered on player
    for (const road of roadSystem.roads) {
        if (road.isCurved) {
            ctx.strokeStyle = road.roadType.color;
            ctx.lineWidth = road.width * scale;
            ctx.beginPath();
            ctx.arc(
                minimapX + (road.centerX - playerCar.x + viewRadius) * scale,
                minimapY + (road.centerY - playerCar.y + viewRadius) * scale,
                road.radius * scale,
                road.startAngle,
                road.endAngle
            );
            ctx.stroke();
        } else if (road.isPath) {
            ctx.strokeStyle = '#555';
            ctx.lineWidth = 2;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            ctx.beginPath();
            ctx.moveTo(
                minimapX + (road.segments[0].p1.x - playerCar.x + viewRadius) * scale,
                minimapY + (road.segments[0].p1.y - playerCar.y + viewRadius) * scale
            );
            for (const seg of road.segments) {
                ctx.bezierCurveTo(
                    minimapX + (seg.cp1.x - playerCar.x + viewRadius) * scale,
                    minimapY + (seg.cp1.y - playerCar.y + viewRadius) * scale,
                    minimapX + (seg.cp2.x - playerCar.x + viewRadius) * scale,
                    minimapY + (seg.cp2.y - playerCar.y + viewRadius) * scale,
                    minimapX + (seg.p2.x - playerCar.x + viewRadius) * scale,
                    minimapY + (seg.p2.y - playerCar.y + viewRadius) * scale
                );
            }
            ctx.stroke();
        } else {
            ctx.strokeStyle = '#555';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(
                minimapX + (road.x1 - playerCar.x + viewRadius) * scale,
                minimapY + (road.y1 - playerCar.y + viewRadius) * scale
            );
            ctx.lineTo(
                minimapX + (road.x2 - playerCar.x + viewRadius) * scale,
                minimapY + (road.y2 - playerCar.y + viewRadius) * scale
            );
            ctx.stroke();
        }
    }
    
    // Player at center
    ctx.fillStyle = '#ff0000';
    ctx.beginPath();
    ctx.arc(
        minimapX + minimapSize / 2,
        minimapY + minimapSize / 2,
        4, 0, Math.PI * 2
    );
    ctx.fill();
    
    ctx.restore();
    
    // Border (drawn after restore to avoid clipping)
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.strokeRect(minimapX, minimapY, minimapSize, minimapSize);
}

function drawTerrain() {
    ctx.fillStyle = '#0a0a1a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function drawRoads() {
    roadSystem.draw(ctx);
}

function drawRoadMarkings() {
    roadSystem.drawMarkings(ctx);
}

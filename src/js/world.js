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

function generateBuildingsInBlock(minX, maxX, minY, maxY, seed) {
    const buildings = [];
    const rng = (i) => Math.abs(Math.sin(seed * 12.9898 + i * 78.233) * 43758.5453) % 1;
    const margin = 150;
    const spacing = 30;
    const minSize = 180;
    const availW = maxX - minX - margin * 2;
    const availH = maxY - minY - margin * 2;
    
    for (let i = 0; i < 12; i++) {
        const w = minSize + rng(i * 4) * 150;
        const h = minSize + rng(i * 4 + 1) * 150;
        const edge = Math.floor(rng(i * 4 + 2) * 4);
        let x, y;
        
        if (edge === 0) {
            x = minX + margin;
            y = minY + margin + rng(i * 4 + 3) * (availH - h);
        } else if (edge === 1) {
            x = maxX - margin - w;
            y = minY + margin + rng(i * 4 + 3) * (availH - h);
        } else if (edge === 2) {
            x = minX + margin + rng(i * 4 + 3) * (availW - w);
            y = minY + margin;
        } else {
            x = minX + margin + rng(i * 4 + 3) * (availW - w);
            y = maxY - margin - h;
        }
        
        if (isValidBuildingPlacement(x, y, w, h)) {
            let overlaps = false;
            for (const b of buildings) {
                if (!(x + w + spacing < b.x || x > b.x + b.width + spacing || 
                      y + h + spacing < b.y || y > b.y + b.height + spacing)) {
                    overlaps = true;
                    break;
                }
            }
            if (!overlaps) buildings.push({ x, y, width: w, height: h });
        }
    }
    return buildings;
}

function generateWorld() {
    obstacles.length = 0;
    interactiveObjects.length = 0;
    
    for (let bx = -1800; bx <= 9000; bx += 1200) {
        for (let by = -1800; by <= 9000; by += 1200) {
            obstacles.push(...generateBuildingsInBlock(
                bx - 600, bx + 600, by - 600, by + 600, bx * 0.1 + by * 0.01
            ));
        }
    }
    
    // Mailboxes and trash cans on sidewalks
    for (let rx = -1200; rx <= 9600; rx += 1200) {
        for (let ry = -1200; ry <= 9600; ry += 1200) {
            const offsets = [-650, -450, -250, 250, 450, 650];
            for (const ox of offsets) {
                for (const oy of offsets) {
                    const seed = (rx + ox) * 0.1 + (ry + oy) * 0.01;
                    const rng = Math.abs(Math.sin(seed * 12.9898) * 43758.5453) % 1;
                    if (rng > 0.3) {
                        const type = rng > 0.65 ? 'mailbox' : 'trashcan';
                        interactiveObjects.push({ type, x: rx + ox, y: ry + oy, hit: false });
                    }
                }
            }
        }
    }
}

function drawFullMap() {
    let minX, maxX, minY, maxY;
    
    if (editorMode) {
        minX = -15000;
        maxX = 25000;
        minY = -15000;
        maxY = 25000;
    } else {
        minX = Infinity;
        maxX = -Infinity;
        minY = Infinity;
        maxY = -Infinity;
        
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
    
    ctx.strokeStyle = 'rgb(0, 100, 255)';
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    for (const water of waterPaths) {
        ctx.lineWidth = water.width * scale;
        ctx.beginPath();
        ctx.moveTo(offsetX + water.path[0].x * scale, offsetY + water.path[0].y * scale);
        for (let i = 1; i < water.path.length; i++) {
            ctx.lineTo(offsetX + water.path[i].x * scale, offsetY + water.path[i].y * scale);
        }
        ctx.stroke();
    }
    
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
    
    // Draw water
    ctx.strokeStyle = 'rgb(0, 100, 255)';
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    for (const water of waterPaths) {
        ctx.lineWidth = water.width * scale;
        ctx.beginPath();
        ctx.moveTo(
            minimapX + (water.path[0].x - playerCar.x + viewRadius) * scale,
            minimapY + (water.path[0].y - playerCar.y + viewRadius) * scale
        );
        for (let i = 1; i < water.path.length; i++) {
            ctx.lineTo(
                minimapX + (water.path[i].x - playerCar.x + viewRadius) * scale,
                minimapY + (water.path[i].y - playerCar.y + viewRadius) * scale
            );
        }
        ctx.stroke();
    }
    
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

const waterPaths = [];

function addWaterPath(path, width) {
    waterPaths.push({path, width});
}

function drawWater(ctx) {
    ctx.fillStyle = 'rgb(0, 100, 255)';
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    for (const water of waterPaths) {
        ctx.lineWidth = water.width;
        ctx.strokeStyle = 'rgb(0, 100, 255)';
        ctx.beginPath();
        ctx.moveTo(water.path[0].x, water.path[0].y);
        for (let i = 1; i < water.path.length; i++) {
            ctx.lineTo(water.path[i].x, water.path[i].y);
        }
        ctx.stroke();
    }
}

addWaterPath([{"x":-21472,"y":-10242},{"x":-21140,"y":-10480},{"x":-20855,"y":-10717},{"x":-20570,"y":-10907},{"x":-20285,"y":-11049},{"x":-20000,"y":-11239},{"x":-19715,"y":-11382},{"x":-19430,"y":-11572},{"x":-19145,"y":-11714},{"x":-18765,"y":-11857},{"x":-18433,"y":-11952},{"x":-18006,"y":-12094},{"x":-17483,"y":-12236},{"x":-17104,"y":-12331},{"x":-16629,"y":-12426},{"x":-16154,"y":-12474},{"x":-15632,"y":-12521},{"x":-15157,"y":-12521},{"x":-14682,"y":-12521},{"x":-14349,"y":-12426},{"x":-14017,"y":-12331},{"x":-13732,"y":-12189},{"x":-13447,"y":-12047},{"x":-13162,"y":-11809},{"x":-12925,"y":-11572},{"x":-12688,"y":-11287},{"x":-12498,"y":-10954},{"x":-12308,"y":-10575},{"x":-12165,"y":-10100},{"x":-12118,"y":-9625},{"x":-12070,"y":-9103},{"x":-12070,"y":-8628},{"x":-12118,"y":-8105},{"x":-12165,"y":-7678},{"x":-12308,"y":-7346},{"x":-12450,"y":-7061},{"x":-12640,"y":-6728},{"x":-12830,"y":-6396},{"x":-13020,"y":-6016},{"x":-13257,"y":-5779},{"x":-13495,"y":-5589},{"x":-13780,"y":-5351},{"x":-14065,"y":-5114},{"x":-14349,"y":-4924},{"x":-14634,"y":-4782},{"x":-14967,"y":-4592},{"x":-15299,"y":-4449},{"x":-15584,"y":-4307},{"x":-15869,"y":-4117},{"x":-16154,"y":-3974},{"x":-16391,"y":-3737},{"x":-16581,"y":-3452},{"x":-16676,"y":-3120},{"x":-16724,"y":-2645},{"x":-16724,"y":-2217},{"x":-16629,"y":-1838},{"x":-16486,"y":-1458},{"x":-16344,"y":-1173},{"x":-16154,"y":-888},{"x":-15964,"y":-651},{"x":-15726,"y":-413},{"x":-15442,"y":-176},{"x":-15157,"y":62},{"x":-14777,"y":299},{"x":-14397,"y":489},{"x":-14065,"y":679},{"x":-13685,"y":821},{"x":-13257,"y":916},{"x":-12877,"y":964},{"x":-12450,"y":1059},{"x":-11880,"y":1154},{"x":-11358,"y":1154},{"x":-10836,"y":1249},{"x":-10313,"y":1296},{"x":-9934,"y":1391},{"x":-9554,"y":1486},{"x":-9079,"y":1581},{"x":-8699,"y":1724},{"x":-8319,"y":1866},{"x":-7987,"y":2056},{"x":-7702,"y":2246},{"x":-7464,"y":2483},{"x":-7227,"y":2768},{"x":-7037,"y":3053},{"x":-6895,"y":3338},{"x":-6752,"y":3623},{"x":-6610,"y":3955},{"x":-6515,"y":4288},{"x":-6420,"y":4715},{"x":-6325,"y":5095},{"x":-6325,"y":5522},{"x":-6325,"y":5997},{"x":-6325,"y":6425},{"x":-6372,"y":6804},{"x":-6515,"y":7137},{"x":-6657,"y":7422},{"x":-6895,"y":7707},{"x":-7085,"y":7944},{"x":-7369,"y":8134},{"x":-7654,"y":8419},{"x":-7939,"y":8656},{"x":-8272,"y":8846},{"x":-8651,"y":9036},{"x":-9031,"y":9179},{"x":-9459,"y":9321},{"x":-9886,"y":9463},{"x":-10361,"y":9558},{"x":-10741,"y":9606},{"x":-11168,"y":9653},{"x":-11738,"y":9653},{"x":-12260,"y":9653},{"x":-12735,"y":9653},{"x":-13257,"y":9606},{"x":-13732,"y":9606},{"x":-14207,"y":9606},{"x":-14587,"y":9653},{"x":-15014,"y":9748},{"x":-15347,"y":9891},{"x":-15679,"y":10033},{"x":-15964,"y":10176},{"x":-16296,"y":10366},{"x":-16534,"y":10651},{"x":-16724,"y":10935},{"x":-17009,"y":11220},{"x":-17151,"y":11505},{"x":-17293,"y":11838},{"x":-17436,"y":12265},{"x":-17531,"y":12692},{"x":-17626,"y":13262},{"x":-17673,"y":13832},{"x":-17721,"y":14212},{"x":-17768,"y":14734},{"x":-17768,"y":15304},{"x":-17768,"y":15826},{"x":-17721,"y":16301},{"x":-17578,"y":16681},{"x":-17436,"y":16966},{"x":-17198,"y":17298},{"x":-16961,"y":17583},{"x":-16724,"y":17868},{"x":-16391,"y":18105},{"x":-16059,"y":18390},{"x":-15774,"y":18628},{"x":-15394,"y":18818},{"x":-15062,"y":18960},{"x":-14777,"y":19103},{"x":-14349,"y":19245},{"x":-13922,"y":19387},{"x":-13495,"y":19530},{"x":-13020,"y":19577},{"x":-12498,"y":19577},{"x":-11928,"y":19577},{"x":-11406,"y":19577},{"x":-10978,"y":19530},{"x":-10646,"y":19435},{"x":-10218,"y":19340},{"x":-9744,"y":19198},{"x":-9364,"y":19055},{"x":-9079,"y":18913},{"x":-8794,"y":18723},{"x":-8557,"y":18533},{"x":-8272,"y":18295},{"x":-8034,"y":18010},{"x":-7844,"y":17726},{"x":-7702,"y":17441},{"x":-7559,"y":17108},{"x":-7322,"y":16681},{"x":-7179,"y":16301},{"x":-7037,"y":16016},{"x":-6847,"y":15636},{"x":-6657,"y":15209},{"x":-6420,"y":14782},{"x":-6230,"y":14402},{"x":-5992,"y":14069},{"x":-5755,"y":13784},{"x":-5518,"y":13452},{"x":-5138,"y":13025},{"x":-4805,"y":12787},{"x":-4520,"y":12550},{"x":-4236,"y":12360},{"x":-3951,"y":12217},{"x":-3571,"y":11980},{"x":-3238,"y":11838},{"x":-2858,"y":11743},{"x":-2384,"y":11648},{"x":-1909,"y":11648},{"x":-1481,"y":11600},{"x":-1054,"y":11600},{"x":-627,"y":11600},{"x":-104,"y":11600},{"x":323,"y":11695},{"x":655,"y":11790},{"x":1035,"y":11933},{"x":1415,"y":12075},{"x":1795,"y":12217},{"x":2080,"y":12360},{"x":2412,"y":12550},{"x":2745,"y":12787},{"x":3029,"y":13072},{"x":3219,"y":13357},{"x":3362,"y":13642},{"x":3504,"y":14022},{"x":3647,"y":14402},{"x":3742,"y":14782},{"x":3789,"y":15256},{"x":3837,"y":15779},{"x":3837,"y":16301},{"x":3837,"y":16918},{"x":3837,"y":17441},{"x":3742,"y":17915},{"x":3599,"y":18343},{"x":3504,"y":18675},{"x":3362,"y":19055},{"x":3219,"y":19340},{"x":3029,"y":19672},{"x":2840,"y":20005},{"x":2650,"y":20290},{"x":2365,"y":20622},{"x":2127,"y":20907},{"x":1890,"y":21097},{"x":1605,"y":21334},{"x":1320,"y":21572},{"x":940,"y":21809},{"x":608,"y":21999},{"x":228,"y":22142},{"x":-152,"y":22236},{"x":-579,"y":22331},{"x":-1007,"y":22426},{"x":-1434,"y":22521},{"x":-1814,"y":22711},{"x":-2241,"y":22854},{"x":-2526,"y":22996},{"x":-2858,"y":23186},{"x":-3238,"y":23471},{"x":-3428,"y":23708},{"x":-3571,"y":23993},{"x":-3713,"y":24278},{"x":-3808,"y":24658},{"x":-3856,"y":25038},{"x":-3856,"y":25513},{"x":-3856,"y":25940},{"x":-3761,"y":26273},{"x":-3618,"y":26652},{"x":-3523,"y":26985}], 800);

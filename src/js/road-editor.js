// Road Editor - Click on full map to draw road paths
let editorMode = false;
let currentPath = [];
let savedPaths = [];
let editorMergePoint = null;
let brushMode = 'road'; // 'road', 'water', 'forest'
let brushSize = 800;
let waterStrokes = [];
let forestStrokes = [];
let currentStrokes = [];
let isPainting = false;

const tJunctions = [
    {x:9600,y:-1200},{x:9600,y:0},{x:9600,y:1200},{x:9600,y:2400},{x:9600,y:3600},{x:9600,y:4800},
    {x:9600,y:6000},{x:9600,y:7200},{x:9600,y:8400},
    {x:-1200,y:-2400},{x:0,y:-2400},{x:1200,y:-2400},{x:2400,y:-2400},
    {x:3600,y:-2400},{x:4800,y:-2400},{x:6000,y:-2400},{x:7200,y:-2400},{x:8400,y:-2400},
    {x:-2400,y:-1200},{x:-2400,y:0},{x:-2400,y:1200},{x:-2400,y:2400},{x:-2400,y:3600},
    {x:-2400,y:4800},{x:-2400,y:6000},{x:-2400,y:7200},{x:-2400,y:8400},
    {x:0,y:9600},{x:1200,y:9600},{x:2400,y:9600},{x:3600,y:9600},
    {x:4800,y:9600},{x:6000,y:9600},{x:7200,y:9600},{x:8400,y:9600}
];

window.addEventListener('keydown', e => {
    if (e.key === 'e' && e.ctrlKey) {
        e.preventDefault();
        editorMode = !editorMode;
        showFullMap = editorMode;
        console.log(`Road Editor Mode: ${editorMode ? 'ON' : 'OFF'}`);
        if (editorMode) {
            console.log('Click on map to draw road points. Press C to complete path. Press X to clear. Press P to print all paths.');
            console.log('Press 1: Road mode, 2: Water mode, 3: Forest mode');
        }
    }
    
    if (editorMode) {
        if (e.key.toLowerCase() === 'z' && e.ctrlKey) {
            e.preventDefault();
            if (currentPath.length > 0) {
                const removed = currentPath.pop();
                if (currentPath.length === 0) editorMergePoint = null;
                console.log(`Undid point: {x:${removed.x}, y:${removed.y}}`);
            }
            return;
        }
        if (e.key.toLowerCase() === 'c') {
            if (currentPath.length > 1) {
                const pathData = {
                    points: [...currentPath],
                    startJunction: editorMergePoint,
                    endJunction: null
                };
                
                const lastPt = currentPath[currentPath.length - 1];
                for (const tj of tJunctions) {
                    if (lastPt.x === tj.x && lastPt.y === tj.y) {
                        pathData.endJunction = tj;
                        break;
                    }
                }
                
                savedPaths.push(pathData);
                console.log('Path saved:', JSON.stringify(currentPath));
                if (pathData.startJunction) console.log(`  Start: T-junction (${pathData.startJunction.x}, ${pathData.startJunction.y})`);
                if (pathData.endJunction) console.log(`  End: T-junction (${pathData.endJunction.x}, ${pathData.endJunction.y})`);
                currentPath = [];
                editorMergePoint = null;
            }
        }
        if (e.key.toLowerCase() === 'x') {
            currentPath = [];
            editorMergePoint = null;
            console.log('Current path cleared');
        }
        if (e.key.toLowerCase() === 'p') {
            console.log('=== ALL SAVED PATHS ===');
            savedPaths.forEach((pathData, i) => {
                console.log(`\n// Path ${i + 1}`);
                if (pathData.startJunction) {
                    const tj = pathData.startJunction;
                    const secondPt = pathData.points[1] || pathData.points[0];
                    const dx = Math.abs(secondPt.x - tj.x);
                    const dy = Math.abs(secondPt.y - tj.y);
                    const isVertical = dy > dx;
                    
                    let mergeEnd, offset;
                    if (isVertical) {
                        offset = tj.y === -2400 ? -2400 : 2400;
                        mergeEnd = {x: tj.x, y: tj.y + offset};
                    } else {
                        offset = tj.x === -2400 ? -2400 : 2400;
                        mergeEnd = {x: tj.x + offset, y: tj.y};
                    }
                    console.log(`roadSystem.addMerge(${tj.x}, ${tj.y}, ${mergeEnd.x}, ${mergeEnd.y}, 'FOUR_LANE', 'TWO_LANE');`);
                    
                    let firstValidIdx = 1;
                    for (let i = 1; i < pathData.points.length; i++) {
                        const pt = pathData.points[i];
                        const pastMerge = isVertical ? 
                            (offset > 0 ? pt.y > mergeEnd.y : pt.y < mergeEnd.y) :
                            (offset > 0 ? pt.x > mergeEnd.x : pt.x < mergeEnd.x);
                        if (pastMerge) {
                            firstValidIdx = i;
                            break;
                        }
                    }
                    
                    const snappedPath = [{x: mergeEnd.x, y: mergeEnd.y}, ...pathData.points.slice(firstValidIdx)];
                    console.log(`roadSystem.addPath(${JSON.stringify(snappedPath)}, 'TWO_LANE');`);
                } else {
                    console.log(`roadSystem.addPath(${JSON.stringify(pathData.points)}, 'TWO_LANE');`);
                }
            });
            console.log('\n======================');
        }
        if (e.key.toLowerCase() === 's') {
            savedPaths = [];
            console.log('All saved paths cleared');
        }
        if (e.key === '1') {
            brushMode = 'road';
            console.log('Brush mode: ROAD');
        }
        if (e.key === '2') {
            brushMode = 'water';
            console.log('Brush mode: WATER');
        }
        if (e.key === '3') {
            brushMode = 'forest';
            console.log('Brush mode: FOREST');
        }
        if (e.key.toLowerCase() === 'f') {
            if (currentStrokes.length > 0) {
                const simplified = [];
                for (let i = 0; i < currentStrokes.length; i += 3) {
                    simplified.push({x: Math.round(currentStrokes[i].x), y: Math.round(currentStrokes[i].y)});
                }
                console.log(`${brushMode === 'water' ? 'Water' : 'Forest'} path:`);
                console.log(`  width: ${brushSize}`);
                console.log(`  path: ${JSON.stringify(simplified)}`);
                currentStrokes = [];
            }
        }
    }
});

function screenToWorld(screenX, screenY) {
    let minX = -15000, maxX = 25000, minY = -15000, maxY = 25000;
    const worldWidth = maxX - minX;
    const worldHeight = maxY - minY;
    const scale = Math.min(canvas.width / worldWidth, canvas.height / worldHeight) * 0.9;
    const offsetX = (canvas.width - worldWidth * scale) / 2;
    const offsetY = (canvas.height - worldHeight * scale) / 2;
    return {
        x: Math.round((screenX - offsetX) / scale + minX),
        y: Math.round((screenY - offsetY) / scale + minY)
    };
}

function handleEditorClick(e) {
    if (!editorMode) return;
    
    const rect = canvas.getBoundingClientRect();
    const world = screenToWorld(e.clientX - rect.left, e.clientY - rect.top);
    
    if (brushMode === 'water' || brushMode === 'forest') {
        isPainting = true;
        const stroke = {x: world.x, y: world.y};
        currentStrokes.push(stroke);
        if (brushMode === 'water') waterStrokes.push(stroke);
        else forestStrokes.push(stroke);
        return;
    }
    
    let nearJunction = null;
    for (const tj of tJunctions) {
        const dist = Math.hypot(worldX - tj.x, worldY - tj.y);
        if (dist < 600) {
            nearJunction = tj;
            break;
        }
    }
    
    if (currentPath.length === 0 && nearJunction) {
        editorMergePoint = nearJunction;
        currentPath.push({x: nearJunction.x, y: nearJunction.y});
        console.log(`Starting from T-junction at (${nearJunction.x}, ${nearJunction.y})`);
    } else if (nearJunction) {
        currentPath.push({x: nearJunction.x, y: nearJunction.y});
        console.log(`Point added (T-junction): {x:${nearJunction.x}, y:${nearJunction.y}}`);
    } else {
        currentPath.push({x: worldX, y: worldY});
        console.log(`Point added: {x:${worldX}, y:${worldY}}`);
    }
}

canvas.addEventListener('mousedown', handleEditorClick);

canvas.addEventListener('mousemove', e => {
    if (!editorMode || !isPainting || brushMode === 'road') return;
    const rect = canvas.getBoundingClientRect();
    const world = screenToWorld(e.clientX - rect.left, e.clientY - rect.top);
    const lastStroke = currentStrokes[currentStrokes.length - 1];
    if (!lastStroke || Math.hypot(world.x - lastStroke.x, world.y - lastStroke.y) > 100) {
        const stroke = {x: world.x, y: world.y};
        currentStrokes.push(stroke);
        if (brushMode === 'water') waterStrokes.push(stroke);
        else forestStrokes.push(stroke);
    }
});

canvas.addEventListener('mouseup', e => {
    if (!editorMode) return;
    isPainting = false;
});

function drawEditorOverlay(ctx) {
    if (!editorMode) return;
    
    let minX = -15000, maxX = 25000, minY = -15000, maxY = 25000;
    const worldWidth = maxX - minX;
    const worldHeight = maxY - minY;
    const scale = Math.min(canvas.width / worldWidth, canvas.height / worldHeight) * 0.9;
    const offsetX = (canvas.width - worldWidth * scale) / 2;
    const offsetY = (canvas.height - worldHeight * scale) / 2;
    
    ctx.save();
    ctx.translate(offsetX, offsetY);
    ctx.scale(scale, scale);
    ctx.translate(-minX, -minY);
    
    if (editorMergePoint) {
        ctx.fillStyle = 'lime';
        ctx.beginPath();
        ctx.arc(editorMergePoint.x, editorMergePoint.y, 80, 0, Math.PI * 2);
        ctx.fill();
    }
    
    if (currentPath.length > 0) {
        ctx.strokeStyle = 'cyan';
        ctx.lineWidth = 40;
        ctx.beginPath();
        for (let i = 0; i < currentPath.length; i++) {
            const pt = currentPath[i];
            if (i === 0) ctx.moveTo(pt.x, pt.y);
            else ctx.lineTo(pt.x, pt.y);
        }
        ctx.stroke();
        
        for (const pt of currentPath) {
            ctx.fillStyle = 'yellow';
            ctx.beginPath();
            ctx.arc(pt.x, pt.y, 60, 0, Math.PI * 2);
            ctx.fill();
        }
    }
    
    for (const pathData of savedPaths) {
        const path = pathData.points;
        ctx.strokeStyle = 'rgba(0, 255, 0, 0.5)';
        ctx.lineWidth = 40;
        ctx.beginPath();
        for (let i = 0; i < path.length; i++) {
            const pt = path[i];
            if (i === 0) ctx.moveTo(pt.x, pt.y);
            else ctx.lineTo(pt.x, pt.y);
        }
        ctx.stroke();
        
        if (pathData.startJunction) {
            ctx.fillStyle = 'lime';
            ctx.beginPath();
            ctx.arc(pathData.startJunction.x, pathData.startJunction.y, 50, 0, Math.PI * 2);
            ctx.fill();
        }
        if (pathData.endJunction) {
            ctx.fillStyle = 'orange';
            ctx.beginPath();
            ctx.arc(pathData.endJunction.x, pathData.endJunction.y, 50, 0, Math.PI * 2);
            ctx.fill();
        }
    }
    
    ctx.fillStyle = 'rgb(0, 100, 255)';
    for (const stroke of waterStrokes) {
        ctx.beginPath();
        ctx.arc(stroke.x, stroke.y, brushSize/2, 0, Math.PI * 2);
        ctx.fill();
    }
    
    ctx.fillStyle = 'rgb(34, 139, 34)';
    for (const stroke of forestStrokes) {
        ctx.beginPath();
        ctx.arc(stroke.x, stroke.y, brushSize/2, 0, Math.PI * 2);
        ctx.fill();
    }
    
    ctx.restore();
    
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(10, canvas.height - 120, 450, 110);
    ctx.fillStyle = 'lime';
    ctx.font = '14px monospace';
    ctx.fillText('ROAD EDITOR MODE', 20, canvas.height - 100);
    const modeColors = {road: 'yellow', water: 'cyan', forest: 'lightgreen'};
    ctx.fillStyle = modeColors[brushMode];
    ctx.fillText(`Brush: ${brushMode.toUpperCase()}`, 20, canvas.height - 80);
    ctx.fillStyle = 'white';
    ctx.font = '12px monospace';
    ctx.fillText('1: Road  2: Water  3: Forest', 20, canvas.height - 60);
    ctx.fillText('F: Finalize area  X: Clear  Ctrl+E: Exit', 20, canvas.height - 40);
    ctx.fillText(`Brush size: ${brushSize}  Strokes: ${currentStrokes.length}`, 20, canvas.height - 20);
}

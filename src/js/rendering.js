function draw() {
    profiler.start('draw_total');

    profiler.start('draw_terrain');
    drawTerrain();
    profiler.end('draw_terrain');

    ctx.save();
    if (rotateWorld) {
        ctx.translate(canvas.width / 2, canvas.height / 2);
        ctx.rotate(-cameraAngle - Math.PI / 2);
        ctx.translate(-car.x, -car.y);
    } else {
        ctx.translate(-camera.x, -camera.y);
    }
    drawRoads();
    ctx.restore();

    if (ambientLight > 0) {
        ctx.fillStyle = `rgba(200, 220, 255, ${ambientLight})`;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    ctx.save();
    if (rotateWorld) {
        ctx.translate(canvas.width / 2, canvas.height / 2);
        ctx.rotate(-cameraAngle - Math.PI / 2);
        ctx.translate(-car.x, -car.y);
    } else {
        ctx.translate(-camera.x, -camera.y);
    }

    ctx.fillStyle = `rgba(40, 40, 50, ${Math.min(ambientLight * 10, 1)})`;
    for (const obs of obstacles) {
        ctx.fillRect(obs.x, obs.y, obs.width, obs.height);
    }

    for (const obj of interactiveObjects) {
        if (obj.hit) continue;
        if (obj.type === 'mailbox') {
            ctx.fillRect(obj.x - 4, obj.y - 10, 8, 12);
        } else {
            if (obj.shape === 'round') {
                ctx.beginPath();
                ctx.arc(obj.x, obj.y, 9, 0, Math.PI * 2);
                ctx.fill();
            } else {
                ctx.fillRect(obj.x - 9, obj.y - 9, 18, 18);
            }
        }
    }

    for (const d of debris) {
        ctx.save();
        ctx.translate(d.x, d.y);
        ctx.rotate(d.rotation);
        ctx.fillStyle = d.color || '#000000';
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

    ctx.globalCompositeOperation = 'lighter';

    for (const d of debris) {
        if (!d.glow) continue;
        const alpha = d.lifetime / 20;
        ctx.filter = 'blur(4px)';
        ctx.fillStyle = d.color;
        ctx.globalAlpha = alpha * 0.8;
        ctx.beginPath();
        ctx.arc(d.x, d.y, d.size * 2, 0, Math.PI * 2);
        ctx.fill();
    }
    ctx.filter = 'none';
    ctx.globalAlpha = 1;

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
    const spread = Math.PI / 4;
    const leftAngle = lightAngle + Math.PI / 24;

    const allCars = [playerCar, ...aiCars, regularCar];

    profiler.start('lighting_street');
    const streetLightPos = { x: streetLight.x, y: streetLight.y - streetLight.poleHeight };
    const streetLightCone = castLightCone(streetLightPos, 0, Math.PI * 2, 80, true, allCars);
    profiler.end('lighting_street');

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

    profiler.start('lighting_player');
    const leftCone = castLightCone(leftLight, leftAngle, spread, 120, false, allCars.filter(c => c !== playerCar));
    const rightCone = castLightCone(rightLight, lightAngle, spread, 120, false, allCars.filter(c => c !== playerCar));
    profiler.end('lighting_player');

    profiler.start('lighting_ai');
    const aiCones = [];
    for (const ai of aiCars) {
        const aiHeadlightOffset = 35;
        const aiLeftLight = {
            x: ai.x + Math.cos(ai.angle) * aiHeadlightOffset - Math.sin(ai.angle) * 10,
            y: ai.y + Math.sin(ai.angle) * aiHeadlightOffset + Math.cos(ai.angle) * 10
        };
        const aiRightLight = {
            x: ai.x + Math.cos(ai.angle) * aiHeadlightOffset + Math.sin(ai.angle) * 10,
            y: ai.y + Math.sin(ai.angle) * aiHeadlightOffset - Math.cos(ai.angle) * 10
        };
        const aiLightAngle = ai.angle;
        const aiLeftAngle = aiLightAngle + Math.PI / 24;
        const aiLeftCone = castLightCone(aiLeftLight, aiLeftAngle, spread, 80, false, allCars.filter(c => c !== ai));
        const aiRightCone = castLightCone(aiRightLight, aiLightAngle, spread, 80, false, allCars.filter(c => c !== ai));
        aiCones.push({ leftCone: aiLeftCone, rightCone: aiRightCone, leftLight: aiLeftLight, rightLight: aiRightLight, angle: aiLightAngle });
    }
    profiler.end('lighting_ai');

    const regularLeftLight = {
        x: regularCar.x + Math.cos(regularCar.angle) * headlightOffset - Math.sin(regularCar.angle) * 10,
        y: regularCar.y + Math.sin(regularCar.angle) * headlightOffset + Math.cos(regularCar.angle) * 10
    };
    const regularRightLight = {
        x: regularCar.x + Math.cos(regularCar.angle) * headlightOffset + Math.sin(regularCar.angle) * 10,
        y: regularCar.y + Math.sin(regularCar.angle) * headlightOffset - Math.cos(regularCar.angle) * 10
    };
    const regularLeftAngle = regularCar.angle + Math.PI / 24;
    const regularLeftCone = castLightCone(regularLeftLight, regularLeftAngle, spread, 80, false, allCars.filter(c => c !== regularCar));
    const regularRightCone = castLightCone(regularRightLight, regularCar.angle, spread, 80, false, allCars.filter(c => c !== regularCar));
    aiCones.push({ leftCone: regularLeftCone, rightCone: regularRightCone, leftLight: regularLeftLight, rightLight: regularRightLight, angle: regularCar.angle });
    profiler.end('lighting_ai');

    for (const aiData of aiCones) {
        ctx.filter = 'blur(8px)';
        ctx.fillStyle = 'rgba(255, 255, 200, 0.05)';
        ctx.beginPath();
        ctx.moveTo(aiData.leftCone.points[0].x, aiData.leftCone.points[0].y);
        for (let i = 1; i < aiData.leftCone.points.length; i++) {
            ctx.lineTo(aiData.leftCone.points[i].x, aiData.leftCone.points[i].y);
        }
        ctx.closePath();
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(aiData.rightCone.points[0].x, aiData.rightCone.points[0].y);
        for (let i = 1; i < aiData.rightCone.points.length; i++) {
            ctx.lineTo(aiData.rightCone.points[i].x, aiData.rightCone.points[i].y);
        }
        ctx.closePath();
        ctx.fill();

        ctx.filter = 'none';
        ctx.fillStyle = 'rgba(255, 255, 200, 0.12)';
        ctx.beginPath();
        ctx.moveTo(aiData.leftCone.points[0].x, aiData.leftCone.points[0].y);
        for (let i = 1; i < aiData.leftCone.points.length; i++) {
            ctx.lineTo(aiData.leftCone.points[i].x, aiData.leftCone.points[i].y);
        }
        ctx.closePath();
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(aiData.rightCone.points[0].x, aiData.rightCone.points[0].y);
        for (let i = 1; i < aiData.rightCone.points.length; i++) {
            ctx.lineTo(aiData.rightCone.points[i].x, aiData.rightCone.points[i].y);
        }
        ctx.closePath();
        ctx.fill();
    }

    if (headlightsOn) {
        const wideSpread = brightsOn ? Math.PI / 2 : Math.PI / 3;
        const leftWide = castLightCone(leftLight, leftAngle, wideSpread, 120, false, allCars.filter(c => c !== playerCar));
        const rightWide = castLightCone(rightLight, lightAngle, wideSpread, 120, false, allCars.filter(c => c !== playerCar));

        const blurAmount = brightsOn ? 'blur(15px)' : 'blur(10px)';
        const wideAlpha = brightsOn ? 0.08 : 0.05;
        const coneAlpha = brightsOn ? 0.2 : 0.12;
        const innerAlpha = brightsOn ? 0.15 : 0.09;

        ctx.filter = blurAmount;
        ctx.fillStyle = `rgba(255, 255, 200, ${wideAlpha})`;
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

        ctx.fillStyle = `rgba(255, 255, 200, ${coneAlpha})`;
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

        ctx.fillStyle = `rgba(255, 255, 200, ${innerAlpha})`;
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

    drawRoadMarkings();

    for (const ai of aiCars) {
        drawPoliceCar(ai, true, allCars);
    }
    drawPoliceCar(playerCar, headlightsOn, allCars);
    drawRegularCar(regularCar);

    if (spotlightActive) {
        drawPoliceSpotlight(playerCar, mouseWorldX, mouseWorldY, allCars.filter(c => c !== playerCar));
    }

    ctx.fillStyle = '#444444';
    ctx.fillRect(streetLight.x - streetLight.poleWidth / 2, streetLight.y - streetLight.poleHeight, streetLight.poleWidth, streetLight.poleHeight);
    ctx.fillStyle = '#666666';
    ctx.fillRect(streetLight.x - 12, streetLight.y - streetLight.poleHeight - 8, 24, 8);

    ctx.globalCompositeOperation = 'lighter';

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.lineWidth = 0.3;

    for (const aiData of aiCones) {
            for (let i = 0; i < aiData.leftCone.hitPoints.length - 1; i++) {
                const p1 = aiData.leftCone.hitPoints[i];
                const p2 = aiData.leftCone.hitPoints[i + 1];
                const dist = Math.hypot(p2.x - p1.x, p2.y - p1.y);
                if (dist < 20) {
                    ctx.beginPath();
                    ctx.moveTo(p1.x, p1.y);
                    ctx.lineTo(p2.x, p2.y);
                    ctx.stroke();
                }
            }

        for (let i = 0; i < aiData.rightCone.hitPoints.length - 1; i++) {
            const p1 = aiData.rightCone.hitPoints[i];
            const p2 = aiData.rightCone.hitPoints[i + 1];
            const dist = Math.hypot(p2.x - p1.x, p2.y - p1.y);
            if (dist < 20) {
                ctx.beginPath();
                ctx.moveTo(p1.x, p1.y);
                ctx.lineTo(p2.x, p2.y);
                ctx.stroke();
            }
        }
    }

    if (headlightsOn) {
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



    ctx.globalCompositeOperation = 'source-over';

    drawDebugBoundingBoxes();

    ctx.restore();

    profiler.start('draw_minimap');
    if (showFullMap) {
        drawFullMap();
        drawEditorOverlay(ctx);
    } else {
        drawMinimap();
    }
    profiler.end('draw_minimap');

    profiler.end('draw_total');

    const degrees = Math.round((car.angle * 180 / Math.PI + 360) % 360);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(10, 10, 250, 20);
    ctx.fillStyle = '#00ff00';
    ctx.font = '12px monospace';
    ctx.fillText(`FPS: ${profiler.fpsDisplay} | X: ${Math.round(car.x)} Y: ${Math.round(car.y)} | ${degrees}°`, 15, 24);
}

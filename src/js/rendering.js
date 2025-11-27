function draw() {
    ctx.fillStyle = '#0a0a1a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.save();
    ctx.translate(-camera.x, -camera.y);

    ctx.globalCompositeOperation = 'lighter';

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
    const spread = Math.PI / 3;

    const streetLightPos = { x: streetLight.x, y: streetLight.y - streetLight.poleHeight };
    const streetLightCone = castLightCone(streetLightPos, 0, Math.PI * 2, 500, true);

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

    const leftCone = castLightCone(leftLight, lightAngle, spread);
    const rightCone = castLightCone(rightLight, lightAngle, spread);

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
        const aiLeftCone = castLightCone(aiLeftLight, aiLightAngle, spread);
        const aiRightCone = castLightCone(aiRightLight, aiLightAngle, spread);
        aiCones.push({ leftCone: aiLeftCone, rightCone: aiRightCone, leftLight: aiLeftLight, rightLight: aiRightLight, angle: aiLightAngle });
    }

    if (headlightsOn) {
        for (const aiData of aiCones) {
            ctx.filter = 'blur(5px)';
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

        const wideSpread = brightsOn ? Math.PI / 1.5 : Math.PI / 2.5;
        const leftWide = castLightCone(leftLight, lightAngle, wideSpread);
        const rightWide = castLightCone(rightLight, lightAngle, wideSpread);

        const blurAmount = brightsOn ? 'blur(8px)' : 'blur(5px)';
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

    for (const ai of aiCars) {
        drawPoliceCar(ai);
    }
    drawPoliceCar(playerCar);

    const cos = Math.cos(car.angle);
    const sin = Math.sin(car.angle);

    if (spotlightActive) {
        ctx.globalCompositeOperation = 'lighter';
        const driverSidePos = {
            x: car.x + cos * 10 + sin * (car.width / 2 + 5),
            y: car.y + sin * 10 - cos * (car.width / 2 + 5)
        };
        const spotAngle = Math.atan2(mouseWorldY - driverSidePos.y, mouseWorldX - driverSidePos.x);
        const spotCone = castLightCone(driverSidePos, spotAngle, Math.PI / 10, 300);

        ctx.filter = 'blur(15px)';
        ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
        ctx.beginPath();
        ctx.moveTo(spotCone.points[0].x, spotCone.points[0].y);
        for (let i = 1; i < spotCone.points.length; i++) {
            ctx.lineTo(spotCone.points[i].x, spotCone.points[i].y);
        }
        ctx.closePath();
        ctx.fill();

        ctx.filter = 'blur(8px)';
        ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.beginPath();
        ctx.moveTo(spotCone.points[0].x, spotCone.points[0].y);
        for (let i = 1; i < spotCone.points.length; i++) {
            ctx.lineTo(spotCone.points[i].x, spotCone.points[i].y);
        }
        ctx.closePath();
        ctx.fill();

        ctx.filter = 'none';
        ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
        ctx.beginPath();
        ctx.moveTo(spotCone.points[0].x, spotCone.points[0].y);
        for (let i = 1; i < spotCone.points.length; i++) {
            ctx.lineTo(spotCone.points[i].x, spotCone.points[i].y);
        }
        ctx.closePath();
        ctx.fill();
        
        ctx.filter = 'blur(8px)';
        ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        ctx.beginPath();
        ctx.arc(driverSidePos.x, driverSidePos.y, 6, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.filter = 'none';
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.beginPath();
        ctx.arc(driverSidePos.x, driverSidePos.y, 3, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.globalCompositeOperation = 'source-over';
    }

    for (const d of debris) {
        ctx.save();
        ctx.translate(d.x, d.y);
        ctx.rotate(d.rotation);
        ctx.fillStyle = '#000000';
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


    ctx.fillStyle = '#444444';
    ctx.fillRect(streetLight.x - streetLight.poleWidth / 2, streetLight.y - streetLight.poleHeight, streetLight.poleWidth, streetLight.poleHeight);
    ctx.fillStyle = '#666666';
    ctx.fillRect(streetLight.x - 12, streetLight.y - streetLight.poleHeight - 8, 24, 8);

    ctx.globalCompositeOperation = 'lighter';
    
    if (headlightsOn) {
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.lineWidth = 2;

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
    }

    if (spotlightActive) {
        const driverSidePos = {
            x: car.x + cos * 10 + sin * (car.width / 2 + 5),
            y: car.y + sin * 10 - cos * (car.width / 2 + 5)
        };
        const spotAngle = Math.atan2(mouseWorldY - driverSidePos.y, mouseWorldX - driverSidePos.x);
        const spotCone = castLightCone(driverSidePos, spotAngle, Math.PI / 10, 300);
        
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.lineWidth = 2;

        for (let i = 0; i < spotCone.hitPoints.length - 1; i++) {
            const p1 = spotCone.hitPoints[i];
            const p2 = spotCone.hitPoints[i + 1];
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

    ctx.strokeStyle = '#ff0000';
    ctx.lineWidth = 3;
    const corners1 = getCarCorners(playerCar, COLLISION_WIDTH_BUFFER, COLLISION_HEIGHT_BUFFER);
    ctx.beginPath();
    ctx.moveTo(corners1[0].x, corners1[0].y);
    for (let i = 1; i < corners1.length; i++) {
        ctx.lineTo(corners1[i].x, corners1[i].y);
    }
    ctx.closePath();
    ctx.stroke();
    
    for (const ai of aiCars) {
        const corners = getCarCorners(ai, COLLISION_WIDTH_BUFFER, COLLISION_HEIGHT_BUFFER);
        ctx.beginPath();
        ctx.moveTo(corners[0].x, corners[0].y);
        for (let i = 1; i < corners.length; i++) {
            ctx.lineTo(corners[i].x, corners[i].y);
        }
        ctx.closePath();
        ctx.stroke();
    }

    ctx.restore();
}

// ========================================
// POLICE CAR CREATION
// ========================================
// Creates a new police car object with initial properties
function createPoliceCar(x, y, followTarget = null) {
    return {
        // POSITION & DIMENSIONS
        x: x,                    // X coordinate in world space
        y: y,                    // Y coordinate in world space
        width: 30,               // Car width (adjust for size)
        height: 80,              // Car length (adjust for size)

        // MOVEMENT PROPERTIES
        angle: 0,                // Rotation angle in radians
        speed: 0,                // Current forward/backward speed
        prevSpeed: 0,            // Previous frame speed (for brake lights)
        maxSpeed: 5,             // Maximum normal speed (adjust for top speed)
        acceleration: 0.3,       // How fast car speeds up (adjust for responsiveness)
        friction: 0.98,          // Speed decay when not accelerating (0.9=more drag, 0.99=less drag)
        turnSpeed: 0.05,         // How fast car turns (adjust for handling)

        // PHYSICS
        vx: 0,                   // Velocity X (for collisions/sliding)
        vy: 0,                   // Velocity Y (for collisions/sliding)
        steerHoldTime: 0,        // How long steering has been held

        // AI & EFFECTS
        followTarget: followTarget,  // Target car to follow (for AI)
        lightOffset: Math.floor(Math.random() * 12),  // Random offset for light animation sync
        sirenSource: null,
        sirenGain: null,
        sirenOn: false,
        sirenDelay: Math.random() * 300,
        turningLeft: false,
        turningRight: false,
        leftSignalTime: 0,
        rightSignalTime: 0,
        leftKeyPressStart: 0,
        rightKeyPressStart: 0,
        leftTapCount: 0,
        rightTapCount: 0,
        leftLastTap: 0,
        rightLastTap: 0
    };
}

// ========================================
// SPOTLIGHT (Mouse-Aimed Searchlight)
// ========================================
// Draws the police car's spotlight - activated by holding mouse button
function drawPoliceSpotlight(car, mouseWorldX, mouseWorldY, allCars = []) {
    const cos = Math.cos(car.angle);
    const sin = Math.sin(car.angle);

    ctx.globalCompositeOperation = 'lighter';

    // SPOTLIGHT POSITION (driver's side of car) - this is where the light ball appears
    const driverSidePos = {
        x: car.x + cos * 10 + sin * (car.width / 2 + 3),
        y: car.y + sin * 10 - cos * (car.width / 2 + 3)
    };
    const spotAngle = Math.atan2(mouseWorldY - driverSidePos.y, mouseWorldX - driverSidePos.x);

    // CONE ORIGIN POSITION - offset backwards from light ball to make cone appear wider at source
    const coneOffset = -10;  // ADJUST THIS: negative = behind light ball, positive = in front
    const coneOrigin = {
        x: driverSidePos.x + Math.cos(spotAngle) * coneOffset,
        y: driverSidePos.y + Math.sin(spotAngle) * coneOffset
    };
    const spotCone = castLightCone(coneOrigin, spotAngle, Math.PI / 10, 50, false, allCars);  // Cone starts from coneOrigin, not driverSidePos

    // SPOTLIGHT GLOW LAYERS (layered for realistic effect)
    // spotCone.points[0] is the origin point - all rays start from here (single point)
    ctx.filter = 'blur(15px)';  // Adjust blur for glow spread
    ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';  // Adjust alpha for brightness
    ctx.beginPath();
    ctx.moveTo(spotCone.points[0].x, spotCone.points[0].y);  // CONE ORIGIN POINT - starts here
    for (let i = 1; i < spotCone.points.length; i++) {
        ctx.lineTo(spotCone.points[i].x, spotCone.points[i].y);
    }
    ctx.closePath();
    ctx.fill();

    ctx.filter = 'blur(8px)';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.beginPath();
    ctx.moveTo(spotCone.points[0].x, spotCone.points[0].y);  // CONE ORIGIN POINT - starts here
    for (let i = 1; i < spotCone.points.length; i++) {
        ctx.lineTo(spotCone.points[i].x, spotCone.points[i].y);
    }
    ctx.closePath();
    ctx.fill();

    ctx.filter = 'none';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
    ctx.beginPath();
    ctx.moveTo(spotCone.points[0].x, spotCone.points[0].y);  // CONE ORIGIN POINT - starts here
    for (let i = 1; i < spotCone.points.length; i++) {
        ctx.lineTo(spotCone.points[i].x, spotCone.points[i].y);
    }
    ctx.closePath();
    ctx.fill();

    // SPOTLIGHT SOURCE GLOW (bright spot at origin)
    ctx.filter = 'blur(8px)';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.beginPath();
    ctx.arc(driverSidePos.x, driverSidePos.y, 8, 0, Math.PI * 2);  // Adjust radius (6) for size
    ctx.fill();

    ctx.filter = 'none';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.beginPath();
    ctx.arc(driverSidePos.x, driverSidePos.y, 3, 0, Math.PI * 2);
    ctx.fill();

    // SPOTLIGHT EDGE RAYS (detail lines)
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.lineWidth = 0.3;
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

    ctx.globalCompositeOperation = 'source-over';
}

// ========================================
// POLICE CAR RENDERING
// ========================================
// Draws the police car with lights, sirens, and effects
function drawPoliceCar(car, lightsEnabled = true, allCars = []) {
    // DRAW CAR BODY
    ctx.save();
    ctx.translate(car.x, car.y);
    ctx.rotate(car.angle - Math.PI / 2);
    ctx.fillStyle = '#000000';  // Main car color (adjust for different police car color)
    ctx.fillRect(-car.width / 2, -car.height / 2, car.width, car.height);
    ctx.fillStyle = '#ffffff';  // Window color
    ctx.fillRect(-car.width / 2, -14, car.width, 28);

    // SIREN LIGHT ANIMATION
    // Controls alternating red/blue flashing pattern
    let redOn = false;
    let blueOn = false;

    if (lightsOn) {
        const frame = (Math.floor(Date.now() / 50) + car.lightOffset) % 12;  // Adjust /50 for flash speed
        if (frame < 2 || (frame >= 3 && frame < 5)) {
            redOn = true;  // Red light active frames
        } else if (frame >= 6 && frame < 8 || (frame >= 9 && frame < 11)) {
            blueOn = true;  // Blue light active frames
        }
    }

    ctx.restore();

    // SIREN LIGHT CONE EFFECTS
    // Creates glowing light cones from the roof lights
    ctx.globalCompositeOperation = 'lighter';

    const cos = Math.cos(car.angle);
    const sin = Math.sin(car.angle);
    // Calculate positions of roof lights (adjust offsets to move light positions)
    const blueLightPos = {
        x: car.x + cos * (car.height / 2 - 33) - sin * (car.width / 4 - 1),
        y: car.y + sin * (car.height / 2 - 33) + cos * (car.width / 4 - 1)
    };
    const redLightPos = {
        x: car.x + cos * (car.height / 2 - 33) + sin * (car.width / 4 - 1),
        y: car.y + sin * (car.height / 2 - 33) - cos * (car.width / 4 - 1)
    };

    let redCone = null;
    let blueCone = null;

    // RED LIGHT CONE (adjust radius 100 for light spread distance)
    if (redOn) {
        redCone = castLightCone(redLightPos, 0, Math.PI * 2, 100, false, allCars.filter(c => c !== car));
        ctx.filter = 'blur(15px)';  // Adjust blur amount for softer/sharper light
        ctx.fillStyle = 'rgba(255, 0, 0, 0.08)';  // Adjust alpha (0.08) for brightness
        ctx.beginPath();
        ctx.moveTo(redCone.points[0].x, redCone.points[0].y);
        for (let i = 1; i < redCone.points.length; i++) {
            ctx.lineTo(redCone.points[i].x, redCone.points[i].y);
        }
        ctx.closePath();
        ctx.fill();
        ctx.filter = 'none';
        ctx.fillStyle = 'rgba(255, 0, 0, 0.05)';
        ctx.beginPath();
        ctx.moveTo(redCone.points[0].x, redCone.points[0].y);
        for (let i = 1; i < redCone.points.length; i++) {
            ctx.lineTo(redCone.points[i].x, redCone.points[i].y);
        }
        ctx.closePath();
        ctx.fill();

    }

    // BLUE LIGHT CONE (adjust radius 100 for light spread distance)
    if (blueOn) {
        blueCone = castLightCone(blueLightPos, 0, Math.PI * 2, 100, false, allCars.filter(c => c !== car));
        ctx.filter = 'blur(15px)';
        ctx.fillStyle = 'rgba(0, 0, 255, 0.1)';
        ctx.beginPath();
        ctx.moveTo(blueCone.points[0].x, blueCone.points[0].y);
        for (let i = 1; i < blueCone.points.length; i++) {
            ctx.lineTo(blueCone.points[i].x, blueCone.points[i].y);
        }
        ctx.closePath();
        ctx.fill();
        ctx.filter = 'none';
        ctx.fillStyle = 'rgba(0, 0, 255, 0.1)';
        ctx.beginPath();
        ctx.moveTo(blueCone.points[0].x, blueCone.points[0].y);
        for (let i = 1; i < blueCone.points.length; i++) {
            ctx.lineTo(blueCone.points[i].x, blueCone.points[i].y);
        }
        ctx.closePath();
        ctx.fill();

    }

    ctx.globalCompositeOperation = 'source-over';

    ctx.save();
    ctx.translate(car.x, car.y);
    ctx.rotate(car.angle - Math.PI / 2);

    // HEADLIGHTS & TAIL LIGHTS (small rectangles on car body)
    if (lightsEnabled) {
        ctx.fillStyle = '#ffff00';  // Headlight color (yellow)
        ctx.fillRect(-14, car.height / 2 - 2, 8, 3);  // Left headlight
        ctx.fillRect(6, car.height / 2 - 2, 8, 3);    // Right headlight

        ctx.fillStyle = '#ff0000';  // Tail light color (red)
        ctx.fillRect(-car.width / 2 + 2, -car.height / 2, 6, 3);  // Left tail light
        ctx.fillRect(car.width / 2 - 8, -car.height / 2, 6, 3);   // Right tail light
    }

    // TURN SIGNALS (BLINKER POSITION ADJUSTMENT)
    // To adjust blinker positions, modify the fillRect parameters below:
    // fillRect(x, y, width, height) where:
    //   - First value (x): left/right position (-car.width/2 = left side, car.width/2 = right side)
    //   - Second value (y): front/back position (car.height/2 = front, -car.height/2 = back)
    //   - Third value: blinker width
    //   - Fourth value: blinker height
    const now = Date.now();
    const leftSignalOn = car.turningLeft && Math.floor((now - car.leftSignalTime) / 350) % 2 === 0;
    const rightSignalOn = car.turningRight && Math.floor((now - car.rightSignalTime) / 350) % 2 === 0;
    if (leftSignalOn) {
        ctx.fillStyle = '#ff8800';
        ctx.fillRect(-car.width / 2 + 0, car.height / 2 - 2, 6, 3);  // Right front blinker
        ctx.fillRect(-car.width / 2 + 2, -car.height / 2, 4, 3);  // Right rear blinker
    }
    if (rightSignalOn) {
        ctx.fillStyle = '#ff8800';
        ctx.fillRect(car.width / 2 - 6, car.height / 2 - 2, 6, 3);  // Left front blinker
        ctx.fillRect(car.width / 2 - 4, -car.height / 2, 4, 3);  // Left rear blinker
    }
    ctx.restore();

    // TAIL LIGHT GLOW EFFECTS
    // Creates glowing circles for brake/reverse lights
    if (lightsEnabled) {
        ctx.globalCompositeOperation = 'lighter';

        // Calculate tail light positions
        const tailLeftPos = {
            x: car.x - cos * (car.height / 2 - 3) - sin * (car.width / 2 - 5),
            y: car.y - sin * (car.height / 2 - 3) + cos * (car.width / 2 - 5)
        };
        const tailRightPos = {
            x: car.x - cos * (car.height / 2 - 3) + sin * (car.width / 2 - 5),
            y: car.y - sin * (car.height / 2 - 3) - cos * (car.width / 2 - 5)
        };

        // Detect braking and reversing for light brightness
        const isBraking = car.speed > 0.1 && car.prevSpeed - car.speed > 0.01;
        const isReversing = car.speed < -0.1;

        // Tail light brightness (adjust 0.8 for bright, 0.3 for dim)
        let leftBrightness = redOn ? 0.8 : 0.3;   // Brighter when red siren on
        let rightBrightness = blueOn ? 0.8 : 0.3; // Brighter when blue siren on
        if (isBraking) {
            leftBrightness = 0.9;   // Full brightness when braking
            rightBrightness = 0.9;
        }

        ctx.filter = 'blur(6px)';  // Adjust blur for glow effect
        if (isReversing) {
            // White reverse lights
            ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';  // Adjust alpha for brightness
            ctx.beginPath();
            ctx.arc(tailLeftPos.x, tailLeftPos.y, 8, 0, Math.PI * 2);  // Adjust radius (8) for size
            ctx.fill();
            ctx.beginPath();
            ctx.arc(tailRightPos.x, tailRightPos.y, 8, 0, Math.PI * 2);
            ctx.fill();
        } else {
            // Red brake/tail lights
            ctx.fillStyle = `rgba(255, 0, 0, ${leftBrightness})`;
            ctx.beginPath();
            ctx.arc(tailLeftPos.x, tailLeftPos.y, 8, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = `rgba(255, 0, 0, ${rightBrightness})`;
            ctx.beginPath();
            ctx.arc(tailRightPos.x, tailRightPos.y, 8, 0, Math.PI * 2);
            ctx.fill();
            if (blueOn) {
                ctx.beginPath();
                ctx.arc(tailRightPos.x, tailRightPos.y, 8, 0, Math.PI * 2);
                ctx.fill();
            }
        }
        ctx.filter = 'none';

        // TURN SIGNAL GLOWS
        const now = Date.now();
        const leftSignalOn = car.turningLeft && Math.floor((now - car.leftSignalTime) / 350) % 2 === 0;
        const rightSignalOn = car.turningRight && Math.floor((now - car.rightSignalTime) / 350) % 2 === 0;

        const frontLeftPos = {
            x: car.x + cos * (car.height / 2 - 2) - sin * (car.width / 2 - 3),
            y: car.y + sin * (car.height / 2 - 2) + cos * (car.width / 2 - 3)
        };
        const frontRightPos = {
            x: car.x + cos * (car.height / 2 - 2) + sin * (car.width / 2 - 3),
            y: car.y + sin * (car.height / 2 - 2) - cos * (car.width / 2 - 3)
        };

        ctx.filter = 'blur(6px)';
        if (leftSignalOn) {
            ctx.fillStyle = 'rgba(255, 136, 0, 0.7)';
            ctx.beginPath();
            ctx.arc(tailLeftPos.x, tailLeftPos.y, 8, 0, Math.PI * 2);
            ctx.fill();
        }
        if (rightSignalOn) {
            ctx.fillStyle = 'rgba(255, 136, 0, 0.7)';
            ctx.beginPath();
            ctx.arc(tailRightPos.x, tailRightPos.y, 8, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.filter = 'blur(3px)';
        if (leftSignalOn) {
            ctx.fillStyle = 'rgba(255, 136, 0, 0.4)';
            ctx.beginPath();
            ctx.arc(frontLeftPos.x, frontLeftPos.y, 5, 0, Math.PI * 2);
            ctx.fill();
        }
        if (rightSignalOn) {
            ctx.fillStyle = 'rgba(255, 136, 0, 0.4)';
            ctx.beginPath();
            ctx.arc(frontRightPos.x, frontRightPos.y, 5, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.filter = 'none';
    }

    ctx.globalCompositeOperation = 'source-over';

    ctx.save();
    ctx.translate(car.x, car.y);
    ctx.rotate(car.angle - Math.PI / 2);
    ctx.restore();

    ctx.globalCompositeOperation = 'lighter';

    // RED SIREN GLOW (layered circles for realistic glow)
    if (redOn) {
        const redGlowX = redLightPos.x + cos * 6 + sin * 8;
        const redGlowY = redLightPos.y + sin * 6 - cos * 8;
        // Outer glow layer
        ctx.filter = 'blur(40px)';  // Adjust blur for glow spread
        ctx.fillStyle = 'rgba(255, 0, 0, 0.6)';  // Adjust alpha for intensity
        ctx.beginPath();
        ctx.arc(redGlowX, redGlowY, 60, 0, Math.PI * 2);  // Adjust radius for size
        ctx.fill();
        // Middle glow layer
        ctx.filter = 'blur(25px)';
        ctx.fillStyle = 'rgba(255, 0, 0, 0.8)';
        ctx.beginPath();
        ctx.arc(redGlowX, redGlowY, 40, 0, Math.PI * 2);
        ctx.fill();
        // Inner bright core
        ctx.filter = 'blur(12px)';
        ctx.fillStyle = 'rgba(255, 0, 0, 1)';
        ctx.beginPath();
        ctx.arc(redGlowX, redGlowY, 20, 0, Math.PI * 2);
        ctx.fill();
        ctx.filter = 'none';
    }

    // BLUE SIREN GLOW (layered circles for realistic glow)
    if (blueOn) {
        const blueGlowX = blueLightPos.x + cos * 6 - sin * 8;
        const blueGlowY = blueLightPos.y + sin * 6 + cos * 8;
        // Outer glow layer
        ctx.filter = 'blur(40px)';  // Adjust blur for glow spread
        ctx.fillStyle = 'rgba(0, 0, 255, 0.6)';  // Adjust alpha for intensity
        ctx.beginPath();
        ctx.arc(blueGlowX, blueGlowY, 60, 0, Math.PI * 2);  // Adjust radius for size
        ctx.fill();
        // Middle glow layer
        ctx.filter = 'blur(25px)';
        ctx.fillStyle = 'rgba(0, 0, 255, 0.8)';
        ctx.beginPath();
        ctx.arc(blueGlowX, blueGlowY, 40, 0, Math.PI * 2);
        ctx.fill();
        // Inner bright core
        ctx.filter = 'blur(12px)';
        ctx.fillStyle = 'rgba(0, 0, 255, 1)';
        ctx.beginPath();
        ctx.arc(blueGlowX, blueGlowY, 20, 0, Math.PI * 2);
        ctx.fill();
        ctx.filter = 'none';
    }

    ctx.globalCompositeOperation = 'source-over';

    ctx.save();
    ctx.translate(car.x, car.y);
    ctx.rotate(car.angle - Math.PI / 2);

    ctx.fillStyle = redOn ? '#ff4747ff' : '#330000';
    ctx.fillRect(0, car.height / 2 - 36, car.width / 2 - 2, 6);
    ctx.fillStyle = blueOn ? '#b2c2ffff' : '#000033';
    ctx.fillRect(-car.width / 2 + 2, car.height / 2 - 36, car.width / 2 - 2, 6);
    ctx.restore();

    if (redCone && redCone.hitPoints.length > 0) {
        for (let i = 0; i < redCone.hitPoints.length - 1; i++) {
            const p1 = redCone.hitPoints[i];
            const p2 = redCone.hitPoints[i + 1];
            const dist = Math.hypot(p2.x - p1.x, p2.y - p1.y);
            if (dist < 20) {
                const distFromLight = Math.hypot(p1.x - redLightPos.x, p1.y - redLightPos.y);
                const fade = Math.max(0.1, 1 - distFromLight / 500);
                const width = 1.5 * fade + 0.3;
                ctx.strokeStyle = `rgba(255, 0, 0, ${fade})`;
                ctx.lineWidth = width;
                ctx.beginPath();
                ctx.moveTo(p1.x, p1.y);
                ctx.lineTo(p2.x, p2.y);
                ctx.stroke();
            }
        }
    }

    if (blueCone && blueCone.hitPoints.length > 0) {
        for (let i = 0; i < blueCone.hitPoints.length - 1; i++) {
            const p1 = blueCone.hitPoints[i];
            const p2 = blueCone.hitPoints[i + 1];
            const dist = Math.hypot(p2.x - p1.x, p2.y - p1.y);
            if (dist < 20) {
                const distFromLight = Math.hypot(p1.x - blueLightPos.x, p1.y - blueLightPos.y);
                const fade = Math.max(0.1, 1 - distFromLight / 500);
                const width = 1.5 * fade + 0.3;
                ctx.strokeStyle = `rgba(0, 150, 255, ${fade})`;
                ctx.lineWidth = width;
                ctx.beginPath();
                ctx.moveTo(p1.x, p1.y);
                ctx.lineTo(p2.x, p2.y);
                ctx.stroke();
            }
        }
    }
}

// ========================================
// POLICE CAR PHYSICS UPDATE
// ========================================
// Updates car position, handles input, and processes collisions
function updatePoliceCar(car, otherCar) {
    const prevX = car.x;
    const prevY = car.y;

    car.prevSpeed = car.speed;

    // BOOST MECHANIC (Shift key for speed boost)
    const boostMultiplier = keys['shift'] ? 2.5 : 1;  // Adjust 2.5 for boost strength

    // ACCELERATION (W key)
    if (keys['w']) {
        const targetSpeed = car.speed + car.acceleration * boostMultiplier;
        car.speed = keys['shift'] ? Math.min(targetSpeed, car.maxSpeed * 2.5) : Math.min(targetSpeed, Math.max(car.speed, car.maxSpeed));
    }
    // BRAKING/REVERSE (S key)
    if (keys['s']) car.speed = Math.max(car.speed - car.acceleration, -car.maxSpeed / 2);

    // FRICTION (natural slowdown when not accelerating)
    if (!keys['w'] && !keys['s']) car.speed *= car.friction;
    if (Math.abs(car.speed) < 0.01) car.speed = 0;

    // STEERING (A/D keys - only works when moving)
    const steerDirection = car.speed < 0 ? -1 : 1;
    const speedRatio = Math.abs(car.speed) / car.maxSpeed;

    const now = Date.now();

    if (keys['a']) {
        if (car.rightKeyPressStart === 0) {
            car.rightKeyPressStart = now;
            if (now - car.rightLastTap < 500) {
                car.rightTapCount++;
                if (car.rightTapCount >= 2) {
                    car.rightSignalTime = now;
                    car.leftSignalTime = 0;
                    car.rightTapCount = 0;
                }
            } else {
                car.rightTapCount = 1;
            }
            car.rightLastTap = now;
        }
        if (car.rightSignalTime === 0 && now - car.rightKeyPressStart >= 250) {
            car.rightSignalTime = now;
            car.leftSignalTime = 0;
        }
    } else {
        car.rightKeyPressStart = 0;
    }

    if (keys['d']) {
        if (car.leftKeyPressStart === 0) {
            car.leftKeyPressStart = now;
            if (now - car.leftLastTap < 500) {
                car.leftTapCount++;
                if (car.leftTapCount >= 2) {
                    car.leftSignalTime = now;
                    car.rightSignalTime = 0;
                    car.leftTapCount = 0;
                }
            } else {
                car.leftTapCount = 1;
            }
            car.leftLastTap = now;
        }
        if (car.leftSignalTime === 0 && now - car.leftKeyPressStart >= 250) {
            car.leftSignalTime = now;
            car.rightSignalTime = 0;
        }
    } else {
        car.leftKeyPressStart = 0;
    }

    if (car.leftSignalTime > 0 && now - car.leftSignalTime >= 1500 && !keys['d']) {
        car.leftSignalTime = 0;
    }
    if (car.rightSignalTime > 0 && now - car.rightSignalTime >= 1500 && !keys['a']) {
        car.rightSignalTime = 0;
    }
    
    car.turningLeft = car.leftSignalTime > 0;
    car.turningRight = car.rightSignalTime > 0;

    if (keys['a'] || keys['d']) {
        car.steerHoldTime++;
        const dampening = speedRatio > 0.7 && car.steerHoldTime < 8 ? 0.3 : 1.0;
        if (keys['a']) car.angle -= car.turnSpeed * speedRatio * steerDirection * dampening;
        if (keys['d']) car.angle += car.turnSpeed * speedRatio * steerDirection * dampening;
    } else {
        car.steerHoldTime = 0;
    }

    // POSITION UPDATE (movement + collision velocity)
    car.x += Math.cos(car.angle) * car.speed + car.vx;
    car.y += Math.sin(car.angle) * car.speed + car.vy;

    // LANE ASSISTANCE (steering angle adjustment)
    const laneAssist = roadSystem.getLaneAssist(car);
    const isActivelySteering = keys['a'] || keys['d'];
    if (laneAssist && Math.abs(car.speed) > 0.5 && !isActivelySteering) {
        const targetAngle = laneAssist.roadAngle + laneAssist.correctionAngle;
        let angleDiff = targetAngle - car.angle;
        while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
        while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
        car.angle += angleDiff * 0.08 * laneAssist.strength;
    }

    // VELOCITY DECAY (sliding from collisions fades out)
    car.vx *= 0.9;  // Adjust for more/less sliding
    car.vy *= 0.9;
    if (Math.abs(car.vx) < 0.01) car.vx = 0;
    if (Math.abs(car.vy) < 0.01) car.vy = 0;

    // OBSTACLE COLLISION (walls, buildings, etc.)
    if (checkCollision(car, null)) {
        if (!car.glancingBlow) {
            // Hard collision - full stop
            car.x = prevX;
            car.y = prevY;
            car.vx = 0;
            car.vy = 0;
            car.speed = 0;
        }
    }
    car.glancingBlow = false;

    // CAR-TO-CAR COLLISION
    if (otherCar && checkCollision(car, otherCar)) {
        const dx = car.x - otherCar.x;
        const dy = car.y - otherCar.y;
        const dist = Math.hypot(dx, dy);

        if (dist > 0) {
            // Calculate collision normal
            const nx = dx / dist;
            const ny = dy / dist;

            const carVelX = Math.cos(car.angle) * car.speed + car.vx;
            const carVelY = Math.sin(car.angle) * car.speed + car.vy;
            const otherVelX = Math.cos(otherCar.angle) * otherCar.speed + otherCar.vx;
            const otherVelY = Math.sin(otherCar.angle) * otherCar.speed + otherCar.vy;

            const relVelX = carVelX - otherVelX;
            const relVelY = carVelY - otherVelY;
            const relVelDotNormal = relVelX * nx + relVelY * ny;

            if (relVelDotNormal < 0) {
                const restitution = 0.3;  // Bounciness (0=no bounce, 1=full bounce)
                const impulse = -(1 + restitution) * relVelDotNormal / 2;

                car.vx += impulse * nx;
                car.vy += impulse * ny;

                const testVx = otherCar.vx - impulse * nx;
                const testVy = otherCar.vy - impulse * ny;
                const testX = otherCar.x + testVx;
                const testY = otherCar.y + testVy;
                const origX = otherCar.x;
                const origY = otherCar.y;
                otherCar.x = testX;
                otherCar.y = testY;

                if (checkCollision(otherCar, null)) {
                    otherCar.x = origX;
                    otherCar.y = origY;
                } else {
                    otherCar.x = origX;
                    otherCar.y = origY;
                    otherCar.vx = testVx;
                    otherCar.vy = testVy;
                    otherCar.angle += (Math.random() - 0.5) * 0.4;
                }

                // Reduce speeds after collision (adjust 0.5 for impact severity)
                car.speed *= 0.5;
                otherCar.speed *= 0.5;
            }

            // SEPARATION (prevent cars from overlapping)
            const minDist = 90;  // Minimum distance between cars (adjust for spacing)
            const overlap = minDist - dist;
            if (overlap > 0) {
                const separationX = nx * overlap * 0.5;
                const separationY = ny * overlap * 0.5;
                car.x += separationX;
                car.y += separationY;
                const tempX = otherCar.x;
                const tempY = otherCar.y;
                otherCar.x -= separationX;
                otherCar.y -= separationY;
                if (checkCollision(otherCar, null)) {
                    otherCar.x = tempX;
                    otherCar.y = tempY;
                    otherCar.vx = 0;
                    otherCar.vy = 0;
                }
            }
        }
    }

    // CHECK FOR INTERACTIVE OBJECTS (mailboxes, cones, etc.)
    checkObjectCollision(car);
}

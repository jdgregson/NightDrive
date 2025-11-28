// ========================================
// REGULAR CAR CREATION
// ========================================
// Creates a new regular car object with initial properties
function createRegularCar(x, y, color, followTarget = null) {
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
        maxSpeed: 5,             // Maximum speed (adjust for top speed)
        acceleration: 0.3,       // How fast car speeds up (adjust for responsiveness)
        friction: 0.95,          // Speed decay when not accelerating (0.9=more drag, 0.99=less drag)
        turnSpeed: 0.05,         // How fast car turns (adjust for handling)
        
        // PHYSICS
        vx: 0,                   // Velocity X (for collisions/sliding)
        vy: 0,                   // Velocity Y (for collisions/sliding)
        
        // AI & APPEARANCE
        followTarget: followTarget,  // Target car to follow (for AI)
        color: color,                // Main car body color
        lightColor: lightenColor(color)  // Lighter shade for windows
    };
}

// ========================================
// COLOR UTILITY
// ========================================
// Creates a lighter version of a color for windows
function lightenColor(color) {
    const r = parseInt(color.slice(1, 3), 16);
    const g = parseInt(color.slice(3, 5), 16);
    const b = parseInt(color.slice(5, 7), 16);
    
    const lighten = (c) => Math.min(255, Math.floor(c + (255 - c) * 0.2));  // Adjust 0.2 for lighter/darker windows
    
    const lr = lighten(r).toString(16).padStart(2, '0');
    const lg = lighten(g).toString(16).padStart(2, '0');
    const lb = lighten(b).toString(16).padStart(2, '0');
    
    return `#${lr}${lg}${lb}`;
}

// ========================================
// REGULAR CAR RENDERING
// ========================================
// Draws the regular car with lights and effects
function drawRegularCar(car, lightsEnabled = true) {
    // DRAW CAR BODY
    ctx.save();
    ctx.translate(car.x, car.y);
    ctx.rotate(car.angle - Math.PI / 2);
    ctx.fillStyle = car.color;  // Main car body color
    ctx.fillRect(-car.width / 2, -car.height / 2, car.width, car.height);
    ctx.fillStyle = car.lightColor;  // Window color (lighter shade)
    ctx.fillRect(-car.width / 2, -14, car.width, 28);  // Adjust -14 and 28 for window position/size

    // HEADLIGHTS & TAIL LIGHTS (small rectangles on car body)
    if (lightsEnabled) {
        ctx.fillStyle = '#ffff00';  // Headlight color (yellow)
        ctx.fillRect(-14, car.height / 2 - 2, 8, 3);  // Left headlight
        ctx.fillRect(6, car.height / 2 - 2, 8, 3);    // Right headlight

        ctx.fillStyle = '#ff0000';  // Tail light color (red)
        ctx.fillRect(-car.width / 2 + 2, -car.height / 2, 6, 3);  // Left tail light
        ctx.fillRect(car.width / 2 - 8, -car.height / 2, 6, 3);   // Right tail light
    }
    ctx.restore();

    // TAIL LIGHT GLOW EFFECTS
    // Creates glowing circles for brake/reverse lights
    if (lightsEnabled) {
        ctx.globalCompositeOperation = 'lighter';

        const cos = Math.cos(car.angle);
        const sin = Math.sin(car.angle);
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
        let brightness = isBraking ? 0.9 : 0.3;  // Adjust 0.9 for bright, 0.3 for dim

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
            ctx.fillStyle = `rgba(255, 0, 0, ${brightness})`;
            ctx.beginPath();
            ctx.arc(tailLeftPos.x, tailLeftPos.y, 8, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(tailRightPos.x, tailRightPos.y, 8, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.filter = 'none';
    }

    ctx.globalCompositeOperation = 'source-over';

    ctx.save();
    ctx.translate(car.x, car.y);
    ctx.rotate(car.angle - Math.PI / 2);
    ctx.restore();
}

// ========================================
// REGULAR CAR PHYSICS UPDATE
// ========================================
// Updates car position, handles input, and processes collisions
function updateRegularCar(car, otherCar) {
    const prevX = car.x;
    const prevY = car.y;
    
    car.prevSpeed = car.speed;

    // ACCELERATION (W key)
    if (keys['w']) car.speed = Math.min(car.speed + car.acceleration, car.maxSpeed);
    // BRAKING/REVERSE (S key)
    if (keys['s']) car.speed = Math.max(car.speed - car.acceleration, -car.maxSpeed / 2);

    // FRICTION (natural slowdown)
    car.speed *= car.friction;
    if (Math.abs(car.speed) < 0.01) car.speed = 0;

    // STEERING (A/D keys - only works when moving)
    if (keys['a']) car.angle -= car.turnSpeed * Math.abs(car.speed) / car.maxSpeed;
    if (keys['d']) car.angle += car.turnSpeed * Math.abs(car.speed) / car.maxSpeed;

    // POSITION UPDATE (movement + collision velocity)
    car.x += Math.cos(car.angle) * car.speed + car.vx;
    car.y += Math.sin(car.angle) * car.speed + car.vy;

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

# Road System Documentation

## Overview
The road system provides a simple, consistent way to define roads and automatically handles intersections, rendering, and car navigation.

## Adding Roads

Roads are defined by start and end coordinates:

```javascript
roadSystem.addRoad(x1, y1, x2, y2);
```

Example:
```javascript
// Horizontal road from (-600, -400) to (280, -400)
roadSystem.addRoad(-600, -400, 280, -400);

// Vertical road from (-280, -1000) to (-280, 200)
roadSystem.addRoad(-280, -1000, -280, 200);
```

After adding all roads, call:
```javascript
roadSystem.buildIntersections();
```

This automatically detects where roads cross and creates intersections.

## Road Specifications

- **Width:** 240 pixels (fixed)
- **Lanes:** 4 lanes total (2 in each direction)
- **Lane Width:** 50 pixels each
- **Lane Numbers:**
  - Lane 0: Leftmost (-75 from center)
  - Lane 1: Center-left (-25 from center)
  - Lane 2: Center-right (+25 from center)
  - Lane 3: Rightmost (+75 from center)

## Car Navigation API

### Check if on a road
```javascript
const result = roadSystem.isOnRoad(carX, carY);
if (result.onRoad) {
    console.log("Car is on road:", result.road);
}
```

### Get lane center position
```javascript
const laneInfo = roadSystem.getLaneCenter(carX, carY, laneNumber);
if (laneInfo) {
    // laneInfo.x, laneInfo.y = center of lane
    // laneInfo.angle = road direction
}
```

### Check if at intersection
```javascript
const result = roadSystem.isAtIntersection(carX, carY);
if (result.atIntersection) {
    console.log("Distance to intersection:", result.distance);
    // Stop or yield logic here
}
```

## Rendering

The road system handles all rendering automatically:

```javascript
// In your draw loop:
roadSystem.draw(ctx);           // Draw road surfaces
roadSystem.drawMarkings(ctx);   // Draw lane markings (call after lighting)
```

## Example: Lane Following AI

```javascript
function updateCarAI(car) {
    // Get current lane center
    const target = roadSystem.getLaneCenter(car.x, car.y, car.targetLane);
    
    if (target) {
        // Steer toward lane center
        const dx = target.x - car.x;
        const dy = target.y - car.y;
        const targetAngle = Math.atan2(dy, dx);
        
        // Smooth steering
        let angleDiff = targetAngle - car.angle;
        while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
        while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
        
        car.angle += angleDiff * 0.1;
    }
    
    // Check for intersection
    const intersection = roadSystem.isAtIntersection(car.x, car.y, 100);
    if (intersection.atIntersection && intersection.distance < 50) {
        car.speed *= 0.95; // Slow down
    }
}
```

## Visual Design

All roads automatically include:
- Dark asphalt surface (#050505)
- Shoulder strips (#0f0f0f)
- Yellow dashed center line
- White dashed lane dividers
- White solid edge lines
- Intersection stop lines

Everything is consistent and automatic!

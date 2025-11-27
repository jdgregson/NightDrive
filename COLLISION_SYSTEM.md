# Collision System Documentation

## Car Bounding Box

All collision detection for cars MUST use the red bounding box that is visually rendered around each car.

### Bounding Box Definition
- Located in: `src/js/physics.js`
- Function: `getCarCorners(carObj, COLLISION_WIDTH_BUFFER, COLLISION_HEIGHT_BUFFER)`
- Constants:
  - `COLLISION_WIDTH_BUFFER = 50` (adds 50px to width)
  - `COLLISION_HEIGHT_BUFFER = -50` (subtracts 50px from height)

### Visual Reference
The red rectangle drawn around each car represents the EXACT collision boundaries.

### Usage Rules
1. **Car-to-Car Collisions**: Use `checkCarToCarCollision()` which uses the buffered bounding box
2. **Car-to-Building Collisions**: Use `checkCollision()` which uses the buffered bounding box
3. **Car-to-Object Collisions**: MUST check if any corner of the bounding box intersects with objects
4. **DO NOT** use simple distance checks from car center (car.x, car.y) - this is WRONG
5. **ALWAYS** use `getCarCorners(car, COLLISION_WIDTH_BUFFER, COLLISION_HEIGHT_BUFFER)` to get collision points

### Car Orientation
- Car center: `car.x`, `car.y`
- Front of car: Direction of `car.angle` (yellow headlights point forward)
- At game start: Front faces EAST (angle = 0)
- The bounding box rotates with the car based on `car.angle`

## Important Notes for AI Assistants
- The car's visual center and collision box center are the same point
- The collision box extends beyond the visual car sprite
- All collision checks must account for car rotation using the corner-based system
- Never use radius-based collision detection for cars

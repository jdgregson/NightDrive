// Road System - Centralized road and intersection management

const LANE_WIDTH = 50;
const ROAD_WIDTH = 240; // 4 lanes total (2 each direction)
const HALF_ROAD = ROAD_WIDTH / 2;

class RoadSystem {
    constructor() {
        this.roads = [];
        this.intersections = [];
    }

    // Add a road segment: start point, end point
    addRoad(x1, y1, x2, y2) {
        const dx = x2 - x1;
        const dy = y2 - y1;
        const length = Math.sqrt(dx * dx + dy * dy);
        const angle = Math.atan2(dy, dx);

        this.roads.push({
            x1, y1, x2, y2,
            centerX: (x1 + x2) / 2,
            centerY: (y1 + y2) / 2,
            length,
            angle,
            width: ROAD_WIDTH
        });
    }

    // Auto-detect and create intersections where roads cross
    buildIntersections() {
        this.intersections = [];

        for (let i = 0; i < this.roads.length; i++) {
            for (let j = i + 1; j < this.roads.length; j++) {
                const intersection = this.findIntersection(this.roads[i], this.roads[j]);
                if (intersection) {
                    this.intersections.push(intersection);
                }
            }
        }
    }

    findIntersection(road1, road2) {
        const x1 = road1.x1, y1 = road1.y1, x2 = road1.x2, y2 = road1.y2;
        const x3 = road2.x1, y3 = road2.y1, x4 = road2.x2, y4 = road2.y2;

        const denom = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);
        if (Math.abs(denom) < 0.001) return null; // Parallel

        const t = ((x1 - x3) * (y3 - y4) - (y1 - y3) * (x3 - x4)) / denom;
        const u = -((x1 - x2) * (y1 - y3) - (y1 - y2) * (x1 - x3)) / denom;

        if (t >= 0 && t <= 1 && u >= 0 && u <= 1) {
            return {
                x: x1 + t * (x2 - x1),
                y: y1 + t * (y2 - y1),
                size: ROAD_WIDTH,
                roads: [road1, road2]
            };
        }
        return null;
    }

    // Check if point is on any road
    isOnRoad(x, y) {
        for (const road of this.roads) {
            if (this.isPointOnRoad(x, y, road)) {
                return { onRoad: true, road };
            }
        }
        return { onRoad: false };
    }

    isPointOnRoad(x, y, road) {
        const dx = x - road.centerX;
        const dy = y - road.centerY;
        const rotX = dx * Math.cos(-road.angle) - dy * Math.sin(-road.angle);
        const rotY = dx * Math.sin(-road.angle) + dy * Math.cos(-road.angle);

        return Math.abs(rotX) <= road.length / 2 && Math.abs(rotY) <= HALF_ROAD;
    }

    // Get lane center for a car to follow
    getLaneCenter(x, y, laneNumber) {
        const result = this.isOnRoad(x, y);
        if (!result.onRoad) return null;

        const road = result.road;
        const laneOffset = this.getLaneOffset(laneNumber);

        // Project point onto road centerline
        const dx = x - road.centerX;
        const dy = y - road.centerY;
        const alongRoad = dx * Math.cos(road.angle) + dy * Math.sin(road.angle);

        const centerX = road.centerX + alongRoad * Math.cos(road.angle);
        const centerY = road.centerY + alongRoad * Math.sin(road.angle);

        // Offset perpendicular to road for lane
        const perpAngle = road.angle + Math.PI / 2;
        return {
            x: centerX + laneOffset * Math.cos(perpAngle),
            y: centerY + laneOffset * Math.sin(perpAngle),
            angle: road.angle
        };
    }

    getLaneOffset(laneNumber) {
        // Lane 0: -75, Lane 1: -25, Lane 2: 25, Lane 3: 75
        return -75 + laneNumber * 50;
    }

    // Get lane assistance - adjusts steering to guide toward nearest lane center
    getLaneAssist(car) {
        const result = this.isOnRoad(car.x, car.y);
        if (!result.onRoad) {
            car.laneAssistTimer = 0;
            return null;
        }
        
        const road = result.road;
        
        // Check if car is aligned with road direction (either direction)
        let angleDiff = car.angle - road.angle;
        while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
        while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
        
        // Check both forward and reverse direction
        const alignedForward = Math.abs(angleDiff) < Math.PI / 6;
        const alignedReverse = Math.abs(Math.abs(angleDiff) - Math.PI) < Math.PI / 6;
        
        if (!alignedForward && !alignedReverse) {
            car.laneAssistTimer = 0;
            return null;
        }
        
        const dx = car.x - road.centerX;
        const dy = car.y - road.centerY;
        let perpDist = -dx * Math.sin(road.angle) + dy * Math.cos(road.angle);
        
        // Flip perpendicular distance if going reverse direction
        if (alignedReverse) {
            perpDist = -perpDist;
        }
        
        // Find nearest lane center
        const lanes = [-75, -25, 25, 75];
        let nearestLane = lanes[0];
        let minDist = Math.abs(perpDist - lanes[0]);
        for (const lane of lanes) {
            const dist = Math.abs(perpDist - lane);
            if (dist < minDist) {
                minDist = dist;
                nearestLane = lane;
            }
        }
        
        if (minDist < 40) {
            if (!car.laneAssistTimer) car.laneAssistTimer = 0;
            car.laneAssistTimer++;
            
            // Only assist after 60 frames (~1 second at 60fps)
            if (car.laneAssistTimer > 60) {
                const offsetFromLane = perpDist - nearestLane;
                const correctionAngle = -Math.atan2(offsetFromLane, 100);
                const effectiveRoadAngle = alignedReverse ? road.angle + Math.PI : road.angle;
                return { roadAngle: effectiveRoadAngle, correctionAngle, strength: 1 - minDist / 40 };
            }
        } else {
            car.laneAssistTimer = 0;
        }
        return null;
    }

    // Check if car is at an intersection
    isAtIntersection(x, y, threshold = 150) {
        for (const intersection of this.intersections) {
            const dist = Math.sqrt((x - intersection.x) ** 2 + (y - intersection.y) ** 2);
            if (dist < threshold) {
                return { atIntersection: true, intersection, distance: dist };
            }
        }
        return { atIntersection: false };
    }

    // Render all roads
    draw(ctx) {
        // Draw road surfaces
        for (const road of this.roads) {
            ctx.save();
            ctx.translate(road.centerX, road.centerY);
            ctx.rotate(road.angle);

            const hl = road.length / 2;
            const hw = HALF_ROAD;

            // Shoulders
            ctx.fillStyle = '#0f0f0f';
            ctx.fillRect(-hl, -hw - 20, road.length, 20);
            ctx.fillRect(-hl, hw, road.length, 20);

            // Road surface
            ctx.fillStyle = '#050505';
            ctx.fillRect(-hl, -hw, road.length, ROAD_WIDTH);

            ctx.restore();
        }

        // Draw intersections
        for (const intersection of this.intersections) {
            const half = intersection.size / 2;

            // Intersection surface
            ctx.fillStyle = '#050505';
            ctx.fillRect(intersection.x - half, intersection.y - half, intersection.size, intersection.size);

            // Crosswalks (zebra stripes spanning full intersection)
            ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
            const stripeWidth = 8;
            const stripeGap = 8;
            const stripeUnit = stripeWidth + stripeGap;
            
            // Calculate centered offset (drop first and last stripe)
            const numStripes = Math.floor(intersection.size / stripeUnit) - 2;
            const totalWidth = numStripes * stripeUnit - stripeGap;
            const offset = (intersection.size - totalWidth) / 2;

            // Top crosswalk
            for (let i = -half + offset; i <= half - offset - stripeWidth; i += stripeUnit) {
                ctx.fillRect(intersection.x + i, intersection.y - half, stripeWidth, 20);
            }
            // Bottom crosswalk
            for (let i = -half + offset; i <= half - offset - stripeWidth; i += stripeUnit) {
                ctx.fillRect(intersection.x + i, intersection.y + half - 20, stripeWidth, 20);
            }
            // Left crosswalk
            for (let i = -half + offset; i <= half - offset - stripeWidth; i += stripeUnit) {
                ctx.fillRect(intersection.x - half, intersection.y + i, 20, stripeWidth);
            }
            // Right crosswalk
            for (let i = -half + offset; i <= half - offset - stripeWidth; i += stripeUnit) {
                ctx.fillRect(intersection.x + half - 20, intersection.y + i, 20, stripeWidth);
            }
        }
    }

    // Render lane markings
    drawMarkings(ctx) {
        ctx.globalCompositeOperation = 'lighter';

        for (const road of this.roads) {
            // Draw markings in segments, skipping intersections
            this.drawRoadSegmentMarkings(ctx, road);
        }

        // Intersection stop lines (only on approach side)
        for (const intersection of this.intersections) {
            const half = intersection.size / 2;
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
            ctx.lineWidth = 4;
            ctx.setLineDash([]);

            // Stop lines only on near side of each approach (right-hand lanes only)
            // Top approach (coming from north) - right side lanes
            ctx.beginPath();
            ctx.moveTo(intersection.x - 100, intersection.y - half - 5);
            ctx.lineTo(intersection.x, intersection.y - half - 5);
            ctx.stroke();

            // Bottom approach (coming from south) - right side lanes
            ctx.beginPath();
            ctx.moveTo(intersection.x, intersection.y + half + 5);
            ctx.lineTo(intersection.x + 100, intersection.y + half + 5);
            ctx.stroke();

            // Left approach (coming from west) - right side lanes
            ctx.beginPath();
            ctx.moveTo(intersection.x - half - 5, intersection.y + 100);
            ctx.lineTo(intersection.x - half - 5, intersection.y);
            ctx.stroke();

            // Right approach (coming from east) - right side lanes
            ctx.beginPath();
            ctx.moveTo(intersection.x + half + 5, intersection.y);
            ctx.lineTo(intersection.x + half + 5, intersection.y - 100);
            ctx.stroke();
        }

        ctx.globalCompositeOperation = 'source-over';
    }

    drawRoadSegmentMarkings(ctx, road) {
        // Find intersections on this road
        const roadIntersections = this.intersections.filter(i =>
            i.roads.includes(road)
        );

        // Sort intersections by distance along road
        roadIntersections.sort((a, b) => {
            const distA = (a.x - road.x1) * Math.cos(road.angle) + (a.y - road.y1) * Math.sin(road.angle);
            const distB = (b.x - road.x1) * Math.cos(road.angle) + (b.y - road.y1) * Math.sin(road.angle);
            return distA - distB;
        });

        ctx.save();
        ctx.translate(road.centerX, road.centerY);
        ctx.rotate(road.angle);

        const hl = road.length / 2;
        const segments = [];

        // Build segments between intersections
        let lastEnd = -hl + 20;
        for (const intersection of roadIntersections) {
            const distFromCenter = (intersection.x - road.centerX) * Math.cos(road.angle) +
                                   (intersection.y - road.centerY) * Math.sin(road.angle);
            const segStart = lastEnd;
            const segEnd = distFromCenter - intersection.size / 2 - 5;
            if (segEnd > segStart) {
                segments.push({ start: segStart, end: segEnd });
            }
            lastEnd = distFromCenter + intersection.size / 2 + 5;
        }
        segments.push({ start: lastEnd, end: hl - 20 });

        // Draw markings for each segment
        for (const seg of segments) {
            // Center yellow dashed line
            ctx.strokeStyle = 'rgba(255, 200, 0, 0.3)';
            ctx.lineWidth = 2;
            ctx.setLineDash([20, 15]);
            ctx.beginPath();
            ctx.moveTo(seg.start, 0);
            ctx.lineTo(seg.end, 0);
            ctx.stroke();

            // Lane dividers (white dashed)
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
            ctx.lineWidth = 2;
            ctx.setLineDash([15, 10]);
            ctx.beginPath();
            ctx.moveTo(seg.start, -50);
            ctx.lineTo(seg.end, -50);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(seg.start, 50);
            ctx.lineTo(seg.end, 50);
            ctx.stroke();

            // Edge lines (white solid)
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
            ctx.lineWidth = 3;
            ctx.setLineDash([]);
            ctx.beginPath();
            ctx.moveTo(seg.start, -100);
            ctx.lineTo(seg.end, -100);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(seg.start, 100);
            ctx.lineTo(seg.end, 100);
            ctx.stroke();
        }

        ctx.restore();
    }
}

// Global road system instance
const roadSystem = new RoadSystem();

// Initialize roads - simple coordinate-based definition
function initializeRoads() {
    // Main grid - 3x3 intersections with larger blocks
    // Horizontal roads
    roadSystem.addRoad(-2400, -1200, 2400, -1200);
    roadSystem.addRoad(-2400, 0, 2400, 0);
    roadSystem.addRoad(-2400, 1200, 2400, 1200);
    
    // Vertical roads
    roadSystem.addRoad(-1200, -2400, -1200, 2400);
    roadSystem.addRoad(0, -2400, 0, 2400);
    roadSystem.addRoad(1200, -2400, 1200, 2400);
    
    // Auto-detect intersections
    roadSystem.buildIntersections();
}

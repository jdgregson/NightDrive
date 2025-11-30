// Road System - Centralized road and intersection management

const LANE_WIDTH = 50;
const ROAD_WIDTH_4LANE = 240;
const ROAD_WIDTH_2LANE = 120;
const ROAD_WIDTH_DIRT = 80;

const ROAD_TYPES = {
    FOUR_LANE: { width: 240, lanes: [-75, -25, 25, 75], color: '#050505', edgeColor: '#0f0f0f' },
    TWO_LANE: { width: 120, lanes: [-30, 30], color: '#050505', edgeColor: '#050505' },
    DIRT: { width: 80, lanes: [0], color: '#3a2a1a', edgeColor: '#2a1a0a' }
};

class RoadSystem {
    constructor() {
        this.roads = [];
        this.intersections = [];
    }

    // Add a road segment: start point, end point, type
    addRoad(x1, y1, x2, y2, type = 'FOUR_LANE') {
        const dx = x2 - x1;
        const dy = y2 - y1;
        const length = Math.sqrt(dx * dx + dy * dy);
        const angle = Math.atan2(dy, dx);
        const roadType = ROAD_TYPES[type];

        this.roads.push({
            x1, y1, x2, y2,
            centerX: (x1 + x2) / 2,
            centerY: (y1 + y2) / 2,
            length,
            angle,
            width: roadType.width,
            type,
            roadType,
            isCurved: false
        });
    }

    // Add a curved road: center point, radius, start angle, end angle, type
    addCurvedRoad(centerX, centerY, radius, startAngle, endAngle, type = 'FOUR_LANE') {
        const roadType = ROAD_TYPES[type];
        const arcLength = Math.abs(endAngle - startAngle) * radius;

        this.roads.push({
            isCurved: true,
            centerX, centerY,
            radius,
            startAngle,
            endAngle,
            arcLength,
            width: roadType.width,
            type,
            roadType
        });
    }

    // Add a merge road that transitions from one width to another
    addMerge(x1, y1, x2, y2, startType = 'FOUR_LANE', endType = 'TWO_LANE') {
        const dx = x2 - x1;
        const dy = y2 - y1;
        const length = Math.sqrt(dx * dx + dy * dy);
        const angle = Math.atan2(dy, dx);
        const startWidth = ROAD_TYPES[startType].width;
        const endWidth = ROAD_TYPES[endType].width;

        this.roads.push({
            x1, y1, x2, y2,
            centerX: (x1 + x2) / 2,
            centerY: (y1 + y2) / 2,
            length,
            angle,
            width: startWidth,
            startWidth,
            endWidth,
            type: startType,
            endType,
            roadType: ROAD_TYPES[startType],
            endRoadType: ROAD_TYPES[endType],
            isMerge: true
        });
    }

    // Add a path-based road with multiple segments (straight and curved)
    addPath(points, type = 'FOUR_LANE') {
        const roadType = ROAD_TYPES[type];
        const segments = [];
        let totalLength = 0;

        for (let i = 0; i < points.length - 1; i++) {
            const p0 = points[Math.max(0, i - 1)];
            const p1 = points[i];
            const p2 = points[i + 1];
            const p3 = points[Math.min(points.length - 1, i + 2)];

            // Check if segment crosses a 4-lane road (within 50 units of grid lines)
            const crossesVertical = (Math.abs(p1.x - 1200) < 50 && Math.abs(p2.x - 1200) < 50) ||
                                   (Math.abs(p1.x - 0) < 50 && Math.abs(p2.x - 0) < 50) ||
                                   (Math.abs(p1.x - (-1200)) < 50 && Math.abs(p2.x - (-1200)) < 50);
            const crossesHorizontal = (Math.abs(p1.y - 1200) < 50 && Math.abs(p2.y - 1200) < 50) ||
                                     (Math.abs(p1.y - 0) < 50 && Math.abs(p2.y - 0) < 50) ||
                                     (Math.abs(p1.y - (-1200)) < 50 && Math.abs(p2.y - (-1200)) < 50);

            let cp1, cp2;
            if (i === 0 || crossesVertical || crossesHorizontal) {
                // Straight segment
                cp1 = { x: p1.x + (p2.x - p1.x) * 0.33, y: p1.y + (p2.y - p1.y) * 0.33 };
                cp2 = { x: p2.x - (p2.x - p1.x) * 0.33, y: p2.y - (p2.y - p1.y) * 0.33 };
            } else if (i === points.length - 2) {
                // Straight end
                cp1 = { x: p1.x + (p2.x - p1.x) * 0.33, y: p1.y + (p2.y - p1.y) * 0.33 };
                cp2 = { x: p2.x - (p2.x - p1.x) * 0.33, y: p2.y - (p2.y - p1.y) * 0.33 };
            } else {
                // Curved segment
                cp1 = { x: p1.x + (p2.x - p0.x) * 0.3, y: p1.y + (p2.y - p0.y) * 0.3 };
                cp2 = { x: p2.x - (p3.x - p1.x) * 0.3, y: p2.y - (p3.y - p1.y) * 0.3 };
            }

            const segment = {
                p1, p2, cp1, cp2,
                startDist: totalLength
            };

            segment.length = this.estimateBezierLength(segment.p1, segment.cp1, segment.cp2, segment.p2);
            totalLength += segment.length;
            segments.push(segment);
        }

        this.roads.push({
            isPath: true,
            segments,
            totalLength,
            width: roadType.width,
            type,
            roadType
        });
    }

    estimateBezierLength(p0, p1, p2, p3, steps = 20) {
        let length = 0;
        let prevX = p0.x, prevY = p0.y;
        for (let i = 1; i <= steps; i++) {
            const t = i / steps;
            const point = this.bezierPoint(p0, p1, p2, p3, t);
            length += Math.sqrt((point.x - prevX) ** 2 + (point.y - prevY) ** 2);
            prevX = point.x;
            prevY = point.y;
        }
        return length;
    }

    bezierPoint(p0, p1, p2, p3, t) {
        const mt = 1 - t;
        const mt2 = mt * mt;
        const mt3 = mt2 * mt;
        const t2 = t * t;
        const t3 = t2 * t;
        return {
            x: mt3 * p0.x + 3 * mt2 * t * p1.x + 3 * mt * t2 * p2.x + t3 * p3.x,
            y: mt3 * p0.y + 3 * mt2 * t * p1.y + 3 * mt * t2 * p2.y + t3 * p3.y
        };
    }

    bezierTangent(p0, p1, p2, p3, t) {
        const mt = 1 - t;
        const mt2 = mt * mt;
        const t2 = t * t;
        const dx = 3 * mt2 * (p1.x - p0.x) + 6 * mt * t * (p2.x - p1.x) + 3 * t2 * (p3.x - p2.x);
        const dy = 3 * mt2 * (p1.y - p0.y) + 6 * mt * t * (p2.y - p1.y) + 3 * t2 * (p3.y - p2.y);
        return Math.atan2(dy, dx);
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

    findPathIntersection(path1, path2) {
        // Check for crossings
        for (const seg1 of path1.segments) {
            for (const seg2 of path2.segments) {
                const samples = 10;
                for (let i = 0; i < samples; i++) {
                    const t1 = i / samples;
                    const p1 = this.bezierPoint(seg1.p1, seg1.cp1, seg1.cp2, seg1.p2, t1);
                    const p1Next = this.bezierPoint(seg1.p1, seg1.cp1, seg1.cp2, seg1.p2, (i + 1) / samples);

                    for (let k = 0; k < samples; k++) {
                        const t2 = k / samples;
                        const p2 = this.bezierPoint(seg2.p1, seg2.cp1, seg2.cp2, seg2.p2, t2);
                        const p2Next = this.bezierPoint(seg2.p1, seg2.cp1, seg2.cp2, seg2.p2, (k + 1) / samples);

                        const intersection = this.lineSegmentIntersection(p1.x, p1.y, p1Next.x, p1Next.y, p2.x, p2.y, p2Next.x, p2Next.y);
                        if (intersection) {
                            const bothTwoLane = path1.type === 'TWO_LANE' && path2.type === 'TWO_LANE';
                            const angle1 = this.bezierTangent(seg1.p1, seg1.cp1, seg1.cp2, seg1.p2, t1);
                            return {
                                x: intersection.x,
                                y: intersection.y,
                                // ADJUST THIS to change intersection grey box size (path1.width is 120 for TWO_LANE)
                                size: bothTwoLane ? path1.width: Math.max(path1.width, path2.width), // <-- Change path1.width to a number like 140
                                type: bothTwoLane ? 'FULL' : 'PATH_CROSS',
                                roads: [path1, path2],
                                angle: bothTwoLane ? angle1 : undefined
                            };
                        }
                    }
                }
            }
        }

        // Check for T-junctions and 4-way intersections (endpoints near each other)
        const endpoints = [
            { path: path1, point: path1.segments[0].p1, seg: path1.segments[0], t: 0 },
            { path: path1, point: path1.segments[path1.segments.length - 1].p2, seg: path1.segments[path1.segments.length - 1], t: 1 },
            { path: path2, point: path2.segments[0].p1, seg: path2.segments[0], t: 0 },
            { path: path2, point: path2.segments[path2.segments.length - 1].p2, seg: path2.segments[path2.segments.length - 1], t: 1 }
        ];

        // Check for 4-way intersection (both endpoints of one path near both endpoints of another)
        const path1Endpoints = [endpoints[0], endpoints[1]];
        const path2Endpoints = [endpoints[2], endpoints[3]];

        let path1Near = 0, path2Near = 0;
        let avgX = 0, avgY = 0, count = 0;
        let angleSum = 0, angleCount = 0;

        for (const ep1 of path1Endpoints) {
            for (const ep2 of path2Endpoints) {
                const dist = Math.hypot(ep1.point.x - ep2.point.x, ep1.point.y - ep2.point.y);
                if (dist < 150) {
                    avgX += ep1.point.x + ep2.point.x;
                    avgY += ep1.point.y + ep2.point.y;
                    count += 2;
                    if (ep1 === path1Endpoints[0] || ep1 === path1Endpoints[1]) {
                        path1Near++;
                        angleSum += this.bezierTangent(ep1.seg.p1, ep1.seg.cp1, ep1.seg.cp2, ep1.seg.p2, ep1.t);
                        angleCount++;
                    }
                    if (ep2 === path2Endpoints[0] || ep2 === path2Endpoints[1]) path2Near++;
                }
            }
        }

        // If both endpoints of both paths are near each other, it's a 4-way intersection
        if (path1Near >= 2 && path2Near >= 2 && count >= 4) {
            const bothTwoLane = path1.type === 'TWO_LANE' && path2.type === 'TWO_LANE';
            return {
                x: avgX / count,
                y: avgY / count,
                // ADJUST THIS to change intersection grey box size (path1.width is 120 for TWO_LANE)
                size: bothTwoLane ? path1.width : Math.max(path1.width, path2.width), // <-- Change path1.width to a number like 140
                type: bothTwoLane ? 'FULL' : 'PATH_CROSS',
                roads: [path1, path2],
                angle: bothTwoLane && angleCount > 0 ? angleSum / angleCount : undefined
            };
        }

        // Check for T-junctions (single endpoint pairs)
        for (let i = 0; i < endpoints.length; i++) {
            for (let j = i + 1; j < endpoints.length; j++) {
                if (endpoints[i].path === endpoints[j].path) continue;
                const dist = Math.hypot(endpoints[i].point.x - endpoints[j].point.x, endpoints[i].point.y - endpoints[j].point.y);
                if (dist < 150) {
                    const bothTwoLane = path1.type === 'TWO_LANE' && path2.type === 'TWO_LANE';
                    const angle1 = this.bezierTangent(endpoints[i].seg.p1, endpoints[i].seg.cp1, endpoints[i].seg.cp2, endpoints[i].seg.p2, endpoints[i].t);
                    const angle2 = this.bezierTangent(endpoints[j].seg.p1, endpoints[j].seg.cp1, endpoints[j].seg.cp2, endpoints[j].seg.p2, endpoints[j].t);
                    return {
                        x: (endpoints[i].point.x + endpoints[j].point.x) / 2,
                        y: (endpoints[i].point.y + endpoints[j].point.y) / 2,
                        size: bothTwoLane ? path1.width : Math.max(path1.width, path2.width),
                        type: bothTwoLane ? 'PATH_T' : 'PATH_T',
                        roads: [path1, path2],
                        angle: bothTwoLane ? (angle1 + angle2) / 2 : undefined
                    };
                }
            }
        }

        return null;
    }

    lineSegmentIntersection(x1, y1, x2, y2, x3, y3, x4, y4) {
        const denom = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);
        if (Math.abs(denom) < 0.001) return null;

        const t = ((x1 - x3) * (y3 - y4) - (y1 - y3) * (x3 - x4)) / denom;
        const u = -((x1 - x2) * (y1 - y3) - (y1 - y2) * (x1 - x3)) / denom;

        if (t >= 0 && t <= 1 && u >= 0 && u <= 1) {
            return {
                x: x1 + t * (x2 - x1),
                y: y1 + t * (y2 - y1)
            };
        }
        return null;
    }

    findIntersection(road1, road2) {
        if (road1.isPath && road2.isPath) {
            return this.findPathIntersection(road1, road2);
        }

        if (road1.isPath || road2.isPath || road1.isCurved || road2.isCurved || road1.isMerge || road2.isMerge) {
            return null;
        }

        const x1 = road1.x1, y1 = road1.y1, x2 = road1.x2, y2 = road1.y2;
        const x3 = road2.x1, y3 = road2.y1, x4 = road2.x2, y4 = road2.y2;

        const denom = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);
        if (Math.abs(denom) < 0.001) return null;

        const t = ((x1 - x3) * (y3 - y4) - (y1 - y3) * (x3 - x4)) / denom;
        const u = -((x1 - x2) * (y1 - y3) - (y1 - y2) * (x1 - x3)) / denom;

        if (t >= 0 && t <= 1 && u >= 0 && u <= 1) {
            const bothFourLane = road1.type === 'FOUR_LANE' && road2.type === 'FOUR_LANE';
            const bothTwoLane = road1.type === 'TWO_LANE' && road2.type === 'TWO_LANE';
            const intersectionType = (bothFourLane || bothTwoLane) ? 'FULL' : 'T_JUNCTION';
            const size = (bothFourLane || bothTwoLane) ? road1.width : Math.max(road1.width, road2.width);

            return {
                x: x1 + t * (x2 - x1),
                y: y1 + t * (y2 - y1),
                size,
                type: intersectionType,
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
        if (road.isCurved) {
            return this.isPointOnCurvedRoad(x, y, road);
        }
        if (road.isPath) {
            return this.isPointOnPath(x, y, road);
        }

        const dx = x - road.centerX;
        const dy = y - road.centerY;
        const rotX = dx * Math.cos(-road.angle) - dy * Math.sin(-road.angle);
        const rotY = dx * Math.sin(-road.angle) + dy * Math.cos(-road.angle);

        return Math.abs(rotX) <= road.length / 2 && Math.abs(rotY) <= road.width / 2;
    }

    isPointOnPath(x, y, road) {
        for (const seg of road.segments) {
            const closest = this.closestPointOnBezier(x, y, seg.p1, seg.cp1, seg.cp2, seg.p2);
            if (closest.distance < road.width / 2) {
                return true;
            }
        }
        return false;
    }

    closestPointOnBezier(x, y, p0, p1, p2, p3, samples = 20) {
        let minDist = Infinity;
        let bestT = 0;
        for (let i = 0; i <= samples; i++) {
            const t = i / samples;
            const point = this.bezierPoint(p0, p1, p2, p3, t);
            const dist = Math.sqrt((x - point.x) ** 2 + (y - point.y) ** 2);
            if (dist < minDist) {
                minDist = dist;
                bestT = t;
            }
        }
        return { t: bestT, distance: minDist };
    }

    isPointOnCurvedRoad(x, y, road) {
        const dx = x - road.centerX;
        const dy = y - road.centerY;
        const distFromCenter = Math.sqrt(dx * dx + dy * dy);
        const angle = Math.atan2(dy, dx);

        // Check if within road width
        if (Math.abs(distFromCenter - road.radius) > road.width / 2) return false;

        // Normalize angle to check if within arc range
        let normalizedAngle = angle;
        let start = road.startAngle;
        let end = road.endAngle;

        // Handle angle wrapping
        while (normalizedAngle < start) normalizedAngle += Math.PI * 2;
        while (normalizedAngle > start + Math.PI * 2) normalizedAngle -= Math.PI * 2;

        if (end > start) {
            return normalizedAngle >= start && normalizedAngle <= end;
        } else {
            return normalizedAngle >= start || normalizedAngle <= end;
        }
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

    getLaneOffset(laneNumber, road) {
        const lanes = road.roadType.lanes;
        return lanes[Math.min(laneNumber, lanes.length - 1)];
    }

    // Get lane assistance - adjusts steering to guide toward nearest lane center
    getLaneAssist(car) {
        const result = this.isOnRoad(car.x, car.y);
        if (!result.onRoad) {
            car.laneAssistTimer = 0;
            return null;
        }

        const road = result.road;
        let roadAngle, perpDist;

        if (road.isPath) {
            const pathInfo = this.getPathInfo(car.x, car.y, road);
            if (!pathInfo) return null;
            roadAngle = pathInfo.angle;
            perpDist = pathInfo.perpDist;
        } else if (road.isCurved) {
            const dx = car.x - road.centerX;
            const dy = car.y - road.centerY;
            const angle = Math.atan2(dy, dx);
            roadAngle = angle + Math.PI / 2;
            perpDist = (Math.sqrt(dx * dx + dy * dy) - road.radius);
        } else {
            roadAngle = road.angle;
            const dx = car.x - road.centerX;
            const dy = car.y - road.centerY;
            perpDist = -dx * Math.sin(road.angle) + dy * Math.cos(road.angle);
        }

        // Check if car is aligned with road direction
        let angleDiff = car.angle - roadAngle;
        while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
        while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;

        const alignedForward = Math.abs(angleDiff) < Math.PI / 6;
        const alignedReverse = Math.abs(Math.abs(angleDiff) - Math.PI) < Math.PI / 6;

        if (!alignedForward && !alignedReverse) {
            car.laneAssistTimer = 0;
            return null;
        }

        if (alignedReverse) perpDist = -perpDist;

        // Find nearest lane center
        const lanes = road.roadType.lanes;
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

            if (car.laneAssistTimer > 30) {
                const offsetFromLane = perpDist - nearestLane;
                const correctionAngle = -Math.atan2(offsetFromLane, 150);
                const effectiveRoadAngle = alignedReverse ? roadAngle + Math.PI : roadAngle;
                return { roadAngle: effectiveRoadAngle, correctionAngle, strength: 1 - minDist / 40 };
            }
        } else {
            car.laneAssistTimer = 0;
        }
        return null;
    }

    getPathInfo(x, y, road) {
        let bestSeg = null;
        let bestT = 0;
        let minDist = Infinity;

        for (const seg of road.segments) {
            const closest = this.closestPointOnBezier(x, y, seg.p1, seg.cp1, seg.cp2, seg.p2);
            if (closest.distance < minDist) {
                minDist = closest.distance;
                bestT = closest.t;
                bestSeg = seg;
            }
        }

        if (!bestSeg) return null;

        const angle = this.bezierTangent(bestSeg.p1, bestSeg.cp1, bestSeg.cp2, bestSeg.p2, bestT);
        const point = this.bezierPoint(bestSeg.p1, bestSeg.cp1, bestSeg.cp2, bestSeg.p2, bestT);
        const dx = x - point.x;
        const dy = y - point.y;
        const perpDist = -dx * Math.sin(angle) + dy * Math.cos(angle);

        return { angle, perpDist, point };
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
        // Draw path roads first (underneath everything)
        for (const road of this.roads) {
            if (road.isPath) {
                this.drawPathRoad(ctx, road);
            }
        }

        // Draw 4-lane and curved road surfaces
        for (const road of this.roads) {
            if (road.isCurved) {
                this.drawCurvedRoad(ctx, road);
                continue;
            }
            if (road.isPath) {
                continue;
            }
            if (road.isMerge) {
                this.drawMergeRoad(ctx, road);
                continue;
            }

            const roadIntersections = this.intersections.filter(i => i.roads.includes(road));
            const tJunctions = roadIntersections.filter(i => i.type === 'T_JUNCTION');
            const fullIntersections = roadIntersections.filter(i => i.type === 'FULL');

            ctx.save();
            ctx.translate(road.centerX, road.centerY);
            ctx.rotate(road.angle);

            const hl = road.length / 2;
            const hw = road.width / 2;

            // Clip smaller roads at T-junctions and shoulders at full intersections
            if (tJunctions.length > 0 || fullIntersections.length > 0) {
                ctx.beginPath();
                ctx.rect(-hl, -hw - 20, road.length, road.width + 40);

                for (const tj of tJunctions) {
                    const [road1, road2] = tj.roads;
                    const smallerRoad = road1.width < road2.width ? road1 : road2;

                    if (smallerRoad === road) {
                        const largerRoad = road1.width >= road2.width ? road1 : road2;
                        const distFromCenter = (tj.x - road.centerX) * Math.cos(road.angle) + (tj.y - road.centerY) * Math.sin(road.angle);
                        const clipHalf = largerRoad.width / 2;
                        ctx.rect(distFromCenter - clipHalf, -hw - 20, clipHalf * 2, road.width + 40);
                    }
                }

                for (const fi of fullIntersections) {
                    const distFromCenter = (fi.x - road.centerX) * Math.cos(road.angle) + (fi.y - road.centerY) * Math.sin(road.angle);
                    const clipHalf = fi.size / 2;
                    ctx.rect(distFromCenter - clipHalf, -hw - 20, clipHalf * 2, 20);
                    ctx.rect(distFromCenter - clipHalf, hw, clipHalf * 2, 20);
                }
                ctx.clip('evenodd');
            }

            // Shoulders
            ctx.fillStyle = road.roadType.edgeColor;
            ctx.fillRect(-hl, -hw - 20, road.length, 20);
            ctx.fillRect(-hl, hw, road.length, 20);

            // Road surface
            ctx.fillStyle = road.roadType.color;
            ctx.fillRect(-hl, -hw, road.length, road.width);

            ctx.restore();
        }

        // Draw intersections
        for (const intersection of this.intersections) {
            if (intersection.type === 'FULL' && intersection.angle !== undefined) {
                // ADJUST intersection.size HERE to change the grey box size for rotated two-lane intersections
                const size = typeof debugConfig !== 'undefined' ? debugConfig.intersectionSize : intersection.size;
                const angle = intersection.angle + (typeof debugConfig !== 'undefined' ? debugConfig.angleOffset : 0);
                const half = size / 2; // <-- Change intersection.size in findPathIntersection() function
                ctx.save();
                ctx.translate(intersection.x, intersection.y);
                ctx.rotate(angle);
                ctx.fillStyle = '#1a1a1a';
                ctx.fillRect(-half, -half, size, size);
                ctx.restore();
            } else if ((intersection.type === 'PATH_CROSS' || intersection.type === 'PATH_T') && intersection.roads.every(r => r.type === 'TWO_LANE')) {
                // ADJUST intersection.size HERE to change the grey box size for non-rotated two-lane intersections
                const half = intersection.size / 2; // <-- Change intersection.size in findPathIntersection() function
                ctx.fillStyle = '#050505';
                ctx.fillRect(intersection.x - half, intersection.y - half, intersection.size, intersection.size);
            } else if (intersection.type === 'PATH_CROSS' || intersection.type === 'PATH_T') {
                const half = intersection.size / 2;
                ctx.fillStyle = '#050505';
                ctx.beginPath();
                ctx.arc(intersection.x, intersection.y, half, 0, Math.PI * 2);
                ctx.fill();
            } else if (intersection.type === 'FULL') {
                const half = intersection.size / 2;

                // Intersection surface
                ctx.fillStyle = '#050505';
                ctx.fillRect(intersection.x - half, intersection.y - half, intersection.size, intersection.size);

                // Crosswalks (zebra stripes spanning full intersection)
                if (intersection.angle === undefined || intersection.type === 'FULL') {
                    ctx.save();
                    ctx.translate(intersection.x, intersection.y);
                    if (intersection.angle !== undefined) ctx.rotate(intersection.angle);

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
                        ctx.fillRect(i, -half, stripeWidth, 20);
                    }
                    // Bottom crosswalk
                    for (let i = -half + offset; i <= half - offset - stripeWidth; i += stripeUnit) {
                        ctx.fillRect(i, half - 20, stripeWidth, 20);
                    }
                    // Left crosswalk
                    for (let i = -half + offset; i <= half - offset - stripeWidth; i += stripeUnit) {
                        ctx.fillRect(-half, i, 20, stripeWidth);
                    }
                    // Right crosswalk
                    for (let i = -half + offset; i <= half - offset - stripeWidth; i += stripeUnit) {
                        ctx.fillRect(half - 20, i, 20, stripeWidth);
                    }

                    ctx.restore();
                }
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

        // Intersection stop lines
        for (const intersection of this.intersections) {
            if (intersection.type === 'FULL' && intersection.angle !== undefined) {
                const half = intersection.size / 2;
                ctx.save();
                ctx.translate(intersection.x, intersection.y);
                ctx.rotate(intersection.angle);
                ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
                ctx.lineWidth = 4;
                ctx.setLineDash([]);

                ctx.beginPath();
                ctx.moveTo(-60, -half - 5);
                ctx.lineTo(0, -half - 5);
                ctx.stroke();

                ctx.beginPath();
                ctx.moveTo(0, half + 5);
                ctx.lineTo(60, half + 5);
                ctx.stroke();

                ctx.beginPath();
                ctx.moveTo(-half - 5, 60);
                ctx.lineTo(-half - 5, 0);
                ctx.stroke();

                ctx.beginPath();
                ctx.moveTo(half + 5, 0);
                ctx.lineTo(half + 5, -60);
                ctx.stroke();

                ctx.restore();
            } else if (intersection.type === 'PATH_T' && intersection.angle !== undefined) {
                // No stop lines for T-junctions
                continue;
            } else if (intersection.type === 'FULL' || ((intersection.type === 'PATH_CROSS' || intersection.type === 'PATH_T') && intersection.roads.every(r => r.type === 'TWO_LANE'))) {
                const half = intersection.size / 2;
                ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
                ctx.lineWidth = 4;
                ctx.setLineDash([]);

                // Stop lines only on near side of each approach (right-hand lanes only)
                ctx.beginPath();
                ctx.moveTo(intersection.x - 100, intersection.y - half - 5);
                ctx.lineTo(intersection.x, intersection.y - half - 5);
                ctx.stroke();

                ctx.beginPath();
                ctx.moveTo(intersection.x, intersection.y + half + 5);
                ctx.lineTo(intersection.x + 100, intersection.y + half + 5);
                ctx.stroke();

                ctx.beginPath();
                ctx.moveTo(intersection.x - half - 5, intersection.y + 100);
                ctx.lineTo(intersection.x - half - 5, intersection.y);
                ctx.stroke();

                ctx.beginPath();
                ctx.moveTo(intersection.x + half + 5, intersection.y);
                ctx.lineTo(intersection.x + half + 5, intersection.y - 100);
                ctx.stroke();
            } else if (intersection.type === 'T_JUNCTION') {
                const [road1, road2] = intersection.roads;
                const half = intersection.size / 2;
                ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
                ctx.lineWidth = 4;
                ctx.setLineDash([]);

                // Determine which road continues through and which terminates
                const throughRoad = road1.width >= road2.width ? road1 : road2;
                const termRoad = road1.width < road2.width ? road1 : road2;

                const throughAngle = throughRoad.angle;
                const termAngle = termRoad.angle;

                // Normalize angles to determine orientation
                const isHorizontal = Math.abs(Math.cos(throughAngle)) > 0.7;
                const termFromLeft = Math.cos(termAngle) > 0.7;
                const termFromRight = Math.cos(termAngle) < -0.7;
                const termFromTop = Math.sin(termAngle) > 0.7;
                const termFromBottom = Math.sin(termAngle) < -0.7;

                if (isHorizontal) {
                    // Through road is horizontal, draw stop lines on left and right
                    ctx.beginPath();
                    ctx.moveTo(intersection.x - half - 5, intersection.y + 100);
                    ctx.lineTo(intersection.x - half - 5, intersection.y);
                    ctx.stroke();

                    ctx.beginPath();
                    ctx.moveTo(intersection.x + half + 5, intersection.y);
                    ctx.lineTo(intersection.x + half + 5, intersection.y - 100);
                    ctx.stroke();

                    // Draw stop line for terminating road
                    if (termFromTop) {
                        ctx.beginPath();
                        ctx.moveTo(intersection.x - 100, intersection.y - half - 5);
                        ctx.lineTo(intersection.x + 100, intersection.y - half - 5);
                        ctx.stroke();
                    } else if (termFromBottom) {
                        ctx.beginPath();
                        ctx.moveTo(intersection.x - 100, intersection.y + half + 5);
                        ctx.lineTo(intersection.x + 100, intersection.y + half + 5);
                        ctx.stroke();
                    }
                } else {
                    // Through road is vertical, draw stop lines on top and bottom
                    ctx.beginPath();
                    ctx.moveTo(intersection.x - 100, intersection.y - half - 5);
                    ctx.lineTo(intersection.x, intersection.y - half - 5);
                    ctx.stroke();

                    ctx.beginPath();
                    ctx.moveTo(intersection.x, intersection.y + half + 5);
                    ctx.lineTo(intersection.x + 100, intersection.y + half + 5);
                    ctx.stroke();

                    // Draw stop line for terminating road
                    if (termFromLeft) {
                        ctx.beginPath();
                        ctx.moveTo(intersection.x - half - 5, intersection.y - 100);
                        ctx.lineTo(intersection.x - half - 5, intersection.y + 100);
                        ctx.stroke();
                    } else if (termFromRight) {
                        ctx.beginPath();
                        ctx.moveTo(intersection.x + half + 5, intersection.y - 100);
                        ctx.lineTo(intersection.x + half + 5, intersection.y + 100);
                        ctx.stroke();
                    }
                }
            }
        }

        ctx.globalCompositeOperation = 'source-over';
    }

    drawPathRoad(ctx, road) {
        // Find intersections that involve this road
        const roadIntersections = this.intersections.filter(i => i.roads.includes(road));

        if (roadIntersections.length > 0 && road.type === 'TWO_LANE') {
            // For two-lane roads with intersections, clip shoulders at intersections
            const samples = 50;
            const pathPoints = [];

            // Sample points along the path
            for (const seg of road.segments) {
                for (let i = 0; i <= samples; i++) {
                    const t = i / samples;
                    const point = this.bezierPoint(seg.p1, seg.cp1, seg.cp2, seg.p2, t);
                    const angle = this.bezierTangent(seg.p1, seg.cp1, seg.cp2, seg.p2, t);

                    // Check if point is inside an intersection
                    let nearIntersection = false;
                    for (const intersection of roadIntersections) {
                        if (intersection.angle !== undefined) {
                            // Rotated rectangle intersection (extended for shoulders)
                            const angle = intersection.angle + (typeof debugConfig !== 'undefined' ? debugConfig.angleOffset : 0);
                            const dx = point.x - intersection.x;
                            const dy = point.y - intersection.y;
                            const rotX = dx * Math.cos(-angle) - dy * Math.sin(-angle);
                            const rotY = dx * Math.sin(-angle) + dy * Math.cos(-angle);
                            // ADJUST THIS VALUE to change shoulder clipping distance (positive = extend beyond intersection, negative = stop before intersection)
                            const size = typeof debugConfig !== 'undefined' ? debugConfig.intersectionSize : intersection.size;
                            const half = size / 2 + (typeof debugConfig !== 'undefined' ? debugConfig.shoulderClip : 20);
                            if (Math.abs(rotX) < half && Math.abs(rotY) < half) {
                                nearIntersection = true;
                                break;
                            }
                        } else {
                            const dist = Math.sqrt((point.x - intersection.x) ** 2 + (point.y - intersection.y) ** 2);
                            // ADJUST THIS VALUE for non-rotated intersections
                            const size = typeof debugConfig !== 'undefined' ? debugConfig.intersectionSize : intersection.size;
                            if (dist < size / 2 + (typeof debugConfig !== 'undefined' ? debugConfig.shoulderClip : 20)) {
                                nearIntersection = true;
                                break;
                            }
                        }
                    }

                    pathPoints.push({ point, angle, nearIntersection });
                }
            }

            // Draw shoulders in segments
            ctx.strokeStyle = road.roadType.edgeColor;
            ctx.lineWidth = road.width + 40;
            ctx.lineCap = 'butt';
            ctx.lineJoin = 'round';
            let drawing = false;
            for (const pp of pathPoints) {
                if (!pp.nearIntersection) {
                    if (!drawing) {
                        ctx.beginPath();
                        ctx.moveTo(pp.point.x, pp.point.y);
                        drawing = true;
                    } else {
                        ctx.lineTo(pp.point.x, pp.point.y);
                    }
                } else if (drawing) {
                    ctx.stroke();
                    drawing = false;
                }
            }
            if (drawing) ctx.stroke();

            // Draw road surface in segments
            ctx.strokeStyle = road.roadType.color;
            ctx.lineWidth = road.width;
            ctx.lineCap = 'butt';
            drawing = false;
            for (const pp of pathPoints) {
                if (!pp.nearIntersection) {
                    if (!drawing) {
                        ctx.beginPath();
                        ctx.moveTo(pp.point.x, pp.point.y);
                        drawing = true;
                    } else {
                        ctx.lineTo(pp.point.x, pp.point.y);
                    }
                } else if (drawing) {
                    ctx.stroke();
                    drawing = false;
                }
            }
            if (drawing) ctx.stroke();
        } else {
            // Draw normally for roads without intersections or non-two-lane roads
            // Draw shoulders
            ctx.strokeStyle = road.roadType.edgeColor;
            ctx.lineWidth = road.width + 40;
            ctx.lineCap = 'butt';
            ctx.lineJoin = 'round';
            ctx.beginPath();
            ctx.moveTo(road.segments[0].p1.x, road.segments[0].p1.y);
            for (const seg of road.segments) {
                ctx.bezierCurveTo(seg.cp1.x, seg.cp1.y, seg.cp2.x, seg.cp2.y, seg.p2.x, seg.p2.y);
            }
            ctx.stroke();

            // Draw road surface
            ctx.strokeStyle = road.roadType.color;
            ctx.lineWidth = road.width;
            ctx.lineCap = 'butt';
            ctx.beginPath();
            ctx.moveTo(road.segments[0].p1.x, road.segments[0].p1.y);
            for (const seg of road.segments) {
                ctx.bezierCurveTo(seg.cp1.x, seg.cp1.y, seg.cp2.x, seg.cp2.y, seg.p2.x, seg.p2.y);
            }
            ctx.stroke();
        }
    }

    drawMergeRoad(ctx, road) {
        const steps = 20;
        ctx.save();
        ctx.translate(road.centerX, road.centerY);
        ctx.rotate(road.angle);

        const hl = road.length / 2;
        const shoulderStart = 130;

        // Draw shoulders (start after intersection)
        ctx.fillStyle = road.roadType.edgeColor;
        ctx.beginPath();
        for (let i = 0; i <= steps; i++) {
            const t = i / steps;
            const x = -hl + shoulderStart + t * (road.length - shoulderStart);
            const tRoad = (x + hl) / road.length;
            const w = road.startWidth + tRoad * (road.endWidth - road.startWidth);
            const hw = w / 2;
            ctx.lineTo(x, -hw - 20);
        }
        for (let i = steps; i >= 0; i--) {
            const t = i / steps;
            const x = -hl + shoulderStart + t * (road.length - shoulderStart);
            const tRoad = (x + hl) / road.length;
            const w = road.startWidth + tRoad * (road.endWidth - road.startWidth);
            const hw = w / 2;
            ctx.lineTo(x, -hw);
        }
        ctx.closePath();
        ctx.fill();

        ctx.beginPath();
        for (let i = 0; i <= steps; i++) {
            const t = i / steps;
            const x = -hl + shoulderStart + t * (road.length - shoulderStart);
            const tRoad = (x + hl) / road.length;
            const w = road.startWidth + tRoad * (road.endWidth - road.startWidth);
            const hw = w / 2;
            ctx.lineTo(x, hw);
        }
        for (let i = steps; i >= 0; i--) {
            const t = i / steps;
            const x = -hl + shoulderStart + t * (road.length - shoulderStart);
            const tRoad = (x + hl) / road.length;
            const w = road.startWidth + tRoad * (road.endWidth - road.startWidth);
            const hw = w / 2;
            ctx.lineTo(x, hw + 20);
        }
        ctx.closePath();
        ctx.fill();

        // Draw road surface
        ctx.fillStyle = road.roadType.color;
        ctx.beginPath();
        for (let i = 0; i <= steps; i++) {
            const t = i / steps;
            const x = -hl + t * road.length;
            const w = road.startWidth + t * (road.endWidth - road.startWidth);
            const hw = w / 2;
            ctx.lineTo(x, -hw);
        }
        for (let i = steps; i >= 0; i--) {
            const t = i / steps;
            const x = -hl + t * road.length;
            const w = road.startWidth + t * (road.endWidth - road.startWidth);
            const hw = w / 2;
            ctx.lineTo(x, hw);
        }
        ctx.closePath();
        ctx.fill();

        ctx.restore();
    }

    drawCurvedRoad(ctx, road) {
        const hw = road.width / 2;
        const innerRadius = road.radius - hw;
        const outerRadius = road.radius + hw;
        const shoulderInner = innerRadius - 20;
        const shoulderOuter = outerRadius + 20;

        // Draw shoulders
        ctx.fillStyle = road.roadType.edgeColor;
        ctx.beginPath();
        ctx.arc(road.centerX, road.centerY, shoulderInner, road.startAngle, road.endAngle);
        ctx.arc(road.centerX, road.centerY, innerRadius, road.endAngle, road.startAngle, true);
        ctx.closePath();
        ctx.fill();

        ctx.beginPath();
        ctx.arc(road.centerX, road.centerY, outerRadius, road.startAngle, road.endAngle);
        ctx.arc(road.centerX, road.centerY, shoulderOuter, road.endAngle, road.startAngle, true);
        ctx.closePath();
        ctx.fill();

        // Draw road surface
        ctx.fillStyle = road.roadType.color;
        ctx.beginPath();
        ctx.arc(road.centerX, road.centerY, innerRadius, road.startAngle, road.endAngle);
        ctx.arc(road.centerX, road.centerY, outerRadius, road.endAngle, road.startAngle, true);
        ctx.closePath();
        ctx.fill();
    }

    drawRoadSegmentMarkings(ctx, road) {
        if (road.isCurved) {
            this.drawCurvedRoadMarkings(ctx, road);
            return;
        }
        if (road.isPath) {
            this.drawPathRoadMarkings(ctx, road);
            return;
        }
        if (road.isMerge) {
            this.drawMergeRoadMarkings(ctx, road);
            return;
        }
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

        // Check if road starts/ends at T-junction
        const startAtTJunction = roadIntersections.length > 0 && roadIntersections[0].type === 'T_JUNCTION' &&
            Math.abs((roadIntersections[0].x - road.centerX) * Math.cos(road.angle) + (roadIntersections[0].y - road.centerY) * Math.sin(road.angle) + hl) < 50;
        const endAtTJunction = roadIntersections.length > 0 && roadIntersections[roadIntersections.length - 1].type === 'T_JUNCTION' &&
            Math.abs((roadIntersections[roadIntersections.length - 1].x - road.centerX) * Math.cos(road.angle) + (roadIntersections[roadIntersections.length - 1].y - road.centerY) * Math.sin(road.angle) - hl) < 50;

        // Build segments between intersections
        let lastEnd = startAtTJunction ? (roadIntersections[0].x - road.centerX) * Math.cos(road.angle) + (roadIntersections[0].y - road.centerY) * Math.sin(road.angle) + roadIntersections[0].size / 2 + 5 : -hl + 20;
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
        if (!endAtTJunction && lastEnd < hl - 20) {
            segments.push({ start: lastEnd, end: hl - 20 });
        }

        // Find path roads that connect to this 4-lane road
        const pathConnections = [];
        for (const pathRoad of this.roads) {
            if (pathRoad.isPath) {
                const startDist = Math.sqrt((pathRoad.segments[0].p1.x - road.centerX) ** 2 + (pathRoad.segments[0].p1.y - road.centerY) ** 2);
                const endDist = Math.sqrt((pathRoad.segments[pathRoad.segments.length - 1].p2.x - road.centerX) ** 2 + (pathRoad.segments[pathRoad.segments.length - 1].p2.y - road.centerY) ** 2);
                if (startDist < 100) {
                    const distFromCenter = (pathRoad.segments[0].p1.x - road.centerX) * Math.cos(road.angle) + (pathRoad.segments[0].p1.y - road.centerY) * Math.sin(road.angle);
                    pathConnections.push(distFromCenter);
                }
                if (endDist < 100) {
                    const distFromCenter = (pathRoad.segments[pathRoad.segments.length - 1].p2.x - road.centerX) * Math.cos(road.angle) + (pathRoad.segments[pathRoad.segments.length - 1].p2.y - road.centerY) * Math.sin(road.angle);
                    pathConnections.push(distFromCenter);
                }
            }
        }

        // Draw markings for each segment
        for (const seg of segments) {
            // Skip segments that overlap with path connections
            let skipSegment = false;
            for (const conn of pathConnections) {
                if (conn >= seg.start - 30 && conn <= seg.end + 30) {
                    skipSegment = true;
                    break;
                }
            }
            if (skipSegment) continue;

            if (road.type === 'FOUR_LANE') {
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
            } else if (road.type === 'TWO_LANE') {
                // Center yellow dashed line
                ctx.strokeStyle = 'rgba(255, 200, 0, 0.4)';
                ctx.lineWidth = 2;
                ctx.setLineDash([15, 10]);
                ctx.beginPath();
                ctx.moveTo(seg.start, 0);
                ctx.lineTo(seg.end, 0);
                ctx.stroke();

                // Edge lines (white solid)
                ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
                ctx.lineWidth = 2;
                ctx.setLineDash([]);
                ctx.beginPath();
                ctx.moveTo(seg.start, -60);
                ctx.lineTo(seg.end, -60);
                ctx.stroke();
                ctx.beginPath();
                ctx.moveTo(seg.start, 60);
                ctx.lineTo(seg.end, 60);
                ctx.stroke();
            } else if (road.type === 'DIRT') {
                // No center line, just edge markers
                ctx.strokeStyle = 'rgba(139, 90, 43, 0.3)';
                ctx.lineWidth = 1;
                ctx.setLineDash([10, 20]);
                ctx.beginPath();
                ctx.moveTo(seg.start, -40);
                ctx.lineTo(seg.end, -40);
                ctx.stroke();
                ctx.beginPath();
                ctx.moveTo(seg.start, 40);
                ctx.lineTo(seg.end, 40);
                ctx.stroke();
            }
        }

        ctx.restore();
    }

    drawPathRoadMarkings(ctx, road) {
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        // Find intersections that involve this road
        const roadIntersections = this.intersections.filter(i => i.roads.includes(road));

        if (road.type === 'FOUR_LANE') {
            // Center yellow line
            ctx.strokeStyle = 'rgba(255, 200, 0, 0.3)';
            ctx.lineWidth = 2;
            ctx.setLineDash([20, 15]);
            ctx.beginPath();
            ctx.moveTo(road.segments[0].p1.x, road.segments[0].p1.y);
            for (const seg of road.segments) {
                ctx.bezierCurveTo(seg.cp1.x, seg.cp1.y, seg.cp2.x, seg.cp2.y, seg.p2.x, seg.p2.y);
            }
            ctx.stroke();

            // Lane dividers
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
            ctx.setLineDash([15, 10]);
            for (const offset of [-50, 50]) {
                ctx.beginPath();
                const start = this.offsetBezierPoint(road.segments[0].p1, road.segments[0].p1, road.segments[0].cp1, 0, offset);
                ctx.moveTo(start.x, start.y);
                for (const seg of road.segments) {
                    const samples = 10;
                    for (let i = 1; i <= samples; i++) {
                        const t = i / samples;
                        const point = this.bezierPoint(seg.p1, seg.cp1, seg.cp2, seg.p2, t);
                        const angle = this.bezierTangent(seg.p1, seg.cp1, seg.cp2, seg.p2, t);
                        const offsetPoint = { x: point.x - offset * Math.sin(angle), y: point.y + offset * Math.cos(angle) };
                        ctx.lineTo(offsetPoint.x, offsetPoint.y);
                    }
                }
                ctx.stroke();
            }

            // Edge lines
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
            ctx.lineWidth = 3;
            ctx.setLineDash([]);
            for (const offset of [-100, 100]) {
                ctx.beginPath();
                const start = this.offsetBezierPoint(road.segments[0].p1, road.segments[0].p1, road.segments[0].cp1, 0, offset);
                ctx.moveTo(start.x, start.y);
                for (const seg of road.segments) {
                    const samples = 10;
                    for (let i = 1; i <= samples; i++) {
                        const t = i / samples;
                        const point = this.bezierPoint(seg.p1, seg.cp1, seg.cp2, seg.p2, t);
                        const angle = this.bezierTangent(seg.p1, seg.cp1, seg.cp2, seg.p2, t);
                        const offsetPoint = { x: point.x - offset * Math.sin(angle), y: point.y + offset * Math.cos(angle) };
                        ctx.lineTo(offsetPoint.x, offsetPoint.y);
                    }
                }
                ctx.stroke();
            }
        } else if (road.type === 'TWO_LANE') {
            // Draw markings in segments, skipping intersections
            const samples = 50;
            const pathPoints = [];

            // Sample points along the path
            for (const seg of road.segments) {
                for (let i = 0; i <= samples; i++) {
                    const t = i / samples;
                    const point = this.bezierPoint(seg.p1, seg.cp1, seg.cp2, seg.p2, t);
                    const angle = this.bezierTangent(seg.p1, seg.cp1, seg.cp2, seg.p2, t);

                    // Check if point is inside an intersection
                    let nearIntersection = false;
                    for (const intersection of roadIntersections) {
                        if (intersection.angle !== undefined) {
                            // Rotated rectangle intersection (extended for markings)
                            const angle = intersection.angle + (typeof debugConfig !== 'undefined' ? debugConfig.angleOffset : 0);
                            const dx = point.x - intersection.x;
                            const dy = point.y - intersection.y;
                            const rotX = dx * Math.cos(-angle) - dy * Math.sin(-angle);
                            const rotY = dx * Math.sin(-angle) + dy * Math.cos(-angle);
                            const size = typeof debugConfig !== 'undefined' ? debugConfig.intersectionSize : intersection.size;
                            const half = size / 2 + (typeof debugConfig !== 'undefined' ? debugConfig.markingClip : 5);
                            if (Math.abs(rotX) < half && Math.abs(rotY) < half) {
                                nearIntersection = true;
                                break;
                            }
                        } else {
                            const dist = Math.sqrt((point.x - intersection.x) ** 2 + (point.y - intersection.y) ** 2);
                            const size = typeof debugConfig !== 'undefined' ? debugConfig.intersectionSize : intersection.size;
                            if (dist < size / 2 + (typeof debugConfig !== 'undefined' ? debugConfig.markingClip : 5)) {
                                nearIntersection = true;
                                break;
                            }
                        }
                    }

                    pathPoints.push({ point, angle, nearIntersection, seg, t });
                }
            }

            // Draw center yellow line in segments
            ctx.strokeStyle = 'rgba(255, 200, 0, 0.4)';
            ctx.lineWidth = 2;
            ctx.setLineDash([15, 10]);
            let drawing = false;
            for (const pp of pathPoints) {
                if (!pp.nearIntersection) {
                    if (!drawing) {
                        ctx.beginPath();
                        ctx.moveTo(pp.point.x, pp.point.y);
                        drawing = true;
                    } else {
                        ctx.lineTo(pp.point.x, pp.point.y);
                    }
                } else if (drawing) {
                    ctx.stroke();
                    drawing = false;
                }
            }
            if (drawing) ctx.stroke();

            // Draw edge lines in segments
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
            ctx.setLineDash([]);
            for (const offset of [-60, 60]) {
                drawing = false;
                for (const pp of pathPoints) {
                    const offsetPoint = {
                        x: pp.point.x - offset * Math.sin(pp.angle),
                        y: pp.point.y + offset * Math.cos(pp.angle)
                    };

                    if (!pp.nearIntersection) {
                        if (!drawing) {
                            ctx.beginPath();
                            ctx.moveTo(offsetPoint.x, offsetPoint.y);
                            drawing = true;
                        } else {
                            ctx.lineTo(offsetPoint.x, offsetPoint.y);
                        }
                    } else if (drawing) {
                        ctx.stroke();
                        drawing = false;
                    }
                }
                if (drawing) ctx.stroke();
            }
        }
    }

    offsetBezierPoint(p0, p1, p2, t, offset) {
        const angle = Math.atan2(p2.y - p1.y, p2.x - p1.x);
        return { x: p1.x - offset * Math.sin(angle), y: p1.y + offset * Math.cos(angle) };
    }

    drawMergeRoadMarkings(ctx, road) {
        ctx.save();
        ctx.translate(road.centerX, road.centerY);
        ctx.rotate(road.angle);

        const hl = road.length / 2;
        const steps = 20;

        // Center yellow line (stop before end)
        ctx.strokeStyle = 'rgba(255, 200, 0, 0.35)';
        ctx.lineWidth = 2;
        ctx.setLineDash([20, 15]);
        ctx.beginPath();
        ctx.moveTo(-hl + 130, 0);
        ctx.lineTo(hl - 20, 0);
        ctx.stroke();

        // Edge lines that taper (extend to end)
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.lineWidth = 2;
        ctx.setLineDash([]);
        ctx.beginPath();
        ctx.moveTo(-hl + 130, -road.startWidth / 2);
        for (let i = 1; i <= steps; i++) {
            const t = i / steps;
            const x = -hl + 130 + t * (road.length - 130);
            const w = road.startWidth + t * (road.endWidth - road.startWidth);
            ctx.lineTo(x, -w / 2);
        }
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(-hl + 130, road.startWidth / 2);
        for (let i = 1; i <= steps; i++) {
            const t = i / steps;
            const x = -hl + 130 + t * (road.length - 130);
            const w = road.startWidth + t * (road.endWidth - road.startWidth);
            ctx.lineTo(x, w / 2);
        }
        ctx.stroke();

        // Lane divider lines showing merge (white dashed)
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.lineWidth = 2;
        ctx.setLineDash([15, 10]);

        const mergeLength = (road.length - 130) * 0.33;

        // Top inner lane divider (straight, terminates halfway)
        ctx.beginPath();
        ctx.moveTo(-hl + 130, -50);
        ctx.lineTo(-hl + 130 + mergeLength, -50);
        ctx.stroke();

        // Bottom inner lane divider (straight, terminates halfway)
        ctx.beginPath();
        ctx.moveTo(-hl + 130, 50);
        ctx.lineTo(-hl + 130 + mergeLength, 50);
        ctx.stroke();

        ctx.restore();
    }

    drawCurvedRoadMarkings(ctx, road) {
        const hw = road.width / 2;

        if (road.type === 'FOUR_LANE') {
            // Center yellow dashed line
            ctx.strokeStyle = 'rgba(255, 200, 0, 0.3)';
            ctx.lineWidth = 2;
            ctx.setLineDash([20, 15]);
            ctx.beginPath();
            ctx.arc(road.centerX, road.centerY, road.radius, road.startAngle, road.endAngle);
            ctx.stroke();

            // Lane dividers
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
            ctx.setLineDash([15, 10]);
            ctx.beginPath();
            ctx.arc(road.centerX, road.centerY, road.radius - 50, road.startAngle, road.endAngle);
            ctx.stroke();
            ctx.beginPath();
            ctx.arc(road.centerX, road.centerY, road.radius + 50, road.startAngle, road.endAngle);
            ctx.stroke();

            // Edge lines
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
            ctx.lineWidth = 3;
            ctx.setLineDash([]);
            ctx.beginPath();
            ctx.arc(road.centerX, road.centerY, road.radius - 100, road.startAngle, road.endAngle);
            ctx.stroke();
            ctx.beginPath();
            ctx.arc(road.centerX, road.centerY, road.radius + 100, road.startAngle, road.endAngle);
            ctx.stroke();
        } else if (road.type === 'TWO_LANE') {
            // Center yellow dashed line
            ctx.strokeStyle = 'rgba(255, 200, 0, 0.4)';
            ctx.lineWidth = 2;
            ctx.setLineDash([15, 10]);
            ctx.beginPath();
            ctx.arc(road.centerX, road.centerY, road.radius, road.startAngle, road.endAngle);
            ctx.stroke();

            // Edge lines
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
            ctx.setLineDash([]);
            ctx.beginPath();
            ctx.arc(road.centerX, road.centerY, road.radius - 60, road.startAngle, road.endAngle);
            ctx.stroke();
            ctx.beginPath();
            ctx.arc(road.centerX, road.centerY, road.radius + 60, road.startAngle, road.endAngle);
            ctx.stroke();
        } else if (road.type === 'DIRT') {
            // Edge markers
            ctx.strokeStyle = 'rgba(139, 90, 43, 0.3)';
            ctx.lineWidth = 1;
            ctx.setLineDash([10, 20]);
            ctx.beginPath();
            ctx.arc(road.centerX, road.centerY, road.radius - 40, road.startAngle, road.endAngle);
            ctx.stroke();
            ctx.beginPath();
            ctx.arc(road.centerX, road.centerY, road.radius + 40, road.startAngle, road.endAngle);
            ctx.stroke();
        }
    }
}

// Global road system instance
const roadSystem = new RoadSystem();

// Initialize roads - simple coordinate-based definition
function initializeRoads() {
    // Main grid - Horizontal
    roadSystem.addRoad(-2400, -1200, 9600, -1200, 'FOUR_LANE');
    roadSystem.addRoad(-2400, 0, 9600, 0, 'FOUR_LANE');
    roadSystem.addRoad(-2400, 1200, 9600, 1200, 'FOUR_LANE');
    roadSystem.addRoad(-2400, 2400, 9600, 2400, 'FOUR_LANE');
    roadSystem.addRoad(-2400, 3600, 9600, 3600, 'FOUR_LANE');
    roadSystem.addRoad(-2400, 4800, 9600, 4800, 'FOUR_LANE');
    roadSystem.addRoad(-2400, 6000, 9600, 6000, 'FOUR_LANE');
    roadSystem.addRoad(-2400, 7200, 9600, 7200, 'FOUR_LANE');
    roadSystem.addRoad(-2400, 8400, 9600, 8400, 'FOUR_LANE');
    roadSystem.addRoad(-2400, 9600, 9600, 9600, 'FOUR_LANE');
    roadSystem.addRoad(-2400, -2400, -2400, 9600, 'FOUR_LANE');
    roadSystem.addRoad(-2400, -2400, 9600, -2400, 'FOUR_LANE');

    // Main grid - Vertical
    roadSystem.addRoad(-1200, -2400, -1200, 9600, 'FOUR_LANE');
    roadSystem.addRoad(0, -2400, 0, 9600, 'FOUR_LANE');
    roadSystem.addRoad(1200, -2400, 1200, 9600, 'FOUR_LANE');
    roadSystem.addRoad(2400, -2400, 2400, 9600, 'FOUR_LANE');
    roadSystem.addRoad(3600, -2400, 3600, 9600, 'FOUR_LANE');
    roadSystem.addRoad(4800, -2400, 4800, 9600, 'FOUR_LANE');
    roadSystem.addRoad(6000, -2400, 6000, 9600, 'FOUR_LANE');
    roadSystem.addRoad(7200, -2400, 7200, 9600, 'FOUR_LANE');
    roadSystem.addRoad(8400, -2400, 8400, 9600, 'FOUR_LANE');
    roadSystem.addRoad(9600, -2400, 9600, 9600, 'FOUR_LANE');

    roadSystem.addMerge(9600, -1200, 12000, -1200, 'FOUR_LANE', 'TWO_LANE');
    roadSystem.addPath([{x:12000,y:-1200},{x:12241,y:-1220},{x:13001,y:-1410},{x:13618,y:-1600},{x:14330,y:-1885},{x:14900,y:-2265},{x:15613,y:-2692},{x:16372,y:-3072},{x:17607,y:-3500},{x:18604,y:-3737},{x:20028,y:-3927},{x:22403,y:-4069},{x:23970,y:-4164},{x:25869,y:-4497},{x:27056,y:-4782},{x:28813,y:-5541},{x:30142,y:-6396},{x:31092,y:-7488},{x:31804,y:-8675},{x:32374,y:-9435},{x:33324,y:-10290},{x:34368,y:-11097},{x:35508,y:-11857},{x:37123,y:-12521},{x:38025,y:-12711},{x:39022,y:-13044}], 'TWO_LANE');

    roadSystem.addMerge(9600, 0, 12000, 0, 'FOUR_LANE', 'TWO_LANE');
    roadSystem.addPath([{x:12000,y:0},{x:13333,y:14},{x:14615,y:-81},{x:16610,y:-271},{x:19269,y:-556},{x:21880,y:-1078},{x:24207,y:-1743},{x:28148,y:-2597},{x:31377,y:-2977},{x:34274,y:-3215},{x:35793,y:-3262},{x:38120,y:-3120},{x:39212,y:-3025}], 'TWO_LANE');

    roadSystem.addMerge(9600, 1200, 12000, 1200, 'FOUR_LANE', 'TWO_LANE');
    roadSystem.addPath([{x:12000,y:1200},{x:13191,y:1296},{x:16372,y:1439},{x:20408,y:1486},{x:22688,y:1391},{x:25347,y:1249},{x:28291,y:964},{x:30380,y:774},{x:32754,y:774},{x:34653,y:1201},{x:35888,y:1676},{x:36648,y:2246},{x:37692,y:3386},{x:38262,y:4715},{x:38594,y:6092},{x:38832,y:7137}], 'TWO_LANE');

    roadSystem.addMerge(-2400, 0, -4800, 0, 'FOUR_LANE', 'TWO_LANE');
    roadSystem.addPath([{"x":-4800,"y":0},{"x":-6087,"y":-81},{"x":-8367,"y":-366},{"x":-9886,"y":-745},{"x":-11311,"y":-1458},{"x":-12308,"y":-2123},{"x":-13257,"y":-2882},{"x":-14492,"y":-3500},{"x":-17293,"y":-4354},{"x":-19145,"y":-4639},{"x":-21425,"y":-4877},{"x":-23561,"y":-4877},{"x":-26268,"y":-4877},{"x":-29259,"y":-4782}], 'TWO_LANE');

    roadSystem.addPath([{"x":15755,"y":1486},{"x":15755,"y":821},{"x":15470,"y":-793},{"x":14900,"y":-2312}], 'TWO_LANE');

    roadSystem.addPath([{"x":-12450,"y":-2217},{"x":-13257,"y":-1268},{"x":-13637,"y":-461},{"x":-13970,"y":584},{"x":-14112,"y":1771},{"x":-14112,"y":3528},{"x":-14065,"y":4858},{"x":-13922,"y":5997},{"x":-13542,"y":7612},{"x":-13067,"y":9321},{"x":-12783,"y":10651},{"x":-12308,"y":12835},{"x":-11406,"y":14259},{"x":-10313,"y":15399},{"x":-8936,"y":16254},{"x":-6277,"y":17346},{"x":-2004,"y":17868},{"x":3457,"y":18153},{"x":8632,"y":17963},{"x":11766,"y":17536},{"x":14520,"y":16823},{"x":16230,"y":15969},{"x":17844,"y":14307},{"x":19269,"y":11885},{"x":19981,"y":9179},{"x":20171,"y":6045},{"x":20218,"y":3291},{"x":19886,"y":204},{"x":19269,"y":-2597},{"x":17085,"y":-5969},{"x":14948,"y":-7678},{"x":12384,"y":-9198},{"x":9487,"y":-10052},{"x":6163,"y":-10575},{"x":2460,"y":-10670},{"x":-2004,"y":-10385},{"x":-4425,"y":-9767},{"x":-6420,"y":-8438},{"x":-8414,"y":-6349},{"x":-10503,"y":-4497},{"x":-12403,"y":-2265}], 'TWO_LANE');

    roadSystem.addMerge(8400, 9600, 8400, 12000, 'FOUR_LANE', 'TWO_LANE');
    roadSystem.addPath([{"x":8400,"y":12000},{"x":8680,"y":26747}], 'TWO_LANE');

    roadSystem.addMerge(9600, 8400, 12000, 8400, 'FOUR_LANE', 'TWO_LANE');
    roadSystem.addPath([{"x":12000,"y":8400},{"x":37502,"y":7991}], 'TWO_LANE');

    roadSystem.addMerge(8400, -2400, 8400, -4800, 'FOUR_LANE', 'TWO_LANE');
    roadSystem.addPath([{"x":8400,"y":-4800},{"x":8585,"y":-14706}], 'TWO_LANE');

    roadSystem.addMerge(-2400, 4800, -4800, 4800, 'FOUR_LANE', 'TWO_LANE');
    roadSystem.addPath([{"x":-4800,"y":4800},{"x":-9744,"y":4953},{"x":-11263,"y":5047},{"x":-14539,"y":5570},{"x":-18433,"y":6519},{"x":-22944,"y":8229},{"x":-26458,"y":10223},{"x":-29402,"y":11933}], 'TWO_LANE');

    roadSystem.buildIntersections();
}

// Helper to get curve end point
function getCurveEndPoint(centerX, centerY, radius, angle) {
    return {
        x: centerX + radius * Math.cos(angle),
        y: centerY + radius * Math.sin(angle)
    };
}

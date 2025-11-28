console.log('%c🚓 Night Drive - Police Car Simulator', 'font-size: 16px; font-weight: bold;');
console.log('%cDebug Info:', 'font-weight: bold;');
console.log('  • Enable profiler: profiler.enabled = true');
console.log('%cControls:', 'font-weight: bold;');
console.log('  • WASD to drive');
console.log('  • SHIFT + W to drive fast');
console.log('  • Toggle headlights: H key');
console.log('  • Toggle police lights: L key');
console.log('  • Spotlight: Hold mouse button');
console.log('  • Ambient light: +/- keys');
console.log('%cPerformance Tip:', 'font-weight: bold; color: orange;');
console.log('  If running slow, disable browser JIT restrictions (e.g., Edge Super Duper Secure Mode)');

const profiler = {
    enabled: false,
    timings: {},
    frameCount: 0,
    logInterval: 60,
    lastFrameTime: performance.now(),
    fps: 0,
    fpsDisplay: 0,
    fpsUpdateTime: performance.now(),
    fpsFrameCount: 0,

    start(label) {
        if (!this.enabled) return;
        if (!this.timings[label]) {
            this.timings[label] = { total: 0, count: 0, max: 0, min: Infinity };
        }
        this.timings[label].startTime = performance.now();
    },

    end(label) {
        if (!this.enabled) return;
        if (!this.timings[label] || !this.timings[label].startTime) return;

        const elapsed = performance.now() - this.timings[label].startTime;
        this.timings[label].total += elapsed;
        this.timings[label].count++;
        this.timings[label].max = Math.max(this.timings[label].max, elapsed);
        this.timings[label].min = Math.min(this.timings[label].min, elapsed);
        delete this.timings[label].startTime;
    },

    frame() {
        const now = performance.now();
        const frameDelta = now - this.lastFrameTime;
        this.fps = 1000 / frameDelta;
        this.lastFrameTime = now;

        this.fpsFrameCount++;
        if (now - this.fpsUpdateTime >= 1000) {
            this.fpsDisplay = Math.round(this.fpsFrameCount * 1000 / (now - this.fpsUpdateTime));
            this.fpsFrameCount = 0;
            this.fpsUpdateTime = now;
        }

        if (!this.enabled) return;

        this.frameCount++;

        if (this.frameCount % this.logInterval === 0) {
            this.log();
        }
    },

    log() {
        console.log('\n=== PERFORMANCE PROFILE ===');
        console.log(`FPS: ${this.fps.toFixed(1)}`);
        console.log(`Position: (${Math.round(car.x)}, ${Math.round(car.y)})`);
        console.log(`Active obstacles in view: ${this.getObstaclesInView()}`);
        console.log(`Total obstacles: ${obstacles.length}`);
        console.log(`Interactive objects: ${interactiveObjects.length}`);
        console.log(`Debris count: ${debris.length}`);

        const sorted = Object.entries(this.timings)
            .map(([label, data]) => ({
                label,
                avg: data.total / data.count,
                max: data.max,
                min: data.min,
                total: data.total,
                count: data.count
            }))
            .sort((a, b) => b.avg - a.avg);

        console.log('\nTiming breakdown (avg/max/min ms):');
        for (const item of sorted) {
            const pct = (item.total / (this.logInterval * 16.67)) * 100;
            console.log(`  ${item.label}: ${item.avg.toFixed(2)}ms / ${item.max.toFixed(2)}ms / ${item.min.toFixed(2)}ms (${pct.toFixed(1)}% of frame budget)`);
        }

        this.reset();
    },

    reset() {
        for (const key in this.timings) {
            this.timings[key] = { total: 0, count: 0, max: 0, min: Infinity };
        }
    },

    getObstaclesInView() {
        const buffer = 600;
        const minX = camera.x - buffer;
        const maxX = camera.x + canvas.width + buffer;
        const minY = camera.y - buffer;
        const maxY = camera.y + canvas.height + buffer;

        let count = 0;
        for (const obs of obstacles) {
            if (obs.x + obs.width >= minX && obs.x <= maxX &&
                obs.y + obs.height >= minY && obs.y <= maxY) {
                count++;
            }
        }
        return count;
    }
};

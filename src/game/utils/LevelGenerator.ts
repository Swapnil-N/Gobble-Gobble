export class LevelGenerator {
    private width: number;
    private height: number;
    private map: number[][];

    constructor(width: number, height: number) {
        this.width = width;
        this.height = height;
        this.map = [];
    }

    generate(): number[][] {
        // Initialize map with walls (1)
        this.map = Array(this.height).fill(null).map(() => Array(this.width).fill(1));

        // Start DFS from (1, 1)
        this.dfs(1, 1);

        // Add some random loops to make it less linear (optional)
        this.addLoops();

        // Add Corn (0) and Super Corn (2)
        this.populateItems();

        return this.map;
    }

    private dfs(x: number, y: number) {
        this.map[y][x] = 0; // Mark as path

        const directions = [
            { dx: 0, dy: -2 }, // Up
            { dx: 0, dy: 2 },  // Down
            { dx: -2, dy: 0 }, // Left
            { dx: 2, dy: 0 }   // Right
        ];

        // Shuffle directions
        directions.sort(() => Math.random() - 0.5);

        for (const dir of directions) {
            const nx = x + dir.dx;
            const ny = y + dir.dy;

            if (this.isValid(nx, ny) && this.map[ny][nx] === 1) {
                this.map[y + dir.dy / 2][x + dir.dx / 2] = 0; // Carve path between
                this.dfs(nx, ny);
            }
        }
    }

    private isValid(x: number, y: number): boolean {
        return x > 0 && x < this.width - 1 && y > 0 && y < this.height - 1;
    }

    private addLoops() {
        // Randomly remove some walls to create loops
        for (let i = 0; i < 10; i++) {
            const x = Math.floor(Math.random() * (this.width - 2)) + 1;
            const y = Math.floor(Math.random() * (this.height - 2)) + 1;
            if (this.map[y][x] === 1) {
                // Check if it connects two paths
                let neighbors = 0;
                if (this.map[y - 1][x] === 0) neighbors++;
                if (this.map[y + 1][x] === 0) neighbors++;
                if (this.map[y][x - 1] === 0) neighbors++;
                if (this.map[y][x + 1] === 0) neighbors++;

                if (neighbors >= 2) {
                    this.map[y][x] = 0;
                }
            }
        }
    }

    private populateItems() {
        // Place Powerups (2) in corners or random spots
        // Simple logic: just replace some 0s with 2s
        let powerups = 0;
        let attempts = 0;
        while (powerups < 4 && attempts < 100) {
            const x = Math.floor(Math.random() * this.width);
            const y = Math.floor(Math.random() * this.height);
            if (this.map[y][x] === 0) {
                this.map[y][x] = 2; // 2 represents powerup
                powerups++;
            }
            attempts++;
        }
    }
}

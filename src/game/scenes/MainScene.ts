import Phaser from 'phaser';
import turkeyImg from '../../assets/turkey_transparent.png';
import cornImg from '../../assets/corn_sprite_1764017342942.png';
import farmerImg from '../../assets/farmer_transparent.png';
import powerupImg from '../../assets/powerup.png';
import { gameEvents, EVENTS } from '../events';
import Farmer from '../objects/Farmer';

export default class MainScene extends Phaser.Scene {
    private turkey?: Phaser.Physics.Arcade.Sprite;
    private cursors?: Phaser.Types.Input.Keyboard.CursorKeys;
    private walls?: Phaser.Physics.Arcade.StaticGroup;
    private corn?: Phaser.Physics.Arcade.StaticGroup;
    private powerups?: Phaser.Physics.Arcade.StaticGroup;
    private farmers?: Phaser.Physics.Arcade.Group;
    private tileSize: number = 0;
    private offsetX: number = 0;
    private offsetY: number = 0;
    private score: number = 0;
    private lives: number = 3;
    private cornCount: number = 0;
    private totalCorn: number = 0;
    private gameOver: boolean = false;
    private turkeyStartX: number = 0;
    private turkeyStartY: number = 0;
    private powerupActive: boolean = false;
    private powerupTimer?: Phaser.Time.TimerEvent;
    private currentLevel: number = 1;

    constructor() {
        super('MainScene');
    }

    preload() {
        this.load.image('turkey', turkeyImg);
        this.load.image('corn', cornImg);
        this.load.image('farmer', farmerImg);
        this.load.image('powerup', powerupImg);
    }

    create(data?: { isRestart: boolean, level?: number }) {
        if (data?.level) {
            this.currentLevel = data.level;
        } else if (!data?.isRestart) {
            // Reset to level 1 on fresh start
            this.currentLevel = 1;
        }
        this.score = 0;
        this.lives = 3;
        this.cornCount = 0;
        this.totalCorn = 0;
        this.gameOver = false;
        this.powerupActive = false;

        // Pause scene until game starts, unless it's a restart
        if (!data?.isRestart) {
            this.physics.pause();
        }

        // Listen for game start event (use on instead of once for restarts)
        gameEvents.on(EVENTS.GAME_START, this.handleGameStart, this);

        // Listen for restart event
        gameEvents.on(EVENTS.GAME_RESTART, this.handleRestart, this);

        // Listen for next level event
        gameEvents.on(EVENTS.GAME_NEXT_LEVEL, this.handleNextLevel, this);

        // Clean up listeners when scene shuts down
        this.events.on(Phaser.Scenes.Events.SHUTDOWN, this.shutdown, this);

        // Get map for current level
        const map = this.getMap(this.currentLevel);

        const mapWidth = map[0].length;
        const mapHeight = map.length;

        // Calculate tile size to fit screen
        const gameWidth = this.game.config.width as number;
        const gameHeight = this.game.config.height as number;

        const tileSizeByWidth = Math.floor(gameWidth / mapWidth);
        const tileSizeByHeight = Math.floor(gameHeight / mapHeight);

        // Use the smaller tile size to ensure the entire map fits
        this.tileSize = Math.min(tileSizeByWidth, tileSizeByHeight);

        // Calculate offsets to center the map
        const totalMapWidth = mapWidth * this.tileSize;
        const totalMapHeight = mapHeight * this.tileSize;
        this.offsetX = (gameWidth - totalMapWidth) / 2;
        this.offsetY = (gameHeight - totalMapHeight) / 2;

        // Create physics groups
        this.walls = this.physics.add.staticGroup();
        this.corn = this.physics.add.staticGroup();
        this.powerups = this.physics.add.staticGroup();

        // Power-up positions (3 strategic locations in interior)
        const powerupPositions = [
            { row: 3, col: 9 },   // Upper middle area
            { row: 7, col: 5 },   // Left middle area
            { row: 9, col: 14 },  // Right middle area
        ];

        // Draw the map
        for (let row = 0; row < map.length; row++) {
            for (let col = 0; col < map[row].length; col++) {
                const x = this.offsetX + col * this.tileSize + this.tileSize / 2;
                const y = this.offsetY + row * this.tileSize + this.tileSize / 2;

                if (map[row][col] === 1) {
                    // Blue wall
                    const wall = this.add.rectangle(x, y, this.tileSize, this.tileSize, 0x0000ff);
                    this.physics.add.existing(wall, true);
                    this.walls.add(wall);
                } else if (map[row][col] === 0) {
                    // Check if this should be a power-up
                    const isPowerupLocation = powerupPositions.some(p => p.row === row && p.col === col);

                    if (isPowerupLocation) {
                        // Power-up pill
                        const powerupSprite = this.powerups.create(x, y, 'powerup');
                        powerupSprite.setScale(this.tileSize * 0.4 / powerupSprite.width);
                        powerupSprite.refreshBody();
                    } else {
                        // Corn pellet
                        const cornSprite = this.corn.create(x, y, 'corn');
                        cornSprite.setScale(this.tileSize * 0.3 / cornSprite.width);
                        cornSprite.refreshBody();
                        this.totalCorn++;
                    }
                }
            }
        }

        // Create turkey at center position (middle of the map)
        const centerCol = Math.floor(mapWidth / 2);
        const centerRow = Math.floor(mapHeight / 2);
        this.turkeyStartX = this.offsetX + centerCol * this.tileSize + this.tileSize / 2;
        this.turkeyStartY = this.offsetY + centerRow * this.tileSize + this.tileSize / 2;
        this.turkey = this.physics.add.sprite(this.turkeyStartX, this.turkeyStartY, 'turkey');

        // Scale turkey to fit within tile
        const turkeyScale = (this.tileSize * 0.8) / this.turkey.width;
        this.turkey.setScale(turkeyScale);

        // Set up physics for turkey
        this.turkey.setCollideWorldBounds(true);

        // Add collision between turkey and walls
        this.physics.add.collider(this.turkey, this.walls);

        // Add overlap detection between turkey and corn
        this.physics.add.overlap(this.turkey, this.corn, this.collectCorn, undefined, this);

        // Add overlap detection between turkey and power-ups
        this.physics.add.overlap(this.turkey, this.powerups, this.collectPowerup, undefined, this);

        // Create farmers group
        this.farmers = this.physics.add.group({
            classType: Farmer,
            runChildUpdate: true,
        });

        // Add 3 farmers at different spread out positions
        const farmerPositions = [
            { row: 3, col: 3 },   // Top-left area
            { row: 3, col: 16 },  // Top-right area
            { row: 9, col: 10 },  // Bottom-center area
        ];

        farmerPositions.forEach(pos => {
            const farmerX = this.offsetX + pos.col * this.tileSize + this.tileSize / 2;
            const farmerY = this.offsetY + pos.row * this.tileSize + this.tileSize / 2;
            const farmer = new Farmer(this, farmerX, farmerY, 'farmer', this.turkey);
            const farmerScale = (this.tileSize * 0.8) / farmer.width;
            farmer.setScale(farmerScale);
            this.farmers.add(farmer);
        });

        // Add collision between farmers and walls
        this.physics.add.collider(this.farmers, this.walls);

        // Add overlap detection between turkey and farmers
        this.physics.add.overlap(this.turkey, this.farmers, this.handleFarmerCollision, undefined, this);

        // Set up arrow keys
        if (this.input.keyboard) {
            this.cursors = this.input.keyboard.createCursorKeys();

            // Cheat code: Press '1' to win
            this.input.keyboard.on('keydown-ONE', () => {
                this.handleWin();
            });
        }

        // Emit initial score and lives
        gameEvents.emit(EVENTS.SCORE_CHANGED, this.score);
        gameEvents.emit(EVENTS.LIVES_CHANGED, this.lives);
        gameEvents.emit(EVENTS.LEVEL_CHANGED, this.currentLevel);
    }

    private getMap(level: number): number[][] {
        if (level === 2) {
            // Level 2 Map - More complex with more walls
            return [
                [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
                [1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1],
                [1, 0, 1, 1, 1, 0, 1, 0, 1, 1, 1, 1, 0, 1, 0, 1, 1, 1, 0, 1],
                [1, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 1],
                [1, 0, 1, 0, 1, 1, 1, 1, 1, 0, 0, 1, 1, 1, 1, 1, 0, 1, 0, 1],
                [1, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1],
                [1, 0, 1, 1, 1, 0, 1, 1, 1, 0, 0, 1, 1, 1, 0, 1, 1, 1, 0, 1],
                [1, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1],
                [1, 0, 1, 0, 1, 1, 1, 1, 1, 0, 0, 1, 1, 1, 1, 1, 0, 1, 0, 1],
                [1, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 1],
                [1, 0, 1, 1, 1, 1, 1, 0, 1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 0, 1],
                [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
                [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
            ];
        }

        // Level 1 Map (Default)
        return [
            [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
            [1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
            [1, 0, 1, 1, 1, 0, 1, 1, 0, 1, 0, 1, 1, 0, 1, 1, 1, 1, 0, 1],
            [1, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 1],
            [1, 0, 1, 0, 1, 1, 1, 1, 0, 1, 1, 0, 1, 1, 1, 0, 1, 0, 1, 1],
            [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
            [1, 0, 1, 1, 1, 0, 1, 1, 0, 1, 0, 1, 1, 0, 1, 1, 1, 1, 0, 1],
            [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
            [1, 0, 1, 0, 1, 1, 1, 1, 0, 1, 1, 0, 1, 1, 1, 0, 1, 0, 1, 1],
            [1, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 1],
            [1, 0, 1, 1, 1, 0, 1, 1, 0, 1, 0, 1, 1, 0, 1, 1, 1, 1, 0, 1],
            [1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
            [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
        ];
    }

    private collectCorn(turkey: any, corn: any) {
        // Remove the corn
        corn.disableBody(true, true);

        // Increment score (corn = 1 point)
        this.score += 1;
        this.cornCount++;

        // Emit score change event
        gameEvents.emit(EVENTS.SCORE_CHANGED, this.score);

        // Check win condition
        if (this.cornCount >= this.totalCorn) {
            this.handleWin();
        }
    }

    private collectPowerup(turkey: any, powerup: any) {
        // Remove the power-up
        powerup.disableBody(true, true);

        // Activate power-up mode
        this.activatePowerup();
    }

    private activatePowerup() {
        this.powerupActive = true;

        // Make all farmers scared
        this.farmers?.getChildren().forEach((farmer: any) => {
            if (farmer instanceof Farmer) {
                farmer.becomeScared(10000); // 10 seconds
            }
        });

        // Clear existing timer if any
        if (this.powerupTimer) {
            this.powerupTimer.remove();
        }

        // Set timer to deactivate power-up
        this.powerupTimer = this.time.addEvent({
            delay: 10000,
            callback: () => {
                this.powerupActive = false;
                this.powerupTimer = undefined;
            }
        });
    }

    private handleFarmerCollision(turkey: any, farmer: any) {
        if (this.gameOver) return;

        const farmerObj = farmer as Farmer;

        if (this.powerupActive && farmerObj.isScared) {
            // Eat the farmer!
            this.score += 10; // Farmer = 10 points
            gameEvents.emit(EVENTS.SCORE_CHANGED, this.score);

            // Respawn farmer at farthest corner
            this.respawnFarmer(farmerObj);
        } else if (!farmerObj.isScared) {
            // Normal collision - lose a life
            this.lives--;
            gameEvents.emit(EVENTS.LIVES_CHANGED, this.lives);

            if (this.lives <= 0) {
                // Game over
                this.gameOver = true;
                this.physics.pause();

                // Emit game over event
                gameEvents.emit(EVENTS.GAME_OVER, this.score);
            } else {
                // Respawn turkey at starting position
                this.respawnTurkey();
            }
        }
    }

    private respawnFarmer(farmer: Farmer) {
        if (!this.turkey) return;

        // Find the farthest corner from turkey
        const corners = [
            { row: 1, col: 1 },
            { row: 1, col: 18 },
            { row: 11, col: 1 },
            { row: 11, col: 18 },
        ];

        let farthestCorner = corners[0];
        let maxDistance = 0;

        corners.forEach(corner => {
            const x = this.offsetX + corner.col * this.tileSize + this.tileSize / 2;
            const y = this.offsetY + corner.row * this.tileSize + this.tileSize / 2;
            const distance = Phaser.Math.Distance.Between(this.turkey!.x, this.turkey!.y, x, y);

            if (distance > maxDistance) {
                maxDistance = distance;
                farthestCorner = corner;
            }
        });

        // Respawn at farthest corner
        const newX = this.offsetX + farthestCorner.col * this.tileSize + this.tileSize / 2;
        const newY = this.offsetY + farthestCorner.row * this.tileSize + this.tileSize / 2;
        farmer.setPosition(newX, newY);
        farmer.recover(); // Reset to normal state
    }

    private respawnTurkey() {
        if (!this.turkey) return;

        // Pause briefly
        this.physics.pause();

        // Flash effect
        this.tweens.add({
            targets: this.turkey,
            alpha: 0.3,
            duration: 100,
            yoyo: true,
            repeat: 3,
            onComplete: () => {
                // Reset position
                this.turkey?.setPosition(this.turkeyStartX, this.turkeyStartY);
                this.turkey?.setAlpha(1);

                // Resume physics
                this.physics.resume();
            }
        });
    }

    private handleWin() {
        this.gameOver = true;
        this.physics.pause();

        // Emit win event
        gameEvents.emit(EVENTS.GAME_WIN, this.score);
    }

    private handleGameStart() {
        this.physics.resume();
    }

    private shutdown() {
        gameEvents.off(EVENTS.GAME_START, this.handleGameStart, this);
        gameEvents.off(EVENTS.GAME_RESTART, this.handleRestart, this);
        gameEvents.off(EVENTS.GAME_NEXT_LEVEL, this.handleNextLevel, this);
    }

    private handleNextLevel() {
        this.cleanup();
        this.scene.restart({ isRestart: true, level: this.currentLevel + 1 });
    }

    private cleanup() {
        // Clean up power-up timer
        if (this.powerupTimer) {
            this.powerupTimer.remove();
            this.powerupTimer = undefined;
        }

        // Clean up existing objects
        this.walls?.clear(true, true);
        this.corn?.clear(true, true);
        this.powerups?.clear(true, true);
        this.farmers?.clear(true, true);
        this.turkey?.destroy();

        // Remove all tweens and timers
        this.tweens.killAll();
        this.time.removeAllEvents();
    }

    private handleRestart() {
        this.cleanup();

        // Restart the scene with isRestart flag, keeping current level
        this.scene.restart({ isRestart: true, level: this.currentLevel });
    }

    update() {
        if (this.gameOver || !this.cursors || !this.turkey) return;

        const speed = 200;

        // Reset velocity
        this.turkey.setVelocity(0);

        // Handle arrow key input
        if (this.cursors.left.isDown) {
            this.turkey.setVelocityX(-speed);
            this.turkey.setFlipX(true);
        } else if (this.cursors.right.isDown) {
            this.turkey.setVelocityX(speed);
            this.turkey.setFlipX(false);
        }

        if (this.cursors.up.isDown) {
            this.turkey.setVelocityY(-speed);
        } else if (this.cursors.down.isDown) {
            this.turkey.setVelocityY(speed);
        }
    }
}

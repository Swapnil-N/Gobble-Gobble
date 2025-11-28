import Phaser from 'phaser';
import { GameConfig } from '../config/GameConfig';
import { PowerUpManager } from './PowerUpManager';
import { EntitySpawner } from './EntitySpawner';
import { Turkey } from '../objects/Turkey';
import Farmer from '../objects/Farmer';
import { Corn } from '../objects/Corn';
import { Powerup } from '../objects/Powerup';
import { gameEvents, EVENTS } from '../events';
import { SoundManager } from '../utils/SoundManager';

export class CollisionHandler {
    private scene: Phaser.Scene;
    private spawner: EntitySpawner;
    private powerUpManager: PowerUpManager;
    private soundManager: SoundManager;

    // Game state references
    private score: number = 0;
    private lives: number = 3;
    private cornCount: number = 0;
    private totalCorn: number = 0;
    private gameOver: boolean = false;

    constructor(
        scene: Phaser.Scene,
        spawner: EntitySpawner,
        powerUpManager: PowerUpManager,
        soundManager: SoundManager
    ) {
        this.scene = scene;
        this.spawner = spawner;
        this.powerUpManager = powerUpManager;
        this.soundManager = soundManager;
    }

    public setupCollisions() {
        if (!this.spawner.turkey) return;

        // Turkey vs Walls
        this.scene.physics.add.collider(this.spawner.turkey, this.spawner.walls);

        // Farmers vs Walls
        this.scene.physics.add.collider(this.spawner.farmers, this.spawner.walls);

        // Turkey vs Corn
        this.scene.physics.add.overlap(
            this.spawner.turkey,
            this.spawner.corn,
            this.handleCornCollision,
            undefined,
            this
        );

        // Turkey vs Powerups
        this.scene.physics.add.overlap(
            this.spawner.turkey,
            this.spawner.powerups,
            this.handlePowerupCollision,
            undefined,
            this
        );

        // Turkey vs Farmers
        this.scene.physics.add.overlap(
            this.spawner.turkey,
            this.spawner.farmers,
            this.handleFarmerCollision,
            undefined,
            this
        );
    }

    public reset(totalCorn: number, currentScore: number, currentLives: number) {
        this.totalCorn = totalCorn;
        this.score = currentScore;
        this.lives = currentLives;
        this.cornCount = 0;
        this.gameOver = false;
    }

    private handleCornCollision(_turkey: any, corn: any) {
        if (corn instanceof Corn) {
            corn.collect();

            this.score += GameConfig.CORN_POINTS;
            this.cornCount++;

            this.soundManager.playEat();
            gameEvents.emit(EVENTS.SCORE_CHANGED, this.score);

            if (this.cornCount >= this.totalCorn) {
                this.handleWin();
            }
        }
    }

    private handlePowerupCollision(_turkey: any, powerup: any) {
        if (powerup instanceof Powerup) {
            powerup.collect();

            this.soundManager.playPowerUp();
            this.powerUpManager.activate();
        }
    }

    private handleFarmerCollision(turkey: any, farmer: any) {
        if (this.gameOver) return;

        const turkeyObj = turkey as Turkey;
        if (turkeyObj.isInvulnerable()) return;

        const farmerObj = farmer as Farmer;

        if (this.powerUpManager.isActive() && farmerObj.isScared) {
            // Eat Farmer
            this.score += GameConfig.FARMER_POINTS;
            gameEvents.emit(EVENTS.SCORE_CHANGED, this.score);

            this.spawner.respawnFarmer(farmerObj);
        } else if (!farmerObj.isScared) {
            // Die
            this.soundManager.playDie();
            this.lives--;
            gameEvents.emit(EVENTS.LIVES_CHANGED, this.lives);

            if (this.lives <= 0) {
                this.handleGameOver();
            } else {
                // Respawn turkey at start
                // We need the start position. 
                // Let's assume EntitySpawner knows it or we pass it.
                // Actually EntitySpawner.respawnTurkey() is incomplete in my previous step.
                // I need to fix that.
                // For now, let's assume spawner handles it.
                // Wait, I need to fix EntitySpawner.ts first or update it.
                // I'll update EntitySpawner.ts in the next step to include turkey start pos.

                // For now, let's just call a method on spawner that I will implement.
                this.spawner.respawnTurkey();
            }
        }
    }

    private handleWin() {
        this.gameOver = true;
        this.scene.physics.pause();
        this.soundManager.playWin();
        gameEvents.emit(EVENTS.GAME_WIN);
    }

    private handleGameOver() {
        this.gameOver = true;
        this.scene.physics.pause();
        gameEvents.emit(EVENTS.GAME_OVER, this.score);
    }
}

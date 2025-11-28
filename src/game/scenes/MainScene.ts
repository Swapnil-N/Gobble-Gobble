import Phaser from 'phaser';
import turkeyImg from '../../assets/turkey_transparent.png';
import cornImg from '../../assets/corn_sprite_1764017342942.png';
import farmerImg from '../../assets/farmer_transparent.png';
import powerupImg from '../../assets/powerup.png';
import { gameEvents, EVENTS } from '../events';
import { SoundManager } from '../utils/SoundManager';
import { GameConfig } from '../config/GameConfig';
import { PowerUpManager } from '../services/PowerUpManager';
import { EntitySpawner } from '../services/EntitySpawner';
import { CollisionHandler } from '../services/CollisionHandler';

export default class MainScene extends Phaser.Scene {
    private cursors?: Phaser.Types.Input.Keyboard.CursorKeys;
    private score: number = 0;
    private lives: number = 3;
    private currentLevel: number = 1;
    private gameOver: boolean = false;

    // Managers
    private soundManager!: SoundManager;
    private powerUpManager!: PowerUpManager;
    private entitySpawner!: EntitySpawner;
    private collisionHandler!: CollisionHandler;

    constructor() {
        super('MainScene');
    }

    preload() {
        this.load.image('turkey', turkeyImg);
        this.load.image('corn', cornImg);
        this.load.image('farmer', farmerImg);
        this.load.image('powerup', powerupImg);
    }

    init(data?: { isRestart: boolean, level?: number, score?: number, autoStart?: boolean }) {
        console.log('MainScene: init', data);

        // Initialize state from data BEFORE create runs
        if (data?.level !== undefined) {
            this.currentLevel = data.level;
        } else if (!data?.isRestart) {
            this.currentLevel = 1;
        }

        if (data?.score !== undefined) {
            this.score = data.score;
        } else if (!data?.isRestart) {
            this.score = 0;
        }
    }

    create(data?: { isRestart: boolean, level?: number, score?: number, autoStart?: boolean }) {
        console.log('MainScene: create', { level: this.currentLevel, score: this.score, data });

        this.lives = GameConfig.STARTING_LIVES;
        this.gameOver = false;

        // IMPORTANT: Handle physics state FIRST before spawning entities
        // This prevents collision callbacks from firing during entity creation
        if (data?.autoStart) {
            console.log('MainScene: Keeping physics running (autoStart)');
            // Physics is already running after restart, keep it that way
        } else {
            console.log('MainScene: Pausing physics (wait for start)');
            this.physics.pause();
        }

        // Initialize Managers
        this.soundManager = new SoundManager();
        this.powerUpManager = new PowerUpManager(this);
        this.entitySpawner = new EntitySpawner(this);
        this.collisionHandler = new CollisionHandler(
            this,
            this.entitySpawner,
            this.powerUpManager,
            this.soundManager
        );

        // Setup Event Listeners
        this.setupEventListeners();

        // Spawn Level Entities (now that physics is in correct state)
        const { totalCorn } = this.entitySpawner.spawnLevel(this.currentLevel);

        // Connect Managers
        this.powerUpManager.setFarmersGroup(this.entitySpawner.farmers);
        this.collisionHandler.reset(totalCorn, this.score, this.lives);
        this.collisionHandler.setupCollisions();

        // Setup Input
        if (this.input.keyboard) {
            this.cursors = this.input.keyboard.createCursorKeys();

            // Cheat code: Press '1' to win
            this.input.keyboard.on('keydown-ONE', () => {
                this.handleWin();
            });
        }

        // Emit initial UI events
        gameEvents.emit(EVENTS.SCORE_CHANGED, this.score);
        gameEvents.emit(EVENTS.LIVES_CHANGED, this.lives);
        gameEvents.emit(EVENTS.LEVEL_CHANGED, this.currentLevel);
    }

    private setupEventListeners() {
        // Remove existing listeners to avoid duplicates
        gameEvents.off(EVENTS.GAME_START, this.handleGameStart, this);
        gameEvents.off(EVENTS.GAME_RESTART, this.handleRestart, this);
        gameEvents.off(EVENTS.GAME_NEXT_LEVEL, this.handleNextLevel, this);
        gameEvents.off(EVENTS.SCORE_CHANGED, this.handleScoreChanged, this);
        this.events.off(Phaser.Scenes.Events.SHUTDOWN, this.shutdown, this);

        // Add listeners
        gameEvents.on(EVENTS.GAME_START, this.handleGameStart, this);
        gameEvents.on(EVENTS.GAME_RESTART, this.handleRestart, this);
        gameEvents.on(EVENTS.GAME_NEXT_LEVEL, this.handleNextLevel, this);
        gameEvents.on(EVENTS.SCORE_CHANGED, this.handleScoreChanged, this);
        this.events.on(Phaser.Scenes.Events.SHUTDOWN, this.shutdown, this);
    }

    private handleScoreChanged(newScore: number) {
        // Keep MainScene's score in sync with CollisionHandler's score
        this.score = newScore;
    }

    private handleGameStart() {
        console.log('MainScene: handleGameStart');
        this.physics.resume();
    }

    private handleRestart() {
        console.log('MainScene: handleRestart - calling scene.restart');
        this.scene.restart({ isRestart: true, level: this.currentLevel, score: 0, autoStart: true });
    }

    private handleNextLevel() {
        console.log('MainScene: handleNextLevel - calling scene.restart', this.currentLevel + 1);
        this.scene.restart({ isRestart: true, level: this.currentLevel + 1, score: this.score, autoStart: true });
    }

    private handleWin() {
        this.gameOver = true;
        this.physics.pause();
        this.soundManager.playWin();
        gameEvents.emit(EVENTS.GAME_WIN);
    }

    private shutdown() {
        console.log('MainScene: shutdown');
        gameEvents.off(EVENTS.GAME_START, this.handleGameStart, this);
        gameEvents.off(EVENTS.GAME_RESTART, this.handleRestart, this);
        gameEvents.off(EVENTS.GAME_NEXT_LEVEL, this.handleNextLevel, this);
        gameEvents.off(EVENTS.SCORE_CHANGED, this.handleScoreChanged, this);
        this.cleanup();
    }

    private cleanup() {
        this.powerUpManager?.cleanup();
        this.entitySpawner?.cleanup();
        this.tweens.killAll();
        this.time.removeAllEvents();
    }

    update() {
        if (this.gameOver || !this.cursors || !this.entitySpawner.turkey) return;

        // Delegate input handling to Turkey entity
        this.entitySpawner.turkey.handleInput(this.cursors);
    }
}

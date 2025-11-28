import Phaser from 'phaser';
import { GameConfig } from '../config/GameConfig';

export class Turkey extends Phaser.Physics.Arcade.Sprite {
    private isInvulnerableState: boolean = false;
    private flashTween?: Phaser.Tweens.Tween;

    constructor(scene: Phaser.Scene, x: number, y: number, texture: string) {
        super(scene, x, y, texture);

        scene.add.existing(this);
        scene.physics.add.existing(this);

        this.setCollideWorldBounds(true);

        // Scale turkey to fit within tile
        // We need to know tile size for exact scaling, but GameConfig has a percentage
        // We'll assume the spawner sets the final scale or we pass tile size?
        // Actually, MainScene calculated scale based on tile size.
        // Let's accept a scale factor or tile size in constructor?
        // Or just use the config percentage and assume the spawner handles the base size.
        // For now, let's just set the origin to center.
        this.setOrigin(0.5, 0.5);
    }

    /**
     * Handle keyboard input for movement
     * @param cursors Cursor keys
     */
    public handleInput(cursors: Phaser.Types.Input.Keyboard.CursorKeys) {
        if (!this.body) return;

        const speed = GameConfig.PLAYER_SPEED;

        // Reset velocity
        this.setVelocity(0);

        // Handle arrow key input
        if (cursors.left.isDown) {
            this.setVelocityX(-speed);
            this.setFlipX(true);
        } else if (cursors.right.isDown) {
            this.setVelocityX(speed);
            this.setFlipX(false);
        }

        if (cursors.up.isDown) {
            this.setVelocityY(-speed);
        } else if (cursors.down.isDown) {
            this.setVelocityY(speed);
        }
    }

    /**
     * Respawn the turkey at a specific position with animation
     * @param x New X position
     * @param y New Y position
     */
    public respawn(x: number, y: number) {
        this.setPosition(x, y);
        this.setAlpha(1);
        this.isInvulnerableState = true;

        // Pause physics body temporarily? 
        // MainScene paused the whole physics world, but here we might just want to disable this body?
        // Or maybe we rely on the scene to pause physics if that's the desired effect.
        // MainScene implementation:
        // this.physics.pause(); -> global pause
        // this.tweens.add(...)
        // onComplete: this.physics.resume();

        // If we want to encapsulate just the turkey's behavior:
        // We can't easily pause the whole world from here without side effects.
        // Let's just handle the visual flash and invulnerability state.
        // The Scene or Spawner should handle the global pause if needed.
        // But MainScene logic was: collision -> lives-- -> if lives > 0 -> respawnTurkey()
        // respawnTurkey() -> pause physics -> flash -> resume physics.

        // Let's replicate the flash effect
        if (this.flashTween) {
            this.flashTween.stop();
        }

        this.flashTween = this.scene.tweens.add({
            targets: this,
            alpha: GameConfig.PLAYER_RESPAWN_ALPHA,
            duration: GameConfig.PLAYER_RESPAWN_FLASH_DURATION,
            yoyo: true,
            repeat: GameConfig.PLAYER_RESPAWN_FLASH_REPEATS,
            onComplete: () => {
                this.setAlpha(1);
                this.isInvulnerableState = false;
                this.flashTween = undefined;
            }
        });
    }

    public isInvulnerable(): boolean {
        return this.isInvulnerableState;
    }

    public destroy(fromScene?: boolean) {
        if (this.flashTween) {
            this.flashTween.stop();
        }
        super.destroy(fromScene);
    }
}

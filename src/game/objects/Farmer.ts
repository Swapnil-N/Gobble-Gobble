import Phaser from 'phaser';

export default class Farmer extends Phaser.Physics.Arcade.Sprite {
    private speed: number = 100;
    private target?: Phaser.Physics.Arcade.Sprite;
    public isScared: boolean = false;
    private scaredTimer?: Phaser.Time.TimerEvent;
    private flashTween?: Phaser.Tweens.Tween;

    constructor(scene: Phaser.Scene, x: number, y: number, texture: string, target?: Phaser.Physics.Arcade.Sprite) {
        super(scene, x, y, texture);
        this.target = target;

        scene.add.existing(this);
        scene.physics.add.existing(this);

        this.setCollideWorldBounds(true);
        this.setScale(0.09);
    }

    becomeScared(duration: number = 10000) {
        this.isScared = true;
        this.setTint(0x8888ff); // Light blue tint
        this.speed = 50; // Slow down

        // Add flashing effect
        this.flashTween = this.scene.tweens.add({
            targets: this,
            alpha: 0.3,
            duration: 200,
            yoyo: true,
            repeat: -1
        });

        // Set timer to recover
        this.scaredTimer = this.scene.time.addEvent({
            delay: duration,
            callback: () => this.recover()
        });
    }

    recover() {
        this.isScared = false;
        this.clearTint();
        this.setAlpha(1);
        this.speed = 100;

        // Stop flashing
        if (this.flashTween) {
            this.flashTween.stop();
            this.flashTween = undefined;
        }

        // Clear timer
        if (this.scaredTimer) {
            this.scaredTimer.remove();
            this.scaredTimer = undefined;
        }
    }

    update() {
        if (!this.target) return;

        if (this.isScared) {
            // Run away from player
            const angle = Phaser.Math.Angle.Between(this.x, this.y, this.target.x, this.target.y);
            const oppositeAngle = angle + Math.PI;
            this.scene.physics.velocityFromRotation(oppositeAngle, this.speed, this.body?.velocity);
        } else {
            // Chase player
            this.scene.physics.moveToObject(this, this.target, this.speed);
        }

        // Flip sprite logic
        if (this.body) {
            if (this.body.velocity.x < 0) {
                this.setFlipX(true);
            } else {
                this.setFlipX(false);
            }
        }
    }

    destroy(fromScene?: boolean) {
        // Clean up timers and tweens
        if (this.flashTween) {
            this.flashTween.stop();
        }
        if (this.scaredTimer) {
            this.scaredTimer.remove();
        }
        super.destroy(fromScene);
    }
}

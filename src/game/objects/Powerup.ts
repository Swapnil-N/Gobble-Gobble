import Phaser from 'phaser';
import { GameConfig } from '../config/GameConfig';

export class Powerup extends Phaser.Physics.Arcade.Sprite {
    private pulseTween?: Phaser.Tweens.Tween;

    constructor(scene: Phaser.Scene, x: number, y: number, texture: string) {
        super(scene, x, y, texture);

        scene.add.existing(this);
        scene.physics.add.existing(this, true); // Static body
    }

    public init() {
        this.startPulse();
    }

    private startPulse() {
        this.pulseTween = this.scene.tweens.add({
            targets: this,
            scale: { from: this.scale, to: this.scale * GameConfig.POWERUP_PULSE_SCALE },
            duration: GameConfig.POWERUP_PULSE_DURATION,
            yoyo: true,
            repeat: -1
        });
    }

    public collect() {
        this.disableBody(true, true);
        if (this.pulseTween) {
            this.pulseTween.stop();
        }
    }

    public destroy(fromScene?: boolean) {
        if (this.pulseTween) {
            this.pulseTween.stop();
        }
        super.destroy(fromScene);
    }
}

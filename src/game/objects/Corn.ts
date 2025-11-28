import Phaser from 'phaser';

export class Corn extends Phaser.Physics.Arcade.Sprite {
    constructor(scene: Phaser.Scene, x: number, y: number, texture: string) {
        super(scene, x, y, texture);

        scene.add.existing(this);
        scene.physics.add.existing(this, true); // Static body
    }

    public collect() {
        this.disableBody(true, true);
    }
}

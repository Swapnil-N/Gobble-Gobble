import Phaser from 'phaser';
import { GameConfig } from '../config/GameConfig';
import Farmer from '../objects/Farmer';

export class PowerUpManager {
    private scene: Phaser.Scene;
    private powerupActive: boolean = false;
    private powerupTimer?: Phaser.Time.TimerEvent;
    private farmersGroup?: Phaser.Physics.Arcade.Group;

    constructor(scene: Phaser.Scene) {
        this.scene = scene;
    }

    public setFarmersGroup(farmers: Phaser.Physics.Arcade.Group) {
        this.farmersGroup = farmers;
    }

    public activate() {
        this.powerupActive = true;

        // Make all farmers scared
        if (this.farmersGroup) {
            this.farmersGroup.getChildren().forEach((farmer: any) => {
                if (farmer instanceof Farmer) {
                    farmer.becomeScared(GameConfig.POWERUP_DURATION);
                }
            });
        }

        // Clear existing timer if any
        if (this.powerupTimer) {
            this.powerupTimer.remove();
        }

        // Set timer to deactivate powerup
        this.powerupTimer = this.scene.time.addEvent({
            delay: GameConfig.POWERUP_DURATION,
            callback: () => {
                this.powerupActive = false;
                this.powerupTimer = undefined;
            }
        });
    }

    public isActive(): boolean {
        return this.powerupActive;
    }

    public cleanup() {
        if (this.powerupTimer) {
            this.powerupTimer.remove();
            this.powerupTimer = undefined;
        }
        this.powerupActive = false;
    }
}

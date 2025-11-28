import Phaser from 'phaser';
import { GameConfig, calculateTileSize } from '../config/GameConfig';
import { LevelData } from '../config/LevelData';
import { Turkey } from '../objects/Turkey';
import Farmer from '../objects/Farmer';
import { Corn } from '../objects/Corn';
import { Powerup } from '../objects/Powerup';

export class EntitySpawner {
    private scene: Phaser.Scene;

    // Groups
    public walls!: Phaser.Physics.Arcade.StaticGroup;
    public corn!: Phaser.Physics.Arcade.StaticGroup;
    public powerups!: Phaser.Physics.Arcade.StaticGroup;
    public farmers!: Phaser.Physics.Arcade.Group;

    // Entities
    public turkey?: Turkey;

    // Map properties
    private tileSize: number = 0;
    private offsetX: number = 0;
    private offsetY: number = 0;
    private totalCorn: number = 0;
    private turkeyStartX: number = 0;
    private turkeyStartY: number = 0;

    constructor(scene: Phaser.Scene) {
        this.scene = scene;
        this.initializeGroups();
    }

    private initializeGroups() {
        this.walls = this.scene.physics.add.staticGroup();
        this.corn = this.scene.physics.add.staticGroup();
        this.powerups = this.scene.physics.add.staticGroup();
        this.farmers = this.scene.physics.add.group({
            classType: Farmer,
            runChildUpdate: true,
        });
    }

    public spawnLevel(level: number): { totalCorn: number } {
        this.cleanup();
        this.totalCorn = 0;

        const map = LevelData.getMap(level);
        const mapWidth = map[0].length;
        const mapHeight = map.length;

        // Calculate tile size
        const { tileSize, offsetX, offsetY } = calculateTileSize(
            mapWidth,
            mapHeight,
            this.scene.game.config.width as number,
            this.scene.game.config.height as number
        );

        this.tileSize = tileSize;
        this.offsetX = offsetX;
        this.offsetY = offsetY;

        // Draw map
        for (let row = 0; row < map.length; row++) {
            for (let col = 0; col < map[row].length; col++) {
                const x = this.offsetX + col * this.tileSize + this.tileSize / 2;
                const y = this.offsetY + row * this.tileSize + this.tileSize / 2;

                if (map[row][col] === 1) {
                    // Wall
                    const wall = this.scene.add.rectangle(x, y, this.tileSize, this.tileSize, 0x0000ff);
                    this.scene.physics.add.existing(wall, true);
                    this.walls.add(wall);
                } else if (map[row][col] === 0 || map[row][col] === 2) {
                    // Path - check for powerup or corn
                    let isPowerupLocation = false;

                    if (level <= 2) {
                        // Static powerup positions for levels 1 & 2
                        isPowerupLocation = GameConfig.POWERUP_POSITIONS.some(p => p.row === row && p.col === col);
                    } else {
                        // Generated map powerup
                        isPowerupLocation = map[row][col] === 2;
                    }

                    if (isPowerupLocation) {
                        const powerup = new Powerup(this.scene, x, y, 'powerup');
                        const scale = (this.tileSize * GameConfig.POWERUP_SCALE) / powerup.width;
                        powerup.setScale(scale);
                        powerup.init();
                        powerup.refreshBody();
                        this.powerups.add(powerup);
                    } else {
                        const cornItem = new Corn(this.scene, x, y, 'corn');
                        const scale = (this.tileSize * GameConfig.CORN_SCALE) / cornItem.width;
                        cornItem.setScale(scale);
                        cornItem.refreshBody();
                        this.corn.add(cornItem);
                        this.totalCorn++;
                    }
                }
            }
        }

        // Spawn Turkey
        const centerCol = Math.floor(mapWidth / 2);
        const centerRow = Math.floor(mapHeight / 2);
        this.turkeyStartX = this.offsetX + centerCol * this.tileSize + this.tileSize / 2;
        this.turkeyStartY = this.offsetY + centerRow * this.tileSize + this.tileSize / 2;

        this.turkey = new Turkey(this.scene, this.turkeyStartX, this.turkeyStartY, 'turkey');
        const turkeyScale = (this.tileSize * GameConfig.PLAYER_SCALE) / this.turkey.width;
        this.turkey.setScale(turkeyScale);

        // Spawn Farmers
        GameConfig.FARMER_POSITIONS.forEach(pos => {
            const farmerX = this.offsetX + pos.col * this.tileSize + this.tileSize / 2;
            const farmerY = this.offsetY + pos.row * this.tileSize + this.tileSize / 2;

            const farmer = new Farmer(this.scene, farmerX, farmerY, 'farmer', this.turkey!);
            const farmerScale = (this.tileSize * GameConfig.FARMER_SCALE) / farmer.width;
            farmer.setScale(farmerScale);
            this.farmers.add(farmer);
        });

        return { totalCorn: this.totalCorn };
    }

    public respawnTurkey() {
        if (!this.turkey) return;
        this.turkey.respawn(this.turkeyStartX, this.turkeyStartY);
    }

    public respawnFarmer(farmer: Farmer) {
        if (!this.turkey) return;

        let farthestCorner: { row: number, col: number } = GameConfig.RESPAWN_CORNERS[0];
        let maxDistance = 0;

        GameConfig.RESPAWN_CORNERS.forEach(corner => {
            const x = this.offsetX + corner.col * this.tileSize + this.tileSize / 2;
            const y = this.offsetY + corner.row * this.tileSize + this.tileSize / 2;
            const distance = Phaser.Math.Distance.Between(this.turkey!.x, this.turkey!.y, x, y);

            if (distance > maxDistance) {
                maxDistance = distance;
                farthestCorner = corner;
            }
        });

        const newX = this.offsetX + farthestCorner.col * this.tileSize + this.tileSize / 2;
        const newY = this.offsetY + farthestCorner.row * this.tileSize + this.tileSize / 2;
        farmer.setPosition(newX, newY);
        farmer.recover();
    }

    public cleanup() {
        // More defensive cleanup to prevent errors during scene shutdown
        try {
            if (this.walls && this.walls.children) {
                this.walls.clear(true, true);
            }
        } catch (e) {
            console.warn('Error clearing walls:', e);
        }

        try {
            if (this.corn && this.corn.children) {
                this.corn.clear(true, true);
            }
        } catch (e) {
            console.warn('Error clearing corn:', e);
        }

        try {
            if (this.powerups && this.powerups.children) {
                this.powerups.clear(true, true);
            }
        } catch (e) {
            console.warn('Error clearing powerups:', e);
        }

        try {
            if (this.farmers && this.farmers.children) {
                this.farmers.clear(true, true);
            }
        } catch (e) {
            console.warn('Error clearing farmers:', e);
        }

        try {
            this.turkey?.destroy();
        } catch (e) {
            console.warn('Error destroying turkey:', e);
        }

        this.turkey = undefined;
    }
}

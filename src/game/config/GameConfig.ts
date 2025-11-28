/**
 * Game configuration constants
 * Centralizes all magic numbers and configuration values
 */

export const GameConfig = {
    // Player settings
    PLAYER_SPEED: 200,
    PLAYER_SCALE: 0.8, // Percentage of tile size
    PLAYER_RESPAWN_FLASH_DURATION: 100,
    PLAYER_RESPAWN_FLASH_REPEATS: 3,
    PLAYER_RESPAWN_ALPHA: 0.3,

    // Farmer settings
    FARMER_SCALE: 0.8, // Percentage of tile size
    FARMER_NORMAL_SPEED: 100,
    FARMER_SCARED_SPEED: 50,

    // Collectible settings
    CORN_SCALE: 0.3, // Percentage of tile size
    POWERUP_SCALE: 0.4, // Percentage of tile size
    POWERUP_DURATION: 10000, // milliseconds (10 seconds)
    POWERUP_PULSE_DURATION: 500, // milliseconds for pulse animation
    POWERUP_PULSE_SCALE: 1.2, // Scale multiplier for pulse

    // Scoring
    CORN_POINTS: 1,
    FARMER_POINTS: 10,

    // Starting values
    STARTING_LIVES: 3,
    STARTING_SCORE: 0,

    // Farmer spawn positions (row, col)
    FARMER_POSITIONS: [
        { row: 3, col: 3 },   // Top-left area
        { row: 3, col: 16 },  // Top-right area
        { row: 11, col: 10 },  // Bottom-center area
    ],

    // Powerup spawn positions for levels 1 & 2 (row, col)
    POWERUP_POSITIONS: [
        { row: 3, col: 9 },   // Upper middle area
        { row: 7, col: 5 },   // Left middle area
        { row: 9, col: 14 },  // Right middle area
    ],

    // Respawn corner positions (row, col)
    RESPAWN_CORNERS: [
        { row: 1, col: 1 },
        { row: 1, col: 18 },
        { row: 11, col: 1 },
        { row: 11, col: 18 },
    ],
} as const;

/**
 * Calculate tile size to fit the map on screen
 */
export function calculateTileSize(
    mapWidth: number,
    mapHeight: number,
    gameWidth: number,
    gameHeight: number
): { tileSize: number; offsetX: number; offsetY: number } {
    const tileSizeByWidth = Math.floor(gameWidth / mapWidth);
    const tileSizeByHeight = Math.floor(gameHeight / mapHeight);

    // Use the smaller tile size to ensure the entire map fits
    const tileSize = Math.min(tileSizeByWidth, tileSizeByHeight);

    // Calculate offsets to center the map
    const totalMapWidth = mapWidth * tileSize;
    const totalMapHeight = mapHeight * tileSize;
    const offsetX = (gameWidth - totalMapWidth) / 2;
    const offsetY = (gameHeight - totalMapHeight) / 2;

    return { tileSize, offsetX, offsetY };
}

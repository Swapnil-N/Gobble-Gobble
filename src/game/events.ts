import Phaser from 'phaser';

export const gameEvents = new Phaser.Events.EventEmitter();

export const EVENTS = {
    SCORE_CHANGED: 'score-changed',
    LEVEL_CHANGED: 'level-changed',
    LIVES_CHANGED: 'lives-changed',
    GAME_OVER: 'game-over',
    GAME_WIN: 'game-win',
    GAME_START: 'game-start',
    GAME_RESTART: 'game-restart',
    GAME_NEXT_LEVEL: 'game-next-level',
};

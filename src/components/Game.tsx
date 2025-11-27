import React, { useEffect, useRef, useState } from 'react';
import Phaser from 'phaser';
import config from '../game/phaserConfig';
import { gameEvents, EVENTS } from '../game/events';
import { saveScore, getLeaderboard, type PlayerScore, isFirebaseConfigured } from '../services/firebase';

const Game: React.FC = () => {
    const gameRef = useRef<Phaser.Game | null>(null);
    const [score, setScore] = useState(0);
    const [level, setLevel] = useState(1);
    const [lives, setLives] = useState(3);
    const [gameState, setGameState] = useState<'START' | 'PLAYING' | 'GAME_OVER' | 'GAME_WIN'>('START');
    const [playerName, setPlayerName] = useState('');
    const [isScoreSaved, setIsScoreSaved] = useState(false);
    const [showLeaderboard, setShowLeaderboard] = useState(false);
    const [leaderboardData, setLeaderboardData] = useState<PlayerScore[]>([]);

    useEffect(() => {
        if (!gameRef.current) {
            gameRef.current = new Phaser.Game(config);
        }

        const handleScore = (newScore: number) => setScore(newScore);
        const handleLevel = (newLevel: number) => setLevel(newLevel);
        const handleLives = (newLives: number) => setLives(newLives);
        const handleGameOver = () => setGameState('GAME_OVER');
        const handleGameWin = () => setGameState('GAME_WIN');

        gameEvents.on(EVENTS.SCORE_CHANGED, handleScore);
        gameEvents.on(EVENTS.LEVEL_CHANGED, handleLevel);
        gameEvents.on(EVENTS.LIVES_CHANGED, handleLives);
        gameEvents.on(EVENTS.GAME_OVER, handleGameOver);
        gameEvents.on(EVENTS.GAME_WIN, handleGameWin);

        return () => {
            gameEvents.off(EVENTS.SCORE_CHANGED, handleScore);
            gameEvents.off(EVENTS.LEVEL_CHANGED, handleLevel);
            gameEvents.off(EVENTS.LIVES_CHANGED, handleLives);
            gameEvents.off(EVENTS.GAME_OVER, handleGameOver);
            gameEvents.off(EVENTS.GAME_WIN, handleGameWin);

            if (gameRef.current) {
                gameRef.current.destroy(true);
                gameRef.current = null;
            }
        };
    }, []);

    const handleStartGame = () => {
        setGameState('PLAYING');
        setIsScoreSaved(false);
        setPlayerName('');
        gameEvents.emit(EVENTS.GAME_START);
    };

    const handlePlayAgain = () => {
        setGameState('PLAYING');
        setIsScoreSaved(false);
        setPlayerName('');
        gameEvents.emit(EVENTS.GAME_RESTART);
        gameEvents.emit(EVENTS.GAME_START);
    };

    const handleNextLevel = () => {
        setGameState('PLAYING');
        setIsScoreSaved(false);
        setPlayerName('');
        gameEvents.emit(EVENTS.GAME_NEXT_LEVEL);
        gameEvents.emit(EVENTS.GAME_START);
    };

    const handleSaveScore = async () => {
        if (!playerName) return;
        const success = await saveScore({
            name: playerName,
            score: score,
            level: level,
            date: new Date()
        });
        if (success) {
            setIsScoreSaved(true);
        } else {
            alert('Failed to save score. Check console for details.');
        }
    };

    const handleShowLeaderboard = async () => {
        if (!isFirebaseConfigured) {
            alert("Leaderboard is not available in offline mode.");
            return;
        }
        const data = await getLeaderboard();
        setLeaderboardData(data);
        setShowLeaderboard(true);
    };

    return (
        <div style={{ position: 'relative', width: '100%', height: '100%' }}>
            <div id="phaser-game" style={{ width: '100%', height: '100%' }} />

            {/* HUD */}
            {gameState === 'PLAYING' && (
                <div style={{ position: 'absolute', top: 10, left: 10, color: 'white', fontSize: '24px', pointerEvents: 'none', backgroundColor: 'rgba(0,0,0,0.6)', padding: '10px', borderRadius: '5px' }}>
                    <div>Score: {score}</div>
                    <div>Lives: {lives}</div>
                </div>
            )}

            {/* Main Menu */}
            {gameState === 'START' && (
                <div style={{
                    position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
                    backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex', flexDirection: 'column',
                    justifyContent: 'center', alignItems: 'center', color: 'white'
                }}>
                    <h1>Gobble Gobble</h1>
                    <button onClick={handleStartGame} style={{ padding: '10px 20px', fontSize: '20px', cursor: 'pointer', marginBottom: '10px' }}>
                        Start Game
                    </button>
                    <button
                        onClick={handleShowLeaderboard}
                        style={{ padding: '10px 20px', fontSize: '20px', cursor: 'pointer', opacity: isFirebaseConfigured ? 1 : 0.5 }}
                        title={isFirebaseConfigured ? "View Leaderboard" : "Offline Mode"}
                    >
                        Leaderboard
                    </button>
                    {!isFirebaseConfigured && <p style={{ marginTop: '10px', color: '#aaa' }}>Offline Mode Active</p>}
                </div>
            )}

            {/* Game Over */}
            {gameState === 'GAME_OVER' && (
                <div style={{
                    position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
                    backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex', flexDirection: 'column',
                    justifyContent: 'center', alignItems: 'center', color: 'white'
                }}>
                    <h1>Game Over</h1>
                    <p>Final Score: {score}</p>

                    {isFirebaseConfigured ? (
                        !isScoreSaved ? (
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '20px' }}>
                                <input
                                    type="text"
                                    placeholder="Enter Name"
                                    value={playerName}
                                    onChange={(e) => setPlayerName(e.target.value)}
                                    style={{ padding: '10px', fontSize: '16px', marginBottom: '10px' }}
                                />
                                <button onClick={handleSaveScore} style={{ padding: '5px 15px', fontSize: '16px', cursor: 'pointer' }}>
                                    Save Score
                                </button>
                            </div>
                        ) : (
                            <p style={{ color: 'green', marginBottom: '20px' }}>Score Saved!</p>
                        )
                    ) : (
                        <p style={{ color: '#aaa', marginBottom: '20px' }}>Offline Mode - Score saving disabled</p>
                    )}

                    <button onClick={handlePlayAgain} style={{ padding: '10px 20px', fontSize: '20px', cursor: 'pointer', marginBottom: '10px' }}>
                        Play Again
                    </button>
                    <button
                        onClick={handleShowLeaderboard}
                        style={{ padding: '10px 20px', fontSize: '20px', cursor: 'pointer', opacity: isFirebaseConfigured ? 1 : 0.5 }}
                    >
                        Leaderboard
                    </button>
                </div>
            )}

            {/* Game Win */}
            {gameState === 'GAME_WIN' && (
                <div style={{
                    position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
                    backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex', flexDirection: 'column',
                    justifyContent: 'center', alignItems: 'center', color: 'white'
                }}>
                    <h1 style={{ color: '#00ff00' }}>YOU WIN!</h1>
                    <p style={{ fontSize: '24px' }}>Final Score: {score}</p>

                    {isFirebaseConfigured ? (
                        !isScoreSaved ? (
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '20px' }}>
                                <input
                                    type="text"
                                    placeholder="Enter Name"
                                    value={playerName}
                                    onChange={(e) => setPlayerName(e.target.value)}
                                    style={{ padding: '10px', fontSize: '16px', marginBottom: '10px' }}
                                />
                                <button onClick={handleSaveScore} style={{ padding: '5px 15px', fontSize: '16px', cursor: 'pointer' }}>
                                    Save Score
                                </button>
                            </div>
                        ) : (
                            <p style={{ color: 'green', marginBottom: '20px' }}>Score Saved!</p>
                        )
                    ) : (
                        <p style={{ color: '#aaa', marginBottom: '20px' }}>Offline Mode - Score saving disabled</p>
                    )}

                    <button onClick={handlePlayAgain} style={{ padding: '10px 20px', fontSize: '20px', cursor: 'pointer', marginBottom: '10px' }}>
                        Play Again
                    </button>
                    {level < 2 && (
                        <button onClick={handleNextLevel} style={{ padding: '10px 20px', fontSize: '20px', cursor: 'pointer', marginBottom: '10px', marginLeft: '10px' }}>
                            Next Level
                        </button>
                    )}
                    <button
                        onClick={handleShowLeaderboard}
                        style={{ padding: '10px 20px', fontSize: '20px', cursor: 'pointer', opacity: isFirebaseConfigured ? 1 : 0.5 }}
                    >
                        Leaderboard
                    </button>
                </div>
            )}

            {/* Leaderboard Overlay */}
            {showLeaderboard && (
                <div style={{
                    position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
                    backgroundColor: 'rgba(0,0,0,0.9)', display: 'flex', flexDirection: 'column',
                    justifyContent: 'center', alignItems: 'center', color: 'white', zIndex: 10
                }}>
                    <h2>Leaderboard</h2>
                    <ul style={{ listStyle: 'none', padding: 0, fontSize: '18px', marginBottom: '20px' }}>
                        {leaderboardData.length > 0 ? (
                            leaderboardData.map((entry, index) => (
                                <li key={index} style={{ marginBottom: '5px' }}>
                                    {index + 1}. <strong>{entry.name}</strong> - {entry.score} (Lvl {entry.level})
                                </li>
                            ))
                        ) : (
                            <li>No scores yet.</li>
                        )}
                    </ul>
                    <button onClick={() => setShowLeaderboard(false)} style={{ padding: '10px 20px', fontSize: '18px', cursor: 'pointer' }}>
                        Close
                    </button>
                </div>
            )}
        </div>
    );
};

export default Game;

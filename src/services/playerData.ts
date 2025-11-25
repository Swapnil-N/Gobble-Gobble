import { db } from '../config/firebase';
import {
    collection,
    addDoc,
    getDocs,
    query,
    orderBy,
    limit,
    Timestamp,
    where,
    updateDoc,
    doc,
    getDoc,
} from 'firebase/firestore';

/**
 * Player data interface
 */
export interface PlayerData {
    id?: string;
    playerName: string;
    score: number;
    level: number;
    timestamp: Timestamp;
}

/**
 * Player stats interface
 */
export interface PlayerStats {
    playerName: string;
    highScore: number;
    totalGames: number;
    totalScore: number;
    highestLevel: number;
    lastPlayed: Timestamp;
}

/**
 * Save a game session to Firestore
 */
export async function saveGameSession(
    playerName: string,
    score: number,
    level: number
): Promise<string> {
    try {
        const sessionData: PlayerData = {
            playerName,
            score,
            level,
            timestamp: Timestamp.now(),
        };

        const docRef = await addDoc(collection(db, 'gameSessions'), sessionData);
        console.log('✅ Game session saved with ID:', docRef.id);

        // Update player stats
        await updatePlayerStats(playerName, score, level);

        return docRef.id;
    } catch (error) {
        console.error('❌ Error saving game session:', error);
        throw error;
    }
}

/**
 * Update or create player stats
 */
async function updatePlayerStats(
    playerName: string,
    score: number,
    level: number
): Promise<void> {
    try {
        // Query for existing player stats
        const statsQuery = query(
            collection(db, 'playerStats'),
            where('playerName', '==', playerName),
            limit(1)
        );

        const querySnapshot = await getDocs(statsQuery);

        if (querySnapshot.empty) {
            // Create new player stats
            const newStats: PlayerStats = {
                playerName,
                highScore: score,
                totalGames: 1,
                totalScore: score,
                highestLevel: level,
                lastPlayed: Timestamp.now(),
            };

            await addDoc(collection(db, 'playerStats'), newStats);
            console.log('✅ Created new player stats for:', playerName);
        } else {
            // Update existing player stats
            const existingDoc = querySnapshot.docs[0];
            const existingStats = existingDoc.data() as PlayerStats;

            const updatedStats: Partial<PlayerStats> = {
                highScore: Math.max(existingStats.highScore, score),
                totalGames: existingStats.totalGames + 1,
                totalScore: existingStats.totalScore + score,
                highestLevel: Math.max(existingStats.highestLevel, level),
                lastPlayed: Timestamp.now(),
            };

            await updateDoc(doc(db, 'playerStats', existingDoc.id), updatedStats);
            console.log('✅ Updated player stats for:', playerName);
        }
    } catch (error) {
        console.error('❌ Error updating player stats:', error);
        throw error;
    }
}

/**
 * Get top N players by high score
 */
export async function getLeaderboard(topN: number = 10): Promise<PlayerStats[]> {
    try {
        const leaderboardQuery = query(
            collection(db, 'playerStats'),
            orderBy('highScore', 'desc'),
            limit(topN)
        );

        const querySnapshot = await getDocs(leaderboardQuery);
        const leaderboard: PlayerStats[] = [];

        querySnapshot.forEach((doc) => {
            leaderboard.push(doc.data() as PlayerStats);
        });

        console.log(`✅ Retrieved top ${topN} players from leaderboard`);
        return leaderboard;
    } catch (error) {
        console.error('❌ Error getting leaderboard:', error);
        throw error;
    }
}

/**
 * Get player stats by name
 */
export async function getPlayerStats(playerName: string): Promise<PlayerStats | null> {
    try {
        const statsQuery = query(
            collection(db, 'playerStats'),
            where('playerName', '==', playerName),
            limit(1)
        );

        const querySnapshot = await getDocs(statsQuery);

        if (querySnapshot.empty) {
            console.log('ℹ️ No stats found for player:', playerName);
            return null;
        }

        const stats = querySnapshot.docs[0].data() as PlayerStats;
        console.log('✅ Retrieved stats for player:', playerName);
        return stats;
    } catch (error) {
        console.error('❌ Error getting player stats:', error);
        throw error;
    }
}

/**
 * Get recent game sessions (for activity feed)
 */
export async function getRecentSessions(limit_count: number = 20): Promise<PlayerData[]> {
    try {
        const sessionsQuery = query(
            collection(db, 'gameSessions'),
            orderBy('timestamp', 'desc'),
            limit(limit_count)
        );

        const querySnapshot = await getDocs(sessionsQuery);
        const sessions: PlayerData[] = [];

        querySnapshot.forEach((doc) => {
            sessions.push({ id: doc.id, ...doc.data() } as PlayerData);
        });

        console.log(`✅ Retrieved ${sessions.length} recent sessions`);
        return sessions;
    } catch (error) {
        console.error('❌ Error getting recent sessions:', error);
        throw error;
    }
}

import { db } from '../config/firebase';
import {
    collection,
    addDoc,
    getDocs,
    query,
    orderBy,
    limit,
    Timestamp,
} from 'firebase/firestore';

// Check if Firebase is configured
export const isFirebaseConfigured = !!import.meta.env.VITE_FIREBASE_API_KEY;

/**
 * Player score interface
 */
export interface PlayerScore {
    name: string;
    score: number;
    level: number;
    date: Date;
}

/**
 * Save a score to the leaderboard
 */
export const saveScore = async (scoreData: PlayerScore): Promise<boolean> => {
    if (!isFirebaseConfigured) {
        console.log('Offline mode: Score not saved to Firebase.');
        return false;
    }

    try {
        await addDoc(collection(db, 'scores'), {
            ...scoreData,
            date: Timestamp.now(),
        });
        console.log('✅ Score saved successfully');
        return true;
    } catch (error) {
        console.error('❌ Error saving score:', error);
        return false;
    }
};

/**
 * Get top scores for the leaderboard
 */
export const getLeaderboard = async (limitCount: number = 10): Promise<PlayerScore[]> => {
    if (!isFirebaseConfigured) {
        console.log('Offline mode: Leaderboard not available');
        return [];
    }

    try {
        const q = query(
            collection(db, 'scores'),
            orderBy('score', 'desc'),
            limit(limitCount)
        );

        const querySnapshot = await getDocs(q);
        const scores: PlayerScore[] = [];

        querySnapshot.forEach((doc) => {
            const data = doc.data();
            scores.push({
                name: data.name,
                score: data.score,
                level: data.level,
                date: data.date?.toDate() || new Date(),
            });
        });

        console.log(`✅ Retrieved ${scores.length} scores from leaderboard`);
        return scores;
    } catch (error) {
        console.error('❌ Error getting leaderboard:', error);
        return [];
    }
};

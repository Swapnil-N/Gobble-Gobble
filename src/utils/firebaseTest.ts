import { db } from '../config/firebase';
import { collection, addDoc, getDocs, Timestamp } from 'firebase/firestore';

/**
 * Simple test to verify Firebase/Firestore connection is working
 * This will write a test document and then read it back
 */
export async function testFirebaseConnection(): Promise<boolean> {
    try {
        console.log('🔥 Testing Firebase connection...');

        // 1. Write a test document
        const testData = {
            message: 'Firebase connection test',
            timestamp: Timestamp.now(),
            game: 'Gobble Gobble',
        };

        console.log('📝 Writing test document...');
        const docRef = await addDoc(collection(db, 'test'), testData);
        console.log('✅ Document written with ID:', docRef.id);

        // 2. Read all documents from test collection
        console.log('📖 Reading test documents...');
        const querySnapshot = await getDocs(collection(db, 'test'));
        console.log(`✅ Found ${querySnapshot.size} document(s) in test collection`);

        querySnapshot.forEach((doc) => {
            console.log(`  - Document ID: ${doc.id}`, doc.data());
        });

        console.log('🎉 Firebase connection test PASSED!');
        return true;

    } catch (error) {
        console.error('❌ Firebase connection test FAILED:', error);
        return false;
    }
}

/**
 * Call this function from your browser console or component to test
 * Example: import { testFirebaseConnection } from './utils/firebaseTest';
 *          testFirebaseConnection();
 */

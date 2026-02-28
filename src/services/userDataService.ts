import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';

/**
 * Service to handle extra user data (settings, history, preferences)
 * stored in Firestore.
 */

export interface UserExtraData {
  settings?: Record<string, any>;
  history?: any[];
  preferences?: Record<string, any>;
  [key: string]: any;
}

export const userDataService = {
  /**
   * Fetches extra data for a specific user
   * @param userId The unique identifier (email or id)
   */
  async getExtraData(userId: string): Promise<UserExtraData | null> {
    try {
      const docRef = doc(db, 'user_data', userId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return docSnap.data() as UserExtraData;
      }
      return null;
    } catch (error) {
      console.error('Error in getExtraData:', error);
      return null;
    }
  },

  /**
   * Saves or updates extra data for a specific user
   * @param userId The unique identifier
   * @param data The data to save
   */
  async saveExtraData(userId: string, data: UserExtraData): Promise<boolean> {
    try {
      const docRef = doc(db, 'user_data', userId);
      await setDoc(docRef, {
        ...data,
        updatedAt: new Date().toISOString()
      }, { merge: true });
      
      return true;
    } catch (error) {
      console.error('Error in saveExtraData:', error);
      return false;
    }
  }
};

/**
 * Service to handle extra user data (settings, history, preferences)
 * stored in the backend 'user_data' table.
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
      const response = await fetch(`/api/user-data/${encodeURIComponent(userId)}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch user data');
      }
      const result = await response.json();
      return result.data;
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
      const response = await fetch('/api/user-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId, data }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to save user data');
      }

      const result = await response.json();
      return result.success;
    } catch (error) {
      console.error('Error in saveExtraData:', error);
      return false;
    }
  }
};

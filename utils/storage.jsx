import AsyncStorage from '@react-native-async-storage/async-storage';

export const storage = {
  async getToken() {
    try {
      return await AsyncStorage.getItem('authToken');
    } catch (error) {
      console.error('Error getting token:', error);
      return null;
    }
  },

  async setToken(token) {
    try {
      await AsyncStorage.setItem('authToken', token);
    } catch (error) {
      console.error('Error setting token:', error);
    }
  },

  async removeToken() {
    try {
      await AsyncStorage.removeItem('authToken');
    } catch (error) {
      console.error('Error removing token:', error);
    }
  },

  async getUser() {
    try {
      const userJson = await AsyncStorage.getItem('user');
      return userJson ? JSON.parse(userJson) : null;
    } catch (error) {
      console.error('Error getting user:', error);
      return null;
    }
  },

  async setUser(user) {
    try {
      await AsyncStorage.setItem('user', JSON.stringify(user));
    } catch (error) {
      console.error('Error setting user:', error);
    }
  },

  async removeUser() {
    try {
      await AsyncStorage.removeItem('user');
    } catch (error) {
      console.error('Error removing user:', error);
    }
  },

  async getRecentMembers() {
    try {
      const recentJson = await AsyncStorage.getItem('recentMembers');
      console.log(recentJson,'recentJson');
      
      return recentJson ? JSON.parse(recentJson) : [];
    } catch (error) {
      console.error('Error getting recent members:', error);
      return [];
    }
  },

  async addRecentMember(member) {
    try {
      const recent = await storage.getRecentMembers();
      // Filter out if duplicate
      const filtered = recent.filter(m => {
        if (!m) return false;
        const isSame = 
          (m.id && member.id && m.id === member.id) ||
          (m._id && member._id && m._id === member._id) ||
          (m.id && member._id && m.id === member._id) ||
          (m._id && member.id && m._id === member.id) ||
          (m.email && member.email && m.email === member.email);
        return !isSame;
      });
      const updated = [member, ...filtered].slice(0, 5);
      await AsyncStorage.setItem('recentMembers', JSON.stringify(updated));
      return updated;
    } catch (error) {
      console.error('Error adding recent member:', error);
      return [];
    }
  },

  async getAiMode() {
    try {
      const val = await AsyncStorage.getItem('aiModeEnabled');
      return val !== null ? JSON.parse(val) : false;
    } catch (error) {
      console.error('Error getting AI mode:', error);
      return false;
    }
  },

  async setAiMode(enabled) {
    try {
      await AsyncStorage.setItem('aiModeEnabled', JSON.stringify(enabled));
    } catch (error) {
      console.error('Error setting AI mode:', error);
    }
  },
};
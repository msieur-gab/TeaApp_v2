// services/tea-database.js
// Database service for tea collection management

class TeaDatabaseService {
  constructor() {
    this.db = null;
  }

  async init() {
    if (this.db) return this.db;

    try {
      // Initialize Dexie database
      this.db = new Dexie('TeaCollection');
      
      // Define database schema
      this.db.version(1).stores({
        teas: '++id, name, category, origin, *tags, [category+name]',
        favorites: '++id, teaId, &[category+name]',
        categories: '++id, name',
        achievements: '++id, type, achievedAt'
      });
      
      // Add default categories if none exist
      await this._initCategories();
      
      console.log('Tea database initialized');
      return this.db;
    } catch (error) {
      console.error('Failed to initialize database:', error);
      throw error;
    }
  }
  
  async _initCategories() {
    const count = await this.db.categories.count();
    
    if (count === 0) {
      // Add default categories
      await this.db.categories.bulkAdd([
        { name: 'Green' },
        { name: 'Black' },
        { name: 'Oolong' },
        { name: 'White' },
        { name: 'Pu-erh' },
        { name: 'Yellow' }
      ]);
      
      console.log('Default categories added');
    }
  }
  
  // Tea CRUD methods
  async addTea(teaData) {
    if (!this.db) await this.init();
    
    try {
      // Check if tea already exists
      const existing = await this.db.teas
        .where({ name: teaData.name, category: teaData.category })
        .first();
      
      if (existing) {
        // Update existing tea
        await this.db.teas.update(existing.id, teaData);
        return existing.id;
      } else {
        // Add new tea
        const id = await this.db.teas.add(teaData);
        return id;
      }
    } catch (error) {
      console.error('Error adding tea:', error);
      throw error;
    }
  }
  
  async updateTea(id, teaData) {
    if (!this.db) await this.init();
    
    try {
      await this.db.teas.update(id, teaData);
      return true;
    } catch (error) {
      console.error('Error updating tea:', error);
      throw error;
    }
  }
  
  async deleteTea(id) {
    if (!this.db) await this.init();
    
    try {
      await this.db.teas.delete(id);
      return true;
    } catch (error) {
      console.error('Error deleting tea:', error);
      throw error;
    }
  }
  
  async getTea(id) {
    if (!this.db) await this.init();
    
    try {
      return await this.db.teas.get(id);
    } catch (error) {
      console.error('Error getting tea:', error);
      return null;
    }
  }
  
  async getAllTeas() {
    if (!this.db) await this.init();
    
    try {
      return await this.db.teas.toArray();
    } catch (error) {
      console.error('Error getting all teas:', error);
      return [];
    }
  }
  
  async getTeasByCategory(category) {
    if (!this.db) await this.init();
    
    try {
      return await this.db.teas.where('category').equals(category).toArray();
    } catch (error) {
      console.error(`Error getting teas by category ${category}:`, error);
      return [];
    }
  }
  
  async getTeasCount() {
    if (!this.db) await this.init();
    
    try {
      return await this.db.teas.count();
    } catch (error) {
      console.error('Error getting teas count:', error);
      return 0;
    }
  }
  
  async getCategoryTeaCount(category) {
    if (!this.db) await this.init();
    
    try {
      return await this.db.teas.where('category').equals(category).count();
    } catch (error) {
      console.error(`Error getting count for category ${category}:`, error);
      return 0;
    }
  }
  
  // Favorites management
  async addFavorite(teaId) {
    if (!this.db) await this.init();
    
    try {
      const tea = await this.getTea(teaId);
      if (!tea) throw new Error('Tea not found');
      
      // Check if already a favorite
      const existing = await this.db.favorites
        .where({ teaId })
        .first();
      
      if (!existing) {
        await this.db.favorites.add({
          teaId,
          category: tea.category,
          name: tea.name,
          addedAt: new Date()
        });
      }
      
      return true;
    } catch (error) {
      console.error('Error adding favorite:', error);
      throw error;
    }
  }
  
  async removeFavorite(teaId) {
    if (!this.db) await this.init();
    
    try {
      await this.db.favorites.where({ teaId }).delete();
      return true;
    } catch (error) {
      console.error('Error removing favorite:', error);
      throw error;
    }
  }
  
  async getFavorites() {
    if (!this.db) await this.init();
    
    try {
      // Get favorites with tea details
      const favorites = await this.db.favorites.toArray();
      
      // Fetch full tea details for each favorite
      const detailedFavorites = await Promise.all(
        favorites.map(async (fav) => {
          const tea = await this.getTea(fav.teaId);
          return { ...fav, teaDetails: tea };
        })
      );
      
      return detailedFavorites;
    } catch (error) {
      console.error('Error getting favorites:', error);
      return [];
    }
  }
  
  async isFavorite(teaId) {
    if (!this.db) await this.init();
    
    try {
      const favorite = await this.db.favorites
        .where({ teaId })
        .first();
      
      return !!favorite;
    } catch (error) {
      console.error('Error checking favorite status:', error);
      return false;
    }
  }
  
  // Categories management
  async getCategories() {
    if (!this.db) await this.init();
    
    try {
      return await this.db.categories.toArray();
    } catch (error) {
      console.error('Error getting categories:', error);
      return [];
    }
  }
  
  async addCategory(name) {
    if (!this.db) await this.init();
    
    try {
      // Check if category already exists
      const existing = await this.db.categories
        .where({ name })
        .first();
      
      if (!existing) {
        await this.db.categories.add({ name });
      }
      
      return true;
    } catch (error) {
      console.error('Error adding category:', error);
      throw error;
    }
  }
  
  // Achievement tracking
  async addAchievement(type, details = {}) {
    if (!this.db) await this.init();
    
    try {
      await this.db.achievements.add({
        type,
        details,
        achievedAt: new Date()
      });
      
      return true;
    } catch (error) {
      console.error('Error adding achievement:', error);
      throw error;
    }
  }
  
  async getAchievements() {
    if (!this.db) await this.init();
    
    try {
      return await this.db.achievements.toArray();
    } catch (error) {
      console.error('Error getting achievements:', error);
      return [];
    }
  }
  
  async hasAchievement(type) {
    if (!this.db) await this.init();
    
    try {
      const achievement = await this.db.achievements
        .where({ type })
        .first();
      
      return !!achievement;
    } catch (error) {
      console.error('Error checking achievement:', error);
      return false;
    }
  }

  async clearAllTeas() {
    if (!this.db) await this.init();
    
    try {
      await this.db.teas.clear();
      console.log('All teas cleared from database');
      return true;
    } catch (error) {
      console.error('Error clearing teas:', error);
      throw error;
    }
  }

  async getTeasByNameAndCategory(name, category) {
    if (!this.db) await this.init();
    
    try {
      return await this.db.teas
        .where({ name: name, category: category })
        .toArray();
    } catch (error) {
      console.error('Error getting teas by name and category:', error);
      return [];
    }
  }
}

// Create singleton instance
const TeaDatabase = new TeaDatabaseService();
export default TeaDatabase;

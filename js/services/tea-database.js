// services/tea-database.js
// Database service for tea collection management

class TeaDatabaseService {
  constructor() {
    this.db = null;
    this.initialized = false;
  }

  async init() {
    if (this.initialized) return this.db;

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
      
      this.initialized = true;
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
    if (!this.initialized) await this.init();
    
    try {
      // Check if tea already exists
      const existingTeas = await this.db.teas
        .where({ name: teaData.name, category: teaData.category })
        .toArray();
      
      if (existingTeas.length > 0) {
        const existing = existingTeas[0];
        console.log(`Tea "${teaData.name}" already exists, updating instead`);
        // Update existing tea
        await this.db.teas.update(existing.id, teaData);
        return existing.id;
      } else {
        // Add new tea
        console.log(`Adding new tea "${teaData.name}" to database`);
        const id = await this.db.teas.add(teaData);
        return id;
      }
    } catch (error) {
      console.error('Error adding tea:', error);
      throw error;
    }
  }
  
  async updateTea(id, teaData) {
    if (!this.initialized) await this.init();
    
    try {
      await this.db.teas.update(id, teaData);
      return true;
    } catch (error) {
      console.error('Error updating tea:', error);
      throw error;
    }
  }
  
  async deleteTea(id) {
    if (!this.initialized) await this.init();
    
    try {
      await this.db.teas.delete(id);
      return true;
    } catch (error) {
      console.error('Error deleting tea:', error);
      throw error;
    }
  }
  
  async getTea(id) {
    if (!this.initialized) await this.init();
    
    try {
      return await this.db.teas.get(id);
    } catch (error) {
      console.error('Error getting tea:', error);
      return null;
    }
  }
  
  async getTeaById(id) {
    return this.getTea(id);
  }
  
  async getAllTeas() {
    if (!this.initialized) await this.init();
    
    try {
      return await this.db.teas.toArray();
    } catch (error) {
      console.error('Error getting all teas:', error);
      return [];
    }
  }
  
  async getTeasByCategory(category) {
    if (!this.initialized) await this.init();
    
    try {
      return await this.db.teas.where('category').equals(category).toArray();
    } catch (error) {
      console.error(`Error getting teas by category ${category}:`, error);
      return [];
    }
  }
  
  async getTeasCount() {
    if (!this.initialized) await this.init();
    
    try {
      return await this.db.teas.count();
    } catch (error) {
      console.error('Error getting teas count:', error);
      return 0;
    }
  }
  
  async getCategoryTeaCount(category) {
    if (!this.initialized) await this.init();
    
    try {
      return await this.db.teas.where('category').equals(category).count();
    } catch (error) {
      console.error(`Error getting count for category ${category}:`, error);
      return 0;
    }
  }
  
  // Favorites management
  async addFavorite(teaId) {
    if (!this.initialized) await this.init();
    
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
    if (!this.initialized) await this.init();
    
    try {
      await this.db.favorites.where({ teaId }).delete();
      return true;
    } catch (error) {
      console.error('Error removing favorite:', error);
      throw error;
    }
  }
  
  async getFavorites() {
    if (!this.initialized) await this.init();
    
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
    if (!this.initialized) await this.init();
    
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
    if (!this.initialized) await this.init();
    
    try {
      return await this.db.categories.toArray();
    } catch (error) {
      console.error('Error getting categories:', error);
      return [];
    }
  }
  
  async addCategory(name) {
    if (!this.initialized) await this.init();
    
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
    if (!this.initialized) await this.init();
    
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
    if (!this.initialized) await this.init();
    
    try {
      return await this.db.achievements.toArray();
    } catch (error) {
      console.error('Error getting achievements:', error);
      return [];
    }
  }
  
  async hasAchievement(type) {
    if (!this.initialized) await this.init();
    
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
    if (!this.initialized) await this.init();
    
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
    if (!this.initialized) await this.init();
    
    try {
      return await this.db.teas
        .where({ name: name, category: category })
        .toArray();
    } catch (error) {
      console.error('Error getting teas by name and category:', error);
      return [];
    }
  }
  
  // Export database as JSON for backup
  async exportDatabase() {
    if (!this.initialized) await this.init();
    
    try {
      const teas = await this.db.teas.toArray();
      const favorites = await this.db.favorites.toArray();
      const categories = await this.db.categories.toArray();
      const achievements = await this.db.achievements.toArray();
      
      return {
        teas,
        favorites,
        categories,
        achievements,
        exportDate: new Date().toISOString(),
        version: 1
      };
    } catch (error) {
      console.error('Error exporting database:', error);
      throw error;
    }
  }
  
  // Import database from JSON backup
  async importDatabase(data) {
    if (!this.initialized) await this.init();
    
    try {
      // Validate data structure
      if (!data.teas || !Array.isArray(data.teas)) {
        throw new Error('Invalid data format: missing teas array');
      }
      
      // Begin transaction
      await this.db.transaction('rw', 
        [this.db.teas, this.db.favorites, this.db.categories, this.db.achievements], 
        async () => {
          // Clear existing data
          await this.db.teas.clear();
          await this.db.favorites.clear();
          await this.db.categories.clear();
          await this.db.achievements.clear();
          
          // Import teas
          if (data.teas.length > 0) {
            await this.db.teas.bulkAdd(data.teas);
          }
          
          // Import favorites
          if (data.favorites && data.favorites.length > 0) {
            await this.db.favorites.bulkAdd(data.favorites);
          }
          
          // Import categories
          if (data.categories && data.categories.length > 0) {
            await this.db.categories.bulkAdd(data.categories);
          } else {
            // Add default categories if none in import
            await this._initCategories();
          }
          
          // Import achievements
          if (data.achievements && data.achievements.length > 0) {
            await this.db.achievements.bulkAdd(data.achievements);
          }
        });
      
      console.log('Database import completed successfully');
      return true;
    } catch (error) {
      console.error('Error importing database:', error);
      throw error;
    }
  }
  
  // Enhanced tea retrieval helper that tries multiple approaches
  async getFullTeaDetails(teaData) {
    if (!this.initialized) await this.init();
    
    if (!teaData) return null;
    
    try {
      // Try various methods to find the tea
      
      // Method 1: Try by direct ID
      if (teaData.id) {
        const tea = await this.getTeaById(teaData.id);
        if (tea) {
          console.log(`Found tea by ID: ${teaData.id}`);
          return tea;
        }
        
        // Try with numeric conversion if it's a string with numbers
        if (typeof teaData.id === 'string' && /^\d+$/.test(teaData.id)) {
          const numericId = parseInt(teaData.id, 10);
          const teaByNumericId = await this.getTeaById(numericId);
          if (teaByNumericId) {
            console.log(`Found tea by numeric ID: ${numericId}`);
            return teaByNumericId;
          }
        }
      }
      
      // Method 2: Try by name and category
      if (teaData.name && teaData.category) {
        const teas = await this.getTeasByNameAndCategory(teaData.name, teaData.category);
        if (teas && teas.length > 0) {
          console.log(`Found tea by name and category: ${teaData.name}, ${teaData.category}`);
          return teas[0];
        }
      }
      
      // Method 3: Try by name alone
      if (teaData.name) {
        const allTeas = await this.getAllTeas();
        const matchingTeas = allTeas.filter(tea => 
          tea.name.toLowerCase() === teaData.name.toLowerCase());
        
        if (matchingTeas.length > 0) {
          console.log(`Found tea by name: ${teaData.name}`);
          return matchingTeas[0];
        }
      }
      
      // If all fails, return the original data
      console.warn(`Could not find complete data for tea: ${teaData.name || 'Unknown Tea'}`);
      return teaData;
    } catch (error) {
      console.error('Error in getFullTeaDetails:', error);
      return teaData;
    }
  }
}

// Create singleton instance
const TeaDatabase = new TeaDatabaseService();
export default TeaDatabase;
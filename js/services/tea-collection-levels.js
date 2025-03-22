// services/tea-collection-levels.js
// Gamification service for tea collection progress tracking

const TeaCollectionLevels = {
  // Each tea category follows a progression based on collection grid (4x pattern)
  categories: {
    "Green": [
      { 
        threshold: 4, 
        title: "Green Tea Sprout", 
        message: "Your first steps into the verdant world of green tea!",
        nextLevelMessage: "4 more green teas to become a Green Tea Sapling."
      },
      { 
        threshold: 8, 
        title: "Green Tea Sapling", 
        message: "Your green tea collection is taking root!",
        nextLevelMessage: "4 more green teas to reach Green Tea Explorer status."
      },
      { 
        threshold: 12, 
        title: "Green Tea Explorer", 
        message: "You're navigating the diverse landscape of green teas!",
        nextLevelMessage: "8 more green teas to become a Green Tea Connoisseur."
      },
      { 
        threshold: 20, 
        title: "Green Tea Connoisseur", 
        message: "Your palate is becoming refined in the art of green tea!",
        nextLevelMessage: "8 more green teas to unlock the Green Tea Master level."
      },
      { 
        threshold: 28, 
        title: "Green Tea Master", 
        message: "You've achieved mastery in the world of green teas!",
        nextLevelMessage: "8 more green teas to reach Artisan status."
      },
      { 
        threshold: 36, 
        title: "Green Tea Artisan", 
        message: "Your green tea expertise is approaching legendary depths!",
        nextLevelMessage: "8 more green teas to become a Gongfu Grand Master."
      },
      { 
        threshold: 44, 
        title: "Green Tea Gongfu Grand Master", 
        message: "You are the ultimate Green Tea Legend!",
        nextLevelMessage: "8 more green teas to complete your ultimate collection."
      },
      { 
        threshold: 52, 
        title: "Green Tea Collection Complete", 
        message: "You've achieved the pinnacle of green tea mastery!",
        nextLevelMessage: null
      }
    ],
    "Oolong": [
      { 
        threshold: 4, 
        title: "Oolong Apprentice", 
        message: "Your first steps into the nuanced world of oolong!",
        nextLevelMessage: "4 more oolong teas to become an Oolong Learner."
      },
      { 
        threshold: 8, 
        title: "Oolong Learner", 
        message: "You're discovering the complexity of oolong teas!",
        nextLevelMessage: "4 more oolong teas to reach Oolong Explorer status."
      },
      { 
        threshold: 12, 
        title: "Oolong Explorer", 
        message: "The diverse world of oolong is opening up to you!",
        nextLevelMessage: "8 more oolong teas to become an Oolong Specialist."
      },
      { 
        threshold: 20, 
        title: "Oolong Specialist", 
        message: "Your understanding of oolong's intricate flavors is deepening!",
        nextLevelMessage: "8 more oolong teas to unlock the Oolong Master level."
      },
      { 
        threshold: 28, 
        title: "Oolong Master", 
        message: "You've conquered the art of oolong tea!",
        nextLevelMessage: "8 more oolong teas to reach Artisan status."
      },
      { 
        threshold: 36, 
        title: "Oolong Artisan", 
        message: "Your oolong expertise is approaching legendary depths!",
        nextLevelMessage: "8 more oolong teas to become a Gongfu Grand Master."
      },
      { 
        threshold: 44, 
        title: "Oolong Gongfu Grand Master", 
        message: "You are the ultimate Oolong Tea Legend!",
        nextLevelMessage: "8 more oolong teas to complete your ultimate collection."
      },
      { 
        threshold: 52, 
        title: "Oolong Collection Complete", 
        message: "You've achieved the pinnacle of oolong mastery!",
        nextLevelMessage: null
      }
    ],
    "Black": [
      { 
        threshold: 4, 
        title: "Black Tea Novice", 
        message: "Your bold journey into black teas begins!",
        nextLevelMessage: "4 more black teas to become a Black Tea Enthusiast."
      },
      { 
        threshold: 8, 
        title: "Black Tea Enthusiast", 
        message: "Your appreciation for robust black teas is growing!",
        nextLevelMessage: "4 more black teas to reach Black Tea Explorer status."
      },
      { 
        threshold: 12, 
        title: "Black Tea Explorer", 
        message: "You're uncovering the rich world of black teas!",
        nextLevelMessage: "8 more black teas to become a Black Tea Connoisseur."
      },
      { 
        threshold: 20, 
        title: "Black Tea Connoisseur", 
        message: "Your palate is becoming sophisticated in black tea nuances!",
        nextLevelMessage: "8 more black teas to unlock the Black Tea Master level."
      },
      { 
        threshold: 28, 
        title: "Black Tea Master", 
        message: "You've mastered the depth of black teas!",
        nextLevelMessage: "8 more black teas to reach Artisan status."
      },
      { 
        threshold: 36, 
        title: "Black Tea Artisan", 
        message: "Your black tea expertise is approaching legendary depths!",
        nextLevelMessage: "8 more black teas to become a Gongfu Grand Master."
      },
      { 
        threshold: 44, 
        title: "Black Tea Gongfu Grand Master", 
        message: "You are the ultimate Black Tea Legend!",
        nextLevelMessage: "8 more black teas to complete your ultimate collection."
      },
      { 
        threshold: 52, 
        title: "Black Tea Collection Complete", 
        message: "You've achieved the pinnacle of black tea mastery!",
        nextLevelMessage: null
      }
    ],
    "White": [
      { 
        threshold: 4, 
        title: "White Tea Initiate", 
        message: "Your delicate journey into white teas begins!",
        nextLevelMessage: "4 more white teas to become a White Tea Learner."
      },
      { 
        threshold: 8, 
        title: "White Tea Learner", 
        message: "You're discovering the subtle world of white teas!",
        nextLevelMessage: "4 more white teas to reach White Tea Explorer status."
      },
      { 
        threshold: 12, 
        title: "White Tea Explorer", 
        message: "The gentle realm of white teas is unfolding before you!",
        nextLevelMessage: "8 more white teas to become a White Tea Connoisseur."
      },
      { 
        threshold: 20, 
        title: "White Tea Connoisseur", 
        message: "Your appreciation for white tea's delicate nature is deepening!",
        nextLevelMessage: "8 more white teas to unlock the White Tea Master level."
      },
      { 
        threshold: 28, 
        title: "White Tea Master", 
        message: "You've achieved mastery in the art of white teas!",
        nextLevelMessage: "8 more white teas to reach Artisan status."
      },
      { 
        threshold: 36, 
        title: "White Tea Artisan", 
        message: "Your white tea expertise is approaching legendary depths!",
        nextLevelMessage: "8 more white teas to become a Gongfu Grand Master."
      },
      { 
        threshold: 44, 
        title: "White Tea Gongfu Grand Master", 
        message: "You are the ultimate White Tea Legend!",
        nextLevelMessage: "8 more white teas to complete your ultimate collection."
      },
      { 
        threshold: 52, 
        title: "White Tea Collection Complete", 
        message: "You've achieved the pinnacle of white tea mastery!",
        nextLevelMessage: null
      }
    ],
    "Pu-erh": [
      { 
        threshold: 4, 
        title: "Pu-erh Novice", 
        message: "Your journey into the world of aged teas begins!",
        nextLevelMessage: "4 more pu-erh teas to become a Pu-erh Apprentice."
      },
      { 
        threshold: 8, 
        title: "Pu-erh Apprentice", 
        message: "You're exploring the complex world of pu-erh!",
        nextLevelMessage: "4 more pu-erh teas to reach Pu-erh Explorer status."
      },
      { 
        threshold: 12, 
        title: "Pu-erh Explorer", 
        message: "The mysterious world of aged teas is opening up to you!",
        nextLevelMessage: "8 more pu-erh teas to become a Pu-erh Specialist."
      },
      { 
        threshold: 20, 
        title: "Pu-erh Specialist", 
        message: "Your understanding of pu-erh's depth is growing!",
        nextLevelMessage: "8 more pu-erh teas to unlock the Pu-erh Master level."
      },
      { 
        threshold: 28, 
        title: "Pu-erh Master", 
        message: "You've unlocked the secrets of pu-erh tea!",
        nextLevelMessage: "8 more pu-erh teas to reach Artisan status."
      },
      { 
        threshold: 36, 
        title: "Pu-erh Artisan", 
        message: "Your pu-erh expertise is approaching legendary depths!",
        nextLevelMessage: "8 more pu-erh teas to become a Gongfu Grand Master."
      },
      { 
        threshold: 44, 
        title: "Pu-erh Gongfu Grand Master", 
        message: "You are the ultimate Pu-erh Tea Legend!",
        nextLevelMessage: "8 more pu-erh teas to complete your ultimate collection."
      },
      { 
        threshold: 52, 
        title: "Pu-erh Collection Complete", 
        message: "You've achieved the pinnacle of pu-erh mastery!",
        nextLevelMessage: null
      }
    ],
    "Yellow": [
      { 
        threshold: 4, 
        title: "Yellow Tea Initiate", 
        message: "Your rare journey into the world of yellow teas begins!",
        nextLevelMessage: "4 more yellow teas to become a Yellow Tea Learner."
      },
      { 
        threshold: 8, 
        title: "Yellow Tea Learner", 
        message: "You're discovering the subtle world of yellow teas!",
        nextLevelMessage: "4 more yellow teas to reach Yellow Tea Explorer status."
      },
      { 
        threshold: 12, 
        title: "Yellow Tea Explorer", 
        message: "The gentle realm of yellow teas is unfolding before you!",
        nextLevelMessage: "8 more yellow teas to become a Yellow Tea Connoisseur."
      },
      { 
        threshold: 20, 
        title: "Yellow Tea Connoisseur", 
        message: "Your appreciation for yellow tea's delicate nature is deepening!",
        nextLevelMessage: "8 more yellow teas to unlock the Yellow Tea Master level."
      },
      { 
        threshold: 28, 
        title: "Yellow Tea Master", 
        message: "You've achieved mastery in the art of yellow teas!",
        nextLevelMessage: "8 more yellow teas to reach Artisan status."
      },
      { 
        threshold: 36, 
        title: "Yellow Tea Artisan", 
        message: "Your yellow tea expertise is approaching legendary depths!",
        nextLevelMessage: "8 more yellow teas to become a Gongfu Grand Master."
      },
      { 
        threshold: 44, 
        title: "Yellow Tea Gongfu Grand Master", 
        message: "You are the ultimate Yellow Tea Legend!",
        nextLevelMessage: "8 more yellow teas to complete your ultimate collection."
      },
      { 
        threshold: 52, 
        title: "Yellow Tea Collection Complete", 
        message: "You've achieved the pinnacle of yellow tea mastery!",
        nextLevelMessage: null
      }
    ]
  },

  // Achievement badges
  badges: {
    "categoryBadges": {
      "Green": [
        { level: 4, name: "Green Sprout", icon: "🌱", color: "#7B9070" },
        { level: 12, name: "Green Explorer", icon: "🌿", color: "#7B9070" },
        { level: 28, name: "Green Master", icon: "🍃", color: "#7B9070" },
        { level: 52, name: "Green Legend", icon: "🏆", color: "#7B9070" }
      ],
      "Black": [
        { level: 4, name: "Black Novice", icon: "🔥", color: "#A56256" },
        { level: 12, name: "Black Explorer", icon: "🌋", color: "#A56256" },
        { level: 28, name: "Black Master", icon: "⚫", color: "#A56256" },
        { level: 52, name: "Black Legend", icon: "🏆", color: "#A56256" }
      ],
      "Oolong": [
        { level: 4, name: "Oolong Apprentice", icon: "🌊", color: "#C09565" },
        { level: 12, name: "Oolong Explorer", icon: "🧭", color: "#C09565" },
        { level: 28, name: "Oolong Master", icon: "🌀", color: "#C09565" },
        { level: 52, name: "Oolong Legend", icon: "🏆", color: "#C09565" }
      ],
      "White": [
        { level: 4, name: "White Initiate", icon: "❄️", color: "#D8DCD5" },
        { level: 12, name: "White Explorer", icon: "🌨️", color: "#D8DCD5" },
        { level: 28, name: "White Master", icon: "⚪", color: "#D8DCD5" },
        { level: 52, name: "White Legend", icon: "🏆", color: "#D8DCD5" }
      ],
      "Pu-erh": [
        { level: 4, name: "Pu-erh Novice", icon: "🍂", color: "#6F5244" },
        { level: 12, name: "Pu-erh Explorer", icon: "⏳", color: "#6F5244" },
        { level: 28, name: "Pu-erh Master", icon: "🏺", color: "#6F5244" },
        { level: 52, name: "Pu-erh Legend", icon: "🏆", color: "#6F5244" }
      ],
      "Yellow": [
        { level: 4, name: "Yellow Initiate", icon: "🌞", color: "#D1CDA6" },
        { level: 12, name: "Yellow Explorer", icon: "🌟", color: "#D1CDA6" },
        { level: 28, name: "Yellow Master", icon: "⭐", color: "#D1CDA6" },
        { level: 52, name: "Yellow Legend", icon: "🏆", color: "#D1CDA6" }
      ]
    },
    "milestones": [
      { threshold: 10, name: "Tea Enthusiast", icon: "🍵", description: "Collected 10 teas" },
      { threshold: 25, name: "Tea Aficionado", icon: "📚", description: "Collected 25 teas" },
      { threshold: 50, name: "Tea Scholar", icon: "🧠", description: "Collected 50 teas" },
      { threshold: 100, name: "Tea Sage", icon: "👑", description: "Collected 100 teas" },
      { threshold: 200, name: "Tea Grandmaster", icon: "🌠", description: "Collected 200 teas" }
    ],
    "special": [
      { id: "all-categories", name: "Diverse Palette", icon: "🌈", description: "Collect at least one tea from each category" },
      { id: "full-category", name: "Completionist", icon: "✅", description: "Complete any tea category collection" },
      { id: "brew-master", name: "Brew Master", icon: "⏱️", description: "Brew 50 perfect cups of tea" },
      { id: "tea-journey", name: "Tea Journey", icon: "🗺️", description: "Collect teas from 10 different regions" }
    ]
  },

  /**
   * Get the current level for a specific tea category
   * @param {string} category - Tea category (Green, Oolong, etc.)
   * @param {number} collectedCount - Number of teas collected in the category
   * @returns {Object|null} Current level details or null if category not found
   */
  getCurrentLevel(category, collectedCount) {
    if (!this.categories[category]) return null;

    // Find the highest level achieved
    const levels = this.categories[category];
    for (let i = levels.length - 1; i >= 0; i--) {
      if (collectedCount >= levels[i].threshold) {
        return levels[i];
      }
    }

    // If no level reached, return first level info
    return {
      threshold: 0,
      title: `${category} Tea Beginner`,
      message: `Start your ${category} tea collection journey!`,
      nextLevelMessage: `${levels[0].threshold} ${category.toLowerCase()} teas to reach ${levels[0].title}.`
    };
  },

  /**
   * Get the next level for a specific tea category
   * @param {string} category - Tea category (Green, Oolong, etc.)
   * @param {number} collectedCount - Number of teas collected in the category
   * @returns {Object|null} Next level details or null if at max level
   */
  getNextLevel(category, collectedCount) {
    if (!this.categories[category]) return null;

    const levels = this.categories[category];
    for (let i = 0; i < levels.length; i++) {
      if (collectedCount < levels[i].threshold) {
        return levels[i];
      }
    }

    // If at max level
    return null;
  },

  /**
   * Get comprehensive collection progress details
   * @param {string} category - Tea category (Green, Oolong, etc.)
   * @param {number} collectedCount - Number of teas collected in the category
   * @returns {Object} Detailed collection progress information
   */
  getCollectionProgress(category, collectedCount) {
    if (!this.categories[category]) {
      return {
        category,
        currentLevel: { title: "Unknown Category" },
        nextLevel: null,
        collectedCount: 0,
        progressMessage: "Unknown tea category",
        isCollectionComplete: false
      };
    }

    const levels = this.categories[category];
    
    // Find the current and next level
    let currentLevel = this.getCurrentLevel(category, collectedCount);
    let nextLevel = this.getNextLevel(category, collectedCount);

    // Prepare progress message
    let progressMessage = '';
    if (nextLevel) {
      const remainingTeas = nextLevel.threshold - collectedCount;
      progressMessage = `You have collected ${collectedCount} out of ${nextLevel.threshold} teas needed to become a ${nextLevel.title}. 
      ${remainingTeas} more ${category} tea${remainingTeas > 1 ? 's' : ''} to go!`;
    } else {
      // If at the final level
      progressMessage = `Congratulations! You have completed your ${category} Tea collection with ${collectedCount} teas!`;
    }

    return {
      category,
      currentLevel: currentLevel,
      nextLevel: nextLevel,
      collectedCount: collectedCount,
      progressMessage: progressMessage,
      isCollectionComplete: !nextLevel
    };
  },

  /**
   * Get badges earned for a specific category and count
   * @param {string} category - Tea category (Green, Oolong, etc.)
   * @param {number} collectedCount - Number of teas collected in the category
   * @returns {Array} Array of earned badges
   */
  getCategoryBadges(category, collectedCount) {
    if (!this.badges.categoryBadges[category]) return [];
    
    return this.badges.categoryBadges[category].filter(badge => 
      collectedCount >= badge.level
    );
  },

  /**
   * Check if a new level milestone has been reached
   * @param {string} category - Tea category
   * @param {number} oldCount - Previous collection count
   * @param {number} newCount - New collection count
   * @returns {Object|null} Level milestone info or null if no new milestone
   */
  checkLevelUp(category, oldCount, newCount) {
    if (!this.categories[category]) return null;
    
    const levels = this.categories[category];
    
    // Check if any level thresholds were crossed
    for (const level of levels) {
      if (oldCount < level.threshold && newCount >= level.threshold) {
        // Level up! Return the level info and any earned badges
        const earnedBadges = this.badges.categoryBadges[category]?.filter(badge => 
          badge.level === level.threshold
        ) || [];
        
        return {
          levelInfo: level,
          badges: earnedBadges,
          message: `Congratulations! You've reached ${level.title}!`
        };
      }
    }
    
    return null;
  },

  /**
   * Check milestone achievements
   * @param {number} totalTeas - Total teas collected across all categories
   * @param {number} previousTotal - Previous total count
   * @returns {Object|null} Milestone badge earned or null
   */
  checkMilestones(totalTeas, previousTotal) {
    for (const milestone of this.badges.milestones) {
      if (previousTotal < milestone.threshold && totalTeas >= milestone.threshold) {
        return milestone;
      }
    }
    return null;
  }
};

export default TeaCollectionLevels;
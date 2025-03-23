// components/tea-collection.js
// Enhanced tea collection with improved header and theme-based styling

import { teaEvents, TeaEventTypes } from '../services/event-manager.js';
import TeaTheme from '../utils/tea-theme.js';
import TeaDatabase from '../services/tea-database.js';
import TeaCollectionLevels from '../services/tea-collection-levels.js';
import ColorUtility from '../utils/color-utility.js';
import { TeaThemeGenerator } from '../utils/theme-generator.js';

class TeaCollection extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    
    // State management
    this._state = {
      category: 'Green',
      collectedTeas: [],
      totalTeas: 0,
      levelInfo: null,
      isTransitioning: false,
      renderAttempts: 0
    };
    
    // Theme colors
    this._themeColors = {
      primary: '#7B9070', // Default to Green tea
      text: '#FFFFFF',
      light: '#9db293',
      dark: '#5d6e54'
    };
    
    // Bind methods
    this._handleCategoryChange = this._handleCategoryChange.bind(this);
    this._handleTeaAdded = this._handleTeaAdded.bind(this);
    this._handleTeaSelect = this._handleTeaSelect.bind(this);
  }

  connectedCallback() {
    // Get initial category from attribute or default to 'Green'
    this._state.category = this.getAttribute('category') || 'Green';
    
    // Update theme colors based on category
    this._updateThemeColors(this._state.category);
    
    // Initial render
    this.render();
    
    // Listen for events
    teaEvents.on(TeaEventTypes.TEA_ADDED, this._handleTeaAdded);
    teaEvents.on(TeaEventTypes.CATEGORY_CHANGED, this._handleCategoryChange);
    teaEvents.on(TeaEventTypes.TEA_SELECTED, this._handleTeaSelect);
    
    // Listen specifically for category changes to update pills
    document.addEventListener('category-changed', () => {
      // Only update header colors, not the entire component
      setTimeout(() => this._applyThemeToAppHeader(), 10);
    });
    
    // Legacy event listener for backward compatibility
    this.addEventListener('tea-select', (event) => {
      teaEvents.emit(TeaEventTypes.TEA_SELECTED, event.detail);
    });
    
    // Load initial data
    this._loadCategoryData();
    
    // Apply theme to app header
    this._applyThemeToAppHeader();
  }
  
  disconnectedCallback() {
    // Clean up event listeners
    teaEvents.off(TeaEventTypes.TEA_ADDED, this._handleTeaAdded);
    teaEvents.off(TeaEventTypes.CATEGORY_CHANGED, this._handleCategoryChange);
    teaEvents.off(TeaEventTypes.TEA_SELECTED, this._handleTeaSelect);
    
    document.removeEventListener('category-changed', null);
    this.removeEventListener('tea-select', null);
  }
  
  static get observedAttributes() {
    return ['category'];
  }
  
  attributeChangedCallback(name, oldValue, newValue) {
    if (name === 'category' && oldValue !== newValue) {
      this._state.category = newValue;
      this._updateThemeColors(newValue);
      this._loadCategoryData();
      this._applyThemeToAppHeader();
    }
  }
  
  // Getters and setters for properties
  get category() {
    return this._state.category;
  }
  
  set category(value) {
    if (this._state.category !== value) {
      this._state.category = value;
      this.setAttribute('category', value);
      this._updateThemeColors(value);
      this._loadCategoryData();
      this._applyThemeToAppHeader();
      
      // Dispatch category change event via event manager
      teaEvents.emit(TeaEventTypes.CATEGORY_CHANGED, { 
        category: value,
        source: 'tea-collection' 
      });
      
      // Also trigger DOM event for broader compatibility
      const event = new CustomEvent('category-changed', { 
        bubbles: true,
        detail: { category: value }
      });
      this.dispatchEvent(event);
    }
  }
  
  // Update theme colors based on category
  _updateThemeColors(category) {
    const baseColor = TeaThemeGenerator.getTeaColor(category);
    this._themeColors = {
      primary: baseColor,
      text: ColorUtility.getOptimalTextColor(baseColor),
      light: ColorUtility.lightenColor(baseColor, 20),
      dark: ColorUtility.darkenColor(baseColor, 20)
    };
  }
  
  // Apply theme to app header
  _applyThemeToAppHeader() {
    // Get app header
    const appHeader = document.querySelector('.app-header');
    if (appHeader) {
      // Set background color to match current category
      appHeader.style.backgroundColor = this._themeColors.primary;
      appHeader.style.color = this._themeColors.text;
      
      // First, get the current category base color
      const currentCategoryColor = this._themeColors.primary;
      const darkerColor = ColorUtility.darkenColor(currentCategoryColor, 20);
      const lighterColor = ColorUtility.lightenColor(currentCategoryColor, 20);
      
      // Update category pills
      const pills = appHeader.querySelectorAll('.category-pill');
      pills.forEach(pill => {
        const pillCategory = pill.dataset.category;
        const isActive = pillCategory === this._state.category;
        
        if (isActive) {
          // Active pill gets darker color
          pill.style.backgroundColor = darkerColor;
          pill.style.color = ColorUtility.getOptimalTextColor(darkerColor);
        } else {
          // Inactive pills get lighter color of the CURRENT category
          pill.style.backgroundColor = lighterColor;
          pill.style.color = ColorUtility.getOptimalTextColor(lighterColor);
        }
      });
    }
  }
  
  // Event handlers
  _handleCategoryChange(event) {
    // Only update if from external source to prevent loops
    if (event.source !== 'tea-collection') {
      this.category = event.category;
    }
  }
  
  _handleTeaAdded(event) {
    const teaData = event.tea;
    
    // If the added tea is in our current category, refresh the data
    if (teaData && teaData.category === this._state.category) {
      // Force refresh with a small delay to let database operations complete
      setTimeout(() => {
        this._loadCategoryData();
      }, 300);
    }
  }
  
  _handleTeaSelect(event) {
    // Handle tea selection
    console.log('Tea selected in collection:', event);
  }
  
  async _loadCategoryData() {
    try {
      this._state.isTransitioning = true;
      this.render(); // Show loading state
      
      // Get teas from database
      await this._fetchTeaData();
      
      // Get level information from TeaCollectionLevels
      this._state.levelInfo = this._getLevelInfo();
      
      // Update state
      this._state.isTransitioning = false;
      
      // Update the DOM
      this.render();
      
      // Trigger animation after render
      setTimeout(() => {
        const circles = this.shadowRoot.querySelectorAll('tea-circle');
        
        circles.forEach((circle, index) => {
          setTimeout(() => {
            circle.setAttribute('animate-in', 'true');
          }, index * 30); // Stagger animation
        });
      }, 50);
      
    } catch (error) {
      console.error('Error loading tea data:', error);
      this._state.isTransitioning = false;
      this.render();
    }
  }
  
  async _fetchTeaData() {
    try {
      // Use TeaDatabase to get teas
      const teas = await TeaDatabase.getTeasByCategory(this._state.category);
      
      // Count collected teas
      const collectedCount = teas.length;
      
      // Set total based on level progression (using the last level threshold)
      const levels = TeaCollectionLevels.categories[this._state.category] || [];
      this._state.totalTeas = levels.length > 0 ? levels[levels.length - 1].threshold : 52;
      
      // Generate uncollected tea spots
      const uncollectedCount = this._state.totalTeas - collectedCount;
      
      const uncollectedTeas = Array(uncollectedCount)
        .fill()
        .map((_, index) => ({
          id: `uncollected-${index}`,
          name: `Unknown ${this._state.category} Tea`,
          category: this._state.category,
          collected: false
        }));
      
      // Combine collected and uncollected, with collected teas first
      this._state.collectedTeas = [...teas.map(tea => ({
        ...tea,
        collected: true
      })), ...uncollectedTeas];
      
      return this._state.collectedTeas;
    } catch (error) {
      console.error('Error fetching tea data:', error);
      this._state.collectedTeas = [];
      this._state.totalTeas = 0;
      return [];
    }
  }
  
  _getLevelInfo() {
    // Get the collected count
    const collectedCount = this._state.collectedTeas.filter(t => t.collected).length;
    
    // Use TeaCollectionLevels to get progress info
    const progressInfo = TeaCollectionLevels.getCollectionProgress(this._state.category, collectedCount);
    
    // Get category theme color
    const categoryColor = TeaTheme.getColor(this._state.category);
    
    // Return enhanced progress info with theme color
    return {
      ...progressInfo,
      color: categoryColor
    };
  }
  
  _renderTeas() {
    // Empty container if transitioning
    if (this._state.isTransitioning) {
      return '<div class="loading">Loading teas...</div>';
    }
    
    // Create a grid of tea circles
    return `
      <div class="tea-grid">
        ${this._state.collectedTeas.map((tea, index) => `
          <tea-circle 
            id="${tea.id || `tea-${index}`}" 
            name="${tea.name || 'Unknown Tea'}" 
            category="${tea.category || this._state.category}" 
            ${tea.collected ? 'collected' : ''} 
            tea-id="${tea.id || `tea-${index}`}"
            index="${index}">
          </tea-circle>
        `).join('')}
      </div>
    `;
  }
  
  render() {
    // Use a fixed pixel height for the header that doesn't change on scroll
    const headerHeight = `${Math.round(window.innerHeight * 0.6)}px`;
    
    // Generate styles with dynamic header height and theme colors
    const styles = `
      :host {
        display: block;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        --header-height: ${headerHeight};
        --primary-color: ${this._themeColors.primary};
        --text-color: ${this._themeColors.text};
        --light-color: ${this._themeColors.light};
        --dark-color: ${this._themeColors.dark};
      }
      
      .collection-container {
        position: relative;
      }
      
      .collection-header {
        height: var(--header-height);
        background-color: var(--primary-color);
        color: var(--text-color);
        display: flex;
        flex-direction: column;
        justify-content: space-between; /* Changed to space-between for top/bottom justification */
        padding: 2rem;
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
        position: relative;
        overflow: hidden;
        transition: all 0.3s ease;
      }
      
      .header-bg-pattern {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        opacity: 0.1;
        background-image: radial-gradient(circle at 20% 80%, var(--light-color) 0%, transparent 60%),
                          radial-gradient(circle at 80% 20%, var(--light-color) 0%, transparent 60%);
      }
      
      .header-top-content,
      .header-bottom-content {
        display: flex;
        flex-direction: column;
        width: 100%;
      }
      
      .collection-title {
        font-size: 0.9rem;
        text-transform: uppercase;
        letter-spacing: 1px;
        margin-bottom: 0.5rem;
        position: relative;
        font-weight: 600;
      }
      
      .collection-counter {
        display: flex;
        align-items: flex-start;
        margin-top: 1rem;
        margin-bottom: 0;
        position: relative;
      }
      
      .counter-value {
        font-size: 5rem;
        font-weight: 200;
        line-height: 1;
        margin-right: 1rem;
      }
      
      .counter-details {
        font-size: 1.1rem;
        opacity: 0.9;
        line-height: 1.5;
        padding-top: 0.5rem;
      }
      
      .level-info {
        background-color: rgba(255, 255, 255, 0.15);
        border-radius: 12px;
        padding: 1.5rem;
        position: relative;
        backdrop-filter: blur(8px);
        -webkit-backdrop-filter: blur(8px);
      }
      
      .progress-bar-container {
        height: 8px;
        background-color: rgba(255, 255, 255, 0.2);
        border-radius: 4px;
        overflow: hidden;
        margin: 1rem 0;
      }
      
      .progress-bar {
        height: 100%;
        background-color: var(--text-color);
        border-radius: 4px;
        transition: width 0.5s ease;
      }
      
      .progress-labels {
        display: flex;
        justify-content: space-between;
        font-size: 0.875rem;
        opacity: 0.9;
      }
      
      .progress-message {
        margin-top: 1rem;
        font-style: italic;
        font-size: 0.9rem;
      }
      
      .tea-grid-container {
        padding: 2rem 1rem;
        background-color: #f9f9f9;
        min-height: 100vh;
      }
      
      .tea-grid {
        display: grid;
        grid-template-columns: repeat(4, 1fr); /* Always 4 columns as requested */
        gap: 16px;
        justify-items: center;
        align-items: center;
      }
      
      .loading {
        text-align: center;
        padding: 4rem 0;
        color: #666;
        font-style: italic;
      }
      
      .scroll-indicator {
        align-self: center; /* Center in flex container */
        color: var(--text-color);
        opacity: 0.7;
        font-size: 0.9rem;
        display: flex;
        flex-direction: column;
        align-items: center;
        animation: bounce 2s infinite;
        margin-bottom: 10px;
      }
      
      .scroll-indicator svg {
        width: 24px;
        height: 24px;
        margin-bottom: 8px;
      }
      
      @keyframes bounce {
        0%, 20%, 50%, 80%, 100% {
          transform: translateY(0);
        }
        40% {
          transform: translateY(-10px);
        }
        60% {
          transform: translateY(-5px);
        }
      }
      
      @media (min-width: 768px) {
        .tea-grid {
          grid-template-columns: repeat(4, 1fr); /* Keep 4 columns on all screen sizes */
          gap: 24px;
        }
        
        .counter-value {
          font-size: 7rem;
        }
        
        .counter-details {
          font-size: 1.3rem;
        }
      }
      
      @media (min-width: 1024px) {
        .tea-grid {
          grid-template-columns: repeat(4, 1fr); /* Keep 4 columns on all screen sizes */
          gap: 32px;
        }
      }
      
      @media (max-width: 480px) {
        .collection-header {
          padding: 1.5rem;
        }
        
        .counter-value {
          font-size: 4rem;
        }
        
        .counter-details {
          font-size: 1rem;
        }
        
        /* Keep 4 columns even on mobile */
        .tea-grid {
          grid-template-columns: repeat(4, 1fr);
          gap: 10px; /* Slightly smaller gap on mobile */
        }
      }
    `;
    
    // Calculate progress percentage for next level
    let progressPercentage = 0;
    let currentThreshold = 0;
    let nextThreshold = 0;
    
    if (this._state.levelInfo) {
      // Get total count and collected count
      const totalCount = this._state.totalTeas;
      const collectedCount = this._state.collectedTeas.filter(t => t.collected).length;
      
      if (this._state.levelInfo.nextLevel) {
        // If there is a next level, calculate progress towards it
        currentThreshold = this._state.levelInfo.currentLevel.threshold || 0;
        nextThreshold = this._state.levelInfo.nextLevel.threshold;
        
        // Calculate percentage within the current level bracket
        const levelProgress = collectedCount - currentThreshold;
        const levelTotal = nextThreshold - currentThreshold;
        progressPercentage = (levelProgress / levelTotal) * 100;
      } else {
        // If collection is complete
        progressPercentage = 100;
      }
    }
    
    this.shadowRoot.innerHTML = `
      <style>${styles}</style>
      <section class="collection-container">
        <header class="collection-header">
          <div class="header-bg-pattern"></div>
          
          <div class="header-top-content">
            <p class="collection-title">YOUR ${this._state.category.toUpperCase()} TEA COLLECTION</p>
            
            <div class="collection-counter">
              <div class="counter-value">${this._state.collectedTeas.filter(t => t.collected).length}</div>
              <div class="counter-details">
                out of the available ${this._state.totalTeas}<br>
                ${this._state.category} teas<br>
                from our collection
              </div>
            </div>
          </div>
          
          <div class="header-bottom-content">
            ${this._state.levelInfo ? `
              <div class="level-info">
                <div><strong>Current Level:</strong> ${this._state.levelInfo.currentLevel.title}</div>
                <div><strong>Next Level:</strong> ${this._state.levelInfo.nextLevel?.title || 'Collection Complete!'}</div>
                
                <div class="progress-bar-container">
                  <div class="progress-bar" style="width: ${progressPercentage}%"></div>
                </div>
                
                <div class="progress-labels">
                  <span class="progress-label">${this._state.levelInfo.currentLevel.title}</span>
                  <span class="progress-count">
                    ${this._state.collectedTeas.filter(t => t.collected).length}/${this._state.levelInfo.nextLevel?.threshold || this._state.totalTeas}
                  </span>
                </div>
                
                <div class="progress-message">${this._state.levelInfo.progressMessage}</div>
              </div>
            ` : ''}
            
            <div class="scroll-indicator">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
              <span>Scroll to explore</span>
            </div>
          </div>
        </header>
        
        <div class="tea-grid-container">
          ${this._renderTeas()}
        </div>
      </section>
    `;
  }
}

// This is the same class name as before - no renaming
customElements.define('tea-collection', TeaCollection);

export default TeaCollection;

// components/tea-collection.js
// Enhanced version with fixes for tea circle handling

import { teaEvents, TeaEventTypes } from '../services/event-manager.js';
import TeaTheme from '../utils/tea-theme.js';
import TeaDatabase from '../services/tea-database.js';
import TeaCollectionLevels from '../services/tea-collection-levels.js';

class TeaCollection extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    
    // Improved state management
    this._state = {
      category: 'Green',
      collectedTeas: [],
      totalTeas: 0,
      levelInfo: null,
      isTransitioning: false,
      renderAttempts: 0
    };
    
    // Bind methods
    this._handleCategoryChange = this._handleCategoryChange.bind(this);
    this._handleTeaAdded = this._handleTeaAdded.bind(this);
    this._handleTeaSelect = this._handleTeaSelect.bind(this);
  }

  connectedCallback() {
    // Get initial category from attribute or default to 'Green'
    this._state.category = this.getAttribute('category') || 'Green';
    
    // Initial render
    this.render();
    
    // Listen for events using the event manager
    teaEvents.on(TeaEventTypes.TEA_ADDED, this._handleTeaAdded);
    teaEvents.on(TeaEventTypes.CATEGORY_CHANGED, this._handleCategoryChange);
    teaEvents.on(TeaEventTypes.TEA_SELECTED, this._handleTeaSelect);
    
    // Also listen for the legacy event
    this.addEventListener('tea-select', (event) => {
      // Convert it to use the event manager
      teaEvents.emit(TeaEventTypes.TEA_SELECTED, event.detail);
    });
    
    // Load initial data
    this._loadCategoryData();
  }
  
  disconnectedCallback() {
    // Clean up event listeners
    teaEvents.off(TeaEventTypes.TEA_ADDED, this._handleTeaAdded);
    teaEvents.off(TeaEventTypes.CATEGORY_CHANGED, this._handleCategoryChange);
    teaEvents.off(TeaEventTypes.TEA_SELECTED, this._handleTeaSelect);
    
    this.removeEventListener('tea-select', null);
  }
  
  static get observedAttributes() {
    return ['category'];
  }
  
  attributeChangedCallback(name, oldValue, newValue) {
    if (name === 'category' && oldValue !== newValue) {
      this._state.category = newValue;
      this._loadCategoryData();
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
      this._loadCategoryData();
      
      // Dispatch category change event via event manager
      teaEvents.emit(TeaEventTypes.CATEGORY_CHANGED, { 
        category: value,
        source: 'tea-collection' 
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
    // Handle tea selection - intentionally not doing anything that would
    // remove tea circles from the DOM. The tea-detail component will
    // handle showing the details.
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
    this._state.renderAttempts++;
    
    // Get theme color for progress bar
    const categoryColor = TeaTheme.getColor(this._state.category);
    
    const styles = `
      :host {
        display: block;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      }
      
      .collection-container {
        position: relative;
      }
      
      .collection-header {
        margin-bottom: 1.5rem;
      }
      
      .collection-title {
        font-size: 0.75rem;
        text-transform: uppercase;
        color: #666;
        margin-bottom: 0.5rem;
      }
      
      .collection-counter {
        display: flex;
        justify-content: space-between;
        align-items: baseline;
        padding: 1rem 0;
        border-top: 1px solid #eee;
        border-bottom: 1px solid #eee;
      }
      
      .counter-value {
        font-size: 2.5rem;
        font-weight: 300;
        color: #333;
      }
      
      .counter-details {
        font-size: 0.9rem;
        color: #666;
        line-height: 1.4;
      }
      
      .level-info {
        margin-top: 1rem;
        font-size: 0.9rem;
        color: #555;
        padding: 0.75rem;
        background: #f5f8fa;
        border-radius: 6px;
      }
      
      .progress-bar-container {
        height: 8px;
        background-color: #eee;
        border-radius: 4px;
        overflow: hidden;
        margin: 0.5rem 0;
      }
      
      .progress-bar {
        height: 100%;
        background-color: ${categoryColor};
        border-radius: 4px;
        transition: width 0.5s ease;
      }
      
      .progress-message {
        margin-top: 0.5rem;
        font-style: italic;
      }
      
      .tea-grid {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 16px;
        padding: 16px;
        justify-items: center;
        align-items: center;
      }
      
      .loading {
        text-align: center;
        padding: 2rem;
        color: #666;
      }
      
      @media (min-width: 768px) {
        .tea-grid {
          grid-template-columns: repeat(5, 1fr);
        }
      }
      
      @media (min-width: 1024px) {
        .tea-grid {
          grid-template-columns: repeat(6, 1fr);
        }
      }
      
      /* Fix for tea-circle child components */
      ::slotted(tea-circle),
      tea-circle {
        display: block !important;
        pointer-events: auto !important;
      }
    `;
    
    // Get total count and collected count
    const totalCount = this._state.totalTeas;
    const collectedCount = this._state.collectedTeas.filter(t => t.collected).length;
    
    // Calculate progress percentage for next level
    let progressPercentage = 0;
    let currentThreshold = 0;
    let nextThreshold = 0;
    
    if (this._state.levelInfo) {
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
          <p class="collection-title">You have collected</p>
          <div class="collection-counter">
            <div class="counter-value">${collectedCount}</div>
            <div class="counter-details">
              out of the available ${totalCount}<br>
              ${this._state.category} teas<br>
              from our collection
            </div>
          </div>
          ${this._state.levelInfo ? `
            <div class="level-info">
              <div><strong>Current Level:</strong> ${this._state.levelInfo.currentLevel.title}</div>
              <div><strong>Next Level:</strong> ${this._state.levelInfo.nextLevel?.title || 'Collection Complete!'}</div>
              
              <div class="progress-bar-container">
                <div class="progress-bar" style="width: ${progressPercentage}%"></div>
              </div>
              
              <div class="progress-message">${this._state.levelInfo.progressMessage}</div>
            </div>
          ` : ''}
        </header>
        
        ${this._renderTeas()}
      </section>
    `;
  }
}

customElements.define('tea-collection', TeaCollection);

export default TeaCollection;

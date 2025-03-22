// components/tea-collection.js
// Enhanced version with debugging and improved rendering

import TeaDatabase from '../services/tea-database.js';
import TeaCollectionLevels from '../services/tea-collection-levels.js';

class TeaCollection extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    
    // State
    this._category = 'Green';
    this._collectedTeas = [];
    this._totalTeas = 0;
    this._levelInfo = null;
    this._isTransitioning = false;
    this._renderAttempts = 0;
    
    // Debug flag
    this._debug = true;
    
    // Bind methods
    this._handleCategoryChange = this._handleCategoryChange.bind(this);
    this._handleTeaAdded = this._handleTeaAdded.bind(this);
    this._handleTeaSelect = this._handleTeaSelect.bind(this);
    
    if (this._debug) console.log('TeaCollection component constructor called');
  }

  connectedCallback() {
    if (this._debug) console.log('TeaCollection connected to DOM');
    
    // Initial render
    this.render();
    
    // Listen for category changes
    this.addEventListener('category-change', this._handleCategoryChange);
    
    // Listen for tea added events
    document.addEventListener('tea-added', this._handleTeaAdded);
    
    // Load initial data
    this._loadCategoryData();
    
    // Add event listener for tea-select events
    document.addEventListener('tea-select', this._handleTeaSelect);
  }
  
  disconnectedCallback() {
    if (this._debug) console.log('TeaCollection disconnected from DOM');
    this.removeEventListener('category-change', this._handleCategoryChange);
    document.removeEventListener('tea-added', this._handleTeaAdded);
    this.removeEventListener('tea-select', this._handleTeaSelect);
  }
  
  static get observedAttributes() {
    return ['category'];
  }
  
  attributeChangedCallback(name, oldValue, newValue) {
    if (this._debug) console.log(`Attribute changed: ${name}, from ${oldValue} to ${newValue}`);
    
    if (name === 'category' && oldValue !== newValue) {
      this._category = newValue;
      this._loadCategoryData();
    }
  }
  
  // Getters and setters for properties
  get category() {
    return this._category;
  }
  
  set category(value) {
    if (this._debug) console.log(`Setting category to: ${value}`);
    
    if (this._category !== value) {
      this._category = value;
      this.setAttribute('category', value);
      this._loadCategoryData();
      
      // Dispatch category change event
      this.dispatchEvent(new CustomEvent('category-change', {
        bubbles: true,
        composed: true,
        detail: { category: value }
      }));
    }
  }
  
  // Private methods
  _handleCategoryChange(event) {
    const newCategory = event.detail.category;
    if (this._debug) console.log(`Category change event received: ${newCategory}`);
    this.category = newCategory;
  }
  
  _handleTeaAdded(event) {
    const teaData = event.detail.tea;
    
    if (this._debug) console.log('Tea added event received:', teaData);
    
    // If the added tea is in our current category, refresh the data
    if (teaData && teaData.category === this._category) {
      if (this._debug) console.log('Tea matches current category, refreshing collection.');
      
      // Force refresh with a small delay to let database operations complete
      setTimeout(() => {
        this._loadCategoryData();
      }, 300);
    }
  }
  
  _handleTeaSelect(event) {
    if (this._debug) console.log('Tea select event received:', event.detail);
    
    // Find the tea-detail component
    const teaDetail = document.querySelector('tea-detail');
    if (!teaDetail) {
      console.error('Tea detail component not found');
      return;
    }
    
    // Get the selected tea's ID and other details from the event
    const { id, name, category } = event.detail;
    
    // Try to find the tea in our collection first
    let selectedTea = this._collectedTeas.find(tea => 
      (tea.id === id || tea.name === name) && tea.collected
    );
    
    if (!selectedTea) {
      console.warn(`Tea not found in current collection. Using event data instead.`);
      
      // If not found in collection, use the data from the event
      selectedTea = {
        id: id,
        name: name,
        category: category,
        collected: true
      };
      
      // Optionally fetch more details from the database
      TeaDatabase.getTeaById(id)
        .then(teaData => {
          if (teaData) {
            // If we found more data, update the detail view
            const updatedTeaData = {
              ...teaData,
              description: teaData.description || `A ${category.toLowerCase()} tea.`,
              brewTime: teaData.brewTime || '3:00',
              temperature: teaData.temperature || '85°C'
            };
            
            // Only update if the detail is still open with this tea
            if (teaDetail._isOpen && teaDetail._currentTeaId === id) {
              teaDetail.updateData(updatedTeaData);
            }
          }
        })
        .catch(err => console.error('Error fetching additional tea data:', err));
    }
    
    // Create the tea data object for the detail view
    const teaData = {
      id: selectedTea.id,
      name: selectedTea.name,
      category: selectedTea.category,
      description: selectedTea.description || `A ${selectedTea.category.toLowerCase()} tea.`,
      brewTime: selectedTea.brewTime || '3:00',
      temperature: selectedTea.temperature || '85°C'
    };
    
    // Check if tea detail is already open
    if (teaDetail._isOpen) {
      teaDetail.close();
      
      // Wait for the close animation to finish
      setTimeout(() => {
        teaDetail.open(teaData);
      }, 300);
    } else {
      teaDetail.open(teaData);
    }
  }
  
  async _loadCategoryData() {
    try {
      if (this._debug) console.log(`Loading data for category: ${this._category}`);
      
      this._isTransitioning = true;
      this.render(); // Show loading state
      
      // Get teas from database
      await this._fetchTeaData();
      
      // Get level information from TeaCollectionLevels
      this._levelInfo = this._getLevelInfo();
      
      // Update state
      this._isTransitioning = false;
      
      // Update the DOM
      this.render();
      
      // Trigger animation after render
      setTimeout(() => {
        if (this._debug) console.log('Triggering tea circle animations');
        
        const circles = this.shadowRoot.querySelectorAll('tea-circle');
        if (this._debug) console.log(`Found ${circles.length} tea circles to animate`);
        
        circles.forEach((circle, index) => {
          setTimeout(() => {
            circle.setAttribute('animate-in', 'true');
          }, index * 30); // Stagger animation
        });
      }, 50);
      
    } catch (error) {
      console.error('Error loading tea data:', error);
      this._isTransitioning = false;
      this.render();
    }
  }
  
  async _fetchTeaData() {
    try {
      if (this._debug) console.log(`Fetching teas for category: ${this._category}`);
      
      // Use TeaDatabase to get teas
      const teas = await TeaDatabase.getTeasByCategory(this._category);
      if (this._debug) console.log(`Found ${teas.length} collected teas in database`);
      
      // Count collected teas
      const collectedCount = teas.length;
      
      // Set total based on level progression (using the last level threshold)
      const levels = TeaCollectionLevels.categories[this._category] || [];
      this._totalTeas = levels.length > 0 ? levels[levels.length - 1].threshold : 52;
      
      // Generate uncollected tea spots
      const uncollectedCount = this._totalTeas - collectedCount;
      if (this._debug) console.log(`Adding ${uncollectedCount} uncollected tea spots`);
      
      const uncollectedTeas = Array(uncollectedCount)
        .fill()
        .map((_, index) => ({
          id: `uncollected-${index}`,
          name: `Unknown ${this._category} Tea`,
          category: this._category,
          collected: false
        }));
      
      // Combine collected and uncollected, with collected teas first (at the top)
      // and uncollected teas after them
      this._collectedTeas = [...teas.map(tea => ({
        ...tea,
        collected: true
      })), ...uncollectedTeas];
      
      if (this._debug) console.log(`Total tea circles to display: ${this._collectedTeas.length}`);
      
      return this._collectedTeas;
    } catch (error) {
      console.error('Error fetching tea data:', error);
      this._collectedTeas = [];
      this._totalTeas = 0;
      return [];
    }
  }
  
  _getLevelInfo() {
    // Get the collected count
    const collectedCount = this._collectedTeas.filter(t => t.collected).length;
    
    if (this._debug) console.log(`Getting progress info for ${collectedCount} collected teas`);
    
    // Use TeaCollectionLevels to get progress info
    const progressInfo = TeaCollectionLevels.getCollectionProgress(this._category, collectedCount);
    
    return progressInfo;
  }
  
  _renderTeas() {
    // Empty container if transitioning
    if (this._isTransitioning) {
      return '<div class="loading">Loading teas...</div>';
    }
    
    // Create a grid of tea circles
    return `
      <div class="tea-grid">
        ${this._collectedTeas.map((tea, index) => `
          <tea-circle 
            id="${tea.id || `tea-${index}`}" 
            name="${tea.name || 'Unknown Tea'}" 
            category="${tea.category || this._category}" 
            ${tea.collected ? 'collected' : ''} 
            index="${index}">
          </tea-circle>
        `).join('')}
      </div>
    `;
  }
  
  render() {
    this._renderAttempts++;
    if (this._debug) console.log(`Rendering tea collection (attempt ${this._renderAttempts})`);
    
    const styles = `
      :host {
        display: block;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      }
      
      .collection-container {
        // padding: 1rem;
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
        background-color: #4a90e2;
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
      }
      
      .loading {
        text-align: center;
        padding: 2rem;
        color: #666;
      }
      
      .debug-info {
        background-color: #fffde7;
        padding: 0.5rem;
        margin: 0.5rem 0;
        border: 1px solid #ffeeba;
        border-radius: 4px;
        font-family: monospace;
        font-size: 0.8rem;
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
      
      ::slotted(tea-circle) {
        width: calc(100% - 8px);
        max-width: 64px;
      }
    `;
    
    // Get total count and collected count
    const totalCount = this._totalTeas;
    const collectedCount = this._collectedTeas.filter(t => t.collected).length;
    
    // Calculate progress percentage for next level
    let progressPercentage = 0;
    let currentThreshold = 0;
    let nextThreshold = 0;
    
    if (this._levelInfo) {
      if (this._levelInfo.nextLevel) {
        // If there is a next level, calculate progress towards it
        currentThreshold = this._levelInfo.currentLevel.threshold || 0;
        nextThreshold = this._levelInfo.nextLevel.threshold;
        
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
              ${this._category} teas<br>
              from our collection
            </div>
          </div>
          ${this._levelInfo ? `
            <div class="level-info">
              <div><strong>Current Level:</strong> ${this._levelInfo.currentLevel.title}</div>
              <div><strong>Next Level:</strong> ${this._levelInfo.nextLevel?.title || 'Collection Complete!'}</div>
              
              <div class="progress-bar-container">
                <div class="progress-bar" style="width: ${progressPercentage}%"></div>
              </div>
              
              <div class="progress-message">${this._levelInfo.progressMessage}</div>
            </div>
          ` : ''}
          
          ${this._debug ? `
            <div class="debug-info">
              Category: ${this._category}<br>
              Collected: ${collectedCount}/${totalCount}<br>
              Render Attempts: ${this._renderAttempts}<br>
              Transitioning: ${this._isTransitioning ? 'Yes' : 'No'}
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

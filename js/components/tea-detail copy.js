// components/tea-detail.js
// Component for displaying detailed tea information

class TeaDetail extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    
    // State
    this._teaData = null;
    this._isOpen = false;
    this._brewStyle = 'western'; // 'western' or 'gongfu'
    
    // Touch tracking for swipe to close
    this._touchStartX = 0;
    this._touchStartY = 0;
    this._isSwiping = false;
    
    // Bind methods
    this._handleClose = this._handleClose.bind(this);
    this._handleBrewStyleToggle = this._handleBrewStyleToggle.bind(this);
    this._handleSteepClick = this._handleSteepClick.bind(this);
    this._handleTouchStart = this._handleTouchStart.bind(this);
    this._handleTouchMove = this._handleTouchMove.bind(this);
    this._handleTouchEnd = this._handleTouchEnd.bind(this);
  }

  connectedCallback() {
    this.render();
    this._setupEventListeners();
  }
  
  disconnectedCallback() {
    this._removeEventListeners();
  }
  
  // Public methods
  open(teaData) {
    console.log('TeaDetail.open() called with data:', teaData);
    
    this._teaData = teaData;
    this._isOpen = true;
    this._brewStyle = 'western';
    
    // Re-render with new data
    this.render();
    
    console.log('TeaDetail rendered, adding animation class');
    
    // Add animation class after rendering
    setTimeout(() => {
      const panel = this.shadowRoot.querySelector('.detail-panel');
      if (panel) {
        panel.classList.add('open');
        console.log('Animation class added to panel');
      } else {
        console.error('Detail panel element not found in shadow DOM');
      }
    }, 10);
    
    // Block body scrolling when detail view is open
    document.body.style.overflow = 'hidden';
  }
  
  close() {
    // Animate close
    const panel = this.shadowRoot.querySelector('.detail-panel');
    if (panel) {
      panel.classList.remove('open');
      panel.classList.add('closing');
      
      // Wait for animation to complete before hiding
      setTimeout(() => {
        this._isOpen = false;
        this.render();
        document.body.style.overflow = '';
      }, 300);
    } else {
      this._isOpen = false;
      this.render();
      document.body.style.overflow = '';
    }
  }
  
  // Private methods
  _setupEventListeners() {
    // Close button
    const closeButton = this.shadowRoot.querySelector('.close-button');
    if (closeButton) {
      closeButton.addEventListener('click', this._handleClose);
    }
    
    // Brewing style toggle
    const brewToggle = this.shadowRoot.querySelector('.brew-toggle');
    if (brewToggle) {
      brewToggle.addEventListener('change', this._handleBrewStyleToggle);
    }
    
    // Steep button
    const steepButton = this.shadowRoot.querySelector('.steep-button');
    if (steepButton) {
      steepButton.addEventListener('click', this._handleSteepClick);
    }
    
    // Touch events for swipe to close
    const detailPanel = this.shadowRoot.querySelector('.detail-panel');
    if (detailPanel) {
      detailPanel.addEventListener('touchstart', this._handleTouchStart, { passive: true });
      detailPanel.addEventListener('touchmove', this._handleTouchMove, { passive: false });
      detailPanel.addEventListener('touchend', this._handleTouchEnd, { passive: true });
    }
  }
  
  _removeEventListeners() {
    // Clean up just before re-rendering
    const closeButton = this.shadowRoot.querySelector('.close-button');
    if (closeButton) {
      closeButton.removeEventListener('click', this._handleClose);
    }
    
    const brewToggle = this.shadowRoot.querySelector('.brew-toggle');
    if (brewToggle) {
      brewToggle.removeEventListener('change', this._handleBrewStyleToggle);
    }
    
    const steepButton = this.shadowRoot.querySelector('.steep-button');
    if (steepButton) {
      steepButton.removeEventListener('click', this._handleSteepClick);
    }
    
    const detailPanel = this.shadowRoot.querySelector('.detail-panel');
    if (detailPanel) {
      detailPanel.removeEventListener('touchstart', this._handleTouchStart);
      detailPanel.removeEventListener('touchmove', this._handleTouchMove);
      detailPanel.removeEventListener('touchend', this._handleTouchEnd);
    }
  }
  
  _handleClose() {
    this.close();
  }
  
  _handleBrewStyleToggle(event) {
    this._brewStyle = event.target.checked ? 'gongfu' : 'western';
    
    // Update brewing parameters display
    this._updateBrewingParameters();
  }
  
  _handleSteepClick() {
    if (!this._teaData) return;
    
    // Prepare tea data with appropriate brewing parameters
    const teaForSteeping = { ...this._teaData };
    
    // Update brewing time based on selected style
    if (this._brewStyle === 'gongfu' && teaForSteeping.gongfuBrewTime) {
      teaForSteeping.brewTime = teaForSteeping.gongfuBrewTime;
      teaForSteeping.temperature = teaForSteeping.gongfuTemperature || teaForSteeping.temperature;
    } else if (this._brewStyle === 'western' && teaForSteeping.westernBrewTime) {
      teaForSteeping.brewTime = teaForSteeping.westernBrewTime;
      teaForSteeping.temperature = teaForSteeping.westernTemperature || teaForSteeping.temperature;
    }
    
    // Dispatch steep event
    this.dispatchEvent(new CustomEvent('start-steeping', {
      bubbles: true,
      composed: true,
      detail: { tea: teaForSteeping }
    }));
    
    // Close the detail view
    this.close();
  }
  
  _updateBrewingParameters() {
    if (!this._teaData) return;
    
    // Get brewing values based on selected style
    const brewingTime = this._brewStyle === 'gongfu' 
      ? (this._teaData.gongfuBrewTime || 'N/A') 
      : (this._teaData.westernBrewTime || this._teaData.brewTime || 'N/A');
    
    const temperature = this._brewStyle === 'gongfu'
      ? (this._teaData.gongfuTemperature || this._teaData.temperature || 'N/A')
      : (this._teaData.westernTemperature || this._teaData.temperature || 'N/A');
    
    // Update the DOM
    const timeElement = this.shadowRoot.querySelector('.brew-time');
    const tempElement = this.shadowRoot.querySelector('.brew-temp');
    
    if (timeElement) {
      timeElement.textContent = brewingTime;
    }
    
    if (tempElement) {
      tempElement.textContent = temperature;
    }
  }
  
  // Touch event handlers for swipe to close gesture
  _handleTouchStart(event) {
    this._touchStartX = event.touches[0].clientX;
    this._touchStartY = event.touches[0].clientY;
    this._isSwiping = false;
  }
  
  _handleTouchMove(event) {
    if (!this._touchStartX || !this._touchStartY) return;
    
    const currentX = event.touches[0].clientX;
    const currentY = event.touches[0].clientY;
    
    const deltaX = this._touchStartX - currentX;
    const deltaY = this._touchStartY - currentY;
    
    // If horizontal swipe is dominant and moving right (swiping back)
    if (Math.abs(deltaX) > Math.abs(deltaY) && deltaX < 0) {
      event.preventDefault();
      this._isSwiping = true;
      
      // Calculate swipe position (only allow right swipe)
      const swipeOffset = Math.min(Math.abs(deltaX), 100);
      
      // Update panel position
      const panel = this.shadowRoot.querySelector('.detail-panel');
      if (panel) {
        panel.style.transform = `translateX(${swipeOffset}px)`;
        panel.style.opacity = 1 - (swipeOffset / 200);
      }
    }
  }
  
  _handleTouchEnd(event) {
    if (!this._isSwiping) return;
    
    const currentX = event.changedTouches[0].clientX;
    const deltaX = this._touchStartX - currentX;
    
    // If swiped back more than 100px, close the panel
    if (deltaX < -100) {
      this.close();
    } else {
      // Reset position if not closing
      const panel = this.shadowRoot.querySelector('.detail-panel');
      if (panel) {
        panel.style.transform = '';
        panel.style.opacity = '';
      }
    }
    
    // Reset touch tracking
    this._touchStartX = 0;
    this._touchStartY = 0;
    this._isSwiping = false;
  }
  
  _getCategoryColor(category) {
    // Color mapping for tea categories
    const colorMap = {
      'Green': '#7B9070',
      'Black': '#A56256',
      'Oolong': '#C09565',
      'White': '#D8DCD5',
      'Pu-erh': '#6F5244',
      'Yellow': '#D1CDA6'
    };
    
    return colorMap[category] || '#4a90e2';
  }
  
  render() {
    const styles = `
      :host {
        display: ${this._isOpen ? 'block' : 'none'};
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        z-index: 1000;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      }
      
      .detail-overlay {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0, 0, 0, 0.5);
        opacity: 0;
        transition: opacity 0.3s ease;
      }
      
      .detail-panel {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: white;
        transform: translateX(100%);
        transition: transform 0.3s cubic-bezier(0.4, 0.0, 0.2, 1), opacity 0.3s ease;
        overflow-y: auto;
        overflow-x: hidden;
        -webkit-overflow-scrolling: touch;
        display: flex;
        flex-direction: column;
      }
      
      .detail-panel.open {
        transform: translateX(0);
      }
      
      .detail-panel.closing {
        transform: translateX(100%);
      }
      
      .detail-header {
        position: sticky;
        top: 0;
        background-color: white;
        z-index: 10;
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 1rem;
        border-bottom: 1px solid #f0f0f0;
      }
      
      .close-button {
        background: none;
        border: none;
        font-size: 1.5rem;
        color: #666;
        cursor: pointer;
        width: 36px;
        height: 36px;
        display: flex;
        justify-content: center;
        align-items: center;
        border-radius: 50%;
      }
      
      .close-button:hover {
        background-color: #f5f5f5;
      }
      
      .detail-title {
        font-size: 1.25rem;
        font-weight: 500;
        margin: 0;
        text-align: center;
        flex: 1;
      }
      
      .detail-content {
        padding: 1rem;
        flex: 1;
      }
      
      .tea-hero {
        position: relative;
        width: 100%;
        height: 200px;
        background-color: #f5f7fa;
        border-radius: 8px;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        margin-bottom: 1.5rem;
        overflow: hidden;
      }
      
      .tea-icon {
        font-size: 3rem;
        margin-bottom: 0.5rem;
      }
      
      .tea-category-tag {
        position: absolute;
        top: 1rem;
        right: 1rem;
        background-color: rgba(255, 255, 255, 0.8);
        padding: 0.35rem 0.75rem;
        border-radius: 1rem;
        font-size: 0.85rem;
        font-weight: 500;
      }
      
      .tea-origin-tag {
        position: absolute;
        bottom: 1rem;
        left: 1rem;
        background-color: rgba(255, 255, 255, 0.8);
        padding: 0.35rem 0.75rem;
        border-radius: 1rem;
        font-size: 0.85rem;
      }
      
      .tea-description {
        margin-bottom: 1.5rem;
        line-height: 1.5;
        color: #333;
      }
      
      .section-title {
        font-size: 1.1rem;
        font-weight: 500;
        margin: 0 0 1rem 0;
        padding-left: 0.75rem;
        border-left: 3px solid #4a90e2;
      }
      
      .brewing-section {
        background-color: #f9f9f9;
        padding: 1rem;
        border-radius: 8px;
        margin-bottom: 1.5rem;
      }
      
      .brew-style-toggle {
        display: flex;
        justify-content: center;
        align-items: center;
        margin-bottom: 1rem;
        gap: 0.5rem;
      }
      
      .brew-toggle-label {
        font-size: 0.9rem;
        color: #666;
      }
      
      .brew-toggle {
        position: relative;
        display: inline-block;
        width: 50px;
        height: 24px;
      }
      
      .brew-toggle input {
        opacity: 0;
        width: 0;
        height: 0;
      }
      
      .brew-toggle-slider {
        position: absolute;
        cursor: pointer;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background-color: #ccc;
        transition: .4s;
        border-radius: 24px;
      }
      
      .brew-toggle-slider:before {
        position: absolute;
        content: "";
        height: 18px;
        width: 18px;
        left: 3px;
        bottom: 3px;
        background-color: white;
        transition: .4s;
        border-radius: 50%;
      }
      
      input:checked + .brew-toggle-slider {
        background-color: #4a90e2;
      }
      
      input:focus + .brew-toggle-slider {
        box-shadow: 0 0 1px #4a90e2;
      }
      
      input:checked + .brew-toggle-slider:before {
        transform: translateX(26px);
      }
      
      .brewing-params {
        display: flex;
        justify-content: space-between;
        gap: 1rem;
      }
      
      .param-card {
        background-color: white;
        padding: 0.75rem 1rem;
        border-radius: 6px;
        flex: 1;
        text-align: center;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
      }
      
      .param-label {
        font-size: 0.85rem;
        color: #666;
        margin-bottom: 0.35rem;
      }
      
      .param-value {
        font-size: 1.1rem;
        font-weight: 500;
      }
      
      .tea-details-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 1rem;
        margin-bottom: 1.5rem;
      }
      
      .detail-item {
        margin-bottom: 0.5rem;
      }
      
      .detail-label {
        font-size: 0.85rem;
        color: #666;
        margin-bottom: 0.25rem;
      }
      
      .detail-value {
        font-size: 0.95rem;
      }
      
      .notes-section {
        margin-bottom: 1.5rem;
      }
      
      .tea-notes {
        font-style: italic;
        background-color: #f9f9f9;
        padding: 1rem;
        border-radius: 8px;
        line-height: 1.5;
      }
      
      .tags-section {
        margin-bottom: 1.5rem;
      }
      
      .tags-container {
        display: flex;
        flex-wrap: wrap;
        gap: 0.5rem;
      }
      
      .tag {
        background-color: #f0f0f0;
        padding: 0.35rem 0.75rem;
        border-radius: 1rem;
        font-size: 0.85rem;
        color: #666;
      }
      
      .flavor-section {
        margin-bottom: 1.5rem;
      }
      
      .flavor-profile {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
        gap: 0.5rem;
      }
      
      .flavor-item {
        display: flex;
        align-items: center;
        gap: 0.5rem;
      }
      
      .flavor-dot {
        width: 10px;
        height: 10px;
        border-radius: 50%;
        background-color: #4a90e2;
      }
      
      .steep-button-container {
        position: sticky;
        bottom: 0;
        left: 0;
        right: 0;
        background-color: white;
        padding: 1rem;
        box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.1);
        z-index: 5;
      }
      
      .steep-button {
        background-color: #4a90e2;
        color: white;
        border: none;
        border-radius: 8px;
        padding: 1rem;
        font-size: 1rem;
        font-weight: 600;
        width: 100%;
        cursor: pointer;
        transition: background-color 0.2s ease;
      }
      
      .steep-button:hover {
        background-color: #3a80d2;
      }
      
      @media (min-width: 768px) {
        .detail-panel {
          left: auto;
          right: 0;
          width: 400px;
          box-shadow: -2px 0 20px rgba(0, 0, 0, 0.15);
        }
        
        .detail-overlay {
          display: block;
        }
      }
    `;
    
    if (!this._isOpen) {
      this.shadowRoot.innerHTML = `<style>${styles}</style>`;
      return;
    }
    
    const categoryColor = this._teaData ? this._getCategoryColor(this._teaData.category) : '#4a90e2';
    
    this.shadowRoot.innerHTML = `
      <style>${styles}</style>
      <div class="detail-overlay"></div>
      <div class="detail-panel">
        <header class="detail-header">
          <button class="close-button" aria-label="Close">&larr;</button>
          <h2 class="detail-title">${this._teaData?.name || 'Tea Details'}</h2>
          <div style="width: 36px"></div><!-- Empty div for alignment -->
        </header>
        
        <div class="detail-content">
          <div class="tea-hero" style="background-color: ${categoryColor}20;"> <!-- 20 is hex for 12% opacity -->
            <div class="tea-icon" style="color: ${categoryColor};">🍵</div>
            <h3 style="margin: 0; color: ${categoryColor};">${this._teaData?.name || ''}</h3>
            ${this._teaData?.altName ? `<div style="font-size: 0.9rem; color: ${categoryColor};">${this._teaData.altName}</div>` : ''}
            
            <div class="tea-category-tag" style="color: ${categoryColor}; border: 1px solid ${categoryColor}20;">
              ${this._teaData?.category || 'Unknown'} Tea
            </div>
            
            ${this._teaData?.origin ? `
              <div class="tea-origin-tag">
                Origin: ${this._teaData.origin}
              </div>
            ` : ''}
          </div>
          
          <div class="tea-description">
            ${this._teaData?.description || 'No description available.'}
          </div>
          
          <div class="brewing-section">
            <h3 class="section-title" style="border-color: ${categoryColor};">Brewing Guide</h3>
            
            <div class="brew-style-toggle">
              <span class="brew-toggle-label">Western</span>
              <label class="brew-toggle">
                <input type="checkbox" ${this._brewStyle === 'gongfu' ? 'checked' : ''}>
                <span class="brew-toggle-slider"></span>
              </label>
              <span class="brew-toggle-label">Gongfu</span>
            </div>
            
            <div class="brewing-params">
              <div class="param-card">
                <div class="param-label">Time</div>
                <div class="param-value brew-time">
                  ${this._brewStyle === 'gongfu' 
                    ? (this._teaData?.gongfuBrewTime || 'N/A') 
                    : (this._teaData?.westernBrewTime || this._teaData?.brewTime || 'N/A')}
                </div>
              </div>
              
              <div class="param-card">
                <div class="param-label">Temperature</div>
                <div class="param-value brew-temp">
                  ${this._brewStyle === 'gongfu'
                    ? (this._teaData?.gongfuTemperature || this._teaData?.temperature || 'N/A')
                    : (this._teaData?.westernTemperature || this._teaData?.temperature || 'N/A')}
                </div>
              </div>
            </div>
          </div>
          
          <div class="tea-details">
            <h3 class="section-title" style="border-color: ${categoryColor};">Tea Details</h3>
            
            <div class="tea-details-grid">
              ${this._teaData?.origin ? `
                <div class="detail-item">
                  <div class="detail-label">Origin</div>
                  <div class="detail-value">${this._teaData.origin}</div>
                </div>
              ` : ''}
              
              ${this._teaData?.harvestDate ? `
                <div class="detail-item">
                  <div class="detail-label">Harvest</div>
                  <div class="detail-value">${this._teaData.harvestDate}</div>
                </div>
              ` : ''}
              
              ${this._teaData?.elevation ? `
                <div class="detail-item">
                  <div class="detail-label">Elevation</div>
                  <div class="detail-value">${this._teaData.elevation}</div>
                </div>
              ` : ''}
              
              ${this._teaData?.caffeineLevel ? `
                <div class="detail-item">
                  <div class="detail-label">Caffeine</div>
                  <div class="detail-value">${this._teaData.caffeineLevel}</div>
                </div>
              ` : ''}
              
              ${this._teaData?.processingMethod ? `
                <div class="detail-item">
                  <div class="detail-label">Processing</div>
                  <div class="detail-value">${this._teaData.processingMethod}</div>
                </div>
              ` : ''}
              
              ${this._teaData?.leafGradeOrType ? `
                <div class="detail-item">
                  <div class="detail-label">Leaf Grade</div>
                  <div class="detail-value">${this._teaData.leafGradeOrType}</div>
                </div>
              ` : ''}
            </div>
          </div>
          
          ${this._teaData?.flavorProfile ? `
            <div class="flavor-section">
              <h3 class="section-title" style="border-color: ${categoryColor};">Flavor Profile</h3>
              <div class="flavor-profile">
                ${Array.isArray(this._teaData.flavorProfile) ? this._teaData.flavorProfile.map(flavor => `
                  <div class="flavor-item">
                    <div class="flavor-dot" style="background-color: ${categoryColor};"></div>
                    <span>${flavor}</span>
                  </div>
                `).join('') : ''}
              </div>
            </div>
          ` : ''}
          
          ${this._teaData?.notes ? `
            <div class="notes-section">
              <h3 class="section-title" style="border-color: ${categoryColor};">Brewing Notes</h3>
              <div class="tea-notes">
                ${this._teaData.notes}
              </div>
            </div>
          ` : ''}
          
          ${this._teaData?.tags && Array.isArray(this._teaData.tags) && this._teaData.tags.length > 0 ? `
            <div class="tags-section">
              <h3 class="section-title" style="border-color: ${categoryColor};">Tags</h3>
              <div class="tags-container">
                ${this._teaData.tags.map(tag => `
                  <span class="tag">${tag}</span>
                `).join('')}
              </div>
            </div>
          ` : ''}
        </div>
        
        <div class="steep-button-container">
          <button class="steep-button" style="background-color: ${categoryColor};">
            Steep This Tea
          </button>
        </div>
      </div>
    `;
    
    // Set up event listeners after rendering
    this._setupEventListeners();
    
    // After rendering, check if the panel is visible
    setTimeout(() => {
      const panel = this.shadowRoot.querySelector('.detail-panel');
      if (panel) {
        console.log('Detail panel element styles:', {
          display: getComputedStyle(panel).display,
          visibility: getComputedStyle(panel).visibility,
          opacity: getComputedStyle(panel).opacity,
          transform: getComputedStyle(panel).transform,
          zIndex: getComputedStyle(panel).zIndex
        });
      }
    }, 20);
  }
}

customElements.define('tea-detail', TeaDetail);

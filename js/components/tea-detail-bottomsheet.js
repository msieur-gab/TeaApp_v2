// components/tea-detail-bottomsheet.js

class TeaDetailBottomsheet extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    
    // State
    this._teaData = null;
    this._isOpen = false;
    this._brewStyle = 'western'; // 'western' or 'gongfu'
    
    // Touch tracking for swipe to close
    this._touchStartY = 0;
    this._touchStartX = 0;
    this._lastTouch = { y: 0, x: 0 };
    this._panelHeight = 0;
    this._isDragging = false;
    this._initialPanelY = 0;
    
    // References to main content elements
    this._mainContent = null;
    this._teaContainer = null;
    
    // Bind methods
    this._handleClose = this._handleClose.bind(this);
    this._handleBrewStyleToggle = this._handleBrewStyleToggle.bind(this);
    this._handleSteepClick = this._handleSteepClick.bind(this);
    this._handleTouchStart = this._handleTouchStart.bind(this);
    this._handleTouchMove = this._handleTouchMove.bind(this);
    this._handleTouchEnd = this._handleTouchEnd.bind(this);
    this._handleBackdropClick = this._handleBackdropClick.bind(this);
  }

  connectedCallback() {
    // Store references to main content elements
    this._mainContent = document.querySelector('.app-container');
    this._teaContainer = document.querySelector('.tea-cards-container') || document.querySelector('tea-collection');
    
    this.render();
    this._setupEventListeners();
  }
  
  disconnectedCallback() {
    this._removeEventListeners();
  }
  
  // Public methods
  open(teaData) {
    console.log('TeaDetailBottomsheet.open() called with data:', teaData);
    
    this._teaData = teaData;
    this._isOpen = true;
    this._brewStyle = 'western';
    
    // Re-render with new data
    this.render();
    
    // Add animation class after rendering
    setTimeout(() => {
      const panel = this.shadowRoot.querySelector('.detail-panel');
      const backdrop = this.shadowRoot.querySelector('.detail-backdrop');
      if (panel) {
        panel.classList.add('open');
        // Update our cached panel height
        this._panelHeight = panel.offsetHeight;
        
        // Push main content up
        this._pushMainContentUp();
      }
      if (backdrop) {
        backdrop.classList.add('open');
      }
      
      // Dispatch open event
      this.dispatchEvent(new CustomEvent('tea-detail-opened', {
        bubbles: true,
        composed: true,
        detail: { teaData: this._teaData }
      }));
    }, 10);
    
    // Block body scrolling when detail view is open
    document.body.style.overflow = 'hidden';
  }
  
  close() {
    // Animate close
    const panel = this.shadowRoot.querySelector('.detail-panel');
    const backdrop = this.shadowRoot.querySelector('.detail-backdrop');
    
    if (panel) {
      panel.classList.remove('open');
      
      // Update transform based on desktop/mobile layout
      if (window.innerWidth >= 768) {
        // Desktop layout has centered panel
        panel.style.transform = 'translateX(-50%) translateY(100%)';
      } else {
        // Mobile layout has full-width panel
        panel.style.transform = 'translateY(100%)';
      }
    }
    
    if (backdrop) {
      backdrop.classList.remove('open');
    }
    
    // Reset main content position
    this._resetMainContent();
    
    // Dispatch close event immediately so UI can begin updating
    this.dispatchEvent(new CustomEvent('tea-detail-closed', {
      bubbles: true,
      composed: true
    }));
    
    // Wait for animation to complete before hiding
    setTimeout(() => {
      this._isOpen = false;
      this.render();
      document.body.style.overflow = '';
    }, 300);
  }
  
  // Push main content up
  _pushMainContentUp() {
    // Get viewport height to calculate proportions
    const viewportHeight = window.innerHeight;
    
    // Determine if device is in portrait or landscape
    const isPortrait = window.innerHeight > window.innerWidth;
    
    // On taller screens or portrait mode, we want to show more of the detail panel
    // On shorter screens or landscape, we want to keep more tea cards visible
    let pushRatio = isPortrait ? 0.6 : 0.4;
    
    // But always leave room for at least 1 row of cards at the top
    const minVisibleTeaCards = 100; // Approx height needed for one row
    
    // Calculate how much to push up
    let pushHeight = Math.min(this._panelHeight * pushRatio, viewportHeight * 0.5);
    
    // But ensure we don't push too much, always leaving space for tea cards
    pushHeight = Math.min(pushHeight, viewportHeight - minVisibleTeaCards);
    
    // Make sure push height is at least 200px to show a meaningful amount of detail panel
    pushHeight = Math.max(pushHeight, Math.min(200, viewportHeight * 0.3));
    
    console.log(`Pushing content up by ${pushHeight}px (viewport: ${viewportHeight}px)`);
    
    // Apply push to main content
    if (this._mainContent) {
      this._mainContent.style.transition = 'transform 0.3s ease-out';
      this._mainContent.style.transform = `translateY(-${pushHeight}px)`;
    }
    
    // Also handle the add button
    const addButton = document.querySelector('.add-tea-button');
    if (addButton) {
      addButton.style.transition = 'transform 0.3s ease-out, opacity 0.3s ease';
      addButton.style.transform = 'translateY(-30px)';
      addButton.style.opacity = '0';
    }
    
    // REMOVED: Do not hide the nav element anymore
    // Keep bottom navigation visible
  }
  
  // Reset main content position
  _resetMainContent() {
    if (this._mainContent) {
      this._mainContent.style.transform = 'translateY(0)';
    }
    
    // Reset add button
    const addButton = document.querySelector('.add-tea-button');
    if (addButton) {
      addButton.style.transform = '';
      addButton.style.opacity = '';
    }
    
    // REMOVED: No need to reset nav position since we don't hide it
  }
  
  // Private methods
  _setupEventListeners() {
    // Close button
    const closeButton = this.shadowRoot.querySelector('.close-button');
    if (closeButton) {
      closeButton.addEventListener('click', this._handleClose);
    }
    
    // Brew style toggle
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
    
    // Backdrop click to close
    const backdrop = this.shadowRoot.querySelector('.detail-backdrop');
    if (backdrop) {
      backdrop.addEventListener('click', this._handleBackdropClick);
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
    
    const backdrop = this.shadowRoot.querySelector('.detail-backdrop');
    if (backdrop) {
      backdrop.removeEventListener('click', this._handleBackdropClick);
    }
  }
  
  _handleClose() {
    this.close();
  }
  
  _handleBackdropClick(event) {
    // Only close if the backdrop itself was clicked
    if (event.target === event.currentTarget) {
      this.close();
    }
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
    if (!event.touches[0]) return;
    
    this._isDragging = false;
    this._touchStartY = event.touches[0].clientY;
    this._touchStartX = event.touches[0].clientX;
    this._lastTouch = { 
      y: this._touchStartY,
      x: this._touchStartX
    };
    
    // Store the initial position of the panel
    const panel = this.shadowRoot.querySelector('.detail-panel');
    if (panel) {
      // Get the current transform value
      const transform = getComputedStyle(panel).transform;
      if (transform && transform !== 'none') {
        // Extract the Y translation from the matrix
        const matrix = new DOMMatrix(transform);
        this._initialPanelY = matrix.m42;
      } else {
        this._initialPanelY = 0;
      }
      
      // Remove transition during dragging for responsiveness
      panel.style.transition = 'none';
    }
  }
  
  _handleTouchMove(event) {
    if (!event.touches[0]) return;
    
    const currentY = event.touches[0].clientY;
    const currentX = event.touches[0].clientX;
    const deltaY = currentY - this._touchStartY;
    const deltaX = currentX - this._touchStartX;
    
    // Store the last touch position
    this._lastTouch = { y: currentY, x: currentX };
    
    // If we're scrolling more horizontally than vertically, let the scroll happen normally
    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      return;
    }
    
    // Determine if we should start dragging - only drag if moving down or already dragging
    if (!this._isDragging) {
      const detailContent = this.shadowRoot.querySelector('.detail-content');
      
      // Only start dragging if at the top of the content or dragging down
      if (deltaY > 0 || detailContent.scrollTop <= 0) {
        this._isDragging = true;
        
        // If we just started dragging and we're not at the top, prevent further movement
        if (detailContent.scrollTop > 0) {
          return;
        }
      } else {
        // Allow normal scrolling
        return;
      }
    }
    
    // Now we're definitely dragging, prevent default scrolling
    event.preventDefault();
    
    // Allow dragging only if moving down or already displaced
    if (deltaY > 0 || this._initialPanelY > 0) {
      // Apply resistance to dragging - more resistance as you drag further
      const resistance = 0.3 + (0.7 * (1 - Math.min(deltaY / window.innerHeight, 1)));
      const newTranslateY = this._initialPanelY + (deltaY * resistance);
      
      // Update panel position
      const panel = this.shadowRoot.querySelector('.detail-panel');
      if (panel) {
        panel.style.transform = `translateY(${newTranslateY}px)`;
      }
      
      // Also adjust main content to follow
      if (this._mainContent) {
        // Calculate how much the main content should move up based on panel movement
        const mainAdjustment = Math.max(0, deltaY * -0.3);
        // Calculate the new position - smoothly transitioning back to original position
        const pushHeight = Math.min(this._panelHeight * 0.6, window.innerHeight * 0.5);
        const newMainPosition = Math.max(-pushHeight, -pushHeight + mainAdjustment);
        
        this._mainContent.style.transform = `translateY(${newMainPosition}px)`;
      }
    }
  }
  
  _handleTouchEnd(event) {
    // Re-enable transitions
    const panel = this.shadowRoot.querySelector('.detail-panel');
    if (panel) {
      panel.style.transition = 'transform 0.3s cubic-bezier(0.4, 0.0, 0.2, 1)';
    }
    
    if (!this._isDragging) return;
    this._isDragging = false;
    
    // Calculate velocity of the swipe
    const endY = this._lastTouch.y;
    const deltaY = endY - this._touchStartY;
    
    // Close if dragged down more than 25% of panel height or with a fast velocity
    if (deltaY > this._panelHeight * 0.25) {
      this.close();
    } else {
      // Reset position
      if (panel) {
        panel.style.transform = 'translateY(0)';
      }
      
      // Reset main content to pushed-up position
      this._pushMainContentUp();
    }
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
    if (!this._isOpen) {
      this.shadowRoot.innerHTML = `<style>:host { display: none; }</style>`;
      return;
    }
    
    const categoryColor = this._teaData ? this._getCategoryColor(this._teaData.category) : '#4a90e2';
    
    const styles = `
      :host {
        display: block;
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        z-index: 95; /* Lower z-index to be below nav */
        pointer-events: auto;
      }
      
      .detail-backdrop {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0, 0, 0, 0.5);
        opacity: 0;
        transition: opacity 0.3s ease;
      }
      
      .detail-backdrop.open {
        opacity: 1;
      }
      
      .detail-panel {
        position: absolute;
        bottom: 64px; /* Leave space for bottom nav */
        left: 0;
        width: 100%;
        max-height: calc(90vh - 64px); /* Adjust max height to account for nav */
        background-color: ${categoryColor};
        color: white;
        border-top-left-radius: 16px;
        border-top-right-radius: 16px;
        transform: translateY(100%);
        transition: transform 0.3s cubic-bezier(0.4, 0.0, 0.2, 1);
        overflow: hidden;
        display: flex;
        flex-direction: column;
        box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.1);
      }
      
      .detail-panel.open {
        transform: translateY(0);
      }
      
      .detail-handle {
        width: 36px;
        height: 5px;
        background-color: rgba(255, 255, 255, 0.3);
        border-radius: 3px;
        margin: 8px auto;
      }
      
      .detail-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 0 16px 12px;
      }
      
      .detail-title {
        font-size: 1.5rem;
        font-weight: 500;
        margin: 0;
        flex: 1;
        text-align: center;
      }
      
      .close-button {
        background: rgba(255, 255, 255, 0.2);
        border: none;
        color: white;
        width: 32px;
        height: 32px;
        border-radius: 50%;
        display: flex;
        justify-content: center;
        align-items: center;
        font-size: 1.25rem;
        cursor: pointer;
      }
      
      .detail-content {
        flex: 1;
        overflow-y: auto;
        padding: 16px;
        color: #333;
      }
      
      .tea-image {
        width: 80px;
        height: 80px;
        background-color: white;
        border-radius: 50%;
        display: flex;
        justify-content: center;
        align-items: center;
        margin: 0 auto 16px;
        font-size: 2rem;
      }
      
      .tea-meta {
        text-align: center;
        margin-bottom: 24px;
      }
      
      .tea-alt-name {
        font-size: 0.9rem;
        opacity: 0.8;
        margin-bottom: 8px;
      }
      
      .tea-origin {
        font-size: 1rem;
        margin-bottom: 4px;
      }
      
      .tea-description {
        line-height: 1.5;
        margin-bottom: 24px;
      }
      
      .detail-section {
        margin-bottom: 24px;
      }
      
      .section-title {
        font-size: 1.1rem;
        font-weight: 600;
        margin-bottom: 12px;
        position: relative;
        padding-left: 12px;
        color: ${categoryColor};
      }
      
      .section-title::before {
        content: '';
        position: absolute;
        left: 0;
        top: 0;
        height: 100%;
        width: 4px;
        background-color: ${categoryColor};
        border-radius: 2px;
      }
      
      .brewing-section {
        padding: 16px;
      }
      
      .brew-style-toggle {
        display: flex;
        justify-content: center;
        align-items: center;
        margin-bottom: 16px;
      }
      
      .brew-toggle-label {
        margin: 0 8px;
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
        background-color: ${categoryColor};
      }
      
      input:checked + .brew-toggle-slider:before {
        transform: translateX(26px);
      }
      
      .brewing-params {
        display: flex;
        justify-content: space-around;
        align-items: center;
      }
      
      .brew-param {
        flex: 1;
        text-align: center;
        padding: 12px;
        background-color: white;
        border-radius: 8px;
        margin: 0 6px;
      }
      
      .brew-param-label {
        font-size: 0.8rem;
        color: #666;
        margin-bottom: 4px;
      }
      
      .brew-param-value {
        font-size: 1.1rem;
        font-weight: 600;
        color: ${categoryColor};
      }
      
      .tea-properties {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 12px;
      }
      
      .property-item {
        display: flex;
        flex-direction: column;
      }
      
      .property-label {
        font-size: 0.8rem;
        color: #666;
        margin-bottom: 4px;
      }
      
      .property-value {
        font-size: 0.95rem;
      }
      
      .tea-notes {
        font-style: italic;
        padding: 12px;
        background-color: #f8f8f8;
        border-radius: 8px;
        margin-bottom: 16px;
        line-height: 1.5;
      }
      
      .flavor-tags {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        margin-bottom: 16px;
      }
      
      .flavor-tag {
        padding: 6px 12px;
        background-color: #f0f0f0;
        border-radius: 16px;
        font-size: 0.85rem;
        color: #666;
      }
      
      .steep-button {
        display: block;
        width: 100%;
        padding: 16px;
        margin-top: 16px;
        background-color: ${categoryColor};
        border: none;
        border-radius: 8px;
        color: white;
        font-size: 1rem;
        font-weight: 600;
        cursor: pointer;
      }
      
      @media (min-width: 768px) {
        .detail-panel {
          width: 90%;
          max-width: 500px;
          left: 50%;
          bottom: 64px; /* Keep space for nav on desktop too */
          transform: translateX(-50%) translateY(100%);
        }
        
        .detail-panel.open {
          transform: translateX(-50%) translateY(0);
        }
        
        .tea-properties {
          grid-template-columns: 1fr 1fr 1fr;
        }
      }
    `;
    
    this.shadowRoot.innerHTML = `
      <style>${styles}</style>
      
      <div class="detail-backdrop"></div>
      
      <div class="detail-panel">
        <div class="detail-handle"></div>
        
        <div class="detail-header">
          <button class="close-button" aria-label="Close">×</button>
          <h2 class="detail-title">${this._teaData?.name || 'Tea Details'}</h2>
          <div style="width: 32px;"></div> <!-- Spacer for alignment -->
        </div>
        
        <div class="detail-content">
          <div class="tea-image">
            <span>🍵</span>
          </div>
          
          <div class="tea-meta">
            ${this._teaData?.altName ? `<div class="tea-alt-name">${this._teaData.altName}</div>` : ''}
            ${this._teaData?.origin ? `<div class="tea-origin">${this._teaData.origin}</div>` : ''}
          </div>
          
          <div class="tea-description">
            ${this._teaData?.description || 'No description available.'}
          </div>
          
          <div class="detail-section brewing-section">
            <h3 class="section-title">Brewing Guide</h3>
            
            <div class="brew-style-toggle">
              <span class="brew-toggle-label">Western</span>
              <label class="brew-toggle">
                <input type="checkbox" ${this._brewStyle === 'gongfu' ? 'checked' : ''}>
                <span class="brew-toggle-slider"></span>
              </label>
              <span class="brew-toggle-label">Gongfu</span>
            </div>
            
            <div class="brewing-params">
              <div class="brew-param">
                <div class="brew-param-label">Time</div>
                <div class="brew-param-value brew-time">
                  ${this._brewStyle === 'gongfu' 
                    ? (this._teaData?.gongfuBrewTime || 'N/A') 
                    : (this._teaData?.westernBrewTime || this._teaData?.brewTime || 'N/A')}
                </div>
              </div>
              
              <div class="brew-param">
                <div class="brew-param-label">Temperature</div>
                <div class="brew-param-value brew-temp">
                  ${this._brewStyle === 'gongfu'
                    ? (this._teaData?.gongfuTemperature || this._teaData?.temperature || 'N/A')
                    : (this._teaData?.westernTemperature || this._teaData?.temperature || 'N/A')}
                </div>
              </div>
              
              <div class="brew-param">
                <div class="brew-param-label">Leaf Ratio</div>
                <div class="brew-param-value">
                  ${this._brewStyle === 'gongfu'
                    ? (this._teaData?.gongfuLeafRatio || '5g per 100ml')
                    : (this._teaData?.westernLeafRatio || '2g per 200ml')}
                </div>
              </div>
            </div>
          </div>
          
          ${this._teaData?.notes ? `
            <div class="detail-section">
              <h3 class="section-title">Tasting Notes</h3>
              <div class="tea-notes">${this._teaData.notes}</div>
            </div>
          ` : ''}
          
          ${this._teaData?.tags && this._teaData.tags.length ? `
            <div class="detail-section">
              <h3 class="section-title">Characteristics</h3>
              <div class="flavor-tags">
                ${this._teaData.tags.map(tag => `
                  <div class="flavor-tag">${tag}</div>
                `).join('')}
              </div>
            </div>
          ` : ''}
          
          <div class="detail-section">
            <h3 class="section-title">Properties</h3>
            <div class="tea-properties">
              ${this._teaData?.harvestDate ? `
                <div class="property-item">
                  <span class="property-label">Harvest</span>
                  <span class="property-value">${this._teaData.harvestDate}</span>
                </div>
              ` : ''}
              
              ${this._teaData?.elevation ? `
                <div class="property-item">
                  <span class="property-label">Elevation</span>
                  <span class="property-value">${this._teaData.elevation}</span>
                </div>
              ` : ''}
              
              ${this._teaData?.caffeineLevel ? `
                <div class="property-item">
                  <span class="property-label">Caffeine</span>
                  <span class="property-value">${this._teaData.caffeineLevel}</span>
                </div>
              ` : ''}
              
              ${this._teaData?.processingMethod ? `
                <div class="property-item">
                  <span class="property-label">Processing</span>
                  <span class="property-value">${this._teaData.processingMethod}</span>
                </div>
              ` : ''}
              
              ${this._teaData?.form ? `
                <div class="property-item">
                  <span class="property-label">Form</span>
                  <span class="property-value">${this._teaData.form}</span>
                </div>
              ` : ''}
              
              ${this._teaData?.agingPotential ? `
                <div class="property-item">
                  <span class="property-label">Aging Potential</span>
                  <span class="property-value">${this._teaData.agingPotential}</span>
                </div>
              ` : ''}
            </div>
          </div>
          
          <button class="steep-button">Steep This Tea</button>
        </div>
      </div>
    `;
    
    // Add event listeners after rendering
    this._setupEventListeners();
  }
}

// Register the custom element
customElements.define('tea-detail-bottomsheet', TeaDetailBottomsheet);

export default TeaDetailBottomsheet;

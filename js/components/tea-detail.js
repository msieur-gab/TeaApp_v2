// components/tea-detail.js
// Consolidated tea detail component with improved organization

class TeaDetail extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    
    // State
    this._teaData = null;
    this._isOpen = false;
    this._brewStyle = 'western'; // 'western' or 'gongfu'
    this._currentTeaId = null;
    
    // Touch tracking for swipe to close
    this._touchState = {
      startY: 0,
      startX: 0,
      lastY: 0,
      lastX: 0,
      panelHeight: 0,
      isDragging: false,
      initialPanelY: 0
    };
    
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
    this._mainContent = document.querySelector('.app-container');
    this.render();
    this._setupEventListeners();
  }
  
  disconnectedCallback() {
    this._removeEventListeners();
  }
  
  // Public methods
  open(teaData) {
    if (!teaData || typeof teaData !== 'object') {
      console.error('Invalid tea data provided to TeaDetail.open()');
      return;
    }
    
    // Save current ID for reference
    this._currentTeaId = teaData.id || null;
    
    // Create a complete tea data object with default values for missing properties
    this._teaData = {
      name: teaData.name || 'Unknown Tea',
      category: teaData.category || 'Unknown',
      description: teaData.description || `A ${teaData.category?.toLowerCase() || 'special'} tea.`,
      brewTime: teaData.brewTime || this._getDefaultBrewTime(teaData.category),
      temperature: teaData.temperature || this._getDefaultTemperature(teaData.category),
      origin: teaData.origin || 'Unknown Origin',
      tags: teaData.tags || [teaData.category?.toLowerCase()],
      notes: teaData.notes || '',
      ...teaData  // Include any other properties from the original data
    };
    
    // If we have an ID but limited data, try to fetch more details
    if (teaData.id && (!teaData.description || !teaData.brewTime)) {
      this._fetchTeaDetails(teaData.id);
    }
    
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
        this._touchState.panelHeight = panel.offsetHeight;
        this._pushMainContentUp();
      }
      
      if (backdrop) {
        backdrop.classList.add('open');
      }
      
      // Dispatch open event
      this._dispatchEvent('tea-detail-opened', { teaData: this._teaData });
    }, 10);
    
    // Block body scrolling when detail view is open
    document.body.style.overflow = 'hidden';
  }
  
  // Update data without closing/reopening
  updateData(newData) {
    if (!this._isOpen || !newData) return;
    
    this._teaData = { ...this._teaData, ...newData };
    this.render();
    this._setupEventListeners();
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
    this._dispatchEvent('tea-detail-closed');
    
    // Wait for animation to complete before hiding
    setTimeout(() => {
      this._isOpen = false;
      this._currentTeaId = null;
      this.render();
      document.body.style.overflow = '';
    }, 300);
  }
  
  // Helper method to fetch more tea details
  async _fetchTeaDetails(teaId) {
    try {
      // Use global TeaDatabase service if available
      if (window.TeaDatabase) {
        const teaDetails = await window.TeaDatabase.getTea(teaId);
        if (teaDetails) {
          // Update our data with the fetched details
          this._teaData = { ...this._teaData, ...teaDetails };
          
          // Re-render with the updated data
          this.render();
          this._setupEventListeners();
        }
      }
    } catch (error) {
      console.error('Error fetching tea details:', error);
    }
  }
  
  // Main content management
  _pushMainContentUp() {
    // Get viewport height to calculate proportions
    const viewportHeight = window.innerHeight;
    const isPortrait = window.innerHeight > window.innerWidth;
    
    // Adjust ratio based on screen orientation
    let pushRatio = isPortrait ? 0.6 : 0.4;
    
    // Always leave room for at least 1 row of cards at the top
    const minVisibleTeaCards = 100; 
    
    // Calculate how much to push up
    let pushHeight = Math.min(this._touchState.panelHeight * pushRatio, viewportHeight * 0.5);
    pushHeight = Math.min(pushHeight, viewportHeight - minVisibleTeaCards);
    pushHeight = Math.max(pushHeight, Math.min(200, viewportHeight * 0.3));
    
    // Apply push to main content
    if (this._mainContent) {
      this._mainContent.style.transition = 'transform 0.3s ease-out';
      this._mainContent.style.transform = `translateY(-${pushHeight}px)`;
    }
    
    // Handle the add button
    const addButton = document.querySelector('.add-tea-button');
    if (addButton) {
      addButton.style.transition = 'transform 0.3s ease-out, opacity 0.3s ease';
      addButton.style.transform = 'translateY(-30px)';
      addButton.style.opacity = '0';
    }
  }
  
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
  }
  
  // Event handling
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
    if (event.target === event.currentTarget) {
      this.close();
    }
  }
  
  _handleBrewStyleToggle(event) {
    this._brewStyle = event.target.checked ? 'gongfu' : 'western';
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
    this._dispatchEvent('start-steeping', { tea: teaForSteeping });
    
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
    
    if (timeElement) timeElement.textContent = brewingTime;
    if (tempElement) tempElement.textContent = temperature;
  }
  
  // Touch event handlers for swipe to close gesture
  _handleTouchStart(event) {
    if (!event.touches[0]) return;
    
    const touch = event.touches[0];
    this._touchState = {
      ...this._touchState,
      isDragging: false,
      startY: touch.clientY,
      startX: touch.clientX,
      lastY: touch.clientY,
      lastX: touch.clientX
    };
    
    // Store the initial position of the panel
    const panel = this.shadowRoot.querySelector('.detail-panel');
    if (panel) {
      // Get the current transform value
      const transform = getComputedStyle(panel).transform;
      if (transform && transform !== 'none') {
        // Extract the Y translation from the matrix
        const matrix = new DOMMatrix(transform);
        this._touchState.initialPanelY = matrix.m42;
      } else {
        this._touchState.initialPanelY = 0;
      }
      
      // Remove transition during dragging for responsiveness
      panel.style.transition = 'none';
    }
  }
  
  _handleTouchMove(event) {
    if (!event.touches[0]) return;
    
    const touch = event.touches[0];
    const currentY = touch.clientY;
    const currentX = touch.clientX;
    const deltaY = currentY - this._touchState.startY;
    const deltaX = currentX - this._touchState.startX;
    
    // Store current position
    this._touchState.lastY = currentY;
    this._touchState.lastX = currentX;
    
    // If more horizontal than vertical movement, let scroll happen
    if (Math.abs(deltaX) > Math.abs(deltaY)) return;
    
    // Determine if we should start dragging
    if (!this._touchState.isDragging) {
      const detailContent = this.shadowRoot.querySelector('.detail-content');
      
      // Only start dragging if at top of content or dragging down
      if (deltaY > 0 || (detailContent && detailContent.scrollTop <= 0)) {
        this._touchState.isDragging = true;
        
        // If just started dragging but not at the top, prevent movement
        if (detailContent && detailContent.scrollTop > 0) return;
      } else {
        // Allow normal scrolling
        return;
      }
    }
    
    // Now dragging, prevent default scroll
    event.preventDefault();
    
    // Allow dragging only if moving down or already displaced
    if (deltaY > 0 || this._touchState.initialPanelY > 0) {
      // Apply resistance to dragging - more resistance as you drag further
      const resistance = 0.3 + (0.7 * (1 - Math.min(deltaY / window.innerHeight, 1)));
      const newTranslateY = this._touchState.initialPanelY + (deltaY * resistance);
      
      // Update panel position
      const panel = this.shadowRoot.querySelector('.detail-panel');
      if (panel) {
        panel.style.transform = `translateY(${newTranslateY}px)`;
      }
      
      // Adjust main content to follow
      if (this._mainContent) {
        // Calculate how much the main content should move
        const mainAdjustment = Math.max(0, deltaY * -0.3);
        // Calculate new position - smoothly transitioning back
        const pushHeight = Math.min(this._touchState.panelHeight * 0.6, window.innerHeight * 0.5);
        const newMainPosition = Math.max(-pushHeight, -pushHeight + mainAdjustment);
        
        this._mainContent.style.transform = `translateY(${newMainPosition}px)`;
      }
    }
  }
  
  _handleTouchEnd() {
    // Re-enable transitions
    const panel = this.shadowRoot.querySelector('.detail-panel');
    if (panel) {
      panel.style.transition = 'transform 0.3s cubic-bezier(0.4, 0.0, 0.2, 1)';
    }
    
    if (!this._touchState.isDragging) return;
    
    // Calculate distance of swipe
    const deltaY = this._touchState.lastY - this._touchState.startY;
    
    // Close if dragged down more than 25% of panel height
    if (deltaY > this._touchState.panelHeight * 0.25) {
      this.close();
    } else {
      // Reset panel position
      if (panel) {
        panel.style.transform = 'translateY(0)';
      }
      
      // Reset main content to pushed-up position
      this._pushMainContentUp();
    }
    
    // Reset drag state
    this._touchState.isDragging = false;
  }
  
  // Utility methods
  _dispatchEvent(name, detail = {}) {
    const event = new CustomEvent(name, {
      bubbles: true,
      composed: true,
      detail
    });
    
    this.dispatchEvent(event);
    
    // If global event manager exists, use it too
    if (window.TeaEvents) {
      // Convert event names to match global event types if needed
      // For example: 'tea-detail-opened' -> 'DETAIL_OPENED'
      const eventType = window.TeaEventTypes?.[name.replace(/^tea-|-/g, '_').toUpperCase()] || name;
      window.TeaEvents.emit(eventType, detail);
    }
  }
  
  _getDefaultBrewTime(category) {
    const defaults = {
      'Green': '2:30',
      'Black': '3:30',
      'Oolong': '3:15',
      'White': '3:00',
      'Pu-erh': '4:00',
      'Yellow': '2:45'
    };
    
    return defaults[category] || '3:00';
  }
  
  _getDefaultTemperature(category) {
    const defaults = {
      'Green': '80°C',
      'Black': '95°C',
      'Oolong': '90°C',
      'White': '80°C',
      'Pu-erh': '95°C',
      'Yellow': '80°C'
    };
    
    return defaults[category] || '85°C';
  }
  
  _getCategoryColor(category) {
    // Color mapping for tea categories using CSS variables when possible
    return `var(--tea-${category.toLowerCase()}-color, ${this._getFallbackCategoryColor(category)})`;
  }
  
  _getFallbackCategoryColor(category) {
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
        --tea-green-color: #7B9070;
        --tea-black-color: #A56256;
        --tea-oolong-color: #C09565;
        --tea-white-color: #D8DCD5;
        --tea-pu-erh-color: #6F5244;
        --tea-yellow-color: #D1CDA6;
        --tea-current-color: ${categoryColor};
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
        background-color: var(--tea-current-color);
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
        background-color: white;
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
        color: var(--tea-current-color);
        box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
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
        color: var(--tea-current-color);
      }
      
      .section-title::before {
        content: '';
        position: absolute;
        left: 0;
        top: 0;
        height: 100%;
        width: 4px;
        background-color: var(--tea-current-color);
        border-radius: 2px;
      }
      
      .brewing-section {
        background-color: #f9f9f9;
        padding: 16px;
        border-radius: 8px;
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
        background-color: var(--tea-current-color);
      }
      
      input:checked + .brew-toggle-slider:before {
        transform: translateX(26px);
      }
      
      .brewing-params {
        display: flex;
        justify-content: space-around;
        align-items: center;
        gap: 8px;
      }
      
      .brew-param {
        flex: 1;
        text-align: center;
        padding: 12px;
        background-color: white;
        border-radius: 8px;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
      }
      
      .brew-param-label {
        font-size: 0.8rem;
        color: #666;
        margin-bottom: 4px;
      }
      
      .brew-param-value {
        font-size: 1.1rem;
        font-weight: 600;
        color: var(--tea-current-color);
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
        background-color: var(--tea-current-color);
        border: none;
        border-radius: 8px;
        color: white;
        font-size: 1rem;
        font-weight: 600;
        cursor: pointer;
        transition: opacity 0.2s ease, transform 0.2s ease;
      }
      
      .steep-button:hover {
        opacity: 0.9;
        transform: translateY(-1px);
      }
      
      .steep-button:active {
        transform: translateY(1px);
      }
      
      @media (min-width: 768px) {
        .detail-panel {
          width: 90%;
          max-width: 500px;
          left: 50%;
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
customElements.define('tea-detail', TeaDetail);

export default TeaDetail;
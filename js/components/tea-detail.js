// components/tea-detail.js
// Tea detail component with ID debugging to fix mismatched data

import TeaDatabase from '../services/tea-database.js';
import TeaTheme from '../utils/tea-theme.js';
import ColorUtility from '../utils/color-utility.js';
import { teaEvents, TeaEventTypes } from '../services/event-manager.js';

class TeaDetail extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    
    // Core state management
    this._state = {
      isOpen: false,
      teaData: null,
      brewStyle: 'western'
    };
    
    // Touch tracking for swipe to close
    this._touchState = {
      startY: 0,
      startX: 0,
      lastY: 0, 
      lastX: 0,
      isDragging: false
    };
    
    // Bind methods to prevent losing 'this' context
    this._handleClose = this._handleClose.bind(this);
    this._handleBackdropClick = this._handleBackdropClick.bind(this);
    this._handleTouchStart = this._handleTouchStart.bind(this);
    this._handleTouchMove = this._handleTouchMove.bind(this);
    this._handleTouchEnd = this._handleTouchEnd.bind(this);
  }

  // Lifecycle methods
  connectedCallback() {
    this.render();
  }
  
  disconnectedCallback() {
    this._removeEventListeners();
  }

  // Get theme colors based on tea category
  _getThemeColors(category) {
    const baseColor = TeaTheme.getColor(category || 'Green');
    return {
      primary: baseColor,
      text: ColorUtility.getOptimalTextColor(baseColor),
      light: ColorUtility.lightenColor(baseColor, 15),
      dark: ColorUtility.darkenColor(baseColor, 15)
    };
  }

  // Push main content up when detail view opens
  _pushMainContentUp() {
    const mainContent = document.querySelector('.app-container');
    const addButton = document.querySelector('.add-tea-button');
    
    if (mainContent) {
      mainContent.style.transition = 'transform 0.3s ease-out';
      mainContent.style.transform = 'translateY(-200px)';
    }
    
    if (addButton) {
      addButton.style.transition = 'transform 0.3s ease-out, opacity 0.3s ease';
      addButton.style.transform = 'translateY(-30px)';
      addButton.style.opacity = '0';
    }
  }

  // Reset main content position
  _resetMainContent() {
    const mainContent = document.querySelector('.app-container');
    const addButton = document.querySelector('.add-tea-button');
    
    if (mainContent) {
      mainContent.style.transform = 'translateY(0)';
    }
    
    if (addButton) {
      addButton.style.transform = '';
      addButton.style.opacity = '';
    }
  }

  // Set up event listeners
  _setupEventListeners() {
    const closeButton = this.shadowRoot.querySelector('.close-button');
    const backdrop = this.shadowRoot.querySelector('.detail-backdrop');
    const detailPanel = this.shadowRoot.querySelector('.detail-panel');
    
    if (closeButton) {
      closeButton.addEventListener('click', this._handleClose);
    }
    
    if (backdrop) {
      backdrop.addEventListener('click', this._handleBackdropClick);
    }
    
    // Touch events for swipe to close
    if (detailPanel) {
      detailPanel.addEventListener('touchstart', this._handleTouchStart, { passive: true });
      detailPanel.addEventListener('touchmove', this._handleTouchMove, { passive: false });
      detailPanel.addEventListener('touchend', this._handleTouchEnd, { passive: true });
    }
  }
  
  _removeEventListeners() {
    const closeButton = this.shadowRoot.querySelector('.close-button');
    const backdrop = this.shadowRoot.querySelector('.detail-backdrop');
    const detailPanel = this.shadowRoot.querySelector('.detail-panel');
    
    if (closeButton) {
      closeButton.removeEventListener('click', this._handleClose);
    }
    
    if (backdrop) {
      backdrop.removeEventListener('click', this._handleBackdropClick);
    }
    
    if (detailPanel) {
      detailPanel.removeEventListener('touchstart', this._handleTouchStart);
      detailPanel.removeEventListener('touchmove', this._handleTouchMove);
      detailPanel.removeEventListener('touchend', this._handleTouchEnd);
    }
  }

  // Touch event handlers for swipe-to-close gesture
  _handleTouchStart(event) {
    if (!event.touches[0]) return;
    
    const touch = event.touches[0];
    this._touchState.isDragging = false;
    this._touchState.startY = touch.clientY;
    this._touchState.startX = touch.clientX;
    this._touchState.lastY = touch.clientY;
    this._touchState.lastX = touch.clientX;
    
    // Remove transition during dragging for responsiveness
    const panel = this.shadowRoot.querySelector('.detail-panel');
    if (panel) {
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
    
    // Allow dragging only if moving down
    if (deltaY > 0) {
      // Apply some resistance to dragging
      const resistance = 0.5;
      const newTranslateY = deltaY * resistance;
      
      // Update panel position
      const panel = this.shadowRoot.querySelector('.detail-panel');
      if (panel) {
        panel.style.transform = `translateY(${newTranslateY}px)`;
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
    
    // Close if dragged down more than 100px
    if (deltaY > 100) {
      this.close();
    } else {
      // Reset panel position
      if (panel) {
        panel.style.transform = 'translateY(0)';
      }
    }
    
    // Reset drag state
    this._touchState.isDragging = false;
  }

  // Handle close button click
  _handleClose() {
    this.close();
  }

  // Handle backdrop click
  _handleBackdropClick(event) {
    if (event.target === event.currentTarget) {
      this.close();
    }
  }

  // Fixed: Direct and explicit tea lookup by ID
  async _getTeaById(id) {
    try {
      // First directly query the database with the exact ID
      const tea = await TeaDatabase.getTeaById(id);
      
      if (tea) {
        return tea;
      }
      
      // Try all teas to find a match
      const allTeas = await TeaDatabase.getAllTeas();
      
      // Look for an ID match considering type conversion
      for (const tea of allTeas) {
        if (tea.id == id) { // Use loose equality to check across types
          return tea;
        }
      }
      
      return null;
    } catch (error) {
      console.error(`Error looking up tea by ID ${id}:`, error);
      return null;
    }
  }

  // Create basic content display
  _createBasicContent() {
    if (!this._state.teaData) return;
    
    const contentContainer = this.shadowRoot.querySelector('.detail-content');
    if (!contentContainer) return;
    
    // First, clear any existing content
    const existingContent = document.querySelector('[slot="content"]');
    if (existingContent) {
      existingContent.remove();
    }
    
    // Create basic property display
    const basicContent = document.createElement('div');
    basicContent.slot = 'content';
    basicContent.className = 'basic-content';
    
    // Add tea ID debugging information at the top
    const idDebug = document.createElement('div');
    idDebug.className = 'id-debug';
    idDebug.style.padding = '8px';
    idDebug.style.marginBottom = '16px';
    idDebug.style.backgroundColor = '#f3f3f3';
    idDebug.style.borderRadius = '4px';
    idDebug.style.fontSize = '14px';
    idDebug.innerHTML = `
      <strong>Tea ID:</strong> ${this._state.teaData.id} (${typeof this._state.teaData.id})
    `;
    basicContent.appendChild(idDebug);
    
    // Generate content for each property
    Object.entries(this._state.teaData).forEach(([key, value]) => {
      if (value === null || value === undefined || value === '') return;
      
      const propertyDiv = document.createElement('div');
      propertyDiv.className = 'property-item';
      propertyDiv.style.marginBottom = '12px';
      
      // Format the key
      const formattedKey = key
        .replace(/([A-Z])/g, ' $1')
        .replace(/^./, str => str.toUpperCase());
      
      // Create display
      const keyElem = document.createElement('strong');
      keyElem.textContent = formattedKey + ': ';
      
      const valueElem = document.createElement('span');
      if (Array.isArray(value)) {
        valueElem.textContent = value.join(', ');
      } else if (typeof value === 'object') {
        valueElem.textContent = JSON.stringify(value);
      } else {
        valueElem.textContent = value.toString();
      }
      
      propertyDiv.appendChild(keyElem);
      propertyDiv.appendChild(valueElem);
      basicContent.appendChild(propertyDiv);
    });
    
    // Add to the document
    this.appendChild(basicContent);
  }

  // Open tea detail view
  async open(teaData) {
    if (!teaData) {
      console.error('No tea data provided to TeaDetail.open()');
      return;
    }

    try {
      // If already open, first clear existing content
      if (this._state.isOpen) {
        // Clear any existing content
        const existingContent = document.querySelector('[slot="content"]');
        if (existingContent) {
          existingContent.remove();
        }
      }

      // Get tea directly by ID if provided
      let fullTeaData = teaData;
      if (teaData.id) {
        const exactTea = await this._getTeaById(teaData.id);
        if (exactTea) {
          fullTeaData = exactTea;
        }
      }
      
      // Store the tea data
      this._state.teaData = fullTeaData;
      
      // Update the UI
      this._state.isOpen = true;
      this.render();
      this._setupEventListeners();
      
      // Create basic content with the new tea data
      this._createBasicContent();
      
      // Animate opening and push content
      setTimeout(() => {
        const detailPanel = this.shadowRoot.querySelector('.detail-panel');
        const backdrop = this.shadowRoot.querySelector('.detail-backdrop');
        
        if (detailPanel) detailPanel.classList.add('open');
        if (backdrop) backdrop.classList.add('open');
        
        this._pushMainContentUp();
        document.body.style.overflow = 'hidden';
        
        // Scroll the collection to the bottom with smooth animation
        const teaCollection = document.querySelector('tea-collection');
        if (teaCollection) {
          const collectionContent = teaCollection.shadowRoot.querySelector('.tea-grid-container');
          if (collectionContent) {
            collectionContent.scrollTo({
              top: collectionContent.scrollHeight,
              behavior: 'smooth'
            });
          }
        }
        
        // Dispatch event
        this.dispatchEvent(new CustomEvent('tea-detail-opened', {
          bubbles: true,
          composed: true,
          detail: { tea: this._state.teaData }
        }));
      }, 10);

    } catch (error) {
      console.error('Error opening tea details:', error);
    }
  }

  // Close tea detail view
  close() {
    const detailPanel = this.shadowRoot.querySelector('.detail-panel');
    const backdrop = this.shadowRoot.querySelector('.detail-backdrop');
    
    if (detailPanel) detailPanel.classList.remove('open');
    if (backdrop) backdrop.classList.remove('open');
    
    this._resetMainContent();
    
    // Dispatch event
    this.dispatchEvent(new CustomEvent('tea-detail-closed', {
      bubbles: true,
      composed: true
    }));
    
    // Wait for animation to complete before hiding
    setTimeout(() => {
      this._state.isOpen = false;
      this._state.teaData = null;  // Make sure we clear the tea data
      this.render();
      document.body.style.overflow = '';
      
      // Also clear any content that might have been added
      const contentSlot = this.shadowRoot.querySelector('slot[name="content"]');
      if (contentSlot) {
        const nodes = contentSlot.assignedNodes();
        nodes.forEach(node => {
          if (node.parentNode) {
            node.parentNode.removeChild(node);
          }
        });
      }
    }, 300);
  }
  
  // Render the component
  render() {
    if (!this._state.isOpen) {
      this.shadowRoot.innerHTML = `
        <style>:host { display: none; }</style>
      `;
      return;
    }

    // Get theme colors based on tea category
    const colors = this._getThemeColors(this._state.teaData?.category);

    const styles = `
      :host {
        display: block;
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        z-index: 95;
        pointer-events: none;
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
        pointer-events: none;
      }

      .detail-backdrop.open {
        opacity: 1;
        pointer-events: auto;
      }

      .detail-panel {
        position: absolute;
        bottom: 64px; /* Leave space for bottom nav */
        left: 0;
        width: 100%;
        max-height: calc(90vh - 64px);
        background-color: ${colors.primary};
        // background-color: white;
        // border-top-left-radius: 16px;
        // border-top-right-radius: 16px;
        transform: translateY(100%);
        transition: transform 0.3s cubic-bezier(0.4, 0.0, 0.2, 1);
        overflow: hidden;
        pointer-events: auto;
        // box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.1);
      }

      .detail-panel.open {
        transform: translateY(0);
      }

      .detail-handle {
        width: 36px;
        height: 5px;
        background-color: rgba(0, 0, 0, 0.1);
        border-radius: 3px;
        margin: 8px auto;
      }

      .detail-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 0 16px 12px;
        background-color: ${colors.primary};
        color: ${colors.text};
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
        color: ${colors.text};
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
        max-height: 70vh;
        overflow-y: auto;
        padding: 16px;
        background-color: ${colors.primary};
        color: ${colors.text};
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
      }
    `;

    this.shadowRoot.innerHTML = `
      <style>${styles}</style>
      <div class="detail-backdrop"></div>
      <div class="detail-panel">
        <div class="detail-handle"></div>
        <div class="detail-header">
          <button class="close-button" aria-label="Close">×</button>
          <h2 class="detail-title">${this._state.teaData?.name || 'Tea Details'}</h2>
          <div style="width: 32px;"></div> <!-- Spacer for alignment -->
        </div>
        <div class="detail-content">
          <slot name="content"></slot>
        </div>
      </div>
    `;

    // Set up event listeners after rendering
    this._setupEventListeners();
  }
}

// Register the custom element
customElements.define('tea-detail', TeaDetail);

export default TeaDetail;
// components/tea-circle.js
// Enhanced version with improved DOM communication

class TeaCircle extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    
    // State
    this._name = '';
    this._category = '';
    this._collected = false;
    this._index = 0;
    this._showTooltip = false;
    this._animateIn = false;
    this._teaId = ''; // Added tea ID property for better identification
    
    // Debug flag
    this._debug = false; // Changed to false for production
    
    // Long press timer
    this._longPressTimer = null;
    this._longPressDuration = 600; // ms
    
    // Animation timeout
    this._animationTimeout = null;
    
    // Bind methods
    this._handlePointerDown = this._handlePointerDown.bind(this);
    this._handlePointerUp = this._handlePointerUp.bind(this);
    this._handlePointerLeave = this._handlePointerLeave.bind(this);
    this._handleClick = this._handleClick.bind(this);
    this._showNameTooltip = this._showNameTooltip.bind(this);
    this._hideNameTooltip = this._hideNameTooltip.bind(this);
    
    if (this._debug) console.log(`Tea circle created for: ${this._name}`);
  }

  connectedCallback() {
    if (this._debug) console.log(`Tea circle connected: ${this._name || 'unnamed'}`);
    
    // Extract attributes
    this._name = this.getAttribute('name') || '';
    this._category = this.getAttribute('category') || '';
    this._collected = this.hasAttribute('collected');
    this._index = parseInt(this.getAttribute('index') || '0', 10);
    this._animateIn = this.hasAttribute('animate-in');
    this._teaId = this.getAttribute('tea-id') || this.id || ''; // Get tea ID from attribute or element ID
    
    // Initial render
    this.render();
    
    // Add event listeners
    this._addEventListeners();
    
    // Set initial animation if needed
    if (this._animateIn) {
      this._triggerAnimation();
    } else {
      // Set a timeout to trigger animation regardless, in case the attribute wasn't set
      this._animationTimeout = setTimeout(() => {
        this._triggerAnimation();
      }, this._index * 30 + 300); // Staggered delay
    }
  }
  
  disconnectedCallback() {
    if (this._debug) console.log(`Tea circle disconnected: ${this._name}`);
    
    this._removeEventListeners();
    this._clearLongPressTimer();
    
    if (this._animationTimeout) {
      clearTimeout(this._animationTimeout);
      this._animationTimeout = null;
    }
  }
  
  static get observedAttributes() {
    return ['name', 'category', 'collected', 'index', 'animate-in', 'tea-id'];
  }
  
  attributeChangedCallback(name, oldValue, newValue) {
    if (this._debug) console.log(`Tea circle attribute changed: ${name}, from ${oldValue} to ${newValue}`);
    
    if (oldValue === newValue) return;
    
    switch (name) {
      case 'name':
        this._name = newValue || '';
        break;
      case 'category':
        this._category = newValue || '';
        break;
      case 'collected':
        this._collected = this.hasAttribute('collected');
        break;
      case 'index':
        this._index = parseInt(newValue || '0', 10);
        break;
      case 'animate-in':
        if (newValue === 'true' || newValue === '') {
          this._animateIn = true;
          this._triggerAnimation();
        }
        break;
      case 'tea-id':
        this._teaId = newValue || '';
        break;
    }
    
    this.render();
  }
  
  // Private method to trigger the animation
  _triggerAnimation() {
    const circle = this.shadowRoot.querySelector('.tea-circle');
    if (circle) {
      if (this._debug) console.log(`Triggering animation for: ${this._name}`);
      circle.classList.add('animate-in');
    }
  }
  
  // Public methods
  setCollected(isCollected) {
    if (this._collected !== isCollected) {
      this._collected = isCollected;
      this.toggleAttribute('collected', isCollected);
      this.render();
      
      // Animate the state change
      const circle = this.shadowRoot.querySelector('.tea-circle');
      if (circle) {
        circle.classList.add('state-change');
        setTimeout(() => {
          circle.classList.remove('state-change');
        }, 500);
      }
    }
  }
  
  // Private methods
  _addEventListeners() {
    const circle = this.shadowRoot.querySelector('.tea-circle');
    if (circle) {
      circle.addEventListener('pointerdown', this._handlePointerDown);
      circle.addEventListener('pointerup', this._handlePointerUp);
      circle.addEventListener('pointerleave', this._handlePointerLeave);
      circle.addEventListener('click', this._handleClick);
      
      // Force visibility after a short delay - helps with circles not appearing
      if (this._animateIn) {
        this._triggerAnimation();
      }
    }
  }
  
  _removeEventListeners() {
    const circle = this.shadowRoot.querySelector('.tea-circle');
    if (circle) {
      circle.removeEventListener('pointerdown', this._handlePointerDown);
      circle.removeEventListener('pointerup', this._handlePointerUp);
      circle.removeEventListener('pointerleave', this._handlePointerLeave);
      circle.removeEventListener('click', this._handleClick);
    }
  }
  
  _handlePointerDown(event) {
    this._clearLongPressTimer();
    
    // Start long press timer
    this._longPressTimer = setTimeout(() => {
      this._showNameTooltip();
    }, this._longPressDuration);
  }
  
  _handlePointerUp(event) {
    this._clearLongPressTimer();
    this._hideNameTooltip();
  }
  
  _handlePointerLeave(event) {
    this._clearLongPressTimer();
    this._hideNameTooltip();
  }
  
  _handleClick(event) {
    this._clearLongPressTimer();
    this._hideNameTooltip();
    
    // Only proceed if collected
    if (this._collected) {
      if (this._debug) console.log(`Tea circle clicked: ${this._name} (ID: ${this._teaId})`);
      
      // Dispatch a custom event that can be caught by parent components
      const teaSelectEvent = new CustomEvent('tea-select', {
        bubbles: true,
        composed: true, // Ensures the event crosses shadow DOM boundaries
        detail: {
          name: this._name,
          category: this._category,
          id: this._teaId || this.id
        }
      });
      
      this.dispatchEvent(teaSelectEvent);
      
      if (this._debug) console.log('Tea select event dispatched:', teaSelectEvent);
    }
  }
  
  _clearLongPressTimer() {
    if (this._longPressTimer) {
      clearTimeout(this._longPressTimer);
      this._longPressTimer = null;
    }
  }
  
  _showNameTooltip() {
    this._showTooltip = true;
    this.render();
  }
  
  _hideNameTooltip() {
    this._showTooltip = false;
    this.render();
  }
  
  _getCategoryColor() {
    // Color mapping for tea categories
    const colorMap = {
      'Green': { 
        base: '#7B9070', 
        light: '#C1D7B8' 
      },
      'Black': { 
        base: '#A56256', 
        light: '#E5B5AD' 
      },
      'Oolong': { 
        base: '#C09565', 
        light: '#E8D7BC' 
      },
      'White': { 
        base: '#D8DCD5', 
        light: '#F0F2EF' 
      },
      'Pu-erh': { 
        base: '#6F5244', 
        light: '#BDA99E' 
      },
      'Yellow': { 
        base: '#D1CDA6', 
        light: '#EEECD9' 
      }
    };
    
    return colorMap[this._category] || { base: '#888888', light: '#DDDDDD' };
  }
  
  render() {
    const colors = this._getCategoryColor();
    const circleColor = this._collected ? colors.base : colors.light;
    const circleOpacity = this._collected ? 1 : 0.5;
    
    const styles = `
      :host {
        display: block;
        pointer-events: auto;
      }
      
      .tea-circle-container {
        position: relative;
      }
      
      .tea-circle {
        width: 64px;
        height: 64px;
        border-radius: 50%;
        background-color: ${circleColor};
        opacity: 0; /* Start invisible */
        cursor: pointer;
        transform: scale(0.8);
        transition: transform 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275), 
                    opacity 0.5s ease, 
                    box-shadow 0.3s ease;
        margin: 0 auto;
        will-change: transform, opacity;
      }
      
      .tea-circle.animate-in {
        transform: scale(1);
        opacity: ${circleOpacity};
      }
      
      .tea-circle:hover {
        transform: scale(1.05);
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
      }
      
      .tea-circle.state-change {
        animation: pulse 0.5s ease;
      }
      
      .tooltip {
        position: absolute;
        bottom: 100%;
        left: 50%;
        transform: translateX(-50%) translateY(-8px);
        background: rgba(0, 0, 0, 0.8);
        color: white;
        padding: 4px 8px;
        border-radius: 4px;
        font-size: 12px;
        white-space: nowrap;
        opacity: 0;
        visibility: hidden;
        transition: opacity 0.2s ease, transform 0.2s ease, visibility 0.2s ease;
        pointer-events: none;
        z-index: 10;
      }
      
      .tooltip::after {
        content: '';
        position: absolute;
        top: 100%;
        left: 50%;
        transform: translateX(-50%);
        border-width: 4px;
        border-style: solid;
        border-color: rgba(0, 0, 0, 0.8) transparent transparent transparent;
      }
      
      .tooltip.visible {
        opacity: 1;
        visibility: visible;
        transform: translateX(-50%) translateY(-4px);
      }
      
      @keyframes pulse {
        0% { transform: scale(1); }
        50% { transform: scale(1.1); box-shadow: 0 0 10px rgba(0, 0, 0, 0.2); }
        100% { transform: scale(1); }
      }
      
      /* Debug styles */
      .debug-info {
        position: absolute;
        bottom: -20px;
        left: 0;
        right: 0;
        font-size: 8px;
        text-align: center;
        color: #999;
        pointer-events: none;
      }
    `;
    
    this.shadowRoot.innerHTML = `
      <style>${styles}</style>
      <div class="tea-circle-container">
        <div class="tooltip ${this._showTooltip ? 'visible' : ''}">
          ${this._name}
        </div>
        <div class="tea-circle" title="${this._name}" data-tea-id="${this._teaId}"></div>
        ${this._debug ? `
          <div class="debug-info">
            ${this._index}${this._collected ? '•' : '°'} ${this._teaId}
          </div>
        ` : ''}
      </div>
    `;
    
    // Re-attach event listeners after render
    this._addEventListeners();
  }
}

customElements.define('tea-circle', TeaCircle);

export default TeaCircle;
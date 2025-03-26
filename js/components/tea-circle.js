// components/tea-circle.js
// Final version with proper size reset after interaction

import { teaEvents, TeaEventTypes } from '../services/event-manager.js';
import TeaTheme from '../utils/tea-theme.js';

class TeaCircle extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    
    // Structured state
    this._state = {
      name: '',
      category: '',
      collected: false,
      index: 0,
      showTooltip: false,
      animateIn: false,
      teaId: ''
    };
    
    // Touch interaction improvements
    this._touchState = {
      timer: null,
      duration: 600,
      isPressed: false
    };
    
    // Animation timeout
    this._animationTimeout = null;
    
    // Bind methods
    this._handlePointerDown = this._handlePointerDown.bind(this);
    this._handlePointerUp = this._handlePointerUp.bind(this);
    this._handlePointerLeave = this._handlePointerLeave.bind(this);
    this._handleClick = this._handleClick.bind(this);
    this._showNameTooltip = this._showNameTooltip.bind(this);
    this._hideNameTooltip = this._hideNameTooltip.bind(this);
  }

  connectedCallback() {
    // Extract attributes
    this._state.name = this.getAttribute('name') || '';
    this._state.category = this.getAttribute('category') || '';
    this._state.collected = this.hasAttribute('collected');
    this._state.index = parseInt(this.getAttribute('index') || '0', 10);
    this._state.animateIn = this.hasAttribute('animate-in');
    this._state.teaId = this.getAttribute('tea-id') || this.id || '';
    
    // Initial render
    this.render();
    
    // Add event listeners
    this._addEventListeners();
    
    // Set initial animation if needed
    if (this._state.animateIn) {
      this._triggerAnimation();
    } else {
      // Set a timeout to trigger animation
      this._animationTimeout = setTimeout(() => {
        this._triggerAnimation();
      }, this._state.index * 30 + 300); // Staggered delay
    }
  }
  
  disconnectedCallback() {
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
    if (oldValue === newValue) return;
    
    switch (name) {
      case 'name':
        this._state.name = newValue || '';
        break;
      case 'category':
        this._state.category = newValue || '';
        break;
      case 'collected':
        this._state.collected = this.hasAttribute('collected');
        break;
      case 'index':
        this._state.index = parseInt(newValue || '0', 10);
        break;
      case 'animate-in':
        if (newValue === 'true' || newValue === '') {
          this._state.animateIn = true;
          this._triggerAnimation();
        }
        break;
      case 'tea-id':
        this._state.teaId = newValue || '';
        break;
    }
    
    // Don't re-render the entire component for attribute changes
    // Just update the affected parts
    this._updateRenderedState();
  }
  
  // Private method to update parts of the DOM without full re-render
  _updateRenderedState() {
    const circle = this.shadowRoot.querySelector('.tea-circle');
    if (!circle) return;
    
    // Update color based on category
    const color = TeaTheme.getColor(this._state.category, !this._state.collected);
    circle.style.backgroundColor = color;
    
    // Update opacity based on collected state
    circle.style.opacity = this._state.collected ? '1' : '0.5';
    
    // Update tooltip content
    const tooltip = this.shadowRoot.querySelector('.tooltip');
    if (tooltip) {
      tooltip.textContent = this._state.name;
    }
    
    // Update title attribute for accessibility
    circle.setAttribute('title', this._state.name);
    
    // Update data-tea-id attribute
    circle.setAttribute('data-tea-id', this._state.teaId);
  }
  
  // Private method to trigger the animation
  _triggerAnimation() {
    const circle = this.shadowRoot.querySelector('.tea-circle');
    if (circle) {
      circle.classList.add('animate-in');
    }
  }
  
  // Reset circle to normal size (call this after click animation)
  _resetCircleSize() {
    const circle = this.shadowRoot.querySelector('.tea-circle');
    if (circle) {
      // Remove any temporary classes that might affect size
      circle.classList.remove('active');
      // Reset to base size (without affecting opacity/visibility)
      circle.style.transform = 'scale(1)';
    }
  }
  
  // Public methods
  setCollected(isCollected) {
    if (this._state.collected !== isCollected) {
      this._state.collected = isCollected;
      this.toggleAttribute('collected', isCollected);
      
      // Update rendered state
      this._updateRenderedState();
      
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
      // Use passive false for pointer events to ensure we can prevent default
      circle.addEventListener('pointerdown', this._handlePointerDown, { passive: false });
      circle.addEventListener('pointerup', this._handlePointerUp, { passive: true });
      circle.addEventListener('pointerleave', this._handlePointerLeave, { passive: true });
      circle.addEventListener('click', this._handleClick, { passive: false });
      
      // Add direct mouse events as backup
      circle.addEventListener('mousedown', this._handlePointerDown, { passive: false });
      circle.addEventListener('mouseup', this._handlePointerUp, { passive: true });
      circle.addEventListener('mouseleave', this._handlePointerLeave, { passive: true });
    }
  }
  
  _removeEventListeners() {
    const circle = this.shadowRoot.querySelector('.tea-circle');
    if (circle) {
      circle.removeEventListener('pointerdown', this._handlePointerDown);
      circle.removeEventListener('pointerup', this._handlePointerUp);
      circle.removeEventListener('pointerleave', this._handlePointerLeave);
      circle.removeEventListener('click', this._handleClick);
      
      // Remove backup mouse events
      circle.removeEventListener('mousedown', this._handlePointerDown);
      circle.removeEventListener('mouseup', this._handlePointerUp);
      circle.removeEventListener('mouseleave', this._handlePointerLeave);
    }
  }
  
  _handlePointerDown(event) {
    // Prevent default to avoid text selection but don't stop propagation
    event.preventDefault();
    
    const circle = this.shadowRoot.querySelector('.tea-circle');
    if (circle) {
      // Add active class for visual feedback
      circle.classList.add('active');
    }
    
    this._clearLongPressTimer();
    this._touchState.isPressed = true;
    
    // Start long press timer
    this._touchState.timer = setTimeout(() => {
      this._showNameTooltip();
    }, this._touchState.duration);
  }
  
  _handlePointerUp(event) {
    this._clearLongPressTimer();
    this._touchState.isPressed = false;
    this._hideNameTooltip();
    
    // Make sure circle returns to normal size
    setTimeout(() => {
      this._resetCircleSize();
    }, 150); // Small delay to ensure the active animation completes
  }
  
  _handlePointerLeave(event) {
    this._clearLongPressTimer();
    this._touchState.isPressed = false;
    this._hideNameTooltip();
    
    // Make sure circle returns to normal size when pointer leaves
    this._resetCircleSize();
  }
  
  _handleClick(event) {
    // CRITICAL FIX: Only prevent default but DO NOT stop propagation
    // This allows the event to bubble up while preventing browser actions
    if (event.cancelable) {
      event.preventDefault();
    }
    
    this._clearLongPressTimer();
    this._hideNameTooltip();
    
    // Apply visual feedback
    const circle = this.shadowRoot.querySelector('.tea-circle');
    if (circle) {
      // Provide visual feedback for the click
      circle.classList.add('clicked');
      
      // Remove the class after animation completes
      setTimeout(() => {
        circle.classList.remove('clicked');
        this._resetCircleSize();
      }, 300);
    }
    
    // Only proceed if collected
    if (this._state.collected) {
      // IMPORTANT FIX: Ensure we pass the correct ID format
      // Get the ID from the data-tea-id attribute of the circle element
      const teaId = circle ? circle.getAttribute('data-tea-id') : null;
      
      // Log debugging info
      console.log(`Tea circle clicked: ${this._state.name} with ID: ${teaId}`);
      
      // CRITICAL FIX: Add a source identifier to prevent event loops
      teaEvents.emit(TeaEventTypes.TEA_SELECTED, {
        name: this._state.name,
        category: this._state.category,
        id: teaId || this._state.teaId || this.id,
        collected: this._state.collected,
        source: 'tea-circle' // Add source to identify origin
      });
    }
  }
  
  _clearLongPressTimer() {
    if (this._touchState.timer) {
      clearTimeout(this._touchState.timer);
      this._touchState.timer = null;
    }
  }
  
  _showNameTooltip() {
    this._state.showTooltip = true;
    const tooltip = this.shadowRoot.querySelector('.tooltip');
    if (tooltip) {
      tooltip.classList.add('visible');
    }
  }
  
  _hideNameTooltip() {
    this._state.showTooltip = false;
    const tooltip = this.shadowRoot.querySelector('.tooltip');
    if (tooltip) {
      tooltip.classList.remove('visible');
    }
  }
  
  render() {
    // Get colors from theme utility
    const color = TeaTheme.getColor(this._state.category, !this._state.collected);
    const circleOpacity = this._state.collected ? 1 : 0.5;
    
    const styles = `
      :host {
        display: block !important;
        --circle-size: 64px;
        width: var(--circle-size);
        height: var(--circle-size);
        pointer-events: auto !important;
        visibility: visible !important;
        opacity: 1 !important;
        contain: content;
      }
      
      .tea-circle-container {
        position: relative;
        width: 100%;
        height: 100%;
        pointer-events: auto;
      }
      
      .tea-circle {
        width: var(--circle-size);
        height: var(--circle-size);
        border-radius: 50%;
        background-color: ${color};
        opacity: 0; /* Start invisible */
        cursor: pointer;
        transform: scale(0.8);
        transition: transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275), 
                    opacity 0.5s ease, 
                    box-shadow 0.3s ease;
        margin: 0 auto;
        will-change: transform, opacity;
        -webkit-tap-highlight-color: transparent; /* Remove tap highlight on mobile */
        transform-style: preserve-3d;
        backface-visibility: hidden;
        pointer-events: auto !important;
      }
      
      .tea-circle.animate-in {
        transform: scale(1);
        opacity: ${circleOpacity};
      }
      
      .tea-circle:hover {
        transform: scale(1.05);
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
      }
      
      /* Active state when pressed */
      .tea-circle.active {
        transform: scale(0.95);
        transition: transform 0.1s ease;
      }
      
      /* Click animation */
      .tea-circle.clicked {
        animation: click-pulse 0.3s ease;
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
      
      @keyframes click-pulse {
        0% { transform: scale(0.95); }
        50% { transform: scale(1.05); box-shadow: 0 0 8px rgba(0, 0, 0, 0.15); }
        100% { transform: scale(1); }
      }
    `;
    
    this.shadowRoot.innerHTML = `
      <style>${styles}</style>
      <div class="tea-circle-container" part="container">
        <div class="tooltip ${this._state.showTooltip ? 'visible' : ''}" part="tooltip">
          ${this._state.name}
        </div>
        <div class="tea-circle" title="${this._state.name}" data-tea-id="${this._state.teaId}" part="tea-circle"></div>
      </div>
    `;
    
    // Re-attach event listeners after render
    this._addEventListeners();
    
    // Set initial animation state if needed
    if (this._state.animateIn) {
      this._triggerAnimation();
    }
  }
}

// Make sure we properly define the custom element
if (!customElements.get('tea-circle')) {
  customElements.define('tea-circle', TeaCircle);
}

export default TeaCircle;

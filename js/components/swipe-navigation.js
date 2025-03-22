// components/swipe-navigation.js
// Adds swipe navigation to the tea collection

import { teaEvents, TeaEventTypes } from '../services/event-manager.js';

class SwipeNavigation extends HTMLElement {
  constructor() {
    super();
    
    // Better structure for touch tracking
    this._touchState = {
      startX: 0,
      startY: 0,
      currentX: 0,
      currentY: 0,
      thresholdDistance: 30,
      isTracking: false
    };
    
    this._categories = ['Green', 'Black', 'Oolong', 'White', 'Pu-erh', 'Yellow'];
    this._currentCategoryIndex = 0;
    
    // Bind methods
    this._handleTouchStart = this._handleTouchStart.bind(this);
    this._handleTouchMove = this._handleTouchMove.bind(this);
    this._handleTouchEnd = this._handleTouchEnd.bind(this);
    this._handleCategoryChange = this._handleCategoryChange.bind(this);
    this._handlePillClick = this._handlePillClick.bind(this);
  }

  connectedCallback() {
    // Get the current active category
    const activePill = document.querySelector('.category-pill.active');
    if (activePill) {
      const category = activePill.dataset.category;
      this._currentCategoryIndex = this._categories.indexOf(category);
      if (this._currentCategoryIndex === -1) this._currentCategoryIndex = 0;
    }
    
    // Set up the event listeners
    this._setupEventListeners();
    
    // Register with event manager to listen for category changes
    teaEvents.on(TeaEventTypes.CATEGORY_CHANGED, this._handleCategoryChange);
  }
  
  disconnectedCallback() {
    this._removeEventListeners();
    
    // Clean up event listeners
    teaEvents.off(TeaEventTypes.CATEGORY_CHANGED, this._handleCategoryChange);
  }
  
  _setupEventListeners() {
    // Add touch event listeners to the main container
    const mainContainer = document.querySelector('main');
    if (mainContainer) {
      mainContainer.addEventListener('touchstart', this._handleTouchStart, { passive: true });
      mainContainer.addEventListener('touchmove', this._handleTouchMove, { passive: true });
      mainContainer.addEventListener('touchend', this._handleTouchEnd, { passive: true });
    }
    
    // Also listen to category pill clicks
    const categoryPills = document.querySelectorAll('.category-pill');
    categoryPills.forEach(pill => {
      pill.addEventListener('click', this._handlePillClick);
    });
  }
  
  _removeEventListeners() {
    const mainContainer = document.querySelector('main');
    if (mainContainer) {
      mainContainer.removeEventListener('touchstart', this._handleTouchStart);
      mainContainer.removeEventListener('touchmove', this._handleTouchMove);
      mainContainer.removeEventListener('touchend', this._handleTouchEnd);
    }
    
    // Remove category pill listeners
    const categoryPills = document.querySelectorAll('.category-pill');
    categoryPills.forEach(pill => {
      pill.removeEventListener('click', this._handlePillClick);
    });
  }
  
  _handleCategoryChange(event) {
    // Update our internal state when category changes
    const category = event.category;
    const newIndex = this._categories.indexOf(category);
    if (newIndex !== -1) {
      this._currentCategoryIndex = newIndex;
    }
  }
  
  _handlePillClick(event) {
    // Update our internal state when category pills are clicked
    const category = event.target.dataset.category;
    const newIndex = this._categories.indexOf(category);
    if (newIndex !== -1) {
      this._currentCategoryIndex = newIndex;
    }
  }
  
  _handleTouchStart(event) {
    if (!event.touches[0]) return;
    
    // Store initial touch position
    this._touchState.startX = event.touches[0].clientX;
    this._touchState.startY = event.touches[0].clientY;
    this._touchState.currentX = this._touchState.startX;
    this._touchState.currentY = this._touchState.startY;
    this._touchState.isTracking = true;
  }
  
  _handleTouchMove(event) {
    if (!this._touchState.isTracking || !event.touches[0]) return;
    
    // Update current touch position
    this._touchState.currentX = event.touches[0].clientX;
    this._touchState.currentY = event.touches[0].clientY;
  }
  
  _handleTouchEnd(event) {
    if (!this._touchState.isTracking) return;
    
    // Calculate deltas
    const deltaX = this._touchState.currentX - this._touchState.startX;
    const deltaY = this._touchState.currentY - this._touchState.startY;
    
    // Reset tracking state
    this._touchState.isTracking = false;
    
    // Check if horizontal swipe is dominant
    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      // Check if swipe distance meets threshold
      if (Math.abs(deltaX) >= this._touchState.thresholdDistance) {
        if (deltaX > 0) {
          // Swipe right - go to previous category
          this._navigateToPreviousCategory();
        } else {
          // Swipe left - go to next category
          this._navigateToNextCategory();
        }
      }
    }
  }
  
  _navigateToNextCategory() {
    // Move to next category, with wrap-around
    const nextIndex = (this._currentCategoryIndex + 1) % this._categories.length;
    this._navigateToCategory(nextIndex);
  }
  
  _navigateToPreviousCategory() {
    // Move to previous category, with wrap-around
    const prevIndex = (this._currentCategoryIndex - 1 + this._categories.length) % this._categories.length;
    this._navigateToCategory(prevIndex);
  }
  
  _navigateToCategory(index) {
    // Ensure index is in bounds
    if (index < 0 || index >= this._categories.length) return;
    
    // Get the category at that index
    const category = this._categories[index];
    
    // Update current index
    this._currentCategoryIndex = index;
    
    // Use event manager to emit category change
    teaEvents.emit(TeaEventTypes.CATEGORY_CHANGED, { 
      category,
      source: 'swipe'
    });
    
    // Also visually update the UI
    this._updateActivePill(category);
  }
  
  _updateActivePill(category) {
    // Find the corresponding pill
    const pill = document.querySelector(`.category-pill[data-category="${category}"]`);
    if (pill) {
      // Update active class
      document.querySelectorAll('.category-pill').forEach(p => {
        p.classList.remove('active');
      });
      pill.classList.add('active');
      
      // Also scroll the pill into view
      pill.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
  }
}

// Define custom element
customElements.define('swipe-navigation', SwipeNavigation);

export default SwipeNavigation;

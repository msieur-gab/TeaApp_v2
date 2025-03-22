// components/swipe-navigation.js
// Adds swipe navigation to the tea collection

class SwipeNavigation extends HTMLElement {
  constructor() {
    super();
    
    // Touch tracking
    this._touchStartX = 0;
    this._touchStartY = 0;
    this._currentX = 0;
    this._currentY = 0;
    this._thresholdDistance = 30; // Minimum distance to trigger swipe
    this._categories = ['Green', 'Black', 'Oolong', 'White', 'Pu-erh', 'Yellow'];
    this._currentCategoryIndex = 0;
    
    // Bind methods
    this._handleTouchStart = this._handleTouchStart.bind(this);
    this._handleTouchMove = this._handleTouchMove.bind(this);
    this._handleTouchEnd = this._handleTouchEnd.bind(this);
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
  }
  
  disconnectedCallback() {
    this._removeEventListeners();
  }
  
  _setupEventListeners() {
    // Add touch event listeners to the main container
    const mainContainer = document.querySelector('main');
    if (mainContainer) {
      mainContainer.addEventListener('touchstart', this._handleTouchStart, { passive: true });
      mainContainer.addEventListener('touchmove', this._handleTouchMove, { passive: true });
      mainContainer.addEventListener('touchend', this._handleTouchEnd, { passive: true });
    }
    
    // Listen for category changes to update our index
    document.addEventListener('category-change', this._handleCategoryChange.bind(this));
    
    // Also listen to category pill clicks
    const categoryPills = document.querySelectorAll('.category-pill');
    categoryPills.forEach(pill => {
      pill.addEventListener('click', this._handlePillClick.bind(this));
    });
  }
  
  _removeEventListeners() {
    const mainContainer = document.querySelector('main');
    if (mainContainer) {
      mainContainer.removeEventListener('touchstart', this._handleTouchStart);
      mainContainer.removeEventListener('touchmove', this._handleTouchMove);
      mainContainer.removeEventListener('touchend', this._handleTouchEnd);
    }
  }
  
  _handleCategoryChange(event) {
    // Update our internal state when category changes
    const category = event.detail.category;
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
    
    this._touchStartX = event.touches[0].clientX;
    this._touchStartY = event.touches[0].clientY;
    this._currentX = this._touchStartX;
    this._currentY = this._touchStartY;
  }
  
  _handleTouchMove(event) {
    if (!event.touches[0]) return;
    
    this._currentX = event.touches[0].clientX;
    this._currentY = event.touches[0].clientY;
  }
  
  _handleTouchEnd(event) {
    // Calculate deltas
    const deltaX = this._currentX - this._touchStartX;
    const deltaY = this._currentY - this._touchStartY;
    
    // Check if horizontal swipe is dominant
    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      // Check if swipe distance meets threshold
      if (Math.abs(deltaX) >= this._thresholdDistance) {
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
    
    // Find the corresponding pill
    const pill = document.querySelector(`.category-pill[data-category="${category}"]`);
    if (pill) {
      // Simulate click on the pill
      pill.click();
      
      // Also scroll the pill into view
      pill.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      
      // Update current index
      this._currentCategoryIndex = index;
    }
  }
}

// Define custom element
customElements.define('swipe-navigation', SwipeNavigation);

export default SwipeNavigation;

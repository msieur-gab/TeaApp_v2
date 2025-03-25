// components/swipe-navigation.js
// Enhanced swipe navigation with visual transitions between categories

import { teaEvents, TeaEventTypes } from '../services/event-manager.js';

class SwipeNavigation extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    
    // Touch tracking state
    this._touchState = {
      startX: 0,
      startY: 0,
      currentX: 0,
      currentY: 0,
      thresholdDistance: 50, // Increased for more deliberate swipes
      isTracking: false,
      swipeInProgress: false
    };
    
    // Categories and current selection
    this._categories = ['Green', 'Black', 'Oolong', 'White', 'Pu-erh', 'Yellow'];
    this._currentCategoryIndex = 0;
    
    // Animation settings
    this._animation = {
      duration: 300, // ms
      easing: 'cubic-bezier(0.25, 0.1, 0.25, 1.0)',
      inProgress: false
    };
    
    // Performance optimizations
    this._rafId = null;
    this._containerWidth = 0;
    
    // References to DOM elements
    this._mainContent = null;
    this._teaCollection = null;
    this._swipeOverlay = null;
    
    // Bind methods
    this._handleTouchStart = this._handleTouchStart.bind(this);
    this._handleTouchMove = this._handleTouchMove.bind(this);
    this._handleTouchEnd = this._handleTouchEnd.bind(this);
    this._handleCategoryChange = this._handleCategoryChange.bind(this);
    this._handleResize = this._handleResize.bind(this);
    this._updateSwipePosition = this._updateSwipePosition.bind(this);
  }

  connectedCallback() {
    this.render();
    
    // Get references to main elements
    this._mainContent = document.querySelector('main');
    this._teaCollection = document.querySelector('tea-collection');
    this._swipeOverlay = this.shadowRoot.querySelector('.swipe-overlay');
    
    // Find the current category
    const activePill = document.querySelector('.category-pill.active');
    if (activePill) {
      const category = activePill.dataset.category;
      this._currentCategoryIndex = this._categories.indexOf(category);
      if (this._currentCategoryIndex === -1) this._currentCategoryIndex = 0;
    }
    
    // Set up event listeners
    this._setupEventListeners();
    
    // Initial size calculation
    this._updateContainerSize();
    
    // Listen for category changes
    teaEvents.on(TeaEventTypes.CATEGORY_CHANGED, this._handleCategoryChange);
    
    // Listen for window resize
    window.addEventListener('resize', this._handleResize);
    
    console.log(`SwipeNavigation initialized with category index: ${this._currentCategoryIndex}`);
  }
  
  disconnectedCallback() {
    this._removeEventListeners();
    
    // Clean up event listeners
    teaEvents.off(TeaEventTypes.CATEGORY_CHANGED, this._handleCategoryChange);
    window.removeEventListener('resize', this._handleResize);
    
    // Cancel any pending animation frame
    if (this._rafId) {
      cancelAnimationFrame(this._rafId);
      this._rafId = null;
    }
  }
  
  render() {
    const styles = `
      :host {
        display: block;
        width: 100%;
        height: 100%;
      }
      
      .swipe-overlay {
        position: fixed;
        top: 60px; /* Below the header */
        left: 0;
        right: 0;
        bottom: 0;
        pointer-events: none;
        z-index: 90; /* Above content but below tea-detail and modals */
        display: flex;
        overflow: hidden;
      }
      
      /* Direction indicators removed */
      
      /* Swipe hint removed */
    `;
    
    this.shadowRoot.innerHTML = `
      <style>${styles}</style>
      <div class="swipe-overlay">
        <!-- This is where the visual transitions happen -->
      </div>
      <!-- Swipe hint removed -->
      <!-- Direction indicators removed -->
    `;
  }
  
  _setupEventListeners() {
    // Add touch event listeners to the main container for better capture
    if (this._mainContent) {
      this._mainContent.addEventListener('touchstart', this._handleTouchStart, { passive: true });
      this._mainContent.addEventListener('touchmove', this._handleTouchMove, { passive: false });
      this._mainContent.addEventListener('touchend', this._handleTouchEnd, { passive: true });
    } else {
      console.warn('SwipeNavigation: main container not found');
    }
  }
  
  _removeEventListeners() {
    if (this._mainContent) {
      this._mainContent.removeEventListener('touchstart', this._handleTouchStart);
      this._mainContent.removeEventListener('touchmove', this._handleTouchMove);
      this._mainContent.removeEventListener('touchend', this._handleTouchEnd);
    }
  }
  
  _handleResize() {
    this._updateContainerSize();
  }
  
  _updateContainerSize() {
    // Get container width for calculations
    this._containerWidth = window.innerWidth;
  }
  
  _handleCategoryChange(event) {
    // Prevent handling events that originated from this component to avoid loops
    if (event.source === 'swipe-navigation') {
      return;
    }
    
    console.log(`Enhanced SwipeNavigation received category change: ${event.category} from source: ${event.source}`);
    
    // Update our internal state when category changes from elsewhere
    const category = event.category;
    const newIndex = this._categories.indexOf(category);
    if (newIndex !== -1) {
      // Only animate if we're not already at this index
      if (this._currentCategoryIndex !== newIndex) {
        const direction = newIndex > this._currentCategoryIndex ? 'left' : 'right';
        this._animateToCategory(newIndex, direction);
      }
    }
  }
  
  _handleTouchStart(event) {
    // Don't handle touch if animation is in progress
    if (this._animation.inProgress) return;
    
    // Don't start swipe if a modal is open
    const modalOpen = document.querySelector('.modal.visible') || 
                      document.querySelector('tea-detail[style*="display: block"]') ||
                      document.querySelector('progress-modal[style*="display: flex"]');
    if (modalOpen) return;
    
    if (!event.touches[0]) return;
    
    // Store initial touch position
    const touch = event.touches[0];
    this._touchState.startX = touch.clientX;
    this._touchState.startY = touch.clientY;
    this._touchState.currentX = this._touchState.startX;
    this._touchState.currentY = this._touchState.startY;
    this._touchState.isTracking = true;
    this._touchState.swipeInProgress = false;
    
    // Swipe hint removed
  }
  
  _handleTouchMove(event) {
    if (!this._touchState.isTracking || !event.touches[0]) return;
    
    // Update current touch position
    const touch = event.touches[0];
    this._touchState.currentX = touch.clientX;
    this._touchState.currentY = touch.clientY;
    
    // Calculate deltas
    const deltaX = this._touchState.currentX - this._touchState.startX;
    const deltaY = this._touchState.currentY - this._touchState.startY;
    
    // Check if horizontal swipe is dominant and exceeds minimum threshold
    if (Math.abs(deltaX) > 10 && Math.abs(deltaX) > Math.abs(deltaY) * 1.5) {
      // Horizontal swipe detected
      this._touchState.swipeInProgress = true;
      
      // Direction indicators removed
      
      // Use requestAnimationFrame for smooth visual updates
      if (this._rafId) cancelAnimationFrame(this._rafId);
      this._rafId = requestAnimationFrame(() => this._updateSwipePosition(deltaX));
      
      // Prevent vertical scrolling if we've determined this is a horizontal swipe
      if (Math.abs(deltaX) > 30) {
        event.preventDefault();
      }
    }
  }
  
  _handleTouchEnd(event) {
    if (!this._touchState.isTracking) return;
    
    // Reset tracking state
    this._touchState.isTracking = false;
    
    // Direction indicators removed
    
    // Check if we were tracking a swipe
    if (this._touchState.swipeInProgress) {
      // Calculate the swipe distance
      const deltaX = this._touchState.currentX - this._touchState.startX;
      
      // Determine if swipe was sufficient for category change
      if (Math.abs(deltaX) >= this._touchState.thresholdDistance) {
        // Swipe was strong enough to change category
        if (deltaX > 0) {
          // Swipe right - go to previous category
          this._navigateToPreviousCategory();
        } else {
          // Swipe left - go to next category
          this._navigateToNextCategory();
        }
      } else {
        // Not enough to change category, snap back
        this._snapBackToCurrentCategory();
      }
      
      this._touchState.swipeInProgress = false;
    }
  }
  
  _updateSwipePosition(deltaX) {
    // Calculate how far we've swiped as a percentage of screen width
    const maxSwipePercent = 25; // Limit how far content shifts
    const percentMoved = Math.min(maxSwipePercent, (Math.abs(deltaX) / this._containerWidth) * 100);
    
    // Apply the transform to create a drag effect
    if (this._teaCollection) {
      const direction = deltaX < 0 ? -1 : 1;
      const transform = `translateX(${direction * percentMoved}%)`;
      
      // Apply transform with hardware acceleration
      this._teaCollection.style.transition = 'none';
      this._teaCollection.style.transform = transform;
      this._teaCollection.style.webkitTransform = transform;
    }
    
    this._rafId = null;
  }
  
  // Direction indicator methods removed
  
  _snapBackToCurrentCategory() {
    // Animate back to current position
    if (this._teaCollection) {
      this._teaCollection.style.transition = `transform ${this._animation.duration}ms ${this._animation.easing}`;
      this._teaCollection.style.transform = 'translateX(0)';
      this._teaCollection.style.webkitTransform = 'translateX(0)';
    }
  }
  
  _navigateToNextCategory() {
    console.log('SwipeNavigation: navigate to next category');
    // Move to next category, with wrap-around
    const nextIndex = (this._currentCategoryIndex + 1) % this._categories.length;
    this._animateToCategory(nextIndex, 'left');
  }
  
  _navigateToPreviousCategory() {
    console.log('SwipeNavigation: navigate to previous category');
    // Move to previous category, with wrap-around
    const prevIndex = (this._currentCategoryIndex - 1 + this._categories.length) % this._categories.length;
    this._animateToCategory(prevIndex, 'right');
  }
  
  _animateToCategory(index, direction) {
    // Ensure index is in bounds
    if (index < 0 || index >= this._categories.length) return;
    
    // Get the category at that index
    const category = this._categories[index];
    
    // Prevent starting new animation if one is in progress
    if (this._animation.inProgress) return;
    this._animation.inProgress = true;
    
    // Set initial position if there's a tea collection element
    if (this._teaCollection) {
      // Direction determines the starting position for the next collection
      const startPosition = direction === 'left' ? 100 : -100;
      
      // Create a clone of the collection for animation
      const currentCollection = this._teaCollection;
      
      // Temporarily disable transitions on the current collection
      currentCollection.style.transition = 'none';
      
      // Create a new collection for the next category
      const nextCollection = document.createElement('tea-collection');
      nextCollection.category = category;
      nextCollection.style.position = 'absolute';
      nextCollection.style.top = '0';
      nextCollection.style.left = '0';
      nextCollection.style.width = '100%';
      nextCollection.style.height = '100%';
      nextCollection.style.transform = `translateX(${startPosition}%)`;
      nextCollection.style.webkitTransform = `translateX(${startPosition}%)`;
      nextCollection.style.transition = 'none';
      nextCollection.style.zIndex = '1';
      nextCollection.style.backgroundColor = 'inherit'; /* Inherit background to prevent gaps */
      
      // Add the new collection to the main content
      if (this._mainContent) {
        this._mainContent.appendChild(nextCollection);
        
        // Force layout recalculation before animation
        void nextCollection.offsetWidth;
        
        // Now animate both collections
        requestAnimationFrame(() => {
          // Animate current collection out
          currentCollection.style.transition = `transform ${this._animation.duration}ms ${this._animation.easing}`;
          currentCollection.style.transform = `translateX(${direction === 'left' ? -100 : 100}%)`;
          currentCollection.style.webkitTransform = `translateX(${direction === 'left' ? -100 : 100}%)`;
          
          // Animate new collection in
          nextCollection.style.transition = `transform ${this._animation.duration}ms ${this._animation.easing}`;
          nextCollection.style.transform = 'translateX(0)';
          nextCollection.style.webkitTransform = 'translateX(0)';
          
          // After animation completes
          setTimeout(() => {
            // Update the state to the new category
            this._currentCategoryIndex = index;
            
            // Clean up by removing the old collection
            currentCollection.remove();
            
            // Reset position of the new collection
            nextCollection.style.position = '';
            nextCollection.style.zIndex = '';
            
            // Reset animation flag
            this._animation.inProgress = false;
            
            // Update our reference to the current collection
            this._teaCollection = nextCollection;
            
            // Reset for smooth interactions after animation
            setTimeout(() => {
              nextCollection.style.transition = '';
            }, 50);
            
            // Update category pills
            this._updateActivePill(category);
            
            // Emit category change event
            this._emitCategoryChanged(category);
          }, this._animation.duration + 50);
        });
      }
    } else {
      // Fallback if no tea collection is found
      this._currentCategoryIndex = index;
      this._updateActivePill(category);
      this._emitCategoryChanged(category);
      this._animation.inProgress = false;
    }
  }
  
  _updateActivePill(category) {
    // Find and update the active pill
    const pills = document.querySelectorAll('.category-pill');
    pills.forEach(pill => {
      if (pill.dataset.category === category) {
        pill.classList.add('active');
        // Scroll pill into view
        pill.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      } else {
        pill.classList.remove('active');
      }
    });
  }
  
  _emitCategoryChanged(category) {
    // Use event manager to emit category change with source='swipe-navigation'
    teaEvents.emit(TeaEventTypes.CATEGORY_CHANGED, { 
      category,
      source: 'swipe-navigation'
    });
  }
}

// Register the custom element
customElements.define('swipe-navigation', SwipeNavigation);

export default SwipeNavigation;
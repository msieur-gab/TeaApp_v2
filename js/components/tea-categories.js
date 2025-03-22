// components/tea-categories.js
// Tea category selector component with improved theming and events

import { teaEvents, TeaEventTypes } from '../services/event-manager.js';
import TeaTheme from '../utils/tea-theme.js';

class TeaCategories extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    
    // State
    this._categories = [];
    this._activeCategory = null;
  }
  
  // Lifecycle callbacks
  connectedCallback() {
    // Set default categories if none provided
    if (!this._categories.length) {
      this._categories = ['Green', 'Black', 'Oolong', 'White', 'Pu-erh', 'Yellow'];
    }
    
    // Get initial active category from attribute or default to first category
    this._activeCategory = this.getAttribute('active') || this._categories[0];
    
    this.render();
    
    // Listen for category changes from other components
    teaEvents.on(TeaEventTypes.CATEGORY_CHANGED, this._handleExternalCategoryChange.bind(this));
  }
  
  disconnectedCallback() {
    // Clean up event listeners
    teaEvents.off(TeaEventTypes.CATEGORY_CHANGED, this._handleExternalCategoryChange);
  }
  
  static get observedAttributes() {
    return ['active', 'categories'];
  }
  
  attributeChangedCallback(name, oldValue, newValue) {
    if (oldValue === newValue) return;
    
    if (name === 'active') {
      this._activeCategory = newValue;
      this._updateActiveCategory();
    } else if (name === 'categories') {
      try {
        this._categories = JSON.parse(newValue);
        this.render();
      } catch (e) {
        console.error('Invalid categories JSON:', e);
      }
    }
  }
  
  // Getters and setters
  get categories() {
    return this._categories;
  }
  
  set categories(value) {
    if (Array.isArray(value)) {
      this._categories = value;
      this.render();
    }
  }
  
  get activeCategory() {
    return this._activeCategory;
  }
  
  set activeCategory(value) {
    if (this._activeCategory !== value) {
      this._activeCategory = value;
      
      // Update attribute to keep it in sync
      this.setAttribute('active', value);
      
      // Update visual state
      this._updateActiveCategory();
      
      // Use event manager instead of custom event
      teaEvents.emit(TeaEventTypes.CATEGORY_CHANGED, { 
        category: value,
        source: 'tea-categories'
      });
    }
  }
  
  // Event handlers
  handleCategoryClick(category) {
    this.activeCategory = category;
  }
  
  _handleExternalCategoryChange(event) {
    // Only update if change came from elsewhere (to prevent loops)
    if (event.source !== 'tea-categories') {
      this._activeCategory = event.category;
      this._updateActiveCategory();
    }
  }
  
  _updateActiveCategory() {
    if (!this.shadowRoot) return;
    
    const categoryButtons = this.shadowRoot.querySelectorAll('.category-button');
    categoryButtons.forEach(button => {
      button.classList.remove('active');
      
      // Reset styles
      button.style.backgroundColor = '';
      button.style.color = '';
      
      if (button.dataset.category === this._activeCategory) {
        button.classList.add('active');
        
        // Apply theme color using the theme utility
        TeaTheme.applyTheme(button, this._activeCategory, { useBackground: true });
      }
    });
  }
  
  // Render the component
  render() {
    const styles = `
      :host {
        display: block;
        margin: 0.5rem 0;
        overflow-x: auto;
        -webkit-overflow-scrolling: touch; /* For momentum scrolling on iOS */
        scrollbar-width: none; /* Hide scrollbar for Firefox */
      }
      
      :host::-webkit-scrollbar {
        display: none; /* Hide scrollbar for Chrome/Safari */
      }
      
      .categories-container {
        display: flex;
        padding: 0.5rem 1rem;
        gap: 0.5rem;
        white-space: nowrap;
        justify-content: center;
      }
      
      .category-button {
        padding: 0.5rem 1rem;
        border-radius: 1rem;
        background-color: #f0f0f0;
        color: #333;
        border: none;
        cursor: pointer;
        font-size: 0.9rem;
        transition: all 0.2s ease;
        text-align: center;
        min-height: 36px;
      }
      
      /* Style buttons based on tea type using CSS variables */
      .category-button[data-category="Green"] {
        --active-bg: var(--tea-green-color, #7B9070);
        --active-text: #fff;
      }
      
      .category-button[data-category="Black"] {
        --active-bg: var(--tea-black-color, #A56256);
        --active-text: #fff;
      }
      
      .category-button[data-category="Oolong"] {
        --active-bg: var(--tea-oolong-color, #C09565);
        --active-text: #fff;
      }
      
      .category-button[data-category="White"] {
        --active-bg: var(--tea-white-color, #D8DCD5);
        --active-text: #333;
      }
      
      .category-button[data-category="Pu-erh"] {
        --active-bg: var(--tea-pu-erh-color, #6F5244);
        --active-text: #fff;
      }
      
      .category-button[data-category="Yellow"] {
        --active-bg: var(--tea-yellow-color, #D1CDA6);
        --active-text: #333;
      }
      
      .category-button:hover {
        background-color: #e0e0e0;
        transform: translateY(-1px);
      }
      
      .category-button.active {
        background-color: var(--active-bg);
        color: var(--active-text);
        font-weight: 500;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      }
      
      @media (max-width: 480px) {
        .categories-container {
          justify-content: flex-start;
        }
        
        .category-button {
          padding: 0.4rem 0.8rem;
          font-size: 0.85rem;
        }
      }
    `;
    
    // Create categories HTML
    let categoriesHTML = '';
    if (this._categories && this._categories.length) {
      this._categories.forEach(category => {
        const categoryName = typeof category === 'string' ? category : category.name;
        categoriesHTML += `
          <button 
            class="category-button ${categoryName === this._activeCategory ? 'active' : ''}" 
            data-category="${categoryName}"
          >
            ${categoryName}
          </button>
        `;
      });
    } else {
      // Default categories if none provided
      ['Green', 'Black', 'Oolong', 'White', 'Pu-erh', 'Yellow'].forEach(category => {
        categoriesHTML += `
          <button 
            class="category-button ${category === this._activeCategory ? 'active' : ''}" 
            data-category="${category}"
          >
            ${category}
          </button>
        `;
      });
    }
    
    // Render template
    this.shadowRoot.innerHTML = `
      <style>${styles}</style>
      <div class="categories-container">
        ${categoriesHTML}
      </div>
    `;
    
    // Add event listeners
    const categoryButtons = this.shadowRoot.querySelectorAll('.category-button');
    categoryButtons.forEach(button => {
      button.addEventListener('click', () => {
        this.handleCategoryClick(button.dataset.category);
      });
    });
    
    // Apply active styles
    this._updateActiveCategory();
  }
}

// Define the custom element
customElements.define('tea-categories', TeaCategories);

export default TeaCategories;

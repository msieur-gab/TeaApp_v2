// tea-categories.js - Tea category selector component
class TeaCategories extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    
    // Internal state
    this._categories = [];
    this._activeCategory = null;
    
    // Custom event
    this.categoryChangedEvent = new CustomEvent('category-changed', {
      bubbles: true,
      composed: true,
      detail: { category: null }
    });
  }
  
  // Lifecycle callbacks
  connectedCallback() {
    this.render();
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
      
      // Update highlights after rendering
      this._updateActiveCategory();
      
      // Update event detail
      this.categoryChangedEvent.detail.category = value;
    }
  }
  
  // Event handlers
  handleCategoryClick(category) {
    this.activeCategory = category;
    
    // Dispatch the event
    this.dispatchEvent(this.categoryChangedEvent);
  }
  
  // Update active category highlighting
  _updateActiveCategory() {
    if (!this.shadowRoot) return;
    
    // Remove active class from all categories
    const categoryButtons = this.shadowRoot.querySelectorAll('.category-button');
    categoryButtons.forEach(button => {
      button.classList.remove('active');
      
      // Match the active category
      if (button.dataset.category === this._activeCategory) {
        button.classList.add('active');
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
      }
      
      /* Style buttons based on tea type */
      .category-button[data-category="Green"] {
        --active-bg: #7B9070;
        --active-text: #fff;
      }
      
      .category-button[data-category="Black"] {
        --active-bg: #A56256;
        --active-text: #fff;
      }
      
      .category-button[data-category="Oolong"] {
        --active-bg: #C09565;
        --active-text: #fff;
      }
      
      .category-button[data-category="White"] {
        --active-bg: #D8DCD5;
        --active-text: #333;
      }
      
      .category-button[data-category="Pu-erh"] {
        --active-bg: #6F5244;
        --active-text: #fff;
      }
      
      .category-button[data-category="Yellow"] {
        --active-bg: #D1CDA6;
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
  }
}

// Define the custom element
customElements.define('tea-categories', TeaCategories);

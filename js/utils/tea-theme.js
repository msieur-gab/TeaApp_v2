import ColorUtility from './color-utility.js';
import { TeaThemeGenerator, TeaColorPalette } from './theme-generator.js';

/**
 * Tea Theme Utility
 * Enhanced with ColorUtility and TeaThemeGenerator
 */
const TeaTheme = {
  /**
   * Get color for a specific tea category
   * @param {string} category - Tea category name
   * @param {boolean} useLight - Whether to use the light variant
   * @returns {string} Color hex code
   */
  getColor(category, useLight = false) {
    const baseColor = TeaColorPalette[category] || TeaColorPalette['Green'];
    
    if (useLight) {
      return ColorUtility.lightenColor(baseColor, 30);
    }
    
    return baseColor;
  },
  
  /**
   * Set up CSS variables for all tea categories
   * @param {HTMLElement} element - Target element (defaults to document.documentElement)
   */
  setupVariables(element = document.documentElement) {
    // Set base tea colors
    Object.entries(TeaColorPalette).forEach(([category, color]) => {
      element.style.setProperty(`--tea-${category.toLowerCase()}-color`, color);
      
      // Also set light variants
      const lightVariant = ColorUtility.lightenColor(color, 30);
      element.style.setProperty(`--tea-${category.toLowerCase()}-light`, lightVariant);
      
      // And dark variants
      const darkVariant = ColorUtility.darkenColor(color, 15);
      element.style.setProperty(`--tea-${category.toLowerCase()}-dark`, darkVariant);
    });
    
    // Set default color
    element.style.setProperty('--tea-default-color', TeaColorPalette['Green']);
  },
  
  /**
   * Apply theme to an element
   * @param {HTMLElement} element - Target element
   * @param {string} category - Tea category name
   * @param {Object} options - Styling options
   */
  applyTheme(element, category, options = {}) {
    if (!element || !category) return;
    
    const {
      useBackground = false,
      useBorder = false,
      useText = true,
      useLight = false
    } = options;
    
    const color = this.getColor(category, useLight);
    const textColor = ColorUtility.getOptimalTextColor(color);
    
    if (useBackground) {
      element.style.backgroundColor = color;
      
      // If background is set and text should be styled, use optimal contrast
      if (useText) {
        element.style.color = textColor;
      }
    } else if (useText) {
      element.style.color = color;
    }
    
    if (useBorder) {
      element.style.borderColor = color;
    }
    
    // Add a data attribute for easier CSS targeting
    element.setAttribute('data-tea-category', category.toLowerCase());
  },
  
  /**
   * Create global CSS for tea themes
   * @returns {HTMLStyleElement} Style element with theme CSS
   */
  createGlobalStyles() {
    const style = document.createElement('style');
    style.id = 'tea-theme-global-styles';
    
    let css = '';
    
    // Create styles for each tea category
    Object.entries(TeaColorPalette).forEach(([category, color]) => {
      const textColor = ColorUtility.getOptimalTextColor(color);
      const categoryLower = category.toLowerCase();
      
      css += `
        .tea-theme-${categoryLower} {
          --primary-color: ${color};
          --text-on-primary: ${textColor};
          --light-variant: ${ColorUtility.lightenColor(color, 30)};
          --dark-variant: ${ColorUtility.darkenColor(color, 15)};
        }
        
        .category-pill[data-category="${category}"].active {
          background-color: ${color};
          color: ${textColor};
        }
      `;
    });
    
    style.textContent = css;
    return style;
  },
  
  /**
   * Apply full theme based on tea category
   * @param {string} category - Tea category name
   */
  setTheme(category) {
    // Use the TeaThemeGenerator to apply the theme
    TeaThemeGenerator.applyTheme(category);
  },
  
  /**
   * Initialize the theme system
   */
  init() {
    // Set up basic variables
    this.setupVariables();
    
    // Add global styles
    const globalStyles = this.createGlobalStyles();
    document.head.appendChild(globalStyles);
    
    // Set initial theme (default to Green)
    this.setTheme('Green');
    
    // Listen for category changes
    document.addEventListener('tea-theme-changed', (event) => {
      console.log('Theme changed:', event.detail.category);
    });
  }
};

export default TeaTheme;
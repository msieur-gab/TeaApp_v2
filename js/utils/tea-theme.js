// js/utils/tea-theme.js
// Utilities for managing tea category colors and theming

/**
 * Tea category color definitions
 */
const TeaColors = {
  // Primary category colors
  GREEN: '#7B9070',
  BLACK: '#A56256',
  OOLONG: '#C09565',
  WHITE: '#D8DCD5',
  PUERH: '#6F5244',
  YELLOW: '#D1CDA6',
  
  // Lighter variants (for backgrounds, etc.)
  GREEN_LIGHT: '#C1D7B8',
  BLACK_LIGHT: '#E5B5AD',
  OOLONG_LIGHT: '#E8D7BC',
  WHITE_LIGHT: '#F0F2EF',
  PUERH_LIGHT: '#BDA99E',
  YELLOW_LIGHT: '#EEECD9',
  
  // Default fallback
  DEFAULT: '#4a90e2'
};

/**
 * Get the color for a specific tea category
 * @param {string} category - The tea category name
 * @param {boolean} lightVariant - Whether to use the light variant
 * @returns {string} The color hex code
 */
function getTeaCategoryColor(category, lightVariant = false) {
  if (!category) return TeaColors.DEFAULT;
  
  // Normalize category name for lookup
  const normalizedCategory = category.toUpperCase().replace('-', '');
  
  // Use PUERH for PU-ERH or PUERH
  const categoryKey = normalizedCategory === 'PU-ERH' ? 'PUERH' : normalizedCategory;
  
  // Get appropriate color based on light variant preference
  const colorKey = lightVariant ? `${categoryKey}_LIGHT` : categoryKey;
  
  return TeaColors[colorKey] || TeaColors.DEFAULT;
}

/**
 * Set up CSS variables for tea categories on a specified element or :root
 * @param {HTMLElement} element - The element to set variables on (defaults to document.documentElement)
 */
function setupTeaCategoryVariables(element = document.documentElement) {
  // Set base colors
  element.style.setProperty('--tea-green-color', TeaColors.GREEN);
  element.style.setProperty('--tea-black-color', TeaColors.BLACK);
  element.style.setProperty('--tea-oolong-color', TeaColors.OOLONG);
  element.style.setProperty('--tea-white-color', TeaColors.WHITE);
  element.style.setProperty('--tea-pu-erh-color', TeaColors.PUERH);
  element.style.setProperty('--tea-yellow-color', TeaColors.YELLOW);
  
  // Set light variants
  element.style.setProperty('--tea-green-light', TeaColors.GREEN_LIGHT);
  element.style.setProperty('--tea-black-light', TeaColors.BLACK_LIGHT);
  element.style.setProperty('--tea-oolong-light', TeaColors.OOLONG_LIGHT);
  element.style.setProperty('--tea-white-light', TeaColors.WHITE_LIGHT);
  element.style.setProperty('--tea-pu-erh-light', TeaColors.PUERH_LIGHT);
  element.style.setProperty('--tea-yellow-light', TeaColors.YELLOW_LIGHT);
  
  // Default fallback
  element.style.setProperty('--tea-default-color', TeaColors.DEFAULT);
}

/**
 * Apply a category theme to an element
 * @param {HTMLElement} element - The element to apply theme to
 * @param {string} category - The tea category name
 * @param {Object} options - Options for theme application
 * @param {boolean} options.useBackground - Whether to set background color (defaults to false)
 * @param {boolean} options.useBorder - Whether to set border color (defaults to false)
 * @param {boolean} options.useText - Whether to set text color (defaults to true)
 * @param {boolean} options.useLight - Whether to use light variant (defaults to false)
 */
function applyTeaCategoryTheme(element, category, options = {}) {
  if (!element || !category) return;
  
  const {
    useBackground = false,
    useBorder = false,
    useText = true,
    useLight = false
  } = options;
  
  const color = getTeaCategoryColor(category, useLight);
  
  if (useBackground) {
    element.style.backgroundColor = color;
    
    // If background is set, ensure text has appropriate contrast
    if (useText) {
      // Use white text for dark backgrounds, black for light ones
      const isLightVariant = useLight || category.toUpperCase() === 'WHITE' || category.toUpperCase() === 'YELLOW';
      element.style.color = isLightVariant ? '#333333' : '#ffffff';
    }
  } else if (useText) {
    element.style.color = color;
  }
  
  if (useBorder) {
    element.style.borderColor = color;
  }
  
  // Add data attribute for CSS targeting
  element.setAttribute('data-tea-category', category.toLowerCase());
}

// Initialize CSS variables when this module is imported
setupTeaCategoryVariables();

export {
  TeaColors,
  getTeaCategoryColor,
  setupTeaCategoryVariables,
  applyTeaCategoryTheme
};

export default {
  colors: TeaColors,
  getColor: getTeaCategoryColor,
  setupVariables: setupTeaCategoryVariables,
  applyTheme: applyTeaCategoryTheme
};

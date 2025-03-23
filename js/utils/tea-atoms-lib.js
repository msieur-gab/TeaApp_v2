import ColorUtility from './color-utility.js';
import { TeaThemeGenerator } from './theme-generator.js';

/**
 * TeaAtoms - A refined atomic component library for the Tea App
 * Provides components that work directly on background colors without wrappers
 */
class TeaAtoms {
  /**
   * Create a badge component for displaying categories or tags
   * @param {string} text - Badge text content
   * @param {string} [category] - Optional tea category to derive color from
   * @param {Object} [options] - Additional options
   * @returns {HTMLElement} Styled badge element
   */
  static createBadge(text, category = null, options = {}) {
    const {
      size = 'medium',
      outline = false,
      color = null,
      parentBackground = null,
    } = options;
    
    const badge = document.createElement('span');
    badge.className = 'tea-badge';
    badge.textContent = text;
    
    // Determine badge color
    let baseColor = color;
    if (!baseColor && category) {
      baseColor = TeaThemeGenerator.getTeaColor(category);
    }
    if (!baseColor) {
      // Use current theme color if no specific color provided
      baseColor = getComputedStyle(document.documentElement)
        .getPropertyValue('--tea-primary-color').trim();
    }
    
    // Get background color to ensure contrast
    const bgColor = parentBackground || 
      getComputedStyle(document.documentElement)
        .getPropertyValue('--tea-surface-color').trim() || '#FFFFFF';
    
    // Determine if we need dark or light version for contrast
    const isBgDark = ColorUtility.getOptimalTextColor(bgColor) === '#FFFFFF';
    const needsLighterBadge = isBgDark && !outline;
    
    // Adjust badge color based on background
    let adjustedColor = baseColor;
    if (needsLighterBadge) {
      adjustedColor = ColorUtility.lightenColor(baseColor, 15);
    }
    
    // Get optimal text color based on background
    const textColor = outline
      ? baseColor
      : ColorUtility.getOptimalTextColor(adjustedColor);
    
    // Size adjustments
    const sizeMap = {
      small: { padding: '2px 6px', fontSize: '0.7rem' },
      medium: { padding: '3px 8px', fontSize: '0.8rem' },
      large: { padding: '4px 10px', fontSize: '0.9rem' }
    };
    const sizeStyle = sizeMap[size] || sizeMap.medium;
    
    // Apply styles
    badge.style.cssText = `
      display: inline-block;
      padding: ${sizeStyle.padding};
      border-radius: 12px;
      ${outline 
        ? `background-color: transparent; border: 1px solid ${baseColor};` 
        : `background-color: ${adjustedColor};`}
      color: ${textColor};
      font-size: ${sizeStyle.fontSize};
      font-weight: 500;
      margin-right: 5px;
      margin-bottom: 5px;
      line-height: 1.2;
      transition: all 0.2s ease;
    `;
    
    return badge;
  }
  
  /**
   * Create a chip component for interactive tags
   * @param {string} text - Chip text
   * @param {object} options - Chip options
   * @returns {HTMLElement} Styled chip element
   */
  static createChip(text, options = {}) {
    const {
      closable = false,
      active = false,
      onClick = null,
      onClose = null,
      parentBackground = null,
      category = null
    } = options;
    
    const chip = document.createElement('div');
    chip.className = 'tea-chip';
    
    // Create text span
    const textSpan = document.createElement('span');
    textSpan.textContent = text;
    chip.appendChild(textSpan);
    
    // Get base color
    let baseColor;
    if (category) {
      baseColor = TeaThemeGenerator.getTeaColor(category);
    } else {
      baseColor = getComputedStyle(document.documentElement)
        .getPropertyValue('--tea-primary-color').trim();
    }
    
    // Get parent background color to ensure contrast
    const bgColor = parentBackground || 
      getComputedStyle(document.documentElement)
        .getPropertyValue('--tea-surface-color').trim() || '#FFFFFF';
    
    // Generate contrast-aware colors
    const isBgDark = ColorUtility.getOptimalTextColor(bgColor) === '#FFFFFF';
    
    // Determine chip colors based on state and background
    let chipBgColor, chipTextColor;
    
    if (active) {
      // Active state always uses the primary color
      chipBgColor = baseColor;
      chipTextColor = ColorUtility.getOptimalTextColor(baseColor);
    } else {
      // Inactive state uses a color with good contrast against parent
      if (isBgDark) {
        // Dark parent, use lighter chip
        chipBgColor = ColorUtility.lightenColor(baseColor, 30);
        chipTextColor = ColorUtility.getOptimalTextColor(chipBgColor);
      } else {
        // Light parent, use darker chip
        const alphaColor = ColorUtility.lightenColor(baseColor, 40);
        chipBgColor = alphaColor;
        chipTextColor = ColorUtility.darkenColor(baseColor, 20);
      }
    }
    
    // Add close button if closable
    if (closable) {
      const closeBtn = document.createElement('button');
      closeBtn.className = 'tea-chip-close';
      closeBtn.innerHTML = '×';
      closeBtn.setAttribute('aria-label', 'Remove');
      
      closeBtn.style.cssText = `
        background: none;
        border: none;
        font-size: 1.2rem;
        line-height: 1;
        padding: 0 4px;
        cursor: pointer;
        margin-left: 4px;
        color: ${chipTextColor};
        opacity: 0.7;
      `;
      
      closeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (onClose) onClose(text);
      });
      
      chip.appendChild(closeBtn);
    }
    
    // Apply styles
    chip.style.cssText = `
      display: inline-flex;
      align-items: center;
      padding: 6px 12px;
      margin: 4px;
      border-radius: 16px;
      background-color: ${chipBgColor};
      color: ${chipTextColor};
      font-size: 0.9rem;
      cursor: pointer;
      transition: all 0.2s ease;
      user-select: none;
      border: ${active ? 'none' : `1px solid ${ColorUtility.darkenColor(chipBgColor, 10)}`};
    `;
    
    // Add hover effect
    chip.addEventListener('mouseenter', () => {
      chip.style.boxShadow = `0 2px 4px rgba(0,0,0,0.1)`;
      chip.style.transform = 'translateY(-1px)';
    });
    
    chip.addEventListener('mouseleave', () => {
      chip.style.boxShadow = 'none';
      chip.style.transform = 'translateY(0)';
    });
    
    // Add click handler
    if (onClick) {
      chip.addEventListener('click', () => onClick(text));
    }
    
    return chip;
  }
  
  /**
   * Create a button component
   * @param {string} text - Button text
   * @param {Object} options - Button options
   * @returns {HTMLButtonElement} Styled button element
   */
  static createButton(text, options = {}) {
    const {
      variant = 'primary', // primary, secondary, text, outline
      size = 'medium',
      icon = null,
      iconPosition = 'left',
      onClick = null,
      disabled = false,
      parentBackground = null,
      category = null,
      fullWidth = false
    } = options;
    
    const button = document.createElement('button');
    button.className = `tea-button tea-button-${variant}`;
    button.type = 'button';
    button.disabled = disabled;
    
    // Container for proper alignment
    const contentContainer = document.createElement('span');
    contentContainer.className = 'tea-button-content';
    contentContainer.style.cssText = `
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
    `;
    
    // Get base color
    let baseColor;
    if (category) {
      baseColor = TeaThemeGenerator.getTeaColor(category);
    } else {
      baseColor = getComputedStyle(document.documentElement)
        .getPropertyValue('--tea-primary-color').trim();
    }
    
    // Get parent background color to ensure contrast
    const bgColor = parentBackground || 
      getComputedStyle(document.documentElement)
        .getPropertyValue('--tea-surface-color').trim() || '#FFFFFF';
    
    // Determine text color
    const textOnPrimary = ColorUtility.getOptimalTextColor(baseColor);
    
    // Add icon if provided
    if (icon) {
      const iconEl = document.createElement('span');
      iconEl.className = 'tea-button-icon';
      iconEl.innerHTML = icon;
      
      if (iconPosition === 'left') {
        contentContainer.appendChild(iconEl);
        contentContainer.appendChild(document.createTextNode(text));
      } else {
        contentContainer.appendChild(document.createTextNode(text));
        contentContainer.appendChild(iconEl);
      }
    } else {
      contentContainer.textContent = text;
    }
    
    button.appendChild(contentContainer);
    
    // Size styles
    const sizeStyles = {
      small: { padding: '6px 12px', fontSize: '0.85rem' },
      medium: { padding: '8px 16px', fontSize: '0.95rem' },
      large: { padding: '10px 20px', fontSize: '1.05rem' }
    };
    
    const { padding, fontSize } = sizeStyles[size] || sizeStyles.medium;
    
    // Variant styles
    let variantStyle;
    
    switch(variant) {
      case 'primary':
        variantStyle = `
          background-color: ${baseColor};
          color: ${textOnPrimary};
          border: none;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        `;
        break;
        
      case 'secondary':
        // Secondary is a lighter version of primary
        const secondaryBg = ColorUtility.lightenColor(baseColor, 35);
        const secondaryText = ColorUtility.darkenColor(baseColor, 20);
        
        variantStyle = `
          background-color: ${secondaryBg};
          color: ${secondaryText};
          border: 1px solid ${ColorUtility.lightenColor(baseColor, 20)};
          box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
        `;
        break;
        
      case 'outline':
        variantStyle = `
          background-color: transparent;
          color: ${baseColor};
          border: 1px solid ${baseColor};
        `;
        break;
        
      case 'text':
        variantStyle = `
          background-color: transparent;
          color: ${baseColor};
          border: none;
          padding-left: 8px;
          padding-right: 8px;
        `;
        break;
        
      default:
        variantStyle = `
          background-color: ${baseColor};
          color: ${textOnPrimary};
          border: none;
        `;
    }
    
    // Base button styles
    button.style.cssText = `
      ${variantStyle}
      padding: ${padding};
      font-size: ${fontSize};
      border-radius: 8px;
      font-weight: 500;
      cursor: ${disabled ? 'not-allowed' : 'pointer'};
      transition: all 0.2s ease;
      opacity: ${disabled ? '0.6' : '1'};
      width: ${fullWidth ? '100%' : 'auto'};
    `;
    
    // Add hover and active states
    if (!disabled) {
      button.addEventListener('mouseenter', () => {
        if (variant === 'primary') {
          button.style.backgroundColor = ColorUtility.darkenColor(baseColor, 5);
          button.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.15)';
          button.style.transform = 'translateY(-1px)';
        } else if (variant === 'secondary') {
          button.style.backgroundColor = ColorUtility.lightenColor(baseColor, 30);
          button.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.1)';
          button.style.transform = 'translateY(-1px)';
        } else if (variant === 'outline') {
          button.style.backgroundColor = ColorUtility.lightenColor(baseColor, 45);
        } else if (variant === 'text') {
          button.style.backgroundColor = ColorUtility.lightenColor(baseColor, 45);
        }
      });
      
      button.addEventListener('mouseleave', () => {
        if (variant === 'primary') {
          button.style.backgroundColor = baseColor;
          button.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.1)';
          button.style.transform = 'translateY(0)';
        } else if (variant === 'secondary') {
          button.style.backgroundColor = ColorUtility.lightenColor(baseColor, 35);
          button.style.boxShadow = '0 1px 2px rgba(0, 0, 0, 0.05)';
          button.style.transform = 'translateY(0)';
        } else if (variant === 'outline' || variant === 'text') {
          button.style.backgroundColor = 'transparent';
        }
      });
      
      button.addEventListener('mousedown', () => {
        if (variant === 'primary' || variant === 'secondary') {
          button.style.transform = 'translateY(0)';
          button.style.boxShadow = '0 1px 2px rgba(0, 0, 0, 0.1)';
        }
      });
      
      button.addEventListener('mouseup', () => {
        if (variant === 'primary') {
          button.style.transform = 'translateY(-1px)';
          button.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.15)';
        } else if (variant === 'secondary') {
          button.style.transform = 'translateY(-1px)';
          button.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.1)';
        }
      });
    }
    
    // Add click handler
    if (onClick && !disabled) {
      button.addEventListener('click', onClick);
    }
    
    return button;
  }
  
  /**
   * Create a progress bar component that works directly on any background
   * @param {number} progress - Progress percentage (0-100)
   * @param {Object} options - Optional configuration
   * @returns {HTMLElement} Progress bar element
   */
  static createProgressBar(progress = 0, options = {}) {
    const {
      height = '8px',
      animated = true,
      color = null,
      showPercentage = false,
      rounded = true,
      category = null,
      parentBackground = null
    } = options;
    
    const container = document.createElement('div');
    container.className = 'tea-progress';
    
    const track = document.createElement('div');
    track.className = 'tea-progress-track';
    
    const bar = document.createElement('div');
    bar.className = 'tea-progress-bar';
    
    // Get base color
    let baseColor;
    if (color) {
      baseColor = color;
    } else if (category) {
      baseColor = TeaThemeGenerator.getTeaColor(category);
    } else {
      baseColor = getComputedStyle(document.documentElement)
        .getPropertyValue('--tea-primary-color').trim();
    }
    
    // Get parent background to ensure contrast
    const bgColor = parentBackground || 
      getComputedStyle(document.documentElement)
        .getPropertyValue('--tea-surface-color').trim() || '#FFFFFF';
    
    // Set track color based on background contrast
    const isBgDark = ColorUtility.getOptimalTextColor(bgColor) === '#FFFFFF';
    const trackColor = isBgDark 
      ? 'rgba(255, 255, 255, 0.2)' 
      : 'rgba(0, 0, 0, 0.1)';
    
    // Container styling
    container.style.cssText = `
      width: 100%;
      position: relative;
      ${showPercentage ? 'margin-right: 40px;' : ''}
    `;
    
    // Track styling
    track.style.cssText = `
      width: 100%;
      height: ${height};
      background-color: ${trackColor};
      border-radius: ${rounded ? '4px' : '0'};
      overflow: hidden;
    `;
    
    // Bar styling with animation
    bar.style.cssText = `
      width: ${progress}%;
      height: 100%;
      background-color: ${baseColor};
      transition: width ${animated ? '0.5s ease' : '0s'};
    `;
    
    track.appendChild(bar);
    container.appendChild(track);
    
    // Add percentage label if requested
    if (showPercentage) {
      const label = document.createElement('div');
      label.className = 'tea-progress-label';
      label.textContent = `${Math.round(progress)}%`;
      
      // Set label color based on background
      label.style.cssText = `
        position: absolute;
        right: -40px;
        top: 50%;
        transform: translateY(-50%);
        font-size: 0.9rem;
        color: ${isBgDark ? 'rgba(255, 255, 255, 0.9)' : 'rgba(0, 0, 0, 0.8)'};
        font-weight: 500;
        width: 36px;
        text-align: right;
      `;
      
      container.appendChild(label);
    }
    
    // Add method to update progress
    container.setProgress = (newProgress) => {
      bar.style.width = `${newProgress}%`;
      if (showPercentage) {
        container.querySelector('.tea-progress-label').textContent = `${Math.round(newProgress)}%`;
      }
    };
    
    return container;
  }
  
  /**
   * Create a toggle switch component that works on any background
   * @param {Object} options - Toggle options
   * @returns {HTMLElement} Toggle switch element
   */
  static createToggle(options = {}) {
    const {
      checked = false,
      onChange = null,
      label = '',
      size = 'medium',
      disabled = false,
      category = null,
      parentBackground = null
    } = options;
    
    const container = document.createElement('label');
    container.className = 'tea-toggle';
    
    // Get base color
    let baseColor;
    if (category) {
      baseColor = TeaThemeGenerator.getTeaColor(category);
    } else {
      baseColor = getComputedStyle(document.documentElement)
        .getPropertyValue('--tea-primary-color').trim();
    }
    
    // Get parent background for contrast
    const bgColor = parentBackground || 
      getComputedStyle(document.documentElement)
        .getPropertyValue('--tea-surface-color').trim() || '#FFFFFF';
    
    // Adjust colors based on background
    const isBgDark = ColorUtility.getOptimalTextColor(bgColor) === '#FFFFFF';
    const trackOffColor = isBgDark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.2)';
    const textColor = isBgDark ? 'rgba(255, 255, 255, 0.9)' : 'rgba(0, 0, 0, 0.8)';
    
    if (label) {
      const labelText = document.createElement('span');
      labelText.className = 'tea-toggle-label';
      labelText.textContent = label;
      labelText.style.cssText = `
        margin-right: 8px;
        font-size: 0.9rem;
        color: ${textColor};
      `;
      container.appendChild(labelText);
    }
    
    const input = document.createElement('input');
    input.type = 'checkbox';
    input.className = 'tea-toggle-input';
    input.checked = checked;
    input.disabled = disabled;
    
    const slider = document.createElement('span');
    slider.className = 'tea-toggle-slider';
    
    // Size dimensions
    const dimensions = {
      small: { width: '36px', height: '20px', knobSize: '14px' },
      medium: { width: '44px', height: '24px', knobSize: '18px' },
      large: { width: '52px', height: '28px', knobSize: '22px' }
    };
    
    const { width, height, knobSize } = dimensions[size] || dimensions.medium;
    
    // Apply styles
    container.style.cssText = `
      display: inline-flex;
      align-items: center;
      cursor: ${disabled ? 'not-allowed' : 'pointer'};
      user-select: none;
    `;
    
    input.style.cssText = `
      opacity: 0;
      width: 0;
      height: 0;
      position: absolute;
    `;
    
    // Dynamic toggle colors
    const toggleOnColor = baseColor;
    
    slider.style.cssText = `
      position: relative;
      display: inline-block;
      width: ${width};
      height: ${height};
      background-color: ${checked ? toggleOnColor : trackOffColor};
      border-radius: ${height};
      transition: background-color 0.3s ease;
      opacity: ${disabled ? '0.5' : '1'};
    `;
    
    // Add drop shadow to slider for better contrast on any background
    if (!disabled) {
      slider.style.boxShadow = `0 1px 3px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.06)`;
    }
    
    // Add the knob using ::after
    slider.innerHTML = `
      <style>
        .tea-toggle-slider::after {
          content: '';
          position: absolute;
          top: ${parseInt(height) / 2 - parseInt(knobSize) / 2}px;
          left: ${checked ? parseInt(width) - parseInt(knobSize) - 3 : '3'}px;
          width: ${knobSize};
          height: ${knobSize};
          background-color: white;
          border-radius: 50%;
          transition: left 0.3s ease;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
        }
      </style>
    `;
    
    // Update toggle state when clicked
    input.addEventListener('change', () => {
      const isChecked = input.checked;
      slider.style.backgroundColor = isChecked ? toggleOnColor : trackOffColor;
      
      // Update knob position via inline style (overrides the ::after)
      const knobElement = slider.querySelector('style');
      knobElement.textContent = `
        .tea-toggle-slider::after {
          content: '';
          position: absolute;
          top: ${parseInt(height) / 2 - parseInt(knobSize) / 2}px;
          left: ${isChecked ? parseInt(width) - parseInt(knobSize) - 3 : '3'}px;
          width: ${knobSize};
          height: ${knobSize};
          background-color: white;
          border-radius: 50%;
          transition: left 0.3s ease;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
        }
      `;
      
      if (onChange) onChange(isChecked);
    });
    
    container.appendChild(input);
    container.appendChild(slider);
    
    // Add methods for programmatic control
    container.setValue = (value) => {
      if (input.checked !== value) {
        input.checked = value;
        slider.style.backgroundColor = value ? toggleOnColor : trackOffColor;
        
        // Update knob position
        const knobElement = slider.querySelector('style');
        knobElement.textContent = `
          .tea-toggle-slider::after {
            content: '';
            position: absolute;
            top: ${parseInt(height) / 2 - parseInt(knobSize) / 2}px;
            left: ${value ? parseInt(width) - parseInt(knobSize) - 3 : '3'}px;
            width: ${knobSize};
            height: ${knobSize};
            background-color: white;
            border-radius: 50%;
            transition: left 0.3s ease;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
          }
        `;
      }
    };
    
    container.getValue = () => input.checked;
    container.disable = () => {
      input.disabled = true;
      slider.style.opacity = '0.5';
      container.style.cursor = 'not-allowed';
    };
    container.enable = () => {
      input.disabled = false;
      slider.style.opacity = '1';
      container.style.cursor = 'pointer';
    };
    
    return container;
  }
  
  /**
   * Create a search input component that works on any background
   * @param {Object} options - Search input options
   * @returns {HTMLElement} Search input container
   */
  static createSearchInput(options = {}) {
    const {
      placeholder = 'Search...',
      onInput = null,
      onClear = null,
      width = '100%',
      value = '',
      category = null,
      parentBackground = null,
      outlined = false
    } = options;
    
    const container = document.createElement('div');
    container.className = 'tea-search-container';
    
    // Get base color
    let baseColor;
    if (category) {
      baseColor = TeaThemeGenerator.getTeaColor(category);
    } else {
      baseColor = getComputedStyle(document.documentElement)
        .getPropertyValue('--tea-primary-color').trim();
    }
    
    // Get parent background to ensure contrast
    const bgColor = parentBackground || 
      getComputedStyle(document.documentElement)
        .getPropertyValue('--tea-surface-color').trim() || '#FFFFFF';
    
    // Adjust colors based on background
    const isBgDark = ColorUtility.getOptimalTextColor(bgColor) === '#FFFFFF';
    
    // Create search icon with SVG for better styling
    const searchIcon = document.createElement('div');
    searchIcon.className = 'tea-search-icon';
    searchIcon.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" 
           stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="11" cy="11" r="8"></circle>
        <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
      </svg>
    `;
    
    const input = document.createElement('input');
    input.type = 'text';
    input.placeholder = placeholder;
    input.className = 'tea-search-input';
    input.value = value;
    
    const clearButton = document.createElement('button');
    clearButton.className = 'tea-search-clear';
    clearButton.innerHTML = '×';
    clearButton.setAttribute('aria-label', 'Clear search');
    clearButton.style.display = value ? 'flex' : 'none';
    
    // Determine appropriate colors
    const inputTextColor = isBgDark ? 'rgba(255, 255, 255, 0.9)' : 'rgba(0, 0, 0, 0.9)';
    const placeholderColor = isBgDark ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)';
    const iconColor = isBgDark ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.5)';
    
    // Background for the search input
    const inputBgColor = outlined 
      ? 'transparent'
      : (isBgDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.05)');
    
    // Border color for search input
    const borderColor = outlined
      ? (isBgDark ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.2)')
      : (isBgDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)');
    
    // Apply styles
    container.style.cssText = `
      display: flex;
      align-items: center;
      position: relative;
      width: ${width};
      background-color: ${inputBgColor};
      border-radius: 24px;
      padding: 6px 12px;
      transition: all 0.3s ease;
      border: 1px solid ${borderColor};
    `;
    
    searchIcon.style.cssText = `
      display: flex;
      align-items: center;
      justify-content: center;
      margin-right: 8px;
      color: ${iconColor};
    `;
    
          input.style.cssText = `
      flex: 1;
      border: none;
      background: transparent;
      padding: 6px 0;
      color: ${inputTextColor};
      font-size: 0.95rem;
      outline: none;
    `;
    
    // Add placeholder styles
    const style = document.createElement('style');
    style.textContent = `
      .tea-search-input::placeholder {
        color: ${placeholderColor};
        opacity: 1;
      }
    `;
    document.head.appendChild(style);
    
    clearButton.style.cssText = `
      background: none;
      border: none;
      font-size: 1.2rem;
      color: ${iconColor};
      cursor: pointer;
      display: ${value ? 'flex' : 'none'};
      align-items: center;
      justify-content: center;
      width: 20px;
      height: 20px;
      border-radius: 50%;
      transition: all 0.2s ease;
      padding: 0;
      margin-left: 4px;
    `;
    
    // Add event listeners
    input.addEventListener('input', () => {
      clearButton.style.display = input.value ? 'flex' : 'none';
      if (onInput) onInput(input.value);
    });
    
    input.addEventListener('focus', () => {
      container.style.boxShadow = '0 0 0 2px rgba(' + 
        parseInt(baseColor.substr(1, 2), 16) + ',' + 
        parseInt(baseColor.substr(3, 2), 16) + ',' + 
        parseInt(baseColor.substr(5, 2), 16) + ', 0.3)';
      container.style.borderColor = baseColor;
    });
    
    input.addEventListener('blur', () => {
      container.style.boxShadow = 'none';
      container.style.borderColor = borderColor;
    });
    
    clearButton.addEventListener('click', () => {
      input.value = '';
      clearButton.style.display = 'none';
      input.focus();
      if (onClear) onClear();
      if (onInput) onInput('');
    });
    
    // Add elements to container
    container.appendChild(searchIcon);
    container.appendChild(input);
    container.appendChild(clearButton);
    
    // Expose public methods
    container.getValue = () => input.value;
    container.setValue = (newValue) => {
      input.value = newValue;
      clearButton.style.display = newValue ? 'flex' : 'none';
    };
    container.focus = () => input.focus();
    container.clear = () => {
      input.value = '';
      clearButton.style.display = 'none';
      if (onClear) onClear();
      if (onInput) onInput('');
    };
    
    return container;
  }
  
  /**
   * Create a card component that looks good on any background
   * @param {Object} options - Card options
   * @returns {HTMLElement} Card container element
   */
  static createCard(options = {}) {
    const {
      title = null,
      content = null,
      footer = null,
      elevation = 'medium', // none, low, medium, high
      padding = 'medium', // none, small, medium, large
      radius = 'medium', // none, small, medium, large
      width = 'auto',
      parentBackground = null,
      category = null,
      accent = false,
      flat = false
    } = options;
    
    // Create card container
    const card = document.createElement('div');
    card.className = 'tea-card';
    
    // Get base color
    let baseColor;
    if (category) {
      baseColor = TeaThemeGenerator.getTeaColor(category);
    } else {
      baseColor = getComputedStyle(document.documentElement)
        .getPropertyValue('--tea-primary-color').trim();
    }
    
    // Get parent background to ensure contrast
    const bgColor = parentBackground || 
      getComputedStyle(document.documentElement)
        .getPropertyValue('--tea-bg-light').trim() || '#f0f0f0';
    
    // Adjust card appearance based on parent background
    const isBgDark = ColorUtility.getOptimalTextColor(bgColor) === '#FFFFFF';
    
    // Determine card background and other properties
    let cardBg, borderColor, textColor, shadowOpacity;
    
    if (isBgDark) {
      // Dark parent background
      cardBg = 'rgba(255, 255, 255, 0.1)';
      borderColor = 'rgba(255, 255, 255, 0.15)';
      textColor = 'rgba(255, 255, 255, 0.9)';
      shadowOpacity = 0.3;
    } else {
      // Light parent background
      cardBg = '#ffffff';
      borderColor = 'rgba(0, 0, 0, 0.08)';
      textColor = 'rgba(0, 0, 0, 0.87)';
      shadowOpacity = 0.1;
    }
    
    // Determine elevation (shadow)
    let shadow;
    if (flat) {
      shadow = 'none';
    } else {
      switch (elevation) {
        case 'none':
          shadow = 'none';
          break;
        case 'low':
          shadow = `0 1px 3px rgba(0, 0, 0, ${shadowOpacity})`;
          break;
        case 'medium':
          shadow = `0 2px 6px rgba(0, 0, 0, ${shadowOpacity})`;
          break;
        case 'high':
          shadow = `0 4px 12px rgba(0, 0, 0, ${shadowOpacity})`;
          break;
        default:
          shadow = `0 2px 6px rgba(0, 0, 0, ${shadowOpacity})`;
      }
    }
    
    // Determine padding
    let paddingValue;
    switch (padding) {
      case 'none':
        paddingValue = '0';
        break;
      case 'small':
        paddingValue = '8px';
        break;
      case 'medium':
        paddingValue = '16px';
        break;
      case 'large':
        paddingValue = '24px';
        break;
      default:
        paddingValue = '16px';
    }
    
    // Determine border radius
    let radiusValue;
    switch (radius) {
      case 'none':
        radiusValue = '0';
        break;
      case 'small':
        radiusValue = '4px';
        break;
      case 'medium':
        radiusValue = '8px';
        break;
      case 'large':
        radiusValue = '12px';
        break;
      default:
        radiusValue = '8px';
    }
    
    // Apply styles
    card.style.cssText = `
      background-color: ${cardBg};
      ${!flat ? `border: 1px solid ${borderColor};` : ''}
      border-radius: ${radiusValue};
      box-shadow: ${shadow};
      overflow: hidden;
      color: ${textColor};
      width: ${width};
      transition: all 0.2s ease;
      ${accent ? `border-left: 4px solid ${baseColor};` : ''}
    `;
    
    // Create and add title if provided
    if (title) {
      const titleElement = document.createElement('div');
      titleElement.className = 'tea-card-title';
      
      if (typeof title === 'string') {
        titleElement.textContent = title;
      } else {
        titleElement.appendChild(title);
      }
      
      titleElement.style.cssText = `
        padding: ${paddingValue};
        padding-bottom: 0;
        font-size: 1.25rem;
        font-weight: 500;
        color: ${accent ? baseColor : textColor};
      `;
      
      card.appendChild(titleElement);
    }
    
    // Create and add content if provided
    if (content) {
      const contentElement = document.createElement('div');
      contentElement.className = 'tea-card-content';
      
      if (typeof content === 'string') {
        contentElement.textContent = content;
      } else {
        contentElement.appendChild(content);
      }
      
      contentElement.style.cssText = `
        padding: ${paddingValue};
        ${title ? 'padding-top: 8px;' : ''}
      `;
      
      card.appendChild(contentElement);
    }
    
    // Create and add footer if provided
    if (footer) {
      const footerElement = document.createElement('div');
      footerElement.className = 'tea-card-footer';
      
      if (typeof footer === 'string') {
        footerElement.textContent = footer;
      } else {
        footerElement.appendChild(footer);
      }
      
      // Determine footer background
      const footerBg = isBgDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.02)';
      
      footerElement.style.cssText = `
        padding: ${paddingValue};
        border-top: 1px solid ${borderColor};
        background-color: ${footerBg};
        display: flex;
        justify-content: flex-end;
        align-items: center;
        gap: 8px;
      `;
      
      card.appendChild(footerElement);
    }
    
    // Add hover interaction
    card.addEventListener('mouseenter', () => {
      if (!flat) {
        if (elevation !== 'high') {
          card.style.boxShadow = `0 4px 12px rgba(0, 0, 0, ${shadowOpacity})`;
        }
        card.style.transform = 'translateY(-2px)';
      }
    });
    
    card.addEventListener('mouseleave', () => {
      if (!flat) {
        card.style.boxShadow = shadow;
        card.style.transform = 'translateY(0)';
      }
    });
    
    return card;
  }
  
  /**
   * Create a custom divider that adjusts to parent background
   * @param {Object} options - Divider options
   * @returns {HTMLElement} Divider element
   */
  static createDivider(options = {}) {
    const {
      vertical = false,
      width = '100%',
      height = '1px',
      margin = '12px 0',
      parentBackground = null,
      color = null,
      category = null,
      inset = false
    } = options;
    
    const divider = document.createElement('div');
    divider.className = 'tea-divider';
    
    // Determine color
    let dividerColor;
    
    if (color) {
      dividerColor = color;
    } else if (category) {
      const baseColor = TeaThemeGenerator.getTeaColor(category);
      dividerColor = `${baseColor}50`; // Apply 30% opacity
    } else {
      // Determine from parent background
      const bgColor = parentBackground || 
        getComputedStyle(document.documentElement)
          .getPropertyValue('--tea-surface-color').trim() || '#FFFFFF';
      
      const isBgDark = ColorUtility.getOptimalTextColor(bgColor) === '#FFFFFF';
      dividerColor = isBgDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.12)';
    }
    
    // Apply styles based on orientation
    if (vertical) {
      divider.style.cssText = `
        display: inline-block;
        width: ${height}; /* Use height param for width of vertical divider */
        height: ${width}; /* Use width param for height of vertical divider */
        margin: ${inset ? '0 12px' : '0'};
        background-color: ${dividerColor};
      `;
    } else {
      divider.style.cssText = `
        display: block;
        width: ${width};
        height: ${height};
        margin: ${margin};
        background-color: ${dividerColor};
        ${inset ? 'margin-left: 16px; margin-right: 16px;' : ''}
      `;
    }
    
    return divider;
  }
  
  /**
   * Create a label that adjusts to any background
   * @param {string} text - Label text
   * @param {Object} options - Label options
   * @returns {HTMLElement} Label element
   */
  static createLabel(text, options = {}) {
    const {
      forId = null,
      required = false,
      parentBackground = null,
      category = null,
      size = 'medium'
    } = options;
    
    const label = document.createElement('label');
    label.className = 'tea-label';
    
    if (forId) {
      label.htmlFor = forId;
    }
    
    // Create text content
    const labelText = document.createElement('span');
    labelText.textContent = text;
    label.appendChild(labelText);
    
    // Add required indicator if needed
    if (required) {
      const requiredIndicator = document.createElement('span');
      requiredIndicator.className = 'tea-label-required';
      requiredIndicator.textContent = ' *';
      requiredIndicator.setAttribute('aria-hidden', 'true');
      label.appendChild(requiredIndicator);
    }
    
    // Get base color
    let baseColor;
    if (category) {
      baseColor = TeaThemeGenerator.getTeaColor(category);
    } else {
      baseColor = getComputedStyle(document.documentElement)
        .getPropertyValue('--tea-primary-color').trim();
    }
    
    // Get parent background to ensure contrast
    const bgColor = parentBackground || 
      getComputedStyle(document.documentElement)
        .getPropertyValue('--tea-surface-color').trim() || '#FFFFFF';
    
    // Adjust colors based on background
    const isBgDark = ColorUtility.getOptimalTextColor(bgColor) === '#FFFFFF';
    const textColor = isBgDark ? 'rgba(255, 255, 255, 0.9)' : 'rgba(0, 0, 0, 0.87)';
    const requiredColor = category ? baseColor : '#d32f2f';
    
    // Determine font size based on size option
    let fontSize;
    switch (size) {
      case 'small':
        fontSize = '0.75rem';
        break;
      case 'medium':
        fontSize = '0.875rem';
        break;
      case 'large':
        fontSize = '1rem';
        break;
      default:
        fontSize = '0.875rem';
    }
    
    // Apply styles
    label.style.cssText = `
      display: block;
      color: ${textColor};
      font-size: ${fontSize};
      font-weight: 500;
      margin-bottom: 6px;
    `;
    
    if (required) {
      const styleElement = document.createElement('style');
      styleElement.textContent = `
        .tea-label-required {
          color: ${requiredColor};
          font-weight: bold;
        }
      `;
      label.appendChild(styleElement);
    }
    
    return label;
  }
}

export default TeaAtoms;
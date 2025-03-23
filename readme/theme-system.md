# Tea App Theming System

This document explains the theming system added to the Tea App, which provides dynamic, category-based color theming throughout the application.

## Overview

The Tea App theming system consists of:

1. **Color Utility** - A utility class for color manipulation and analysis
2. **Theme Generator** - A service that creates themed variables based on tea categories
3. **Tea Theme** - A unified API that ties the other components together
4. **Theme CSS** - Global CSS variables for consistent styling across components
5. **Atomic Components** - Reusable UI components that adapt to the current theme

## Core Files

- `js/utils/color-utility.js` - Advanced color transformations and analysis
- `js/utils/theme-generator.js` - Tea-specific theme generation
- `js/utils/tea-theme.js` - Simplified API for accessing theme functionality
- `css/tea-theme.css` - Global theme variables and fallbacks
- `js/utils/tea-atoms-lib.js` - Theme-aware atomic UI components

## Using the Theme System

### Setting the Theme

To apply a theme based on tea category:

```javascript
import TeaTheme from './js/utils/tea-theme.js';

// Initialize the theme system (call once at app startup)
TeaTheme.init();

// Change the theme to a specific category
TeaTheme.setTheme('Green'); // Options: Green, Black, Oolong, White, Pu-erh, Yellow
```

### Responding to Theme Changes

Theme changes emit an event you can listen for:

```javascript
document.addEventListener('tea-theme-changed', (event) => {
  const { category, colors } = event.detail;
  console.log(`Theme changed to ${category}`);
  // Update UI elements if needed
});
```

### Using CSS Variables

The theme system sets CSS variables that can be used in your styles:

```css
.my-element {
  background-color: var(--tea-primary-color);
  color: var(--tea-text-on-primary);
  border: 1px solid var(--tea-border-color);
}

/* For hover states */
.my-element:hover {
  background-color: var(--tea-primary-light);
}
```

### Theme Variables

Main variables provided by the theme system:

| Variable | Description |
|----------|-------------|
| `--tea-primary-color` | Main color for the current tea category |
| `--tea-primary-light` | Lighter variation of the primary color |
| `--tea-primary-dark` | Darker variation of the primary color |
| `--tea-text-on-primary` | Text color with optimal contrast for primary color |
| `--tea-text-color` | Main text color |
| `--tea-text-muted` | Secondary, muted text color |
| `--tea-surface-color` | Background color for cards and surfaces |
| `--tea-border-color` | Border color for UI elements |
| `--tea-hover-color` | Color for hover states |
| `--tea-active-color` | Color for active/pressed states |
| `--tea-bg-light` | Light background color |
| `--tea-bg-subtle` | Very light background color for subtle highlighting |

### Category-Specific Colors

Access each tea category's color directly:

| Variable | Description |
|----------|-------------|
| `--tea-green-color` | Green tea color |
| `--tea-black-color` | Black tea color |
| `--tea-oolong-color` | Oolong tea color |
| `--tea-white-color` | White tea color |
| `--tea-pu-erh-color` | Pu-erh tea color |
| `--tea-yellow-color` | Yellow tea color |

## Color Utility

The `ColorUtility` class provides methods for advanced color manipulation:

```javascript
import ColorUtility from './js/utils/color-utility.js';

// Convert hex to RGB
const rgb = ColorUtility.hexToRgb('#7B9070'); // [123, 144, 112]

// Get optimal text color (black or white) for contrast
const textColor = ColorUtility.getOptimalTextColor('#7B9070'); // '#FFFFFF'

// Lighten a color
const lightGreen = ColorUtility.lightenColor('#7B9070', 20); // '#a2b08e'

// Darken a color
const darkGreen = ColorUtility.darkenColor('#7B9070', 20); // '#627253'

// Get complementary color
const complementary = ColorUtility.getComplementaryColor('#7B9070'); // '#70568F'

// Get analogous colors
const analogous = ColorUtility.getAnalogousColors('#7B9070');
// { primary: '#7B9070', analogous1: '#707B90', analogous2: '#907B70' }
```

## Atomic Components

The `TeaAtoms` library provides reusable UI components that adapt to the current theme:

```javascript
import TeaAtoms from './js/utils/tea-atoms-lib.js';

// Create a badge
const badge = TeaAtoms.createBadge('Organic', 'Green');
document.body.appendChild(badge);

// Create a chip
const chip = TeaAtoms.createChip('Floral', {
  closable: true,
  active: true,
  onClick: (text) => console.log(`Clicked ${text}`),
  onClose: (text) => console.log(`Removed ${text}`)
});
document.body.appendChild(chip);

// Create a toggle switch
const toggle = TeaAtoms.createToggle({
  checked: true,
  label: 'Gongfu Brewing',
  onChange: (checked) => console.log(`Toggle: ${checked}`)
});
document.body.appendChild(toggle);

// Create a progress bar
const progressBar = TeaAtoms.createProgressBar(75, {
  height: '10px',
  animated: true,
  showPercentage: true
});
document.body.appendChild(progressBar);

// Create a search input
const searchInput = TeaAtoms.createSearchInput({
  placeholder: 'Search teas...',
  onInput: (value) => console.log(`Searching for: ${value}`)
});
document.body.appendChild(searchInput);
```

## Web Components Integration

When creating web components, you can easily integrate with the theming system:

```javascript
// Inside your web component constructor
this._handleThemeChange = this._handleThemeChange.bind(this);

// In connectedCallback
document.addEventListener('tea-theme-changed', this._handleThemeChange);

// In disconnectedCallback
document.removeEventListener('tea-theme-changed', this._handleThemeChange);

// Theme change handler
_handleThemeChange(event) {
  const { category, colors } = event.detail;
  this._updateThemeColors(colors);
  this.render(); // Re-render component with new colors
}

// Get current theme colors
_getCurrentThemeColors() {
  const style = getComputedStyle(document.documentElement);
  return {
    primary: style.getPropertyValue('--tea-primary-color').trim(),
    textOnPrimary: style.getPropertyValue('--tea-text-on-primary').trim(),
    // Get other needed colors...
  };
}
```

## Best Practices

1. **Use CSS Variables**: Prefer using CSS variables over hardcoded colors
2. **Listen for Theme Changes**: Update your components when the theme changes
3. **Test Light and Dark Colors**: Ensure your UI looks good with both light (White, Yellow) and dark (Pu-erh, Black) themes
4. **Consider Accessibility**: Maintain good contrast ratios for text
5. **Use the TeaAtoms Library**: For common UI elements to ensure consistent theming
6. **Add CSS Transitions**: Include `transition: color 0.3s ease, background-color 0.3s ease` for smooth theme changes
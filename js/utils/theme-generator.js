import ColorUtility from './color-utility.js';

// Tea Color Palette - Matching the existing app palette with better naming
const TeaColorPalette = {
    'Green': '#7B9070',      // Matches our Green Tea color
    'Black': '#A56256',      // Matches our Black Tea color
    'Oolong': '#C09565',     // Matches our Oolong Tea color
    'White': '#D8DCD5',      // Matches our White Tea color
    'Pu-erh': '#6F5244',     // Matches our Pu-erh Tea color
    'Yellow': '#D1CDA6'      // Matches our Yellow Tea color
};

/**
 * Tea Theme Generator
 * Manages theme application and dynamic color transformations
 */
class TeaThemeGenerator {
    /**
     * Apply a theme to the document based on tea category
     * @param {string} category - Tea category (Green, Black, Oolong, etc.)
     */
    static applyTheme(category) {
        const baseColor = TeaColorPalette[category] || TeaColorPalette['Green'];
        
        // Generate all color variants
        const variants = this.generateThemeVariants(baseColor, category);
        
        // Apply CSS variables to document root
        Object.entries(variants).forEach(([key, value]) => {
            document.documentElement.style.setProperty(key, value);
        });
        
        // Update class on body element to allow category-specific styling
        document.body.className = document.body.className
            .replace(/tea-theme-\w+/g, '')
            .trim();
        document.body.classList.add(`tea-theme-${category.toLowerCase()}`);
        
        // Emit theme change event
        this._emitThemeChangeEvent(category, variants);
    }
    
    /**
     * Generate color variants for a specific tea category
     * @param {string} baseColor - Base color in hex
     * @param {string} category - Tea category name
     * @returns {object} CSS variable name-value pairs
     */
    static generateThemeVariants(baseColor, category) {
        // Get optimal text color based on base color
        const textColor = ColorUtility.getOptimalTextColor(baseColor);
        
        // Special adjustments for light colored teas (White, Yellow)
        const isLightTea = ['White', 'Yellow'].includes(category);
        
        // Create color variants
        return {
            // Primary colors
            '--tea-primary-color': baseColor,
            '--tea-primary-light': ColorUtility.lightenColor(baseColor, 15),
            '--tea-primary-dark': ColorUtility.darkenColor(baseColor, 15),
            
            // Text colors
            '--tea-text-on-primary': textColor,
            '--tea-text-color': isLightTea ? '#333333' : '#333333',
            '--tea-text-muted': isLightTea ? '#666666' : '#666666',
            
            // UI element colors
            '--tea-surface-color': isLightTea ? '#FFFFFF' : '#FFFFFF',
            '--tea-border-color': isLightTea ? 'rgba(0,0,0,0.1)' : 'rgba(0,0,0,0.1)',
            '--tea-hover-color': ColorUtility.lightenColor(baseColor, 30),
            '--tea-active-color': ColorUtility.darkenColor(baseColor, 10),
            
            // Background variants
            '--tea-bg-light': ColorUtility.lightenColor(baseColor, 35),
            '--tea-bg-subtle': ColorUtility.lightenColor(baseColor, 40),
            
            // Add legacy color variables for backward compatibility
            '--primary-color': baseColor,
            '--background-color': baseColor,
            '--text-color': textColor,
            '--button-background': isLightTea ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.1)',
            '--chip-background': isLightTea ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.1)'
        };
    }
    
    /**
     * Get a specific tea color
     * @param {string} category - Tea category name
     * @returns {string} Color hex code
     */
    static getTeaColor(category) {
        return TeaColorPalette[category] || TeaColorPalette['Green'];
    }
    
    /**
     * Get the full tea color palette
     * @returns {Object} Tea color palette mapping
     */
    static getColorPalette() {
        return {...TeaColorPalette};
    }
    
    /**
     * Create a color swatch element
     * @param {string} category - Tea category
     * @returns {HTMLElement} Color swatch display element
     */
    static createColorSwatch(category) {
        const baseColor = this.getTeaColor(category);
        
        const swatchContainer = document.createElement('div');
        swatchContainer.className = 'tea-color-swatch';
        swatchContainer.style.cssText = `
            width: 50px;
            height: 50px;
            border-radius: 50%;
            background-color: ${baseColor};
            box-shadow: 0 2px 4px rgba(0,0,0,0.2);
            display: inline-block;
        `;
        
        // Add tooltip with color information
        swatchContainer.setAttribute('title', `${category} Tea: ${baseColor}`);
        
        return swatchContainer;
    }
    
    /**
     * Create a complete palette display
     * @returns {HTMLElement} Palette display element
     */
    static createPaletteDisplay() {
        const container = document.createElement('div');
        container.className = 'tea-palette-display';
        container.style.cssText = `
            display: flex;
            flex-wrap: wrap;
            gap: 12px;
            padding: 16px;
        `;
        
        Object.entries(TeaColorPalette).forEach(([category, color]) => {
            const swatchItem = document.createElement('div');
            swatchItem.style.cssText = `
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 8px;
            `;
            
            const swatch = this.createColorSwatch(category);
            const label = document.createElement('span');
            label.textContent = `${category}`;
            label.style.cssText = `font-size: 0.8rem; color: #666;`;
            
            swatchItem.appendChild(swatch);
            swatchItem.appendChild(label);
            container.appendChild(swatchItem);
        });
        
        return container;
    }
    
    /**
     * Emit a custom event when theme changes
     * @param {string} category - Tea category
     * @param {object} variants - Theme variables
     * @private
     */
    static _emitThemeChangeEvent(category, variants) {
        const event = new CustomEvent('tea-theme-changed', {
            bubbles: true,
            detail: {
                category,
                colors: variants,
                baseColor: TeaColorPalette[category]
            }
        });
        
        document.dispatchEvent(event);
    }
}

export { TeaThemeGenerator, TeaColorPalette };
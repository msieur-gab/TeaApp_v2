// components/tea-progress.js
// Modular progress component for tea collection tracking

import { teaEvents, TeaEventTypes } from '../services/event-manager.js';
import TeaTheme from '../utils/tea-theme.js';
import ColorUtility from '../utils/color-utility.js';
import TeaDatabase from '../services/tea-database.js';
import TeaCollectionLevels from '../services/tea-collection-levels.js';

class TeaProgress extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    
    // State management
    this._state = {
      category: 'Green',
      current: 0,
      total: 52,
      level: null,
      nextLevel: null,
      levelProgress: []
    };
    
    // Theme colors
    this._themeColors = {
      primary: '#7B9070',
      text: '#FFFFFF',
      light: '#9db293',
      dark: '#5d6e54'
    };
    
    // Bound methods for event handling
    this._handleThemeChange = this._handleThemeChange.bind(this);
    this._handleTeaAdded = this._handleTeaAdded.bind(this);
    this._handleTeaDeleted = this._handleTeaDeleted.bind(this);
  }

  // Lifecycle hooks
  async connectedCallback() {
    // Set initial category from attribute
    this._state.category = this.getAttribute('category') || 'Green';
    
    // Update theme colors
    this._updateThemeColors();
    
    // Load data from database
    await this._loadDataFromDatabase();
    
    // Render initial state
    this.render();
    
    // Listen for theme changes
    document.addEventListener('tea-theme-changed', this._handleThemeChange);
    
    // Listen for tea collection changes using on/off pattern
    teaEvents.on(TeaEventTypes.TEA_ADDED, this._handleTeaAdded);
    teaEvents.on(TeaEventTypes.TEA_REMOVED, this._handleTeaDeleted);
  }

  disconnectedCallback() {
    // Remove theme change listener
    document.removeEventListener('tea-theme-changed', this._handleThemeChange);
    
    // Remove tea collection change listeners
    teaEvents.off(TeaEventTypes.TEA_ADDED, this._handleTeaAdded);
    teaEvents.off(TeaEventTypes.TEA_REMOVED, this._handleTeaDeleted);
  }

  // Attribute observing
  static get observedAttributes() {
    return ['category', 'current', 'total', 'compact', 'hide-visualization'];
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (oldValue === newValue) return;

    switch(name) {
      case 'category':
        this._state.category = newValue;
        this._updateThemeColors();
        this._loadDataFromDatabase();
        break;
      case 'current':
        this._state.current = parseInt(newValue, 10);
        this._updateLevelInfo();
        break;
      case 'total':
        this._state.total = parseInt(newValue, 10);
        break;
      case 'compact':
        this._state.compact = this.hasAttribute('compact');
        break;
      case 'hide-visualization':
        this._state.hideVisualization = this.hasAttribute('hide-visualization');
        break;
    }

    this.render();
  }

  // Database interaction
  async _loadDataFromDatabase() {
    try {
      // Initialize database if needed
      await TeaDatabase.init();
      
      // Get count of teas in this category
      const count = await TeaDatabase.getCategoryTeaCount(this._state.category);
      
      // Update state with real data
      this._state.current = count;
      
      // Total can be set via attribute or use default
      if (!this.hasAttribute('total')) {
        this._state.total = 52; // Default total if not specified
      }
      
      // Update level information
      this._updateLevelInfo();
      
      this.render();
    } catch (error) {
      console.error(`Error loading tea data for ${this._state.category}:`, error);
    }
  }

  // Update level information
  _updateLevelInfo() {
    if (!TeaCollectionLevels) return;
    
    try {
      // Get current progress information
      const progressInfo = TeaCollectionLevels.getCollectionProgress(
        this._state.category, 
        this._state.current
      );
      
      this._state.level = progressInfo.currentLevel;
      this._state.nextLevel = progressInfo.nextLevel;
      this._state.progressMessage = progressInfo.progressMessage;
      
      // Extract level milestones for visualization
      this._state.levelProgress = this._getLevelMilestones();
    } catch (error) {
      console.error('Error updating level information:', error);
    }
  }
  
  // Get level milestones for visualization
  _getLevelMilestones() {
    if (!TeaCollectionLevels || !TeaCollectionLevels.categories[this._state.category]) {
      return [];
    }
    
    // Get all levels for this category
    const allLevels = TeaCollectionLevels.categories[this._state.category];
    
    // Add a starting point at 0
    const milestones = [
      {
        threshold: 0,
        title: "Start",
        achieved: true // Always achieved
      }
    ];
    
    // Include all levels for better visualization in scrollable view
    milestones.push(...allLevels.map(level => ({
      threshold: level.threshold,
      title: level.title.split(' ').slice(-1)[0], // Just use the last word of the title
      achieved: this._state.current >= level.threshold
    })));
    
    // For very large collections, add intermediate milestones
    if (this._state.total > 100) {
      // Add numeric milestones every 25 or 50 teas
      const step = this._state.total > 200 ? 50 : 25;
      
      for (let i = step; i < this._state.total; i += step) {
        // Skip if we already have a milestone very close to this number
        const hasNearbyMilestone = milestones.some(m => 
          Math.abs(m.threshold - i) < step * 0.2
        );
        
        if (!hasNearbyMilestone) {
          milestones.push({
            threshold: i,
            title: `${i}`,
            achieved: this._state.current >= i
          });
        }
      }
      
      // Sort milestones by threshold
      milestones.sort((a, b) => a.threshold - b.threshold);
    }
    
    return milestones;
  }

  // Event handlers
  _handleTeaAdded(data) {
    const tea = data.tea;
    if (tea && tea.category === this._state.category) {
      this._loadDataFromDatabase();
    }
  }

  _handleTeaDeleted(data) {
    const tea = data.tea;
    if (tea && tea.category === this._state.category) {
      this._loadDataFromDatabase();
    }
  }

  // Theme update method
  _updateThemeColors() {
    const baseColor = TeaTheme.getColor(this._state.category);
    
    if (baseColor) {
      this._themeColors = {
        primary: baseColor,
        text: ColorUtility.getOptimalTextColor(baseColor),
        light: ColorUtility.lightenColor(baseColor, 20),
        dark: ColorUtility.darkenColor(baseColor, 20),
        darker: ColorUtility.darkenColor(baseColor, 40),
        // Add percentage-based variations
        'darker_10': ColorUtility.darkenColor(baseColor, 10),
        'darker_20': ColorUtility.darkenColor(baseColor, 20),
        'darker_30': ColorUtility.darkenColor(baseColor, 30),
        'darker_40': ColorUtility.darkenColor(baseColor, 40),
        'lighter_10': ColorUtility.lightenColor(baseColor, 10),
        'lighter_20': ColorUtility.lightenColor(baseColor, 20),
        'lighter_30': ColorUtility.lightenColor(baseColor, 30),
        'lighter_40': ColorUtility.lightenColor(baseColor, 40)
      };
    }
  }

  // Helper method to get color with percentage variation
  _getColor(variation) {
    // Check if the variation exists in themeColors
    if (this._themeColors[variation]) {
      return this._themeColors[variation];
    }
    
    // Parse dynamic variations like 'darker-15' or 'lighter-25'
    const match = variation.match(/^(darker|lighter)-(\d+)$/);
    if (match) {
      const type = match[1];
      const percentage = parseInt(match[2], 10);
      
      if (type === 'darker') {
        return ColorUtility.darkenColor(this._themeColors.primary, percentage);
      } else if (type === 'lighter') {
        return ColorUtility.lightenColor(this._themeColors.primary, percentage);
      }
    }
    
    // Default to primary color if variation not found
    return this._themeColors.primary;
  }

  // Theme change handler
  _handleThemeChange(event) {
    this._updateThemeColors();
    this.render();
  }

  // Render method
  render() {
    const { primary, text, light, dark } = this._themeColors;
    const isCompact = this._state.compact;

    const styles = `
      :host {
        display: block;
        width: 100%;
        margin-bottom: ${isCompact ? '8px' : '16px'};
      }

      .progress-container {
        background-color: ${primary};
        border-radius: 8px;
        overflow: hidden;
        padding: ${isCompact ? '0.5rem' : '1rem'};
        color: ${text};
      }

      .progress-details {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: ${isCompact ? '8px' : '12px 16px 8px'};
        font-size: ${isCompact ? '0.8rem' : '0.875rem'};
        color: ${this._getColor('lighter_30')};
      }

      .progress-count {
        font-size: ${isCompact ? '0.7rem' : '0.75rem'};
        color: ${this._getColor('lighter_20')};
        margin-top: 4px;
      }
      
      .level-title {
        font-weight: 500;
        color: ${text};
        margin-top: 2px;
        font-size: ${isCompact ? '0.75rem' : '0.8rem'};
      }
      
      .progress-message {
        font-size: ${isCompact ? '0.7rem' : '0.75rem'};
        color: ${this._getColor('lighter_20')};
        margin-top: 4px;
        font-style: italic;
      }
      
      .level-progress {
        position: relative;
        height: ${isCompact ? '50px' : '70px'};
        width: 100%;
        margin-top: 8px;
        overflow: hidden;
      }
      
      .level-scroll-container {
        position: relative;
        height: 100%;
        overflow-x: auto;
        overflow-y: hidden;
        -webkit-overflow-scrolling: touch;
        scrollbar-width: thin;
        scrollbar-color: ${dark} ${light};
      }
      
      .level-scroll-container::-webkit-scrollbar {
        height: 4px;
      }
      
      .level-scroll-container::-webkit-scrollbar-track {
        background: ${light};
      }
      
      .level-scroll-container::-webkit-scrollbar-thumb {
        background-color: ${dark};
        border-radius: 2px;
      }
      
      .level-track-wrapper {
        position: relative;
        height: 100%;
        min-width: 100%;
      }
      
      .level-track {
        position: absolute;
        top: 50%;
        left: 0;
        right: 0;
        height: 6px;
        border-radius: 3px;
        background-color: ${light};
        transform: translateY(-50%);
      }
      
      .level-milestone {
        position: absolute;
        top: 50%;
        transform: translate(-50%, -50%);
        width: 6px;
        height: 6px;
        border-radius: 50%;
        background-color:${light};
        border: 3px solid ${primary};
        z-index: 2;
      }
      
      .level-milestone.achieved {
        background-color: ${dark};
      }
      
      .milestone-label {
        position: absolute;
        top: calc(50% + 14px);
        transform: translateX(-50%);
        font-size: 0.7rem;
        color: ${this._getColor('lighter_30')};
        text-align: center;
        width: 60px;
      }
      
      .milestone-label.achieved {
        color: ${this._getColor('lighter_10')};
        font-weight: 500;
      }
      
      .current-indicator {
        position: absolute;
        top: 50%;
        transform: translate(-50%, -50%);
        width: ${isCompact ? '20px' : '24px'};
        height: ${isCompact ? '20px' : '24px'};
        border-radius: 50%;
        background-color: ${this._getColor('darker_20')};
        border: 4px solid ${primary};
        z-index: 3;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      
      .current-indicator-text {
        font-size: 0.7rem;
        line-height: 0;
        letter-spacing: 0px;
        font-weight: bold;
        color: ${this._getColor('lighter-30')};
      }
      
      .progress-segment {
        position: absolute;
        top: 50%;
        transform: translateY(-50%);
        height: 6px;
        background-color: ${dark};
        border-radius: 3px;
        z-index: 1;
      }
      
      /* Accessibility enhancements */
      .sr-only {
        position: absolute;
        width: 1px;
        height: 1px;
        padding: 0;
        margin: -1px;
        overflow: hidden;
        clip: rect(0, 0, 0, 0);
        white-space: nowrap;
        border: 0;
      }
    `;

    // Calculate level visualization HTML
    let levelVisualizationHTML = '';
    
    if (this._state.levelProgress.length > 0 && !this._state.hideVisualization) {
      const milestones = this._state.levelProgress;
      const segments = [];
      
      // Determine if we need a scrollable view based on collection size
      const useScrollableView = this._state.total > 100 || milestones.length > 7;
      
      // Calculate the total width of the track
      // For scrollable view, we use a fixed width per milestone
      // Calculate the total width of the track
      // For scrollable view, we use a fixed width per milestone
      const trackWidth = useScrollableView 
        ? `${Math.max(100, milestones.length * 100)}px` 
        : '100%';
      
      // Create milestone dots HTML with relative positioning
      const milestonesHTML = milestones.map((milestone, index) => {
        // Calculate position
        let position;
        
        if (useScrollableView) {
          // For scrollable view, position based on threshold value
          // This creates a more accurate representation for large collections
          position = (milestone.threshold / this._state.total) * 100;
        } else {
          // For small collections, evenly space the milestones
          position = index === 0 ? 0 : (index / (milestones.length - 1)) * 100;
        }
        
        // Create progress segments between milestones
        if (index > 0) {
          const prevMilestone = milestones[index - 1];
          const prevPosition = useScrollableView 
            ? (prevMilestone.threshold / this._state.total) * 100
            : ((index - 1) / (milestones.length - 1)) * 100;
          
          const width = position - prevPosition;
          
          // Calculate how much of this segment is filled based on current progress
          let segmentProgress = 0;
          
          const prevThreshold = prevMilestone.threshold;
          const currentThreshold = milestone.threshold;
          
          if (this._state.current >= currentThreshold) {
            // If we've reached or passed this milestone, fill the whole segment
            segmentProgress = 100;
          } else if (this._state.current > prevThreshold) {
            // If we're between the previous and current milestone, calculate partial fill
            segmentProgress = ((this._state.current - prevThreshold) / (currentThreshold - prevThreshold)) * 100;
          }
          
          if (segmentProgress > 0) {
            segments.push(`
              <div class="progress-segment" style="
                left: ${prevPosition}%;
                width: ${(width * segmentProgress / 100)}%;
              "></div>
            `);
          }
        }
        
        return `
          <div class="level-milestone ${milestone.achieved ? 'achieved' : ''}" 
               style="left: ${position}%"
               role="img"
               aria-label="${milestone.title} milestone ${milestone.achieved ? 'achieved' : 'not yet achieved'}">
          </div>
          <div class="milestone-label ${milestone.achieved ? 'achieved' : ''}" 
               style="left: ${position}%">
            ${milestone.title}
          </div>
        `;
      }).join('');
      
      // Calculate current progress position
      let currentPosition;
      
      if (this._state.current === 0) {
        currentPosition = 0;
      } else if (this._state.current >= this._state.total) {
        currentPosition = 100;
      } else if (useScrollableView) {
        // For scrollable view, position directly based on current value
        currentPosition = (this._state.current / this._state.total) * 100;
      } else {
        // For small collections, interpolate between milestones
        // Find the milestone range we're in
        for (let i = 1; i < milestones.length; i++) {
          const prevThreshold = milestones[i-1].threshold;
          const currentThreshold = milestones[i].threshold;
          
          if (this._state.current >= prevThreshold && this._state.current <= currentThreshold) {
            // Calculate position within this segment
            const segmentStart = ((i-1) / (milestones.length - 1)) * 100;
            const segmentEnd = (i / (milestones.length - 1)) * 100;
            const segmentWidth = segmentEnd - segmentStart;
            
            const progress = (this._state.current - prevThreshold) / (currentThreshold - prevThreshold);
            currentPosition = segmentStart + (progress * segmentWidth);
            break;
          }
        }
      }
      
      // Create level visualization
      levelVisualizationHTML = `
        <div class="level-progress" role="progressbar" aria-valuenow="${this._state.current}" aria-valuemin="0" aria-valuemax="${this._state.total}">
          <div class="level-scroll-container">
            <div class="level-track-wrapper" style="width: ${trackWidth}">
              <div class="level-track"></div>
              ${segments.join('')}
              ${milestonesHTML}
              <div class="current-indicator" style="left: ${currentPosition}%">
                <span class="current-indicator-text">${this._state.current}</span>
              </div>
            </div>
          </div>
        </div>
      `;
    }

    // Create main HTML
    this.shadowRoot.innerHTML = `
      <style>${styles}</style>
      <div class="progress-container">
        <div class="progress-details">
          <div>
            <span>${this._state.category} Tea Collection</span>
            <div class="progress-count">${this._state.current} of ${this._state.total}</div>
            ${this._state.level ? `<div class="level-title">${this._state.level.title}</div>` : ''}
            ${this._state.progressMessage ? `<div class="progress-message">${this._state.progressMessage}</div>` : ''}
          </div>
        </div>
        ${levelVisualizationHTML}
        <div class="sr-only" role="status" aria-live="polite">
          You have collected ${this._state.current} out of ${this._state.total} ${this._state.category} teas.
          Current level: ${this._state.level ? this._state.level.title : 'Beginner'}.
        </div>
      </div>
    `;
    
    // After rendering, scroll to center the current progress indicator
    this._scrollToCurrentPosition();
  }
  
  // Scroll to center the current progress indicator
  _scrollToCurrentPosition() {
    // Wait for the DOM to be fully rendered
    setTimeout(() => {
      const scrollContainer = this.shadowRoot.querySelector('.level-scroll-container');
      const currentIndicator = this.shadowRoot.querySelector('.current-indicator');
      
      if (scrollContainer && currentIndicator) {
        // Calculate the scroll position to center the indicator
        const containerWidth = scrollContainer.clientWidth;
        const indicatorLeft = currentIndicator.offsetLeft;
        
        // Center the indicator in the scroll container
        scrollContainer.scrollLeft = indicatorLeft - (containerWidth / 2);
      }
    }, 50);
  }

  // Public method to update progress
  updateProgress(current, total) {
    if (current !== undefined) {
      this.setAttribute('current', current);
    }
    if (total !== undefined) {
      this.setAttribute('total', total);
    }
  }
  
  // Public method to refresh data from database
  async refreshData() {
    await this._loadDataFromDatabase();
  }
  
  // Public method to get level info
  getLevelInfo() {
    return {
      level: this._state.level,
      nextLevel: this._state.nextLevel,
      current: this._state.current,
      total: this._state.total,
      progressMessage: this._state.progressMessage
    };
  }
  
  // Public method to set compact mode
  setCompact(isCompact) {
    if (isCompact) {
      this.setAttribute('compact', '');
    } else {
      this.removeAttribute('compact');
    }
  }
  
  // Public method to toggle visualization
  toggleVisualization(show) {
    if (show === false) {
      this.setAttribute('hide-visualization', '');
    } else {
      this.removeAttribute('hide-visualization');
    }
  }
}

// Register the custom element
if (!customElements.get('tea-progress')) {
  customElements.define('tea-progress', TeaProgress);
}

export default TeaProgress;
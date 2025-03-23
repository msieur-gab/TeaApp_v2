// Example of using TeaAtoms with the tea detail view
import TeaAtoms from '../utils/tea-atoms-lib.js';
import ColorUtility from '../utils/color-utility.js';
import { TeaThemeGenerator } from '../utils/theme-generator.js';

/**
 * Example of updating the tea detail component with TeaAtoms
 * 
 * This example shows how to:
 * 1. Use TeaAtoms directly on background colors
 * 2. Create components that adapt to the theme
 * 3. Build UI elements without requiring containers with background colors
 */
class TeaDetailAtoms extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    
    // State
    this._teaData = null;
    this._isOpen = false;
    this._brewStyle = 'western'; // 'western' or 'gongfu'
    
    // Theme colors
    this._themeColors = {
      primary: '#7B9070', // Default to Green tea
      text: '#FFFFFF',
      light: '#9db293',
      dark: '#5d6e54'
    };
    
    // Bind methods
    this._handleClose = this._handleClose.bind(this);
    this._handleBrewStyleToggle = this._handleBrewStyleToggle.bind(this);
    this._handleSteepClick = this._handleSteepClick.bind(this);
    this._handleThemeChange = this._handleThemeChange.bind(this);
  }

  connectedCallback() {
    // Listen for theme changes
    document.addEventListener('tea-theme-changed', this._handleThemeChange);
    
    // Initial render
    this.render();
  }
  
  disconnectedCallback() {
    document.removeEventListener('tea-theme-changed', this._handleThemeChange);
  }
  
  // Handle theme changes
  _handleThemeChange(event) {
    const { category, colors } = event.detail;
    
    // Update theme colors
    this._themeColors = {
      primary: colors['--tea-primary-color'],
      text: colors['--tea-text-on-primary'],
      light: colors['--tea-primary-light'],
      dark: colors['--tea-primary-dark']
    };
    
    // Re-render if open
    if (this._isOpen) {
      this.render();
    }
  }
  
  // Open the detail view with tea data
  open(teaData) {
    this._teaData = teaData;
    this._isOpen = true;
    
    // Set theme colors based on tea category
    if (teaData.category) {
      const baseColor = TeaThemeGenerator.getTeaColor(teaData.category);
      this._themeColors.primary = baseColor;
      this._themeColors.text = ColorUtility.getOptimalTextColor(baseColor);
      this._themeColors.light = ColorUtility.lightenColor(baseColor, 15);
      this._themeColors.dark = ColorUtility.darkenColor(baseColor, 15);
    }
    
    this.render();
  }
  
  // Close the detail view
  close() {
    this._isOpen = false;
    this.render();
  }
  
  // Toggle brewing style
  _handleBrewStyleToggle(isChecked) {
    this._brewStyle = isChecked ? 'gongfu' : 'western';
    this._updateBrewingParameters();
  }
  
  // Update brewing parameters based on style
  _updateBrewingParameters() {
    if (!this._teaData) return;
    
    const brewTime = this._getBrewTime();
    const temperature = this._getTemperature();
    const brewRatio = this._getBrewRatio();
    
    // Update the DOM
    const timeElement = this.shadowRoot.querySelector('.brew-time');
    const tempElement = this.shadowRoot.querySelector('.brew-temp');
    const ratioElement = this.shadowRoot.querySelector('.brew-ratio');
    
    if (timeElement) timeElement.textContent = brewTime;
    if (tempElement) tempElement.textContent = temperature;
    if (ratioElement) timeElement.textContent = brewRatio;
  }
  
  // Handle steep button click
  _handleSteepClick() {
    if (!this._teaData) return;
    
    // Prepare tea data for steeping
    const teaForSteeping = { 
      ...this._teaData,
      brewTime: this._getBrewTime(),
      temperature: this._getTemperature()
    };
    
    // Dispatch steep event
    const event = new CustomEvent('start-steeping', {
      bubbles: true,
      composed: true,
      detail: { tea: teaForSteeping }
    });
    this.dispatchEvent(event);
    
    // Close the detail view
    this.close();
  }
  
  // Handle close button click
  _handleClose() {
    this.close();
  }
  
  // Helper methods to get brewing parameters
  _getBrewTime() {
    if (this._brewStyle === 'gongfu') {
      return this._teaData.gongfuBrewTime || '15';
    } else {
      return this._teaData.westernBrewTime || this._teaData.brewTime || '3:00';
    }
  }
  
  _getTemperature() {
    if (this._brewStyle === 'gongfu') {
      return this._teaData.gongfuTemperature || this._teaData.temperature || '95°C';
    } else {
      return this._teaData.westernTemperature || this._teaData.temperature || '85°C';
    }
  }
  
  _getBrewRatio() {
    if (this._brewStyle === 'gongfu') {
      return this._teaData.gongfuLeafRatio || '5g per 100ml';
    } else {
      return this._teaData.westernLeafRatio || '2g per 200ml';
    }
  }
  
  render() {
    if (!this._isOpen || !this._teaData) {
      this.shadowRoot.innerHTML = `<style>:host { display: none; }</style>`;
      return;
    }
    
    // Ensure minimum required data
    const teaData = {
      name: this._teaData.name || 'Unknown Tea',
      category: this._teaData.category || 'Green',
      description: this._teaData.description || 'No description available.',
      origin: this._teaData.origin || 'Unknown Origin',
      tags: this._teaData.tags || [this._teaData.category.toLowerCase()],
      ...this._teaData
    };
    
    // Get theme colors for this tea
    const { primary, text, light, dark } = this._themeColors;
    
    // Base styles
    const styles = `
      :host {
        display: block;
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        z-index: 95;
      }
      
      .detail-backdrop {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0, 0, 0, 0.5);
      }
      
      .detail-panel {
        position: absolute;
        bottom: 64px;
        left: 0;
        width: 100%;
        max-height: 85vh;
        background-color: ${primary};
        color: ${text};
        border-top-left-radius: 16px;
        border-top-right-radius: 16px;
        overflow: hidden;
        display: flex;
        flex-direction: column;
      }
      
      .detail-handle {
        width: 36px;
        height: 5px;
        background-color: rgba(255, 255, 255, 0.3);
        border-radius: 3px;
        margin: 8px auto;
      }
      
      .detail-header {
        padding: 8px 16px 12px;
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
      
      .detail-title {
        flex: 1;
        text-align: center;
        margin: 0;
        font-size: 1.5rem;
        font-weight: 500;
      }
      
      .detail-content {
        flex: 1;
        overflow-y: auto;
        background-color: white;
        color: #333;
        padding: 0;
      }
      
      .tea-image {
        width: 80px;
        height: 80px;
        background-color: white;
        border-radius: 50%;
        display: flex;
        justify-content: center;
        align-items: center;
        margin: 0 auto;
        font-size: 2rem;
        color: ${primary};
        box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
      }
      
      .section {
        padding: 16px;
      }
      
      .section-title-container {
        display: flex;
        align-items: center;
        margin-bottom: 12px;
        border-bottom: 1px solid rgba(0, 0, 0, 0.1);
        padding-bottom: 8px;
      }
      
      .section-title {
        margin: 0;
        color: ${primary};
        font-size: 1.1rem;
        font-weight: 600;
      }
      
      @media (min-width: 768px) {
        .detail-panel {
          width: 90%;
          max-width: 500px;
          left: 50%;
          transform: translateX(-50%);
        }
      }
    `;
    
    // Create the shadow DOM structure
    this.shadowRoot.innerHTML = `
      <style>${styles}</style>
      <div class="detail-backdrop"></div>
      <div class="detail-panel">
        <div class="detail-handle"></div>
        <div class="detail-header">
          <div id="close-button-container"></div>
          <h2 class="detail-title">${teaData.name}</h2>
          <div style="width: 32px;"></div> <!-- Spacer for alignment -->
        </div>
        <div class="detail-content">
          <!-- Sections will be added here by JS -->
          <div class="section" id="tea-header-section"></div>
          <div class="section" id="brewing-section"></div>
          <div class="section" id="notes-section"></div>
          <div class="section" id="characteristics-section"></div>
          <div class="section" id="properties-section"></div>
        </div>
      </div>
    `;
    
    // Create components using TeaAtoms and add them to the sections
    this._renderCloseButton();
    this._renderTeaHeader(teaData);
    this._renderBrewingSection(teaData);
    this._renderNotesSection(teaData);
    this._renderCharacteristicsSection(teaData);
    this._renderPropertiesSection(teaData);
  }
  
  _renderCloseButton() {
    const container = this.shadowRoot.getElementById('close-button-container');
    if (!container) return;
    
    // Create close button
    const closeButton = TeaAtoms.createButton('', {
      variant: 'text',
      icon: '×',
      onClick: this._handleClose,
      parentBackground: this._themeColors.primary,
      size: 'small'
    });
    
    // Override button styles for a circular close button
    closeButton.style.cssText = `
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background-color: rgba(255, 255, 255, 0.2);
      color: ${this._themeColors.text};
      font-size: 1.25rem;
      padding: 0;
      display: flex;
      align-items: center;
      justify-content: center;
    `;
    
    container.appendChild(closeButton);
  }
  
  _renderTeaHeader(teaData) {
    const container = this.shadowRoot.getElementById('tea-header-section');
    if (!container) return;
    
    // Create tea image
    const teaImage = document.createElement('div');
    teaImage.className = 'tea-image';
    teaImage.innerHTML = '<span>🍵</span>';
    container.appendChild(teaImage);
    
    // Create origin badge
    if (teaData.origin) {
      const originContainer = document.createElement('div');
      originContainer.style.cssText = 'text-align: center; margin: 12px 0;';
      
      const originBadge = TeaAtoms.createBadge(teaData.origin, teaData.category, {
        parentBackground: 'white'
      });
      
      originContainer.appendChild(originBadge);
      container.appendChild(originContainer);
    }
    
    // Create description
    const description = document.createElement('p');
    description.textContent = teaData.description;
    description.style.cssText = 'line-height: 1.5; margin: 16px 0;';
    container.appendChild(description);
    
    // Add divider
    const divider = TeaAtoms.createDivider({
      parentBackground: 'white',
      category: teaData.category
    });
    container.appendChild(divider);
  }
  
  _renderBrewingSection(teaData) {
    const container = this.shadowRoot.getElementById('brewing-section');
    if (!container) return;
    
    // Create section title
    const titleContainer = document.createElement('div');
    titleContainer.className = 'section-title-container';
    
    const title = document.createElement('h3');
    title.className = 'section-title';
    title.textContent = 'Brewing Guide';
    
    titleContainer.appendChild(title);
    container.appendChild(titleContainer);
    
    // Create brewing style toggle
    const toggleContainer = document.createElement('div');
    toggleContainer.style.cssText = 'display: flex; justify-content: center; align-items: center; margin-bottom: 16px;';
    
    const westernLabel = document.createElement('span');
    westernLabel.textContent = 'Western';
    westernLabel.style.margin = '0 8px';
    
    const gongfuLabel = document.createElement('span');
    gongfuLabel.textContent = 'Gongfu';
    gongfuLabel.style.margin = '0 8px';
    
    const toggle = TeaAtoms.createToggle({
      checked: this._brewStyle === 'gongfu',
      onChange: this._handleBrewStyleToggle,
      size: 'medium',
      parentBackground: 'white',
      category: teaData.category
    });
    
    toggleContainer.appendChild(westernLabel);
    toggleContainer.appendChild(toggle);
    toggleContainer.appendChild(gongfuLabel);
    container.appendChild(toggleContainer);
    
    // Create brewing parameters panel using a card
    const parametersCard = document.createElement('div');
    parametersCard.style.cssText = 'margin-bottom: 16px;';
    
    // Create grid for parameters
    const paramsGrid = document.createElement('div');
    paramsGrid.style.cssText = `
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 12px;
      margin-bottom: 16px;
    `;
    
    // Brew time
    const timeCard = TeaAtoms.createCard({
      title: 'Time',
      content: this._getBrewTime(),
      padding: 'medium',
      elevation: 'low',
      flat: true,
      parentBackground: 'white',
      category: teaData.category
    });
    timeCard.querySelector('.tea-card-content').classList.add('brew-time');
    timeCard.querySelector('.tea-card-content').style.cssText = `
      font-size: 1.2rem;
      font-weight: 600;
      text-align: center;
      color: ${this._themeColors.primary};
    `;
    
    // Temperature
    const tempCard = TeaAtoms.createCard({
      title: 'Temperature',
      content: this._getTemperature(),
      padding: 'medium',
      elevation: 'low',
      flat: true,
      parentBackground: 'white',
      category: teaData.category
    });
    tempCard.querySelector('.tea-card-content').classList.add('brew-temp');
    tempCard.querySelector('.tea-card-content').style.cssText = `
      font-size: 1.2rem;
      font-weight: 600;
      text-align: center;
      color: ${this._themeColors.primary};
    `;
    
    // Leaf ratio
    const ratioCard = TeaAtoms.createCard({
      title: 'Leaf Ratio',
      content: this._getBrewRatio(),
      padding: 'medium',
      elevation: 'low',
      flat: true,
      parentBackground: 'white',
      category: teaData.category
    });
    ratioCard.querySelector('.tea-card-content').classList.add('brew-ratio');
    ratioCard.querySelector('.tea-card-content').style.cssText = `
      font-size: 1.2rem;
      font-weight: 600;
      text-align: center;
      color: ${this._themeColors.primary};
    `;
    
    paramsGrid.appendChild(timeCard);
    paramsGrid.appendChild(tempCard);
    paramsGrid.appendChild(ratioCard);
    parametersCard.appendChild(paramsGrid);
    container.appendChild(parametersCard);
    
    // Create steep button
    const steepButton = TeaAtoms.createButton('Steep This Tea', {
      variant: 'primary',
      size: 'large',
      fullWidth: true,
      onClick: this._handleSteepClick,
      parentBackground: 'white',
      category: teaData.category
    });
    
    container.appendChild(steepButton);
    
    // Add divider
    const divider = TeaAtoms.createDivider({
      parentBackground: 'white',
      category: teaData.category
    });
    container.appendChild(divider);
  }
  
  _renderNotesSection(teaData) {
    const container = this.shadowRoot.getElementById('notes-section');
    if (!container || !teaData.notes) return;
    
    // Create section title
    const titleContainer = document.createElement('div');
    titleContainer.className = 'section-title-container';
    
    const title = document.createElement('h3');
    title.className = 'section-title';
    title.textContent = 'Tasting Notes';
    
    titleContainer.appendChild(title);
    container.appendChild(titleContainer);
    
    // Create notes card
    const notesCard = TeaAtoms.createCard({
      content: teaData.notes,
      padding: 'medium',
      elevation: 'low',
      flat: true,
      accent: true,
      parentBackground: 'white',
      category: teaData.category
    });
    
    container.appendChild(notesCard);
    
    // Add divider
    const divider = TeaAtoms.createDivider({
      parentBackground: 'white',
      category: teaData.category
    });
    container.appendChild(divider);
  }
  
  _renderCharacteristicsSection(teaData) {
    const container = this.shadowRoot.getElementById('characteristics-section');
    if (!container || !teaData.tags || teaData.tags.length === 0) return;
    
    // Create section title
    const titleContainer = document.createElement('div');
    titleContainer.className = 'section-title-container';
    
    const title = document.createElement('h3');
    title.className = 'section-title';
    title.textContent = 'Characteristics';
    
    titleContainer.appendChild(title);
    container.appendChild(titleContainer);
    
    // Create chips for flavor tags
    const tagsContainer = document.createElement('div');
    tagsContainer.style.cssText = 'display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 16px;';
    
    teaData.tags.forEach(tag => {
      const chip = TeaAtoms.createChip(tag, {
        parentBackground: 'white',
        category: teaData.category
      });
      tagsContainer.appendChild(chip);
    });
    
    container.appendChild(tagsContainer);
    
    // Add divider
    const divider = TeaAtoms.createDivider({
      parentBackground: 'white',
      category: teaData.category
    });
    container.appendChild(divider);
  }
  
  _renderPropertiesSection(teaData) {
    const container = this.shadowRoot.getElementById('properties-section');
    if (!container) return;
    
    // Check if we have any properties to show
    const hasProperties = teaData.harvestDate || teaData.elevation || 
                         teaData.caffeineLevel || teaData.processingMethod || 
                         teaData.form || teaData.agingPotential;
    
    if (!hasProperties) return;
    
    // Create section title
    const titleContainer = document.createElement('div');
    titleContainer.className = 'section-title-container';
    
    const title = document.createElement('h3');
    title.className = 'section-title';
    title.textContent = 'Properties';
    
    titleContainer.appendChild(title);
    container.appendChild(titleContainer);
    
    // Create properties grid
    const propertiesGrid = document.createElement('div');
    propertiesGrid.style.cssText = `
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 16px;
      margin-bottom: 24px;
    `;
    
    // Add property items
    this._addPropertyItem(propertiesGrid, 'Harvest', teaData.harvestDate, teaData.category);
    this._addPropertyItem(propertiesGrid, 'Elevation', teaData.elevation, teaData.category);
    this._addPropertyItem(propertiesGrid, 'Caffeine', teaData.caffeineLevel, teaData.category);
    this._addPropertyItem(propertiesGrid, 'Processing', teaData.processingMethod, teaData.category);
    this._addPropertyItem(propertiesGrid, 'Form', teaData.form, teaData.category);
    this._addPropertyItem(propertiesGrid, 'Aging Potential', teaData.agingPotential, teaData.category);
    
    container.appendChild(propertiesGrid);
  }
  
  _addPropertyItem(container, label, value, category) {
    if (!value) return;
    
    const propertyItem = document.createElement('div');
    propertyItem.style.cssText = 'display: flex; flex-direction: column;';
    
    // Create property label
    const labelElement = TeaAtoms.createLabel(label, {
      size: 'small',
      parentBackground: 'white',
      category: category
    });
    
    // Create property value
    const valueElement = document.createElement('div');
    valueElement.textContent = value;
    valueElement.style.cssText = 'font-size: 0.95rem;';
    
    propertyItem.appendChild(labelElement);
    propertyItem.appendChild(valueElement);
    container.appendChild(propertyItem);
  }
}

// Register the custom element for demonstration purposes
customElements.define('tea-detail-atoms', TeaDetailAtoms);

export default TeaDetailAtoms;
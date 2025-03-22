// components/progress-modal.js
// Enhanced modal to display tea collection progress and level-up rewards

class ProgressModal extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    
    // State
    this._teaData = null;
    this._progressMessage = '';
    this._isComplete = false;
    this._badges = [];
    this._isLevelUp = false;
    this._categoryProgress = null;
    
    // Bind methods
    this._handleClose = this._handleClose.bind(this);
  }

  connectedCallback() {
    this.render();
    this._addEventListeners();
  }
  
  disconnectedCallback() {
    this._removeEventListeners();
  }
  
  // Public methods
  /**
   * Show the progress modal with tea and progress information
   * @param {Object} teaData - Tea data object
   * @param {string} progressMessage - Message to display
   * @param {boolean} isComplete - Is this a completion milestone
   * @param {Array} badges - Badges earned
   * @param {boolean} isLevelUp - Is this a level-up event (vs. regular tea addition)
   * @param {Object} categoryProgress - Category progress information from TeaCollectionLevels
   */
  show(teaData, progressMessage, isComplete = false, badges = [], isLevelUp = false, categoryProgress = null) {
    this._teaData = teaData;
    this._progressMessage = progressMessage;
    this._isComplete = isComplete;
    this._badges = badges || [];
    this._isLevelUp = isLevelUp;
    this._categoryProgress = categoryProgress;
    
    this.render();
    this.style.display = 'flex';
    
    // Add entrance animation class
    const container = this.shadowRoot.querySelector('.modal-container');
    if (container) {
      container.classList.add('animate-in');
    }
    
    // Focus the close button for accessibility
    setTimeout(() => {
      const button = this.shadowRoot.querySelector('.action-button');
      if (button) button.focus();
    }, 100);

    // Dispatch shown event
    this.dispatchEvent(new CustomEvent('modal-shown', {
      bubbles: true,
      composed: true,
      detail: { teaData: this._teaData }
    }));
  }
  
  close() {
    const container = this.shadowRoot.querySelector('.modal-container');
    if (container) {
      // Add exit animation
      container.classList.remove('animate-in');
      container.classList.add('animate-out');
      
      // Wait for animation to complete
      setTimeout(() => {
        this.style.display = 'none';
        if (container) {
          container.classList.remove('animate-out');
        }
        
        // Dispatch closed event
        this.dispatchEvent(new CustomEvent('modal-closed', {
          bubbles: true,
          composed: true
        }));
      }, 300);
    } else {
      this.style.display = 'none';
      
      // Dispatch closed event
      this.dispatchEvent(new CustomEvent('modal-closed', {
        bubbles: true,
        composed: true
      }));
    }
  }
  
  _handleClose() {
    this.close();
  }
  
  _addEventListeners() {
    const closeButton = this.shadowRoot.querySelector('.close-button');
    const actionButton = this.shadowRoot.querySelector('.action-button');
    
    if (closeButton) {
      closeButton.addEventListener('click', this._handleClose);
    }
    
    if (actionButton) {
      actionButton.addEventListener('click', this._handleClose);
    }
  }
  
  _removeEventListeners() {
    const closeButton = this.shadowRoot.querySelector('.close-button');
    const actionButton = this.shadowRoot.querySelector('.action-button');
    
    if (closeButton) {
      closeButton.removeEventListener('click', this._handleClose);
    }
    
    if (actionButton) {
      actionButton.removeEventListener('click', this._handleClose);
    }
  }
  
  _getCategoryColor(category) {
    // Color mapping for tea categories
    const colorMap = {
      'Green': '#7B9070',
      'Black': '#A56256',
      'Oolong': '#C09565',
      'White': '#D8DCD5',
      'Pu-erh': '#6F5244',
      'Yellow': '#D1CDA6'
    };
    
    return colorMap[category] || '#4a90e2';
  }
  
  _renderProgressBar() {
    if (!this._categoryProgress) return '';
    
    const { collectedCount, nextLevel } = this._categoryProgress;
    
    // If there's no next level, the collection is complete
    if (!nextLevel) {
      return `
        <div class="progress-bar-container">
          <div class="progress-bar" style="width: 100%;"></div>
        </div>
        <div class="progress-labels">
          <span class="progress-label">Completed!</span>
          <span class="progress-count">${collectedCount}/${collectedCount}</span>
        </div>
      `;
    }
    
    const currentLevelThreshold = this._categoryProgress.currentLevel.threshold || 0;
    const nextLevelThreshold = nextLevel.threshold;
    
    // Calculate progress within current level bracket
    const levelProgress = collectedCount - currentLevelThreshold;
    const levelTotal = nextLevelThreshold - currentLevelThreshold;
    const progressPercentage = (levelProgress / levelTotal) * 100;
    
    return `
      <div class="progress-bar-container">
        <div class="progress-bar" style="width: ${progressPercentage}%;"></div>
      </div>
      <div class="progress-labels">
        <span class="progress-label">${this._categoryProgress.currentLevel.title}</span>
        <span class="progress-count">${collectedCount}/${nextLevelThreshold}</span>
      </div>
    `;
  }
  
  render() {
    const styles = `
      :host {
        display: none;
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0, 0, 0, 0.5);
        z-index: 1000;
        justify-content: center;
        align-items: center;
        padding: 1rem;
        box-sizing: border-box;
      }
      
      .modal-container {
        background-color: white;
        border-radius: 12px;
        box-shadow: 0 4px 25px rgba(0, 0, 0, 0.15);
        width: 100%;
        max-width: 400px;
        max-height: 85vh;
        overflow-y: auto;
        position: relative;
        opacity: 0;
        transform: translateY(20px);
        transition: opacity 0.3s ease, transform 0.3s ease;
      }
      
      .modal-container.animate-in {
        opacity: 1;
        transform: translateY(0);
      }
      
      .modal-container.animate-out {
        opacity: 0;
        transform: translateY(20px);
      }
      
      .modal-header {
        padding: 16px;
        border-bottom: 1px solid #f0f0f0;
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
      
      .modal-title {
        margin: 0;
        font-size: 1.25rem;
        color: #333;
        font-weight: 500;
      }
      
      .close-button {
        background: none;
        border: none;
        font-size: 1.5rem;
        cursor: pointer;
        color: #777;
        width: 32px;
        height: 32px;
        border-radius: 50%;
        display: flex;
        justify-content: center;
        align-items: center;
        line-height: 1;
        padding: 0;
      }
      
      .close-button:hover {
        background-color: #f5f5f5;
      }
      
      .modal-content {
        padding: 16px;
      }
      
      .tea-info {
        display: flex;
        align-items: center;
        margin-bottom: 1.5rem;
        padding: 1rem;
        background-color: #f9f9f9;
        border-radius: 8px;
      }
      
      .tea-icon {
        width: 48px;
        height: 48px;
        border-radius: 50%;
        display: flex;
        justify-content: center;
        align-items: center;
        margin-right: 1rem;
        font-size: 1.5rem;
        flex-shrink: 0;
      }
      
      .tea-details {
        flex: 1;
      }
      
      .tea-name {
        font-weight: 600;
        margin: 0 0 0.35rem 0;
        font-size: 1.1rem;
      }
      
      .tea-category {
        color: #666;
        margin: 0;
        font-size: 0.875rem;
      }
      
      .progress-message {
        background-color: #e8f4f8;
        color: #2980b9;
        padding: 1rem;
        border-radius: 8px;
        margin-bottom: 1.5rem;
        text-align: center;
        line-height: 1.5;
      }
      
      .success-message {
        background-color: #e8f8e8;
        color: #27ae60;
      }
      
      .level-up-message {
        background-color: #FFF3CD;
        color: #856404;
      }
      
      .progress-section {
        margin-bottom: 1.5rem;
      }
      
      .progress-bar-container {
        height: 8px;
        background-color: #f0f0f0;
        border-radius: 4px;
        overflow: hidden;
        margin-bottom: 0.5rem;
      }
      
      .progress-bar {
        height: 100%;
        background-color: #4a90e2;
        border-radius: 4px;
        transition: width 1s ease;
      }
      
      .progress-labels {
        display: flex;
        justify-content: space-between;
        font-size: 0.875rem;
        color: #666;
      }
      
      .badges-section {
        margin-bottom: 1.5rem;
      }
      
      .badges-title {
        font-weight: 500;
        margin-bottom: 1rem;
        text-align: center;
        font-size: 1.1rem;
      }
      
      .badges-grid {
        display: flex;
        justify-content: center;
        gap: 1rem;
        flex-wrap: wrap;
      }
      
      .badge {
        width: 80px;
        height: 80px;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        text-align: center;
      }
      
      .badge-icon {
        width: 64px;
        height: 64px;
        border-radius: 50%;
        display: flex;
        justify-content: center;
        align-items: center;
        margin-bottom: 0.5rem;
        font-size: 2rem;
        color: white;
        background-color: #4a90e2;
      }
      
      .badge-name {
        font-size: 0.8rem;
        color: #666;
        max-width: 80px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      
      .modal-actions {
        padding: 16px;
        border-top: 1px solid #f0f0f0;
        text-align: center;
      }
      
      .action-button {
        padding: 12px 24px;
        border: none;
        border-radius: 8px;
        cursor: pointer;
        font-weight: 600;
        font-size: 1rem;
        transition: background-color 0.2s ease;
        color: white;
      }
      
      .action-button:hover {
        opacity: 0.9;
      }
      
      /* Confetti animation for level completion */
      .confetti-container {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        pointer-events: none;
        overflow: hidden;
        z-index: 1;
      }
      
      .confetti {
        position: absolute;
        width: 10px;
        height: 10px;
        background-color: #f0f0f0;
        opacity: 0.8;
        animation: confetti-fall 3s ease-in-out forwards;
      }
      
      @keyframes confetti-fall {
        0% { transform: translateY(-10px) rotate(0deg); }
        100% { transform: translateY(100vh) rotate(720deg); }
      }
    `;
    
    // Get the button color based on tea category
    const buttonColor = this._teaData ? this._getCategoryColor(this._teaData.category) : '#4a90e2';
    
    // Generate confetti elements if the level is complete or a level-up
    const confettiElements = (this._isComplete || this._isLevelUp) ? this._generateConfetti(20, buttonColor) : '';
    
    // Determine the message class based on whether it's a level-up, completion, or regular addition
    let messageClass = 'progress-message';
    if (this._isLevelUp) {
      messageClass += ' success-message';
    } else if (this._isComplete) {
      messageClass += ' level-up-message';
    }
    
    // Determine modal title based on context
    let modalTitle = 'Tea Added';
    if (this._isLevelUp) {
      modalTitle = 'Level Up!';
    } else if (this._isComplete) {
      modalTitle = 'Collection Complete!';
    }
    
    // Generate progress bar based on category progress
    const progressBarHtml = this._renderProgressBar();
    
    this.shadowRoot.innerHTML = `
      <style>${styles}</style>
      
      <div class="modal-container">
        ${(this._isComplete || this._isLevelUp) ? `<div class="confetti-container">${confettiElements}</div>` : ''}
      
        <div class="modal-header">
          <h2 class="modal-title">${modalTitle}</h2>
          <button class="close-button" aria-label="Close">&times;</button>
        </div>
        
        <div class="modal-content">
          ${this._teaData ? `
            <div class="tea-info">
              <div class="tea-icon" style="background-color: ${this._getCategoryColor(this._teaData.category)}; color: white;">
                🍵
              </div>
              <div class="tea-details">
                <p class="tea-name">${this._teaData.name}</p>
                <p class="tea-category">${this._teaData.category} Tea • ${this._teaData.origin || 'Unknown Origin'}</p>
              </div>
            </div>
          ` : ''}
          
          <div class="${messageClass}">
            ${this._progressMessage}
          </div>
          
          ${this._categoryProgress ? `
            <div class="progress-section">
              ${progressBarHtml}
            </div>
          ` : ''}
          
          ${this._badges && this._badges.length > 0 ? `
            <div class="badges-section">
              <h3 class="badges-title">Badges Earned</h3>
              <div class="badges-grid">
                ${this._badges.map(badge => `
                  <div class="badge">
                    <div class="badge-icon" style="background-color: ${badge.color || buttonColor};">
                      ${badge.icon || '🏆'}
                    </div>
                    <div class="badge-name">${badge.name}</div>
                  </div>
                `).join('')}
              </div>
            </div>
          ` : ''}
        </div>
        
        <div class="modal-actions">
          <button class="action-button" style="background-color: ${buttonColor};">
            Continue
          </button>
        </div>
      </div>
    `;
    
    this._addEventListeners();
  }
  
  // Helper to generate confetti elements
  _generateConfetti(count, color) {
    const confettiHtml = [];
    const colors = [color, '#FFC107', '#4CAF50', '#2196F3', '#9C27B0'];
    
    for (let i = 0; i < count; i++) {
      const size = Math.floor(Math.random() * 10) + 5; // 5-15px
      const confettiColor = colors[Math.floor(Math.random() * colors.length)];
      const left = Math.random() * 100;
      const delay = Math.random() * 2;
      const rotation = Math.random() * 360;
      
      confettiHtml.push(`
        <div class="confetti" style="
          width: ${size}px;
          height: ${size}px;
          left: ${left}%;
          background-color: ${confettiColor};
          animation-delay: ${delay}s;
          transform: rotate(${rotation}deg);
        "></div>
      `);
    }
    
    return confettiHtml.join('');
  }
}

customElements.define('progress-modal', ProgressModal);

export default ProgressModal;
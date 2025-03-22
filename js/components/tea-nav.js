// components/tea-nav.js
// Bottom navigation bar component with timer functionality

import { teaEvents, TeaEventTypes } from '../services/event-manager.js';
import TeaTheme from '../utils/tea-theme.js';

class TeaNav extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    
    // Better state management
    this._state = {
      activeTab: 'collection',
      timer: {
        active: false,
        running: false,
        seconds: 180,
        interval: null
      },
      modal: {
        open: false,
        content: ''
      },
      currentTea: {
        category: '',
        name: 'Tea'
      }
    };
    
    // Bind methods
    this._handleTabClick = this._handleTabClick.bind(this);
    this._toggleTimer = this._toggleTimer.bind(this);
    this._resetTimer = this._resetTimer.bind(this);
    this._adjustTimer = this._adjustTimer.bind(this);
    this._closeModal = this._closeModal.bind(this);
    this._usePreset = this._usePreset.bind(this);
  }

  connectedCallback() {
    // Initial render
    this.render();
    
    // Add event listeners
    this._addEventListeners();
    
    // Listen for steeping events
    teaEvents.on(TeaEventTypes.STEEP_STARTED, this._handleSteepStart.bind(this));
  }
  
  disconnectedCallback() {
    this._removeEventListeners();
    this._clearTimerInterval();
    
    // Clean up event listeners
    teaEvents.off(TeaEventTypes.STEEP_STARTED, this._handleSteepStart);
  }
  
  // Timer methods
  startTimer(teaName, category, seconds) {
    this._state.currentTea = { 
      name: teaName || 'Tea', 
      category: category || '' 
    };
    
    this._state.timer.seconds = seconds || 180;
    this._state.timer.active = true;
    this._state.timer.running = true;
    
    this._clearTimerInterval();
    this._state.timer.interval = setInterval(() => {
      this._state.timer.seconds--;
      
      if (this._state.timer.seconds <= 0) {
        this._state.timer.running = false;
        this._clearTimerInterval();
        this._notifyTimerComplete();
      }
      
      this._updateTimerDisplay();
    }, 1000);
    
    this._updateTimerDisplay();
    this.render();
  }
  
  pauseTimer() {
    this._state.timer.running = false;
    this._clearTimerInterval();
    this._updateTimerDisplay();
  }
  
  resumeTimer() {
    if (this._state.timer.active && !this._state.timer.running && this._state.timer.seconds > 0) {
      this._state.timer.running = true;
      
      this._clearTimerInterval();
      this._state.timer.interval = setInterval(() => {
        this._state.timer.seconds--;
        
        if (this._state.timer.seconds <= 0) {
          this._state.timer.running = false;
          this._clearTimerInterval();
          this._notifyTimerComplete();
        }
        
        this._updateTimerDisplay();
      }, 1000);
      
      this._updateTimerDisplay();
    }
  }
  
  resetTimer() {
    this._state.timer.seconds = 180; // 3 minutes default
    this._state.timer.running = false;
    this._clearTimerInterval();
    this._updateTimerDisplay();
  }
  
  _clearTimerInterval() {
    if (this._state.timer.interval) {
      clearInterval(this._state.timer.interval);
      this._state.timer.interval = null;
    }
  }
  
  _updateTimerDisplay() {
    // Find timer elements and update them
    const miniTimerText = this.shadowRoot.querySelector('.timer-mini-time');
    const timerDisplay = this.shadowRoot.querySelector('.timer-display');
    
    if (miniTimerText) {
      miniTimerText.textContent = this._formatTime(this._state.timer.seconds);
    }
    
    if (timerDisplay) {
      timerDisplay.textContent = this._formatTime(this._state.timer.seconds);
      
      // Update progress bar if present
      const progressBar = this.shadowRoot.querySelector('.timer-progress-bar');
      if (progressBar) {
        // Calculate percentage based on original timer duration
        const percentage = (this._state.timer.seconds / 180) * 100;
        progressBar.style.width = `${percentage}%`;
      }
    }
  }
  
  _formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  
  _notifyTimerComplete() {
    // Use event manager
    teaEvents.emit(TeaEventTypes.TIMER_COMPLETED, {
      teaName: this._state.currentTea.name,
      category: this._state.currentTea.category
    });
    
    // Play sound, show notification (browser notification if allowed)
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('Tea Timer', {
        body: `Your ${this._state.currentTea.name} is ready!`,
        icon: '/assets/icons/icon-192x192.png'
      });
    }
    
    // Try to vibrate
    if ('vibrate' in navigator) {
      navigator.vibrate([200, 100, 200]);
    }
    
    // Play sound
    this._playTimerSound();
  }
  
  _playTimerSound() {
    try {
      const sound = new Audio('/assets/sounds/notification.mp3');
      sound.play();
    } catch (error) {
      console.error('Error playing notification sound:', error);
    }
  }
  
  _handleSteepStart(event) {
    const { tea } = event;
    if (tea) {
      const brewTimeSeconds = this._parseBrewTime(tea.brewTime);
      this.startTimer(tea.name, tea.category, brewTimeSeconds);
    }
  }
  
  _parseBrewTime(brewTime) {
    if (!brewTime) return 180; // Default 3 minutes
    
    // Check if it's in MM:SS format
    if (typeof brewTime === 'string' && brewTime.includes(':')) {
      const [minutes, seconds] = brewTime.split(':').map(part => parseInt(part, 10));
      return (minutes * 60) + (seconds || 0);
    }
    
    // If it's just seconds (for gongfu brewing)
    return parseInt(brewTime, 10) || 180;
  }
  // UI event handlers
  _handleTabClick(event) {
    const tabName = event.currentTarget.dataset.tab;
    if (tabName) {
      this._state.activeTab = tabName;
      
      // If it's a modal tab, open the modal with appropriate content
      if (['timer', 'settings', 'favorites'].includes(tabName)) {
        this._state.modal.content = tabName;
        this._state.modal.open = true;
      }
      
      this.render();
      
      // Dispatch event for tab change
      teaEvents.emit(TeaEventTypes.TAB_CHANGED, { tab: tabName });
    }
  }
  
  _toggleTimer() {
    if (this._state.timer.running) {
      this.pauseTimer();
    } else {
      this.resumeTimer();
    }
    this.render();
  }
  
  _resetTimer() {
    this.resetTimer();
    this.render();
  }
  
  _adjustTimer(seconds) {
    this._state.timer.seconds = Math.max(0, this._state.timer.seconds + seconds);
    this._updateTimerDisplay();
  }
  
  _usePreset(seconds) {
    this._state.timer.seconds = seconds;
    this._state.timer.running = false;
    this._clearTimerInterval();
    this._updateTimerDisplay();
  }
  
  _closeModal() {
    this._state.modal.open = false;
    
    // Reset to collection tab if not timer
    if (this._state.activeTab !== 'collection' && this._state.activeTab !== 'timer') {
      this._state.activeTab = 'collection';
    }
    
    this.render();
  }
  
  _addEventListeners() {
    // Add listeners for tabs
    const tabs = this.shadowRoot.querySelectorAll('.nav-tab');
    tabs.forEach(tab => {
      tab.addEventListener('click', this._handleTabClick);
    });
    
    // Timer controls if present
    const startPauseBtn = this.shadowRoot.querySelector('.timer-start-pause');
    if (startPauseBtn) {
      startPauseBtn.addEventListener('click', this._toggleTimer);
    }
    
    const resetBtn = this.shadowRoot.querySelector('.timer-reset');
    if (resetBtn) {
      resetBtn.addEventListener('click', this._resetTimer);
    }
    
    // Timer adjustment buttons
    const minusBtn = this.shadowRoot.querySelector('.timer-minus');
    if (minusBtn) {
      minusBtn.addEventListener('click', () => this._adjustTimer(-30));
    }
    
    const plusBtn = this.shadowRoot.querySelector('.timer-plus');
    if (plusBtn) {
      plusBtn.addEventListener('click', () => this._adjustTimer(30));
    }
    
    // Close modal button
    const closeBtn = this.shadowRoot.querySelector('.modal-close');
    if (closeBtn) {
      closeBtn.addEventListener('click', this._closeModal);
    }
    
    // Preset buttons
    const presetBtns = this.shadowRoot.querySelectorAll('.timer-preset-btn');
    presetBtns.forEach(btn => {
      const seconds = parseInt(btn.dataset.seconds || '180', 10);
      btn.addEventListener('click', () => this._usePreset(seconds));
    });
  }
  
  _removeEventListeners() {
    // Clean up event listeners (simplified version)
    this._clearTimerInterval();
  }
  
  _getCategoryColor(category) {
    // Use theme utility
    return TeaTheme.getColor(category, false);
  }
  
  render() {
    // Get the color for the current tea category
    const categoryColor = this._getCategoryColor(this._state.currentTea.category);
    
    const styles = `
      :host {
        display: block;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      }
      
      .tea-nav {
        position: fixed;
        bottom: 0;
        left: 0;
        right: 0;
        background-color: white;
        box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.1);
        z-index: 1000;
      }
      
      .timer-mini {
        display: ${this._state.timer.active ? 'flex' : 'none'};
        height: 28px;
        align-items: center;
        justify-content: center;
        background-color: ${categoryColor};
        color: white;
        font-size: 0.875rem;
      }
      
      .timer-mini-status {
        margin-right: 8px;
      }
      
      .timer-mini-time {
        font-family: monospace;
        font-weight: 500;
      }
      
      .nav-tabs {
        display: flex;
        height: 64px;
      }
      
      .nav-tab {
        flex: 1;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        color: #777;
        transition: color 0.2s ease;
        cursor: pointer;
      }
      
      .nav-tab.active {
        color: ${this._state.activeTab === 'timer' ? categoryColor : '#4a90e2'};
      }
      
      .nav-tab-icon {
        width: 24px;
        height: 24px;
        margin-bottom: 4px;
      }
      
      .nav-tab-label {
        font-size: 0.75rem;
      }
      
      .modal-overlay {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background-color: rgba(0, 0, 0, 0.5);
        z-index: 1100;
        display: ${this._state.modal.open ? 'flex' : 'none'};
        align-items: flex-end;
        justify-content: center;
      }
      
      .modal-content {
        width: 100%;
        max-width: 100%;
        max-height: 85vh;
        overflow-y: auto;
        background-color: white;
        border-top-left-radius: 16px;
        border-top-right-radius: 16px;
        padding-bottom: env(safe-area-inset-bottom, 0);
      }
      
      .modal-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 16px;
        border-bottom: 1px solid #eee;
      }
      
      .modal-title {
        font-size: 1.25rem;
        font-weight: 500;
        margin: 0;
      }
      
      .modal-close {
        background: none;
        border: none;
        padding: 8px;
        cursor: pointer;
        color: #666;
      }
      
      .modal-body {
        padding: 16px;
      }
      
      /* Timer Modal Styles */
      .timer-display-container {
        display: flex;
        flex-direction: column;
        align-items: center;
        margin-bottom: 24px;
      }
      
      .timer-progress {
        width: 100%;
        height: 6px;
        background-color: #f0f0f0;
        border-radius: 3px;
        overflow: hidden;
        margin-bottom: 16px;
      }
      
      .timer-progress-bar {
        height: 100%;
        background-color: ${categoryColor};
        width: ${(this._state.timer.seconds / 180) * 100}%;
        transition: width 1s linear;
      }
      
      .timer-display {
        font-size: 3rem;
        font-weight: 300;
        color: ${categoryColor};
        font-family: monospace;
        margin-bottom: 16px;
      }
      
      .timer-adjust-buttons {
        display: flex;
        gap: 16px;
        margin-bottom: 24px;
        justify-content: center;
      }
      
      .timer-minus, .timer-plus {
        padding: 8px 16px;
        background-color: #f5f5f5;
        border: 1px solid #ddd;
        border-radius: 20px;
        font-size: 0.875rem;
      }
      
      .timer-control-buttons {
        display: flex;
        gap: 16px;
        margin-bottom: 24px;
        justify-content: center;
      }
      
      .timer-start-pause {
        padding: 12px 24px;
        background-color: ${this._state.timer.running ? '#FF9800' : categoryColor};
        color: white;
        border: none;
        border-radius: 8px;
        font-weight: 500;
      }
      
      .timer-reset {
        padding: 12px 24px;
        background-color: #f0f0f0;
        color: #555;
        border: none;
        border-radius: 8px;
        font-weight: 500;
      }
      
      .timer-presets {
        background-color: #f8f8f8;
        padding: 16px;
        border-radius: 8px;
      }
      
      .timer-presets-title {
        font-weight: 500;
        margin-bottom: 12px;
      }
      
      .timer-presets-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 8px;
      }
      
      .timer-preset-btn {
        padding: 8px;
        background-color: white;
        border: 1px solid #ddd;
        border-radius: 4px;
        text-align: center;
        font-size: 0.875rem;
      }
      
      /* Settings Modal Styles */
      .settings-section {
        margin-bottom: 24px;
        padding-bottom: 16px;
        border-bottom: 1px solid #eee;
      }
      
      .settings-section:last-child {
        border-bottom: none;
      }
      
      .settings-title {
        font-weight: 500;
        margin-bottom: 12px;
      }
      
      .setting-toggle {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 8px;
      }
      
      .toggle-switch {
        position: relative;
        display: inline-block;
        width: 50px;
        height: 24px;
        background-color: #ddd;
        border-radius: 12px;
      }
      
      .toggle-switch.active {
        background-color: #4a90e2;
      }
      
      .toggle-slider {
        position: absolute;
        top: 2px;
        left: ${this._state.activeTab === 'timer' ? '26px' : '2px'};
        width: 20px;
        height: 20px;
        background-color: white;
        border-radius: 50%;
        transition: left 0.3s ease;
      }
      
      .sign-in-button {
        width: 100%;
        padding: 12px;
        background-color: #4a90e2;
        color: white;
        border: none;
        border-radius: 8px;
        font-weight: 500;
      }
      
      /* Favorites Modal Styles */
      .favorites-search {
        position: relative;
        margin-bottom: 16px;
      }
      
      .favorites-search-input {
        width: 100%;
        padding: 8px 8px 8px 36px;
        border: 1px solid #ddd;
        border-radius: 8px;
        font-size: 0.875rem;
      }
      
      .search-icon {
        position: absolute;
        top: 8px;
        left: 10px;
        color: #999;
      }
      
      .favorites-list {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }
      
      .favorite-item {
        display: flex;
        align-items: center;
        padding: 12px;
        background-color: #f8f8f8;
        border-radius: 8px;
      }
      
      .favorite-color {
        width: 40px;
        height: 40px;
        border-radius: 50%;
        margin-right: 12px;
        flex-shrink: 0;
      }
      
      .favorite-details {
        flex-grow: 1;
      }
      
      .favorite-name {
        font-weight: 500;
        margin-bottom: 2px;
      }
      
      .favorite-meta {
        font-size: 0.75rem;
        color: #666;
      }
      
      .favorite-star {
        color: #F1C40F;
        width: 20px;
        height: 20px;
      }
    `;
    
    this.shadowRoot.innerHTML = `
      <style>${styles}</style>
      <nav class="tea-nav">
        <!-- Mini Timer Display - Shows when timer is active -->
        <div class="timer-mini">
          <span class="timer-mini-status">
            ${this._state.timer.running ? 'Brewing' : 'Paused'}
          </span>
          <span class="timer-mini-time">
            ${this._formatTime(this._state.timer.seconds)}
          </span>
        </div>
        
        <!-- Main Navigation Tabs -->
        <div class="nav-tabs">
          <div class="nav-tab ${this._state.activeTab === 'collection' ? 'active' : ''}" data-tab="collection">
            <svg class="nav-tab-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
              <polyline points="9 22 9 12 15 12 15 22"></polyline>
            </svg>
            <span class="nav-tab-label">Collection</span>
          </div>
          
          <div class="nav-tab ${this._state.activeTab === 'favorites' ? 'active' : ''}" data-tab="favorites">
            <svg class="nav-tab-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
            </svg>
            <span class="nav-tab-label">Favorites</span>
          </div>
          
          <div class="nav-tab ${this._state.activeTab === 'timer' ? 'active' : ''}" data-tab="timer">
            <svg class="nav-tab-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <polyline points="12 6 12 12 16 14"></polyline>
            </svg>
            <span class="nav-tab-label">Timer</span>
            ${this._state.timer.active ? '<span class="timer-indicator"></span>' : ''}
          </div>
          
          <div class="nav-tab ${this._state.activeTab === 'settings' ? 'active' : ''}" data-tab="settings">
            <svg class="nav-tab-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="3"></circle>
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
            </svg>
            <span class="nav-tab-label">Settings</span>
          </div>
        </div>
      </nav>
      
      <!-- Modal Overlay -->
      <div class="modal-overlay">
        <div class="modal-content">
          <!-- Modal Header -->
          <div class="modal-header">
            <h2 class="modal-title">
              ${this._state.modal.content === 'timer' ? 'Tea Timer' : 
                this._state.modal.content === 'settings' ? 'Settings' : 'Favorites'}
            </h2>
            <button class="modal-close">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>
          
          <!-- Modal Body -->
          <div class="modal-body">
            ${this._state.modal.content === 'timer' ? `
              <div class="timer-display-container">
                <div class="timer-progress">
                  <div class="timer-progress-bar"></div>
                </div>
                <div class="timer-display">${this._formatTime(this._state.timer.seconds)}</div>
                
                <div class="timer-adjust-buttons">
                  <button class="timer-minus">-30s</button>
                  <button class="timer-plus">+30s</button>
                </div>
                
                <div class="timer-control-buttons">
                  <button class="timer-start-pause">
                    ${this._state.timer.running ? 'Pause' : 'Start'}
                  </button>
                  <button class="timer-reset">Reset</button>
                </div>
                
                <div class="timer-presets">
                  <div class="timer-presets-title">Quick Presets</div>
                  <div class="timer-presets-grid">
                    <button class="timer-preset-btn" data-seconds="150">Green Tea (2:30)</button>
                    <button class="timer-preset-btn" data-seconds="210">Black Tea (3:30)</button>
                    <button class="timer-preset-btn" data-seconds="180">Oolong (3:00)</button>
                    <button class="timer-preset-btn" data-seconds="240">Pu-erh (4:00)</button>
                  </div>
                </div>
              </div>
            ` : this._state.modal.content === 'settings' ? `
              <div class="settings-section">
                <div class="settings-title">Display Settings</div>
                <div class="setting-toggle">
                  <span>Dark Mode</span>
                  <div class="toggle-switch">
                    <div class="toggle-slider"></div>
                  </div>
                </div>
              </div>
              
              <div class="settings-section">
                <div class="settings-title">Timer Settings</div>
                <div class="setting-toggle">
                  <span>Sound Notifications</span>
                  <div class="toggle-switch active">
                    <div class="toggle-slider" style="left: 26px"></div>
                  </div>
                </div>
                <div class="setting-toggle">
                  <span>Vibration</span>
                  <div class="toggle-switch active">
                    <div class="toggle-slider" style="left: 26px"></div>
                  </div>
                </div>
              </div>
              
              <div class="settings-section">
                <div class="settings-title">Account</div>
                <button class="sign-in-button">Sign In</button>
              </div>
              
              <div class="settings-section">
                <div class="settings-title">About</div>
                <p>Tea Collection App v1.0.0<br>© 2025 All Rights Reserved</p>
              </div>
              ` : `
              <div class="favorites-search">
                <input type="text" class="favorites-search-input" placeholder="Search favorites...">
                <svg class="search-icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <circle cx="11" cy="11" r="8"></circle>
                  <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                </svg>
              </div>
              
              <div class="favorites-list">
                <div class="favorite-item">
                  <div class="favorite-color" style="background-color: #7B9070;"></div>
                  <div class="favorite-details">
                    <div class="favorite-name">Dragon Well</div>
                    <div class="favorite-meta">Green • Hangzhou, China</div>
                  </div>
                  <svg class="favorite-star" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="0">
                    <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"></path>
                  </svg>
                </div>
                
                <div class="favorite-item">
                  <div class="favorite-color" style="background-color: #D8DCD5;"></div>
                  <div class="favorite-details">
                    <div class="favorite-name">Silver Needle</div>
                    <div class="favorite-meta">White • Fujian, China</div>
                  </div>
                  <svg class="favorite-star" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="0">
                    <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"></path>
                  </svg>
                </div>
                
                <div class="favorite-item">
                  <div class="favorite-color" style="background-color: #C09565;"></div>
                  <div class="favorite-details">
                    <div class="favorite-name">Da Hong Pao</div>
                    <div class="favorite-meta">Oolong • Wuyi, China</div>
                  </div>
                  <svg class="favorite-star" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="0">
                    <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"></path>
                  </svg>
                </div>
              </div>
            `}
          </div>
        </div>
      </div>
    `;
    
    // Reattach event listeners after render
    this._addEventListeners();
  }
}

customElements.define('tea-nav', TeaNav);

export default TeaNav;
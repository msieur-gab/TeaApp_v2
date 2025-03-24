// app.js - Main application logic with integrated theming and NFC support

// Import Services
import TeaDatabase from './services/tea-database.js';
import TeaCollectionLevels from './services/tea-collection-levels.js';
import { teaEvents, TeaEventTypes } from './services/event-manager.js';
import nfcHandler from './services/nfc-handler.js';
import qrScannerHandler from './services/qr-scanner-handler.js';


// Import Theme Utilities
import TeaTheme from './utils/tea-theme.js';
import { TeaThemeGenerator } from './utils/theme-generator.js';

// App version constants
const APP_VERSION = 'v1.2.0'; // Updated version with NFC support
const APP_BUILD_DATE = '2025-03-24';

class TeaApp {
  constructor() {
    // Elements
    this.categoryPills = document.querySelectorAll('.category-pill');
    this.teaCollection = document.querySelector('tea-collection');
    this.teaDetail = document.querySelector('tea-detail');
    this.teaNav = document.querySelector('tea-nav');
    this.progressModal = document.querySelector('progress-modal');
    this.loader = document.getElementById('loader');
    this.notification = document.getElementById('notification');
    this.addTeaButton = document.getElementById('addTeaButton');
    this.teaAddModal = document.querySelector('tea-add-modal');
    
    // Tea file path settings
    this.teaFolder = 'tea/';
    
    // State
    this.currentCategory = 'Green';
    
    // Initialize
    this.init();
  }

  async init() {
    this.showLoader();
    
    try {
      // Initialize database
      await TeaDatabase.init();
      
      // Initialize theme system
      TeaTheme.init();
      
      // Set up event listeners
      this.setupEventListeners();
      
      // Load initial data
      await this.loadInitialData();
      
      // Apply initial theme based on starting category
      TeaTheme.setTheme(this.currentCategory);
      
      // Display version
      this.displayAppVersion();
      
      this.hideLoader();
      this.showNotification('Ready! Explore your tea collection or add new teas.', 3000);
    } catch (error) {
      console.error('Failed to initialize app:', error);
      this.hideLoader();
      this.showNotification('Error initializing app. Please refresh.', 5000);
    }
  }
  
  setupEventListeners() {
    // Category selection with source attribution
    this.categoryPills.forEach(pill => {
      pill.addEventListener('click', event => {
        const category = event.target.dataset.category;
        
        // Only proceed if this is not already the active category
        if (category !== this.currentCategory) {
          console.log(`Category pill clicked: ${category}`);
          
          // Change category with source='category-pill'
          this.changeCategory(category, 'category-pill');
        }
      });
    });

    // Add tea button
    if (this.addTeaButton) {
      this.addTeaButton.addEventListener('click', () => {
        if (this.teaAddModal) {
          this.teaAddModal.style.display = 'block';
          teaEvents.emit(TeaEventTypes.MODAL_OPENED, { id: 'addTeaModal' });
        }
      });
    }
    
    // Handle tea-add-modal events
    if (this.teaAddModal) {
      // Handle form submission
      this.teaAddModal.addEventListener('tea-add-submit', this.handleAddTeaSubmit.bind(this));
      
      // Handle NFC scan
      this.teaAddModal.addEventListener('tea-nfc-scanned', this.handleNfcScan.bind(this));
      // Handle QR scan
      this.teaAddModal.addEventListener('tea-qr-scanned', this.handleQrScan.bind(this));

      // Handle modal close
      this.teaAddModal.addEventListener('tea-add-close', () => {
        this.teaAddModal.style.display = 'none';
        teaEvents.emit(TeaEventTypes.MODAL_CLOSED, { id: 'addTeaModal' });
      });
    }
    
    // Setup global event listeners via the event manager
    teaEvents.on(TeaEventTypes.TEA_SELECTED, this.handleTeaSelect.bind(this));
    teaEvents.on(TeaEventTypes.STEEP_STARTED, this.handleSteepingStart.bind(this));
    teaEvents.on(TeaEventTypes.TIMER_COMPLETED, this.handleTimerComplete.bind(this));
    teaEvents.on(TeaEventTypes.TEA_ADDED, this.handleTeaAdded.bind(this));
    teaEvents.on(TeaEventTypes.CATEGORY_CHANGED, this.handleCategoryChange.bind(this));

    // Listen for theme changes
    document.addEventListener('tea-theme-changed', this.handleThemeChange.bind(this));
    
    // Legacy event listeners (keeping these for backward compatibility with existing components)
    document.addEventListener('tea-select', (event) => {
      teaEvents.emit(TeaEventTypes.TEA_SELECTED, event.detail);
    });
    
    document.addEventListener('start-steeping', (event) => {
      teaEvents.emit(TeaEventTypes.STEEP_STARTED, event.detail);
    });
    
    document.addEventListener('timer-complete', (event) => {
      teaEvents.emit(TeaEventTypes.TIMER_COMPLETED, event.detail);
    });
    
    document.addEventListener('tea-added', (event) => {
      teaEvents.emit(TeaEventTypes.TEA_ADDED, event.detail);
    });
    
    // Progress modal events
    if (this.progressModal) {
      this.progressModal.addEventListener('modal-closed', () => {
        teaEvents.emit(TeaEventTypes.MODAL_CLOSED, { id: 'progressModal' });
      });
    }
  }
  
  async loadInitialData() {
    // If database is empty, add demo data
    const count = await TeaDatabase.getTeasCount();
    
    if (count === 0) {
      console.log('Database is empty, no demo data loaded');
      // You could implement demo data loading here if desired
    }
  }

  changeCategory(category, source = 'app') {
    if (category === this.currentCategory) return;
    
    console.log(`Changing category to ${category} from source: ${source}`);
    
    // Update active pill - regardless of source
    this.updateActivePill(category);
    
    // Apply theme based on category
    TeaTheme.setTheme(category);
    
    // Update tea collection
    if (this.teaCollection) {
      this.teaCollection.category = category;
    }
    
    // Update state
    this.currentCategory = category;
    
    // Only emit event if we're the source (to prevent loops)
    // Other components already emitted their own events
    if (source === 'app') {
      console.log(`App emitting category change: ${category}`);
      teaEvents.emit(TeaEventTypes.CATEGORY_CHANGED, { 
        category,
        source: 'app'
      });
    }
  }

  // Update active pill UI
  updateActivePill(category) {
    console.log(`Updating active pill to: ${category}`);
    this.categoryPills.forEach(pill => {
      if (pill.dataset.category === category) {
        pill.classList.add('active');
        // Use TeaTheme to apply the appropriate styling
        TeaTheme.applyTheme(pill, category, { useBackground: true });
      } else {
        pill.classList.remove('active');
        pill.style.backgroundColor = '';
        pill.style.color = '';
      }
    });
  }
  
  async handleQrScan(event) {
    // This can actually use the same handler as NFC scanning since the data format is the same
    return this.handleNfcScan(event);
  }

  // Handle NFC scan event from the tea-add-modal
  async handleNfcScan(event) {
    try {
      this.showLoader();
      // Extract the tea URL from the NFC tag
      const teaUrl = event.detail.url;
      
      // Fetch the tea data
      const response = await fetch(teaUrl);
      if (!response.ok) {
        throw new Error(`Failed to load tea data from NFC tag: ${response.status}`);
      }
      
      const teaData = await response.json();
      
      // Add the tea to the collection
      await this.handleTeaLoaded(teaData);
      
      this.hideLoader();
      this.showNotification(`Added ${teaData.name} to your collection!`, 3000);
    } catch (error) {
      console.error('Error processing NFC tag:', error);
      this.hideLoader();
      this.showNotification('Failed to load tea data from NFC tag', 3000);
    }
  }

  // Event handlers
  handleCategoryChange(event) {
    console.log(`App received category change: ${event.category} from: ${event.source}`);
    
    // Only respond if it wasn't triggered by app itself
    if (event.source !== 'app') {
      // Change the category but don't re-emit the event
      this.changeCategory(event.category, event.source);
    }
  }
  
  handleThemeChange(event) {
    // You can respond to theme changes here if needed
    console.log(`Theme changed to ${event.detail.category}`);
    
    // Update UI elements that might need theme-specific handling
    this.updateUIWithTheme(event.detail.category, event.detail.colors);
  }
  
  // Update UI elements with new theme colors
  updateUIWithTheme(category, colors) {
    // Update add tea button color
    if (this.addTeaButton) {
      this.addTeaButton.style.backgroundColor = colors['--tea-primary-color'];
      this.addTeaButton.style.color = colors['--tea-text-on-primary'];
    }
    
    // Other dynamic theme updates can be added here
  }
  
  async handleAddTeaSubmit(event) {
    // Extract data from the custom event
    const { teaId, teaName, teaCategory, teaOrigin } = event.detail;
    
    // Show loader
    this.showLoader();
    
    try {
      if (teaId) {
        // If tea ID is provided, try to load from file
        await this.loadTeaFromId(teaId);
      } else if (teaName) {
        // If manual entry, create and add tea
        await this.addManualTea(teaName, teaCategory, teaOrigin);
      } else {
        this.showNotification('Please enter either a Tea ID or Tea Name', 3000);
        this.hideLoader();
        return;
      }
    } catch (error) {
      console.error('Error adding tea:', error);
      this.showNotification('Failed to add tea. Please try again.', 3000);
      this.hideLoader();
    }
  }

  async loadTeaFromId(teaId) {
    try {
      // Try with .cha extension by default
      let teaData = null;
      let response = null;

      // Show a notification that we're looking for the tea
      this.showNotification('Loading tea data...', 1000);

      try {
        // Try with .cha extension first
        const baseUrl = this.getBaseUrl();
        const teaUrl = `${baseUrl}${this.teaFolder}${teaId}.cha`;
        
        response = await fetch(teaUrl);
        if (response.ok) {
          teaData = await response.json();
        }
      } catch (err) {
        console.log('Tea not found with .cha extension, trying .json');
      }

      // If .cha failed, try .json
      if (!teaData) {
        try {
          const baseUrl = this.getBaseUrl();
          const teaUrl = `${baseUrl}${this.teaFolder}${teaId}.json`;
          
          response = await fetch(teaUrl);
          if (response.ok) {
            teaData = await response.json();
          }
        } catch (err) {
          console.log('Tea not found with .json extension either');
        }
      }
      
      if (!teaData) {
        throw new Error(`Tea with ID ${teaId} not found.`);
      }
      
      return await this.handleTeaLoaded(teaData);
      
    } catch (error) {
      console.error('Error loading tea from ID:', error);
      this.showNotification(`Failed to load tea data: ${error.message}`, 3000);
      this.hideLoader();
      throw error;
    }
  }
  
  async handleTeaLoaded(teaData) {
    // Get previous count for this category
    const previousCount = await TeaDatabase.getCategoryTeaCount(teaData.category);
    
    // Add tea to database
    const id = await TeaDatabase.addTea(teaData);
    
    // Get new count
    const newCount = await TeaDatabase.getCategoryTeaCount(teaData.category);
    
    // Check for level-up
    const levelUp = TeaCollectionLevels.checkLevelUp(teaData.category, previousCount, newCount);
    
    // Get category progress information
    const progressInfo = TeaCollectionLevels.getCollectionProgress(teaData.category, newCount);
    
    // Hide loader since we're about to show the modal
    this.hideLoader();
    
    // Use progress modal to show success!
    if (this.progressModal) {
      if (levelUp) {
        // Level-up occurred - show with badges and level-up message
        this.progressModal.show(
          teaData,
          levelUp.message,
          progressInfo.isCollectionComplete,
          levelUp.badges,
          true, // is level up
          progressInfo
        );
        
        // Emit level-up event
        teaEvents.emit(TeaEventTypes.LEVEL_UP, {
          tea: teaData,
          levelUp,
          progressInfo
        });
      } else {
        // No level-up - show regular progress update
        this.progressModal.show(
          teaData,
          `Added ${teaData.name} to your collection!`,
          progressInfo.isCollectionComplete,
          [], // No new badges
          false, // not a level up
          progressInfo
        );
      }
    } else {
      // Fallback to notification if modal not available
      this.showNotification(`Added ${teaData.name} to your collection!`, 3000);
    }
    
    // Update category if needed
    if (teaData.category !== this.currentCategory) {
      this.changeCategory(teaData.category);
    } else if (this.teaCollection) {
      // Just refresh the current category
      this.teaCollection.category = this.currentCategory;
    }
    
    // Emit tea added event
    teaEvents.emit(TeaEventTypes.TEA_ADDED, { tea: teaData });
    
    return id;
  }
  
  async addManualTea(name, category, origin) {
    try {
      // Create basic tea object
      const teaData = {
        name,
        category,
        origin: origin || 'Unknown',
        brewTime: this.getDefaultBrewTime(category),
        temperature: this.getDefaultTemperature(category),
        description: `A ${category.toLowerCase()} tea from ${origin || 'unknown origin'}.`,
        tags: [category.toLowerCase()]
      };
      
      return await this.handleTeaLoaded(teaData);
      
    } catch (error) {
      console.error('Error adding manual tea:', error);
      this.showNotification('Failed to add tea', 3000);
      this.hideLoader();
      throw error;
    }
  }

  handleTeaSelect(data) {
    // Get the tea data from the event
    const teaData = data;
    console.log('Tea selected:', teaData);
    
    // Make sure we have the tea detail component
    if (!this.teaDetail) {
      this.teaDetail = document.querySelector('tea-detail');
      
      // Create the component if it doesn't exist
      if (!this.teaDetail) {
        this.teaDetail = document.createElement('tea-detail');
        document.body.appendChild(this.teaDetail);
        console.log('Created tea detail component');
      }
    }
    
    // Show the tea detail with the data from the event
    // The component will fetch full details if needed
    this.teaDetail.open(teaData);
  }
  
  handleSteepingStart(data) {
    const teaData = data.tea;
    
    // Parse brew time to seconds
    const brewTimeSeconds = this.parseBrewTime(teaData.brewTime);
    
    // Start the timer with the tea nav component
    if (this.teaNav) {
      this.teaNav.startTimer(teaData.name, teaData.category, brewTimeSeconds);
      this.showNotification(`Started brewing ${teaData.name}`, 2000);
    }
  }
  
  handleTimerComplete(data) {
    const teaName = data.teaName;
    this.showNotification(`Your ${teaName} is ready!`, 5000);
  }
  
  handleTeaAdded(data) {
    const tea = data.tea;
    
    // Ensure the collection is refreshed
    if (tea.category === this.currentCategory && this.teaCollection) {
      this.teaCollection.category = this.currentCategory;
    }
  }

  parseBrewTime(brewTime) {
    if (!brewTime) return 180; // Default 3 minutes
    
    // Check if it's in MM:SS format
    if (typeof brewTime === 'string' && brewTime.includes(':')) {
      const [minutes, seconds] = brewTime.split(':').map(part => parseInt(part, 10));
      return (minutes * 60) + (seconds || 0);
    }
    
    // If it's just seconds (for gongfu brewing)
    return parseInt(brewTime, 10) || 180;
  }
  
  getDefaultBrewTime(category) {
    const defaults = {
      'Green': '2:30',
      'Black': '3:30',
      'Oolong': '3:15',
      'White': '3:00',
      'Pu-erh': '4:00',
      'Yellow': '2:45',
      'Herbal': '5:00'
    };
    
    return defaults[category] || '3:00';
  }
  
  getDefaultTemperature(category) {
    const defaults = {
      'Green': '80°C',
      'Black': '95°C',
      'Oolong': '90°C',
      'White': '80°C',
      'Pu-erh': '95°C',
      'Yellow': '80°C',
      'Herbal': '100°C'
    };
    
    return defaults[category] || '85°C';
  }
  
  getBaseUrl() {
    const url = new URL(window.location.href);
    let pathname = url.pathname;
    
    // Remove index.html or other files from the path
    pathname = pathname.replace(/\/[^\/]*\.[^\/]*$/, '/');
    
    // Ensure the path ends with a slash
    if (!pathname.endsWith('/')) {
      pathname += '/';
    }
    
    return url.origin + pathname;
  }
  
  displayAppVersion() {
    // Create version display element if it doesn't exist
    let versionDisplay = document.querySelector('.version-display');
    
    if (!versionDisplay) {
      versionDisplay = document.createElement('div');
      versionDisplay.className = 'version-display';
      document.body.appendChild(versionDisplay);
    }
    
    versionDisplay.textContent = APP_VERSION;
    versionDisplay.title = `Build: ${APP_BUILD_DATE}`;
    versionDisplay.setAttribute('data-expanded', 'false');
    
    // Set up variables for double-tap detection
    let lastTap = 0;
    
    // Add tap/click functionality
    versionDisplay.addEventListener('click', (event) => {
      const currentTime = new Date().getTime();
      const tapLength = currentTime - lastTap;
      
      // Check for double-tap
      if (tapLength < 500 && tapLength > 0) {
        // Double tap detected
        event.preventDefault();
        
        // Show confirmation
        if (confirm('Force reload the application?')) {
          window.location.reload(true);
        }
      } else {
        // Single tap - just toggle expanded view
        const isExpanded = versionDisplay.getAttribute('data-expanded') === 'true';
        
        if (isExpanded) {
          versionDisplay.textContent = APP_VERSION;
          versionDisplay.setAttribute('data-expanded', 'false');
        } else {
          versionDisplay.textContent = `${APP_VERSION} (${APP_BUILD_DATE})`;
          versionDisplay.setAttribute('data-expanded', 'true');
          
          // Auto-collapse after 3 seconds
          setTimeout(() => {
            versionDisplay.textContent = APP_VERSION;
            versionDisplay.setAttribute('data-expanded', 'false');
          }, 3000);
        }
      }
      
      lastTap = currentTime;
    });
  }
  
  showLoader() {
    if (this.loader) {
      this.loader.classList.add('active');
    }
  }
  
  hideLoader() {
    if (this.loader) {
      this.loader.classList.remove('active');
    }
  }
  
  showNotification(message, duration = 3000) {
    if (this.notification) {
      this.notification.textContent = message;
      this.notification.classList.add('visible');
      
      // Apply theme-based styling to notification
      const currentColor = getComputedStyle(document.documentElement)
        .getPropertyValue('--tea-primary-color').trim();
      
      this.notification.style.backgroundColor = currentColor;
      this.notification.style.color = 
        getComputedStyle(document.documentElement)
          .getPropertyValue('--tea-text-on-primary').trim();
      
      // Emit notification event
      teaEvents.emit(TeaEventTypes.NOTIFICATION_SHOW, { message, duration });
      
      // Hide after duration
      setTimeout(() => {
        this.notification.classList.remove('visible');
      }, duration);
    }
  }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  window.teaApp = new TeaApp();
});

// Register service worker for PWA support
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./service-worker.js')
      .then(registration => {
        console.log('ServiceWorker registration successful:', registration.scope);
      })
      .catch(error => {
        console.log('ServiceWorker registration failed:', error);
      });
  });
}

// Make services globally available for debug/development purposes
window.TeaDatabase = TeaDatabase;
window.TeaEvents = teaEvents;
window.TeaEventTypes = TeaEventTypes;
window.TeaTheme = TeaTheme;
window.TeaThemeGenerator = TeaThemeGenerator;
window.nfcHandler = nfcHandler;
window.qrScannerHandler = qrScannerHandler;


export default TeaApp;
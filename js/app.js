// app.js - Main application logic

// App version constants
const APP_VERSION = 'v1.0.0';
const APP_BUILD_DATE = '2025-03-22';

class TeaApp {
  constructor() {
    // Elements
    this.categoryPills = document.querySelectorAll('.category-pill');
    this.teaCollection = document.querySelector('tea-collection');
    this.teaDetailBottomsheet = document.querySelector('tea-detail-bottomsheet');
    this.teaNav = document.querySelector('tea-nav');
    this.progressModal = document.querySelector('progress-modal');
    this.loader = document.getElementById('loader');
    this.notification = document.getElementById('notification');
    this.addTeaButton = document.getElementById('addTeaButton');
    this.addTeaModal = document.getElementById('addTeaModal');
    this.addTeaForm = document.getElementById('addTeaForm');
    this.closeModalButton = document.getElementById('closeModalButton');
    this.cancelAddTeaButton = document.getElementById('cancelAddTeaButton');
    
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
      if (window.TeaDatabase) {
        await TeaDatabase.init();
      }
      
      // Set up event listeners
      this.setupEventListeners();
      
      // Load initial data
      await this.loadInitialData();
      
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
    // Category selection
    this.categoryPills.forEach(pill => {
      pill.addEventListener('click', event => {
        const category = event.target.dataset.category;
        this.changeCategory(category);
      });
    });
    
    // Tea selection - this is how we'll open the detail view
    document.addEventListener('tea-select', this.handleTeaSelect.bind(this));
    
    // Start steeping
    document.addEventListener('start-steeping', this.handleSteepingStart.bind(this));
    
    // Timer complete
    document.addEventListener('timer-complete', this.handleTimerComplete.bind(this));
    
    // Add tea button
    if (this.addTeaButton) {
      this.addTeaButton.addEventListener('click', () => {
        this.addTeaModal.classList.add('visible');
      });
    }
    
    // Close modal buttons
    if (this.closeModalButton) {
      this.closeModalButton.addEventListener('click', () => {
        this.addTeaModal.classList.remove('visible');
      });
    }
    
    if (this.cancelAddTeaButton) {
      this.cancelAddTeaButton.addEventListener('click', () => {
        this.addTeaModal.classList.remove('visible');
      });
    }
    
    // Add tea form submission
    if (this.addTeaForm) {
      this.addTeaForm.addEventListener('submit', this.handleAddTeaSubmit.bind(this));
    }
    
    // Handle tea added event
    document.addEventListener('tea-added', this.handleTeaAdded.bind(this));
  }
  
  async loadInitialData() {
    if (window.TeaDatabase) {
      // If database is empty, add demo data
      const count = await TeaDatabase.getTeasCount();
      
      if (count === 0) {
        console.log('Database is empty, loading sample data would go here');
        // Implement your demo data loading logic
      }
    }
  }
  
  changeCategory(category) {
    if (category === this.currentCategory) return;
    
    // Update active pill
    this.categoryPills.forEach(pill => {
      if (pill.dataset.category === category) {
        pill.classList.add('active');
      } else {
        pill.classList.remove('active');
      }
    });
    
    // Update tea collection
    if (this.teaCollection) {
      this.teaCollection.category = category;
    }
    
    // Update state
    this.currentCategory = category;
  }
  
  async handleAddTeaSubmit(event) {
    event.preventDefault();
    
    const teaIdInput = document.getElementById('teaId');
    const teaNameInput = document.getElementById('teaName');
    const teaCategoryInput = document.getElementById('teaCategory');
    const teaOriginInput = document.getElementById('teaOrigin');
    
    const teaId = teaIdInput.value.trim();
    const teaName = teaNameInput.value.trim();
    const teaCategory = teaCategoryInput.value;
    const teaOrigin = teaOriginInput.value.trim();
    
    // Close the modal
    this.addTeaModal.classList.remove('visible');
    
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
      
      // Reset form
      teaIdInput.value = '';
      teaNameInput.value = '';
      teaOriginInput.value = '';
      
    } catch (error) {
      console.error('Error adding tea:', error);
      this.showNotification('Failed to add tea. Please try again.', 3000);
      this.hideLoader();
    }
  }
  
  async loadTeaFromId(teaId) {
    try {
      const baseUrl = this.getBaseUrl();
      const teaUrl = `${baseUrl}${this.teaFolder}${teaId}.cha`;
      
      this.showNotification('Loading tea data...', 2000);
      
      // Fetch tea data
      const response = await fetch(teaUrl);
      if (!response.ok) {
        throw new Error(`Failed to load tea data: ${response.status}`);
      }
      
      const teaData = await response.json();
      
      // We'll assume the TeaDatabase is available here
      if (window.TeaDatabase) {
        // Get previous count for this category
        const previousCount = await TeaDatabase.getCategoryTeaCount(teaData.category);
        
        // Add tea to database
        const id = await TeaDatabase.addTea(teaData);
        
        // Get new count
        const newCount = await TeaDatabase.getCategoryTeaCount(teaData.category);
        
        // Here you can implement level-up logic if needed
        
        // Update category if needed
        if (teaData.category !== this.currentCategory) {
          this.changeCategory(teaData.category);
        }
        
        // Dispatch tea added event
        this.dispatchTeaAddedEvent(teaData);
      }
      
      this.showNotification(`Added ${teaData.name} to your collection!`, 3000);
      this.hideLoader();
      
    } catch (error) {
      console.error('Error loading tea from ID:', error);
      this.showNotification('Failed to load tea data', 3000);
      this.hideLoader();
      throw error;
    }
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
        tags: []
      };
      
      if (window.TeaDatabase) {
        // Get previous count for this category
        const previousCount = await TeaDatabase.getCategoryTeaCount(category);
        
        // Add tea to database
        const id = await TeaDatabase.addTea(teaData);
        
        // Get new count
        const newCount = await TeaDatabase.getCategoryTeaCount(category);
        
        // Here you can implement level-up logic if needed
        
        // Update category if needed
        if (category !== this.currentCategory) {
          this.changeCategory(category);
        }
      }
      
      // Dispatch tea added event
      this.dispatchTeaAddedEvent(teaData);
      
      this.showNotification(`Added ${name} to your collection!`, 3000);
      this.hideLoader();
      
    } catch (error) {
      console.error('Error adding manual tea:', error);
      this.showNotification('Failed to add tea', 3000);
      this.hideLoader();
      throw error;
    }
  }
  
  dispatchTeaAddedEvent(teaData) {
    // Create and dispatch tea-added event
    const event = new CustomEvent('tea-added', {
      bubbles: true,
      composed: true,
      detail: { tea: teaData }
    });
    
    document.dispatchEvent(event);
  }
  
  handleTeaAdded(event) {
    const tea = event.detail.tea;
    
    // Ensure the collection is refreshed
    if (tea.category === this.currentCategory && this.teaCollection) {
      this.teaCollection.category = this.currentCategory;
    }
  }
  
  handleTeaSelect(event) {
    // Get the tea data from the event
    const teaData = event.detail;
    console.log('Tea selected:', teaData);
    
    // Make sure we have the tea detail bottomsheet component
    if (!this.teaDetailBottomsheet) {
      this.teaDetailBottomsheet = document.querySelector('tea-detail-bottomsheet');
      
      // Create the component if it doesn't exist
      if (!this.teaDetailBottomsheet) {
        this.teaDetailBottomsheet = document.createElement('tea-detail-bottomsheet');
        document.body.appendChild(this.teaDetailBottomsheet);
        console.log('Created tea detail bottomsheet component');
      }
    }
    
    // Show the tea detail with the data from the event
    // The component will fetch full details if needed
    this.teaDetailBottomsheet.open(teaData);
  }
  
  handleSteepingStart(event) {
    const teaData = event.detail.tea;
    
    // Parse brew time to seconds
    const brewTimeSeconds = this.parseBrewTime(teaData.brewTime);
    
    // Start the timer 
    if (this.teaNav) {
      this.teaNav.startTimer(teaData.name, teaData.category, brewTimeSeconds);
      this.showNotification(`Started brewing ${teaData.name}`, 2000);
    } else if (window.timerService) {
      // Alternative if you're using a timer service
      window.timerService.startTimer(brewTimeSeconds, teaData.name);
      this.showNotification(`Started brewing ${teaData.name}`, 2000);
    }
  }
  
  handleTimerComplete(event) {
    const teaName = event.detail.teaName;
    this.showNotification(`Your ${teaName} is ready!`, 5000);
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
      'Yellow': '2:45'
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
      'Yellow': '80°C'
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
      
      // Hide after duration
      setTimeout(() => {
        this.notification.classList.remove('visible');
      }, duration);
    } else {
      // Create a notification element if it doesn't exist
      const messageContainer = document.querySelector('.message-container');
      
      if (messageContainer) {
        const messageElement = document.createElement('div');
        messageElement.className = 'message message-info';
        messageElement.textContent = message;
        
        // Add close button
        const closeButton = document.createElement('button');
        closeButton.className = 'message-close';
        closeButton.innerHTML = '&times;';
        closeButton.addEventListener('click', () => {
          messageElement.remove();
        });
        
        messageElement.appendChild(closeButton);
        messageContainer.appendChild(messageElement);
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
          if (messageElement.parentNode === messageContainer) {
            messageElement.remove();
          }
        }, duration);
      }
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

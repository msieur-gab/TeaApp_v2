# Tea App Folder Structure

```
tea-app/
│
├── index.html                      # Main application entry point
├── manifest.json                   # PWA manifest file
├── service-worker.js               # Service worker for offline functionality
│
├── assets/                         # Static assets
│   ├── icons/                      # App icons for various platforms
│   │   ├── favicon.ico
│   │   ├── icon-72x72.png
│   │   ├── icon-96x96.png
│   │   ├── icon-128x128.png
│   │   ├── icon-144x144.png
│   │   ├── icon-152x152.png
│   │   ├── icon-192x192.png
│   │   ├── icon-384x384.png
│   │   ├── icon-512x512.png
│   │   └── apple-touch-icon.png
│   │
│   └── sounds/                     # Audio files
│       ├── notification.mp3
│       └── notification.ogg
│
├── components/                     # Web components
│   ├── tea-circle.js               # Individual tea circle component
│   ├── tea-collection.js           # Main tea collection grid component
│   ├── tea-detail.js               # Tea detail panel component
│   ├── tea-nav.js                  # Bottom navigation component with timer
│   └── progress-modal.js           # Achievement/level-up modal component
│
├── services/                       # Service modules
│   ├── tea-collection-levels.js    # Gamification progression system
│   ├── tea-database.js             # Database and data management service
│   ├── notification-service.js     # Notification handling service
│   └── wake-lock-service.js        # Screen wake lock service for timer
│
├── css/                            # Stylesheets
│   ├── main.css                    # Main application styles
│   ├── components.css              # Component-specific styles
│   └── menu.css                    # Menu and navigation styles
│
├── tea/                            # Tea data files (.cha format)
│   ├── 000.cha                     # Earl Grey
│   ├── 001.cha                     # Mi Lan Xiang
│   ├── 002.cha                     # Dong Ding
│   ├── 003.cha                     # Alishan High Mountain
│   ├── 004.cha                     # Tie Guan Yin
│   ├── 005.cha                     # Da Hong Pao
│   ├── 006.cha                     # Oriental Beauty
│   ├── 007.cha                     # Jin Xuan
│   ├── 010.cha                     # New Earl Grey
│   ├── g001.cha                    # Dragonwell
│   ├── g002.cha                    # Gyokuro
│   ├── g003.cha                    # Ceremonial Matcha
│   ├── p001.cha                    # Ancient Tree Sheng Pu-erh
│   ├── p002.cha                    # Golden Needle Shou Pu-erh
│   ├── p003.cha                    # Aged Yiwu Sheng Pu-erh
│   ├── w001.cha                    # Silver Needle
│   └── w002.cha                    # White Peony
│
└── timer-worker.js                 # Web worker for timer functionality
```

## Component Structure

### Web Components

Each web component follows a similar structure with these key parts:

1. **Constructor** - Initializes component state and binds methods
2. **Lifecycle Methods** - Sets up and tears down event listeners
3. **Public API** - Methods intended for external use
4. **Event Handlers** - Responds to user interactions and system events
5. **Rendering Logic** - Creates and updates the component's DOM

### Services

Services are modular JavaScript classes that handle specific functionality:

1. **TeaCollectionLevels** - Manages level progression, achievements, and gamification
2. **TeaDatabase** - Handles data persistence and retrieval using IndexedDB/Dexie
3. **NotificationService** - Manages browser notifications and sound alerts
4. **WakeLockService** - Keeps the screen on during active brewing

## File Types

- **.js** - JavaScript modules and components
- **.css** - Cascading Style Sheets for styling
- **.cha** - Custom JSON format containing tea metadata
- **.html** - Main entry point and structure
- **.json** - Configuration files (manifest)
- **.png/.ico** - Image assets for icons
- **.mp3/.ogg** - Audio files for notifications

## Deployment Structure

When deployed, the application is designed to work as a Progressive Web App with:

- Offline capability through service workers
- Local database storage for user collection
- Installable on desktop and mobile devices
- Push notifications for timer completion

This structure emphasizes modularity, reusability, and separation of concerns, making the codebase easier to maintain and extend.

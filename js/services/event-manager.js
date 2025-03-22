// js/services/event-manager.js
// A simple event management service for centralized event handling

class EventManager {
  constructor() {
    // Map to store event listeners
    this._listeners = new Map();
    
    // Instance is created once
    if (EventManager._instance) {
      return EventManager._instance;
    }
    
    EventManager._instance = this;
  }
  
  /**
   * Adds an event listener
   * @param {string} event - The event name
   * @param {Function} callback - The callback function
   * @param {Object} context - The context to bind the callback to (optional)
   * @returns {Object} An object containing a remove method
   */
  on(event, callback, context = null) {
    if (!this._listeners.has(event)) {
      this._listeners.set(event, []);
    }
    
    const handler = { 
      callback: context ? callback.bind(context) : callback,
      original: callback,
      context
    };
    
    this._listeners.get(event).push(handler);
    
    // Return an object with a remove method
    return {
      remove: () => this.off(event, callback, context)
    };
  }
  
  /**
   * Removes an event listener
   * @param {string} event - The event name
   * @param {Function} callback - The original callback function
   * @param {Object} context - The context the callback was bound to (optional)
   */
  off(event, callback, context = null) {
    if (!this._listeners.has(event)) return;
    
    const listeners = this._listeners.get(event);
    const filteredListeners = listeners.filter(handler => 
      handler.original !== callback || handler.context !== context
    );
    
    if (filteredListeners.length) {
      this._listeners.set(event, filteredListeners);
    } else {
      this._listeners.delete(event);
    }
  }
  
  /**
   * Triggers an event
   * @param {string} event - The event name
   * @param {Object} data - The data to pass to the callbacks
   */
  emit(event, data = {}) {
    if (!this._listeners.has(event)) return;
    
    // Create a copy of the listeners before triggering to avoid issues
    // if a listener is removed during execution
    const listeners = [...this._listeners.get(event)];
    
    listeners.forEach(handler => {
      try {
        handler.callback(data);
      } catch (error) {
        console.error(`Error in event listener for ${event}:`, error);
      }
    });
  }
  
  /**
   * Adds an event listener that is automatically removed after being triggered once
   * @param {string} event - The event name
   * @param {Function} callback - The callback function
   * @param {Object} context - The context to bind the callback to (optional)
   * @returns {Object} An object containing a remove method
   */
  once(event, callback, context = null) {
    const wrappedCallback = (data) => {
      // Remove the listener first
      this.off(event, wrappedCallback);
      // Then call the original callback
      return callback.call(context, data);
    };
    
    return this.on(event, wrappedCallback);
  }
  
  /**
   * Removes all event listeners for a given event or all events
   * @param {string} event - The event name (optional, removes all listeners if not provided)
   */
  clear(event = null) {
    if (event) {
      this._listeners.delete(event);
    } else {
      this._listeners.clear();
    }
  }
  
  /**
   * Returns the number of listeners for a given event
   * @param {string} event - The event name
   * @returns {number} The number of listeners
   */
  listenerCount(event) {
    return this._listeners.has(event) ? this._listeners.get(event).length : 0;
  }
  
  /**
   * Returns a list of all registered event types
   * @returns {Array} List of event names
   */
  eventTypes() {
    return Array.from(this._listeners.keys());
  }
}

// Create a singleton instance
const teaEvents = new EventManager();

// Common tea app event types
const TeaEventTypes = {
  // Tea collection events
  TEA_ADDED: 'tea-added',
  TEA_REMOVED: 'tea-removed',
  TEA_UPDATED: 'tea-updated',
  TEA_SELECTED: 'tea-selected',
  
  // Category events
  CATEGORY_CHANGED: 'category-changed',
  
  // Brewing events
  STEEP_STARTED: 'steep-started',
  TIMER_COMPLETED: 'timer-completed',
  
  // Achievement events
  LEVEL_UP: 'level-up',
  BADGE_EARNED: 'badge-earned',
  
  // Navigation events
  DETAIL_OPENED: 'detail-opened',
  DETAIL_CLOSED: 'detail-closed',
  
  // UI events
  NOTIFICATION_SHOW: 'notification-show',
  MODAL_OPENED: 'modal-opened',
  MODAL_CLOSED: 'modal-closed'
};

// Export both the singleton instance and event types
export { teaEvents, TeaEventTypes };
export default teaEvents;

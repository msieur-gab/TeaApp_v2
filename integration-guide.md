# Tea App Refactoring Guide

This guide provides instructions for implementing the refactored tea app components and services. The changes focus on consolidating the tea-detail component, introducing a centralized event management system, and implementing a consistent theming approach.

## Overview of Changes

1. **Consolidated Tea Detail Component**: Merged functionality from multiple detail components into a single, more maintainable component.
2. **Event Management Service**: Added centralized event handling to reduce tight coupling between components.
3. **Theme Utilities**: Created consistent theming with CSS variables for tea categories.
4. **Updated App.js**: Integrated the new components and services into the main application.

## Implementation Steps

### 1. Replace Tea Detail Component

1. Remove the old tea detail implementation files:
   - Delete `js/components/tea-detail-bottomsheet.js`
   - Replace `js/components/tea-detail.js` with the consolidated version

2. The new component now supports:
   - Smooth animations and transitions
   - Swipe-to-dismiss gestures
   - Dynamic data updates
   - Consistent theming with CSS variables

### 2. Add Event Management Service

1. Add the new event manager service:
   - Create `js/services/event-manager.js`

2. Update component communication to use the event manager:
   - Dispatch events via `teaEvents.emit(eventName, data)`
   - Listen for events via `teaEvents.on(eventName, callback)`

3. Use the predefined event types from `TeaEventTypes` for consistency

### 3. Implement Theme Utilities

1. Add the theme utilities module:
   - Create `js/utils/tea-theme.js`

2. Initialize theme variables on app start:
   - Call `TeaTheme.setupVariables()` during app initialization

3. Apply theme to components as needed:
   - Use `TeaTheme.applyTheme(element, category, options)` to style elements

### 4. Update App.js

1. Replace the current app.js with the updated version:
   - Update imports to include new services
   - Change event handling to use the event manager
   - Update UI interactions with theme utilities

2. Update any direct references to use the new services:
   ```javascript
   // Before
   document.dispatchEvent(new CustomEvent('tea-added', { detail: { tea: teaData } }));
   
   // After
   teaEvents.emit(TeaEventTypes.TEA_ADDED, { tea: teaData });
   ```

## Required Files to Update/Create

1. **Update:**
   - `js/components/tea-detail.js` → Replace with consolidated version
   - `js/app.js` → Replace with updated version

2. **Create:**
   - `js/services/event-manager.js` → New event management service
   - `js/utils/tea-theme.js` → New theme utilities

3. **Remove:**
   - `js/components/tea-detail-bottomsheet.js` → No longer needed

## Testing the Implementation

After implementing the changes, test the following functionality:

1. **Tea Detail View:**
   - Open a tea detail by clicking on a tea circle
   - Test the swipe down gesture to close
   - Verify brew style toggle works correctly
   - Check that steep button dispatches the correct event

2. **Event System:**
   - Verify tea selection events are properly handled
   - Confirm steep events trigger the timer
   - Check that level-up events show the progress modal

3. **Theme Consistency:**
   - Verify that tea category colors are consistent across the app
   - Check that the tea detail view properly uses the category color

## Troubleshooting

- **Detail View Not Opening**: Ensure the consolidated detail component is properly registered and the tea-select event is being fired
- **Events Not Working**: Check that component event names match TeaEventTypes constants
- **Theme Colors Inconsistent**: Verify TeaTheme.setupVariables() is called during app initialization

## Benefits of the Refactoring

1. **Improved Maintainability**: Consolidated components reduce code duplication
2. **Loosely Coupled Components**: Event manager allows components to communicate without direct references
3. **Consistent UI**: Theme utilities ensure visual consistency across the app
4. **Better Performance**: Simplified component architecture reduces DOM operations
5. **Easier Future Development**: Adding new features will be simpler with the centralized event system
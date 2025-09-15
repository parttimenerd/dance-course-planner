/**
 * Dance Course Planner - Sample Application Configuration
 * 
 * This is a simplified configuration file. Copy this file to app.config.js and
 * customize the values based on your dance school's requirements.
 * 
 * Usage:
 *   cp app.config.sample.js app.config.js
 *   # Then edit app.config.js with your settings
 */

export const APP_CONFIG = {
  // Course Duration Settings
  courseDurationMinutes: 70,     // Duration: 60min class + 10min break
  
  // Location Settings
  locationSelector: {
    showLocationSelector: true,  // Show/hide the location selector
    defaultLocation: 'Karlsruhe' // Default selected location
  }
}

// Helper function to get configuration values
export function getConfig(path, defaultValue = undefined) {
  const keys = path.split('.')
  let current = APP_CONFIG
  
  for (const key of keys) {
    if (current && typeof current === 'object' && key in current) {
      current = current[key]
    } else {
      return defaultValue
    }
  }
  
  return current
}

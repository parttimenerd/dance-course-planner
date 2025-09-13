import { ref, computed } from 'vue'

// Get browser language
const getBrowserLanguage = () => {
  const lang = navigator.language || navigator.userLanguage
  return lang.startsWith('de') ? 'de' : 'en'
}

// Check for stored language preference, fallback to browser language
const getInitialLanguage = () => {
  const stored = localStorage.getItem('dance-planner-language')
  if (stored && ['en', 'de'].includes(stored)) {
    return stored
  }
  return getBrowserLanguage()
}

const currentLanguage = ref(getInitialLanguage())

// Translation dictionaries
const translations = {
  en: {
    // Headers
    'Dance Course Planner': 'Dance Course Planner',
    'Preferences': 'Preferences',
    'Generated Schedules': 'Generated Schedules',
    
    // Constraints
    'Day Constraints': 'Day Constraints',
    'Time Constraints': 'Time Constraints',
    'Maximum courses per day': 'Maximum courses per day',
    'Maximum empty slots between courses': 'Maximum empty slots between courses',
    
    // Days
    'Monday': 'Monday',
    'Tuesday': 'Tuesday',
    'Wednesday': 'Wednesday',
    'Thursday': 'Thursday',
    'Friday': 'Friday',
    'Saturday': 'Saturday',
    'Sunday': 'Sunday',
    
    // Buttons
    'Select All': 'Select All',
    'Clear All': 'Clear All',
    'Select Courses': 'Select Courses',
    'All': 'All',
    'None': 'None',
    'Share': 'Share',
    'Share Schedule': 'Share Schedule',
    'Sharing...': 'Sharing...',
    'Export to Calendar': 'Export to Calendar',
    'Print': 'Print',
    'Generate': 'Generate',
    
    // Schedule
    'Schedule': 'Schedule',
    'Weekly Overview': 'Weekly Overview',
    'courses': 'courses',
    'course': 'course',
    'selected': 'selected',
    'courses available': 'courses available',
    
    // Messages
    'Ready to Plan Your Dance Schedule?': 'Ready to Plan Your Dance Schedule?',
    'Select your preferred courses and set your constraints to find the perfect combination!': 'Select your preferred courses and set your constraints to find the perfect combination!',
    'No Valid Schedules Found': 'No Valid Schedules Found',
    'Your current constraints are too restrictive. Try one of the suggestions below:': 'Your current constraints are too restrictive. Try one of the suggestions below:',
    'Computing schedules...': 'Computing schedules...',
    'Found': 'Found',
    'possible schedule': 'possible schedule',
    'possible schedules': 'possible schedules',
    'Loading schedule data...': 'Loading schedule data...',
    'Error loading schedule': 'Error loading schedule',
    'Suggested Changes': 'Suggested Changes',
    
    // Time
    'slot': 'slot',
    'slots': 'slots',
    'gap': 'gap',
    'average gap between courses': 'average gap between courses',
    
    // Suggestions
    'Allow more time between courses': 'Allow more time between courses',
    'Add more available times': 'Add more available times',
    'Add specific time slot': 'Add specific time slot',
    'Add all time slots for day': 'Add all time slots for day',
    'Enable time slots for day': 'Enable time slots for day',
    'Reduce course selection': 'Reduce course selection',
    'Adjust constraints': 'Adjust constraints',
    
    // Share messages
    'Configuration': 'Configuration',
    'Check out this dance course': 'Check out this dance course',
    'Link copied to clipboard!': 'Link copied to clipboard!',
    'Failed to share. Please try again.': 'Failed to share. Please try again.'
  },
  de: {
    // Headers
    'Dance Course Planner': 'Tanzkurs Planer',
    'Preferences': 'Einstellungen',
    'Generated Schedules': 'Generierte Stundenpläne',
    
    // Constraints
    'Day Constraints': 'Tagesbeschränkungen',
    'Time Constraints': 'Zeitbeschränkungen',
    'Maximum courses per day': 'Maximale Kurse pro Tag',
    'Maximum empty slots between courses': 'Maximale Lücken zwischen Kursen',
    
    // Days
    'Monday': 'Montag',
    'Tuesday': 'Dienstag',
    'Wednesday': 'Mittwoch',
    'Thursday': 'Donnerstag',
    'Friday': 'Freitag',
    'Saturday': 'Samstag',
    'Sunday': 'Sonntag',
    
    // Buttons
    'Select All': 'Alle auswählen',
    'Clear All': 'Alle abwählen',
    'Select Courses': 'Kurse auswählen',
    'All': 'Alle',
    'None': 'Keine',
    'Share': 'Teilen',
    'Share Schedule': 'Stundenplan teilen',
    'Sharing...': 'Wird geteilt...',
    'Export to Calendar': 'In Kalender exportieren',
    'Print': 'Drucken',
    'Generate': 'Generieren',
    
    // Schedule
    'Schedule': 'Stundenplan',
    'Weekly Overview': 'Wochenübersicht',
    'courses': 'Kurse',
    'course': 'Kurs',
    'selected': 'ausgewählt',
    'courses available': 'Kurse verfügbar',
    
    // Messages
    'Ready to Plan Your Dance Schedule?': 'Bereit, Ihren Tanzstundenplan zu planen?',
    'Select your preferred courses and set your constraints to find the perfect combination!': 'Wählen Sie Ihre bevorzugten Kurse aus und setzen Sie Ihre Beschränkungen, um die perfekte Kombination zu finden!',
    'No Valid Schedules Found': 'Keine gültigen Stundenpläne gefunden',
    'Your current constraints are too restrictive. Try one of the suggestions below:': 'Ihre aktuellen Beschränkungen sind zu restriktiv. Versuchen Sie einen der folgenden Vorschläge:',
    'Computing schedules...': 'Stundenpläne werden berechnet...',
    'Found': 'Gefunden',
    'possible schedule': 'möglicher Stundenplan',
    'possible schedules': 'mögliche Stundenpläne',
    'Loading schedule data...': 'Stundenplandaten werden geladen...',
    'Error loading schedule': 'Fehler beim Laden des Stundenplans',
    'Suggested Changes': 'Vorgeschlagene Änderungen',
    
    // Time
    'slot': 'Zeitslot',
    'slots': 'Zeitslots',
    'gap': 'Lücke',
    'average gap between courses': 'durchschnittliche Lücke zwischen Kursen',
    
    // Suggestions
    'Allow more time between courses': 'Mehr Zeit zwischen Kursen erlauben',
    'Add more available times': 'Mehr verfügbare Zeiten hinzufügen',
    'Add specific time slot': 'Spezifischen Zeitslot hinzufügen',
    'Add all time slots for day': 'Alle Zeitslots für Tag hinzufügen',
    'Enable time slots for day': 'Zeitslots für Tag aktivieren',
    'Reduce course selection': 'Kursauswahl reduzieren',
    'Adjust constraints': 'Beschränkungen anpassen',
    
    // Share messages
    'Configuration': 'Konfiguration',
    'Check out this dance course': 'Schauen Sie sich diesen Tanzkurs an',
    'Link copied to clipboard!': 'Link in die Zwischenablage kopiert!',
    'Failed to share. Please try again.': 'Teilen fehlgeschlagen. Bitte versuchen Sie es erneut.'
  }
}

export function useI18n() {
  const t = (key, count = null) => {
    let translation = translations[currentLanguage.value][key] || key
    
    // Handle pluralization for English
    if (count !== null && currentLanguage.value === 'en') {
      if (key === 'course' && count !== 1) {
        translation = 'courses'
      } else if (key === 'possible schedule' && count !== 1) {
        translation = 'possible schedules'
      } else if (key === 'slot' && count !== 1) {
        translation = 'slots'
      }
    }
    
    // Handle pluralization for German
    if (count !== null && currentLanguage.value === 'de') {
      if (key === 'course' && count !== 1) {
        translation = 'Kurse'
      } else if (key === 'possible schedule' && count !== 1) {
        translation = 'mögliche Stundenpläne'
      } else if (key === 'slot' && count !== 1) {
        translation = 'Zeitslots'
      }
    }
    
    return translation
  }
  
  const formatNumber = (number) => {
    return new Intl.NumberFormat(currentLanguage.value).format(number)
  }
  
  const formatTime = (date) => {
    return date.toLocaleTimeString(currentLanguage.value === 'de' ? 'de-DE' : 'en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    })
  }
  
  const language = computed(() => currentLanguage.value)
  
  const setLanguage = (lang) => {
    if (['en', 'de'].includes(lang)) {
      currentLanguage.value = lang
      localStorage.setItem('dance-planner-language', lang)
      
      // Update HTML document language and title
      document.documentElement.lang = lang
      if (lang === 'de') {
        document.title = 'Tanzkurs Planer'
        const description = document.querySelector('meta[name="description"]')
        if (description) {
          description.content = 'Planen Sie Ihren perfekten Tanzstundenplan mit intelligenter Constraint-Lösung'
        }
      } else {
        document.title = 'Dance Course Planner'
        const description = document.querySelector('meta[name="description"]')
        if (description) {
          description.content = 'Plan your perfect dance course schedule with smart constraint solving'
        }
      }
    }
  }
  
  const dayNames = computed(() => {
    if (currentLanguage.value === 'de') {
      return [
        { short: 'MO', long: 'Montag' },
        { short: 'DI', long: 'Dienstag' },
        { short: 'MI', long: 'Mittwoch' },
        { short: 'DO', long: 'Donnerstag' },
        { short: 'FR', long: 'Freitag' },
        { short: 'SA', long: 'Samstag' },
        { short: 'SO', long: 'Sonntag' }
      ]
    } else {
      return [
        { short: 'MON', long: 'Monday' },
        { short: 'TUE', long: 'Tuesday' },
        { short: 'WED', long: 'Wednesday' },
        { short: 'THU', long: 'Thursday' },
        { short: 'FRI', long: 'Friday' },
        { short: 'SAT', long: 'Saturday' },
        { short: 'SUN', long: 'Sunday' }
      ]
    }
  })

  // Function to translate day codes from data format (German) to display format (localized)
  const translateDayCode = (germanDayCode) => {
    const lang = currentLanguage.value
    const dayMap = {
      'MO': lang === 'de' ? 'MO' : 'MON',
      'DI': lang === 'de' ? 'DI' : 'TUE', 
      'MI': lang === 'de' ? 'MI' : 'WED',
      'DO': lang === 'de' ? 'DO' : 'THU',
      'FR': lang === 'de' ? 'FR' : 'FRI',
      'SA': lang === 'de' ? 'SA' : 'SAT',
      'SO': lang === 'de' ? 'SO' : 'SUN'
    }
    return dayMap[germanDayCode] || germanDayCode
  }

  // Centralized day color mapping (avoiding green which is used for selections)
  const getDayColors = (dayCode) => {
    const colorMap = {
      'MO': { bg: 'bg-blue-100', text: 'text-blue-800', border: 'border-blue-200' },
      'MON': { bg: 'bg-blue-100', text: 'text-blue-800', border: 'border-blue-200' },
      'DI': { bg: 'bg-orange-100', text: 'text-orange-800', border: 'border-orange-200' },
      'TUE': { bg: 'bg-orange-100', text: 'text-orange-800', border: 'border-orange-200' },
      'MI': { bg: 'bg-yellow-100', text: 'text-yellow-800', border: 'border-yellow-200' },
      'WED': { bg: 'bg-yellow-100', text: 'text-yellow-800', border: 'border-yellow-200' },
      'DO': { bg: 'bg-purple-100', text: 'text-purple-800', border: 'border-purple-200' },
      'THU': { bg: 'bg-purple-100', text: 'text-purple-800', border: 'border-purple-200' },
      'FR': { bg: 'bg-pink-100', text: 'text-pink-800', border: 'border-pink-200' },
      'FRI': { bg: 'bg-pink-100', text: 'text-pink-800', border: 'border-pink-200' },
      'SA': { bg: 'bg-indigo-100', text: 'text-indigo-800', border: 'border-indigo-200' },
      'SAT': { bg: 'bg-indigo-100', text: 'text-indigo-800', border: 'border-indigo-200' },
      'SO': { bg: 'bg-red-100', text: 'text-red-800', border: 'border-red-200' },
      'SUN': { bg: 'bg-red-100', text: 'text-red-800', border: 'border-red-200' }
    }
    return colorMap[dayCode] || { bg: 'bg-gray-100', text: 'text-gray-800', border: 'border-gray-200' }
  }
  
  return {
    t,
    formatNumber,
    formatTime,
    language,
    setLanguage,
    dayNames,
    translateDayCode,
    getDayColors
  }
}

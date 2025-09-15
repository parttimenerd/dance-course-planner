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
    'Dance Course Planner': 'Personal Dance Course Planner',
    'Welcome to Dance Course Planner': 'Welcome to your Personal Dance Course Planner',
    'Preferences': 'Preferences',
    'Generated Schedules': 'Generated Schedules',
    
    // Constraints
    'Day Constraints': 'Day Constraints',
    'Time Constraints': 'Time Constraints',
    'Maximum courses per day': 'Maximum courses per day',
    'Maximum empty slots between courses': 'Maximum empty slots between courses',
    'Advanced Settings': 'Advanced Settings',
    'Course Duration (minutes)': 'Course Duration (minutes)',
    'minutes (for gap calculations)': 'minutes (for gap calculations)',
    'Duration of each course including break time. Default: 70 minutes (60min class + 10min break)': 'Duration of each course including break time. Default: 70 minutes (60min class + 10min break)',
    'Course Multiplicity': 'Course Multiplicity',
    'Configure how many times each course should appear in the schedule': 'Configure how many times each course should appear in the schedule',
    'times': 'times',
    'Select courses to configure multiplicity': 'Select courses to configure multiplicity',
    
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
    'Confirm': 'Confirm',
    'Cancel': 'Cancel',
    'Search courses...': 'Search courses...',
    'No courses found': 'No courses found',
    'matching': 'matching',
    'Course Frequency': 'Course Frequency',
    'time/week': 'time/week',
    'times/week': 'times/week',
    'Set how many times per week each course should be scheduled': 'Set how many times per week each course should be scheduled',
    'Show frequency settings': 'Show frequency settings',
    'Hide frequency settings': 'Hide frequency settings',
    'All courses scheduled once per week': 'All courses scheduled once per week',
    
    // Nimbuscloud Login
    'Connect to Nimbuscloud': 'Connect to Nimbuscloud',
    'Connect to': 'Connect to',
    'Connected to': 'Connected to',
    'Nimbuscloud': 'Nimbuscloud',
    'Login to get current schedule data from Nimbuscloud. Your credentials are only stored in your browser and never transferred to any server except Nimbuscloud.': 'Login to get current schedule data from Nimbuscloud. Your credentials are only stored in your browser and never transferred to any server except Nimbuscloud.',
    'Username': 'Email',
    'Password': 'Password',
    'Enter your username': 'Enter your email address',
    'Enter your password': 'Enter your password',
    'Login': 'Login',
    'Logging in...': 'Logging in...',
    'Welcome back': 'Welcome back',
    'Logout': 'Logout',
    'Invalid credentials or connection failed': 'Invalid credentials or connection failed',
    'Connection failed. Please try again.': 'Connection failed. Please try again.',
    'Login to get current data': 'Login to get current data',
    'Select Week': 'Select Week',
    'Current Week': 'Current Week',
    'Next Week': 'Next Week',
    'Week of': 'Week of',
    
    // Loading messages
    'Initializing Dance Course Planner...': 'Initializing Dance Course Planner...',
    'Discovering available weeks...': 'Discovering available weeks...',
    'Loading schedule data...': 'Loading schedule data...',
    'Preparing your schedule...': 'Preparing your schedule...',
    
    // Registration
    'Register for date': 'Register for date',
    'Unregister for date': 'Unregister for date',
    'Register for {date}': 'Register for {date}',
    'Unregister for {date}': 'Unregister for {date}',
    'Registering...': 'Registering...',
    'Unregistering...': 'Unregistering...',
    'register for': 'register for',
    'unregister from': 'unregister from',
    'this course': 'this course',
    'on': 'on',
    'Are you sure you want to {action} {courseName}{date}?': 'Are you sure you want to {action} {courseName}{date}?',
    'Pre-registered courses': 'Pre-registered courses',
    'Remove': 'Remove',
    'No pre-registered courses found': 'No pre-registered courses found',
    'Are you sure you want to unregister from {courseName} on {date}?': 'Are you sure you want to unregister from {courseName} on {date}?',
    'Registration successful': 'Registration successful',
    'Unregistration successful': 'Unregistration successful',
    'Register to All Courses': 'Register to All Courses',
    'Unregister All': 'Unregister All',
    'Registering to all courses...': 'Registering to all courses...',
    'Unregistering from all courses...': 'Unregistering from all courses...',
    'Registration only available within 6 days': 'Registration only available within 6 days',
    'Course date': 'Course date',
    'Disable Pair Courses': 'Disable Pair Courses',
    'Exclude courses that require a dance partner': 'Exclude courses that require a dance partner',
    'Free Time': 'Free Time',
    
    // Saved Solutions
    'Save schedule': 'Save schedule',
    'Remove from saved': 'Remove from saved',
    'Saved Schedules': 'Saved Schedules',
    'Hide saved schedules': 'Hide saved schedules',
    'Show saved schedules': 'Show saved schedules',
    'No saved schedules': 'No saved schedules',
    'Clear all saved': 'Clear all saved',
    'saved': 'saved',
    'Clear all': 'Clear all',
    'Pair courses hidden': 'Pair courses hidden',
    'Registration failed': 'Registration failed',
    'Unregistration failed': 'Unregistration failed',
    'Registered': 'Registered',
    'Available spots': 'Available spots',
    'Full': 'Full',
    'Pair Course': 'Pair Course',
    'Requires dance partner': 'Requires dance partner',
    'Male': 'Male',
    'Female': 'Female',
    'Diverse': 'Diverse',
    
    // Error messages
    'Login failed': 'Login failed',
    'Connection failed. Please try again.': 'Connection failed. Please try again.',
    'Invalid username or password. Please check your credentials and try again.': 'Invalid username or password. Please check your credentials and try again.',
    'Unable to connect to Nimbuscloud. Please check your internet connection and try again.': 'Unable to connect to Nimbuscloud. Please check your internet connection and try again.',
    'Login failed. Please try again or contact support if the problem persists.': 'Login failed. Please try again or contact support if the problem persists.',
    'Please enter both username and password': 'Please enter both email and password',
    'Please enter both email and password': 'Please enter both email and password',
    
    // Schedule
    'Schedule': 'Schedule',
    'Weekly Overview': 'Weekly Overview',
    'courses': 'courses',
    'course': 'course',
    'selected': 'selected',
    'Only courses enabled in your': 'Only courses enabled in your',
    'Nimbuscloud schedule filters': 'Nimbuscloud schedule filters',
    'are shown here': 'are shown here',
    'courses available': 'courses available',
    
    // Messages
    'Ready to Plan Your Dance Schedule?': 'Ready to Plan Your Dance Schedule?',
    'Select your preferred courses and set your constraints to find the perfect combination!': 'Select your preferred courses and set your constraints to find the perfect combination!',
    'No Valid Schedules Found': 'No Valid Schedules Found',
    'Your current constraints are too restrictive. Try one of the suggestions below:': 'Your current constraints are too restrictive. Try one of the suggestions below:',
    'Your current constraints are too restrictive.': 'Your current constraints are too restrictive.',
    'Computing schedules...': 'Computing schedules...',
    'Found': 'Found',
    'possible schedule': 'possible schedule',
    'possible schedules': 'possible schedules',
    'Loading schedule data...': 'Loading schedule data...',
    'Error loading schedule': 'Error loading schedule',
    'Suggested Changes': 'Suggested Changes',
    'No courses found': 'No courses found',
    'matching': 'matching',
    
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
    'Failed to share. Please try again.': 'Failed to share. Please try again.',
    
    // Footer
    'Disclaimer': 'Disclaimer',
    'This tool has no affiliation with Nimbuscloud and is an independent project.': 'Independent project, not affiliated with Nimbuscloud.',
    'Developed by': 'By',
    'Open Source': 'Open Source',
    'Licensed': 'Licensed',
    'View source code, contribute, or report issues': 'GitHub',
    'Data stored locally in browser only': 'Data stored locally in browser only',
    
    // About Modal and Risk Disclaimer
    'About': 'About',
    'aboutTitle': 'About Dance Course Planner',
    'aboutIntro': 'This website was built by',
    'projectOrigin': 'primarily to plan his own dance schedule (and at the request of his dancing partner). What started as a simple personal project got slightly out of hand. Since it exists anyway, others might find it useful too, so it\'s available online.',
    'builtOn': 'Built on',
    'nimbusIntegration': 'This application uses the APIs of',
    'nimbusDescription': '(please don\'t sue me) to obtain the schedule and register to courses. While the NimbusCloud platform is excellent for dance schools, this website adds some features I personally missed - like automated schedule optimization and constraint-based course selection. It tries to minimize API usage to be respectful.',
    'Developer': 'Developer',
    'developerDescription': 'Johannes Bechberger is a software developer and dance enthusiast who created this website to help dancers plan their course schedules more efficiently.',
    'techDetails': 'Technical Details',
    'techVue': 'Built with Vue.js 3 and modern web technologies',
    'techNimbus': 'Integrates with NimbusCloud API for course data',
    'techAlgorithms': 'Uses advanced constraint solving algorithms',
    'techResponsive': 'Responsive design optimized for desktop and mobile',
    'openSource': 'Open Source',
    'openSourceDescription': 'This project is open source and available on GitHub. Contributions, bug reports, and feature requests are welcome!',
    'viewGitHub': 'View on GitHub',
    'licenseInfo': 'This project is open source and available under the MIT License. You can find the source code, contribute, or report issues on GitHub. Feel free to suggest improvements, but please don\'t expect them to be heard or integrated - this is primarily a personal project.',
    'riskTitle': 'Use at Your Own Risk',
    'riskDisclaimer': 'This website might not work for you or your dance school. It was built for a specific use case and may not suit all scenarios. The author provides no guarantees about its functionality, reliability, or suitability for your needs. Use it at your own risk and always verify any generated schedules before relying on them.',
    'privacyTitle': 'Privacy Information',
    'privacyIntro': 'Your privacy is important. Here\'s what you should know:',
    'privacyDataPolicy': 'I don\'t want to have your data, please keep it!',
    'privacyBrowser': 'This application runs entirely in your browser - no personal data is sent to our servers',
    'privacyCredentials': 'When you log in, your credentials are sent directly to NimbusCloud, not stored by us',
    'privacyData': 'Course data is fetched from NimbusCloud and processed locally',
    'privacyStorage': 'Your preferences and generated schedules are stored locally in your browser',
    'privacyTracking': 'No tracking, analytics, or advertising cookies are used',
    'privacyOffline': 'The application works offline once loaded',
    'Use at your own risk': 'Use at your own risk',
    'Close': 'Close',
    'DANCE, v.i. To leap about to the sound of tittering music, preferably with arms about your neighbor\'s wife or daughter. There are many kinds of dances, but all those requiring the participation of the two sexes have two characteristics in common: they are conspicuously innocent, and warmly loved by the vicious.': 'DANCE, v.i. To leap about to the sound of tittering music, preferably with arms about your neighbor\'s wife or daughter. There are many kinds of dances, but all those requiring the participation of the two sexes have two characteristics in common: they are conspicuously innocent, and warmly loved by the vicious.'
  },
  de: {
    // Headers
    'Dance Course Planner': 'Persönlicher Tanzkurs Planer',
    'Welcome to Dance Course Planner': 'Willkommen bei deinem Persönlichen Tanzkurs Planer',
    'Preferences': 'Einstellungen',
    'Generated Schedules': 'Generierte Stundenpläne',
    
    // Constraints
    'Day Constraints': 'Tagesbeschränkungen',
    'Time Constraints': 'Zeitbeschränkungen',
    'Maximum courses per day': 'Maximale Kurse pro Tag',
    'Maximum empty slots between courses': 'Maximale Lücken zwischen Kursen',
    'Advanced Settings': 'Erweiterte Einstellungen',
    'Course Duration (minutes)': 'Kursdauer (Minuten)',
    'minutes (for gap calculations)': 'Minuten (für Lückenberechnung)',
    'Duration of each course including break time. Default: 70 minutes (60min class + 10min break)': 'Dauer jedes Kurses inklusive Pause. Standard: 70 Minuten (60min Unterricht + 10min Pause)',
    'Course Multiplicity': 'Kurshäufigkeit',
    'Configure how many times each course should appear in the schedule': 'Konfigurieren Sie, wie oft jeder Kurs im Stundenplan erscheinen soll',
    'times': 'mal',
    'Select courses to configure multiplicity': 'Wählen Sie Kurse aus, um die Häufigkeit zu konfigurieren',
    
    // Days
    'Monday': 'Montag',
    'Tuesday': 'Dienstag',
    'Wednesday': 'Mittwoch',
    'Thursday': 'Donnerstag',
    'Friday': 'Freitag',
    'Saturday': 'Samstag',
    'Sunday': 'Sonntag',
    
    // AboutModal - Developer Info
    'About': 'Über',
    'About Dance Course Planner': 'Über den Tanzkurs Planer',
    'What is this?': 'Was ist das?',
    'aboutTitle': 'Über den Tanzkurs Planer',
    'aboutIntro': 'Diese Website wurde entwickelt von',
    'projectOrigin': 'hauptsächlich um seinen eigenen Tanzstundenplan zu planen (und nach Aufforderung seiner Tanzpartnerin). Was als einfaches persönliches Projekt begann, ist leicht aus dem Ruder gelaufen. Da es nun mal existiert, finden es vielleicht auch andere nützlich, deshalb ist es online verfügbar.',
    'builtOn': 'Aufgebaut auf',
    'nimbusIntegration': 'Diese Anwendung nutzt die APIs von',
    'nimbusDescription': '(bitte verklagt mich nicht) um Stundenpläne zu erhalten und sich für Kurse anzumelden. Obwohl die NimbusCloud-Plattform ausgezeichnet für Tanzschulen ist, fügt diese Website einige Features hinzu, die ich persönlich vermisst habe - wie automatisierte Stundenplanoptimierung und constraint-basierte Kursauswahl. Sie versucht, die API-Nutzung zu minimieren, um respektvoll zu sein.',
    'Developer': 'Entwickler',
    'developerDescription': 'Johannes Bechberger ist ein Software-Entwickler und Tanzbegeisterter, der diese Website entwickelt hat, um Tänzern bei der effizienteren Planung ihrer Kursstundenpläne zu helfen.',
    'GitHub Profile': 'GitHub Profil',
    'techDetails': 'Technische Details',
    'techVue': 'Entwickelt mit Vue.js 3 und modernen Web-Technologien',
    'techNimbus': 'Integriert sich mit der NimbusCloud API für Kursdaten',
    'techAlgorithms': 'Verwendet fortschrittliche Constraint-Solving-Algorithmen',
    'techResponsive': 'Responsive Design optimiert für Desktop und Mobilgeräte',
    'openSource': 'Open Source',
    'openSourceDescription': 'Dieses Projekt ist Open Source und auf GitHub verfügbar. Beiträge, Fehlerberichte und Feature-Anfragen sind willkommen!',
    'viewGitHub': 'Auf GitHub ansehen',
    'licenseInfo': 'Dieses Projekt ist Open Source und unter der MIT-Lizenz verfügbar. Du findest den Quellcode, kannst Beiträge leisten oder Probleme auf GitHub melden. Verbesserungsvorschläge sind gerne willkommen, aber erwarte nicht, dass sie gehört oder integriert werden - dies ist in erster Linie ein persönliches Projekt.',
    'riskTitle': 'Verwendung auf eigene Gefahr',
    'riskDisclaimer': 'Diese Website funktioniert möglicherweise nicht für dich oder deine Tanzschule. Sie wurde für einen spezifischen Anwendungsfall entwickelt und ist möglicherweise nicht für alle Szenarien geeignet. Der Autor übernimmt keine Garantie für die Funktionalität, Zuverlässigkeit oder Eignung für deine Bedürfnisse. Verwende sie auf eigene Gefahr und überprüfe immer alle generierten Stundenpläne, bevor du dich darauf verlässt.',
    'privacyTitle': 'Datenschutz-Informationen',
    'privacyIntro': 'Dein Datenschutz ist wichtig. Das solltest du wissen:',
    'privacyDataPolicy': 'Ich möchte deine Daten nicht haben, bitte behalte sie!',
    'privacyBrowser': 'Diese Anwendung läuft vollständig in deinem Browser - keine persönlichen Daten werden an unsere Server gesendet',
    'privacyCredentials': 'Wenn du dich anmeldest, werden deine Anmeldedaten direkt an NimbusCloud gesendet, nicht von uns gespeichert',
    'privacyData': 'Kursdaten werden von NimbusCloud abgerufen und lokal verarbeitet',
    'privacyStorage': 'Deine Einstellungen und generierten Stundenpläne werden lokal in deinem Browser gespeichert',
    'privacyTracking': 'Es werden keine Tracking-, Analytics- oder Werbe-Cookies verwendet',
    'privacyOffline': 'Die Anwendung funktioniert offline, sobald sie geladen ist',
    'Use at your own risk': 'Verwendung auf eigene Gefahr',
    'Close': 'Schließen',
    'DANCE, v.i. To leap about to the sound of tittering music, preferably with arms about your neighbor\'s wife or daughter. There are many kinds of dances, but all those requiring the participation of the two sexes have two characteristics in common: they are conspicuously innocent, and warmly loved by the vicious.': 'TANZEN, v.i. Herumspringen zum Klang kichernder Musik, vorzugsweise mit den Armen um die Frau oder Tochter des Nachbarn. Es gibt viele Arten von Tänzen, aber alle, die die Teilnahme beider Geschlechter erfordern, haben zwei gemeinsame Merkmale: sie sind auffällig unschuldig und werden von den Lasterhaften heiß geliebt.',
    
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
    'Confirm': 'Bestätigen',
    'Cancel': 'Abbrechen',
    'Search courses...': 'Kurse suchen...',
    'No courses found': 'Keine Kurse gefunden',
    'matching': 'passend zu',
    'Course Frequency': 'Kurshäufigkeit',
    'time/week': 'mal/Woche',
    'times/week': 'mal/Woche',
    'Set how many times per week each course should be scheduled': 'Lege dich fest, wie oft pro Woche jeder Kurs eingeplant werden soll',
    'Show frequency settings': 'Häufigkeitseinstellungen anzeigen',
    'Hide frequency settings': 'Häufigkeitseinstellungen ausblenden',
    'All courses scheduled once per week': 'Alle Kurse einmal pro Woche eingeplant',
    
    // Nimbuscloud Login
    'Connect to Nimbuscloud': 'Mit Nimbuscloud verbinden',
    'Connect to': 'Verbinden mit',
    'Connected to': 'Verbunden mit',
    'Nimbuscloud': 'Nimbuscloud',
    'Login to get current schedule data from Nimbuscloud. Your credentials are only stored in your browser and never transferred to any server except Nimbuscloud.': 'Melde dich an, um aktuelle Stundenplandaten von Nimbuscloud zu erhalten. Deine Anmeldedaten werden nur in deinem Browser gespeichert und niemals an einen anderen Server als Nimbuscloud übertragen.',
    'Username': 'E-Mail',
    'Password': 'Passwort',
    'Enter your username': 'E-Mail-Adresse eingeben',
    'Enter your password': 'Passwort eingeben',
    'Login': 'Anmelden',
    'Logging in...': 'Wird angemeldet...',
    'Welcome back': 'Willkommen zurück',
    'Logout': 'Abmelden',
    'Invalid credentials or connection failed': 'Ungültige Anmeldedaten oder Verbindung fehlgeschlagen',
    'Connection failed. Please try again.': 'Verbindung fehlgeschlagen. Bitte versuche es erneut.',
    'Login to get current data': 'Anmelden für aktuelle Daten',
    'Select Week': 'Woche auswählen',
    'Current Week': 'Aktuelle Woche',
    'Next Week': 'Nächste Woche',
    'Week of': 'Woche vom',
    
    // Loading messages
    'Initializing Dance Course Planner...': 'Tanzkursplaner wird initialisiert...',
    'Discovering available weeks...': 'Verfügbare Wochen werden erkundet...',
    'Loading schedule data...': 'Stundenplan wird geladen...',
    'Preparing your schedule...': 'Dein Stundenplan wird vorbereitet...',
    
    // Registration
    'Register for date': 'Für Datum anmelden',
    'Unregister for date': 'Für Datum abmelden',
    'Register for {date}': 'Für {date} anmelden',
    'Unregister for {date}': 'Für {date} abmelden',
    'Registering...': 'Wird angemeldet...',
    'Unregistering...': 'Wird abgemeldet...',
    'register for': 'anmelden für',
    'unregister from': 'abmelden von',
    'this course': 'diesen Kurs',
    'on': 'am',
    'Are you sure you want to {action} {courseName}{date}?': 'Möchtest du dich wirklich {action} {courseName}{date}?',
    'Pre-registered courses': 'Vorangemeldete Kurse',
    'Remove': 'Entfernen',
    'No pre-registered courses found': 'Keine vorangemeldeten Kurse gefunden',
    'Are you sure you want to unregister from {courseName} on {date}?': 'Möchtest du dich wirklich von {courseName} am {date} abmelden?',
    'Registration successful': 'Anmeldung erfolgreich',
    'Unregistration successful': 'Abmeldung erfolgreich',
    'Register to All Courses': 'Für alle Kurse anmelden',
    'Unregister All': 'Alle abmelden',
    'Registering to all courses...': 'Anmeldung für alle Kurse läuft...',
    'Unregistering from all courses...': 'Abmeldung von allen Kursen läuft...',
    'Registration only available within 6 days': 'Anmeldung nur innerhalb von 6 Tagen möglich',
    'Course date': 'Kurstermin',
    'Disable Pair Courses': 'Paarkurse deaktivieren',
    'Exclude courses that require a dance partner': 'Kurse ausschließen, die einen Tanzpartner benötigen',
    'Free Time': 'Freie Zeit',
    
    // Saved Solutions
    'Save schedule': 'Stundenplan speichern',
    'Remove from saved': 'Aus gespeicherten entfernen',
    'Saved Schedules': 'Gespeicherte Stundenpläne',
    'Hide saved schedules': 'Gespeicherte Stundenpläne ausblenden',
    'Show saved schedules': 'Gespeicherte Stundenpläne einblenden',
    'No saved schedules': 'Keine gespeicherten Stundenpläne',
    'Clear all saved': 'Alle gespeicherten löschen',
    'saved': 'gespeichert',
    'Clear all': 'Alle löschen',
    
    'Pair courses hidden': 'Paarkurse ausgeblendet',
    'Registration failed': 'Anmeldung fehlgeschlagen',
    'Unregistration failed': 'Abmeldung fehlgeschlagen',
    'Registered': 'Angemeldet',
    'Available spots': 'Verfügbare Plätze',
    'Full': 'Voll',
    'Pair Course': 'Paarkurs',
    'Requires dance partner': 'Benötigt Tanzpartner',
    'Male': 'Männlich',
    'Female': 'Weiblich',
    'Diverse': 'Divers',
    
    // Error messages
    'Login failed': 'Anmeldung fehlgeschlagen',
    'Connection failed. Please try again.': 'Verbindung fehlgeschlagen. Bitte versuche es erneut.',
    'Invalid username or password. Please check your credentials and try again.': 'Ungültiger Benutzername oder Passwort. Bitte überprüfe deine Anmeldedaten und versuche es erneut.',
    'Unable to connect to Nimbuscloud. Please check your internet connection and try again.': 'Verbindung zu Nimbuscloud nicht möglich. Bitte überprüfe deine Internetverbindung und versuche es erneut.',
    'Login failed. Please try again or contact support if the problem persists.': 'Anmeldung fehlgeschlagen. Bitte versuche es erneut oder wende dich an den Support, falls das Problem bestehen bleibt.',
    'Please enter both username and password': 'Bitte gib sowohl E-Mail als auch Passwort ein',
    'Please enter both email and password': 'Bitte gib sowohl E-Mail als auch Passwort ein',
    
    // Schedule
    'Schedule': 'Stundenplan',
    'Weekly Overview': 'Wochenübersicht',
    'courses': 'Kurse',
    'course': 'Kurs',
    'selected': 'ausgewählt',
    'Only courses enabled in your': 'Nur in deinen',
    'Nimbuscloud schedule filters': 'Nimbuscloud-Stundenplanfiltern aktivierte Kurse',
    'are shown here': 'werden hier angezeigt',
    'courses available': 'Kurse verfügbar',
    
    // Messages
    'Ready to Plan Your Dance Schedule?': 'Bereit, deinen Tanzstundenplan zu planen?',
    'Select your preferred courses and set your constraints to find the perfect combination!': 'Wähle deine bevorzugten Kurse aus und setze deine Beschränkungen, um die perfekte Kombination zu finden!',
    'No Valid Schedules Found': 'Keine gültigen Stundenpläne gefunden',
    'Your current constraints are too restrictive. Try one of the suggestions below:': 'Deine aktuellen Beschränkungen sind zu restriktiv. Versuche einen der folgenden Vorschläge:',
    'Your current constraints are too restrictive.': 'Deine aktuellen Beschränkungen sind zu restriktiv.',
    'Computing schedules...': 'Stundenpläne werden berechnet...',
    'Found': 'Gefunden',
    'possible schedule': 'möglicher Stundenplan',
    'possible schedules': 'mögliche Stundenpläne',
    'Loading schedule data...': 'Stundenplandaten werden geladen...',
    'Error loading schedule': 'Fehler beim Laden des Stundenplans',
    'Suggested Changes': 'Vorgeschlagene Änderungen',
    'No courses found': 'Keine Kurse gefunden',
    'matching': 'passend zu',
    
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
    'Check out this dance course': 'Schau dir diesen Tanzkurs an',
    'Link copied to clipboard!': 'Link in die Zwischenablage kopiert!',
    'Failed to share. Please try again.': 'Teilen fehlgeschlagen. Bitte versuche es erneut.',
    
    // Footer
    'Disclaimer': 'Haftungsausschluss',
    'This tool has no affiliation with Nimbuscloud and is an independent project.': 'Diese Website steht in keiner Verbindung mit Nimbuscloud und ist ein unabhängiges Projekt.',
    'Developed by': 'Entwickelt von',
    'Open Source': 'Open Source',
    'Licensed': 'Lizenziert',
    'View source code, contribute, or report issues': 'Quellcode ansehen, beitragen oder Probleme melden',
    'Data stored locally in browser only': 'Daten werden nur lokal im Browser gespeichert'
  }
}

export function useI18n() {
  const t = (key, params = null) => {
    let translation = translations[currentLanguage.value][key] || key
    
    // Handle parameters if passed as object
    if (params && typeof params === 'object' && !Array.isArray(params)) {
      // Check if it's a count parameter (for backwards compatibility)
      if (typeof params === 'number') {
        const count = params
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
      } else {
        // Handle parameter substitution
        Object.keys(params).forEach(paramKey => {
          const placeholder = `{${paramKey}}`
          translation = translation.replace(new RegExp(placeholder.replace(/[{}]/g, '\\$&'), 'g'), params[paramKey])
        })
      }
    } else if (typeof params === 'number') {
      // Handle count parameter (backwards compatibility)
      const count = params
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
    }
    
    return translation
  }
  
  const formatNumber = (number) => {
    return new Intl.NumberFormat(currentLanguage.value).format(number)
  }
  
  const formatTime = (date) => {
    if (!date) {
      console.warn('[formatTime] No date provided:', date)
      return '00:00'
    }
    
    // Convert string dates to Date objects
    let dateObj = date
    if (typeof date === 'string') {
      dateObj = new Date(date)
    }
    
    // Check if we have a valid Date object
    if (!(dateObj instanceof Date) || isNaN(dateObj.getTime())) {
      console.warn('[formatTime] Invalid date provided:', date)
      return '00:00'
    }
    
    return dateObj.toLocaleTimeString(currentLanguage.value === 'de' ? 'de-DE' : 'en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    })
  }
  
  const formatDate = (date) => {
    if (!date) {
      console.warn('[formatDate] No date provided:', date)
      return '01/01/1970'
    }
    
    // Convert string dates to Date objects
    let dateObj = date
    if (typeof date === 'string') {
      dateObj = new Date(date)
    }
    
    // Check if we have a valid Date object
    if (!(dateObj instanceof Date) || isNaN(dateObj.getTime())) {
      console.warn('[formatDate] Invalid date provided:', date)
      return '01/01/1970'
    }
    
    return dateObj.toLocaleDateString(currentLanguage.value === 'de' ? 'de-DE' : 'en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
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
        document.title = 'Persönlicher Tanzkurs Planer'
        const description = document.querySelector('meta[name="description"]')
        if (description) {
          description.content = 'Plane deinen perfekten Tanzstundenplan mit intelligenter Constraint-Lösung'
        }
      } else {
        document.title = 'Personal Dance Course Planner'
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
    formatDate,
    language,
    setLanguage,
    dayNames,
    translateDayCode,
    getDayColors
  }
}

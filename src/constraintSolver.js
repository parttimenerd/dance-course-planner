/**
 * Advanced Constraint Satisfaction Problem (CSP) Solver for Dance Course Scheduling
 * Pure backtracking solver for discrete constraint satisfaction
 */

class Variable {
  constructor(name, domain) {
    this.name = name
    this.domain = [...domain]
    this.value = null
    this.originalDomain = [...domain]
  }

  assign(value) {
    if (!this.domain.includes(value)) {
      throw new Error(`Value ${value} not in domain for variable ${this.name}`)
    }
    this.value = value
  }

  isAssigned() {
    return this.value !== null
  }

  reset() {
    this.value = null
    this.domain = [...this.originalDomain]
  }

  pruneDomain(values) {
    this.domain = this.domain.filter(val => !values.includes(val))
  }
}

class Constraint {
  constructor(variables, checker) {
    this.variables = variables
    this.checker = checker
  }

  isViolated(assignment) {
    return !this.checker(assignment)
  }

  getUnassignedVariables(assignment) {
    return this.variables.filter(variable => 
      !assignment.hasOwnProperty(variable.name) || assignment[variable.name] === null
    )
  }
}

export class ConstraintSolver {
  constructor() {
    this.variables = new Map()
    this.constraints = []
    this.solutions = []
  }

  /**
   * Add a variable with its domain of possible values
   */
  addVariable(varName, domain) {
    const variable = new Variable(varName, domain)
    this.variables.set(varName, variable)
  }

  /**
   * Add a constraint function that takes assignments and returns true if satisfied
   */
  addConstraint(constraintFn, variables, description = '') {
    const constraint = new Constraint(variables, constraintFn)
    constraint.description = description
    this.constraints.push(constraint)
  }

  /**
   * Solve using backtracking algorithm
   */
  solve() {
    this.solutions = []
    const variableList = Array.from(this.variables.values())
    
    if (variableList.length === 0) return []
    
    this._backtrack({}, variableList, 0)
    return this.solutions.slice(0, 100) // Limit solutions for performance
  }

  _backtrack(assignment, variables, depth) {
    if (depth >= variables.length) {
      // All variables assigned, check if solution is valid
      if (this._isValidAssignment(assignment)) {
        this.solutions.push({ ...assignment })
      }
      return
    }

    if (this.solutions.length >= 100) return // Limit solutions

    const variable = variables[depth]
    
    for (const value of variable.domain) {
      assignment[variable.name] = value
      
      if (this._isConsistent(assignment)) {
        this._backtrack(assignment, variables, depth + 1)
      }
      
      delete assignment[variable.name]
    }
  }

  _isConsistent(assignment) {
    for (const constraint of this.constraints) {
      if (constraint.isViolated(assignment)) {
        return false
      }
    }
    return true
  }

  _isValidAssignment(assignment) {
    for (const constraint of this.constraints) {
      if (constraint.isViolated(assignment)) {
        return false
      }
    }
    return true
  }
}

/**
 * Dance Course Scheduler using CSP
 */
export class DanceCourseScheduler {
  constructor(scheduleData) {
    this.scheduleData = scheduleData
    this.courses = this._extractCourses()
    this.solver = new ConstraintSolver()
  }

  /**
   * Extract and normalize course data
   */
  _extractCourses() {
    const courses = []
    
    if (!this.scheduleData?.content?.days) return courses

    for (const day of this.scheduleData.content.days) {
      for (const event of day.events || []) {
        if (event.type === 'course') {
          const levelNumber = this._extractLevelNumber(event.levelName)
          courses.push({
            id: event.id,
            name: event.displayName,
            nameWithLevel: this._formatCourseNameWithLevel(event.displayName, event.levelName),
            day: day.dayShort,
            dayLong: day.dayLong,
            startTime: new Date(parseInt(event.start) * 1000),
            endTime: new Date(parseInt(event.end) * 1000),
            location: event.location,
            room: event.room,
            teacher: event.teacherNames?.join(', ') || '',
            type: event.typeName,
            level: levelNumber || event.levelName, // Use simplified level number or fallback to original
            attendance: event.attendanceStatus
          })
        }
      }
    }

    return courses
  }

  /**
   * Extract number from level string (e.g., "Level 1" -> "1", "WTP 2" -> "2")
   */
  _extractLevelNumber(levelName) {
    if (!levelName || levelName === 'null' || levelName.toLowerCase() === 'unspecified') {
      return null
    }
    
    // Extract numbers from patterns like:
    // "Grundstufe (Level 1)" -> "1"
    // "Aufbaustufe (WTP 2)" -> "2" 
    // "Club (Level 3)" -> "3"
    // "Mittelstufe (Level 2)" -> "2"
    const numberMatch = levelName.match(/(?:Level|WTP|Club)?\s*(?:\(?(\d+)\)?)/i)
    if (numberMatch && numberMatch[1]) {
      return numberMatch[1]
    }
    
    // Also handle patterns where number might be at the end
    const endNumberMatch = levelName.match(/(\d+)\)?\s*$/i)
    if (endNumberMatch && endNumberMatch[1]) {
      return endNumberMatch[1]
    }
    
    return null
  }

  /**
   * Format course name to include level information
   */
  _formatCourseNameWithLevel(courseName, levelName) {
    if (!levelName || levelName === 'null' || levelName.toLowerCase() === 'unspecified') {
      return courseName
    }
    
    // Check if level is already in the course name
    if (courseName.toLowerCase().includes(levelName.toLowerCase())) {
      return courseName
    }
    
    // Extract just the number and format as bubble
    const levelNumber = this._extractLevelNumber(levelName)
    if (levelNumber) {
      return `${courseName} (${levelNumber})`
    }
    
    return `${courseName} (${levelName})`
  }

  /**
   * Generate schedule based on preferences and constraints
   */
  generateSchedule(preferences) {
    this.solver = new ConstraintSolver()
    
    // Filter courses based on preferences (using course names)
    let availableCourses = []
    
    if (preferences.selectedCourseNames && preferences.selectedCourseNames.length > 0) {
      availableCourses = this.courses.filter(course => {
        const baseName = this._getBaseCourseNam(course.nameWithLevel || course.name)
        return preferences.selectedCourseNames.includes(baseName)
      })
    } else if (preferences.selectedCourseIds && preferences.selectedCourseIds.length > 0) {
      // Backward compatibility for course IDs
      availableCourses = this.courses.filter(course => 
        preferences.selectedCourseIds.includes(course.id)
      )
    }

    if (availableCourses.length === 0) return []

    // Create variables for each selected course (each course is now its own variable)
    for (const course of availableCourses) {
      const variableName = `course_${course.id}`
      // Domain is either this course or 'none'
      const domain = [course.id, 'none']
      this.solver.addVariable(variableName, domain)
    }

    // Add constraints
    this._addTimeConstraints(preferences)
    this._addDayConstraints(preferences)
    this._addBlockedDaysConstraints(preferences)
    this._addMaxCoursesPerDayConstraint(preferences)
    this._addTimeGapConstraints(preferences)
    this._addNoDuplicateCoursesConstraint(preferences)
    this._addNoOverlappingCoursesConstraint(preferences)

    // Solve and format results
    const solutions = this.solver.solve()
    const formattedSolutions = this._formatSolutions(solutions, availableCourses)
    
    // If no solutions found, try to suggest modifications
    if (formattedSolutions.length === 0) {
      const suggestions = this._exploreSolutionSpace(preferences, availableCourses)
      return {
        solutions: [],
        suggestions: suggestions
      }
    }
    
    return {
      solutions: formattedSolutions,
      suggestions: null
    }
  }

  /**
   * Explore solution space to suggest minimal changes when no solution is found
   * Order of preference: increase gap -> add days -> add slots -> remove courses
   */
  _exploreSolutionSpace(originalPreferences, availableCourses) {
    const suggestions = []
    
    // 1. Try increasing time gaps (least intrusive)
    if (originalPreferences.maxTimeBetweenCourses !== undefined) {
      const currentGap = originalPreferences.maxTimeBetweenCourses || 0
      for (const newGap of [currentGap + 1, currentGap + 2, currentGap + 3]) {
        if (newGap <= 5) { // reasonable limit
          const testPrefs = { ...originalPreferences, maxTimeBetweenCourses: newGap }
          if (this._testPreferences(testPrefs, availableCourses)) {
            suggestions.push({
              type: 'increaseGap',
              description: `Allow ${newGap} hour${newGap !== 1 ? 's' : ''} gap between courses`,
              changes: { maxTimeBetweenCourses: newGap },
              priority: 1
            })
            break
          }
        }
      }
    }
    
    // 2. Try expanding per-day time slots (second preference)
    if (originalPreferences.perDayTimeSlots) {
      // Get all days that have courses
      const courseDays = new Set()
      availableCourses.forEach(course => courseDays.add(course.day))
      
      for (const day of courseDays) {
        const currentSlots = originalPreferences.perDayTimeSlots[day] || []
        
        // Get all available time slots for this day from actual courses
        const coursesForDay = availableCourses.filter(course => course.day === day)
        const availableTimeSlots = new Set()
        
        coursesForDay.forEach(course => {
          const startTime = course.startTime
          const timeInMinutes = startTime.getHours() * 60 + startTime.getMinutes()
          availableTimeSlots.add(timeInMinutes)
        })
        
        // Find slots that aren't currently selected
        const slotsToTry = Array.from(availableTimeSlots).filter(slot => !currentSlots.includes(slot))
        
        // Try adding individual slots first
        for (const slotToAdd of slotsToTry) {
          const newSlots = [...currentSlots, slotToAdd].sort((a, b) => a - b)
          const newPerDaySlots = { ...originalPreferences.perDayTimeSlots, [day]: newSlots }
          const testPrefs = { ...originalPreferences, perDayTimeSlots: newPerDaySlots }
          
          if (this._testPreferences(testPrefs, availableCourses)) {
            const dayNames = { MO: 'Monday', DI: 'Tuesday', MI: 'Wednesday', DO: 'Thursday', FR: 'Friday', SA: 'Saturday', SO: 'Sunday' }
            const hours = Math.floor(slotToAdd / 60)
            const minutes = slotToAdd % 60
            const timeLabel = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`
            
            suggestions.push({
              type: 'addPerDayTimeSlot',
              description: `Add ${timeLabel} time slot for ${dayNames[day]}`,
              changes: { perDayTimeSlots: newPerDaySlots },
              priority: 2
            })
            break
          }
        }
        
        // If no single slot worked, try adding all missing slots for this day
        if (suggestions.length === 0 && slotsToTry.length > 1) {
          const allSlots = [...currentSlots, ...slotsToTry].sort((a, b) => a - b)
          const newPerDaySlots = { ...originalPreferences.perDayTimeSlots, [day]: allSlots }
          const testPrefs = { ...originalPreferences, perDayTimeSlots: newPerDaySlots }
          
          if (this._testPreferences(testPrefs, availableCourses)) {
            const dayNames = { MO: 'Monday', DI: 'Tuesday', MI: 'Wednesday', DO: 'Thursday', FR: 'Friday', SA: 'Saturday', SO: 'Sunday' }
            
            suggestions.push({
              type: 'addAllDayTimeSlots',
              description: `Add all available time slots for ${dayNames[day]}`,
              changes: { perDayTimeSlots: newPerDaySlots },
              priority: 2
            })
            break
          }
        }
        
        if (suggestions.length > 0) break // Found a solution, no need to check other days
      }
    }
    
    // 2b. Try enabling time slots for days that have none selected but have courses
    if (originalPreferences.perDayTimeSlots && suggestions.length === 0) {
      const courseDays = new Set()
      availableCourses.forEach(course => courseDays.add(course.day))
      
      for (const day of courseDays) {
        const currentSlots = originalPreferences.perDayTimeSlots[day]
        
        // If this day has no slots selected (empty array), try enabling all slots
        if (currentSlots && currentSlots.length === 0) {
          const coursesForDay = availableCourses.filter(course => course.day === day)
          const allAvailableSlots = []
          
          coursesForDay.forEach(course => {
            const startTime = course.startTime
            const timeInMinutes = startTime.getHours() * 60 + startTime.getMinutes()
            if (!allAvailableSlots.includes(timeInMinutes)) {
              allAvailableSlots.push(timeInMinutes)
            }
          })
          
          allAvailableSlots.sort((a, b) => a - b)
          const newPerDaySlots = { ...originalPreferences.perDayTimeSlots, [day]: allAvailableSlots }
          const testPrefs = { ...originalPreferences, perDayTimeSlots: newPerDaySlots }
          
          if (this._testPreferences(testPrefs, availableCourses)) {
            const dayNames = { MO: 'Monday', DI: 'Tuesday', MI: 'Wednesday', DO: 'Thursday', FR: 'Friday', SA: 'Saturday', SO: 'Sunday' }
            
            suggestions.push({
              type: 'enableDayTimeSlots',
              description: `Enable time slots for ${dayNames[day]}`,
              changes: { perDayTimeSlots: newPerDaySlots },
              priority: 1.5
            })
            break
          }
        }
      }
    }
    
    // 3. Try removing courses (last resort)
    if (originalPreferences.selectedCourseNames && originalPreferences.selectedCourseNames.length > 1) {
      const currentCourses = originalPreferences.selectedCourseNames || []
      
      // Try removing one course at a time, starting with courses that have fewer time slots available
      const coursesWithCounts = currentCourses.map(courseName => {
        const courseCount = availableCourses.filter(course => {
          const baseName = this._getBaseCourseNam(course.nameWithLevel || course.name)
          return baseName === courseName
        }).length
        return { courseName, count: courseCount }
      })
      
      // Sort by count (remove courses with fewer options first)
      coursesWithCounts.sort((a, b) => a.count - b.count)
      
      for (const { courseName } of coursesWithCounts) {
        const newCourses = currentCourses.filter(name => name !== courseName)
        if (newCourses.length > 0) {
          const testPrefs = { ...originalPreferences, selectedCourseNames: newCourses }
          if (this._testPreferences(testPrefs, availableCourses)) {
            suggestions.push({
              type: 'removeCourse',
              description: `Remove "${courseName}" from selected courses`,
              changes: { selectedCourseNames: newCourses },
              priority: 3
            })
            break
          }
        }
      }
    }
    
    // Sort suggestions by priority (lower number = higher priority)
    suggestions.sort((a, b) => a.priority - b.priority)
    
    return suggestions.slice(0, 3) // Return top 3 suggestions
  }

  /**
   * Test if given preferences would yield a solution
   */
  _testPreferences(preferences, availableCourses) {
    const testSolver = new ConstraintSolver()
    
    // Create variables
    for (const course of availableCourses) {
      const variableName = `course_${course.id}`
      const domain = [course.id, 'none']
      testSolver.addVariable(variableName, domain)
    }
    
    // Temporarily switch solver
    const originalSolver = this.solver
    this.solver = testSolver
    
    // Add constraints with test preferences
    this._addTimeConstraints(preferences)
    this._addDayConstraints(preferences)
    this._addBlockedDaysConstraints(preferences)
    this._addMaxCoursesPerDayConstraint(preferences)
    this._addTimeGapConstraints(preferences)
    this._addNoDuplicateCoursesConstraint(preferences)
    this._addNoOverlappingCoursesConstraint(preferences)
    
    // Test solve (limit to 1 solution for speed)
    const testSolutions = testSolver.solve()
    const formattedSolutions = this._formatSolutions(testSolutions, availableCourses)
    
    // Restore original solver
    this.solver = originalSolver
    
    return formattedSolutions.length > 0
  }

  _groupCoursesByName(courses) {
    const groups = new Map()
    
    for (const course of courses) {
      const baseName = this._getBaseCourseNam(course.nameWithLevel || course.name)
      if (!groups.has(baseName)) {
        groups.set(baseName, [])
      }
      groups.get(baseName).push(course)
    }
    
    return groups
  }

  _getBaseCourseNam(courseName) {
    // Keep level information but normalize name
    return courseName
      .trim()
  }

  _addTimeConstraints(preferences) {
    // Time constraints are now handled per-day via _addDayConstraints
    // This method is kept for compatibility but no longer adds global time constraints
  }

  _addDayConstraints(preferences) {
    // Check per-day time slots if they exist
    if (preferences.perDayTimeSlots && Object.keys(preferences.perDayTimeSlots).length > 0) {
      const variableNames = Array.from(this.solver.variables.keys())
      
      this.solver.addConstraint((assignments) => {
        for (const [variable, courseId] of Object.entries(assignments)) {
          if (courseId === 'none') continue
          
          const course = this.courses.find(c => c.id === courseId)
          if (!course) continue

          const daySlots = preferences.perDayTimeSlots[course.day]
          
          // If day slots are defined for this day
          if (daySlots !== undefined) {
            // If the array is empty, no courses are allowed on this day
            if (daySlots.length === 0) {
              return false
            }
            
            // Convert course start time to minutes for comparison
            const startTime = course.startTime
            const courseTimeInMinutes = startTime.getHours() * 60 + startTime.getMinutes()
            
            if (!daySlots.includes(courseTimeInMinutes)) {
              return false
            }
          }
          // If no specific day slots are defined for this day, allow all courses on that day
        }
        return true
      }, variableNames, 'Per-day time constraints')
    }
  }

  _addMaxCoursesPerDayConstraint(preferences) {
    if (preferences.maxCoursesPerDay) {
      const variableNames = Array.from(this.solver.variables.keys())
      
      this.solver.addConstraint((assignments) => {
        const coursesPerDay = new Map()
        
        for (const [variable, courseId] of Object.entries(assignments)) {
          if (courseId === 'none') continue
          
          const course = this.courses.find(c => c.id === courseId)
          if (!course) continue

          const count = coursesPerDay.get(course.day) || 0
          coursesPerDay.set(course.day, count + 1)
          
          if (count + 1 > preferences.maxCoursesPerDay) {
            return false
          }
        }
        
        return true
      }, variableNames, 'Max courses per day')
    }
  }

  _addTimeGapConstraints(preferences) {
    if (preferences.maxTimeBetweenCourses) {
      const variableNames = Array.from(this.solver.variables.keys())
      
      this.solver.addConstraint((assignments) => {
        const selectedCourses = []
        
        for (const [variable, courseId] of Object.entries(assignments)) {
          if (courseId === 'none') continue
          
          const course = this.courses.find(c => c.id === courseId)
          if (course) selectedCourses.push(course)
        }

        // Check time gaps between courses on the same day
        const coursesByDay = new Map()
        for (const course of selectedCourses) {
          if (!coursesByDay.has(course.day)) {
            coursesByDay.set(course.day, [])
          }
          coursesByDay.get(course.day).push(course)
        }

        for (const [day, dayCourses] of coursesByDay) {
          if (dayCourses.length < 2) continue

          // Sort by start time
          dayCourses.sort((a, b) => a.startTime - b.startTime)

          for (let i = 1; i < dayCourses.length; i++) {
            const prevCourse = dayCourses[i - 1]
            const currentCourse = dayCourses[i]
            
            const gapHours = (currentCourse.startTime - prevCourse.endTime) / (1000 * 60 * 60)
            
            if (gapHours > preferences.maxTimeBetweenCourses) {
              return false
            }
          }
        }

        return true
      }, variableNames, 'Time gap constraints')
    }
  }

  _addBlockedDaysConstraints(preferences) {
    if (preferences.blockedDays && preferences.blockedDays.length > 0) {
      this.solver.addConstraint((assignments) => {
        for (const [variable, courseId] of Object.entries(assignments)) {
          if (courseId === 'none') continue
          
          const course = this.courses.find(c => c.id === courseId)
          if (!course) continue

          if (preferences.blockedDays.includes(course.day)) {
            return false
          }
        }
        return true
      }, Array.from(this.solver.variables.keys()), 'Blocked days constraints')
    }
  }

  _addNoDuplicateCoursesConstraint(preferences) {
    if (preferences.noDuplicateCoursesPerDay) {
      this.solver.addConstraint((assignments) => {
        const coursesByDay = new Map()
        
        for (const [variable, courseId] of Object.entries(assignments)) {
          if (courseId === 'none') continue
          
          const course = this.courses.find(c => c.id === courseId)
          if (!course) continue

          const baseName = this._getBaseCourseNam(course.name)
          const dayKey = `${course.day}-${baseName}`
          
          if (coursesByDay.has(dayKey)) {
            return false // Duplicate course name on same day
          }
          coursesByDay.set(dayKey, true)
        }
        
        return true
      }, Array.from(this.solver.variables.keys()), 'No duplicate courses per day')
    }
  }

  _addNoOverlappingCoursesConstraint(preferences) {
    if (preferences.preventOverlaps !== false) { // Default to true
      this.solver.addConstraint((assignments) => {
        const timeSlots = new Map()
        
        for (const [variable, courseId] of Object.entries(assignments)) {
          if (courseId === 'none') continue
          
          const course = this.courses.find(c => c.id === courseId)
          if (!course) continue

          const startTime = course.startTime.getTime()
          const endTime = course.endTime.getTime()
          
          // Check for overlaps with already scheduled courses
          for (const [existingSlot, existingCourse] of timeSlots) {
            const [existingStart, existingEnd] = existingSlot.split('-').map(Number)
            
            // Check if times overlap
            if ((startTime < existingEnd && endTime > existingStart)) {
              return false // Time conflict
            }
          }
          
          const timeSlot = `${startTime}-${endTime}`
          timeSlots.set(timeSlot, course)
        }
        
        return true
      }, Array.from(this.solver.variables.keys()), 'No overlapping courses')
    }
  }

  _formatSolutions(solutions, availableCourses) {
    const formattedSolutions = []

    // Get the set of unique course names that were selected
    const selectedCourseNames = new Set()
    for (const course of availableCourses) {
      const baseName = this._getBaseCourseNam(course.nameWithLevel || course.name)
      selectedCourseNames.add(baseName)
    }

    for (const solution of solutions) {
      const schedule = []
      let totalCourses = 0

      for (const [variable, courseId] of Object.entries(solution)) {
        if (courseId === 'none') continue

        const course = this.courses.find(c => c.id === courseId)
        if (course) {
          schedule.push(course)
          totalCourses++
        }
      }

      // Only include schedules that contain ALL selected course names and no duplicate course names
      if (totalCourses > 0) {
        // Check which course names are represented in this schedule
        const scheduleCoursesNames = new Set()
        let hasDuplicates = false
        
        for (const course of schedule) {
          const baseName = this._getBaseCourseNam(course.name)
          if (scheduleCoursesNames.has(baseName)) {
            hasDuplicates = true
            break
          }
          scheduleCoursesNames.add(baseName)
        }
        
        // Only accept complete schedules (all selected courses included) with no duplicates
        if (!hasDuplicates && scheduleCoursesNames.size === selectedCourseNames.size) {
          // Verify all selected course names are present
          let hasAllCourses = true
          for (const selectedName of selectedCourseNames) {
            if (!scheduleCoursesNames.has(selectedName)) {
              hasAllCourses = false
              break
            }
          }
          
          if (hasAllCourses) {
            // Sort by day and time
            schedule.sort((a, b) => {
              const dayOrder = { MO: 1, DI: 2, MI: 3, DO: 4, FR: 5, SA: 6, SO: 7 }
              if (dayOrder[a.day] !== dayOrder[b.day]) {
                return dayOrder[a.day] - dayOrder[b.day]
              }
              return a.startTime - b.startTime
            })

            formattedSolutions.push({
              courses: schedule,
              totalCourses,
              score: this._calculateScheduleScore(schedule)
            })
          }
        }
      }
    }

    // Sort solutions by score (higher is better)
    formattedSolutions.sort((a, b) => b.score - a.score)

    return formattedSolutions.slice(0, 20) // Return top 20 solutions
  }

  _calculateScheduleScore(schedule) {
    let score = schedule.length * 10 // Base score for number of courses

    // Bonus for fewer days used (prioritize compact schedules)
    const daysUsed = new Set(schedule.map(c => c.day)).size
    score += (7 - daysUsed) * 8 // Higher bonus for fewer days (max 48 points for 1 day)

    // Penalty for long gaps between courses
    const coursesByDay = new Map()
    for (const course of schedule) {
      if (!coursesByDay.has(course.day)) {
        coursesByDay.set(course.day, [])
      }
      coursesByDay.get(course.day).push(course)
    }

    for (const [day, dayCourses] of coursesByDay) {
      if (dayCourses.length > 1) {
        dayCourses.sort((a, b) => a.startTime - b.startTime)
        for (let i = 1; i < dayCourses.length; i++) {
          const gap = (dayCourses[i].startTime - dayCourses[i-1].endTime) / (1000 * 60)
          if (gap > 12) score -= Math.floor(gap / 30) // Penalty for gaps over 12 minutes
        }
      }
    }

    return score
  }

  getCourseTypes() {
    const types = new Set()
    for (const course of this.courses) {
      if (course.type) types.add(course.type)
    }
    return Array.from(types).sort()
  }

  getCourseNames() {
    const names = new Set()
    for (const course of this.courses) {
      names.add(this._getBaseCourseNam(course.nameWithLevel || course.name))
    }
    return Array.from(names).sort()
  }

  getCourseGroups() {
    return this._groupCoursesByName(this.courses)
  }
}

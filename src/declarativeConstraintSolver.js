/**
 * Declarative Constraint Solver for Dance Course Scheduling
 * 
 * A more maintainable, testable, and debuggable constraint solver
 * that uses a declarative approach with clear separation of concerns.
 */

/**
 * Represents a time slot with day and time in minutes from midnight
 */
class TimeSlot {
  constructor(day, slot) {
    this.day = day // 'MO', 'DI', etc.
    this.slot = slot // minutes from midnight (e.g., 1200 = 20:00)
  }

  toString() {
    const hours = Math.floor(this.slot / 60)
    const minutes = this.slot % 60
    return `${this.day} ${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`
  }

  equals(other) {
    return this.day === other.day && this.slot === other.slot
  }

  // Calculate gap in slots between two time slots on the same day
  gapTo(other) {
    if (this.day !== other.day) return Infinity
    return Math.abs(other.slot - this.slot) / 60 // Convert to hours
  }

  // Check if this slot can fit between two other slots (with buffer for course duration)
  canFitBetween(startSlot, endSlot, courseDurationMinutes = 70) {
    if (this.day !== startSlot.day || this.day !== endSlot.day) return false
    const startTime = Math.min(startSlot.slot, endSlot.slot)
    const endTime = Math.max(startSlot.slot, endSlot.slot)
    
    // Check if this slot starts after the first course ends and finishes before the second starts
    return this.slot >= (startTime + courseDurationMinutes) && 
           (this.slot + courseDurationMinutes) <= endTime
  }
}

/**
 * Represents a course with its name and available time slots
 */
class Course {
  constructor(name, availableSlots) {
    this.name = name
    this.availableSlots = availableSlots.map(slot => new TimeSlot(slot.day, slot.slot))
  }
}

/**
 * Represents a partial or complete schedule assignment
 */
class Schedule {
  constructor(assignments = {}) {
    this.assignments = { ...assignments } // courseName -> TimeSlot[]
  }

  clone() {
    const cloned = {}
    for (const [courseName, slots] of Object.entries(this.assignments)) {
      cloned[courseName] = [...slots]
    }
    return new Schedule(cloned)
  }

  assign(courseName, slots) {
    const newSchedule = this.clone()
    newSchedule.assignments[courseName] = slots
    return newSchedule
  }

  getAllAssignedSlots() {
    const allSlots = []
    for (const slots of Object.values(this.assignments)) {
      allSlots.push(...slots)
    }
    return allSlots
  }

  getSlotsByDay() {
    const slotsByDay = {}
    for (const slots of Object.values(this.assignments)) {
      for (const slot of slots) {
        if (!slotsByDay[slot.day]) slotsByDay[slot.day] = []
        slotsByDay[slot.day].push(slot)
      }
    }
    return slotsByDay
  }

  computeStats(courseDurationMinutes = 70) {
    const slotsByDay = this.getSlotsByDay()
    const days = Object.keys(slotsByDay)
    
    // Calculate max gap between courses on any single day, quantized by slot duration
    let maxGap = 0
    for (const [day, daySlots] of Object.entries(slotsByDay)) {
      if (daySlots.length < 2) continue
      
      const sortedSlots = daySlots.sort((a, b) => a.slot - b.slot)
      for (let i = 1; i < sortedSlots.length; i++) {
        const previousStart = sortedSlots[i-1].slot
        const nextStart = sortedSlots[i].slot
        const gapMinutes = nextStart - previousStart
        // Quantize gap to whole slots based on configured course duration
        const gapSlots = Math.floor(gapMinutes / courseDurationMinutes)
        const gapHoursQuantized = (gapSlots * courseDurationMinutes) / 60
        maxGap = Math.max(maxGap, gapHoursQuantized)
      }
    }

    // Find busiest day
    const coursesOnBusiestDay = Math.max(...Object.values(slotsByDay).map(slots => slots.length), 0)

    // Calculate score: days * 2 + max gap - busiest day * 2
    const score = days.length * 2 + maxGap - coursesOnBusiestDay * 2

    return {
      days: days.length,
      maxGapBetweenCourses: maxGap,
      coursesOnBusiestDay,
      score,
      schedule: this.assignments
    }
  }
}

/**
 * Constraint interface - all constraints implement this
 */
class Constraint {
  /**
   * Check if a schedule violates this constraint
   * @param {Schedule} schedule - The schedule to check
   * @returns {boolean} true if constraint is satisfied, false if violated
   */
  isSatisfied(schedule) {
    throw new Error('Constraint.isSatisfied must be implemented')
  }

  /**
   * Get a human-readable description of this constraint
   * @returns {string} Description
   */
  getDescription() {
    throw new Error('Constraint.getDescription must be implemented')
  }
}

/**
 * Constraint: Maximum courses per day
 */
class MaxCoursesPerDayConstraint extends Constraint {
  constructor(maxCourses) {
    super()
    this.maxCourses = maxCourses
  }

  isSatisfied(schedule) {
    const slotsByDay = schedule.getSlotsByDay()
    for (const daySlots of Object.values(slotsByDay)) {
      if (daySlots.length > this.maxCourses) {
        return false
      }
    }
    return true
  }

  getDescription() {
    return `Maximum ${this.maxCourses} courses per day`
  }
}

/**
 * Constraint: Maximum empty slots between courses on same day
 */
class MaxEmptySlotsBetweenCoursesConstraint extends Constraint {
  constructor(maxEmptySlots, courseDurationMinutes = 70) {
    super()
    this.maxEmptySlots = maxEmptySlots
    this.courseDurationMinutes = courseDurationMinutes
  }

  isSatisfied(schedule) {
    const slotsByDay = schedule.getSlotsByDay()
    
    for (const [day, daySlots] of Object.entries(slotsByDay)) {
      if (daySlots.length < 2) continue
      
      const sortedSlots = daySlots.sort((a, b) => a.slot - b.slot)
      for (let i = 1; i < sortedSlots.length; i++) {
        // Gap based on start-to-start difference, quantized to configured slot duration
        const previousStart = sortedSlots[i-1].slot
        const nextStart = sortedSlots[i].slot
        const gapMinutes = nextStart - previousStart
        const gapSlots = Math.floor(gapMinutes / this.courseDurationMinutes)
        const gapHoursQuantized = (gapSlots * this.courseDurationMinutes) / 60
        if (gapHoursQuantized > this.maxEmptySlots) {
          return false
        }
      }
    }
    return true
  }

  getDescription() {
    return `Maximum ${this.maxEmptySlots} hours gap between courses on same day (course duration: ${this.courseDurationMinutes}min)`
  }
}

/**
 * Constraint: No overlapping time slots
 */
class NoOverlappingSlotsConstraint extends Constraint {
  isSatisfied(schedule) {
    const allSlots = schedule.getAllAssignedSlots()
    
    for (let i = 0; i < allSlots.length; i++) {
      for (let j = i + 1; j < allSlots.length; j++) {
        if (allSlots[i].equals(allSlots[j])) {
          return false
        }
      }
    }
    return true
  }

  getDescription() {
    return 'No overlapping time slots'
  }
}

/**
 * Constraint: Course multiplicity requirements
 */
class CourseMultiplicityConstraint extends Constraint {
  constructor(multiplicityMap) {
    super()
    this.multiplicityMap = multiplicityMap || {}
  }

  isSatisfied(schedule) {
    // Enforce exact multiplicity for assigned courses
    for (const [courseName, slots] of Object.entries(schedule.assignments)) {
      if (courseName in this.multiplicityMap) {
        const requiredCount = this.multiplicityMap[courseName]
        const actualCount = slots.length
        if (actualCount !== requiredCount) {
          return false
        }
      } else {
        // Courses not in multiplicity map must appear exactly once
        if (slots.length !== 1) {
          return false
        }
      }
    }
    
    return true
  }

  // New method to check complete schedules
  isCompleteScheduleSatisfied(schedule, allCourseNames) {
    // Check that each course in the problem set appears the required number of times
    for (const [courseName, requiredCount] of Object.entries(this.multiplicityMap)) {
      if (!allCourseNames.includes(courseName)) continue // ignore multiplicity for courses not in this problem
      const actualCount = (schedule.assignments[courseName] || []).length
      if (actualCount !== requiredCount) {
        return false
      }
    }
    
    // Check that all courses are assigned with correct counts
    for (const courseName of allCourseNames) {
      const slots = schedule.assignments[courseName] || []
      if (courseName in this.multiplicityMap) {
        const requiredCount = this.multiplicityMap[courseName]
        if (slots.length !== requiredCount) {
          return false
        }
      } else {
        // Courses not in multiplicity map must appear exactly once
        if (slots.length !== 1) {
          return false
        }
      }
    }
    
    return true
  }

  getDescription() {
    const descriptions = []
    for (const [courseName, count] of Object.entries(this.multiplicityMap)) {
      descriptions.push(`${courseName}: ${count} times`)
    }
    return `Course multiplicity: ${descriptions.join(', ')}`
  }
}

/**
 * Main Declarative Constraint Solver
 * 
 * A constraint-based scheduling solver that uses backtracking search to find
 * valid course schedules. It supports multiple constraint types and can find
 * single solutions or enumerate all possible solutions.
 * 
 * Architecture:
 * - Uses constraint satisfaction problem (CSP) approach
 * - Employs backtracking search with constraint propagation
 * - Supports pluggable constraint types for extensibility
 * - Provides detailed failure analysis when no solution exists
 * 
 * Constraint Types:
 * - NoOverlappingSlotsConstraint: Prevents time slot conflicts
 * - MaxCoursesPerDayConstraint: Limits courses per day
 * - MaxEmptySlotsBetweenCoursesConstraint: Controls gaps between courses
 * - CourseMultiplicityConstraint: Requires specific course frequencies
 * 
 * Search Algorithm:
 * 1. Parse input into Course objects with available time slots
 * 2. Add implicit constraints based on input parameters
 * 3. Use backtracking to assign slots to each course sequentially
 * 4. At each step, check partial assignment against all constraints
 * 5. Backtrack when constraints are violated, continue when satisfied
 * 6. Return first solution found, or enumerate all solutions up to a limit
 * 
 * @example
 * ```js
 * const solver = new DeclarativeConstraintSolver()
 * 
 * // Single solution
 * const result = solver.solve({
 *   selectedCourses: {
 *     'Course A': [{ day: 'MO', slot: 1080 }],
 *     'Course B': [{ day: 'DI', slot: 1140 }]
 *   },
 *   maxCoursesPerDay: 2
 * })
 * 
 * // Multiple solutions
 * const allSolutions = solver.findAllSolutions({
 *   selectedCourses: {
 *     'Course A': [{ day: 'MO', slot: 1080 }, { day: 'MO', slot: 1140 }],
 *     'Course B': [{ day: 'DI', slot: 1080 }, { day: 'DI', slot: 1140 }]
 *   }
 * }, 10)
 * ```
 */
export class DeclarativeConstraintSolver {
  constructor(options = {}) {
    this.constraints = []
    this.debugMode = false
    this.courseDurationMinutes = options.courseDurationMinutes || 70 // Default: 60min class + 10min break
  }

  /**
   * Enable or disable debug logging
   * @param {boolean} enabled 
   */
  setDebugMode(enabled) {
    this.debugMode = enabled
  }

  /**
   * Set the course duration in minutes for gap calculations
   * @param {number} durationMinutes - Duration in minutes (default: 70)
   */
  setCourseDuration(durationMinutes) {
    this.courseDurationMinutes = durationMinutes
  }

  /**
   * Add a constraint to the solver
   * @param {Constraint} constraint 
   */
  addConstraint(constraint) {
    this.constraints.push(constraint)
    if (this.debugMode) {
      console.log(`[DeclarativeSolver] Added constraint: ${constraint.getDescription()}`)
    }
  }

  /**
   * Solve the course scheduling problem
   * 
   * Uses backtracking search to find a single valid schedule that satisfies
   * all constraints. Returns the first solution found, along with quality
   * metrics like total days used, gaps between courses, and overall score.
   * 
   * @param {Object} input - The input specification
   * @param {Object} input.selectedCourses - Map of course names to available time slots
   * @param {number} [input.maxCoursesPerDay] - Maximum courses allowed per day
   * @param {number} [input.maxEmptySlotsBetweenCourses] - Maximum hours between courses on same day
   * @param {number} [input.minEmptySlotsBetweenCourses] - Minimum hours between courses on same day
   * @param {Object} [input.courseMultiplicity] - Required occurrences per course
   * @param {Array} [input.selectedDays] - Days of week to consider (not implemented)
   * @param {Object} [input.timeRange] - Time range constraints (not implemented)
   * @param {Array} [input.pairOnlyFilters] - Courses requiring pairs (not implemented)
   * @param {boolean} [input.hasPair] - Whether user has a dance partner (not implemented)
   * 
   * @returns {Object} Solution object with success status and schedule details
   * @returns {boolean} returns.success - Whether a solution was found
   * @returns {number} [returns.days] - Number of days used in solution
   * @returns {number} [returns.maxGapBetweenCourses] - Longest gap between courses (hours)
   * @returns {number} [returns.coursesOnBusiestDay] - Most courses scheduled on any day
   * @returns {number} [returns.score] - Quality score (higher = better)
   * @returns {Object} [returns.schedule] - Map of course names to assigned time slots
   * @returns {string} [returns.reason] - Reason for failure (if success = false)
   * @returns {Object} [returns.details] - Detailed failure analysis (if success = false)
   * @returns {Array} [returns.constraints] - List of active constraints (if success = false)
   */
  solve(input) {
    if (this.debugMode) {
      console.log('[DeclarativeSolver] Starting solve with input:', input)
    }

    // Parse input
    const courses = this._parseInput(input)
    const courseNames = Object.keys(input.selectedCourses)

    // Add implicit constraints based on input
    this._addImplicitConstraints(input)

    if (this.debugMode) {
      console.log(`[DeclarativeSolver] Solving for ${courseNames.length} courses with ${this.constraints.length} constraints`)
    }

    // Use backtracking to find a solution
    const solution = this._backtrack(courses, courseNames, 0, new Schedule())
    
    if (solution) {
      // Final verification: ensure the solution fully satisfies all constraints
      const isValid = this._isValidSchedule(solution, courseNames)
      if (!isValid) {
        if (this.debugMode) {
          console.warn('[DeclarativeSolver] Discarding invalid solution after verification')
        }
        const failureInfo = this._analyzeFailure(courses, courseNames)
        return {
          success: false,
          reason: 'No valid solution found',
          details: failureInfo,
          constraints: this.getConstraintsSummary()
        }
      }

      const stats = solution.computeStats(this.courseDurationMinutes)
      if (this.debugMode) {
        console.log('[DeclarativeSolver] Found solution:', stats)
      }
      return {
        success: true,
        ...stats
      }
    } else {
      const failureInfo = this._analyzeFailure(courses, courseNames)
      if (this.debugMode) {
        console.log('[DeclarativeSolver] No solution found:', failureInfo)
      }
      return {
        success: false,
        reason: 'No valid solution found',
        details: failureInfo,
        constraints: this.getConstraintsSummary()
      }
    }
  }

  /**
   * Find all possible solutions (up to a limit)
   * 
   * Exhaustively searches for all valid schedules that satisfy the constraints.
   * Uses the same backtracking algorithm as solve() but continues searching
   * after finding each solution. Results are sorted by quality score.
   * 
   * Performance Note: The search space grows exponentially with the number of
   * courses and available slots. Use maxSolutions parameter to limit runtime.
   * 
   * @param {Object} input - The input specification (same format as solve())
   * @param {number} [maxSolutions=10] - Maximum number of solutions to find
   * 
   * @returns {Object} Results object with success status and solutions
   * @returns {boolean} returns.success - Whether any solutions were found
   * @returns {Array} returns.schedules - Array of solution objects, sorted by score
   * @returns {number} returns.schedules[].days - Number of days in this solution
   * @returns {number} returns.schedules[].maxGapBetweenCourses - Longest gap in this solution
   * @returns {number} returns.schedules[].coursesOnBusiestDay - Most courses on any day
   * @returns {number} returns.schedules[].score - Quality score for this solution
   * @returns {Object} returns.schedules[].schedule - Course to time slot assignments
   */
  findAllSolutions(input, maxSolutions = 10) {
    if (this.debugMode) {
      console.log(`[DeclarativeSolver] Finding all solutions (max: ${maxSolutions})`)
    }

    const courses = this._parseInput(input)
    const courseNames = Object.keys(input.selectedCourses)
    this._addImplicitConstraints(input)

    const solutions = []
    this._backtrackAll(courses, courseNames, 0, new Schedule(), solutions, maxSolutions)

    // Filter out any solutions that fail final verification
    const verifiedSolutions = solutions.filter(sol => this._isValidSchedule(sol, courseNames))

    // Sort solutions by score (higher is better) and compute stats with course duration
    const solutionsWithStats = verifiedSolutions.map(schedule => schedule.computeStats(this.courseDurationMinutes))
    solutionsWithStats.sort((a, b) => b.score - a.score)

    if (this.debugMode) {
      console.log(`[DeclarativeSolver] Found ${solutionsWithStats.length} solutions`)
    }

    return {
      success: solutionsWithStats.length > 0,
      schedules: solutionsWithStats
    }
  }

  /**
   * Parse input into Course objects
   * @private
   */
  _parseInput(input) {
    const courses = {}
    for (const [courseName, slots] of Object.entries(input.selectedCourses)) {
      courses[courseName] = new Course(courseName, slots)
    }
    return courses
  }

  /**
   * Add constraints based on input parameters
   * @private
   */
  _addImplicitConstraints(input) {
    // Clear existing constraints
    this.constraints = []

    // Always add no overlapping constraint
    this.addConstraint(new NoOverlappingSlotsConstraint())

    // Add max courses per day constraint
    if (input.maxCoursesPerDay) {
      this.addConstraint(new MaxCoursesPerDayConstraint(input.maxCoursesPerDay))
    }

    // Add max empty slots constraint
    if (input.maxEmptySlotsBetweenCourses !== undefined) {
      this.addConstraint(new MaxEmptySlotsBetweenCoursesConstraint(input.maxEmptySlotsBetweenCourses, this.courseDurationMinutes))
    }

    // Add course multiplicity constraint
    if (input.courseMultiplicity) {
      this.addConstraint(new CourseMultiplicityConstraint(input.courseMultiplicity))
    }
  }

  /**
   * Backtracking algorithm to find a single solution
   * @private
   */
  _backtrack(courses, courseNames, courseIndex, currentSchedule) {
    // Base case: all courses assigned
    if (courseIndex >= courseNames.length) {
      return this._isValidSchedule(currentSchedule, courseNames) ? currentSchedule : null
    }

    const courseName = courseNames[courseIndex]
    const course = courses[courseName]
    const requiredSlots = this._getRequiredSlots(courseName, currentSchedule)

    // Try all combinations of available slots for this course
    const combinations = this._generateSlotCombinations(course.availableSlots, requiredSlots)
    
    for (const combination of combinations) {
      const newSchedule = currentSchedule.assign(courseName, combination)
      
      // Check if this assignment violates any constraints
      if (this._isValidPartialSchedule(newSchedule)) {
        const result = this._backtrack(courses, courseNames, courseIndex + 1, newSchedule)
        if (result) return result
      }
    }

    return null
  }

  /**
   * Backtracking algorithm to find all solutions
   * @private
   */
  _backtrackAll(courses, courseNames, courseIndex, currentSchedule, solutions, maxSolutions) {
    if (solutions.length >= maxSolutions) return

    // Base case: all courses assigned
    if (courseIndex >= courseNames.length) {
      if (this._isValidSchedule(currentSchedule, courseNames)) {
        solutions.push(currentSchedule)
      }
      return
    }

    const courseName = courseNames[courseIndex]
    const course = courses[courseName]
    const requiredSlots = this._getRequiredSlots(courseName, currentSchedule)

    // Try all combinations of available slots for this course
    const combinations = this._generateSlotCombinations(course.availableSlots, requiredSlots)
    
    for (const combination of combinations) {
      if (solutions.length >= maxSolutions) break
      
      const newSchedule = currentSchedule.assign(courseName, combination)
      
      // Check if this assignment violates any constraints
      if (this._isValidPartialSchedule(newSchedule)) {
        this._backtrackAll(courses, courseNames, courseIndex + 1, newSchedule, solutions, maxSolutions)
      }
    }
  }

  /**
   * Get the required number of slots for a course
   * @private
   */
  _getRequiredSlots(courseName, schedule) {
    // Check if there's a multiplicity constraint for this course
    for (const constraint of this.constraints) {
      if (constraint instanceof CourseMultiplicityConstraint) {
        return constraint.multiplicityMap[courseName] || 1
      }
    }
    return 1
  }

  /**
   * Generate all valid combinations of slots for a course
   * @private
   */
  _generateSlotCombinations(availableSlots, requiredCount) {
    // If no slots are available, no combinations are possible
    if (availableSlots.length === 0) {
      return []
    }
    
    // If we need more slots than are available, no combinations are possible
    if (requiredCount > availableSlots.length) {
      return []
    }
    
    if (requiredCount === 1) {
      return availableSlots.map(slot => [slot])
    }
    
    // For multiple slots, generate all combinations
    const combinations = []
    this._generateCombinations(availableSlots, requiredCount, 0, [], combinations)
    return combinations
  }

  /**
   * Helper for generating combinations
   * @private
   */
  _generateCombinations(slots, count, start, current, results) {
    if (current.length === count) {
      results.push([...current])
      return
    }

    for (let i = start; i < slots.length; i++) {
      current.push(slots[i])
      this._generateCombinations(slots, count, i + 1, current, results)
      current.pop()
    }
  }

  /**
   * Check if a partial schedule is valid
   * @private
   */
  _isValidPartialSchedule(schedule) {
    for (const constraint of this.constraints) {
      if (!constraint.isSatisfied(schedule)) {
        if (this.debugMode) {
          console.log(`[DeclarativeSolver] Constraint violated: ${constraint.getDescription()}`)
        }
        return false
      }
    }
    return true
  }

  /**
   * Check if a complete schedule is valid
   * @private
   */
  _isValidSchedule(schedule, allCourseNames = null) {
    // For complete schedules, use special validation for multiplicity constraints
    for (const constraint of this.constraints) {
      if (constraint instanceof CourseMultiplicityConstraint && allCourseNames) {
        if (!constraint.isCompleteScheduleSatisfied(schedule, allCourseNames)) {
          if (this.debugMode) {
            console.log(`[DeclarativeSolver] Complete schedule constraint violated: ${constraint.getDescription()}`)
          }
          return false
        }
      } else {
        if (!constraint.isSatisfied(schedule)) {
          if (this.debugMode) {
            console.log(`[DeclarativeSolver] Constraint violated: ${constraint.getDescription()}`)
          }
          return false
        }
      }
    }
    return true
  }

  /**
   * Get a summary of all constraints
   */
  getConstraintsSummary() {
    return this.constraints.map(c => c.getDescription())
  }

  /**
   * Analyze why no solution was found
   * @private
   */
  _analyzeFailure(courses, courseNames) {
    const analysis = {
      totalCourses: courseNames.length,
      coursesWithNoSlots: [],
      coursesWithLimitedSlots: [],
      potentialConflicts: [],
      constraintAnalysis: []
    }

    // Check each course for potential issues
    for (const courseName of courseNames) {
      const course = courses[courseName]
      if (course.availableSlots.length === 0) {
        analysis.coursesWithNoSlots.push(courseName)
      } else if (course.availableSlots.length === 1) {
        analysis.coursesWithLimitedSlots.push({
          course: courseName,
          slots: course.availableSlots.length
        })
      }
    }

    // Check for potential slot conflicts
    const allSlots = []
    for (const courseName of courseNames) {
      const course = courses[courseName]
      for (const slot of course.availableSlots) {
        allSlots.push({ course: courseName, slot })
      }
    }

    // Find overlapping slots
    const slotGroups = {}
    for (const { course, slot } of allSlots) {
      const key = `${slot.day}-${slot.slot}`
      if (!slotGroups[key]) slotGroups[key] = []
      slotGroups[key].push(course)
    }

    for (const [slotKey, courses] of Object.entries(slotGroups)) {
      if (courses.length > 1) {
        analysis.potentialConflicts.push({
          slot: slotKey,
          conflictingCourses: courses
        })
      }
    }

    // Analyze each constraint
    for (const constraint of this.constraints) {
      analysis.constraintAnalysis.push({
        constraint: constraint.getDescription(),
        type: constraint.constructor.name
      })
    }

    return analysis
  }
}

// Export individual constraint classes for testing
export {
  TimeSlot,
  Course,
  Schedule,
  Constraint,
  MaxCoursesPerDayConstraint,
  MaxEmptySlotsBetweenCoursesConstraint,
  NoOverlappingSlotsConstraint,
  CourseMultiplicityConstraint
}

/**
 * Hinting Constraint Solver for Dance Course Scheduling
 * 
 * A high-level solver that builds on the DeclarativeConstraintSolver to provide
 * intelligent hints and suggestions when no feasible solution exists.
 * 
 * Features:
 * - Analyzes constraint conflicts and provides specific suggestions
 * - Suggests adding time slots, relaxing constraints, or removing courses
 * - Provides alternative solutions with relaxed constraints
 * - Returns structured hints for UI integration
 */

import { DeclarativeConstraintSolver } from './declarativeConstraintSolver.js'

/**
 * Represents a suggested modification to make scheduling feasible
 */
class SchedulingHint {
  constructor(type, description, modification, impact) {
    this.type = type // 'add_slots', 'remove_course', 'relax_constraint', 'reduce_multiplicity'
    this.description = description // Human-readable description
    this.modification = modification // Specific change details
    this.impact = impact // Expected impact/benefit
  }
}

/**
 * Represents an alternative solution with relaxed constraints
 */
class AlternativeSolution {
  constructor(schedules, relaxedConstraint, description) {
    this.schedules = schedules // Array of valid schedules
    this.relaxedConstraint = relaxedConstraint // Which constraint was relaxed
    this.description = description // What was changed
  }
}

/**
 * High-level solver that provides hints when scheduling fails
 * 
 * This solver wraps the DeclarativeConstraintSolver and adds intelligent
 * analysis capabilities when no solution can be found. It suggests specific
 * modifications to make the problem solvable and provides alternative
 * solutions with relaxed constraints.
 * 
 * @example
 * ```js
 * const solver = new HintingSolver()
 * const result = solver.solve({
 *   selectedCourses: {
 *     'Course A': [{ day: 'MO', slot: 1080 }],
 *     'Course B': [{ day: 'MO', slot: 1080 }] // Conflict!
 *   },
 *   existingCourses: {
 *     'Course A': [
 *       { day: 'MO', slot: 1080 },
 *       { day: 'DI', slot: 1080 } // Additional option
 *     ],
 *     'Course B': [{ day: 'MO', slot: 1080 }]
 *   },
 *   maxCoursesPerDay: 2
 * })
 * 
 * if (result.success) {
 *   console.log('Found schedules:', result.schedules)
 * } else {
 *   console.log('Hints:', result.hints)
 *   console.log('Alternatives:', result.alternatives)
 * }
 * ```
 */
export class HintingSolver {
  constructor(options = {}) {
    this.baseSolver = new DeclarativeConstraintSolver(options)
    this.debugMode = false
  }

  /**
   * Enable or disable debug logging
   * @param {boolean} enabled - Whether to enable debug mode
   */
  setDebugMode(enabled) {
    this.debugMode = enabled
    this.baseSolver.setDebugMode(enabled)
  }

  /**
   * Set the course duration in minutes for gap calculations
   * @param {number} durationMinutes - Duration in minutes (default: 70)
   */
  setCourseDuration(durationMinutes) {
    this.baseSolver.setCourseDuration(durationMinutes)
  }

  /**
   * Solve the scheduling problem with intelligent hints on failure
   * 
   * @param {Object} input - The scheduling problem specification
   * @param {Object} input.selectedCourses - Courses to schedule with their available slots
   * @param {Object} input.existingCourses - All course slots including disabled ones (for hints)
   * @param {number} [input.maxCoursesPerDay] - Maximum courses per day
   * @param {number} [input.maxEmptySlotsBetweenCourses] - Maximum gap between courses
   * @param {number} [input.minEmptySlotsBetweenCourses] - Minimum gap between courses
   * @param {Object} [input.courseMultiplicity] - Required occurrences per course
   * @param {number} [maxSolutions=10] - Maximum solutions to return on success
   * 
   * @returns {Object} Result object with success status, schedules, or hints/alternatives
   * @returns {boolean} returns.success - Whether a solution was found
   * @returns {Array} [returns.schedules] - Valid schedules (on success)
   * @returns {Array} [returns.hints] - Suggested modifications (on failure)
   * @returns {Array} [returns.alternatives] - Alternative solutions (on failure)
   */
  solve(input, maxSolutions = 10) {
    if (this.debugMode) {
      console.log('[HintingSolver] Starting solve with input:', input)
    }

    // First try to solve with the given constraints
    const solutionResult = this.baseSolver.findAllSolutions(input, maxSolutions)
    
    if (solutionResult.success && solutionResult.schedules.length > 0) {
      if (this.debugMode) {
        console.log(`[HintingSolver] Found ${solutionResult.schedules.length} solutions`)
      }
      
      return {
        success: true,
        schedules: solutionResult.schedules
      }
    }

    if (this.debugMode) {
      console.log('[HintingSolver] No solutions found, analyzing constraints...')
    }

    // No solution found - generate hints and alternatives
    const hints = this._generateHints(input)
    const alternatives = this._findAlternativeSolutions(input, maxSolutions)

    return {
      success: false,
      reason: 'No feasible solution with current constraints',
      hints,
      alternatives
    }
  }

  /**
   * Generate specific hints for making the problem solvable
   * @private
   * @param {Object} input - The original input
   * @returns {Array<SchedulingHint>} Array of suggested modifications
   */
  _generateHints(input) {
    const hints = []
    
    // Analyze each type of potential issue
    hints.push(...this._analyzeSlotConflicts(input))
    hints.push(...this._analyzeConstraintConflicts(input))
    hints.push(...this._analyzeMultiplicityIssues(input))
    hints.push(...this._analyzeCourseRemovalOptions(input))
    
    // Sort hints by potential impact
    hints.sort((a, b) => this._getHintPriority(a.type) - this._getHintPriority(b.type))
    
    return hints
  }

  /**
   * Analyze slot conflicts and suggest additional slots
   * @private
   */
  _analyzeSlotConflicts(input) {
    const hints = []
    const slotConflicts = this._findSlotConflicts(input.selectedCourses)
    
    for (const conflict of slotConflicts) {
      // Check if existing courses have additional slots we could suggest
      const coursesInConflict = conflict.courses
      for (const course of coursesInConflict) {
        const selectedSlots = input.selectedCourses[course] || []
        const existingSlots = input.existingCourses?.[course] || []
        const additionalSlots = existingSlots.filter(
          slot => !selectedSlots.some(s => s.day === slot.day && s.slot === slot.slot)
        )
        
        if (additionalSlots.length > 0) {
          hints.push(new SchedulingHint(
            'add_slots',
            `Enable additional time slots for "${course}" to resolve conflict`,
            {
              course,
              suggestedSlots: additionalSlots.slice(0, 3), // Suggest up to 3 additional slots
              conflictSlot: conflict.slot
            },
            'High - directly resolves scheduling conflict'
          ))
        }
      }
    }
    
    return hints
  }

  /**
   * Analyze constraint conflicts and suggest relaxations
   * @private
   */
  _analyzeConstraintConflicts(input) {
    const hints = []
    
    // Test if relaxing max courses per day helps
    if (input.maxCoursesPerDay) {
      const relaxedInput = { ...input, maxCoursesPerDay: input.maxCoursesPerDay + 1 }
      const solutionResult = this.baseSolver.findAllSolutions(relaxedInput, 1)
      if (solutionResult.success && solutionResult.schedules.length > 0) {
        hints.push(new SchedulingHint(
          'relax_constraint',
          `Allow ${input.maxCoursesPerDay + 1} courses per day (currently ${input.maxCoursesPerDay})`,
          {
            constraint: 'maxCoursesPerDay',
            currentValue: input.maxCoursesPerDay,
            suggestedValue: input.maxCoursesPerDay + 1
          },
          'Medium - may enable solution with slightly busier days'
        ))
      }
    }
    
    // Test if increasing max gap helps
    if (input.maxEmptySlotsBetweenCourses !== undefined) {
      const relaxedInput = { ...input, maxEmptySlotsBetweenCourses: input.maxEmptySlotsBetweenCourses + 2 }
      const solutionResult = this.baseSolver.findAllSolutions(relaxedInput, 1)
      if (solutionResult.success && solutionResult.schedules.length > 0) {
        hints.push(new SchedulingHint(
          'relax_constraint',
          `Allow up to ${input.maxEmptySlotsBetweenCourses + 2} hour gaps between courses (currently ${input.maxEmptySlotsBetweenCourses})`,
          {
            constraint: 'maxEmptySlotsBetweenCourses',
            currentValue: input.maxEmptySlotsBetweenCourses,
            suggestedValue: input.maxEmptySlotsBetweenCourses + 2
          },
          'Low - allows longer breaks between courses'
        ))
      }
    }
    
    return hints
  }

  /**
   * Analyze multiplicity issues and suggest reductions
   * @private
   */
  _analyzeMultiplicityIssues(input) {
    const hints = []
    
    if (input.courseMultiplicity) {
      for (const [course, count] of Object.entries(input.courseMultiplicity)) {
        if (count > 1) {
          const reducedInput = {
            ...input,
            courseMultiplicity: {
              ...input.courseMultiplicity,
              [course]: count - 1
            }
          }
          
          const solutionResult = this.baseSolver.findAllSolutions(reducedInput, 1)
          if (solutionResult.success && solutionResult.schedules.length > 0) {
            hints.push(new SchedulingHint(
              'reduce_multiplicity',
              `Take "${course}" ${count - 1} times instead of ${count} times`,
              {
                course,
                currentCount: count,
                suggestedCount: count - 1
              },
              'Medium - reduces time commitment while keeping the course'
            ))
          }
        }
      }
    }
    
    return hints
  }

  /**
   * Analyze which courses could be removed to enable solution
   * @private
   */
  _analyzeCourseRemovalOptions(input) {
    const hints = []
    const courseNames = Object.keys(input.selectedCourses)
    
    // Test removing each course individually
    for (const courseToRemove of courseNames) {
      const reducedCourses = { ...input.selectedCourses }
      delete reducedCourses[courseToRemove]
      
      const reducedInput = { ...input, selectedCourses: reducedCourses }
      const solutionResult = this.baseSolver.findAllSolutions(reducedInput, 1)
      
      if (solutionResult.success && solutionResult.schedules.length > 0) {
        hints.push(new SchedulingHint(
          'remove_course',
          `Consider removing "${courseToRemove}" to make scheduling possible`,
          {
            course: courseToRemove,
            remainingCourses: Object.keys(reducedCourses)
          },
          'High - immediately enables solution for remaining courses'
        ))
      }
    }
    
    return hints
  }

  /**
   * Find slot conflicts in the selected courses
   * @private
   */
  _findSlotConflicts(selectedCourses) {
    const conflicts = []
    const slotMap = new Map()
    
    // Build map of slot -> courses
    for (const [course, slots] of Object.entries(selectedCourses)) {
      for (const slot of slots) {
        const key = `${slot.day}-${slot.slot}`
        if (!slotMap.has(key)) {
          slotMap.set(key, [])
        }
        slotMap.get(key).push(course)
      }
    }
    
    // Find conflicts
    for (const [slotKey, courses] of slotMap) {
      if (courses.length > 1) {
        const [day, slot] = slotKey.split('-')
        conflicts.push({
          slot: { day, slot: parseInt(slot) },
          courses: courses
        })
      }
    }
    
    return conflicts
  }

  /**
   * Find alternative solutions with relaxed constraints
   * @private
   */
  _findAlternativeSolutions(input, maxSolutions) {
    const alternatives = []
    
    // Try relaxing each constraint type
    alternatives.push(...this._tryRelaxedConstraints(input, maxSolutions))
    alternatives.push(...this._tryReducedMultiplicity(input, maxSolutions))
    alternatives.push(...this._tryWithAdditionalSlots(input, maxSolutions))
    
    return alternatives
  }

  /**
   * Try solutions with relaxed constraints
   * @private
   */
  _tryRelaxedConstraints(input, maxSolutions) {
    const alternatives = []
    
    // Relax max courses per day
    if (input.maxCoursesPerDay) {
      for (let extra = 1; extra <= 2; extra++) {
        const relaxedInput = { ...input, maxCoursesPerDay: input.maxCoursesPerDay + extra }
        const solutionResult = this.baseSolver.findAllSolutions(relaxedInput, Math.min(5, maxSolutions))
        
        if (solutionResult.success && solutionResult.schedules.length > 0) {
          alternatives.push(new AlternativeSolution(
            solutionResult.schedules,
            'maxCoursesPerDay',
            `Allow ${input.maxCoursesPerDay + extra} courses per day (was ${input.maxCoursesPerDay})`
          ))
          break // Only suggest the minimal relaxation that works
        }
      }
    }
    
    // Relax gap constraints
    if (input.maxEmptySlotsBetweenCourses !== undefined) {
      for (let extra = 2; extra <= 6; extra += 2) {
        const relaxedInput = { ...input, maxEmptySlotsBetweenCourses: input.maxEmptySlotsBetweenCourses + extra }
        const solutionResult = this.baseSolver.findAllSolutions(relaxedInput, Math.min(5, maxSolutions))
        
        if (solutionResult.success && solutionResult.schedules.length > 0) {
          alternatives.push(new AlternativeSolution(
            solutionResult.schedules,
            'maxEmptySlotsBetweenCourses',
            `Allow ${input.maxEmptySlotsBetweenCourses + extra} hour gaps (was ${input.maxEmptySlotsBetweenCourses})`
          ))
          break
        }
      }
    }
    
    return alternatives
  }

  /**
   * Try solutions with reduced multiplicity
   * @private
   */
  _tryReducedMultiplicity(input, maxSolutions) {
    const alternatives = []
    
    if (input.courseMultiplicity) {
      for (const [course, count] of Object.entries(input.courseMultiplicity)) {
        if (count > 1) {
          const reducedInput = {
            ...input,
            courseMultiplicity: {
              ...input.courseMultiplicity,
              [course]: count - 1
            }
          }
          
          const solutionResult = this.baseSolver.findAllSolutions(reducedInput, Math.min(5, maxSolutions))
          if (solutionResult.success && solutionResult.schedules.length > 0) {
            alternatives.push(new AlternativeSolution(
              solutionResult.schedules,
              'courseMultiplicity',
              `Take "${course}" ${count - 1} times (was ${count} times)`
            ))
          }
        }
      }
    }
    
    return alternatives
  }

  /**
   * Try solutions with additional slots from existing courses
   * @private
   */
  _tryWithAdditionalSlots(input, maxSolutions) {
    const alternatives = []
    
    if (input.existingCourses) {
      // Try enabling all available slots for each course
      for (const [course, existingSlots] of Object.entries(input.existingCourses)) {
        const selectedSlots = input.selectedCourses[course] || []
        const additionalSlots = existingSlots.filter(
          slot => !selectedSlots.some(s => s.day === slot.day && s.slot === slot.slot)
        )
        
        if (additionalSlots.length > 0) {
          const expandedInput = {
            ...input,
            selectedCourses: {
              ...input.selectedCourses,
              [course]: [...selectedSlots, ...additionalSlots]
            }
          }
          
          const solutionResult = this.baseSolver.findAllSolutions(expandedInput, Math.min(5, maxSolutions))
          if (solutionResult.success && solutionResult.schedules.length > 0) {
            alternatives.push(new AlternativeSolution(
              solutionResult.schedules,
              'additionalSlots',
              `Enable ${additionalSlots.length} additional time slot(s) for "${course}"`
            ))
          }
        }
      }
    }
    
    return alternatives
  }

  /**
   * Get priority order for hint types (lower = higher priority)
   * @private
   */
  _getHintPriority(type) {
    const priorities = {
      'add_slots': 1,
      'reduce_multiplicity': 2,
      'relax_constraint': 3,
      'remove_course': 4
    }
    return priorities[type] || 5
  }
}

export { SchedulingHint, AlternativeSolution }

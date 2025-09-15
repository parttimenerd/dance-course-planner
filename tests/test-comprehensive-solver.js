/**
 * Comprehensive tests for the Declarative Constraint Solver
 * Tests edge cases, overlaps, solution enumeration, and failure analysis
 */

import {
  DeclarativeConstraintSolver,
  TimeSlot,
  Course,
  Schedule,
  MaxCoursesPerDayConstraint,
  MaxEmptySlotsBetweenCoursesConstraint,
  NoOverlappingSlotsConstraint,
  CourseMultiplicityConstraint
} from '../src/declarativeConstraintSolver.js'

// Test utilities
function createTimeSlot(day, hour, minute = 0) {
  return { day, slot: hour * 60 + minute }
}

function runTest(testName, testFn) {
  try {
    console.log(`  Testing: ${testName}`)
    testFn()
    console.log(`  ✅ ${testName} PASSED`)
    return true
  } catch (error) {
    console.log(`  ❌ ${testName} FAILED: ${error.message}`)
    return false
  }
}

let passedTests = 0
let totalTests = 0

console.log('🧪 Running Comprehensive Declarative Constraint Solver Tests...')

// Basic functionality tests
console.log('📋 Basic Functionality Tests')
totalTests++
passedTests += runTest('Simple valid schedule', () => {
  const solver = new DeclarativeConstraintSolver()
  const input = {
    selectedCourses: {
      'Course A': [createTimeSlot('MO', 18)],
      'Course B': [createTimeSlot('DI', 19)]
    }
  }
  
  const result = solver.solve(input)
  if (!result || !result.schedule) throw new Error('Expected valid solution')
  if (result.days !== 2) throw new Error('Expected 2 days')
})

totalTests++
passedTests += runTest('No solution with failure analysis', () => {
  const solver = new DeclarativeConstraintSolver()
  const input = {
    selectedCourses: {
      'Course A': [],
      'Course B': [createTimeSlot('MO', 18)]
    }
  }
  
  const result = solver.solve(input)
  if (result.success !== false) throw new Error('Expected failure')
  if (!result.details) throw new Error('Expected failure details')
  if (!result.details.coursesWithNoSlots.includes('Course A')) {
    throw new Error('Expected Course A to be identified as having no slots')
  }
})

// Edge case tests
console.log('🎯 Edge Case Tests')
totalTests++
passedTests += runTest('All courses want same slot (conflict)', () => {
  const solver = new DeclarativeConstraintSolver()
  const sameSlot = createTimeSlot('MO', 18)
  const input = {
    selectedCourses: {
      'Course A': [sameSlot],
      'Course B': [sameSlot],
      'Course C': [sameSlot]
    }
  }
  
  const result = solver.solve(input)
  if (result.success !== false) throw new Error('Expected conflict to make solution impossible')
  if (!result.details.potentialConflicts.length) throw new Error('Expected conflict analysis')
})

totalTests++
passedTests += runTest('Impossible multiplicity requirements', () => {
  const solver = new DeclarativeConstraintSolver()
  const input = {
    selectedCourses: {
      'Course A': [createTimeSlot('MO', 18)] // Only 1 slot available
    },
    courseMultiplicity: {
      'Course A': 3 // But needs 3 slots
    }
  }
  
  const result = solver.solve(input)
  if (result.success !== false) throw new Error('Expected impossible multiplicity to fail')
})

totalTests++
passedTests += runTest('Too many courses for max per day constraint', () => {
  const solver = new DeclarativeConstraintSolver()
  const input = {
    selectedCourses: {
      'Course A': [createTimeSlot('MO', 18)],
      'Course B': [createTimeSlot('MO', 19)],
      'Course C': [createTimeSlot('MO', 20)]
    },
    maxCoursesPerDay: 2
  }
  
  const result = solver.solve(input)
  if (result.success !== false) throw new Error('Expected max courses per day constraint to fail')
})

totalTests++
passedTests += runTest('Gap constraint makes scheduling impossible', () => {
  const solver = new DeclarativeConstraintSolver()
  const input = {
    selectedCourses: {
      'Course A': [createTimeSlot('MO', 10)], // 10:00
      'Course B': [createTimeSlot('MO', 20)]  // 20:00 (10 hour gap)
    },
    maxEmptySlotsBetweenCourses: 5 // Max 5 hours gap
  }
  
  const result = solver.solve(input)
  if (result.success !== false) throw new Error('Expected gap constraint to make solution impossible')
})

// Solution enumeration tests
console.log('🎲 Solution Enumeration Tests')
totalTests++
passedTests += runTest('Single solution problem', () => {
  const solver = new DeclarativeConstraintSolver()
  const input = {
    selectedCourses: {
      'Course A': [createTimeSlot('MO', 18)],
      'Course B': [createTimeSlot('DI', 19)]
    }
  }
  
  const res = solver.findAllSolutions(input)
  const solutions = res.schedules
  if (solutions.length !== 1) throw new Error(`Expected 1 solution, got ${solutions.length}`)
})

totalTests++
passedTests += runTest('Multiple solutions enumeration', () => {
  const solver = new DeclarativeConstraintSolver()
  const input = {
    selectedCourses: {
      'Course A': [createTimeSlot('MO', 18), createTimeSlot('MO', 19)],
      'Course B': [createTimeSlot('DI', 18), createTimeSlot('DI', 19)]
    }
  }
  
  const res = solver.findAllSolutions(input)
  const solutions = res.schedules
  if (solutions.length !== 4) throw new Error(`Expected 4 solutions, got ${solutions.length}`)
})

totalTests++
passedTests += runTest('Maximum solutions limit', () => {
  const solver = new DeclarativeConstraintSolver()
  const input = {
    selectedCourses: {
      'Course A': [
        createTimeSlot('MO', 18), createTimeSlot('MO', 19), createTimeSlot('MO', 20)
      ],
      'Course B': [
        createTimeSlot('DI', 18), createTimeSlot('DI', 19), createTimeSlot('DI', 20)
      ]
    }
  }
  
  const res = solver.findAllSolutions(input, 5) // Limit to 5
  const solutions = res.schedules
  if (solutions.length > 5) throw new Error(`Expected max 5 solutions, got ${solutions.length}`)
})

totalTests++
passedTests += runTest('All solutions are unique', () => {
  const solver = new DeclarativeConstraintSolver()
  const input = {
    selectedCourses: {
      'Course A': [createTimeSlot('MO', 18), createTimeSlot('MO', 19)],
      'Course B': [createTimeSlot('DI', 18), createTimeSlot('DI', 19)]
    }
  }
  
  const res = solver.findAllSolutions(input)
  const solutions = res.schedules
  const scheduleStrings = solutions.map(s => JSON.stringify(s.schedule))
  const uniqueSchedules = new Set(scheduleStrings)
  
  if (scheduleStrings.length !== uniqueSchedules.size) {
    throw new Error('Found duplicate solutions')
  }
})

// Overlap detection tests
console.log('🔍 Overlap Detection Tests')
totalTests++
passedTests += runTest('Direct slot overlap detection', () => {
  const solver = new DeclarativeConstraintSolver()
  const overlapSlot = createTimeSlot('MO', 18)
  const input = {
    selectedCourses: {
      'Course A': [overlapSlot],
      'Course B': [overlapSlot]
    }
  }
  
  const result = solver.solve(input)
  if (result.success !== false) throw new Error('Expected overlap to be detected')
  
  // Check that failure analysis identifies the conflict
  const conflicts = result.details.potentialConflicts
  if (!conflicts.some(c => c.conflictingCourses.includes('Course A') && 
                           c.conflictingCourses.includes('Course B'))) {
    throw new Error('Expected conflict analysis to identify overlapping courses')
  }
})

totalTests++
passedTests += runTest('Multiple course overlap', () => {
  const solver = new DeclarativeConstraintSolver()
  const overlapSlot = createTimeSlot('MO', 18)
  const input = {
    selectedCourses: {
      'Course A': [overlapSlot],
      'Course B': [overlapSlot],
      'Course C': [overlapSlot],
      'Course D': [createTimeSlot('DI', 19)] // This one is fine
    }
  }
  
  const result = solver.solve(input)
  if (result.success !== false) throw new Error('Expected multiple overlap to be detected')
  
  const conflicts = result.details.potentialConflicts
  const moConflict = conflicts.find(c => c.slot === 'MO-1080') // 18:00 = 1080 minutes
  if (!moConflict || moConflict.conflictingCourses.length !== 3) {
    throw new Error('Expected 3-way conflict to be identified')
  }
})

totalTests++
passedTests += runTest('Complex overlap scenarios', () => {
  const solver = new DeclarativeConstraintSolver()
  const input = {
    selectedCourses: {
      'Course A': [createTimeSlot('MO', 18), createTimeSlot('DI', 18)],
      'Course B': [createTimeSlot('MO', 18), createTimeSlot('MI', 18)],
      'Course C': [createTimeSlot('DI', 18), createTimeSlot('DO', 18)]
    }
  }
  
  // This should be solvable: A->DI, B->MI, C->DO
  const result = solver.solve(input)
  if (!result || !result.schedule) throw new Error('Expected valid solution for complex scenario')
})

// Constraint-specific tests
console.log('🚧 Advanced Constraint Tests')
totalTests++
passedTests += runTest('Course multiplicity with insufficient slots', () => {
  const solver = new DeclarativeConstraintSolver()
  const input = {
    selectedCourses: {
      'Course A': [createTimeSlot('MO', 18), createTimeSlot('DI', 18)] // 2 slots
    },
    courseMultiplicity: {
      'Course A': 3 // Needs 3 slots
    }
  }
  
  const result = solver.solve(input)
  if (result.success !== false) throw new Error('Expected insufficient slots to fail')
})

totalTests++
passedTests += runTest('Complex multiplicity scheduling', () => {
  const solver = new DeclarativeConstraintSolver()
  const input = {
    selectedCourses: {
      'Course A': [
        createTimeSlot('MO', 18), createTimeSlot('MO', 19),
        createTimeSlot('DI', 18), createTimeSlot('DI', 19)
      ],
      'Course B': [createTimeSlot('MI', 18)]
    },
    courseMultiplicity: {
      'Course A': 2 // Course A should appear twice
    }
  }
  
  const result = solver.solve(input)
  if (!result || !result.schedule) throw new Error('Expected valid solution')
  if (result.schedule['Course A'].length !== 2) {
    throw new Error('Expected Course A to be scheduled twice')
  }
})

totalTests++
passedTests += runTest('Max courses per day with multiplicity', () => {
  const solver = new DeclarativeConstraintSolver()
  const input = {
    selectedCourses: {
      'Course A': [
        createTimeSlot('MO', 18), createTimeSlot('MO', 19),
        createTimeSlot('MO', 20)
      ]
    },
    courseMultiplicity: {
      'Course A': 3 // All 3 on same day
    },
    maxCoursesPerDay: 2 // But max 2 per day
  }
  
  const result = solver.solve(input)
  if (result.success !== false) throw new Error('Expected constraint conflict to fail')
})

// Performance and stress tests
console.log('⚡ Performance Tests')
totalTests++
passedTests += runTest('Large problem with many solutions', () => {
  const solver = new DeclarativeConstraintSolver()
  const courses = {}
  
  // Create 5 courses, each with 4 possible slots
  for (let i = 0; i < 5; i++) {
    courses[`Course ${i}`] = [
      createTimeSlot('MO', 18 + i),
      createTimeSlot('DI', 18 + i),
      createTimeSlot('MI', 18 + i),
      createTimeSlot('DO', 18 + i)
    ]
  }
  
  const input = { selectedCourses: courses }
  
  const startTime = Date.now()
  const solutions = solver.findAllSolutions(input, 100)
  const endTime = Date.now()
  
  if (solutions.length === 0) throw new Error('Expected at least one solution')
  if (endTime - startTime > 5000) throw new Error('Performance too slow (>5s)')
})

totalTests++
passedTests += runTest('Deep backtracking problem', () => {
  const solver = new DeclarativeConstraintSolver()
  const courses = {}
  
  // Create a problem that requires deep backtracking
  // Each course has limited options that conflict with later courses
  courses['Course A'] = [createTimeSlot('MO', 18), createTimeSlot('MO', 19)]
  courses['Course B'] = [createTimeSlot('MO', 18), createTimeSlot('DI', 18)]
  courses['Course C'] = [createTimeSlot('DI', 18), createTimeSlot('MI', 18)]
  courses['Course D'] = [createTimeSlot('MI', 18), createTimeSlot('DO', 18)]
  
  const input = { selectedCourses: courses }
  
  const result = solver.solve(input)
  if (!result || !result.schedule) throw new Error('Expected solution for deep backtracking')
})

// Debug mode tests
console.log('🔧 Debug Mode Tests')
totalTests++
passedTests += runTest('Debug mode output capture', () => {
  const solver = new DeclarativeConstraintSolver()
  solver.setDebugMode(true)
  
  const input = {
    selectedCourses: {
      'Course A': [createTimeSlot('MO', 18)]
    }
  }
  
  // Capture console output
  const originalLog = console.log
  let debugOutput = []
  console.log = (...args) => debugOutput.push(args.join(' '))
  
  const result = solver.solve(input)
  console.log = originalLog
  
  if (!debugOutput.some(line => line.includes('[DeclarativeSolver]'))) {
    throw new Error('Expected debug output')
  }
})

totalTests++
passedTests += runTest('Constraint summary functionality', () => {
  const solver = new DeclarativeConstraintSolver()
  const input = {
    selectedCourses: {
      'Course A': [createTimeSlot('MO', 18)]
    },
    maxCoursesPerDay: 2,
    maxEmptySlotsBetweenCourses: 3
  }
  
  solver.solve(input) // This adds constraints
  const summary = solver.getConstraintsSummary()
  
  if (!summary.includes('No overlapping time slots')) {
    throw new Error('Expected no overlapping constraint in summary')
  }
  if (!summary.includes('Maximum 2 courses per day')) {
    throw new Error('Expected max courses per day constraint in summary')
  }
})

// Solution quality tests
console.log('🏆 Solution Quality Tests')
totalTests++
passedTests += runTest('Solution scoring and ranking', () => {
  const solver = new DeclarativeConstraintSolver()
  const input = {
    selectedCourses: {
      'Course A': [createTimeSlot('MO', 18), createTimeSlot('DI', 18)],
      'Course B': [createTimeSlot('MO', 19), createTimeSlot('MI', 18)]
    }
  }
  
  const solutions = solver.findAllSolutions(input)
  if (solutions.length < 2) throw new Error('Expected multiple solutions for comparison')
  
  // Solutions should be sorted by score
  for (let i = 1; i < solutions.length; i++) {
    if (solutions[i].score > solutions[i-1].score) {
      throw new Error('Solutions should be sorted by score (descending)')
    }
  }
})

// Test results
console.log(`\n📊 Comprehensive Test Results:`)
console.log(`  ✅ Passed: ${passedTests}`)
console.log(`  ❌ Failed: ${totalTests - passedTests}`)
console.log(`  📈 Success Rate: ${Math.round(passedTests / totalTests * 100)}%`)

if (passedTests === totalTests) {
  console.log('🎉 All comprehensive tests passed! The solver is robust and feature-complete.')
} else {
  console.log('⚠️  Some tests failed. Please review the implementation.')
  process.exit(1)
}

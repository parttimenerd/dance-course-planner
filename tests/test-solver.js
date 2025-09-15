/**
 * Comprehensive test suite using Node.js assert module
 * Tests all aspects of the Declarative Constraint Solver
 */

import assert from 'assert'
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

function createManySlots(day, startHour, count) {
  const slots = []
  for (let i = 0; i < count; i++) {
    slots.push(createTimeSlot(day, startHour + i))
  }
  return slots
}

// Enhanced assertion helpers
function assertValidSolutionOutput(result, expectedValues = {}) {
  // Type validations
  assert.strictEqual(typeof result, 'object', 'Result should be an object')
  assert.ok(result !== null, 'Result should not be null')
  
  // Required properties with correct types
  assert.strictEqual(typeof result.days, 'number', 'days should be a number')
  assert.strictEqual(typeof result.maxGapBetweenCourses, 'number', 'maxGapBetweenCourses should be a number')
  assert.strictEqual(typeof result.coursesOnBusiestDay, 'number', 'coursesOnBusiestDay should be a number')
  assert.strictEqual(typeof result.score, 'number', 'score should be a number')
  assert.strictEqual(typeof result.schedule, 'object', 'schedule should be an object')
  assert.ok(result.schedule !== null, 'schedule should not be null')
  
  // Value constraints
  assert.ok(result.days >= 1, 'days should be at least 1')
  assert.ok(result.days <= 7, 'days should be at most 7 (weekdays)')
  assert.ok(result.maxGapBetweenCourses >= 0, 'maxGapBetweenCourses should be non-negative')
  assert.ok(result.coursesOnBusiestDay >= 1, 'coursesOnBusiestDay should be at least 1')
  assert.ok(Number.isFinite(result.score), 'score should be a finite number')
  
  // No unexpected properties
  const expectedProps = ['days', 'maxGapBetweenCourses', 'coursesOnBusiestDay', 'score', 'schedule']
  Object.keys(result).forEach(key => {
    assert.ok(expectedProps.includes(key), `Unexpected property in result: ${key}`)
  })
  
  // Schedule structure validation
  Object.entries(result.schedule).forEach(([courseName, slots]) => {
    assert.ok(typeof courseName === 'string', `Course name should be string: ${courseName}`)
    assert.ok(Array.isArray(slots), `Course ${courseName} should have array of slots`)
    assert.ok(slots.length >= 1, `Course ${courseName} should have at least 1 slot`)
    
    slots.forEach((slot, index) => {
      assert.strictEqual(typeof slot, 'object', `Slot ${index} for ${courseName} should be object`)
      assert.strictEqual(typeof slot.day, 'string', `Slot ${index} for ${courseName} should have string day`)
      assert.strictEqual(typeof slot.slot, 'number', `Slot ${index} for ${courseName} should have numeric slot`)
      assert.ok(['MO', 'DI', 'MI', 'DO', 'FR'].includes(slot.day), 
        `Slot ${index} for ${courseName} should have valid weekday: ${slot.day}`)
      assert.ok(slot.slot >= 0 && slot.slot < 1440, 
        `Slot ${index} for ${courseName} should have valid time (0-1439 minutes): ${slot.slot}`)
    })
  })
  
  // Verify expected values if provided
  if (expectedValues.days !== undefined) {
    assert.strictEqual(result.days, expectedValues.days, `Expected ${expectedValues.days} days`)
  }
  if (expectedValues.maxGapBetweenCourses !== undefined) {
    assert.strictEqual(result.maxGapBetweenCourses, expectedValues.maxGapBetweenCourses, 
      `Expected maxGapBetweenCourses to be ${expectedValues.maxGapBetweenCourses}`)
  }
  if (expectedValues.coursesOnBusiestDay !== undefined) {
    assert.strictEqual(result.coursesOnBusiestDay, expectedValues.coursesOnBusiestDay, 
      `Expected coursesOnBusiestDay to be ${expectedValues.coursesOnBusiestDay}`)
  }
  if (expectedValues.score !== undefined) {
    assert.strictEqual(result.score, expectedValues.score, 
      `Expected score to be ${expectedValues.score}`)
  }
  if (expectedValues.courseSlots !== undefined) {
    Object.entries(expectedValues.courseSlots).forEach(([courseName, expectedCount]) => {
      assert.ok(courseName in result.schedule, `Expected course ${courseName} in schedule`)
      assert.strictEqual(result.schedule[courseName].length, expectedCount, 
        `Expected ${courseName} to have ${expectedCount} slots`)
    })
  }
  if (expectedValues.specificSlots !== undefined) {
    Object.entries(expectedValues.specificSlots).forEach(([courseName, expectedSlots]) => {
      assert.ok(courseName in result.schedule, `Expected course ${courseName} in schedule`)
      expectedSlots.forEach((expectedSlot, index) => {
        const actualSlot = result.schedule[courseName][index]
        assert.ok(actualSlot, `Expected slot ${index} for ${courseName}`)
        assert.strictEqual(actualSlot.day, expectedSlot.day, 
          `Expected ${courseName} slot ${index} day to be ${expectedSlot.day}`)
        assert.strictEqual(actualSlot.slot, expectedSlot.slot, 
          `Expected ${courseName} slot ${index} time to be ${expectedSlot.slot}`)
      })
    })
  }
}

function assertValidFailureOutput(result, expectedDetails = {}) {
  // Type validations
  assert.strictEqual(typeof result, 'object', 'Result should be an object')
  assert.ok(result !== null, 'Result should not be null')
  assert.strictEqual(result.success, false, 'Should have success: false')
  
  // Required properties
  assert.strictEqual(typeof result.reason, 'string', 'Should have string reason')
  assert.ok(result.reason.length > 0, 'Reason should not be empty')
  assert.strictEqual(typeof result.details, 'object', 'Should have details object')
  assert.ok(Array.isArray(result.constraints), 'Should have constraints array')
  
  // Details structure validation
  const details = result.details
  assert.strictEqual(typeof details.totalCourses, 'number', 'Details should have numeric totalCourses')
  assert.ok(details.totalCourses >= 0, 'totalCourses should be non-negative')
  assert.ok(Array.isArray(details.coursesWithNoSlots), 'Should have coursesWithNoSlots array')
  assert.ok(Array.isArray(details.coursesWithLimitedSlots), 'Should have coursesWithLimitedSlots array')
  assert.ok(Array.isArray(details.potentialConflicts), 'Should have potentialConflicts array')
  assert.ok(Array.isArray(details.constraintAnalysis), 'Should have constraintAnalysis array')
  
  // Validate coursesWithLimitedSlots structure
  details.coursesWithLimitedSlots.forEach((item, index) => {
    assert.strictEqual(typeof item, 'object', `coursesWithLimitedSlots[${index}] should be object`)
    assert.strictEqual(typeof item.course, 'string', `coursesWithLimitedSlots[${index}].course should be string`)
    assert.strictEqual(typeof item.slots, 'number', `coursesWithLimitedSlots[${index}].slots should be number`)
    assert.ok(item.slots > 0, `coursesWithLimitedSlots[${index}].slots should be positive`)
  })
  
  // Validate potentialConflicts structure
  details.potentialConflicts.forEach((conflict, index) => {
    assert.strictEqual(typeof conflict, 'object', `potentialConflicts[${index}] should be object`)
    assert.strictEqual(typeof conflict.slot, 'string', `potentialConflicts[${index}].slot should be string`)
    assert.ok(Array.isArray(conflict.conflictingCourses), `potentialConflicts[${index}].conflictingCourses should be array`)
    assert.ok(conflict.conflictingCourses.length >= 2, `potentialConflicts[${index}] should have at least 2 conflicting courses`)
  })
  
  // Validate constraintAnalysis structure
  details.constraintAnalysis.forEach((analysis, index) => {
    assert.strictEqual(typeof analysis, 'object', `constraintAnalysis[${index}] should be object`)
    assert.strictEqual(typeof analysis.constraint, 'string', `constraintAnalysis[${index}].constraint should be string`)
    assert.strictEqual(typeof analysis.type, 'string', `constraintAnalysis[${index}].type should be string`)
  })
  
  // No unexpected properties
  const expectedFailureProps = ['success', 'reason', 'details', 'constraints']
  Object.keys(result).forEach(key => {
    assert.ok(expectedFailureProps.includes(key), `Unexpected property in failure result: ${key}`)
  })
  
  // Verify expected details if provided
  if (expectedDetails.totalCourses !== undefined) {
    assert.strictEqual(details.totalCourses, expectedDetails.totalCourses, 
      `Expected ${expectedDetails.totalCourses} total courses`)
  }
  if (expectedDetails.coursesWithNoSlots !== undefined) {
    expectedDetails.coursesWithNoSlots.forEach(courseName => {
      assert.ok(details.coursesWithNoSlots.includes(courseName), 
        `Expected ${courseName} to be in coursesWithNoSlots`)
    })
  }
  if (expectedDetails.conflictCount !== undefined) {
    assert.strictEqual(details.potentialConflicts.length, expectedDetails.conflictCount, 
      `Expected ${expectedDetails.conflictCount} potential conflicts`)
  }
}

function assertValidSolutionArray(solutions, expectedCount = null, checkUniqueness = true) {
  assert.ok(Array.isArray(solutions), 'Should return an array')
  
  if (expectedCount !== null) {
    assert.strictEqual(solutions.length, expectedCount, `Should have exactly ${expectedCount} solutions`)
  }
  
  solutions.forEach((solution, index) => {
    assertValidSolutionOutput(solution, {}, `Solution ${index}`)
  })
  
  // Verify solutions are sorted by score (descending)
  for (let i = 1; i < solutions.length; i++) {
    assert.ok(solutions[i].score <= solutions[i-1].score, 
      `Solutions should be sorted by score: solution ${i} (${solutions[i].score}) should be <= solution ${i-1} (${solutions[i-1].score})`)
  }
  
  if (checkUniqueness) {
    const scheduleStrings = solutions.map(s => JSON.stringify(s.schedule))
    const uniqueSchedules = new Set(scheduleStrings)
    assert.strictEqual(scheduleStrings.length, uniqueSchedules.size, 
      `All solutions should be unique. Found ${scheduleStrings.length} solutions but only ${uniqueSchedules.size} unique schedules`)
  }
}

// Test runner
let testCount = 0
let passedTests = 0

function test(name, fn) {
  testCount++
  try {
    fn()
    console.log(`✅ ${name}`)
    passedTests++
  } catch (error) {
    console.log(`❌ ${name}: ${error.message}`)
    console.log(`   Stack: ${error.stack}`)
  }
}

console.log('🧪 Running Declarative Constraint Solver Test Suite\n')

// Basic functionality tests
console.log('📋 Basic Functionality Tests')

test('Simple valid schedule creation', () => {
  const solver = new DeclarativeConstraintSolver()
  const input = {
    selectedCourses: {
      'Course A': [createTimeSlot('MO', 18)],
      'Course B': [createTimeSlot('DI', 19)]
    }
  }
  
  const result = solver.solve(input)
  
  // Use enhanced assertion
  assertValidSolutionOutput(result, {
    days: 2,
    maxGapBetweenCourses: 0,
    coursesOnBusiestDay: 1,
    score: 2,
    courseSlots: {
      'Course A': 1,
      'Course B': 1
    },
    specificSlots: {
      'Course A': [{ day: 'MO', slot: 1080 }], // 18:00
      'Course B': [{ day: 'DI', slot: 1140 }]  // 19:00
    }
  })
})

test('Failure with detailed analysis', () => {
  const solver = new DeclarativeConstraintSolver()
  const input = {
    selectedCourses: {
      'Course A': [], // No available slots
      'Course B': [createTimeSlot('MO', 18)]
    }
  }
  
  const result = solver.solve(input)
  
  // Use enhanced failure assertion
  assertValidFailureOutput(result, {
    totalCourses: 2,
    coursesWithNoSlots: ['Course A']
  })
})

// Edge cases with conflicts
console.log('\n🎯 Edge Case Tests')

test('Multiple courses wanting same slot', () => {
  const solver = new DeclarativeConstraintSolver()
  const conflictSlot = createTimeSlot('MO', 18)
  const input = {
    selectedCourses: {
      'Course A': [conflictSlot],
      'Course B': [conflictSlot],
      'Course C': [conflictSlot]
    }
  }
  
  const result = solver.solve(input)
  
  // Use enhanced failure assertion
  assertValidFailureOutput(result, {
    totalCourses: 3,
    conflictCount: 1
  })
  
  // Additional specific validation
  const conflict = result.details.potentialConflicts.find(c => c.slot === 'MO-1080')
  assert.ok(conflict, 'Should identify MO 18:00 conflict')
  assert.strictEqual(conflict.conflictingCourses.length, 3, 'Should identify all 3 conflicting courses')
  assert.ok(conflict.conflictingCourses.includes('Course A'), 'Should include Course A in conflict')
  assert.ok(conflict.conflictingCourses.includes('Course B'), 'Should include Course B in conflict')
  assert.ok(conflict.conflictingCourses.includes('Course C'), 'Should include Course C in conflict')
})

test('Course multiplicity exceeds available slots', () => {
  const solver = new DeclarativeConstraintSolver()
  const input = {
    selectedCourses: {
      'Course A': [createTimeSlot('MO', 18)] // Only 1 slot
    },
    courseMultiplicity: {
      'Course A': 3 // But needs 3 slots
    }
  }
  
  const result = solver.solve(input)
  
  assertValidFailureOutput(result, {
    totalCourses: 1
  })
})

// Tests with many slots
console.log('\n🏢 Many Slots Tests')

test('Course with many available slots - single selection', () => {
  const solver = new DeclarativeConstraintSolver()
  const manySlots = createManySlots('MO', 8, 12) // 8:00 to 19:00 (12 slots)
  const input = {
    selectedCourses: {
      'Course A': manySlots
    }
  }
  
  const result = solver.solve(input)
  
  assert.ok(result.schedule, 'Should find a solution')
  assert.strictEqual(result.schedule['Course A'].length, 1, 'Should select exactly 1 slot')
  
  // Verify the selected slot is one of the available ones
  const selectedSlot = result.schedule['Course A'][0]
  const isValidSlot = manySlots.some(slot => 
    slot.day === selectedSlot.day && slot.slot === selectedSlot.slot
  )
  assert.ok(isValidSlot, 'Selected slot should be from available slots')
})

test('Multiple courses with many slots each - should find solution', () => {
  const solver = new DeclarativeConstraintSolver()
  const input = {
    selectedCourses: {
      'Course A': createManySlots('MO', 8, 8),  // Monday 8:00-15:00
      'Course B': createManySlots('DI', 8, 8),  // Tuesday 8:00-15:00
      'Course C': createManySlots('MI', 8, 8),  // Wednesday 8:00-15:00
      'Course D': createManySlots('DO', 8, 8),  // Thursday 8:00-15:00
      'Course E': createManySlots('FR', 8, 8)   // Friday 8:00-15:00
    }
  }
  
  const result = solver.solve(input)
  
  assert.ok(result.schedule, 'Should find a solution')
  assert.strictEqual(result.days, 5, 'Should span 5 days')
  assert.strictEqual(result.coursesOnBusiestDay, 1, 'Should have 1 course per day')
  
  // Each course should be scheduled exactly once
  Object.keys(input.selectedCourses).forEach(courseName => {
    assert.strictEqual(result.schedule[courseName].length, 1, `${courseName} should be scheduled once`)
  })
})

test('Course multiplicity with many available slots', () => {
  const solver = new DeclarativeConstraintSolver()
  const manySlots = [
    ...createManySlots('MO', 8, 6),  // Monday slots
    ...createManySlots('DI', 8, 6),  // Tuesday slots
    ...createManySlots('MI', 8, 6)   // Wednesday slots
  ] // Total 18 slots
  
  const input = {
    selectedCourses: {
      'Course A': manySlots
    },
    courseMultiplicity: {
      'Course A': 3 // Should appear 3 times
    }
  }
  
  const result = solver.solve(input)
  
  assert.ok(result.schedule, 'Should find a solution')
  assert.strictEqual(result.schedule['Course A'].length, 3, 'Course A should be scheduled 3 times')
  
  // Verify no overlapping slots
  const assignedSlots = result.schedule['Course A']
  for (let i = 0; i < assignedSlots.length; i++) {
    for (let j = i + 1; j < assignedSlots.length; j++) {
      const slot1 = assignedSlots[i]
      const slot2 = assignedSlots[j]
      const overlap = slot1.day === slot2.day && slot1.slot === slot2.slot
      assert.ok(!overlap, 'No overlapping slots should be assigned')
    }
  }
})

test('Large scale problem - 10 courses with many slots each', () => {
  const solver = new DeclarativeConstraintSolver()
  const courses = {}
  
  // Create 10 courses, each with slots across all weekdays
  for (let i = 0; i < 10; i++) {
    courses[`Course ${i}`] = [
      ...createManySlots('MO', 8 + i, 3),
      ...createManySlots('DI', 8 + i, 3),
      ...createManySlots('MI', 8 + i, 3),
      ...createManySlots('DO', 8 + i, 3),
      ...createManySlots('FR', 8 + i, 3)
    ]
  }
  
  const input = { selectedCourses: courses }
  
  const result = solver.solve(input)
  
  assert.ok(result.schedule, 'Should find a solution for large problem')
  assert.strictEqual(Object.keys(result.schedule).length, 10, 'Should schedule all 10 courses')
  
  // Each course should be scheduled exactly once
  Object.keys(courses).forEach(courseName => {
    assert.strictEqual(result.schedule[courseName].length, 1, `${courseName} should be scheduled once`)
  })
})

// Solution enumeration tests
console.log('\n🎲 Solution Enumeration Tests')

test('Enumerate all solutions for 2x2 problem', () => {
  const solver = new DeclarativeConstraintSolver()
  const input = {
    selectedCourses: {
      'Course A': [createTimeSlot('MO', 18), createTimeSlot('MO', 19)],
      'Course B': [createTimeSlot('DI', 18), createTimeSlot('DI', 19)]
    }
  }
  
  const solutions = solver.findAllSolutions(input)
  
  // Use enhanced array assertion
  assertValidSolutionArray(solutions, 4, true)
  
  // All solutions should have the same stats for this symmetric problem
  solutions.forEach((solution, index) => {
    assertValidSolutionOutput(solution, {
      days: 2,
      maxGapBetweenCourses: 0,
      coursesOnBusiestDay: 1,
      score: 2,
      courseSlots: {
        'Course A': 1,
        'Course B': 1
      }
    })
  })
})

test('Enumerate solutions with many slots - limited results', () => {
  const solver = new DeclarativeConstraintSolver()
  const input = {
    selectedCourses: {
      'Course A': createManySlots('MO', 8, 5), // 5 options
      'Course B': createManySlots('DI', 8, 5)  // 5 options
    }
  }
  
  const solutions = solver.findAllSolutions(input, 10) // Limit to 10
  
  assertValidSolutionArray(solutions, 10, true)
  
  // Each solution should select one slot per course
  solutions.forEach(solution => {
    assertValidSolutionOutput(solution, {
      courseSlots: {
        'Course A': 1,
        'Course B': 1
      }
    })
  })
})

test('Complex multiplicity enumeration', () => {
  const solver = new DeclarativeConstraintSolver()
  const input = {
    selectedCourses: {
      'Course A': [
        createTimeSlot('MO', 18), createTimeSlot('MO', 19),
        createTimeSlot('DI', 18), createTimeSlot('DI', 19)
      ]
    },
    courseMultiplicity: {
      'Course A': 2 // Choose 2 from 4 slots
    }
  }
  
  const solutions = solver.findAllSolutions(input)
  
  // Should be C(4,2) = 6 combinations
  assertValidSolutionArray(solutions, 6, true)
  
  // Each solution should have exactly 2 slots for Course A
  solutions.forEach(solution => {
    assertValidSolutionOutput(solution, {
      courseSlots: {
        'Course A': 2
      }
    })
  })
})

// Constraint validation tests
console.log('\n🚧 Constraint Validation Tests')

test('Max courses per day constraint with many slots', () => {
  const solver = new DeclarativeConstraintSolver()
  const input = {
    selectedCourses: {
      'Course A': createManySlots('MO', 8, 5),
      'Course B': createManySlots('MO', 13, 5), // Same day, different times
      'Course C': createManySlots('MO', 18, 3)  // Same day, different times
    },
    maxCoursesPerDay: 2 // Only allow 2 courses per day
  }
  
  const result = solver.solve(input)
  
  assert.strictEqual(result.success, false, 'Should fail due to max courses per day constraint')
})

test('Max empty slots constraint with many options', () => {
  const solver = new DeclarativeConstraintSolver()
  const input = {
    selectedCourses: {
      'Course A': [createTimeSlot('MO', 8)],   // 8:00
      'Course B': [createTimeSlot('MO', 18)]   // 18:00 (10 hour gap)
    },
    maxEmptySlotsBetweenCourses: 5 // Max 5 hours gap
  }
  
  const result = solver.solve(input)
  
  assert.strictEqual(result.success, false, 'Should fail due to gap constraint')
})

test('Valid gap constraint with many slots', () => {
  const solver = new DeclarativeConstraintSolver()
  const input = {
    selectedCourses: {
      'Course A': createManySlots('MO', 8, 10),  // 8:00-17:00
      'Course B': createManySlots('MO', 8, 10)   // Same options
    },
    maxEmptySlotsBetweenCourses: 2 // Max 2 hours gap
  }
  
  const result = solver.solve(input)
  
  assert.ok(result.schedule, 'Should find a solution within gap constraint')
  
  // Verify the gap constraint is satisfied
  const slotsA = result.schedule['Course A']
  const slotsB = result.schedule['Course B']
  
  if (slotsA[0].day === slotsB[0].day) {
    const gapHours = Math.abs(slotsA[0].slot - slotsB[0].slot) / 60
    assert.ok(gapHours <= 2, 'Gap should be within constraint')
  }
})

// Performance tests
console.log('\n⚡ Performance Tests')

test('Performance with very large slot space', () => {
  const solver = new DeclarativeConstraintSolver()
  const courses = {}
  
  // Create 3 courses with many slots each
  for (let i = 0; i < 3; i++) {
    courses[`Course ${i}`] = [
      ...createManySlots('MO', 8, 15), // 15 slots per day
      ...createManySlots('DI', 8, 15),
      ...createManySlots('MI', 8, 15),
      ...createManySlots('DO', 8, 15),
      ...createManySlots('FR', 8, 15)
    ] // 75 slots per course
  }
  
  const input = { selectedCourses: courses }
  
  const startTime = Date.now()
  const result = solver.solve(input)
  const endTime = Date.now()
  
  assert.ok(result.schedule, 'Should find solution for large slot space')
  assert.ok(endTime - startTime < 5000, 'Should complete within 5 seconds')
})

// Output object validation tests
console.log('\n📄 Output Object Validation Tests')

test('Successful solution output object structure', () => {
  const solver = new DeclarativeConstraintSolver()
  const input = {
    selectedCourses: {
      'Course A': [createTimeSlot('MO', 18, 30)], // Monday 18:30
      'Course B': [createTimeSlot('DI', 20, 0)]   // Tuesday 20:00
    },
    maxCoursesPerDay: 2
  }
  
  const result = solver.solve(input)
  
  // Validate exact object structure
  assert.strictEqual(typeof result, 'object', 'Result should be an object')
  assert.ok(result !== null, 'Result should not be null')
  
  // Check all expected properties exist with correct types
  assert.strictEqual(typeof result.days, 'number', 'days should be a number')
  assert.strictEqual(typeof result.maxGapBetweenCourses, 'number', 'maxGapBetweenCourses should be a number')
  assert.strictEqual(typeof result.coursesOnBusiestDay, 'number', 'coursesOnBusiestDay should be a number')
  assert.strictEqual(typeof result.score, 'number', 'score should be a number')
  assert.strictEqual(typeof result.schedule, 'object', 'schedule should be an object')
  assert.ok(result.schedule !== null, 'schedule should not be null')
  
  // Check exact values
  assert.strictEqual(result.days, 2, 'Should have exactly 2 days')
  assert.strictEqual(result.maxGapBetweenCourses, 0, 'Should have 0 gap between courses (different days)')
  assert.strictEqual(result.coursesOnBusiestDay, 1, 'Should have 1 course on busiest day')
  assert.strictEqual(result.score, 2, 'Score should be 2 (days*2 + gap - busiest*2 = 2*2 + 0 - 1*2)')
  
  // Check schedule structure
  assert.ok('Course A' in result.schedule, 'Schedule should contain Course A')
  assert.ok('Course B' in result.schedule, 'Schedule should contain Course B')
  assert.ok(Array.isArray(result.schedule['Course A']), 'Course A schedule should be array')
  assert.ok(Array.isArray(result.schedule['Course B']), 'Course B schedule should be array')
  assert.strictEqual(result.schedule['Course A'].length, 1, 'Course A should have 1 slot')
  assert.strictEqual(result.schedule['Course B'].length, 1, 'Course B should have 1 slot')
  
  // Check slot objects
  const slotA = result.schedule['Course A'][0]
  const slotB = result.schedule['Course B'][0]
  
  assert.strictEqual(typeof slotA.day, 'string', 'Slot day should be string')
  assert.strictEqual(typeof slotA.slot, 'number', 'Slot time should be number')
  assert.strictEqual(slotA.day, 'MO', 'Course A should be on Monday')
  assert.strictEqual(slotA.slot, 1110, 'Course A should be at 1110 minutes (18:30)')
  
  assert.strictEqual(slotB.day, 'DI', 'Course B should be on Tuesday')
  assert.strictEqual(slotB.slot, 1200, 'Course B should be at 1200 minutes (20:00)')
  
  // Ensure no unexpected properties
  const expectedProps = ['days', 'maxGapBetweenCourses', 'coursesOnBusiestDay', 'score', 'schedule']
  Object.keys(result).forEach(key => {
    assert.ok(expectedProps.includes(key), `Unexpected property in result: ${key}`)
  })
})

test('Failure output object structure', () => {
  const solver = new DeclarativeConstraintSolver()
  const input = {
    selectedCourses: {
      'Course A': [], // No slots - guaranteed failure
      'Course B': [createTimeSlot('MO', 18)]
    }
  }
  
  const result = solver.solve(input)
  
  // Validate failure object structure
  assert.strictEqual(typeof result, 'object', 'Result should be an object')
  assert.strictEqual(result.success, false, 'Should have success: false')
  assert.strictEqual(typeof result.reason, 'string', 'Should have string reason')
  assert.strictEqual(result.reason, 'No valid solution found', 'Should have correct failure reason')
  assert.strictEqual(typeof result.details, 'object', 'Should have details object')
  assert.ok(Array.isArray(result.constraints), 'Should have constraints array')
  
  // Check details structure
  const details = result.details
  assert.strictEqual(typeof details.totalCourses, 'number', 'Details should have numeric totalCourses')
  assert.strictEqual(details.totalCourses, 2, 'Should have 2 total courses')
  assert.ok(Array.isArray(details.coursesWithNoSlots), 'Should have coursesWithNoSlots array')
  assert.ok(Array.isArray(details.coursesWithLimitedSlots), 'Should have coursesWithLimitedSlots array')
  assert.ok(Array.isArray(details.potentialConflicts), 'Should have potentialConflicts array')
  assert.ok(Array.isArray(details.constraintAnalysis), 'Should have constraintAnalysis array')
  
  // Check specific failure analysis
  assert.ok(details.coursesWithNoSlots.includes('Course A'), 'Should identify Course A as having no slots')
  assert.strictEqual(details.coursesWithNoSlots.length, 1, 'Should have exactly 1 course with no slots')
  
  // Ensure no unexpected properties in failure result
  const expectedFailureProps = ['success', 'reason', 'details', 'constraints']
  Object.keys(result).forEach(key => {
    assert.ok(expectedFailureProps.includes(key), `Unexpected property in failure result: ${key}`)
  })
})

test('Multiple solutions array structure', () => {
  const solver = new DeclarativeConstraintSolver()
  const input = {
    selectedCourses: {
      'Course A': [createTimeSlot('MO', 18), createTimeSlot('MO', 19)],
      'Course B': [createTimeSlot('DI', 18), createTimeSlot('DI', 19)]
    }
  }
  
  const solutions = solver.findAllSolutions(input)
  
  // Validate array structure
  assert.ok(Array.isArray(solutions), 'Should return an array')
  assert.strictEqual(solutions.length, 4, 'Should have exactly 4 solutions')
  
  // Check each solution object
  solutions.forEach((solution, index) => {
    assert.strictEqual(typeof solution, 'object', `Solution ${index} should be an object`)
    
    // Same structure as single solution
    assert.strictEqual(typeof solution.days, 'number', `Solution ${index} should have numeric days`)
    assert.strictEqual(typeof solution.maxGapBetweenCourses, 'number', `Solution ${index} should have numeric maxGapBetweenCourses`)
    assert.strictEqual(typeof solution.coursesOnBusiestDay, 'number', `Solution ${index} should have numeric coursesOnBusiestDay`)
    assert.strictEqual(typeof solution.score, 'number', `Solution ${index} should have numeric score`)
    assert.strictEqual(typeof solution.schedule, 'object', `Solution ${index} should have schedule object`)
    
    // All solutions should have same stats for this problem
    assert.strictEqual(solution.days, 2, `Solution ${index} should span 2 days`)
    assert.strictEqual(solution.maxGapBetweenCourses, 0, `Solution ${index} should have 0 gap`)
    assert.strictEqual(solution.coursesOnBusiestDay, 1, `Solution ${index} should have 1 course per day`)
    assert.strictEqual(solution.score, 2, `Solution ${index} should have score 2`)
    
    // Check schedule content
    assert.ok('Course A' in solution.schedule, `Solution ${index} should schedule Course A`)
    assert.ok('Course B' in solution.schedule, `Solution ${index} should schedule Course B`)
    assert.strictEqual(solution.schedule['Course A'].length, 1, `Solution ${index} Course A should have 1 slot`)
    assert.strictEqual(solution.schedule['Course B'].length, 1, `Solution ${index} Course B should have 1 slot`)
  })
  
  // Verify solutions are sorted by score (all same in this case, so order doesn't matter for score)
  for (let i = 1; i < solutions.length; i++) {
    assert.ok(solutions[i].score <= solutions[i-1].score, 'Solutions should be sorted by score (descending)')
  }
  
  // Verify all solutions are unique
  const scheduleStrings = solutions.map(s => JSON.stringify(s.schedule))
  const uniqueSchedules = new Set(scheduleStrings)
  assert.strictEqual(scheduleStrings.length, uniqueSchedules.size, 'All solutions should be unique')
})

test('Course multiplicity output object validation', () => {
  const solver = new DeclarativeConstraintSolver()
  const input = {
    selectedCourses: {
      'Course A': [
        createTimeSlot('MO', 18), createTimeSlot('MO', 19),
        createTimeSlot('DI', 18), createTimeSlot('DI', 19)
      ]
    },
    courseMultiplicity: {
      'Course A': 2
    }
  }
  
  const result = solver.solve(input)
  
  // Basic structure validation
  assert.ok(result.schedule, 'Should have schedule')
  assert.strictEqual(typeof result.schedule, 'object', 'Schedule should be object')
  
  // Course A should appear exactly twice
  assert.ok('Course A' in result.schedule, 'Should contain Course A')
  assert.ok(Array.isArray(result.schedule['Course A']), 'Course A should be array')
  assert.strictEqual(result.schedule['Course A'].length, 2, 'Course A should have exactly 2 slots')
  
  // Check each slot structure
  result.schedule['Course A'].forEach((slot, index) => {
    assert.strictEqual(typeof slot, 'object', `Slot ${index} should be object`)
    assert.strictEqual(typeof slot.day, 'string', `Slot ${index} should have string day`)
    assert.strictEqual(typeof slot.slot, 'number', `Slot ${index} should have numeric slot`)
    assert.ok(['MO', 'DI'].includes(slot.day), `Slot ${index} should be on MO or DI`)
    assert.ok([1080, 1140].includes(slot.slot), `Slot ${index} should be at 1080 (18:00) or 1140 (19:00)`)
  })
  
  // Verify no duplicate slots
  const slot1 = result.schedule['Course A'][0]
  const slot2 = result.schedule['Course A'][1]
  const isDuplicate = slot1.day === slot2.day && slot1.slot === slot2.slot
  assert.ok(!isDuplicate, 'Should not have duplicate slots')
  
  // Check calculated stats make sense
  assert.ok(result.days >= 1, 'Should span at least 1 day')
  assert.ok(result.days <= 2, 'Should span at most 2 days')
  assert.ok(result.coursesOnBusiestDay >= 1, 'Should have at least 1 course on busiest day')
  assert.ok(result.coursesOnBusiestDay <= 2, 'Should have at most 2 courses on busiest day')
})

test('Complex scenario output validation', () => {
  const solver = new DeclarativeConstraintSolver()
  const input = {
    selectedCourses: {
      'Course A': [createTimeSlot('MO', 9, 0)],   // Monday 9:00
      'Course B': [createTimeSlot('MO', 11, 30)], // Monday 11:30 
      'Course C': [createTimeSlot('DI', 14, 0)]   // Tuesday 14:00
    },
    maxCoursesPerDay: 3,
    maxEmptySlotsBetweenCourses: 5
  }
  
  const result = solver.solve(input)
  
  // Should find a valid solution
  assert.ok(result.schedule, 'Should find a solution')
  
  // Verify calculated stats
  assert.strictEqual(result.days, 2, 'Should span 2 days')
  assert.strictEqual(result.coursesOnBusiestDay, 2, 'Monday should have 2 courses (busiest day)')
  
  // Verify gap calculation: Monday courses are 9:00 and 11:30, gap is 2.5 hours
  assert.strictEqual(result.maxGapBetweenCourses, 2.5, 'Max gap should be 2.5 hours')
  
  // Verify score: days * 2 + maxGap - busiest * 2 = 2*2 + 2.5 - 2*2 = 2.5
  assert.strictEqual(result.score, 2.5, 'Score should be 2.5')
  
  // Verify schedule content
  assert.strictEqual(result.schedule['Course A'][0].day, 'MO', 'Course A should be Monday')
  assert.strictEqual(result.schedule['Course A'][0].slot, 540, 'Course A should be at 540 minutes (9:00)')
  assert.strictEqual(result.schedule['Course B'][0].day, 'MO', 'Course B should be Monday')
  assert.strictEqual(result.schedule['Course B'][0].slot, 690, 'Course B should be at 690 minutes (11:30)')
  assert.strictEqual(result.schedule['Course C'][0].day, 'DI', 'Course C should be Tuesday')
  assert.strictEqual(result.schedule['Course C'][0].slot, 840, 'Course C should be at 840 minutes (14:00)')
})

// Debug and introspection tests
console.log('\n🔧 Debug and Introspection Tests')

test('Debug mode functionality', () => {
  const solver = new DeclarativeConstraintSolver()
  solver.setDebugMode(true)
  
  const input = {
    selectedCourses: {
      'Course A': [createTimeSlot('MO', 18)]
    }
  }
  
  // Capture debug output
  const originalLog = console.log
  let debugOutput = []
  console.log = (...args) => debugOutput.push(args.join(' '))
  
  const result = solver.solve(input)
  console.log = originalLog
  
  assert.ok(result.schedule, 'Should find solution')
  assert.ok(debugOutput.some(line => line.includes('[DeclarativeSolver]')), 
    'Should produce debug output')
})

test('Constraint summary completeness', () => {
  const solver = new DeclarativeConstraintSolver()
  const input = {
    selectedCourses: {
      'Course A': [createTimeSlot('MO', 18)]
    },
    maxCoursesPerDay: 3,
    maxEmptySlotsBetweenCourses: 4,
    courseMultiplicity: { 'Course A': 1 }
  }
  
  solver.solve(input)
  const summary = solver.getConstraintsSummary()
  
  assert.ok(summary.some(s => s.includes('overlapping')), 'Should include overlapping constraint')
  assert.ok(summary.some(s => s.includes('Maximum 3 courses per day')), 'Should include max courses constraint')
  assert.ok(summary.some(s => s.includes('4 hours gap')), 'Should include gap constraint')
  assert.ok(summary.some(s => s.includes('Course multiplicity')), 'Should include multiplicity constraint')
})

// Results
console.log(`\n📊 Test Results:`)
console.log(`  ✅ Passed: ${passedTests}`)
console.log(`  ❌ Failed: ${testCount - passedTests}`)
console.log(`  📈 Success Rate: ${Math.round(passedTests / testCount * 100)}%`)

if (passedTests === testCount) {
  console.log('\n🎉 All tests passed! The Declarative Constraint Solver is fully validated.')
  process.exit(0)
} else {
  console.log('\n⚠️  Some tests failed. Please review the implementation.')
  process.exit(1)
}

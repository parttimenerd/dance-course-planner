/**
 * Comprehensive test for finding ALL valid solutions
 * Tests complex scenarios to ensure complete solution enumeration
 */

import assert from 'assert'
import { DeclarativeConstraintSolver } from '../src/declarativeConstraintSolver.js'

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

// Enhanced assertion for solution completeness
function assertAllSolutionsFound(solver, input, expectedCount, description) {
  console.log(`\n🔍 Testing: ${description}`)
  console.log(`Expected solutions: ${expectedCount}`)
  
  const res = solver.findAllSolutions(input, 1000) // High limit to ensure we get all
  const solutions = res.schedules
  console.log(`Found solutions: ${solutions.length}`)
  
  // Verify count
  assert.strictEqual(solutions.length, expectedCount, 
    `Expected exactly ${expectedCount} solutions, got ${solutions.length}`)
  
  // Verify all solutions are valid
  solutions.forEach((solution, index) => {
    assert.ok(solution.schedule, `Solution ${index} should have a schedule`)
    assert.ok(typeof solution.score === 'number', `Solution ${index} should have a numeric score`)
    
    // Verify each course is scheduled
    Object.keys(input.selectedCourses).forEach(courseName => {
      assert.ok(courseName in solution.schedule, `Solution ${index} should schedule ${courseName}`)
      assert.ok(solution.schedule[courseName].length > 0, `Solution ${index} ${courseName} should have slots`)
    })
  })
  
  // Verify uniqueness
  const scheduleStrings = solutions.map(s => JSON.stringify(s.schedule))
  const uniqueSchedules = new Set(scheduleStrings)
  assert.strictEqual(scheduleStrings.length, uniqueSchedules.size, 'All solutions should be unique')
  
  // Verify sorted by score
  for (let i = 1; i < solutions.length; i++) {
    assert.ok(solutions[i].score <= solutions[i-1].score, 
      `Solutions should be sorted by score: ${solutions[i-1].score} >= ${solutions[i].score}`)
  }
  
  console.log(`✅ All ${solutions.length} solutions found and validated`)
  return solutions
}

console.log('🧪 Comprehensive Solution Enumeration Tests\n')

const solver = new DeclarativeConstraintSolver()

// Test 0: Original missing course case
console.log('📋 Test 0: Original Missing Course Issue')
const missingCourseTest = {
  selectedCourses: {
    'Standard & Latein Medaillenstufe (Level 3)': [
      createTimeSlot('MO', 20, 30),
      createTimeSlot('DI', 20, 0),
      createTimeSlot('MI', 19, 30)
    ],
    'Salsa Workshop': [
      createTimeSlot('DO', 19, 0),
      createTimeSlot('FR', 20, 0)
    ]
  }
}

const originalResult = solver.solve(missingCourseTest)
assert.ok(originalResult.schedule, 'Should solve the original missing course problem')
console.log('✅ Original issue resolved')

const originalAllSolutions = solver.findAllSolutions(missingCourseTest, 100)
assert.strictEqual(originalAllSolutions.schedules.length, 6, 'Should find all 6 combinations (3 × 2)')
console.log(`Found all ${originalAllSolutions.schedules.length} solutions for original problem`)

// Test 1: Simple 2x2 case (baseline)
console.log('📋 Test 1: Simple 2x2 Problem')
assertAllSolutionsFound(solver, {
  selectedCourses: {
    'Course A': [createTimeSlot('MO', 18), createTimeSlot('MO', 19)],
    'Course B': [createTimeSlot('DI', 18), createTimeSlot('DI', 19)]
  }
}, 4, 'Simple 2x2 problem - each course has 2 options')

// Test 2: 3x3 problem
console.log('📋 Test 2: Complex 3x3 Problem')
assertAllSolutionsFound(solver, {
  selectedCourses: {
    'Course A': [createTimeSlot('MO', 18), createTimeSlot('MO', 19), createTimeSlot('MO', 20)],
    'Course B': [createTimeSlot('DI', 18), createTimeSlot('DI', 19), createTimeSlot('DI', 20)],
    'Course C': [createTimeSlot('MI', 18), createTimeSlot('MI', 19), createTimeSlot('MI', 20)]
  }
}, 27, '3x3 problem - 27 total combinations (3³)')

// Test 3: Overlapping options with constraints
console.log('📋 Test 3: Overlapping Options with Constraints')
const overlappingSolutions = assertAllSolutionsFound(solver, {
  selectedCourses: {
    'Course A': [createTimeSlot('MO', 18), createTimeSlot('DI', 18)],
    'Course B': [createTimeSlot('MO', 19), createTimeSlot('DI', 19)],
    'Course C': [createTimeSlot('MO', 18), createTimeSlot('MI', 18)] // Conflicts with A on MO
  }
}, 6, 'Overlapping slots - some combinations invalid due to conflicts')

// Verify the conflict scenarios are handled correctly
console.log('🔍 Analyzing overlapping solutions...')
overlappingSolutions.forEach((sol, i) => {
  const aSlot = sol.schedule['Course A'][0]
  const bSlot = sol.schedule['Course B'][0] 
  const cSlot = sol.schedule['Course C'][0]
  
  // Ensure no two courses are on same day+time
  const slots = [aSlot, bSlot, cSlot]
  for (let j = 0; j < slots.length; j++) {
    for (let k = j + 1; k < slots.length; k++) {
      assert.ok(!(slots[j].day === slots[k].day && slots[j].slot === slots[k].slot),
        `Solution ${i}: No two courses should have same slot`)
    }
  }
})

// Test 4: Multiplicity with multiple valid combinations
console.log('📋 Test 4: Course Multiplicity Combinations')
assertAllSolutionsFound(solver, {
  selectedCourses: {
    'Course A': [
      createTimeSlot('MO', 18), createTimeSlot('MO', 19), createTimeSlot('MO', 20),
      createTimeSlot('DI', 18), createTimeSlot('DI', 19)
    ]
  },
  courseMultiplicity: {
    'Course A': 2 // Choose 2 from 5 slots
  }
}, 10, 'Multiplicity: C(5,2) = 10 combinations')

// Test 5: Mixed multiplicity
console.log('📋 Test 5: Mixed Multiplicity Problem')
assertAllSolutionsFound(solver, {
  selectedCourses: {
    'Course A': [createTimeSlot('MO', 18), createTimeSlot('MO', 19)], // 2 options
    'Course B': [
      createTimeSlot('DI', 18), createTimeSlot('DI', 19), 
      createTimeSlot('MI', 18)
    ] // 3 options
  },
  courseMultiplicity: {
    'Course B': 2 // Choose 2 from 3 for B, 1 from 2 for A
  }
}, 6, 'Mixed multiplicity: 2 × C(3,2) = 2 × 3 = 6 combinations')

// Test 6: Large combinatorial problem
console.log('📋 Test 6: Large Combinatorial Problem')
assertAllSolutionsFound(solver, {
  selectedCourses: {
    'Course A': createManySlots('MO', 8, 4), // 4 options
    'Course B': createManySlots('DI', 8, 4), // 4 options  
    'Course C': createManySlots('MI', 8, 4), // 4 options
    'Course D': createManySlots('DO', 8, 4)  // 4 options
  }
}, 256, 'Large problem: 4⁴ = 256 combinations')

// Test 7: Constraint-limited solutions
console.log('📋 Test 7: Constraint-Limited Solutions')
const constraintLimitedSolutions = assertAllSolutionsFound(solver, {
  selectedCourses: {
    'Course A': [createTimeSlot('MO', 8), createTimeSlot('MO', 12), createTimeSlot('MO', 16)],
    'Course B': [createTimeSlot('MO', 9), createTimeSlot('MO', 13), createTimeSlot('MO', 17)]
  },
  maxEmptySlotsBetweenCourses: 3 // Max 3 hours gap
}, 5, 'Gap constraint eliminates some combinations')

// Verify gap constraint is respected
console.log('🔍 Verifying gap constraints...')
constraintLimitedSolutions.forEach((sol, i) => {
  const slotA = sol.schedule['Course A'][0]
  const slotB = sol.schedule['Course B'][0]
  
  if (slotA.day === slotB.day) {
    const gapHours = Math.abs(slotA.slot - slotB.slot) / 60
    assert.ok(gapHours <= 3, `Solution ${i}: Gap ${gapHours}h should be <= 3h`)
  }
})

// Test 8: Complex multiplicity with constraints
console.log('📋 Test 8: Complex Multiplicity with Constraints')
assertAllSolutionsFound(solver, {
  selectedCourses: {
    'Course A': [
      createTimeSlot('MO', 18), createTimeSlot('MO', 19), createTimeSlot('MO', 20),
      createTimeSlot('DI', 18), createTimeSlot('DI', 19), createTimeSlot('DI', 20)
    ]
  },
  courseMultiplicity: {
    'Course A': 3 // Choose 3 from 6 slots
  },
  maxCoursesPerDay: 2 // Max 2 courses per day
}, 18, 'Multiplicity with max courses per day constraint')

// Test 9: Complex real-world scenario
console.log('📋 Test 9: Complex Real-World Scenario')
const realWorldSolutions = assertAllSolutionsFound(solver, {
  selectedCourses: {
    'Standard Grundkurs': [
      createTimeSlot('MO', 19), createTimeSlot('MI', 19)
    ],
    'Latein Fortgeschritten': [
      createTimeSlot('DI', 20), createTimeSlot('DO', 20)
    ],
    'Salsa Workshop': [
      createTimeSlot('FR', 19), createTimeSlot('FR', 20)
    ],
    'Tango Argentino': [
      createTimeSlot('MO', 20), createTimeSlot('MI', 20), createTimeSlot('DO', 19)
    ]
  }
}, 24, 'Real-world scenario: 2 × 2 × 2 × 3 = 24 combinations')

console.log('🔍 Analyzing real-world solution quality...')
const scores = realWorldSolutions.map(s => s.score)
const uniqueScores = [...new Set(scores)]
console.log(`Score distribution: ${uniqueScores.length} unique scores from ${scores.length} solutions`)
console.log(`Score range: ${Math.min(...scores)} to ${Math.max(...scores)}`)

// Test 10: Edge cases with complex constraints
console.log('📋 Test 10: Complex Edge Case')
const edgeCaseSolutions = assertAllSolutionsFound(solver, {
  selectedCourses: {
    'Morning Course': [createTimeSlot('MO', 9), createTimeSlot('DI', 10)],
    'Afternoon Course': [createTimeSlot('MO', 14), createTimeSlot('DI', 15)],
    'Evening Course': [createTimeSlot('MO', 19), createTimeSlot('DI', 20)]
  },
  maxEmptySlotsBetweenCourses: 6, // Max 6 hours gap
  minEmptySlotsBetweenCourses: 2  // Min 2 hours gap
}, 6, 'Edge case with min/max gap constraints')

// Verify gap constraints
console.log('🔍 Verifying edge case constraints...')
edgeCaseSolutions.forEach((sol, i) => {
  // Group slots by day and check consecutive gaps only
  const slotsByDay = {}
  Object.entries(sol.schedule).forEach(([course, slots]) => {
    const slot = slots[0]
    if (!slotsByDay[slot.day]) slotsByDay[slot.day] = []
    slotsByDay[slot.day].push(slot)
  })
  
  for (const [day, daySlots] of Object.entries(slotsByDay)) {
    if (daySlots.length < 2) continue
    
    const sortedSlots = daySlots.sort((a, b) => a.slot - b.slot)
    for (let j = 1; j < sortedSlots.length; j++) {
      const gapHours = (sortedSlots[j].slot - sortedSlots[j-1].slot) / 60
      assert.ok(gapHours >= 2 && gapHours <= 6, 
        `Solution ${i}: Consecutive gap ${gapHours}h should be between 2-6h on ${day}`)
    }
  }
})

// Test 11: Maximum limit testing
console.log('📋 Test 11: Solution Limit Testing')
const largeInput = {
  selectedCourses: {
    'Course A': createManySlots('MO', 8, 5), // 5 options
    'Course B': createManySlots('DI', 8, 5), // 5 options
    'Course C': createManySlots('MI', 8, 5)  // 5 options
  }
}

const limitedSolutions = solver.findAllSolutions(largeInput, 50)
console.log(`Limited to 50 solutions from potential ${5*5*5} = 125`)
console.log(`Actually found: ${limitedSolutions.schedules.length} solutions`)
assert.ok(limitedSolutions.schedules.length <= 50, 'Should respect solution limit')
assert.ok(limitedSolutions.schedules.length > 0, 'Should find some solutions')

// Test 12: Complex pair course scenario
console.log('📋 Test 12: Pair Course Complex Scenario')
const pairCourseSolutions = assertAllSolutionsFound(solver, {
  selectedCourses: {
    'Ballroom Dancing': [
      createTimeSlot('MO', 19), createTimeSlot('MI', 19), createTimeSlot('FR', 19)
    ],
    'Latin Dancing': [
      createTimeSlot('DI', 20), createTimeSlot('DO', 20)
    ],
    'Social Dancing': [
      createTimeSlot('SA', 18), createTimeSlot('SA', 19), createTimeSlot('SA', 20)
    ]
  },
  pairOnlyFilters: ['Ballroom Dancing', 'Latin Dancing'], // These require pairs
  hasPair: true
}, 18, 'Pair course scenario: 3 × 2 × 3 = 18 combinations')

console.log('🔍 Verifying pair constraints...')
pairCourseSolutions.forEach((sol, i) => {
  // All pair-only courses should be scheduled when hasPair=true
  assert.ok(sol.schedule['Ballroom Dancing'], `Solution ${i} should include pair course Ballroom Dancing`)
  assert.ok(sol.schedule['Latin Dancing'], `Solution ${i} should include pair course Latin Dancing`) 
  assert.ok(sol.schedule['Social Dancing'], `Solution ${i} should include Social Dancing`)
})

// Test 13: Multi-session course scenario
console.log('📋 Test 13: Multi-Session Course Scenario')
assertAllSolutionsFound(solver, {
  selectedCourses: {
    'Intensive Workshop': [
      createTimeSlot('SA', 10), createTimeSlot('SA', 11), createTimeSlot('SA', 12),
      createTimeSlot('SA', 14), createTimeSlot('SA', 15), createTimeSlot('SA', 16)
    ]
  },
  courseMultiplicity: {
    'Intensive Workshop': 3 // Must take 3 sessions
  }
}, 20, 'Multi-session: C(6,3) = 20 combinations')

console.log('\n🎯 Comprehensive Solution Enumeration Summary:')
console.log('✅ Original missing course issue resolved')
console.log('✅ All combinatorial test cases passed')
console.log('✅ Complex constraint interactions verified')
console.log('✅ Solution uniqueness and sorting confirmed')
console.log('✅ Real-world scenarios thoroughly tested')
console.log('✅ Edge cases and limits properly handled')
console.log('✅ Pair course scenarios validated')
console.log('✅ Multi-session courses supported')

console.log('\n🚀 The solver correctly finds ALL valid solutions for even the most complex problems!')
console.log('🔥 Ready for production use with confidence!')

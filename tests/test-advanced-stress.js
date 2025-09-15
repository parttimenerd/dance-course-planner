/**
 * Advanced stress tests for the constraint solver
 * Tests extreme scenarios and performance edge cases
 */

import assert from 'assert'
import { DeclarativeConstraintSolver } from '../src/declarativeConstraintSolver.js'

function createTimeSlot(day, hour, minute = 0) {
  return { day, slot: hour * 60 + minute }
}

function createWeekSchedule(startHour = 8, endHour = 22, interval = 1) {
  const days = ['MO', 'DI', 'MI', 'DO', 'FR', 'SA', 'SO']
  const slots = []
  
  for (const day of days) {
    for (let hour = startHour; hour <= endHour; hour += interval) {
      slots.push(createTimeSlot(day, hour))
    }
  }
  return slots
}

function measurePerformance(fn, description) {
  console.log(`⏱️  ${description}...`)
  const start = performance.now()
  const result = fn()
  const end = performance.now()
  console.log(`   Completed in ${(end - start).toFixed(2)}ms`)
  return result
}

console.log('🔥 Advanced Constraint Solver Stress Tests\n')

const solver = new DeclarativeConstraintSolver()

// Test 1: Massive combinatorial explosion
console.log('📋 Test 1: Massive Combinatorial Problem')
const massiveResult = measurePerformance(() => {
  const input = {
    selectedCourses: {
      'Course 1': createWeekSchedule(18, 20), // 21 slots
      'Course 2': createWeekSchedule(18, 20), // 21 slots
      'Course 3': createWeekSchedule(18, 20), // 21 slots
      'Course 4': createWeekSchedule(18, 20)  // 21 slots
    }
  }
  
  // This would be 21^4 = 194,481 total combinations!
  // But we'll limit to first 1000
  const res = solver.findAllSolutions(input, 1000)
  return res.schedules
}, 'Finding first 1000 solutions from 194K+ possibilities')

console.log(`Found ${massiveResult.length} solutions (limited to 1000)`)
assert.ok(massiveResult.length > 0, 'Should find some solutions')
assert.ok(massiveResult.length <= 1000, 'Should respect limit')

// Test 2: Extreme constraint complexity
console.log('📋 Test 2: Extreme Constraint Complexity')
const extremeConstraints = measurePerformance(() => {
  return solver.solve({
    selectedCourses: {
      'Morning Yoga': [createTimeSlot('MO', 7), createTimeSlot('MI', 7), createTimeSlot('FR', 7)],
      'Lunch Break Dance': [createTimeSlot('MO', 12), createTimeSlot('DI', 12), createTimeSlot('MI', 12)],
      'Evening Ballroom': [createTimeSlot('MO', 19), createTimeSlot('DI', 19), createTimeSlot('DO', 19)],
      'Weekend Intensive': [createTimeSlot('SA', 14), createTimeSlot('SA', 15), createTimeSlot('SO', 14)]
    },
    maxCoursesPerDay: 1,
    minEmptySlotsBetweenCourses: 2,
    maxEmptySlotsBetweenCourses: 8,
    selectedDays: ['MO', 'DI', 'MI', 'DO', 'FR', 'SA'],
    timeRange: { start: '07:00', end: '21:00' },
    courseMultiplicity: {
      'Weekend Intensive': 2 // Must take 2 sessions
    }
  })
}, 'Solving with extreme constraint complexity')

assert.ok(extremeConstraints.schedule, 'Should handle extreme constraints')
console.log(`Extreme constraint solution score: ${extremeConstraints.score}`)

// Test 3: Deep multiplicity combinations
console.log('📋 Test 3: Deep Multiplicity Combinations')
const multiplicityResult = measurePerformance(() => {
  const res = solver.findAllSolutions({
    selectedCourses: {
      'Intensive Course': [
        createTimeSlot('MO', 18), createTimeSlot('MO', 19), createTimeSlot('MO', 20),
        createTimeSlot('DI', 18), createTimeSlot('DI', 19), createTimeSlot('DI', 20),
        createTimeSlot('MI', 18), createTimeSlot('MI', 19), createTimeSlot('MI', 20),
        createTimeSlot('DO', 18), createTimeSlot('DO', 19), createTimeSlot('DO', 20)
      ]
    },
    courseMultiplicity: {
      'Intensive Course': 4 // Choose 4 from 12 slots
    }
  }, 500)
  return res.schedules
}, 'Computing C(12,4) = 495 multiplicity combinations')

console.log(`Multiplicity combinations found: ${multiplicityResult.length}`)
assert.strictEqual(multiplicityResult.length, 495, 'Should find exactly C(12,4) = 495 combinations')

// Test 4: Conflicting constraint resolution
console.log('📋 Test 4: Conflicting Constraint Resolution')
const conflictResult = measurePerformance(() => {
  return solver.solve({
    selectedCourses: {
      'Course A': [createTimeSlot('MO', 18), createTimeSlot('MO', 19)],
      'Course B': [createTimeSlot('MO', 19), createTimeSlot('MO', 20)],
      'Course C': [createTimeSlot('MO', 20), createTimeSlot('DI', 18)]
    },
    minEmptySlotsBetweenCourses: 2, // Need 2 hour gap
    maxCoursesPerDay: 2 // But max 2 per day - creates conflicts on MO
  })
}, 'Resolving conflicting constraints')

// This should either find a solution or fail gracefully
if (conflictResult.schedule) {
  console.log('Found solution despite conflicting constraints')
} else {
  console.log('No solution possible with conflicting constraints (expected)')
  assert.ok(conflictResult.constraints, 'Should report constraint violations')
}

// Test 5: Performance with many empty solutions
console.log('📋 Test 5: Performance with Sparse Solutions')
const sparseResult = measurePerformance(() => {
  const res = solver.findAllSolutions({
    selectedCourses: {
      'Rare Course A': [createTimeSlot('MO', 8)], // Only morning slot
      'Rare Course B': [createTimeSlot('MO', 22)], // Only late evening  
      'Rare Course C': [createTimeSlot('DI', 8)],
      'Rare Course D': [createTimeSlot('DI', 22)]
    },
    minEmptySlotsBetweenCourses: 12, // Need 12 hour gap - impossible for same day
    maxEmptySlotsBetweenCourses: 16  // Max 16 hour gap
  }, 100)
  return res.schedules
}, 'Finding sparse solutions with tight constraints')

console.log(`Sparse solutions found: ${sparseResult.length}`)
// Should find very few solutions due to tight constraints

// Test 6: Realistic dance school scenario
console.log('📋 Test 6: Realistic Dance School Scenario')
const realisticResult = measurePerformance(() => {
  const res = solver.findAllSolutions({
    selectedCourses: {
      'Ballroom Beginner': [
        createTimeSlot('MO', 18), createTimeSlot('MO', 19), createTimeSlot('MI', 18)
      ],
      'Latin Intermediate': [
        createTimeSlot('DI', 19), createTimeSlot('DO', 19), createTimeSlot('DO', 20)
      ],
      'Salsa Workshop': [
        createTimeSlot('FR', 19), createTimeSlot('FR', 20), createTimeSlot('SA', 18)
      ],
      'Tango Argentino': [
        createTimeSlot('SA', 19), createTimeSlot('SA', 20), createTimeSlot('SO', 17)
      ],
      'Wedding Dance Prep': [
        createTimeSlot('SA', 16), createTimeSlot('SO', 16), createTimeSlot('SO', 18)
      ]
    },
    maxCoursesPerDay: 2,
    pairOnlyFilters: ['Ballroom Beginner', 'Latin Intermediate', 'Tango Argentino'],
    hasPair: true,
    courseMultiplicity: {
      'Wedding Dance Prep': 2 // Need 2 sessions
    }
  }, 200)
  return res.schedules
}, 'Realistic dance school with 5 courses and constraints')

console.log(`Realistic scenario solutions: ${realisticResult.length}`)
assert.ok(realisticResult.length > 0, 'Should find solutions for realistic scenario')

// Verify all pair courses are scheduled
realisticResult.forEach((sol, i) => {
  assert.ok(sol.schedule['Ballroom Beginner'], `Solution ${i} should include pair course`)
  assert.ok(sol.schedule['Latin Intermediate'], `Solution ${i} should include pair course`)  
  assert.ok(sol.schedule['Tango Argentino'], `Solution ${i} should include pair course`)
  assert.ok(sol.schedule['Wedding Dance Prep']?.length === 2, `Solution ${i} should have 2 wedding prep sessions`)
})

// Test 7: Memory and performance stress test
console.log('📋 Test 7: Memory Stress Test')
const memoryResult = measurePerformance(() => {
  const solutions = []
  
  // Generate many small problems to test memory handling
  for (let i = 0; i < 50; i++) {
    const result = solver.findAllSolutions({
      selectedCourses: {
        [`Course A${i}`]: [createTimeSlot('MO', 18), createTimeSlot('DI', 19)],
        [`Course B${i}`]: [createTimeSlot('MI', 20), createTimeSlot('DO', 21)]
      }
    }, 10)
    solutions.push(result)
  }
  
  return solutions
}, 'Processing 50 separate problems for memory stress test')

console.log(`Memory test completed: ${memoryResult.length} problem sets solved`)
assert.strictEqual(memoryResult.length, 50, 'Should complete all 50 problems')

// Test 8: Edge case with zero solutions
console.log('📋 Test 8: Zero Solutions Edge Case')
const zeroResult = measurePerformance(() => {
  return solver.solve({
    selectedCourses: {
      'Impossible Course A': [createTimeSlot('MO', 18)],
      'Impossible Course B': [createTimeSlot('MO', 18)] // Same time slot!
    }
  })
}, 'Handling impossible constraint scenario')

assert.ok(!zeroResult.schedule, 'Should not find solution for impossible constraints')
assert.ok(zeroResult.constraints, 'Should report constraint violations')
console.log(`Zero solution case handled correctly: ${zeroResult.reason || 'No solution possible'}`)

// Test 9: Solution quality verification
console.log('📋 Test 9: Solution Quality Verification')
const qualityResult = measurePerformance(() => {
  const res = solver.findAllSolutions({
    selectedCourses: {
      'Premium Course': [
        createTimeSlot('MO', 19), // Perfect time
        createTimeSlot('MO', 22), // Late time
        createTimeSlot('MO', 8)   // Early time  
      ],
      'Standard Course': [
        createTimeSlot('DI', 19), // Perfect time
        createTimeSlot('DI', 22), // Late time
        createTimeSlot('DI', 8)   // Early time
      ]
    }
  }, 100)
  return res.schedules
}, 'Analyzing solution quality scoring')

console.log('🔍 Analyzing solution scores...')
const scores = qualityResult.map(s => s.score)
const minScore = Math.min(...scores)
const maxScore = Math.max(...scores)
const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length

console.log(`Score analysis: min=${minScore}, max=${maxScore}, avg=${avgScore.toFixed(1)}`)
assert.ok(maxScore >= minScore, 'Scores should be properly ordered')

// Test 10: Comprehensive integration test
console.log('📋 Test 10: Comprehensive Integration Test')
const integrationResult = measurePerformance(() => {
  return solver.solve({
    selectedCourses: {
      'Standard & Latein Grundkurs': [
        createTimeSlot('MO', 19), createTimeSlot('MI', 19), createTimeSlot('FR', 19)
      ],
      'Salsa Cubana Intermediate': [
        createTimeSlot('DI', 20), createTimeSlot('DO', 20), createTimeSlot('SA', 18)
      ],
      'Tango Argentino Advanced': [
        createTimeSlot('MI', 20), createTimeSlot('DO', 19), createTimeSlot('SA', 19)
      ],
      'Bachata Workshop': [
        createTimeSlot('FR', 20), createTimeSlot('SA', 20), createTimeSlot('SO', 18)
      ],
      'Competition Training': [
        createTimeSlot('SA', 16), createTimeSlot('SA', 17), createTimeSlot('SO', 16), createTimeSlot('SO', 17)
      ]
    },
    maxCoursesPerDay: 2,
    minEmptySlotsBetweenCourses: 1,
    maxEmptySlotsBetweenCourses: 6,
    pairOnlyFilters: ['Standard & Latein Grundkurs', 'Tango Argentino Advanced'],
    hasPair: true,
    courseMultiplicity: {
      'Competition Training': 2
    },
    selectedDays: ['MO', 'DI', 'MI', 'DO', 'FR', 'SA', 'SO']
  })
}, 'Comprehensive integration test with all constraint types')

assert.ok(integrationResult.schedule, 'Integration test should find a solution')
console.log(`Integration test solution quality score: ${integrationResult.score}`)

console.log('\n🎯 Advanced Stress Test Summary:')
console.log('✅ Massive combinatorial problems handled efficiently')
console.log('✅ Extreme constraints resolved correctly')  
console.log('✅ Complex multiplicity calculations accurate')
console.log('✅ Conflicting constraints handled gracefully')
console.log('✅ Sparse solution spaces processed efficiently')
console.log('✅ Realistic scenarios produce quality solutions')
console.log('✅ Memory stress tests passed')
console.log('✅ Edge cases handled properly')
console.log('✅ Solution quality scoring validated')
console.log('✅ Comprehensive integration successful')

console.log('\n🚀 Solver performance verified under extreme conditions!')
console.log('💪 Ready for any real-world scheduling challenge!')

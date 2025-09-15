/**
 * Output Structure Validation Tests
 * Ensures all solver outputs match expected format exactly
 */

import assert from 'assert'
import { DeclarativeConstraintSolver } from '../src/declarativeConstraintSolver.js'

function createTimeSlot(day, hour, minute = 0) {
  return { day, slot: hour * 60 + minute }
}

console.log('🔍 Testing Solver Output Structure\n')

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
  }
}

// Test successful solution output structure
test('Successful solution output structure', () => {
  const solver = new DeclarativeConstraintSolver()
  const input = {
    selectedCourses: {
      'Course A': [createTimeSlot('MO', 18)],
      'Course B': [createTimeSlot('DI', 19)]
    },
    maxCoursesPerDay: 2
  }
  
  const result = solver.solve(input)
  
  // Check that all expected properties exist
  assert.ok(typeof result === 'object', 'Result should be an object')
  assert.strictEqual(result.success, true, 'Should include success: true')
  assert.ok(typeof result.days === 'number', 'Should have numeric days property')
  assert.ok(typeof result.maxGapBetweenCourses === 'number', 'Should have numeric maxGapBetweenCourses')
  assert.ok(typeof result.coursesOnBusiestDay === 'number', 'Should have numeric coursesOnBusiestDay')
  assert.ok(typeof result.score === 'number', 'Should have numeric score')
  assert.ok(typeof result.schedule === 'object', 'Should have schedule object')
  
  // Check schedule structure
  assert.ok('Course A' in result.schedule, 'Schedule should contain Course A')
  assert.ok('Course B' in result.schedule, 'Schedule should contain Course B')
  assert.ok(Array.isArray(result.schedule['Course A']), 'Course A should have array of slots')
  assert.ok(Array.isArray(result.schedule['Course B']), 'Course B should have array of slots')
  
  // Check slot structure
  const slotA = result.schedule['Course A'][0]
  assert.ok(typeof slotA.day === 'string', 'Slot should have string day')
  assert.ok(typeof slotA.slot === 'number', 'Slot should have numeric slot')
  
  // Check no unexpected properties
  const expectedProps = ['success', 'days', 'maxGapBetweenCourses', 'coursesOnBusiestDay', 'score', 'schedule']
  Object.keys(result).forEach(key => {
    assert.ok(expectedProps.includes(key), `Unexpected property: ${key}`)
  })
  
  console.log('  Success structure:', JSON.stringify(result, null, 2))
})

// Test failure output structure
test('Failure output structure', () => {
  const solver = new DeclarativeConstraintSolver()
  const input = {
    selectedCourses: {
      'Course A': [], // No slots - will fail
      'Course B': [createTimeSlot('MO', 18)]
    }
  }
  
  const result = solver.solve(input)
  
  // Check that all expected failure properties exist
  assert.strictEqual(result.success, false, 'Should have success: false')
  assert.ok(typeof result.reason === 'string', 'Should have string reason')
  assert.ok(typeof result.details === 'object', 'Should have details object')
  assert.ok(Array.isArray(result.constraints), 'Should have constraints array')
  
  // Check details structure
  assert.ok(typeof result.details.totalCourses === 'number', 'Details should have totalCourses')
  assert.ok(Array.isArray(result.details.coursesWithNoSlots), 'Details should have coursesWithNoSlots array')
  assert.ok(Array.isArray(result.details.coursesWithLimitedSlots), 'Details should have coursesWithLimitedSlots array')
  assert.ok(Array.isArray(result.details.potentialConflicts), 'Details should have potentialConflicts array')
  assert.ok(Array.isArray(result.details.constraintAnalysis), 'Details should have constraintAnalysis array')
  
  // Check that it identifies the course with no slots
  assert.ok(result.details.coursesWithNoSlots.includes('Course A'), 'Should identify Course A as having no slots')
  
  console.log('  Failure structure:', JSON.stringify(result, null, 2))
})

// Test solution enumeration output structure
test('Multiple solutions output structure', () => {
  const solver = new DeclarativeConstraintSolver()
  const input = {
    selectedCourses: {
      'Course A': [createTimeSlot('MO', 18), createTimeSlot('MO', 19)],
      'Course B': [createTimeSlot('DI', 18), createTimeSlot('DI', 19)]
    }
  }
  
  const result = solver.findAllSolutions(input)
  assert.ok(result && result.success !== undefined, 'Should return result object with success flag')
  const solutions = result.schedules
  
  assert.ok(Array.isArray(solutions), 'Should return array of solutions')
  assert.strictEqual(solutions.length, 4, 'Should find 4 solutions')
  
  // Check each solution structure
  solutions.forEach((solution, index) => {
    assert.ok(typeof solution === 'object', `Solution ${index} should be object`)
    assert.ok(typeof solution.days === 'number', `Solution ${index} should have days`)
    assert.ok(typeof solution.maxGapBetweenCourses === 'number', `Solution ${index} should have maxGapBetweenCourses`)
    assert.ok(typeof solution.coursesOnBusiestDay === 'number', `Solution ${index} should have coursesOnBusiestDay`)
    assert.ok(typeof solution.score === 'number', `Solution ${index} should have score`)
    assert.ok(typeof solution.schedule === 'object', `Solution ${index} should have schedule`)
  })
  
  // Check solutions are sorted by score (descending)
  for (let i = 1; i < solutions.length; i++) {
    assert.ok(solutions[i].score <= solutions[i-1].score, 
      `Solution ${i} score should be <= solution ${i-1} score`)
  }
  
  console.log('  Multiple solutions count:', solutions.length)
  console.log('  First solution:', JSON.stringify(solutions[0], null, 2))
})

// Test multiplicity output structure
test('Multiplicity constraint output structure', () => {
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
  
  assert.ok(result.schedule, 'Should have schedule')
  assert.strictEqual(result.schedule['Course A'].length, 2, 'Course A should have 2 slots')
  
  // Each slot should have proper structure
  result.schedule['Course A'].forEach((slot, index) => {
    assert.ok(typeof slot.day === 'string', `Slot ${index} should have string day`)
    assert.ok(typeof slot.slot === 'number', `Slot ${index} should have numeric slot`)
    assert.ok(['MO', 'DI', 'MI', 'DO', 'FR'].includes(slot.day), `Slot ${index} should have valid day`)
    assert.ok(slot.slot >= 0, `Slot ${index} should have non-negative slot value`)
  })
  
  console.log('  Multiplicity result:', JSON.stringify(result.schedule, null, 2))
})

// Test constraint summary structure
test('Constraint summary structure', () => {
  const solver = new DeclarativeConstraintSolver()
  const input = {
    selectedCourses: {
      'Course A': [createTimeSlot('MO', 18)]
    },
    maxCoursesPerDay: 2,
    maxEmptySlotsBetweenCourses: 3,
    courseMultiplicity: { 'Course A': 1 }
  }
  
  solver.solve(input) // This sets up constraints
  const summary = solver.getConstraintsSummary()
  
  assert.ok(Array.isArray(summary), 'Summary should be an array')
  assert.ok(summary.length > 0, 'Summary should not be empty')
  
  summary.forEach((constraint, index) => {
    assert.ok(typeof constraint === 'string', `Constraint ${index} should be a string`)
    assert.ok(constraint.length > 0, `Constraint ${index} should not be empty`)
  })
  
  console.log('  Constraint summary:', summary)
})

// Test exact values with known inputs
test('Exact output values verification', () => {
  const solver = new DeclarativeConstraintSolver()
  const input = {
    selectedCourses: {
      'Course A': [createTimeSlot('MO', 18, 0)], // Monday 18:00
      'Course B': [createTimeSlot('DI', 20, 30)] // Tuesday 20:30
    }
  }
  
  const result = solver.solve(input)
  
  // Verify exact values
  assert.strictEqual(result.days, 2, 'Should have exactly 2 days')
  assert.strictEqual(result.coursesOnBusiestDay, 1, 'Should have exactly 1 course on busiest day')
  assert.strictEqual(result.maxGapBetweenCourses, 0, 'Should have 0 gap (courses on different days)')
  
  // Verify schedule contents
  assert.strictEqual(result.schedule['Course A'][0].day, 'MO', 'Course A should be on Monday')
  assert.strictEqual(result.schedule['Course A'][0].slot, 1080, 'Course A should be at 1080 minutes (18:00)')
  assert.strictEqual(result.schedule['Course B'][0].day, 'DI', 'Course B should be on Tuesday')
  assert.strictEqual(result.schedule['Course B'][0].slot, 1230, 'Course B should be at 1230 minutes (20:30)')
  
  // Score calculation: days * 2 + max gap - busiest day * 2 = 2*2 + 0 - 1*2 = 2
  assert.strictEqual(result.score, 2, 'Score should be exactly 2')
  
  console.log('  Exact values verified:', {
    days: result.days,
    coursesOnBusiestDay: result.coursesOnBusiestDay,
    maxGapBetweenCourses: result.maxGapBetweenCourses,
    score: result.score
  })
})

console.log(`\n📊 Output Structure Test Results:`)
console.log(`  ✅ Passed: ${passedTests}`)
console.log(`  ❌ Failed: ${testCount - passedTests}`)
console.log(`  📈 Success Rate: ${Math.round(passedTests / testCount * 100)}%`)

if (passedTests === testCount) {
  console.log('\n🎯 All output structure tests passed! The solver produces correctly formatted output.')
  process.exit(0)
} else {
  console.log('\n⚠️  Some output structure tests failed.')
  process.exit(1)
}

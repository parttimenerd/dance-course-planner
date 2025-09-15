import assert from 'assert'
import { DeclarativeConstraintSolver } from '../src/declarativeConstraintSolver.js'

function createTimeSlot(day, hour, minute = 0) {
  return { day, slot: hour * 60 + minute }
}

console.log('🧪 Single Course Gap Tests')

// Case 1: Single course should yield 0 gap regardless of duration
{
  const solver = new DeclarativeConstraintSolver({ courseDurationMinutes: 90 })
  const res = solver.solve({
    selectedCourses: {
      'Only Course': [createTimeSlot('MO', 18)]
    },
    maxEmptySlotsBetweenCourses: 3 // hours
  })
  assert.ok(res.success, 'Should find a solution for single course')
  assert.strictEqual(res.maxGapBetweenCourses, 0, 'Single course should have 0 max gap')
}

// Case 2: Two courses on same day with 70min duration quantization
{
  const solver = new DeclarativeConstraintSolver({ courseDurationMinutes: 70 })
  const res = solver.solve({
    selectedCourses: {
      'A': [createTimeSlot('MO', 18)],
      'B': [createTimeSlot('MO', 20)] // 2h apart; with 70min slot -> floor(120/70)=1 slot => 70min => 1.1666h
    },
    maxEmptySlotsBetweenCourses: 1.25 // allow up to 1.25h quantified gap
  })
  assert.ok(res.success, 'Should succeed with quantized gap within limit')
  assert.ok(res.maxGapBetweenCourses >= 1.16 && res.maxGapBetweenCourses <= 1.2,
    `Expected ~1.166h, got ${res.maxGapBetweenCourses}`)
}

// Case 3: Tight gap with larger duration blocks (90min)
{
  const solver = new DeclarativeConstraintSolver({ courseDurationMinutes: 90 })
  const res = solver.solve({
    selectedCourses: {
      'A': [createTimeSlot('MO', 18)],
      'B': [createTimeSlot('MO', 20)] // 2h apart; with 90min slot -> floor(120/90)=1 slot => 1.5h
    },
    maxEmptySlotsBetweenCourses: 1.4 // less than 1.5h
  })
  assert.ok(!res.success, 'Should fail: quantized gap (1.5h) exceeds 1.4h max')
}

console.log('✅ Single Course Gap Tests passed')

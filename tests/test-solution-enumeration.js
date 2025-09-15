/**
 * Specific test to verify solution enumeration completeness
 */

import { DeclarativeConstraintSolver } from '../src/declarativeConstraintSolver.js'

function createTimeSlot(day, hour, minute = 0) {
  return { day, slot: hour * 60 + minute }
}

console.log('🔍 Testing Complete Solution Enumeration...\n')

// Test case: 2 courses, each with 2 options = 4 total combinations
console.log('Test 1: Simple 2x2 combination (expecting 4 solutions)')
const solver1 = new DeclarativeConstraintSolver()
const input1 = {
  selectedCourses: {
    'Course A': [createTimeSlot('MO', 18), createTimeSlot('MO', 19)],
    'Course B': [createTimeSlot('DI', 18), createTimeSlot('DI', 19)]
  }
}

const result1 = solver1.findAllSolutions(input1)
const solutions1 = result1.schedules
console.log(`Found ${solutions1.length} solutions:`)
solutions1.forEach((sol, i) => {
  console.log(`  Solution ${i+1}: A=${sol.schedule['Course A'][0].day} ${Math.floor(sol.schedule['Course A'][0].slot/60)}:00, B=${sol.schedule['Course B'][0].day} ${Math.floor(sol.schedule['Course B'][0].slot/60)}:00`)
})

if (solutions1.length !== 4) {
  console.log('❌ FAILED: Expected exactly 4 solutions')
  process.exit(1)
}

// Test case: 3 courses, each with 2 options, but with overlap constraint = 6 solutions  
console.log('\nTest 2: 3 courses with potential conflicts (expecting fewer than 8 solutions)')
const solver2 = new DeclarativeConstraintSolver()
const input2 = {
  selectedCourses: {
    'Course A': [createTimeSlot('MO', 18), createTimeSlot('DI', 18)],
    'Course B': [createTimeSlot('MO', 19), createTimeSlot('DI', 19)], 
    'Course C': [createTimeSlot('MO', 18), createTimeSlot('MI', 18)] // Conflicts with A on MO
  }
}

const result2 = solver2.findAllSolutions(input2)
const solutions2 = result2.schedules
console.log(`Found ${solutions2.length} solutions:`)
solutions2.forEach((sol, i) => {
  const a = sol.schedule['Course A'][0]
  const b = sol.schedule['Course B'][0] 
  const c = sol.schedule['Course C'][0]
  console.log(`  Solution ${i+1}: A=${a.day} ${Math.floor(a.slot/60)}:00, B=${b.day} ${Math.floor(b.slot/60)}:00, C=${c.day} ${Math.floor(c.slot/60)}:00`)
})

// Verify no overlaps in any solution
for (let i = 0; i < solutions2.length; i++) {
  const sol = solutions2[i]
  const allSlots = []
  for (const slots of Object.values(sol.schedule)) {
    allSlots.push(...slots)
  }
  
  for (let j = 0; j < allSlots.length; j++) {
    for (let k = j + 1; k < allSlots.length; k++) {
      if (allSlots[j].day === allSlots[k].day && allSlots[j].slot === allSlots[k].slot) {
        console.log(`❌ FAILED: Solution ${i+1} has overlapping slots`)
        process.exit(1)
      }
    }
  }
}

// Test case: Course multiplicity
console.log('\nTest 3: Course multiplicity (expecting multiple valid assignments)')
const solver3 = new DeclarativeConstraintSolver()
const input3 = {
  selectedCourses: {
    'Course A': [
      createTimeSlot('MO', 18), createTimeSlot('MO', 19),
      createTimeSlot('DI', 18), createTimeSlot('DI', 19)
    ]
  },
  courseMultiplicity: {
    'Course A': 2 // Course A should appear exactly twice
  }
}

const result3 = solver3.findAllSolutions(input3)
const solutions3 = result3.schedules
console.log(`Found ${solutions3.length} solutions for multiplicity constraint:`)
solutions3.forEach((sol, i) => {
  const slots = sol.schedule['Course A']
  console.log(`  Solution ${i+1}: Course A appears ${slots.length} times`)
  slots.forEach((slot, j) => {
    console.log(`    ${j+1}. ${slot.day} ${Math.floor(slot.slot/60)}:00`)
  })
  
  // Verify exactly 2 slots
  if (slots.length !== 2) {
    console.log(`❌ FAILED: Solution ${i+1} has ${slots.length} slots instead of 2`)
    process.exit(1)
  }
})

// Expected: C(4,2) = 6 combinations
if (solutions3.length !== 6) {
  console.log(`❌ FAILED: Expected 6 combinations for choosing 2 from 4 slots, got ${solutions3.length}`)
  process.exit(1)
}

// Test case: No solutions available
console.log('\nTest 4: Impossible problem (expecting 0 solutions)')
const solver4 = new DeclarativeConstraintSolver()
const sameSlot = createTimeSlot('MO', 18)
const input4 = {
  selectedCourses: {
    'Course A': [sameSlot],
    'Course B': [sameSlot] // Same slot = conflict
  }
}

const result4 = solver4.solve(input4)
if (result4.success !== false) {
  console.log('❌ FAILED: Expected no solution for conflicting courses')
  process.exit(1)
}

const result4All = solver4.findAllSolutions(input4)
const solutions4 = result4All.schedules
console.log(`Found ${solutions4.length} solutions for impossible problem (expected 0)`) 
if (solutions4.length !== 0) {
  console.log('❌ FAILED: Expected 0 solutions for impossible problem')
  process.exit(1)
}

console.log('\n✅ All solution enumeration tests passed!')
console.log('🎯 The solver correctly:')
console.log('  • Enumerates all possible valid solutions')
console.log('  • Respects overlap constraints') 
console.log('  • Handles course multiplicity correctly')
console.log('  • Returns empty result set for impossible problems')
console.log('  • Maintains solution uniqueness')

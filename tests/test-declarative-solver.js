/**
 * Comprehensive tests for the Declarative Constraint Solver
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
} from '../src/declarativeConstraintSolver.js'// Test utilities
function createTimeSlot(day, hour, minute = 0) {
  return { day, slot: hour * 60 + minute }
}

function expectSolutionValid(solution, expectedCourses) {
  if (!solution) {
    throw new Error('Expected a solution but got null')
  }
  
  if (solution.schedule) {
    const scheduledCourses = Object.keys(solution.schedule)
    if (scheduledCourses.length !== expectedCourses) {
      throw new Error(`Expected ${expectedCourses} courses, got ${scheduledCourses.length}`)
    }
  }
}

function expectNoSolution(solution) {
  if (solution === null || (solution && solution.success === false)) {
    return // Good - no solution or failure object as expected
  }
  throw new Error('Expected no solution but got one')
}

// Test suite runner
function runTests() {
  console.log('🧪 Running Declarative Constraint Solver Tests...\n')
  
  let passed = 0
  let failed = 0

  function test(name, testFn) {
    try {
      console.log(`  Testing: ${name}`)
      testFn()
      console.log(`  ✅ ${name} PASSED`)
      passed++
    } catch (error) {
      console.log(`  ❌ ${name} FAILED: ${error.message}`)
      failed++
    }
  }

  // === TimeSlot Tests ===
  console.log('📅 TimeSlot Tests')
  
  test('TimeSlot creation and toString', () => {
    const slot = new TimeSlot('MO', 1200) // 20:00
    if (slot.toString() !== 'MO 20:00') {
      throw new Error(`Expected 'MO 20:00', got '${slot.toString()}'`)
    }
  })

  test('TimeSlot equality', () => {
    const slot1 = new TimeSlot('MO', 1200)
    const slot2 = new TimeSlot('MO', 1200)
    const slot3 = new TimeSlot('DI', 1200)
    
    if (!slot1.equals(slot2)) {
      throw new Error('Equal slots should be equal')
    }
    if (slot1.equals(slot3)) {
      throw new Error('Different slots should not be equal')
    }
  })

  test('TimeSlot gap calculation', () => {
    const slot1 = new TimeSlot('MO', 1200) // 20:00
    const slot2 = new TimeSlot('MO', 1320) // 22:00
    const slot3 = new TimeSlot('DI', 1200) // Different day
    
    if (slot1.gapTo(slot2) !== 2) {
      throw new Error(`Expected gap of 2 hours, got ${slot1.gapTo(slot2)}`)
    }
    if (slot1.gapTo(slot3) !== Infinity) {
      throw new Error('Gap between different days should be Infinity')
    }
  })

  // === Schedule Tests ===
  console.log('\n📋 Schedule Tests')

  test('Schedule creation and cloning', () => {
    const schedule = new Schedule({ 'Course A': [new TimeSlot('MO', 1200)] })
    const cloned = schedule.clone()
    
    if (schedule === cloned) {
      throw new Error('Clone should be a different object')
    }
    if (schedule.assignments['Course A'][0] !== cloned.assignments['Course A'][0]) {
      throw new Error('Cloned slots should reference same TimeSlot objects')
    }
  })

  test('Schedule assignment', () => {
    const schedule = new Schedule()
    const newSchedule = schedule.assign('Course A', [new TimeSlot('MO', 1200)])
    
    if (schedule.assignments['Course A']) {
      throw new Error('Original schedule should not be modified')
    }
    if (!newSchedule.assignments['Course A']) {
      throw new Error('New schedule should have the assignment')
    }
  })

  test('Schedule stats calculation', () => {
    const schedule = new Schedule({
      'Course A': [new TimeSlot('MO', 1200)], // 20:00
      'Course B': [new TimeSlot('MO', 1320)], // 22:00 (2 hour gap)
      'Course C': [new TimeSlot('DI', 1200)]  // 20:00 on different day
    })
    
    const stats = schedule.computeStats()
    
    if (stats.days !== 2) {
      throw new Error(`Expected 2 days, got ${stats.days}`)
    }
    // 120 minutes gap, with 70-minute course duration: floor(120/70) = 1 slot = 70 minutes = 1.1666 hours
    const expectedGap = 70/60 // 1.1666... hours
    if (Math.abs(stats.maxGapBetweenCourses - expectedGap) > 0.001) {
      throw new Error(`Expected quantized gap of ${expectedGap.toFixed(4)} hours, got ${stats.maxGapBetweenCourses}`)
    }
    if (stats.coursesOnBusiestDay !== 2) {
      throw new Error(`Expected 2 courses on busiest day, got ${stats.coursesOnBusiestDay}`)
    }
    
    // Score = days * 2 + maxGap - busiestDay * 2 = 2*2 + 1.1666 - 2*2 = 1.1666
    const expectedScore = 2*2 + expectedGap - 2*2 // Should be approximately 1.1666
    if (Math.abs(stats.score - expectedScore) > 0.001) {
      throw new Error(`Expected score of ${expectedScore.toFixed(4)}, got ${stats.score}`)
    }
  })

  // === Constraint Tests ===
  console.log('\n🚧 Constraint Tests')

  test('MaxCoursesPerDayConstraint', () => {
    const constraint = new MaxCoursesPerDayConstraint(2)
    
    // Valid schedule (2 courses on same day)
    const validSchedule = new Schedule({
      'Course A': [new TimeSlot('MO', 1200)],
      'Course B': [new TimeSlot('MO', 1320)]
    })
    if (!constraint.isSatisfied(validSchedule)) {
      throw new Error('Should satisfy constraint with 2 courses on same day')
    }
    
    // Invalid schedule (3 courses on same day)
    const invalidSchedule = new Schedule({
      'Course A': [new TimeSlot('MO', 1200)],
      'Course B': [new TimeSlot('MO', 1320)],
      'Course C': [new TimeSlot('MO', 1380)]
    })
    if (constraint.isSatisfied(invalidSchedule)) {
      throw new Error('Should violate constraint with 3 courses on same day')
    }
  })

  test('MaxEmptySlotsBetweenCoursesConstraint', () => {
    const constraint = new MaxEmptySlotsBetweenCoursesConstraint(2)
    
    // Valid schedule (2 hour gap)
    const validSchedule = new Schedule({
      'Course A': [new TimeSlot('MO', 1200)], // 20:00
      'Course B': [new TimeSlot('MO', 1320)]  // 22:00
    })
    if (!constraint.isSatisfied(validSchedule)) {
      throw new Error('Should satisfy constraint with 2 hour gap')
    }
    
    // Invalid schedule (3 hour gap)
    const invalidSchedule = new Schedule({
      'Course A': [new TimeSlot('MO', 1200)], // 20:00
      'Course B': [new TimeSlot('MO', 1380)]  // 23:00
    })
    if (constraint.isSatisfied(invalidSchedule)) {
      throw new Error('Should violate constraint with 3 hour gap')
    }
  })

  test('NoOverlappingSlotsConstraint', () => {
    const constraint = new NoOverlappingSlotsConstraint()
    
    // Valid schedule (different slots)
    const validSchedule = new Schedule({
      'Course A': [new TimeSlot('MO', 1200)],
      'Course B': [new TimeSlot('MO', 1320)]
    })
    if (!constraint.isSatisfied(validSchedule)) {
      throw new Error('Should satisfy constraint with different slots')
    }
    
    // Invalid schedule (same slot)
    const invalidSchedule = new Schedule({
      'Course A': [new TimeSlot('MO', 1200)],
      'Course B': [new TimeSlot('MO', 1200)]
    })
    if (constraint.isSatisfied(invalidSchedule)) {
      throw new Error('Should violate constraint with overlapping slots')
    }
  })

  test('CourseMultiplicityConstraint', () => {
    const constraint = new CourseMultiplicityConstraint({
      'Course A': 2,
      'Course B': 1
    })
    
    // Valid schedule
    const validSchedule = new Schedule({
      'Course A': [new TimeSlot('MO', 1200), new TimeSlot('DI', 1200)],
      'Course B': [new TimeSlot('MI', 1200)],
      'Course C': [new TimeSlot('DO', 1200)] // Not in multiplicity map, defaults to 1
    })
    if (!constraint.isSatisfied(validSchedule)) {
      throw new Error('Should satisfy multiplicity constraint')
    }
    
    // Invalid schedule (Course A appears only once)
    const invalidSchedule = new Schedule({
      'Course A': [new TimeSlot('MO', 1200)],
      'Course B': [new TimeSlot('MI', 1200)]
    })
    if (constraint.isSatisfied(invalidSchedule)) {
      throw new Error('Should violate multiplicity constraint')
    }
  })

  // === Solver Integration Tests ===
  console.log('\n🔧 Solver Integration Tests')

  test('Simple scheduling problem', () => {
    const solver = new DeclarativeConstraintSolver()
    
    const input = {
      selectedCourses: {
        'Course A': [createTimeSlot('MO', 20), createTimeSlot('DI', 20)],
        'Course B': [createTimeSlot('MI', 19)]
      },
      maxCoursesPerDay: 2
    }
    
    const solution = solver.solve(input)
    expectSolutionValid(solution, 2)
  })

  test('Impossible scheduling problem', () => {
    const solver = new DeclarativeConstraintSolver()
    
    const input = {
      selectedCourses: {
        'Course A': [createTimeSlot('MO', 20)],
        'Course B': [createTimeSlot('MO', 20)] // Same slot as Course A
      }
    }
    
    const solution = solver.solve(input)
    expectNoSolution(solution)
  })

  test('Course multiplicity scheduling', () => {
    const solver = new DeclarativeConstraintSolver()
    
    const input = {
      selectedCourses: {
        'Course A': [
          createTimeSlot('MO', 20),
          createTimeSlot('DI', 20),
          createTimeSlot('MI', 20)
        ]
      },
      courseMultiplicity: {
        'Course A': 2
      }
    }
    
    const solution = solver.solve(input)
    expectSolutionValid(solution, 1)
    
    if (solution.schedule['Course A'].length !== 2) {
      throw new Error('Course A should be scheduled twice')
    }
  })

  test('Max empty slots constraint', () => {
    const solver = new DeclarativeConstraintSolver()
    
    const input = {
      selectedCourses: {
        'Course A': [createTimeSlot('MO', 18)], // 18:00
        'Course B': [createTimeSlot('MO', 22)]  // 22:00 (4 hour gap)
      },
      maxEmptySlotsBetweenCourses: 3 // Only allow 3 hours max
    }
    
    const solution = solver.solve(input)
    expectNoSolution(solution) // Should fail due to 4 hour gap
  })

  test('Multiple solutions with scoring', () => {
    const solver = new DeclarativeConstraintSolver()
    
    const input = {
      selectedCourses: {
        'Course A': [
          createTimeSlot('MO', 20),
          createTimeSlot('DI', 20)
        ],
        'Course B': [
          createTimeSlot('MO', 21),
          createTimeSlot('MI', 20)
        ]
      }
    }
    
    const solutions = solver.findAllSolutions(input, 5)
    
    if (solutions.length === 0) {
      throw new Error('Should find at least one solution')
    }
    
    // Solutions should be sorted by score (higher is better)
    for (let i = 1; i < solutions.length; i++) {
      if (solutions[i].score > solutions[i-1].score) {
        throw new Error('Solutions should be sorted by descending score')
      }
    }
  })

  test('Debug mode functionality', () => {
    const solver = new DeclarativeConstraintSolver()
    solver.setDebugMode(true)
    
    // Capture console.log output
    const originalLog = console.log
    const logOutput = []
    console.log = (...args) => logOutput.push(args.join(' '))
    
    try {
      const input = {
        selectedCourses: {
          'Course A': [createTimeSlot('MO', 20)]
        }
      }
      
      solver.solve(input)
      
      // Restore console.log
      console.log = originalLog
      
      // Check if debug messages were logged
      const debugMessages = logOutput.filter(msg => msg.includes('[DeclarativeSolver]'))
      if (debugMessages.length === 0) {
        throw new Error('Debug mode should produce debug messages')
      }
    } finally {
      console.log = originalLog
    }
  })

  test('Constraints summary', () => {
    const solver = new DeclarativeConstraintSolver()
    
    const input = {
      selectedCourses: {
        'Course A': [createTimeSlot('MO', 20)]
      },
      maxCoursesPerDay: 2,
      maxEmptySlotsBetweenCourses: 3,
      courseMultiplicity: { 'Course A': 1 }
    }
    
    // This will add implicit constraints
    solver.solve(input)
    
    const summary = solver.getConstraintsSummary()
    if (summary.length < 3) {
      throw new Error('Should have at least 3 constraints')
    }
    
    if (!summary.some(desc => desc.includes('overlapping'))) {
      throw new Error('Should include no overlapping constraint')
    }
  })

  test('Course duration configuration', () => {
    // Test default duration
    const solver1 = new DeclarativeConstraintSolver()
    if (solver1.courseDurationMinutes !== 70) {
      throw new Error('Default course duration should be 70 minutes')
    }
    
    // Test constructor configuration
    const solver2 = new DeclarativeConstraintSolver({ courseDurationMinutes: 90 })
    if (solver2.courseDurationMinutes !== 90) {
      throw new Error('Constructor should set custom course duration')
    }
    
    // Test setter method
    const solver3 = new DeclarativeConstraintSolver()
    solver3.setCourseDuration(60)
    if (solver3.courseDurationMinutes !== 60) {
      throw new Error('setCourseDuration should change duration')
    }
    
    // Test that duration affects gap calculations
    const input = {
      selectedCourses: {
        'Course A': [createTimeSlot('MO', 18)], // 18:00
        'Course B': [createTimeSlot('MO', 20)]  // 20:00 (120 minutes gap)
      }
    }
    
    // 60-minute duration: floor(120/60) = 2 slots = 2 hours
    const solver60 = new DeclarativeConstraintSolver({ courseDurationMinutes: 60 })
    const result60 = solver60.solve(input)
    if (Math.abs(result60.maxGapBetweenCourses - 2.0) > 0.001) {
      throw new Error('60-minute courses should yield 2-hour quantized gap')
    }
    
    // 90-minute duration: floor(120/90) = 1 slot = 1.5 hours
    const solver90 = new DeclarativeConstraintSolver({ courseDurationMinutes: 90 })
    const result90 = solver90.solve(input)
    if (Math.abs(result90.maxGapBetweenCourses - 1.5) > 0.001) {
      throw new Error('90-minute courses should yield 1.5-hour quantized gap')
    }
  })

  // === Performance Tests ===
  console.log('\n⚡ Performance Tests')

  test('Large problem performance', () => {
    const solver = new DeclarativeConstraintSolver()
    
    // Create a larger problem
    const selectedCourses = {}
    for (let i = 0; i < 5; i++) {
      selectedCourses[`Course ${i}`] = [
        createTimeSlot('MO', 18 + i),
        createTimeSlot('DI', 18 + i),
        createTimeSlot('MI', 18 + i)
      ]
    }
    
    const input = {
      selectedCourses,
      maxCoursesPerDay: 3
    }
    
    const startTime = Date.now()
    const solution = solver.solve(input)
    const endTime = Date.now()
    
    if (endTime - startTime > 1000) { // 1 second timeout
      throw new Error('Solver should complete within 1 second for this problem size')
    }
    
    expectSolutionValid(solution, 5)
  })

  // === Edge Cases ===
  console.log('\n🎯 Edge Case Tests')

  test('Empty course list', () => {
    const solver = new DeclarativeConstraintSolver()
    
    const input = {
      selectedCourses: {}
    }
    
    const solution = solver.solve(input)
    if (!solution || Object.keys(solution.schedule).length !== 0) {
      throw new Error('Empty course list should return empty schedule')
    }
  })

  test('Single course single slot', () => {
    const solver = new DeclarativeConstraintSolver()
    
    const input = {
      selectedCourses: {
        'Only Course': [createTimeSlot('MO', 20)]
      }
    }
    
    const solution = solver.solve(input)
    expectSolutionValid(solution, 1)
    
    if (solution.days !== 1) {
      throw new Error('Should use only 1 day')
    }
    if (solution.maxGapBetweenCourses !== 0) {
      throw new Error('Single course should have 0 gap')
    }
  })

  test('Course with no available slots', () => {
    const solver = new DeclarativeConstraintSolver()
    
    const input = {
      selectedCourses: {
        'Course A': []
      }
    }
    
    const solution = solver.solve(input)
    expectNoSolution(solution)
  })

  // Print test results
  console.log(`\n📊 Test Results:`)
  console.log(`  ✅ Passed: ${passed}`)
  console.log(`  ❌ Failed: ${failed}`)
  console.log(`  📈 Success Rate: ${Math.round((passed / (passed + failed)) * 100)}%`)
  
  if (failed === 0) {
    console.log(`\n🎉 All tests passed! The Declarative Constraint Solver is working correctly.`)
  } else {
    console.log(`\n⚠️  Some tests failed. Please review the failed tests above.`)
  }
  
  return { passed, failed }
}

// Export for use in Node.js or browser
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { runTests }
} else if (typeof window !== 'undefined') {
  window.runDeclarativeSolverTests = runTests
}

// Run tests if called directly
if (typeof process !== 'undefined' && process.argv && process.argv[1] && process.argv[1].endsWith('test-declarative-solver.js')) {
  runTests()
}

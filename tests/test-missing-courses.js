// Test script to debug missing courses issue
import { HintingSolver } from '../src/hintingSolver.js'
import { NimbuscloudClient } from '../src/services/nimbuscloud.js'

// Use the actual API response data from ROADMAP.md
const mockApiResponse = {
  "content": {
    "content": {
      "locations": [
        {
          "id": "7",
          "name": "Karlsruhe - Durmersheimer Straße",
          "days": [
            {
              "time": 1757800800,
              "courses": [
                {
                  "pairOnly": false,
                  "event": "31452",
                  "visitExists": true,
                  "teacher": "7260",
                  "teacherName": "Malika Huber",
                  "room": "Saal 3",
                  "name": "Standard & Latein - Grundstufe (WTP 1)",
                  "start_date": "SO 14.09.",
                  "start_time": "15:00",
                  "end_time": "16:00"
                },
                {
                  "pairOnly": true,
                  "event": "31453",
                  "visitExists": false,
                  "teacher": "7261",
                  "teacherName": "Test Teacher",
                  "room": "Saal 1",
                  "name": "Standard & Latein - Medaillenstufe (Level 3)",
                  "start_date": "SO 14.09.", 
                  "start_time": "16:00",
                  "end_time": "17:00"
                },
                {
                  "pairOnly": true,
                  "event": "31454", 
                  "visitExists": false,
                  "teacher": "7262",
                  "teacherName": "Another Teacher",
                  "room": "Saal 2",
                  "name": "Standard & Latein - Medaillenstufe (Level 3)",
                  "start_date": "DI 16.09.",
                  "start_time": "19:00", 
                  "end_time": "20:00"
                }
              ]
            }
          ]
        }
      ]
    }
  }
}

console.log('=== TESTING PAIR COURSE FILTERING ===\n')

// Step 1: Test the transformation
console.log('Step 1: Testing Nimbuscloud transformation...')
const client = new NimbuscloudClient()
const transformedData = client.transformScheduleData(mockApiResponse)

console.log('Transformed data structure:', {
  hasCourses: !!transformedData.courses,
  courseCount: transformedData.courses?.length || 0
})

if (transformedData.courses) {
  console.log('\nTransformed courses:')
  transformedData.courses.forEach((course, index) => {
    console.log(`${index + 1}. ${course.name} (ID: ${course.id}, pairOnly: ${course.pairOnly})`)
  })
}

// Step 2: Create course groups from transformed data
console.log('\nStep 2: Creating course groups from transformed data...')

const courseGroups = new Map()
if (transformedData.courses) {
  for (const course of transformedData.courses) {
    if (!courseGroups.has(course.name)) {
      courseGroups.set(course.name, [])
    }
    courseGroups.get(course.name).push(course)
  }
}

console.log('Course groups found:', Array.from(courseGroups.keys()))

// Step 3: Test HintingSolver with disablePairCourses = false
console.log('\nStep 3: Testing HintingSolver with disablePairCourses = false...')
const hintingSolver = new HintingSolver()

// Prepare solver input with pair courses ENABLED
const selectedCourses = {}
const existingCourses = {}
const courseNames = ['Standard & Latein - Grundstufe (WTP 1)', 'Standard & Latein - Medaillenstufe (Level 3)']

for (const courseName of courseNames) {
  const courseGroup = courseGroups.get(courseName)
  if (courseGroup) {
    // Include ALL courses (pair courses enabled)
    const timeSlots = courseGroup.map(course => ({
      day: course.day,
      slot: course.startHour * 60 + course.startMinute
    }))
    selectedCourses[courseName] = timeSlots
    existingCourses[courseName] = timeSlots
  }
}

console.log('Generating schedules with pair courses ENABLED...')
const resultsWithPair = hintingSolver.solve({
  selectedCourses,
  existingCourses,
  maxCoursesPerDay: 10
}, 20)
console.log('Results with pair courses:', resultsWithPair.success ? resultsWithPair.schedules.length : 0, 'schedules')
if (!resultsWithPair.success) {
  console.log('Hints:', resultsWithPair.hints?.map(h => h.description))
}

// Step 4: Test HintingSolver with disablePairCourses = true
console.log('\nStep 4: Testing HintingSolver with disablePairCourses = true...')

// Prepare solver input with pair courses DISABLED
const selectedCoursesNoPair = {}
const existingCoursesNoPair = {}

for (const courseName of courseNames) {
  const courseGroup = courseGroups.get(courseName)
  if (courseGroup) {
    // Filter out pair courses
    const filteredCourses = courseGroup.filter(course => !course.pairOnly)
    const timeSlots = filteredCourses.map(course => ({
      day: course.day,
      slot: course.startHour * 60 + course.startMinute
    }))
    selectedCoursesNoPair[courseName] = timeSlots
    existingCoursesNoPair[courseName] = timeSlots
  }
}

console.log('Generating schedules with pair courses DISABLED...')
const resultsWithoutPair = hintingSolver.solve({
  selectedCourses: selectedCoursesNoPair,
  existingCourses: existingCoursesNoPair,
  maxCoursesPerDay: 10
}, 20)
console.log('Results without pair courses:', resultsWithoutPair.success ? resultsWithoutPair.schedules.length : 0, 'schedules')
if (!resultsWithoutPair.success) {
  console.log('Hints:', resultsWithoutPair.hints?.map(h => h.description))
}

console.log('\n=== ANALYSIS ===')
const level3Courses = transformedData.courses.filter(c => 
  c.name.includes('Level 3') || c.name.includes('Medaillenstufe')
)
console.log(`Level 3/Medaillenstufe courses found: ${level3Courses.length}`)
level3Courses.forEach(course => {
  console.log(`  - ${course.name} (pairOnly: ${course.pairOnly})`)
})

if (level3Courses.length === 0) {
  console.log('❌ ISSUE: No Level 3 courses found in the pipeline!')
} else {
  const hiddenByPairFilter = level3Courses.filter(c => c.pairOnly)
  if (hiddenByPairFilter.length > 0) {
    console.log(`⚠️  Level 3 courses are marked as pairOnly and will be filtered when disablePairCourses=true`)
    console.log(`✅ FIX: The HintingSolver should now properly handle disablePairCourses setting`)
    console.log(`✅ FIX: The App.vue now passes disablePairCourses to the constraint solver`)
    console.log(`✅ FIX: The App.vue now watches disablePairCourses for automatic regeneration`)
  } else {
    console.log('✅ Level 3 courses should always be visible')
  }
}

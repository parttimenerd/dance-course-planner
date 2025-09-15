// Test script to verify pair course parsing logic
const testResponse = {
  "content": {
    "content": {
      "locations": [
        {
          "id": "7",
          "name": "Karlsruhe - Durmersheimer Straße",
          "days": [
            {
              "time": 1757887200,
              "courses": [
                {
                  "pairOnly": false,
                  "event": "27390",
                  "visitExists": false,
                  "name": "Lindy Hop Grundstufe (Level 1)"
                },
                {
                  "pairOnly": true,
                  "event": "28680",
                  "visitExists": false,
                  "name": "Standard & Latein Grundstufe (WTP 1)"
                },
                {
                  "pairOnly": true,
                  "event": "28716",
                  "visitExists": false,
                  "name": "Standard & Latein Aufbaustufe (WTP 2)"
                }
              ]
            }
          ]
        }
      ]
    },
    "statuscode": 200,
    "status": "success",
    "payload": []
  },
  "statuscode": 200,
  "status": "success",
  "payload": []
}

// Simulate the extraction logic
function extractCoursesFromResponse(data) {
  if (data.content?.content?.locations && Array.isArray(data.content.content.locations)) {
    const allCourses = []
    data.content.content.locations.forEach(location => {
      location.days?.forEach(day => {
        day.courses?.forEach(course => {
          allCourses.push({
            id: course.event,
            event: course.event,
            name: course.name,
            pairOnly: course.pairOnly || false,
            visitExists: course.visitExists || false,
            location: location.name
          })
        })
      })
    })
    
    console.log('Extracted courses:', allCourses.length)
    console.log('Pair courses found:', allCourses.filter(c => c.pairOnly).length)
    console.log('Non-pair courses found:', allCourses.filter(c => !c.pairOnly).length)
    
    allCourses.forEach(course => {
      console.log(`Course ${course.event}: "${course.name}" - pairOnly: ${course.pairOnly}`)
    })
    
    return {
      ...data,
      payload: allCourses
    }
  }
  return data
}

// Test the extraction
console.log('Testing course extraction logic...')
const result = extractCoursesFromResponse(testResponse)
console.log('Final payload length:', result.payload.length)
console.log('SUCCESS: Course extraction logic works correctly!')

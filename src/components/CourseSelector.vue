<template>
  <div class="mb-6">
    <label class="block text-sm font-medium text-gray-700 mb-2">
      🎭 {{ t('Select Courses') }}
    </label>
    
    <!-- Search/Filter -->
    <div class="mb-3">
      <input
        type="text"
        v-model="searchQuery"
        :placeholder="t('Search courses...')"
        class="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
      />
      <!-- Show pair course filter status -->
      <div v-if="constraints.disablePairCourses" class="mt-2 text-xs text-orange-600 bg-orange-50 px-2 py-1 rounded">
        ⚠️ {{ t('Pair courses hidden') }}
      </div>
    </div>

    <!-- Course List -->
    <div class="max-h-64 overflow-y-auto border border-gray-200 rounded-lg">
      <div v-if="filteredCourseGroups.length === 0" class="text-sm text-gray-500 text-center py-8">
        {{ t('No courses found') }}{{ searchQuery ? ' ' + t('matching') + ' "' + searchQuery + '"' : '' }}
      </div>
      
      <div v-for="[courseName, instances] in filteredCourseGroups" :key="courseName" class="border-b border-gray-100 last:border-b-0">
        <div class="p-3">
          <div class="flex items-center justify-between">
            <div class="flex items-center">
              <button
                @click="toggleCourseName(courseName)"
                :class="[
                  'px-3 py-2 text-sm rounded-lg border transition-colors mr-3',
                  isCourseNameSelected(courseName)
                    ? 'bg-green-100 text-green-800 border-green-300'
                    : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                ]"
              >
                {{ courseName }}<PairIcon :show="!!areAllSlotsPairOnly(instances)" />
              </button>
            </div>
          </div>
          
                    <!-- Show available time slots for reference -->
          <div class="mt-2 flex flex-wrap gap-1">
            <span
              v-for="course in getVisibleTimeSlots(instances)"
              :key="course.id"
              :class="getTimeSlotClasses(course)"
            >
              {{ formatTimeSlot(course) }}<PairIcon :show="!!(hasMixedPairSlots(instances) && isPairCourse(course))" />
            </span>
            <span v-if="getFilteredInstanceCount(instances) > 6" class="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-full">
              +{{ getFilteredInstanceCount(instances) - 6 }} more
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- Selected Count -->
    <div class="mt-2 text-xs text-gray-500">
      {{ selectedCourseNames.length }} {{ selectedCourseNames.length === 1 ? t('course') : t('courses') }} {{ t('selected') }}
    </div>

    <!-- Nimbuscloud Filter Note -->
    <div class="mt-2 text-xs text-gray-600 bg-blue-50 border border-blue-200 rounded px-2 py-1">
      ℹ️ {{ t('Only courses enabled in your') }} 
      <a href="https://community.nimbuscloud.at/#app/schedule" target="_blank" class="text-blue-600 hover:text-blue-800 underline">
        {{ t('Nimbuscloud schedule filters') }}
      </a> 
      {{ t('are shown here') }}
    </div>

    <!-- Quick Actions -->
    <div class="mt-3 flex gap-2">
      <button
        @click="selectAll"
        class="px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
      >
        {{ t('Select All') }}
      </button>
      <button
        @click="clearAll"
        class="px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
      >
        {{ t('Clear All') }}
      </button>
    </div>
  </div>
</template>

<script>
import { ref, computed, watch } from 'vue'
import { useI18n } from '../composables/useI18n.js'
import CollapsibleSection from './CollapsibleSection.vue'
import PairIcon from './PairIcon.vue'

export default {
  name: 'CourseSelector',
  components: {
    CollapsibleSection,
    PairIcon
  },
  props: {
    modelValue: {
      type: Array,
      default: () => []
    },
    courseGroups: {
      type: Map,
      default: () => new Map()
    },
    constraints: {
      type: Object,
      default: () => ({})
    }
  },
  emits: ['update:modelValue', 'update:constraints'],
  setup(props, { emit }) {
    const { t, translateDayCode, getDayColors } = useI18n()
    
    const selectedCourseNames = ref([...props.modelValue])
    const searchQuery = ref('')

    // Add logging to track props
    watch(() => props.courseGroups, (newGroups) => {
      console.log('[CourseSelector] courseGroups prop updated:', {
        groupCount: newGroups.size,
        groupNames: Array.from(newGroups.keys())
      })
      
      // Log Level 3 courses specifically
      let level3Groups = []
      for (const [groupName, courses] of newGroups) {
        if (groupName.includes('Level 3') || groupName.includes('Medaillenstufe')) {
          level3Groups.push({
            name: groupName,
            courseCount: courses.length,
            pairOnlyCount: courses.filter(c => c.pairOnly).length
          })
        }
      }
      console.log('[CourseSelector] Level 3 course groups in props:', level3Groups)
    }, { immediate: true })

    watch(() => props.constraints.disablePairCourses, (newValue) => {
      console.log('[CourseSelector] disablePairCourses constraint changed to:', newValue)
    }, { immediate: true })

    const normalizeForSorting = (courseName) => {
      // Remove common suffixes/prefixes that shouldn't affect sorting
      return courseName
        .toLowerCase()
        .replace(/\b\w*stufe\b/g, '') // Remove any word ending with "stufe"
        .replace(/\bclub\b/gi, '') // Remove "club" (case insensitive)
        .replace(/\b(medaillenstufe)/gi, '') // Remove "level", "lvl", "medaillen"
        .replace(/\s+/g, ' ') // Normalize whitespace
        .trim()
    }

    const filteredCourseGroups = computed(() => {
      let groups = Array.from(props.courseGroups.entries())
      
      console.log('[CourseSelector] Filtering courses:', {
        disablePairCourses: props.constraints.disablePairCourses,
        totalGroupsBeforeFilter: groups.length,
        totalCoursesBeforeFilter: groups.reduce((acc, [, instances]) => acc + instances.length, 0)
      })
      
      // Log first few course instances to see their structure
      if (groups.length > 0) {
        const [firstGroupName, firstInstances] = groups[0]
        console.log('[CourseSelector] First course group structure:', {
          name: firstGroupName,
          instanceCount: firstInstances.length,
          firstInstance: firstInstances[0] ? {
            id: firstInstances[0].id,
            name: firstInstances[0].name,
            pairOnly: firstInstances[0].pairOnly,
            allProperties: Object.keys(firstInstances[0])
          } : null
        })
      }
      
      // Filter out pair courses if disabled
      if (props.constraints.disablePairCourses) {
        console.log('[CourseSelector] Pair courses are disabled, filtering out pairOnly courses')
        const groupsBeforeFilter = groups.length
        groups = groups.map(([courseName, instances]) => {
          // Filter out pair-only instances
          const pairInstances = instances.filter(course => course.pairOnly)
          const nonPairInstances = instances.filter(course => !course.pairOnly)
          console.log(`[CourseSelector] Course "${courseName}": ${instances.length} total, ${pairInstances.length} pair-only, ${nonPairInstances.length} non-pair`)
          return [courseName, nonPairInstances]
        }).filter(([courseName, instances]) => {
          // Remove courses that have no non-pair instances left
          const hasInstances = instances.length > 0
          if (!hasInstances) {
            console.log(`[CourseSelector] Removing course group "${courseName}" - no non-pair instances`)
          }
          return hasInstances
        })
        console.log(`[CourseSelector] After pair filtering: ${groupsBeforeFilter} -> ${groups.length} course groups`)
      } else {
        console.log('[CourseSelector] Pair courses are enabled, showing all courses')
      }
      
      if (searchQuery.value) {
        const query = searchQuery.value.toLowerCase()
        groups = groups.filter(([courseName]) =>
          courseName.toLowerCase().includes(query)
        )
      }
      
      // Sort groups by normalized course name alphabetically
      groups.sort(([a], [b]) => {
        const normalizedA = normalizeForSorting(a)
        const normalizedB = normalizeForSorting(b)
        return normalizedA.localeCompare(normalizedB)
      })
      
      // Sort the course instances within each group by start time
      const result = groups.map(([courseName, instances]) => [
        courseName,
        [...instances].sort((a, b) => {
          // Handle undefined startTime gracefully
          if (!a.startTime || !b.startTime) {
            return 0
          }
          return a.startTime - b.startTime
        })
      ])
      
      console.log('[CourseSelector] Final filtered course groups:', {
        totalGroups: result.length,
        groupNames: result.map(([name]) => name)
      })
      
      return result
    })

    const isCourseNameSelected = (courseName) => {
      return selectedCourseNames.value.includes(courseName)
    }

    const toggleCourseName = (courseName) => {
      const index = selectedCourseNames.value.indexOf(courseName)
      if (index > -1) {
        selectedCourseNames.value.splice(index, 1)
      } else {
        selectedCourseNames.value.push(courseName)
      }
      updateSelection()
    }

    const formatTimeSlot = (course) => {
      // Show day, time for reference only
      if (!course.startTime || !(course.startTime instanceof Date)) {
        console.warn('[CourseSelector] Invalid startTime for course:', course)
        return `${translateDayCode(course.day)} 00:00`
      }
      
      const timeStr = course.startTime.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: false 
      })
      
      return `${translateDayCode(course.day)} ${timeStr}`
    }

    // Get day-specific colors from centralized system
    const getTimeSlotClasses = (course) => {
      const dayCode = translateDayCode(course.day)
      const colors = getDayColors(dayCode)
      return `px-2 py-1 text-xs rounded-full ${colors.bg} ${colors.text}`
    }

    const getVisibleTimeSlots = (instances) => {
      // Filter out pair courses if disabled
      let visibleInstances = instances
      if (props.constraints.disablePairCourses) {
        visibleInstances = instances.filter(course => !course.pairOnly)
      }
      // Show only first 6 slots
      return visibleInstances.slice(0, 6)
    }

    const getFilteredInstanceCount = (instances) => {
      // Count instances that would be visible (filtering out pair courses if disabled)
      if (props.constraints.disablePairCourses) {
        return instances.filter(course => !course.pairOnly).length
      }
      return instances.length
    }

    const updateSelection = () => {
      emit('update:modelValue', [...selectedCourseNames.value])
    }

    const selectAll = () => {
      // Only select courses that are currently visible (respects pair course filtering)
      const allCourseNames = filteredCourseGroups.value.map(([courseName]) => courseName)
      selectedCourseNames.value = [...allCourseNames]
      updateSelection()
    }

    const clearAll = () => {
      selectedCourseNames.value = []
      updateSelection()
    }

    // Watch for prop changes
    watch(() => props.modelValue, (newValue) => {
      selectedCourseNames.value = [...newValue]
    })

    // Watch for constraint changes that might make courses unavailable
    watch(() => props.constraints.disablePairCourses, () => {
      // Remove selected courses that are no longer available
      const availableCourseNames = filteredCourseGroups.value.map(([courseName]) => courseName)
      const filteredSelection = selectedCourseNames.value.filter(courseName => 
        availableCourseNames.includes(courseName)
      )
      
      if (filteredSelection.length !== selectedCourseNames.value.length) {
        selectedCourseNames.value = filteredSelection
        updateSelection()
      }
    })

    // Check if individual course is a pair course
    const isPairCourse = (course) => {
      // Guard against null/undefined course
      if (!course) return false
      
      const checks = {
        pairOnly: course.pairOnly,
        isPairOnly: course.isPairOnly,
        pair_only: course.pair_only,
        requiresPartner: course.requiresPartner,
        typePair: course.type === 'pair',
        courseTypePair: course.courseType === 'pair',
        nameContainsPair: course.name && course.name.toLowerCase().includes('pair'),
        descriptionContainsPair: course.description && course.description.toLowerCase().includes('pair')
      }
      
      const result = !!(checks.pairOnly || 
             checks.isPairOnly || 
             checks.pair_only ||
             checks.requiresPartner ||
             checks.typePair ||
             checks.courseTypePair ||
             checks.nameContainsPair ||
             checks.descriptionContainsPair)
      
      // Log for debugging specific courses
      if (course.name && (course.name.toLowerCase().includes('standard') || course.name.toLowerCase().includes('latin'))) {
        console.log('[CourseSelector] isPairCourse check for Standard/Latin course:', {
          courseName: course.name,
          courseId: course.id,
          day: course.day,
          time: course.startTime ? `${course.startTime.getHours()}:${course.startTime.getMinutes().toString().padStart(2, '0')}` : 'N/A',
          checks,
          result,
          allProperties: Object.keys(course)
        })
      }
      
      return result
    }

    // Check if all slots in a course group are pair-only
    const areAllSlotsPairOnly = (instances) => {
      if (!instances || instances.length === 0) return false
      const result = instances.every(course => isPairCourse(course))
      console.log('[CourseSelector] areAllSlotsPairOnly check:', {
        courseName: instances[0]?.name || 'Unknown',
        totalSlots: instances.length,
        pairSlots: instances.filter(course => isPairCourse(course)).length,
        nonPairSlots: instances.filter(course => !isPairCourse(course)).length,
        allArePair: result,
        sampleSlots: instances.slice(0, 3).map(course => ({
          id: course.id,
          day: course.day,
          time: course.startTime ? `${course.startTime.getHours()}:${course.startTime.getMinutes().toString().padStart(2, '0')}` : 'N/A',
          pairOnly: course.pairOnly,
          isPairOnly: course.isPairOnly,
          isPair: isPairCourse(course)
        }))
      })
      return result
    }

    // Check if course group has mixed pair and non-pair slots
    const hasMixedPairSlots = (instances) => {
      if (!instances || instances.length === 0) return false
      const hasPairSlots = instances.some(course => isPairCourse(course))
      const hasNonPairSlots = instances.some(course => !isPairCourse(course))
      const result = hasPairSlots && hasNonPairSlots
      
      console.log('[CourseSelector] hasMixedPairSlots check:', {
        courseName: instances[0]?.name || 'Unknown',
        totalSlots: instances.length,
        pairSlots: instances.filter(course => isPairCourse(course)).length,
        nonPairSlots: instances.filter(course => !isPairCourse(course)).length,
        hasPairSlots,
        hasNonPairSlots,
        hasMixed: result,
        detailedSlots: instances.map(course => ({
          id: course.id,
          day: course.day,
          time: course.startTime ? `${course.startTime.getHours()}:${course.startTime.getMinutes().toString().padStart(2, '0')}` : 'N/A',
          pairOnly: course.pairOnly,
          isPairOnly: course.isPairOnly,
          type: course.type,
          courseType: course.courseType,
          isPair: isPairCourse(course)
        }))
      })
      return result
    }

    // Check if course group has any pair courses
    const hasAnyPairCourse = (instances) => {
      // Check multiple possible property names for pair courses
      const hasPair = instances.some(course => 
        course.pairOnly || 
        course.isPairOnly || 
        course.pair_only ||
        course.requiresPartner ||
        course.type === 'pair' ||
        course.courseType === 'pair' ||
        (course.name && course.name.toLowerCase().includes('pair')) ||
        (course.description && course.description.toLowerCase().includes('pair'))
      )
      console.log('[CourseSelector] Checking pair courses for instances:', {
        courseName: instances[0]?.name || 'Unknown',
        instances: instances.length,
        sampleCourse: instances[0] ? {
          pairOnly: instances[0].pairOnly,
          isPairOnly: instances[0].isPairOnly,
          pair_only: instances[0].pair_only,
          requiresPartner: instances[0].requiresPartner,
          type: instances[0].type,
          courseType: instances[0].courseType,
          allProperties: Object.keys(instances[0])
        } : null,
        pairCourses: instances.filter(c => 
          c.pairOnly || 
          c.isPairOnly || 
          c.pair_only ||
          c.requiresPartner ||
          c.type === 'pair' ||
          c.courseType === 'pair'
        ).length,
        hasPair
      })
      return hasPair
    }

    return {
      t,
      selectedCourseNames,
      searchQuery,
      filteredCourseGroups,
      isCourseNameSelected,
      toggleCourseName,
      formatTimeSlot,
      getTimeSlotClasses,
      getVisibleTimeSlots,
      getFilteredInstanceCount,
      updateSelection,
      selectAll,
      clearAll,
      hasAnyPairCourse,
      isPairCourse,
      areAllSlotsPairOnly,
      hasMixedPairSlots
    }
  }
}
</script>

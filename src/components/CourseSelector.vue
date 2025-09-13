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
        placeholder="Search courses..."
        class="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
      />
    </div>

    <!-- Course List -->
    <div class="max-h-64 overflow-y-auto border border-gray-200 rounded-lg">
      <div v-if="filteredCourseGroups.length === 0" class="text-sm text-gray-500 text-center py-8">
        No courses found{{ searchQuery ? ' matching "' + searchQuery + '"' : '' }}
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
                {{ courseName }}
              </button>
            </div>
          </div>
          
          <!-- Show available time slots for reference -->
          <div class="mt-2 flex flex-wrap gap-1">
            <span
              v-for="course in instances.slice(0, 6)"
              :key="course.id"
              :class="getTimeSlotClasses(course)"
            >
              {{ formatTimeSlot(course) }}
            </span>
            <span v-if="instances.length > 6" class="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-full">
              +{{ instances.length - 6 }} more
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- Selected Count -->
    <div class="mt-2 text-xs text-gray-500">
      {{ selectedCourseNames.length }} {{ selectedCourseNames.length === 1 ? t('course') : t('courses') }} {{ t('selected') }}
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

export default {
  name: 'CourseSelector',
  props: {
    modelValue: {
      type: Array,
      default: () => []
    },
    courseGroups: {
      type: Map,
      default: () => new Map()
    }
  },
  emits: ['update:modelValue'],
  setup(props, { emit }) {
    const { t, translateDayCode, getDayColors } = useI18n()
    
    const selectedCourseNames = ref([...props.modelValue])
    const searchQuery = ref('')

    const normalizeForSorting = (courseName) => {
      // Remove common suffixes/prefixes that shouldn't affect sorting
      return courseName
        .toLowerCase()
        .replace(/\b\w*stufe\b/g, '') // Remove any word ending with "stufe"
        .replace(/\bclub\b/gi, '') // Remove "club" (case insensitive)
        .replace(/\s+/g, ' ') // Normalize whitespace
        .trim()
    }

    const filteredCourseGroups = computed(() => {
      let groups = Array.from(props.courseGroups.entries())
      
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
      return groups.map(([courseName, instances]) => [
        courseName,
        [...instances].sort((a, b) => a.startTime - b.startTime)
      ])
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

    const updateSelection = () => {
      emit('update:modelValue', [...selectedCourseNames.value])
    }

    const selectAll = () => {
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

    return {
      t,
      selectedCourseNames,
      searchQuery,
      filteredCourseGroups,
      isCourseNameSelected,
      toggleCourseName,
      formatTimeSlot,
      getTimeSlotClasses,
      updateSelection,
      selectAll,
      clearAll
    }
  }
}
</script>

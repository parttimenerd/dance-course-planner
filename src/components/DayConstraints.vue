<template>
  <div class="mb-6">
    <h3 class="text-sm font-medium text-gray-700 mb-3">📅 {{ t('Day Constraints') }}</h3>

    <!-- Day Settings -->
    <div class="space-y-4">
      <div>
        <label class="block text-xs text-gray-600 mb-1">
          {{ t('Maximum courses per day') }}
        </label>
        <div class="flex gap-1">
          <button
            v-for="count in [1, 2, 3, 4]"
            :key="count"
            @click="updateMaxCoursesPerDay(count)"
            :class="[
              'px-3 py-1 text-xs rounded border transition-colors',
              localConstraints.maxCoursesPerDay === count
                ? 'bg-green-100 text-green-800 border-green-300'
                : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
            ]"
          >
            {{ count }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, watch } from 'vue'
import { useI18n } from '../composables/useI18n.js'

export default {
  name: 'DayConstraints',
  props: {
    modelValue: {
      type: Object,
      required: true
    }
  },
  emits: ['update:modelValue'],
  setup(props, { emit }) {
    const { t, dayNames } = useI18n()
    
    const weekDays = dayNames

    const localConstraints = ref({
      blockedDays: [...(props.modelValue.blockedDays || [])],
      maxCoursesPerDay: props.modelValue.maxCoursesPerDay || 3,
      disablePairCourses: props.modelValue.disablePairCourses || false
    })

    const updateConstraints = () => {
      emit('update:modelValue', {
        ...props.modelValue,
        ...localConstraints.value,
        // Always enforce these constraints
        noDuplicateCoursesPerDay: true,
        preventOverlaps: true
      })
    }

    const updateMaxCoursesPerDay = (count) => {
      localConstraints.value.maxCoursesPerDay = count
      updateConstraints()
    }

    // Watch for external changes
    watch(() => props.modelValue, (newValue) => {
      localConstraints.value = {
        blockedDays: [...(newValue.blockedDays || [])],
        maxCoursesPerDay: newValue.maxCoursesPerDay || 3,
        disablePairCourses: newValue.disablePairCourses || false
      }
    }, { deep: true })

    return {
      t,
      localConstraints,
      updateConstraints,
      updateMaxCoursesPerDay
    }
  }
}
</script>

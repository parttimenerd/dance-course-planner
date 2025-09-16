<template>
  <div class="flex items-center space-x-2">
    <label for="week-select" class="text-sm font-medium text-gray-700">
      {{ t('Select Week') }}:
    </label>
    <select
      id="week-select"
      :key="`week-selector-${availableWeeks.length}-${selectedWeek?.value}`"
      :value="selectValue"
      @change="handleWeekChange"
      class="text-sm border border-gray-300 rounded-md px-3 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
    >
      <option
        v-for="week in availableWeeks"
        :key="week.value"
        :value="week.value"
      >
        {{ getWeekLabel(week) }}
      </option>
    </select>
  </div>
</template>

<script>
import { watch, computed } from 'vue'
import { useI18n } from '../composables/useI18n.js'

export default {
  name: 'WeekSelector',
  props: {
    selectedWeek: {
      type: Object,
      default: null
    },
    availableWeeks: {
      type: Array,
      default: () => []
    }
  },
  emits: ['week-changed'],
  setup(props, { emit }) {
    const { t, formatDate } = useI18n()
    
    // Computed property for the select value to ensure proper reactivity
    const selectValue = computed(() => {
      const value = props.selectedWeek?.value
      console.log('[WeekSelector] Computed select value:', value, 'from selectedWeek:', props.selectedWeek)
      return value
    })
    
    // Debug props changes
    watch(() => props.selectedWeek, (newWeek, oldWeek) => {
      console.log('[WeekSelector] selectedWeek prop changed from:', oldWeek, 'to:', newWeek)
    }, { immediate: true })
    
    watch(() => props.availableWeeks, (newWeeks) => {
      console.log('[WeekSelector] availableWeeks prop changed:', newWeeks.map(w => ({ value: w.value, label: w.label })))
    }, { immediate: true })
    
    const handleWeekChange = (event) => {
      const weekValue = parseInt(event.target.value)
      console.log('[WeekSelector] Week change event fired. Value:', weekValue)
      console.log('[WeekSelector] Current selectedWeek:', props.selectedWeek)
      console.log('[WeekSelector] Available weeks:', props.availableWeeks.map(w => ({ value: w.value, label: w.label })))
      
      // Check if this is actually a change
      if (props.selectedWeek && props.selectedWeek.value === weekValue) {
        console.log('[WeekSelector] No actual change detected, ignoring')
        return
      }
      
      console.log('[WeekSelector] Emitting week-changed with value:', weekValue)
      emit('week-changed', weekValue)
    }
    
    const getWeekLabel = (week) => {
      // Handle weeks with translation keys and dates
      if (week.translationKey === 'Week of' && week.date) {
        // For "Week of" labels, format the date properly for the current locale
        const date = new Date(week.date)
        return `${t('Week of')} ${formatDate(date)}`
      }
      // For simple labels (Current Week, Next Week), just translate them
      return t(week.translationKey || week.label)
    }
    
    return {
      t,
      selectValue,
      handleWeekChange,
      getWeekLabel
    }
  }
}
</script>

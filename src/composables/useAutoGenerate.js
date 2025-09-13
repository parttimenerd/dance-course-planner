import { ref, watch } from 'vue'

export function useAutoGenerate() {
  const autoGenerate = ref(false)
  const lastGenerationTime = ref(0)
  const DEBOUNCE_DELAY = 300 // ms

  // Debounced generation function
  const scheduleGeneration = (generateFn, constraints) => {
    if (!autoGenerate.value || !constraints?.selectedCourseIds?.length) {
      return
    }

    const now = Date.now()
    
    // Clear previous timeout if exists
    if (scheduleGeneration.timeoutId) {
      clearTimeout(scheduleGeneration.timeoutId)
    }

    // Schedule generation with debounce
    scheduleGeneration.timeoutId = setTimeout(() => {
      if (autoGenerate.value && constraints?.selectedCourseIds?.length > 0) {
        lastGenerationTime.value = now
        generateFn()
      }
    }, DEBOUNCE_DELAY)
  }

  const createAutoWatcher = (constraintGetter, generateFn) => {
    return watch(
      constraintGetter,
      (newConstraints, oldConstraints) => {
        if (oldConstraints && JSON.stringify(newConstraints) !== JSON.stringify(oldConstraints)) {
          scheduleGeneration(generateFn, newConstraints)
        }
      },
      { deep: true }
    )
  }

  // Cleanup function
  const cleanup = () => {
    if (scheduleGeneration.timeoutId) {
      clearTimeout(scheduleGeneration.timeoutId)
      scheduleGeneration.timeoutId = null
    }
  }

  return {
    autoGenerate,
    lastGenerationTime,
    scheduleGeneration,
    createAutoWatcher,
    cleanup
  }
}

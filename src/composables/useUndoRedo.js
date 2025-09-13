import { ref } from 'vue'

export function useUndoRedo(initialState, maxHistorySize = 50) {
  // Set a proper default state at the beginning
  const defaultState = {
    selectedLocation: 'Karlsruhe',
    selectedCourseIds: [],
    earliestTimeStr: '',
    latestTimeStr: '',
    allowedDays: ['MO', 'DI', 'MI', 'DO', 'FR', 'SA', 'SO'],
    blockedDays: [],
    maxCoursesPerDay: 3,
    maxTimeBetweenCourses: 4,
    noDuplicateCoursesPerDay: true,
    preventOverlaps: true,
    highlightSchedule: null
  }
  
  // Use initialState if provided, otherwise use defaultState
  const startState = initialState || defaultState
  const history = ref([startState])
  const currentIndex = ref(0)
  const isUndoing = ref(false)
  const isRedoing = ref(false)

  const canUndo = ref(false)
  const canRedo = ref(false)

  const updateFlags = () => {
    canUndo.value = currentIndex.value > 0
    canRedo.value = currentIndex.value < history.value.length - 1
  }

  const saveState = (state) => {
    if (isUndoing.value || isRedoing.value || !state) {
      return
    }

    // Remove any future states if we're in the middle of history
    if (currentIndex.value < history.value.length - 1) {
      history.value = history.value.slice(0, currentIndex.value + 1)
    }

    // Simple object assignment
    history.value.push(state)
    currentIndex.value = history.value.length - 1

    // Limit history size
    if (history.value.length > maxHistorySize) {
      history.value.shift()
      currentIndex.value = Math.max(0, currentIndex.value - 1)
    }

    updateFlags()
  }

  const undo = () => {
    if (canUndo.value) {
      isUndoing.value = true
      currentIndex.value--
      updateFlags()
      
      const previousState = history.value[currentIndex.value]
      
      setTimeout(() => {
        isUndoing.value = false
      }, 0)
      
      return previousState
    }
    return null
  }

  const redo = () => {
    if (canRedo.value) {
      isRedoing.value = true
      currentIndex.value++
      updateFlags()
      
      const nextState = history.value[currentIndex.value]
      
      setTimeout(() => {
        isRedoing.value = false
      }, 0)
      
      return nextState
    }
    return null
  }

  const reset = (newState) => {
    history.value = [newState || defaultState]
    currentIndex.value = 0
    updateFlags()
  }

  const getHistoryInfo = () => {
    return {
      total: history.value.length,
      current: currentIndex.value + 1,
      canUndo: canUndo.value,
      canRedo: canRedo.value
    }
  }

  // Initialize flags
  updateFlags()

  return {
    canUndo,
    canRedo,
    saveState,
    undo,
    redo,
    reset,
    getHistoryInfo
  }
}

<template>
  <div v-if="availableLocations.length > 1" class="mb-6">
    <label class="block text-sm font-medium text-gray-700 mb-2">
      Location
    </label>
    <select
      v-model="selectedLocation"
      @change="$emit('location-changed', selectedLocation)"
      class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
    >
      <option value="" disabled>Select a location...</option>
      <option
        v-for="location in availableLocations"
        :key="location"
        :value="location"
      >
        {{ location }}
      </option>
    </select>
  </div>
</template>

<script>
import { ref, computed, watch } from 'vue'

export default {
  name: 'LocationSelector',
  props: {
    scheduleData: {
      type: Object,
      default: null
    },
    modelValue: {
      type: String,
      default: 'Karlsruhe'
    }
  },
  emits: ['location-changed', 'update:modelValue'],
  setup(props, { emit }) {
    const selectedLocation = ref(props.modelValue)

    // Extract available locations from schedule data
    const availableLocations = computed(() => {
      if (!props.scheduleData?.content?.days) return []
      
      const locations = new Set()
      
      for (const day of props.scheduleData.content.days) {
        for (const event of day.events || []) {
          if (event.location) {
            locations.add(event.location)
          }
        }
      }
      
      // Sort with Karlsruhe first if available
      const locationArray = Array.from(locations).sort()
      const karlsruheIndex = locationArray.indexOf('Karlsruhe')
      if (karlsruheIndex > 0) {
        locationArray.splice(karlsruheIndex, 1)
        locationArray.unshift('Karlsruhe')
      }
      
      return locationArray
    })

    // Auto-select location if there's only one, or Karlsruhe if available and no location is selected
    watch(availableLocations, (newLocations) => {
      if (newLocations.length === 1 && !selectedLocation.value) {
        // Auto-select the only available location
        selectedLocation.value = newLocations[0]
        emit('location-changed', newLocations[0])
        emit('update:modelValue', newLocations[0])
      } else if (!selectedLocation.value && newLocations.includes('Karlsruhe')) {
        // Auto-select Karlsruhe if available and no location is selected
        selectedLocation.value = 'Karlsruhe'
        emit('location-changed', 'Karlsruhe')
        emit('update:modelValue', 'Karlsruhe')
      }
    }, { immediate: true })

    watch(selectedLocation, (newValue) => {
      emit('update:modelValue', newValue)
    })

    return {
      selectedLocation,
      availableLocations
    }
  }
}
</script>

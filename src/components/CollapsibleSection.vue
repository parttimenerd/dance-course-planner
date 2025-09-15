<template>
  <div>
    <div class="flex items-center justify-between" :class="headerClasses">
      <slot name="header"></slot>
      <button
        v-if="collapsible"
        @click="toggleExpanded"
        class="p-1 text-gray-500 hover:text-gray-700 transition-colors"
        :title="expanded ? hideTitle : showTitle"
      >
        <svg 
          class="w-4 h-4 transform transition-transform duration-200" 
          :class="{ 'rotate-180': expanded }"
          fill="none" 
          stroke="currentColor" 
          stroke-width="2" 
          viewBox="0 0 24 24"
        >
          <!-- Down arrow (chevron down) -->
          <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7"></path>
        </svg>
      </button>
    </div>
    
    <div 
      v-if="expanded || !collapsible" 
      class="transition-all duration-200 ease-in-out"
      :class="contentClasses"
    >
      <slot name="content"></slot>
    </div>
  </div>
</template>

<script>
import { ref, watch } from 'vue'

export default {
  name: 'CollapsibleSection',
  props: {
    collapsible: {
      type: Boolean,
      default: true
    },
    initialExpanded: {
      type: Boolean,
      default: false
    },
    showTitle: {
      type: String,
      default: 'Show more'
    },
    hideTitle: {
      type: String,
      default: 'Hide'
    },
    headerClasses: {
      type: String,
      default: 'mb-3'
    },
    contentClasses: {
      type: String,
      default: ''
    }
  },
  emits: ['toggle'],
  setup(props, { emit }) {
    const expanded = ref(props.initialExpanded)
    
    const toggleExpanded = () => {
      if (!props.collapsible) return
      expanded.value = !expanded.value
      emit('toggle', expanded.value)
    }
    
    // Watch for prop changes
    watch(() => props.initialExpanded, (newValue) => {
      expanded.value = newValue
    })
    
    return {
      expanded,
      toggleExpanded
    }
  }
}
</script>

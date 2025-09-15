<template>
  <span 
    v-if="show" 
    class="inline-flex items-center ml-1"
    :class="customClass"
    :title="title || t('Pair Course')"
    style="white-space: nowrap;"
  >
    💃🕺
  </span>
</template>

<script>
import { useI18n } from '../composables/useI18n.js'

export default {
  name: 'PairIcon',
  props: {
    show: {
      type: Boolean,
      default: false
    },
    title: {
      type: String,
      default: null
    },
    customClass: {
      type: String,
      default: ''
    }
  },
  setup() {
    const { t } = useI18n()
    
    return {
      t
    }
  }
}
</script>

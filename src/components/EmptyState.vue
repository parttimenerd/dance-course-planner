<template>
  <div class="bg-white rounded-lg shadow-sm border p-8 text-center">
    <div class="text-6xl mb-4">💃</div>
    <h3 class="text-lg font-medium text-gray-900 mb-2">{{ title }}</h3>
    <p class="text-gray-600">{{ message }}</p>
    <slot></slot>
  </div>
</template>

<script>
export default {
  name: 'EmptyState',
  props: {
    title: {
      type: String,
      default: 'Ready to Plan Your Dance Schedule?'
    },
    message: {
      type: String,
      default: 'Select your preferred courses and set your constraints to find the perfect combination!'
    }
  }
}
</script>

<script setup>
const PROJECT_PATH_REGEX =
  /^[a-zA-Z0-9][a-zA-Z0-9._-]*[a-zA-Z0-9]$/

defineProps({
  modelValue: {
    type: String,
    required: true,
  }
})

const emits = defineEmits([
  'patternIsValid',
  'update:modelValue',
])

function patternChanged(event) {
  const pattern = event.target.value

  const patternIsValid = pattern.includes(':m:') &&
  PROJECT_PATH_REGEX.test(
    pattern.replaceAll(':m:', '12345'),
  )

  emits("patternIsValid", patternIsValid)
  emits('update:modelValue', pattern)
}
</script>

<template>
  <input
  id="repository-pattern"
  :value="modelValue"
  type="text"
  placeholder="projet-:m:"
  @input="patternChanged"
  />
</template>

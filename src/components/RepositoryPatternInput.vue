<script setup>
import { computed, watch } from 'vue'

const PROJECT_PATH_REGEX =
  /^[a-zA-Z0-9][a-zA-Z0-9._-]*[a-zA-Z0-9]$/

const model = defineModel({
  type: String,
  default: '',
})

const emit = defineEmits([
  'validityChanged',
])

function isValid(pattern) {
  return (
    pattern.includes(':m:') &&
    PROJECT_PATH_REGEX.test(
      pattern.replaceAll(':m:', '12345'),
    )
  )
}

const patternIsValid = computed(() => isValid(model.value))

watch(
  patternIsValid,
  (isValid) => {
    emit("validityChanged", isValid)
  },
  {immediate: true}
)
</script>

<template>
  <div>
    <label for="repository-pattern">Pattern</label>

    <input
    id="repository-pattern"
    v-model="model"
    type="text"
    placeholder="projet-:m:"
    />

    <div
      v-if="!patternIsValid"
    >
      <p>⚠️ Le nom doit :</p>
      <ul>
        <li>contenir <code>:m:</code>,</li>
        <li>commencer et terminer par une lettre ou un chiffre,</li>
        <li>et ne peut contenir que des lettres, chiffres, points, tirets et underscores.</li>
      </ul>
  </div>
  </div>
</template>

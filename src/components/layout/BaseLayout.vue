<script setup>
</script>

<template>
  <nav>
    <ul>
      <li><RouterLink :to="{ name: 'home'}"> Home </RouterLink></li>
      <li><RouterLink :to="{ name: 'create'}"> Création </RouterLink></li>
      <li><RouterLink :to="{ name: 'projects-watcher'}"> Suivi de projet </RouterLink></li>
    </ul>
  </nav>
  <main>
    <slot></slot>
  </main>
</template>

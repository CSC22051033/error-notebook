<script setup>
  import AppHeader from './components/AppHeader.vue'
</script>

<template>
  <AppHeader />
  <main class="main-content">
    <router-view />
  </main>
</template>

<style scoped>
  .main-content{
    background-color: rgba(128, 128, 128, 0.056);
  }
</style>

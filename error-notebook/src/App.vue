<script setup>
import SideBar from './components/SideBar.vue';
import TopBar from './components/TopBar.vue';
</script>

<template>
  <TopBar />
  <main class="main-content">
    <SideBar />
    <router-view />
  </main>
</template>

<style scoped>
  .main-content{
    background-color: rgba(128, 128, 128, 0.056);
    display: flex;
    height: 90dvh;
  }
</style>

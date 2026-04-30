<script setup>
import { useRoute } from 'vue-router'
const route = useRoute()
</script>

<template>
  <header>
    <router-link :to="{ path: '/list', query: route.query }">< 返回</router-link>
  </header>
</template>

<style scoped>
  header{
    background-color: #fff;
    border-bottom: 4px solid #e8e8e8;
    display: flex;
    align-items: center;
    justify-content: space-between;
    height: 30px;
  }
</style>
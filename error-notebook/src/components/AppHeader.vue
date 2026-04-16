<script setup></script>

<template>
  <header>
    <h1>错题薄</h1>
    <nav class="headerNav">
      <a href="/">首页</a>
      <a href="/list">错题列表</a>
      <a href="/import">错题导入</a>
      <a href="/practice">错题练习</a>
    </nav>
  </header>
</template>

<style scoped>
  header{
    background-color: #fff;
    border-bottom: 4px solid #e8e8e8;
    display: flex;
    align-items: center;
    justify-content: space-between;
    height: 60px;
  }
  .headerNav a{
    margin-right: 40px;
    font-size: 20px;
  }
</style>
<script setup></script>

<template>
  <header>
    <h1>错题薄</h1>
    <nav class="headerNav">
      <a href="/">首页</a>
      
      <!-- 下拉菜单结构：使用 div 容器 + a 触发按钮 + 下拉选项列表 -->
      <div class="dropdown">
        <a href="/list" class="dropbtn">题库</a>
        <div class="dropdown-content">
          <a href="/list">题库</a>
          <a href="/past-list">真题</a>
          <a href="/know-list">知识点</a>
        </div>
      </div>
      
      <a href="/import">导入</a>
      <a href="/practice">练习</a>
    </nav>
  </header>
</template>

<style scoped>
  header {
    background-color: #fff;
    border-bottom: 4px solid #e8e8e8;
    display: flex;
    align-items: center;
    justify-content: space-between;
    height: 60px;
    padding: 0 20px;
  }

  .headerNav {
    display: flex;
    align-items: center;
  }

  /* 基础导航链接样式 */
  .headerNav > a,
  .dropdown .dropbtn {
    width: 80px;
    height: 60px;
    font-size: 20px;
    text-decoration: none;
    color: #333;
    transition: color 0.2s;
    display: inline-flex;   
    align-items: center;
  }

  .headerNav > a:hover,
  .dropdown .dropbtn:hover {
    color: #409eff;
  }

  /* 下拉按钮的三角形指示符 */
  .dropbtn::after {
    content: "";
    display: inline-block;
    width: 0;
    height: 0;
    margin-left: 10px;
    border-left: 6px solid transparent;
    border-right: 6px solid transparent;
    border-top: 6px solid #333;
    transition: border-color 0.2s, transform 0.2s;
  }
  .dropbtn:hover::after {
    border-top-color: #409eff;
  }
  /* 悬浮时显示下拉菜单，同时将三角形改为向上的扁三角 */
  .dropdown:hover .dropbtn::after {
    border-top: none;
    border-bottom: 6px solid #333;
  }
  /* 保持悬浮时三角形变色效果依然有效 */
  .dropdown:hover .dropbtn:hover::after {
    border-bottom-color: #409eff;
  }

  /* 下拉菜单容器 */
  .dropdown {
    width: 80px;
    position: relative;
    display: inline-block;
    margin-right: 30px;
  }

  /* 下拉内容 (默认隐藏) */
  .dropdown-content {
    display: none;
    position: absolute;
    top: 100%;
    left: 0;
    background-color: #fff;
    min-width: 80px;
    box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
    z-index: 1000;
    overflow: hidden;
  }

  /* 下拉菜单中的链接样式 */
  .dropdown-content a {
    height: 20px;
    color: #333;
    padding: 6px 16px;
    text-decoration: none;
    display: flex;
    align-items: center;      
    font-size: 16px;
    transition: background 0.2s;
    margin-right: 0;
    white-space: nowrap;
  }

  .dropdown-content a:hover {
    background-color: #f5f7fa;
    color: #409eff;
  }

  /* 悬浮时显示下拉菜单 */
  .dropdown:hover .dropdown-content {
    display: block;
  }
</style>
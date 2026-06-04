<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMenu, ElSubMenu, ElMenuItem } from 'element-plus'

const router = useRouter()
const activeIndex = ref('/')  // 默认高亮首页

// 菜单分组配置（完全对应原导航栏结构）
const menuGroups = ref([
    {
        title: '题库',
        children: [
            { label: '题库', path: '/list' },
            { label: '真题', path: '/past-list' },
            { label: '知识点', path: '/know-list' }
        ]
    },
    {
        title: '编辑',
        children: [
            { label: '导入', path: '/import' },
            { label: '标签', path: '/label' }
        ]
    }
])

// 菜单点击处理：路由跳转 + 更新高亮
const handleSelect = (path) => {
    activeIndex.value = path
    router.push(path)
}
</script>

<template>
    <div class="sideContainer">
        <el-menu :default-active="activeIndex" class="mistake-menu" text-color="#2c3e50" active-text-color="#409eff"
            background-color="#f0f7ff" @select="handleSelect" router
            >
            <!-- 首页独立菜单项 -->
            <el-menu-item index="/">
                <span>首页</span>
            </el-menu-item>

            <!-- 动态生成分组子菜单 -->
            <el-sub-menu v-for="group in menuGroups" :key="group.title" :index="group.title">
                <template #title>
                    <span>{{ group.title }}</span>
                </template>
                <el-menu-item v-for="item in group.children" :key="item.path" :index="item.path">
                    {{ item.label }}
                </el-menu-item>
            </el-sub-menu>

            <!-- 练习独立菜单项 -->
            <el-menu-item index="/practice">
                <span>练习</span>
            </el-menu-item>
        </el-menu>
    </div>
</template>

<style scoped>
.sideContainer {
    min-height: 90dvh;
    width: 15dvw;
    border-right: 1px solid #d9e8f5;
    max-height: 90dvh;
    overflow-y: auto;
    background-color: #f0f7ff;
}

:deep(.mistake-menu) {
    border-right: none;
    background-color: #f0f7ff;
    padding: 0;
}

:deep(.mistake-menu .el-sub-menu__title) {
    color: #2c3e50;
    background-color: #f0f7ff;
    height: 44px;
    line-height: 44px;
    padding: 0 20px;
    font-weight: 500;
    transition: all 0.2s ease;
}

:deep(.mistake-menu .el-sub-menu__title:hover) {
    background-color: #e4f0fe;
    color: #1e5a8a;
}

:deep(.mistake-menu .el-menu-item) {
    color: #2c3e50;
    background-color: #f0f7ff;
    height: 44px;
    line-height: 44px;
    padding: 0 20px;
    transition: all 0.2s ease;
    font-weight: 500;
}

:deep(.mistake-menu .el-menu-item:hover) {
    background-color: #e4f0fe;
    color: #1e5a8a;
}

:deep(.mistake-menu .el-menu-item.is-active) {
    background: linear-gradient(135deg, #d4ebff, #b8dcff);
    color: #0a4b78;
    font-weight: 600;
    border-left: 3px solid #409eff;
}

:deep(.mistake-menu .el-menu--inline) {
    background-color: #f9fcff;
}

:deep(.mistake-menu .el-menu--inline .el-menu-item) {
    background-color: #f9fcff;
    height: 38px;
    line-height: 38px;
    padding-left: 48px;
    font-weight: 400;
    transition: all 0.2s;
}

:deep(.mistake-menu .el-menu--inline .el-menu-item:hover) {
    background-color: #eef4fc;
    color: #1e5a8a;
}

:deep(.mistake-menu .el-menu--inline .el-menu-item.is-active) {
    background: #d0e6ff;
    color: #0a4b78;
    font-weight: 500;
    border-left: 2px solid #409eff;
}

:deep(.mistake-menu .el-sub-menu__icon-arrow) {
    font-size: 14px;
    color: #5f7f9e;
    transition: transform 0.2s;
}

:deep(.mistake-menu .el-sub-menu__title:hover .el-sub-menu__icon-arrow) {
    color: #2c6e9e;
}

.sideContainer::-webkit-scrollbar {
    width: 5px;
}

.sideContainer::-webkit-scrollbar-track {
    background: #e2edf7;
}

.sideContainer::-webkit-scrollbar-thumb {
    background: #b0cce5;
}

.sideContainer::-webkit-scrollbar-thumb:hover {
    background: #7fa3c4;
}
</style>
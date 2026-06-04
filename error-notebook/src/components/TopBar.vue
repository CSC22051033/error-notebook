<script setup>
import { ref, computed} from 'vue'
import { User, ArrowDown } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'

// 暂时占位，后续修改
const isLoggedIn = ref(true);
const userName = ref('Admin');

const handleCommand = (command) => {
    if (command === 'userInfo') {
        ElMessage.info(`当前用户：${userName.value}`)
    } else if (command === 'logout') {
        ElMessageBox.confirm('确定要退出登录吗？', '提示', {
            confirmButtonText: '确定',
            cancelButtonText: '取消',
            type: 'warning'
        }).then(() => {
            userStore.logout()
            ElMessage.success('已退出登录')
        }).catch(() => {})
    }
}
</script>

<template>
    <div class="topContainer">
        <a href="/" class="logo">错题簿</a>
        <el-button v-if="!isLoggedIn" class="login-btn">登录</el-button>
        <el-dropdown v-else @command="handleCommand">
            <span class="user-dropdown-link">
                <el-icon :size="20"><User /></el-icon>
                <span class="user-name">{{ userName }}</span>
                <el-icon class="el-icon--right"><arrow-down /></el-icon>
            </span>
            <template #dropdown>
                <el-dropdown-menu>
                    <el-dropdown-item command="userInfo">用户信息</el-dropdown-item>
                    <el-dropdown-item command="logout" divided>退出登录</el-dropdown-item>
                </el-dropdown-menu>
            </template>
        </el-dropdown>
    </div>
</template>

<style scoped>
.topContainer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    height: 5dvh;
    border: 1px solid #e9edf4;
    padding: 0 20px;
}
.logo {
    font-size: 18px;
    font-weight: bold;
    color: #409eff;
    text-decoration: none;
}
.login-btn {
    margin-right: 10px;
}
.user-dropdown-link {
    cursor: pointer;
    color: var(--el-color-primary);
    display: flex;
    align-items: center;
    gap: 5px;
}
.user-dropdown-link:hover,
.user-dropdown-link:focus,
.user-dropdown-link:focus-visible {
    outline: none;
    border: none;
}
.user-name {
    margin-left: 0;
    font-size: 15px;
    color: #374151;
    font-weight: 500;
}
.el-icon--right {
    margin-left: 5px;
}
.dialog-footer {
    display: flex;
    flex-direction: column;
    gap: 15px;
}
.switch-mode {
    text-align: center;
}
.link-text {
    color: #409eff;
    cursor: pointer;
    font-size: 14px;
}
.link-text:hover {
    text-decoration: underline;
}
.buttons {
    display: flex;
    justify-content: flex-end;
    gap: 10px;
}
</style>
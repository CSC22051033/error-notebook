<script setup>
import { ref, onMounted } from 'vue'

// 定义响应式数据
const loading = ref(false)
const error = ref('')
const pdfs = ref([])

// 获取知识点PDF列表
async function fetchPdfs() {
    loading.value = true
    error.value = ''

    try {
        const res = await fetch('http://localhost:3000/api/know-pdfs')
        const result = await res.json()

        if (result.pdfs) {
            pdfs.value = result.pdfs
        } else {
            error.value = result.error || '获取失败'
        }
    } catch (err) {
        error.value = '网络错误：' + err.message
    } finally {
        loading.value = false
    }
}

onMounted(() => {
    fetchPdfs()
})
</script>

<template>
    <div class="container">
        <h2>知识点列表</h2>

        <div v-if="loading" class="loading">加载中...</div>
        <div v-if="error" class="error">{{ error }}</div>

        <table v-if="!loading && pdfs.length > 0">
            <thead>
                <tr>
                    <th>文件名</th>
                </tr>
            </thead>
            <tbody>
                <tr v-for="pdf in pdfs" :key="pdf">
                    <td><a :href="`http://localhost:3000/know-pdfs/${pdf}`" target="_blank">{{ pdf }}</a></td>
                </tr>
            </tbody>
        </table>

        <div v-if="!loading && pdfs.length === 0" class="empty">
            暂无PDF文件
        </div>

    </div>
</template>

<style scoped>
.container {
    max-width: 1000px;
    min-height: 600px;
    margin: 0 auto;
    padding: 20px;
    background-color: #fff;
}

h2 {
    text-align: center;
    margin-bottom: 20px;
}

table {
    width: 100%;
    border-collapse: collapse;
    margin-top: 20px;
}

th, td {
    border: 1px solid #ddd;
    padding: 12px;
    text-align: left;
}

th {
    background-color: #f5f5f5;
    font-weight: bold;
}

tr:hover {
    background-color: #f9f9f9;
}

.loading, .error, .empty {
    text-align: center;
    padding: 40px;
    color: #666;
}

.error {
    color: #f56c6c;
}
</style>
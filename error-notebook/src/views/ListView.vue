<script setup>
import { ref, onMounted, computed } from 'vue'

// 定义响应式数据
const loading = ref(false)
const error = ref('')
const questions = ref([])
const currentPage = ref(1)
const pageSize = 10

// 计算分页数据
const totalPages = computed(() => Math.ceil(questions.value.length / pageSize))
const paginatedQuestions = computed(() => {
    const start = (currentPage.value - 1) * pageSize
    const end = start + pageSize
    return questions.value.slice(start, end)
})

// 获取题目列表
async function fetchQuestions() {
    loading.value = true
    error.value = ''
    
    try {
        const res = await fetch('http://localhost:3000/api/questions/list')
        const result = await res.json()
        
        if (result.success) {
            questions.value = result.data
            currentPage.value = 1 // 刷新时重置到第一页
        } else {
            error.value = result.error || '获取失败'
        }
    } catch (err) {
        error.value = '网络错误：' + err.message
    } finally {
        loading.value = false
    }
}

// 上一页
function prevPage() {
    if (currentPage.value > 1) {
        currentPage.value--
    }
}

// 下一页
function nextPage() {
    if (currentPage.value < totalPages.value) {
        currentPage.value++
    }
}

// 题目类型显示文本
function getTypeText(type) {
    const map = {
        'single': '单选题',
        'multiple': '多选题',
        'truefalse': '判断题',
        'shortanswer': '简答题'
    }
    return map[type] || type
}

onMounted(() => {
    fetchQuestions()
})
</script>

<template>
    <div class="container">
        <h2>题目列表</h2>
        
        <div v-if="loading" class="loading">加载中...</div>
        <div v-if="error" class="error">{{ error }}</div>
        
        <table v-if="!loading && questions.length > 0">
            <thead>
                <tr>
                    <th>序号</th>
                    <th>知识类型</th>
                    <th>题目类型</th>
                    <th>题干</th>
                </tr>
            </thead>
            <tbody>
                <tr v-for="q in paginatedQuestions" :key="q.id">
                    <td><a :href="`/questions/${q.id}`">{{ q.id }}</a></td>
                    <td>{{ q.knowledgeType }}</td>
                    <td>{{ getTypeText(q.questionType) }}</td>
                    <td class="stem">{{ q.questionStem }}</td>
                </tr>
            </tbody>
        </table>
        
        <div v-if="!loading && questions.length === 0" class="empty">
            暂无题目数据
        </div>
        
        <div class="pageDiv">
            <button @click="prevPage" :disabled="currentPage <= 1" class="page-btn">上一页</button>
            <span class="page-info">第 {{ currentPage }} / {{ totalPages }} 页</span>
            <button @click="nextPage" :disabled="currentPage >= totalPages" class="page-btn">下一页</button>
        </div>
        <!-- <button @click="fetchQuestions" class="refresh-btn">刷新</button> -->
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

td:first-child {
    width: 60px;
    text-align: center;
}

td:nth-child(2) {
    width: 120px;
}

td:nth-child(3) {
    width: 100px;
}

.stem {
    max-width: 600px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
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

.refresh-btn {
    display: block;
    margin: 20px auto;
    padding: 10px 30px;
    background: #4CAF50;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
}

.refresh-btn:hover {
    background: #45a049;
}

.pageDiv{
    display: flex;
    justify-content: space-between;
}

.page-btn {
    background: #2196F3;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
}

.page-btn:hover:not(:disabled) {
    background: #1976D2;
}

.page-btn:disabled {
    background: #ccc;
    cursor: not-allowed;
}

.page-info {
    margin: 0 10px;
    font-weight: bold;
}
</style>
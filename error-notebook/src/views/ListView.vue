<script setup>
import { ref, onMounted } from 'vue'

const questions = ref([])
const loading = ref(false)
const error = ref('')

// 获取题目列表
async function fetchQuestions() {
    loading.value = true
    error.value = ''
    
    try {
        const res = await fetch('http://localhost:3000/api/questions/list')
        const result = await res.json()
        
        if (result.success) {
            questions.value = result.data
        } else {
            error.value = result.error || '获取失败'
        }
    } catch (err) {
        error.value = '网络错误：' + err.message
    } finally {
        loading.value = false
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
                <tr v-for="q in questions" :key="q.id">
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
        
        <button @click="fetchQuestions" class="refresh-btn">刷新</button>
    </div>
</template>

<style scoped>
.container {
    max-width: 1200px;
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
</style>
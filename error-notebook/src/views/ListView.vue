<script setup>
import { ref, onMounted, computed } from 'vue'

// 定义响应式数据
const loading = ref(false)
const error = ref('')
const questions = ref([])
const currentPage = ref(1)
const pageSize = 10

// 解析ID的辅助函数
function parseId(id) {
    const match = id.match(/^(\D*)(\d*)$/)
    const strPart = match[1] || ''
    const numPart = match[2] ? parseInt(match[2], 10) : 0
    return { strPart, numPart }
}

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
            let data = result.data
            // 按ID排序：纯数字在前，字符串+数字按字符串再按数字排序
            data.sort((a, b) => {
                const aParsed = parseId(a.id)
                const bParsed = parseId(b.id)
                if (aParsed.strPart === '' && bParsed.strPart === '') {
                    return aParsed.numPart - bParsed.numPart
                } else if (aParsed.strPart === '') {
                    return -1
                } else if (bParsed.strPart === '') {
                    return 1
                } else {
                    if (aParsed.strPart !== bParsed.strPart) {
                        return aParsed.strPart.localeCompare(bParsed.strPart)
                    } else {
                        return aParsed.numPart - bParsed.numPart
                    }
                }
            })
            // 更新CSV文件
            const updateRes = await fetch('http://localhost:3000/api/questions/update-all', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            })
            const updateResult = await updateRes.json()
            if (!updateResult.success) {
                error.value = '更新CSV失败：' + updateResult.error
                return
            }
            // 设置排序后的数据
            questions.value = data
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
        <!--<button @click="fetchQuestions" class="refresh-btn">刷新</button>-->

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
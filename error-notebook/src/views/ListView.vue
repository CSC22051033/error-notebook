<script setup>
import { ref, onMounted, computed, watch } from 'vue'

// 定义响应式数据
const loading = ref(false)
const error = ref('')
const questions = ref([])
const labels = ref([])
const currentPage = ref(1)
const pageSize = 10
const searchText = ref('')
const selectedLabel = ref('不限')
const appliedSearchText = ref('')
const appliedSelectedLabel = ref('不限')
const labelOptions = ref(['不限'])
const searchSummary = ref('当前显示全部题目')

// 解析ID的辅助函数
function parseId(id) {
    const match = id.match(/^(\D*)(\d*)$/)
    const strPart = match[1] || ''
    const numPart = match[2] ? parseInt(match[2], 10) : 0
    return { strPart, numPart }
}

// 计算分页数据
const filteredQuestions = computed(() => {
    const keyword = appliedSearchText.value.trim()
    return questions.value.filter(q => {
        const matchesText = !keyword || q.id.includes(keyword) || q.knowledgeType.includes(keyword) || q.questionStem.includes(keyword) || q.questionType.includes(keyword) || q.questionContent.includes(keyword)
        const labelPrefixes = parseLabelPrefixes((labels.value.find(item => item.id === q.id)?.label) || '')
        const matchesLabel = appliedSelectedLabel.value === '不限' || labelPrefixes.includes(appliedSelectedLabel.value)
        return matchesText && matchesLabel
    })
})

const totalPages = computed(() => Math.ceil(filteredQuestions.value.length / pageSize))
const paginatedQuestions = computed(() => {
    const start = (currentPage.value - 1) * pageSize
    const end = start + pageSize
    return filteredQuestions.value.slice(start, end)
})

watch(totalPages, (value) => {
    if (currentPage.value > value && value > 0) {
        currentPage.value = value
    }
    if (value === 0) {
        currentPage.value = 1
    }
})

// 解析标签前两部分 a-b
function parseLabelPrefixes(label) {
    if (!label) return []
    const parts = label.split(/[;；]/).map(item => item.trim()).filter(Boolean)
    const prefixes = []
    for (const part of parts) {
        const segments = part.split('-').map(seg => seg.trim()).filter(Boolean)
        if (segments.length >= 2) {
            prefixes.push(`${segments[0]}-${segments[1]}`)
        } else if (segments.length === 1) {
            prefixes.push(segments[0])
        }
    }
    return prefixes
}

function buildLabelOptions(rawLabels) {
    const set = new Set()
    for (const item of rawLabels) {
        parseLabelPrefixes(item.label).forEach(prefix => set.add(prefix))
    }
    return ['不限', ...Array.from(set).sort()]
}

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

async function fetchLabelOptions() {
    try {
        const res = await fetch('http://localhost:3000/api/labels')
        const result = await res.json()
        if (result.success) {
            labels.value = result.data
            labelOptions.value = buildLabelOptions(result.data)
        } else {
            labelOptions.value = ['不限']
        }
    } catch (err) {
        labelOptions.value = ['不限']
    }
}

function performSearch() {
    appliedSearchText.value = searchText.value
    appliedSelectedLabel.value = selectedLabel.value
    currentPage.value = 1
    searchSummary.value = `搜索内容：${searchText.value || '空'}，标签：${selectedLabel.value}`
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
    fetchLabelOptions()
})
</script>

<template>
    <div class="container">
        <h2>题目列表</h2>

        <div class="select">
            <div class="search-row">
                <input
                    v-model="searchText"
                    type="text"
                    placeholder="请输入搜索内容"
                    class="search-input"
                />
                <select v-model="selectedLabel" class="label-select">
                    <option v-for="option in labelOptions" :key="option" :value="option">
                        {{ option }}
                    </option>
                </select>
                <button @click="performSearch" class="search-btn">搜索</button>
            </div>
            <div class="search-summary">{{ searchSummary }}</div>
        </div>

        <!--<button @click="fetchQuestions" class="refresh-btn">刷新</button>-->

        <div v-if="loading" class="loading">加载中...</div>
        <div v-if="error" class="error">{{ error }}</div>
        
        <table v-if="!loading && filteredQuestions.length > 0">
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
        
        <div v-if="!loading && filteredQuestions.length === 0" class="empty">
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

.select {
    margin-top: 20px;
    padding: 16px;
    border: 1px solid #e8e8e8;
    border-radius: 8px;
    background: #fafafa;
}

.search-row {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
    align-items: center;
}

.search-input,
.label-select {
    flex: 1;
    min-width: 200px;
    padding: 10px 12px;
    border: 1px solid #ccc;
    border-radius: 4px;
    font-size: 14px;
}

.label-select {
    max-width: 240px;
}

.search-btn {
    flex: 0 0 auto;
    padding: 10px 24px;
    background: #2196F3;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
}

.search-btn:hover {
    background: #1976D2;
}

.search-summary {
    margin-top: 12px;
    color: #444;
    font-size: 14px;
}
</style>
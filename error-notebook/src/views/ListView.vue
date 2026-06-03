<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import GeneralTable from '../components/GeneralTable.vue'

// ---------- 响应式数据 ----------
const loading = ref(false)
const error = ref('')
const questions = ref([])          // 存储处理后的题目数据
const labels = ref([])             // 原始标签数据
const searchText = ref('')
const selectedLabel = ref('不限')
const appliedSearchText = ref('')
const appliedSelectedLabel = ref('不限')
const labelOptions = ref(['不限'])
const searchSummary = ref('当前显示全部题目')

const route = useRoute()
const router = useRouter()

// 中英文映射表
const fieldMapping = {
    id: 'ID',
    knowledgeType: '知识点类型',
    questionType: '题目类型',
    questionStem: '题干'
}

// ---------- 辅助函数 ----------
// 解析ID排序用的
function parseId(id) {
    const match = id.match(/^(\D*)(\d*)$/)
    const strPart = match[1] || ''
    const numPart = match[2] ? parseInt(match[2], 10) : 0
    return { strPart, numPart }
}

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

// 从路由恢复搜索条件
function loadQueryFromRoute() {
    const { searchText: qSearchText, selectedLabel: qSelectedLabel } = route.query
    if (typeof qSearchText === 'string' && qSearchText.trim() !== '') {
        searchText.value = qSearchText
        appliedSearchText.value = qSearchText
    }
    if (typeof qSelectedLabel === 'string' && qSelectedLabel.trim() !== '') {
        selectedLabel.value = qSelectedLabel
        appliedSelectedLabel.value = qSelectedLabel
    }
    if (qSearchText || qSelectedLabel) {
        searchSummary.value = `搜索内容：${searchText.value || '空'}，标签：${selectedLabel.value}`
    }
}

// 同步搜索条件到路由
function syncRouterQuery() {
    const query = {}
    if (appliedSearchText.value) query.searchText = appliedSearchText.value
    if (appliedSelectedLabel.value && appliedSelectedLabel.value !== '不限') query.selectedLabel = appliedSelectedLabel.value
    router.replace({ path: '/list', query })
}

// 获取题目列表
async function fetchQuestions() {
    loading.value = true
    error.value = ''
    
    try {
        const res = await fetch('http://localhost:3000/api/questions/list')
        const result = await res.json()
        
        if (result.success) {
            let rawData = result.data
            // 按ID排序
            rawData.sort((a, b) => {
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
            // 更新CSV（可选，保留原逻辑）
            const updateRes = await fetch('http://localhost:3000/api/questions/update-all', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(rawData)
            })
            const updateResult = await updateRes.json()
            if (!updateResult.success) {
                error.value = '更新CSV失败：' + updateResult.error
                return
            }
            questions.value = rawData
        } else {
            error.value = result.error || '获取失败'
        }
    } catch (err) {
        error.value = '错误：' + err.message
    } finally {
        loading.value = false
    }
}

// 构建标签前缀映射（ID -> 前缀列表）
const labelsMap = computed(() => {
    const map = new Map()
    for (const item of labels.value) {
        const prefixes = parseLabelPrefixes(item.label)
        map.set(item.id, prefixes)
    }
    return map
})
// ========== 基于搜索条件过滤数据 ==========
const filteredQuestions = computed(() => {
    let result = questions.value
    const searchKeyword = appliedSearchText.value.trim().toLowerCase()
    const labelFilter = appliedSelectedLabel.value

    if (searchKeyword) {
        result = result.filter(item => {
            return (
                (item.id && item.id.toLowerCase().includes(searchKeyword)) ||
                (item.knowledgeType && item.knowledgeType.toLowerCase().includes(searchKeyword)) ||
                (item.questionType && item.questionType.toLowerCase().includes(searchKeyword)) ||
                (item.questionStem && item.questionStem.toLowerCase().includes(searchKeyword))
            )
        })
    }

    if (labelFilter && labelFilter !== '不限') {
        result = result.filter(item => {
            const prefixes = labelsMap.value.get(item.id) || []
            return prefixes.includes(labelFilter)
        })
    }

    return result
})

// 计算属性：供表格使用的精简数据
const tableData = computed(() => {
  return filteredQuestions.value.map(item => ({
    id: item.id,
    knowledgeType: item.knowledgeType,
    questionType: item.questionType,
    questionStem: item.questionStem
  }))
})

// 更新搜索摘要信息
function updateSearchSummary() {
    const keyword = appliedSearchText.value.trim() || '空'
    const label = appliedSelectedLabel.value
    const count = filteredQuestions.value.length
    if (label !== '不限') {
        searchSummary.value = `搜索内容：“${keyword}”，标签：“${label}”，共找到 ${count} 条题目`
    } else {
        searchSummary.value = `搜索内容：“${keyword}”，标签：不限，共找到 ${count} 条题目`
    }
}

// 获取标签选项
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

// 执行搜索
function performSearch() {
    appliedSearchText.value = searchText.value
    appliedSelectedLabel.value = selectedLabel.value
    searchSummary.value = `搜索内容：${searchText.value || '空'}，标签：${selectedLabel.value}`
    syncRouterQuery()
    // 注意：数据过滤仍由父组件负责？这里需要根据搜索条件重新过滤 questions
    // 但 fetchQuestions 获取全量数据，如果要做前端过滤，需要增加一个 computed 列表传给 GeneralTable
    // 为了保持简单，这里只做路由同步，实际过滤可后续扩展（原代码未实现过滤逻辑，仅展示全量）
    // 若需要按标签/内容过滤，请自行补充 filterQuestions computed
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

// ---------- 事件处理 ----------
const handleEdit = (row) => {
    console.log('编辑题目:', row)
    // 例如跳转到编辑页：router.push(`/edit/${row.id}`)
}

const handleDelete = (row) => {
    console.log('删除题目:', row)
    // 调用删除 API，然后刷新列表
}

// 编辑按钮的跳转逻辑
const handleIdClick = (item) => {
    router.push({
        name: 'Question',
        params: { id: item.id },
        query: route.query   // 保留当前 URL 的 query 参数
    })
}

// ---------- 生命周期 ----------
onMounted(() => {
    loadQueryFromRoute()
    fetchQuestions()
    fetchLabelOptions()
})

// 监听过滤后的数据变化，自动更新摘要
watch(filteredQuestions, () => {
    updateSearchSummary()
}, { immediate: true })  // immediate: true 保证初始也执行一次
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

        <GeneralTable 
            :data="tableData" 
            :loading="loading" 
            :error="error" 
            :columnLabels="fieldMapping"
            @edit="handleEdit" 
            @delete="handleDelete"
            @id-click="handleIdClick"
        />
    </div>
</template>

<style scoped>
.container {
    max-width: 80dvw;
    min-height: 600px;
    margin: 0 auto;
    padding: 20px;
    background-color: #fff;
}

h2 {
    text-align: center;
    margin-bottom: 20px;
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

:deep(.container) {
    margin: 0;
    padding: 0;
}

</style>
<script setup>
//#region 导入与依赖
import { ref, onMounted, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import GeneralTable from '../components/GeneralTable.vue'
//#endregion

//#region 响应式数据
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
//#endregion

//#region 路由实例
const route = useRoute()
const router = useRouter()
//#endregion

//#region 表格列映射与替换规则
const fieldMapping = {
    id: 'ID',
    knowledgeType: '知识点类型',
    questionType: '题目类型',
    questionStem: '题干'
}

const replaceRules = [
    { column: 'questionType', from: 'single', to: '单选题' },
    { column: 'questionType', from: 'multiple', to: '多选题' },
    { column: 'questionType', from: 'shortanswer', to: '简答题' },
]
//#endregion

//#region 辅助函数
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
//#endregion

//#region 路由相关函数
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
//#endregion

//#region 数据获取API
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
//#endregion

//#region 计算属性
// 构建标签前缀映射（ID -> 前缀列表）
const labelsMap = computed(() => {
    const map = new Map()
    for (const item of labels.value) {
        const prefixes = parseLabelPrefixes(item.label)
        map.set(item.id, prefixes)
    }
    return map
})

// 基于搜索条件过滤数据
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
//#endregion

//#region 搜索
// 执行搜索
function performSearch() {
    appliedSearchText.value = searchText.value
    appliedSelectedLabel.value = selectedLabel.value
    searchSummary.value = `搜索内容：${searchText.value || '空'}，标签：${selectedLabel.value}`
    syncRouterQuery()
}
//#endregion

//#region 事件处理
const handleEdit = (row) => {
    console.log('编辑题目:', row)
    // 例如跳转到编辑页：router.push(`/edit/${row.id}`)
}

const handleDelete = (row) => {
    console.log('删除题目:', row)
    // 调用删除 API，然后刷新列表
}

// ID点击跳转
const handleIdClick = (item) => {
    router.push({
        name: 'Question',
        params: { id: item.id },
        query: route.query   // 保留当前 URL 的 query 参数
    })
}
//#endregion

//#region 生命周期与监听器
onMounted(() => {
    loadQueryFromRoute()
    fetchQuestions()
    fetchLabelOptions()
})
//#endregion
</script>

<template>
    <div class="container">
        <div class="select">
            <div class="search-row">
                <el-input
                    v-model="searchText"
                    placeholder="请输入搜索内容"
                    class="search-input"
                    clearable
                />
                <el-select
                    v-model="selectedLabel"
                    placeholder="请选择标签"
                    class="label-select"
                >
                    <el-option
                        v-for="option in labelOptions"
                        :key="option"
                        :label="option"
                        :value="option"
                    />
                </el-select>
                <el-button @click="performSearch" class="search-btn">搜索</el-button>
            </div>
        </div>

        <GeneralTable 
            :data="tableData" 
            :loading="loading" 
            :error="error" 
            :columnLabels="fieldMapping"
            :replace-rules="replaceRules"
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

.search-row {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
}

.search-input,
.label-select {
    flex: 1;
    min-width: 200px;
    padding: 5px 6px;
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

:deep(.container) {
    margin: 0;
    padding: 0;
}

</style>
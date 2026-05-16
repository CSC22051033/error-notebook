<script setup>
    import { computed, ref, watch } from 'vue'
    import { Edit, Delete } from '@element-plus/icons-vue' 

    const emit = defineEmits(['edit', 'delete', 'id-click'])

    // 定义 props 接收父组件传过来的数据
    const props = defineProps({
        data: {
            type: Array,
            required: true
        },
        loading: {
            type: Boolean,
            default: false
        },
        error: {
            type: String,
            default: ''
        },
        fieldMapping: {
            type: Object,
            default: () => ({})
        }
    })

    // 动态计算所有列名（提取第一行对象的所有键，如果没有数据则返回空数组）
    const columns = computed(() => {
        if (props.data.length === 0) return []
        return Object.keys(props.data[0])
    })
    // 获取表头显示文本（如果存在映射则用映射，否则用原键名）
    const getHeaderLabel = (key) => {
        return props.fieldMapping[key] || key
    }

    // 修改：将整行数据传递给父组件
    const handleEdit = (item) => {
        emit('edit', item)
    }

    // 删除：将整行数据传递给父组件
    const handleDelete = (item) => {
        if (confirm('确定删除该项吗？')) {
            emit('delete', item)
        }
    }

    // id 列的点击处理
    const handleIdClick = (idValue) => {
        emit('id-click', { id: idValue })
    }

    // 分页功能实现
    const currentPage = ref(1);
    const pageSize = 10;

    const totalPages = computed(() => {
        const total = props.data.length
        return total === 0 ? 0 : Math.ceil(total / pageSize)
    })

    const dataCurrent = computed(() => {
        const start = (currentPage.value - 1) * pageSize
        const end = start + pageSize
        return props.data.slice(start, end)
    })

    watch(totalPages, (value) => {
        if (currentPage.value > value && value > 0) {
            currentPage.value = value
        }
        if (value === 0) {
            currentPage.value = 1
        }
    })
    
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
</script>

<template>
    <div class="container">
        <div class="loading" v-if="loading">
            加载中……
        </div>
        <div class="error" v-if="error">
            {{ error }}
        </div>
        <div class="tableContainer" v-if="!loading">
            <div v-if="data.length === 0" class="empty">暂无数据</div>
            <table v-else class="blue-table">
                <thead>
                    <tr>
                        <th v-for="key in columns" :key="key">
                            {{ getHeaderLabel(key) }}
                        </th>
                        <th>操作</th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="(item, index) in dataCurrent" :key="item.id ?? index">
                        <td v-for="key in columns" 
                            :key="key"
                            :class="{ 'id-cell': key === 'id' }"
                            @click="key === 'id' ? handleIdClick(item[key], item) : undefined">
                            {{ item[key] }}
                        </td>
                        <td class="action-group">
                            <el-button class="edit-btn" @click="handleEdit(item)" type="primary" plain>
                                <el-icon :size="15">
                                    <Edit />
                                </el-icon>
                                修改
                            </el-button>
                            <el-button class="delete-btn" @click="handleDelete(item)" type="danger" plain>
                                <el-icon :size="15">
                                    <Delete />
                                </el-icon>
                                删除
                            </el-button>
                        </td>
                    </tr>
                </tbody>
            </table>
            <div class="pageDiv" v-if="totalPages > 1">
                <el-button @click="prevPage" :disabled="currentPage <= 1" class="page-btn" type="primary" plain>上一页</el-button>
                <span class="page-info">第 {{ currentPage }} / {{ totalPages }} 页</span>
                <el-button @click="nextPage" :disabled="currentPage >= totalPages" class="page-btn" type="primary" plain>下一页</el-button>
            </div>
        </div>
    </div>
</template>

<style scoped>

/* 表格容器：阴影 + 滚动支持 */
.table-container {
    background: #ffffff;
    box-shadow: 0 20px 35px -12px rgba(0, 0, 0, 0.12), 0 2px 6px -1px rgba(0, 0, 0, 0.02);
    overflow-x: auto;
    overflow-y: visible;
    transition: box-shadow 0.25s ease;
    border: 1px solid rgba(59, 130, 246, 0.2);
}
.table-container:hover {
    box-shadow: 0 24px 42px -16px rgba(0, 35, 80, 0.2);
}

.blue-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.95rem;
    min-width: 680px;
    background-color: white;
}
.blue-table thead tr {
    background: linear-gradient(98deg, #1e3a8a 0%, #2b5fcc 100%);
    border-bottom: none;
}
.blue-table th {
    color: #ffffff;
    font-weight: 600;
    font-size: 0.9rem;
    letter-spacing: 0.3px;
    padding: 1rem 1.2rem;
    text-align: left;
    white-space: nowrap;
    background: transparent;
    border-bottom: none;
    position: relative;
}
.blue-table th:not(:last-child)::after {
    content: "";
    position: absolute;
    right: 0;
    top: 20%;
    height: 60%;
    width: 1px;
    background: rgba(255, 255, 255, 0.2);
}
/* 单元格基础样式 */
.blue-table td {
    padding: 1rem 1.2rem;
    border-bottom: 1px solid #e9edf4;
    color: #1f2a48;
    font-weight: 450;
    vertical-align: middle;
    transition: background 0.2s ease;
}

/* 斑马纹偶数行 — 清新浅蓝白交替 */
.blue-table tbody tr:nth-child(even) {
    background-color: #f9fcff;
}
.blue-table tbody tr:nth-child(odd) {
    background-color: #ffffff;
}

/* 行悬停效果：柔和晴空蓝 */
.blue-table tbody tr:hover {
    background-color: #eef4ff !important;
    transition: 0.1s;
    cursor: default;
}

/* 操作链接组 */
.action-group {
    display: flex;
    align-items: center;
}
.blue-table td.action-group {
    border-bottom: none;
}

.pageDiv {
  width: 100%;
  display: flex;
  justify-content: space-between;
}

.container{
    width: 96%;
    overflow-x: auto;
}

.id-cell {
    color: #409eff;
    cursor: pointer;
    text-decoration: underline;
}
.id-cell:hover {
    color: #66b1ff;
}
</style>



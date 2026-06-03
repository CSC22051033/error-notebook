<script setup>
    import { computed, ref, watch } from 'vue'
    import { Edit, Delete } from '@element-plus/icons-vue'

    const emit = defineEmits(['edit', 'delete'])

    //#region 定义 props 接收父组件传过来的数据
    const props = defineProps({
        data: {
            type: Array,
            required: true
        },
        columnsOrder: {     // 表头顺序
            type: Array,
            default: undefined
        },
        columnLabels: {     // 表头显示文本映射
            type: Object,
            default: () => ({})
        },
        replaceRules:{      // 替换规则
            // 格式 [{ column: '列名', from: 原值, to: 替换值 }, ……]
            type: Array,
            default: () => []
        },
        loading: {
            type: Boolean,
            default: false
        },
        error: {
            type: String,
            default: ''
        }
    })
    //#endregion

    // 动态计算所有列名
    const columns = computed(() => {
        if (props.data.length === 0) return []
        
        // 收集所有数据行中实际存在的字段
        const availableKeysSet = new Set()
        for (const item of props.data) {
            for (const key of Object.keys(item)) {
                availableKeysSet.add(key)
            }
        }
        
        // 判断是否传入了列顺序配置
        if (props.columnsOrder !== undefined) {
            // 按传入顺序过滤出实际存在的字段（不存在的字段自动忽略）
            const ordered = props.columnsOrder.filter(key => availableKeysSet.has(key))
            return ordered
        } else {
            // 未传入列顺序配置时，使用第一行数据的键顺序（保持原有行为）
            return Object.keys(props.data[0])
        }
    })

    // 根据替换规则获取单元格显示值（仅影响展示，不修改原始数据）
    const displayValue = (item, columnKey) => {
        const originalValue = item[columnKey]
        if (!props.replaceRules || props.replaceRules.length === 0) {
            return originalValue
        }
        const matchedRule = props.replaceRules.find(rule => 
            rule.column === columnKey && rule.from === originalValue
        )
        return matchedRule ? matchedRule.to : originalValue
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

    const handleIdClick = (idValue) => {
        emit('id-click', { id: idValue })
    }

    //#region 分页功能实现
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

    watch(totalPages, (value) => {
        if (currentPage.value > value && value > 0) {
            currentPage.value = value
        }
        if (value === 0) {
            currentPage.value = 1
        }
    })
    //#endregion
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
                            {{ columnLabels[key] || key }}
                        </th>
                        <th class="action-header">操作</th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="(item, index) in dataCurrent" :key="item.id ?? index">
                        <!-- 为 ID 列添加点击事件和特殊样式 -->
                        <td v-for="key in columns" 
                            :key="key"
                            :class="{ 'id-cell': key === 'id' }"
                            @click="key === 'id' ? handleIdClick(item[key]) : undefined">
                            {{ displayValue(item, key) }}
                        </td>
                        <td class="action-cell">
                            <div class="action-group">
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
                            </div>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
        <!-- 分页栏：固定在视口底部 -->
        <div class="pageDiv">
            <el-button @click="prevPage" :disabled="currentPage <= 1" class="page-btn" type="primary" plain>上一页</el-button>
            <span class="page-info">第 {{ currentPage }} / {{ totalPages }} 页</span>
            <el-button @click="nextPage" :disabled="currentPage >= totalPages" class="page-btn" type="primary" plain>下一页</el-button>
        </div>
    </div>
</template>

<style scoped>

/* ===== 表格容器 ===== */
.tableContainer {
    overflow: auto;
    height: 80dvh;
    width: 80dvw;
    display: block;

    background: #ffffff;
    border: 1px solid rgba(59, 130, 246, 0.2);
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
    /* 固定表头 */
    position: sticky;
    top: 0;
    z-index: 10;
}
.blue-table th {
    color: #ffffff;
    font-weight: 600;
    font-size: 0.9rem;
    letter-spacing: 0.3px;
    padding: 0.4rem 0.9rem;
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
    padding: 0.4rem 0.9rem;
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

/* ===== 操作列：最小宽度确保按钮不换行 ===== */
.action-header,
.action-cell {
    min-width: 180px;       /* 确保两个按钮在一行显示 */
    white-space: nowrap;
}

/* 操作链接组 */
.action-group {
    display: flex;
    gap: 0.5rem;
    align-items: center;
    flex-wrap: nowrap;      /* 禁止按钮换行 */
}

/* ===== 分页栏：固定在视口底部 ===== */
.pageDiv {
    bottom: 0;
    left: 0;
    right: 0;
    z-index: 100;

    box-shadow: 0 -2px 12px rgba(0, 0, 0, 0.08);
    border-top: 1px solid #e9edf4;
    background: #ffffff;

    flex-shrink: 0;
    width: 80dvw;
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 8px 24px;
    box-sizing: border-box;
}

/* ===== 外层容器 ===== */
.container {
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    box-sizing: border-box;
}

/* 美化滚动条 */
.tableContainer::-webkit-scrollbar {
    width: 8px;
    height: 8px;
}
.tableContainer::-webkit-scrollbar-track {
    background: #f1f5f9;
    border-radius: 4px;
}
.tableContainer::-webkit-scrollbar-thumb {
    background: #cbd5e1;
    border-radius: 4px;
}
.tableContainer::-webkit-scrollbar-thumb:hover {
    background: #94a3b8;
}

.id-cell {
    cursor: pointer;
    color: #409eff;
    text-decoration: underline;
}
.id-cell:hover {
    color: #66b1ff;
}
</style>
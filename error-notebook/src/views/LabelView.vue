<script setup>
import { ref, onMounted, computed } from 'vue'

const id = ref('')
const label = ref('')
const loading = ref(false)
const error = ref('')
const message = ref('')
const labels = ref([])
const currentPage = ref(1)
const pageSize = 10
const searchText = ref('')
const appliedSearchText = ref('')
const showForm = ref(false)

const filteredLabels = computed(() => {
    const keyword = appliedSearchText.value.trim()
    return labels.value.filter(item => 
        !keyword || item.label.includes(keyword)
    )
})

const totalPages = computed(() => Math.ceil(filteredLabels.value.length / pageSize))

const paginatedLabels = computed(() => {
    const start = (currentPage.value - 1) * pageSize
    const end = start + pageSize
    return filteredLabels.value.slice(start, end)
})

function performSearch() {
    appliedSearchText.value = searchText.value
    currentPage.value = 1
}

function prevPage() {
    if (currentPage.value > 1) {
        currentPage.value--
    }
}

function nextPage() {
    if (currentPage.value < totalPages.value) {
        currentPage.value++
    }
}

function toggleForm() {
    showForm.value = !showForm.value
}

async function fetchLabels() {
  loading.value = true
  error.value = ''
  message.value = ''

  try {
    const res = await fetch('http://localhost:3000/api/labels')
    const result = await res.json()
    if (result.success) {
      labels.value = result.data
    } else {
      error.value = result.error || '获取标签数据失败'
    }
  } catch (err) {
    error.value = '网络错误：' + err.message
  } finally {
    loading.value = false
  }
}

async function saveLabel() {
  error.value = ''
  message.value = ''

  if (!id.value.trim()) {
    error.value = '请输入题目ID'
    return
  }

  if (!label.value.trim()) {
    error.value = '请输入题目标签，多个标签请使用；分隔'
    return
  }

  loading.value = true
  try {
    const res = await fetch('http://localhost:3000/api/labels', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: id.value.trim(), label: label.value.trim() })
    })
    const result = await res.json()
    if (result.success) {
      message.value = '标签保存成功'
      id.value = ''
      label.value = ''
      await fetchLabels()
    } else {
      error.value = result.error || '保存标签失败'
    }
  } catch (err) {
    error.value = '网络错误：' + err.message
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchLabels()
})
</script>

<template>
  <div class="label-container">
    <h2>标签管理</h2>

    <div class="search-row">
      <input
        v-model="searchText"
        type="text"
        placeholder="请输入搜索内容（标签内容）"
        class="search-input"
        @keyup.enter="performSearch"
      />
      <button @click="performSearch" class="search-btn">搜索</button>
      <button @click="toggleForm" class="insert-btn">{{ showForm ? '隐藏插入' : '插入标签' }}</button>
    </div>

    <div v-if="showForm" class="description">
      请输入题目ID和标签，多个标签请用";"分隔，例如：知识点1;知识点2。
    </div>

    <div v-if="showForm" class="form-card">
      <div class="form-row">
        <label>题目ID</label>
        <input v-model="id" type="text" placeholder="输入题目ID" />
      </div>
      <div class="form-row">
        <label>题目标签</label>
        <input v-model="label" type="text" placeholder="知识点1;知识点2" />
      </div>
      <div class="button-row">
        <button @click="saveLabel" :disabled="loading">确认保存</button>
      </div>

      <div class="status-message" v-if="message">{{ message }}</div>
      <div class="status-error" v-if="error">{{ error }}</div>
    </div>

    <div class="table-card">
      <h3>当前标签列表</h3>
      <div v-if="loading" class="loading">加载中...</div>
      <div v-if="!loading && filteredLabels.length === 0" class="empty">暂无标签数据</div>
      <table v-if="!loading && paginatedLabels.length > 0">
        <thead>
          <tr>
            <th>题目ID</th>
            <th>标签</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in paginatedLabels" :key="item.id">
            <td>{{ item.id }}</td>
            <td>
              <span v-for="tag in item.label.split(/[;；]/)" :key="tag" class="tag">{{ tag.trim() }}</span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="pageDiv" v-if="totalPages > 1">
      <button @click="prevPage" :disabled="currentPage <= 1" class="page-btn">上一页</button>
      <span class="page-info">第 {{ currentPage }} / {{ totalPages }} 页</span>
      <button @click="nextPage" :disabled="currentPage >= totalPages" class="page-btn">下一页</button>
    </div>
    
  </div>
</template>

<style scoped>
.label-container {
  max-width: 900px;
  margin: 0 auto;
  padding: 24px;
  background: #fff;
}

h2 {
  text-align: center;
  margin-bottom: 16px;
}

.search-row {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: center;
  margin-bottom: 20px;
}

.search-input {
  flex: 1;
  min-width: 200px;
  padding: 10px 12px;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-size: 14px;
}

.search-btn,
.insert-btn {
  padding: 10px 24px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}

.search-btn {
  background: #2196F3;
  color: white;
}

.search-btn:hover {
  background: #1976D2;
}

.insert-btn {
  background: #67c23a;
  color: white;
}

.insert-btn:hover {
  background: #5cb85c;
}

.description {
  margin-bottom: 20px;
  color: #666;
  line-height: 1.6;
}

.form-card,
.table-card {
  border: 1px solid #e8e8e8;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 24px;
  background: #fafafa;
}

.form-row {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 16px;
}

.form-row label {
  width: 96px;
  color: #333;
}

.form-row input {
  flex: 1;
  height: 40px;
  border: 1px solid #dcdfe6;
  border-radius: 6px;
  padding: 0 12px;
  font-size: 14px;
}

.button-row {
  display: flex;
  justify-content: flex-end;
}

button {
  min-width: 120px;
  height: 42px;
  border: none;
  background: #409eff;
  color: #fff;
  border-radius: 6px;
  cursor: pointer;
}

button:disabled {
  opacity: 0.65;
  cursor: not-allowed;
}

.status-message,
.status-error {
  margin-top: 14px;
  font-size: 14px;
}

.status-message {
  color: #67c23a;
}

.status-error {
  color: #f56c6c;
}

table {
  width: 100%;
  border-collapse: collapse;
}

th,
td {
  border: 1px solid #e8e8e8;
  padding: 12px;
  text-align: left;
}

th {
  background: #f5f7fa;
}

.empty,
.loading {
  padding: 18px 0;
  text-align: center;
  color: #999;
}

.pageDiv {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 20px;
}

.page-btn {
  background: #2196F3;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  padding: 8px 16px;
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

.tag {
  display: inline-block;
  background-color: rgba(148, 227, 201, 1);
  border-radius: 4px;
  padding: 4px 8px;
  margin-left: 20px;
  font-size: 0.9rem;
}
</style>

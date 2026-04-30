<script setup>
import { ref, onMounted } from 'vue'

const id = ref('')
const label = ref('')
const loading = ref(false)
const error = ref('')
const message = ref('')
const labels = ref([])

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
    <div class="description">
      请输入题目ID和标签，多个标签请用";"分隔，例如：知识点1;知识点2。
    </div>

    <div class="form-card">
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
      <div v-if="!loading && labels.length === 0" class="empty">暂无标签数据</div>
      <table v-if="!loading && labels.length > 0">
        <thead>
          <tr>
            <th>题目ID</th>
            <th>标签</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in labels" :key="item.id">
            <td>{{ item.id }}</td>
            <td>{{ item.label }}</td>
          </tr>
        </tbody>
      </table>
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
</style>

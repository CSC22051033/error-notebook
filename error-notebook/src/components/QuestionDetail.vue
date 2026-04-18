<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()

const loading = ref(false)
const error = ref('')
const question = ref(null)

// 题目类型映射
const typeMap = {
    'single': '单选题',
    'multiple': '多选题',
    'truefalse': '判断题',
    'shortanswer': '简答题'
}

async function fetchDetail() {
    loading.value = true;
    const id = route.params.id

    try {
        const res = await fetch('http://localhost:3000/api/questions/list')
        const result = await res.json()
        
        if (result.success) {
            // 根据序号查找题目            
            question.value = result.data.find(q => q.id == parseInt(id))
            console.log(question.value);
            
            if (!question.value) {
                error.value = '题目不存在'
            }
        } else {
            error.value = result.error || '获取失败'
        }
    } catch (err) {
        error.value = '网络错误：' + err.message
    } finally {
        loading.value = false
    }

}
onMounted(() => {
    fetchDetail()
})
</script>

<template>
    <div class="container">
        <div v-if="loading" class="loading">加载中...</div>
        <div v-if="error" class="error">{{ error }}</div>
        <div v-if="question">
            <div>
                <label>{{ typeMap[question.questionType] }}</label>
                <label>{{ question.knowledgeType }}</label>
                <h2>{{ question.id }}. {{ question.questionStem }}</h2>
            </div>
            <pre>{{ question.questionContent }}</pre>
            <div v-if="question.questionType === 'single' || question.questionType === 'multiple'">
                <div class="option"><pre class="option-li">A</pre><pre>{{ question.optionA }}</pre></div>
                <div class="option"><pre class="option-li">B</pre><pre>{{ question.optionB }}</pre></div>
                <div class="option"><pre class="option-li">C</pre><pre>{{ question.optionC }}</pre></div>
                <div class="option"><pre class="option-li">D</pre><pre>{{ question.optionD }}</pre></div>
            </div>

            <div class="analysis">
                <pre>正确答案: <a class="answer">{{ question.answer }}</a></pre>
                <pre>解析: <br>{{ question.analysis }}</br></pre>
            </div>

            <div class="bottom-button">
                <button><a :href="`/questions/${parseInt(question.id) - 1}`">上一题</a></button>
                <button>确认</button>
                <button><a :href="`/questions/${parseInt(question.id) + 1}`">下一题</a></button>
            </div>
        </div>
    </div>
</template>

<style scoped>
.container {
    max-width: 1000px;
    min-height: 600px;
    margin: 0 auto;        /* 水平居中 */
    padding: 20px;         /* 内边距 */
    background-color: #fff;
}

pre {
    font-size: 1.5rem;
    margin-left: 30px;
}

.option {
    display: flex;
    align-items: center;
    height: 45px;
    width: 100%;
}

.option-li{
    border: 1px solid #ccc;
    width: 45px;
    height: 45px;
    border-radius:22.5px;
    display: flex;           /* 使用 flex 布局 */
    align-items: center;     /* 垂直居中 */
    justify-content: center; /* 水平居中 */
}

label {
    margin-right: 20px;
    font-size: 1rem;
    font-family: "Microsoft YaHei", "PingFang SC", sans-serif;
    border: 1px solid rgba(255, 255, 255, 0.2);
    background-color: rgba(227, 243, 255, 1);
    color: rgba(0, 117, 255, 1);
    display: inline-block;
}

.analysis{
    background-color: rgba(248, 248, 248, 1);
}

.answer{
    color: green;
    font-weight: bolder;
}

.bottom-button {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: 24px;
    padding: 16px 20px;
    border-radius: 12px;
    gap: 16px;
}

/* 按钮基础样式 */
.bottom-button button,
.bottom-button .btn {
    font-size: 20px;
    font-weight: 500;
}
</style>
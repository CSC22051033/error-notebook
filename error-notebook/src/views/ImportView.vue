<script setup>
    import { ref, computed } from 'vue'
    import { useRouter } from 'vue-router'
    const router = useRouter()

    const form = ref({
        knowledgeType: 'frontend',
        questionStem: '',
        questionType: 'single',
        questionContent: '',
        options: { A: 'A', B: 'B', C: 'C', D: 'D' },
        answer: '',
        analysis: ''
    })

    function handleSelectChange(){
        let questionType = document.getElementById("questionType").value;
        if(questionType === "shortanswer" || questionType === "truefalse"){
            document.querySelector(".options").style.display = "none";
        }else{
            document.querySelector(".options").style.display = "block";
        }
    }

    async function handleSubmit(){
        if (!form.value.questionStem.trim()) return alert('请输入题干')
        if (!form.value.answer.trim()) return alert('请输入正确答案')
        
        const submitData = { ...form.value }

        try {
            const res = await fetch('http://localhost:3000/api/questions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(submitData)
            });
            const result = await res.json();
            alert(result.success ? '已追加到CSV！' : '失败：' + result.error);
        } catch (err) {
            alert('网络错误：' + err.message);
        }

        router.push('/')
    }
</script>

<template>
    <form @submit.prevent="handleSubmit">
        <div>
            <label>知识类型</label>
            <select id="knowledgeType" v-model="form.knowledgeType">
                <optgroup label="前端">
                    <option value="frontend">前端综合</option>
                    <option value="html">HTML</option>
                    <option value="css">CSS</option>
                    <option value="javascript">JavaScript</option>
                    <option value="vue">Vue</option>
                </optgroup>
            </select>
        </div>
        <div>
            <label>题干</label>
            <input type="text" v-model="form.questionStem" placeholder="请输入题干">
        </div>
        <div>
            <label>题目类型</label>
            <select id="questionType" v-model="form.questionType" @change="handleSelectChange">
                <option value="single">单选题</option>
                <option value="multiple">多选题</option>
                <option value="truefalse">判断题</option>
                <option value="shortanswer">简答题</option>
            </select>
        </div>
        <div class="questionContent">
            <label>题目内容</label>
            <textarea v-model="form.questionContent" placeholder="请输入题目内容"></textarea>
        </div>
        <div class="options">
            <div>
                <label>选项A</label>
                <input type="text" v-model="form.options.A">
            </div>
            <div>
                <label>选项B</label>
                <input type="text" v-model="form.options.B">
            </div>
            <div>
                <label>选项C</label>
                <input type="text" v-model="form.options.C">
            </div>
            <div>
                <label>选项D</label>
                <input type="text" v-model="form.options.D">
            </div>
        </div>
        <div class="answer">
            <label>正确答案</label>
            <textarea v-model="form.answer" placeholder="请输入正确答案"></textarea>
        </div>
        <div class="analysis">
            <label>解析</label>
            <textarea v-model="form.analysis" placeholder="请输入解析"></textarea>
        </div>
        <div class="button">
            <button type="submit">提交</button>
        </div>
    </form>
</template>

<style scoped>
form {
    max-width: 1000px;
    margin: 0 auto;        /* 水平居中 */
    padding: 20px;         /* 内边距 */
    background-color: #fff;
}
form div{
    font-size: 1.5rem;
}
form div label{
    display: inline-block;
    width: 150px;
}
form div input, form div select, form div textarea{
    min-width: 350px;
    width: 100%;  
    height: 30px;
    font-size: 1.5rem;
}
.questionContent textarea{
    height: 100px;
}
.answer textarea, .analysis textarea{
    height: 50px;
}
.button{
    text-align: center;
}
.button button{
    width: 200px;
    height: 40px;
    font-size: 1.5rem;
}
</style>

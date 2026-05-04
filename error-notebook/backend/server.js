// server.js
const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const CSV_FILE = path.join(__dirname, 'questions.csv');
const LABEL_CSV_FILE = path.join(__dirname, 'labels.csv');

// 去掉 BOM 的辅助函数
function removeBOM(content) {
    if (content.charCodeAt(0) === 0xFEFF) {
        return content.slice(1);
    }
    return content;
}

function initLabelCSV() {
    if (!fs.existsSync(LABEL_CSV_FILE)) {
        const BOM = '\uFEFF';
        const headers = ['ID', 'label'];
        fs.writeFileSync(LABEL_CSV_FILE, BOM + headers.join(',') + '\n', 'utf8');
    }
}

function readLabelCSV() {
    initLabelCSV();
    let content = fs.readFileSync(LABEL_CSV_FILE, 'utf8');
    content = removeBOM(content);
    const lines = content.split('\n').filter(line => line.trim() !== '');
    if (lines.length === 0) {
        return [];
    }
    const headerResult = parseCSVLine(lines, 0);
    let index = headerResult.nextIndex;
    const data = [];
    while (index < lines.length) {
        const rowResult = parseCSVLine(lines, index);
        const fields = rowResult.fields;
        if (fields.length >= 2) {
            data.push({ id: fields[0] || '', label: fields[1] || '' });
        }
        index = rowResult.nextIndex;
    }
    return data;
}

function writeLabelCSV(data) {
    const BOM = '\uFEFF';
    const headers = ['ID', 'label'];
    let csvContent = BOM + headers.join(',') + '\n';
    for (const item of data) {
        const row = [item.id, item.label];
        csvContent += row.map(escapeCSV).join(',') + '\n';
    }
    fs.writeFileSync(LABEL_CSV_FILE, csvContent, 'utf8');
}

function getQuestionKey(item) {
    return [
        item.knowledgeType || '',
        item.questionStem || '',
        item.questionType || '',
        item.questionContent || '',
        item.optionA || '',
        item.optionB || '',
        item.optionC || '',
        item.optionD || '',
        item.answer || '',
        item.analysis || ''
    ].join('||');
}

function syncLabelIds(oldQuestions, newQuestions) {
    if (!oldQuestions || !newQuestions) {
        return;
    }
    const oldMap = new Map();
    oldQuestions.forEach(item => {
        const key = getQuestionKey(item);
        if (!oldMap.has(key)) {
            oldMap.set(key, []);
        }
        oldMap.get(key).push(item.id);
    });

    const newMap = new Map();
    newQuestions.forEach(item => {
        const key = getQuestionKey(item);
        if (!newMap.has(key)) {
            newMap.set(key, []);
        }
        newMap.get(key).push(item.id);
    });

    const idMap = new Map();
    for (const [key, oldIds] of oldMap.entries()) {
        const newIds = newMap.get(key);
        if (newIds && newIds.length === oldIds.length) {
            for (let i = 0; i < oldIds.length; i++) {
                idMap.set(oldIds[i], newIds[i]);
            }
        } else if (newIds && newIds.length === 1 && oldIds.length === 1) {
            idMap.set(oldIds[0], newIds[0]);
        }
    }

    if (idMap.size === 0) {
        return;
    }

    const labelRows = readLabelCSV();
    const updatedRows = labelRows.map(row => {
        const mappedId = idMap.get(row.id);
        return mappedId ? { ...row, id: mappedId } : row;
    });
    writeLabelCSV(updatedRows);
}

// 确保CSV文件存在，不存在则创建表头
function initCSV() {
    if (!fs.existsSync(CSV_FILE)) {
        const BOM = '\uFEFF';
        const headers = ['ID', '知识类型', '题干', '题目类型', '题目内容', '选项A', '选项B', '选项C', '选项D', '正确答案', '解析'];
        fs.writeFileSync(CSV_FILE, BOM + headers.join(',') + '\n', 'utf8');
    }
}

// 获取下一个ID（读取现有数据，找到最大ID+1）
function getNextId() {
    if (!fs.existsSync(CSV_FILE)) {
        return 1;
    }
    
    let content = fs.readFileSync(CSV_FILE, 'utf8');
    content = removeBOM(content); // 去掉 BOM
    
    let lines = content.split('\n').map(
        (value) => {
            return value.split(',')[0];
        }
    );

    lines = lines.filter(
        (value) => {
            if(typeof value === 'number')
                return value;
            else if(typeof value === 'string'){
                if(!isNaN(Number(value)))
                    return value;
            }
        }
    )

    if (lines.length <= 1) {
        return 1;
    }
    
    let maxId = 0;
    for (let i = 1; i < lines.length; i++) {
        const id = parseInt(lines[i]);        
        if (!isNaN(id) && id > maxId) {
            maxId = id;
        }
    }
    
    return maxId + 1;
}

// 处理特殊字符
function escapeCSV(str) {
    if (str === null || str === undefined) return '';
    str = String(str);
    if (str.includes(',') || str.includes('\n') || str.includes('"')) {
        return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
}

// 追加数据到CSV
app.post('/api/questions', (req, res) => {
    try {
        initCSV();
        
        const data = req.body;
        const nextId = getNextId();
        
        const row = [
            nextId,
            data.knowledgeType,
            data.questionStem,
            data.questionType,
            data.questionContent,
            data.options?.A || '',
            data.options?.B || '',
            data.options?.C || '',
            data.options?.D || '',
            data.answer,
            data.analysis
        ];
        
        const csvLine = row.map(escapeCSV).join(',') + '\n';
        fs.appendFileSync(CSV_FILE, csvLine, 'utf8');
        
        res.json({ success: true, message: '数据已追加到CSV', id: nextId });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// 下载CSV文件
app.get('/api/download', (req, res) => {
    if (!fs.existsSync(CSV_FILE)) {
        return res.status(404).json({ error: '文件不存在' });
    }
    res.download(CSV_FILE, 'questions.csv');
});

// 获取所有数据（原始行）
app.get('/api/questions', (req, res) => {
    if (!fs.existsSync(CSV_FILE)) {
        return res.json([]);
    }
    let content = fs.readFileSync(CSV_FILE, 'utf8');
    content = removeBOM(content); // 去掉 BOM
    
    const lines = content.split('\n').filter(line => line.trim());
    res.json({ data: lines });
});

// 解析CSV行（处理引号内的逗号和换行）
function parseCSVLine(lines, startIndex) {
    const result = [];
    let current = '';
    let inQuotes = false;
    let i = startIndex;
    
    while (i < lines.length) {
        const line = lines[i];
        for (let j = 0; j < line.length; j++) {
            const char = line[j];
            if (char === '"') {
                if (inQuotes && line[j + 1] === '"') {
                    current += '"';
                    j++;
                } else {
                    inQuotes = !inQuotes;
                }
            } else if (char === ',' && !inQuotes) {
                result.push(current.trim());
                current = '';
            } else {
                current += char;
            }
        }
        
        if (inQuotes) {
            current += '\n';
            i++;
        } else {
            break;
        }
    }
    
    result.push(current.trim());
    return { fields: result, nextIndex: i + 1 };
}

// 读取并解析整个CSV
function readCSV() {
    if (!fs.existsSync(CSV_FILE)) {
        return { headers: [], data: [] };
    }
    
    let content = fs.readFileSync(CSV_FILE, 'utf8');
    content = removeBOM(content); // 去掉 BOM
    
    const lines = content.split('\n').filter(line => line.trim() !== '');
    
    if (lines.length === 0) {
        return { headers: [], data: [] };
    }
    
    const headerResult = parseCSVLine(lines, 0);
    let index = headerResult.nextIndex;
    const data = [];
    let rowNum = 1;
    
    while (index < lines.length) {
        const rowResult = parseCSVLine(lines, index);
        const fields = rowResult.fields;
        
        if (fields.length >= 4) {
            data.push({
                index: rowNum++,
                id: fields[0] || '',
                knowledgeType: fields[1] || '',
                questionStem: fields[2] || '',
                questionType: fields[3] || '',
                questionContent: fields[4] || '',
                optionA: fields[5] || '',
                optionB: fields[6] || '',
                optionC: fields[7] || '',
                optionD: fields[8] || '',
                answer: fields[9] || '',
                analysis: fields[10] || ''
            });
        }
        
        index = rowResult.nextIndex;
    }
    
    return { headers: headerResult.fields, data };
}

// 获取题目列表
app.get('/api/questions/list', (req, res) => {
    try {
        const result = readCSV();
        res.json({ success: true, data: result.data });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// 更新所有题目数据（重写CSV）
app.post('/api/questions/update-all', (req, res) => {
    try {
        const data = req.body;
        if (!Array.isArray(data)) {
            return res.status(400).json({ success: false, error: '请求体必须是数组' });
        }

        const oldQuestions = readCSV().data;
        syncLabelIds(oldQuestions, data);

        const BOM = '\uFEFF';
        const headers = ['ID', '知识类型', '题干', '题目类型', '题目内容', '选项A', '选项B', '选项C', '选项D', '正确答案', '解析'];
        let csvContent = BOM + headers.join(',') + '\n';
        
        for (const item of data) {
            const row = [
                item.id,
                item.knowledgeType,
                item.questionStem,
                item.questionType,
                item.questionContent,
                item.optionA,
                item.optionB,
                item.optionC,
                item.optionD,
                item.answer,
                item.analysis
            ];
            csvContent += row.map(escapeCSV).join(',') + '\n';
        }
        
        fs.writeFileSync(CSV_FILE, csvContent, 'utf8');
        res.json({ success: true, message: 'CSV已更新' });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

app.get('/api/labels', (req, res) => {
    try {
        initLabelCSV();
        const data = readLabelCSV();
        res.json({ success: true, data });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

app.post('/api/labels', (req, res) => {
    try {
        const { id, label } = req.body;
        if (!id) {
            return res.status(400).json({ success: false, error: 'ID不能为空' });
        }
        const normalizedId = String(id).trim();
        if (!normalizedId) {
            return res.status(400).json({ success: false, error: 'ID不能为空' });
        }

        const questionList = readCSV().data;
        if (!questionList.some(q => String(q.id) === normalizedId)) {
            return res.status(400).json({ success: false, error: '题目ID不存在' });
        }

        initLabelCSV();
        const labels = readLabelCSV();
        const existingIndex = labels.findIndex(item => item.id === normalizedId);
        if (existingIndex !== -1) {
            labels[existingIndex].label = label || '';
        } else {
            labels.push({ id: normalizedId, label: label || '' });
        }

        writeLabelCSV(labels);
        res.json({ success: true, message: '标签已保存' });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// 静态文件服务：提供PDF文件访问
app.use('/pdfs', express.static(path.join(__dirname, 'pdfs')));

// 获取PDF文件列表
app.get('/api/pdfs', (req, res) => {
    const pdfDir = path.join(__dirname, 'pdfs');
    fs.readdir(pdfDir, (err, files) => {
        if (err) {
            return res.status(500).json({ error: '无法读取PDF文件夹' });
        }
        const pdfs = files.filter(file => file.endsWith('.pdf'));
        res.json({ pdfs });
    });
});

// 静态文件服务：提供知识点PDF文件访问
app.use('/know-pdfs', express.static(path.join(__dirname, 'know-pdfs')));

// 获取知识点PDF文件列表
app.get('/api/know-pdfs', (req, res) => {
    const pdfDir = path.join(__dirname, 'know-pdfs');
    fs.readdir(pdfDir, (err, files) => {
        if (err) {
            return res.status(500).json({ error: '无法读取知识点PDF文件夹' });
        }
        const pdfs = files.filter(file => file.endsWith('.pdf'));
        res.json({ pdfs });
    });
});

app.listen(3000, () => {
    console.log('Server running on http://localhost:3000');
});
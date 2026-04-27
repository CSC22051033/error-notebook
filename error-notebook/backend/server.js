// server.js
const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const CSV_FILE = path.join(__dirname, 'questions.csv');

// 去掉 BOM 的辅助函数
function removeBOM(content) {
    if (content.charCodeAt(0) === 0xFEFF) {
        return content.slice(1);
    }
    return content;
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
    
    const lines = content.split('\n').filter(line => line.trim() !== '');
    
    if (lines.length <= 1) {
        return 1;
    }
    
    let maxId = 0;
    for (let i = 1; i < lines.length; i++) {
        const line = lines[i];
        if (!line.trim()) continue;
        
        const firstComma = line.indexOf(',');
        const idStr = firstComma > -1 ? line.substring(0, firstComma) : line;
        const id = parseInt(idStr, 10);
        
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
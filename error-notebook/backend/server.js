// server.js
const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const CSV_FILE = path.join(__dirname, 'questions.csv');

// 确保CSV文件存在，不存在则创建表头
function initCSV() {
    if (!fs.existsSync(CSV_FILE)) {
        const BOM = '\uFEFF';
        const headers = ['知识类型', '题干', '题目类型', '题目内容', '选项A', '选项B', '选项C', '选项D', '正确答案', '解析'];
        fs.writeFileSync(CSV_FILE, BOM + headers.join(',') + '\n', 'utf8');
    }
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
        const row = [
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
        
        res.json({ success: true, message: '数据已追加到CSV' });
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

// 获取所有数据
app.get('/api/questions', (req, res) => {
    if (!fs.existsSync(CSV_FILE)) {
        return res.json([]);
    }
    const content = fs.readFileSync(CSV_FILE, 'utf8');
    const lines = content.split('\n').filter(line => line.trim());
    res.json({ data: lines });
});

// 在 app.listen 之前添加

// 解析CSV行（处理引号内的逗号）
function parseCSVLine(line) {
    const result = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
            if (inQuotes && line[i + 1] === '"') {
                current += '"';
                i++;
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
    result.push(current.trim());
    return result;
}

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
    
    const content = fs.readFileSync(CSV_FILE, 'utf8');
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
        
        if (fields.length >= 3) {
            data.push({
                index: rowNum++,
                knowledgeType: fields[0] || '',
                questionStem: fields[1] || '',
                questionType: fields[2] || ''
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

app.listen(3000, () => {
    console.log('Server running on http://localhost:3000');
});
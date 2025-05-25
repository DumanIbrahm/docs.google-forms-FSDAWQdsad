const express = require('express');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const app = express();
require('dotenv').config();
const pool = require('./db'); // PostgreSQL bağlantısı

app.use(cors());

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname);
    }
});

const upload = multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        const allowedTypes = ['.pdf', '.doc', '.docx'];
        const ext = path.extname(file.originalname).toLowerCase();
        if (allowedTypes.includes(ext)) {
            cb(null, true);
        } else {
            cb(new Error('Yalnızca .pdf, .doc, .docx dosyaları yüklenebilir.'));
        }
    }
});

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.post('/submit', upload.single('cv'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ message: 'Dosya yüklenemedi' });

        const { fullname, studentId, grade, department, phone } = req.body;
        const filename = req.file.filename;
        const createdAt = new Date();

        const query = `
            INSERT INTO submissions (fullname, student_id, grade, department, phone, cv_filename, created_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
        `;
        const values = [fullname, studentId, grade, department, phone, filename, createdAt];

        await pool.query(query, values);

        res.status(200).json({
            message: 'Başarılı',
            filename: filename
        });
    } catch (err) {
        console.error('🚨 Hata:', err.message);
        res.status(500).json({ message: 'Başvuru kaydedilemedi: ' + err.message });
    }
});

app.get('/applications', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM submissions ORDER BY created_at DESC');
        res.status(200).json(result.rows);
    } catch (err) {
        res.status(500).json({ message: 'Veriler okunamadı: ' + err.message });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`✅ Server running on port ${PORT}`);
});

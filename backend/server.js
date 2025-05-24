const express = require('express');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const app = express();

// CORS middleware
app.use(cors());

// Dosya yüklemeleri için klasör
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads'); // uploads klasörü
    },
    filename: (req, file, cb) => {
        const uniqueName = Date.now() + '-' + file.originalname;
        cb(null, uniqueName);
    }
});

const upload = multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
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

// Yüklenen dosyaları erişilebilir yap
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Ana endpoint
const fs = require('fs');
const FORM_DATA_FILE = 'form-data.json';

app.post('/submit', upload.single('cv'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: 'Dosya yüklenemedi' });
    }

    const { fullname, studentId, grade, department, phone } = req.body;
    const entry = {
        fullname,
        studentId,
        grade,
        department,
        phone,
        filename: req.file.filename,
        createdAt: new Date()
    };

    // JSON dosyasına kaydet
    let allData = [];
    try {
        if (fs.existsSync(FORM_DATA_FILE)) {
            allData = JSON.parse(fs.readFileSync(FORM_DATA_FILE, 'utf8'));
        }
        allData.push(entry);
        fs.writeFileSync(FORM_DATA_FILE, JSON.stringify(allData, null, 2));
    } catch (err) {
        return res.status(500).json({ message: 'Başvuru kaydedilemedi: ' + err.message });
    }

    res.status(200).json({
        message: 'Başarılı',
        filename: req.file.filename
    });
});


app.get('/applications', (req, res) => {
    try {
        const data = fs.existsSync(FORM_DATA_FILE)
            ? JSON.parse(fs.readFileSync(FORM_DATA_FILE, 'utf8'))
            : [];
        res.status(200).json(data);
    } catch (err) {
        res.status(500).json({ message: 'Veriler okunamadı' });
    }
});

// Sunucuyu başlat
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

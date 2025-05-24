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
app.post('/submit', upload.single('cv'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: 'Dosya yüklenemedi' });
    }

    // İsteğe bağlı: diğer form verilerini al
    const { fullname, studentId, grade, department, phone } = req.body;

    // DB işlemi burada yapılabilir
    console.log('Form verisi:', { fullname, studentId, grade, department, phone });

    // Geriye dosya ismini dön
    res.status(200).json({
        message: 'Başarılı',
        filename: req.file.filename
    });
});

// Sunucuyu başlat
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

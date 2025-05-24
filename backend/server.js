const express = require("express");
const multer = require("multer");
const cors = require("cors");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;


// CORS ve JSON parser
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CV dosyaları için uploads klasörü ayarlanıyor
const uploadDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
}

// Multer ile dosya yükleme ayarı
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        const uniqueName = Date.now() + "-" + file.originalname;
        cb(null, uniqueName);
    },
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB sınırı
});

// POST endpoint: form verilerini alır ve kaydeder
app.post("/submit", upload.single("cv"), (req, res) => {
    const { fullname, studentId, grade, department, phone } = req.body;

    if (!fullname || !studentId || !grade || !department || !phone) {
        return res.status(400).json({ message: "Tüm alanlar zorunludur." });
    }

    const formData = {
        fullname,
        studentId,
        grade,
        department,
        phone,
        cvFilename: req.file ? req.file.filename : null,
        submittedAt: new Date().toISOString()
    };

    const filePath = path.join(__dirname, "form-data.json");

    // JSON dosyasına ekleme
    try {
        fs.appendFileSync(filePath, JSON.stringify(formData) + "\n");
        res.status(200).json({ message: "Başvuru başarıyla kaydedildi." });
    } catch (err) {
        console.error("Kaydetme hatası:", err);
        res.status(500).json({ message: "Sunucu hatası." });
    }
});

// Sunucuyu başlat
app.listen(PORT, () => {
    console.log(`🚀 Server http://localhost:${PORT} adresinde çalışıyor`);
});

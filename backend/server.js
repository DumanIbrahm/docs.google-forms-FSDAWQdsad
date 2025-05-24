const express = require("express");
const multer = require("multer");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const { Pool } = require("pg");

const app = express();
const PORT = process.env.PORT || 3000;
require('dotenv').config();
const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
// CORS ve JSON parser
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CV dosyaları için uploads klasörü
const uploadDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
}

// Statik dosya sunumu
app.use("/uploads", express.static(uploadDir));

// Multer setup
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        const uniqueName = Date.now() + "-" + file.originalname;
        cb(null, uniqueName);
    },
});
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } });

// POST /submit
app.post("/submit", upload.single("cv"), async (req, res) => {
    const { fullname, studentId, grade, department, phone } = req.body;
    const cvFilename = req.file ? req.file.filename : null;

    if (!fullname || !studentId || !grade || !department || !phone) {
        return res.status(400).json({ message: "Tüm alanlar zorunludur." });
    }

    try {
        await pool.query(
            `INSERT INTO submissions (fullname, student_id, grade, department, phone, cv_filename, submitted_at) 
             VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
            [fullname, studentId, grade, department, phone, cvFilename]
        );
        res.status(200).json({ message: "Başvuru başarıyla kaydedildi." });
    } catch (err) {
        console.error("Veritabanı hatası:", err);
        res.status(500).json({ message: "Sunucu hatası." });
    }
});



// GET /submissions
app.get("/submissions", async (req, res) => {
    try {
        const result = await pool.query("SELECT * FROM submissions ORDER BY submitted_at DESC");
        res.status(200).json(result.rows);
    } catch (err) {
        console.error("Veritabanı okuma hatası:", err);
        res.status(500).json({ message: "Veri alınamadı." });
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Server http://localhost:${PORT} adresinde çalışıyor`);
});

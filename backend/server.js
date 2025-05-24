const express = require("express");
const multer = require("multer");
const cors = require("cors");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;
const pool = require("./db");


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

    if (!fullname || !studentId || !grade || !department || !phone) {
        return res.status(400).json({ message: "Tüm alanlar zorunludur." });
    }

    const cvFilename = req.file?.filename || null;

    try {
        await pool.query(
            `INSERT INTO submissions (fullname, student_id, grade, department, phone, cv_filename)
             VALUES ($1, $2, $3, $4, $5, $6)`,
            [fullname, studentId, grade, department, phone, cvFilename]
        );

        res.status(200).json({ message: "Veri başarıyla kaydedildi." });
    } catch (error) {
        console.error("DB hata:", error);
        res.status(500).json({ message: "Veritabanı hatası." });
    }
});


// GET /submissions
app.get("/submissions", (req, res) => {
    const filePath = path.join(__dirname, "form-data.json");

    try {
        if (!fs.existsSync(filePath)) {
            return res.status(200).json([]);
        }

        const rawData = fs.readFileSync(filePath, "utf-8");
        const lines = rawData.trim().split("\n").filter(Boolean);
        const jsonData = lines.map(line => JSON.parse(line));

        res.status(200).json(jsonData);
    } catch (err) {
        console.error("Veri okunamadı:", err);
        res.status(500).json({ message: "Veri okunamadı." });
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Server http://localhost:${PORT} adresinde çalışıyor`);
});

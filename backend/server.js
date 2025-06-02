const express = require('express');
const cors = require('cors');
require('dotenv').config();
const pool = require('./db');
const { storage } = require('./cloudinary');
const multer = require('multer');
const upload = multer({ storage });

const app = express();
app.use(cors());
app.use(express.static('public'));

app.post('/submit', upload.single('cv'), async (req, res) => {
    try {
        console.log("Gelen veri:", JSON.stringify(req.body, null, 2));
        console.log("Yüklenen dosya:", JSON.stringify(req.file, null, 2));

        const { fullname, studentId, grade, department, phone } = req.body;
        const fileUrl = req.file.path;
        const createdAt = new Date();

        const query = `
            INSERT INTO submissions (fullname, student_id, grade, department, phone, cv_filename, submitted_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
        `;
        const values = [fullname, studentId, grade, department, phone, fileUrl, createdAt];

        await pool.query(query, values);

        res.status(200).json({ message: 'Başarılı', fileUrl });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Başvuru kaydedilemedi: ' + err.message });
    }
});

app.get('/applications', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM submissions ORDER BY submitted_at DESC');
        res.status(200).json(result.rows);
    } catch (err) {
        res.status(500).json({ message: 'Veriler okunamadı: ' + err.message });
    }
});
const jwt = require('jsonwebtoken');
app.use(express.json());

const ADMIN_EMAIL = "admin@phishing.com";
const ADMIN_PASSWORD = "Passw0rd!";

app.post('/login', (req, res) => {
    const { email, password } = req.body;

    if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
        const token = jwt.sign({ email }, process.env.JWT_SECRET || "supersecret", { expiresIn: '2h' });
        return res.json({ token });
    }

    return res.status(401).json({ message: "Geçersiz kullanıcı adı veya şifre." });
});
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`✅ Server running on port ${PORT}`);
});

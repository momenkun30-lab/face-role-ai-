const express = require('express');
const path = require('path');
const multer = require('multer');
const fs = require('fs');

const app = express();
app.use(express.json());
app.use(express.static(__dirname));
app.use('/uploads', express.static('uploads'));

const upload = multer({ dest: 'uploads/' });

let siteData = {
    totalViews: 0,
    liveNow: 1,
    currentAd: ""
};

// إحصائيات الموقع
app.get('/api/site-data', (req, res) => {
    siteData.totalViews++;
    // محاكاة المتصلين حالياً
    siteData.liveNow = Math.floor(Math.random() * 5) + 1;
    res.json(siteData);
});

// استقبال صورة الإعلان
app.post('/api/upload-ad', upload.single('adImage'), (req, res) => {
    if (req.file) {
        siteData.currentAd = `/uploads/${req.file.filename}`;
        res.json({ success: true });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    if (!fs.existsSync('./uploads')) fs.mkdirSync('./uploads');
    console.log("Server is running...");
});

const express = require('express');
const path = require('path');
const multer = require('multer');
const fs = require('fs');

const app = express();
app.use(express.json());
app.use(express.static(__dirname));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// إعداد نظام رفع الصور
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const dir = './uploads';
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        cb(null, 'ad-' + Date.now() + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage });

// متغيرات النظام القابلة للتحكم من لوحة الإدارة
let config = {
    totalViews: 113000,
    activeUsers: 9452,
    currentAd: "",
    nextAd: "",
    adSwitchTime: null // توقيت التبديل التلقائي
};

// 1. جلب بيانات الموقع (للواجهة الرئيسية)
app.get('/api/site-data', (req, res) => {
    // زيادة تلقائية بسيطة لضمان حركة الأرقام
    config.totalViews += Math.floor(Math.random() * 3);
    
    // فحص إذا كان هناك إعلان مجدول يجب تفعيله الآن
    if (config.adSwitchTime && Date.now() >= config.adSwitchTime) {
        if (config.nextAd) {
            config.currentAd = config.nextAd;
            config.nextAd = "";
        }
        config.adSwitchTime = null;
    }

    res.json({
        totalViews: config.totalViews,
        activeUsers: config.activeUsers,
        currentAd: config.currentAd
    });
});

// 2. رفع إعلان جديد (فوري أو قادم)
app.post('/api/upload-ad', upload.single('adImage'), (req, res) => {
    if (req.file) {
        const adPath = `/uploads/${req.file.filename}`;
        // إذا كان هناك إعلان حالي، ضعه كإعلان قادم، وإلا ضعه كحالي
        if (!config.currentAd) {
            config.currentAd = adPath;
        } else {
            config.nextAd = adPath;
        }
        res.json({ success: true, url: adPath });
    } else {
        res.status(400).json({ success: false });
    }
});

// 3. حذف الإعلان الحالي
app.post('/api/delete-ad', (req, res) => {
    config.currentAd = "";
    config.nextAd = "";
    config.adSwitchTime = null;
    res.json({ success: true });
});

// 4. تحديث الإحصائيات يدوياً من لوحة التحكم
app.post('/api/update-manual-stats', (req, res) => {
    const { type, value } = req.body;
    const numValue = parseInt(value);
    
    if (type === 'total') config.totalViews = numValue;
    if (type === 'active') config.activeUsers = numValue;
    
    res.json({ success: true });
});

// 5. ضبط مؤقت تبديل الإعلان (بالدقائق)
app.post('/api/set-timer', (req, res) => {
    const { minutes } = req.body;
    if (minutes > 0) {
        config.adSwitchTime = Date.now() + (minutes * 60 * 1000);
        res.json({ success: true, switchAt: new Date(config.adSwitchTime).toLocaleTimeString() });
    } else {
        res.status(400).json({ success: false });
    }
});

// تشغيل السيرفر
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    if (!fs.existsSync('./uploads')) fs.mkdirSync('./uploads');
    console.log(`
    =============================================
    🚀 سيرفر Face Role AI المطور يعمل الآن!
    📍 المنفذ: ${PORT}
    🔐 كلمة سر الإدارة: SDaderta
    =============================================
    `);
});

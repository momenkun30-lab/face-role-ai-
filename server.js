const express = require('express');
const path = require('path');
const multer = require('multer');
const fs = require('fs');

const app = express();
app.use(express.json());

// جعل المجلد الرئيسي ومجلد الرفع متاحين للجميع
app.use(express.static(__dirname));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// إعداد نظام رفع الصور (Multer)
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const dir = './uploads';
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        // حفظ الصورة باسم فريد مع الاحتفاظ بالامتداد
        cb(null, 'ad-' + Date.now() + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage });

// متغيرات النظام الإحصائية
let totalViewsCount = 0; // الزيارات التي حدثت منذ تشغيل السيرفر (تُضاف للـ 113 ألف في الواجهة)
let currentAdPath = ""; // سيتم تخزين رابط الإعلان المرفوع هنا

// 1. نقطة نهاية لجلب بيانات الموقع (الزيارات والإعلانات)
app.get('/api/site-data', (req, res) => {
    // زيادة حقيقية طفيفة مع كل طلب لضمان عدم النقصان
    totalViewsCount += Math.floor(Math.random() * 2) + 1;
    
    res.json({
        totalViews: totalViewsCount,
        currentAd: currentAdPath
    });
});

// 2. نقطة نهاية لرفع الإعلان الجديد (من صفحة admin.html)
app.post('/api/upload-ad', upload.single('adImage'), (req, res) => {
    if (req.file) {
        currentAdPath = `/uploads/${req.file.filename}`;
        console.log("تم تحديث الإعلان بنجاح:", currentAdPath);
        res.json({ success: true, url: currentAdPath });
    } else {
        res.status(400).json({ success: false, message: "فشل رفع الصورة" });
    }
});

// 3. توجيه المستخدمين لصفحة الواجهة الرئيسية
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// 4. توجيه للإدارة (يتم طلب الباسوورد في الواجهة الأمامية أولاً)
app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'admin.html'));
});

// تشغيل السيرفر
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    // إنشاء مجلد uploads تلقائياً إذا لم يكن موجوداً عند بدء التشغيل
    if (!fs.existsSync('./uploads')) {
        fs.mkdirSync('./uploads');
    }
    console.log(`========================================`);
    console.log(`🚀 Face Role AI Server is LIVE!`);
    console.log(`📍 Port: ${PORT}`);
    console.log(`🔐 Admin Password: SDaderta`);
    console.log(`========================================`);
});

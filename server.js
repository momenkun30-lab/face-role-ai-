const express = require('express');
const path = require('path');
const multer = require('multer');
const fs = require('fs');

const app = express();
const DATA_FILE = './site-config.json'; // ملف حفظ البيانات الدائم

app.use(express.json());
app.use(express.static(__dirname));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// --- 1. نظام تتبع المستخدمين الحقيقيين ---
let realActiveUsers = new Set(); 

// --- 2. إدارة البيانات (حفظ وتحميل) ---
function saveConfig(config) {
    try {
        fs.writeFileSync(DATA_FILE, JSON.stringify(config, null, 2));
    } catch (err) {
        console.error("خطأ في حفظ البيانات:", err);
    }
}

function loadConfig() {
    if (!fs.existsSync(DATA_FILE)) {
        const initial = { totalViews: 113000, activeUsers: 9452, currentAd: "" };
        saveConfig(initial);
        return initial;
    }
    return JSON.parse(fs.readFileSync(DATA_FILE));
}

let config = loadConfig();

// --- 3. إعداد رفع الصور (الإعلانات) ---
const storage = multer.diskStorage({
    destination: './uploads',
    filename: (req, file, cb) => {
        cb(null, 'ad-' + Date.now() + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage });

// --- 4. المسارات البرمجية (APIs) ---

// جلب بيانات الموقع + تتبع الزوار الحقيقيين
app.get('/api/site-data', (req, res) => {
    // تتبع الـ IP للمستخدم الحالي
    const userIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    realActiveUsers.add(userIp);

    // اعتبار المستخدم غير نشط بعد 30 ثانية من آخر طلب
    setTimeout(() => { realActiveUsers.delete(userIp); }, 30000);

    // زيادة وهمية طفيفة للإحصائيات
    config.totalViews += Math.floor(Math.random() * 2);

    res.json({
        ...config,
        realUsersCount: realActiveUsers.size // إرسال عدد المستخدمين الحقيقيين
    });
});

// رفع إعلان جديد
app.post('/api/upload-ad', upload.single('adImage'), (req, res) => {
    if (req.file) {
        config.currentAd = `/uploads/${req.file.filename}`;
        saveConfig(config);
        res.json({ success: true });
    }
});

// تحديث الإحصائيات (الوهمية) يدوياً
app.post('/api/update-manual-stats', (req, res) => {
    const { type, value } = req.body;
    if (type === 'total') config.totalViews = parseInt(value);
    if (type === 'active') config.activeUsers = parseInt(value);
    saveConfig(config);
    res.json({ success: true });
});

// حذف الإعلان
app.post('/api/delete-ad', (req, res) => {
    config.currentAd = "";
    saveConfig(config);
    res.json({ success: true });
});

// --- 5. تشغيل السيرفر ---
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    if (!fs.existsSync('./uploads')) fs.mkdirSync('./uploads');
    console.log(`
    =============================================
    ✅ السيرفر المكتمل يعمل الآن
    👥 نظام تتبع الحقيقيين: مفعل
    💾 التخزين الدائم: مفعل
    =============================================
    `);
});

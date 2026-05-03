const express = require('express');
const path = require('path');
const multer = require('multer');
const fs = require('fs');

const app = express();
const DATA_FILE = './site-config.json';

app.use(express.json());
app.use(express.static(__dirname));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// نظام تتبع المستخدمين الحقيقيين (Active Sessions)
let realActiveUsers = new Set();

// --- إدارة البيانات الدائمة ---
function saveConfig(config) {
    try {
        fs.writeFileSync(DATA_FILE, JSON.stringify(config, null, 2));
    } catch (err) {
        console.error("خطأ في حفظ البيانات:", err);
    }
}

function loadConfig() {
    if (!fs.existsSync(DATA_FILE)) {
        const initial = { 
            totalViews: 113000, 
            activeUsers: 9452, 
            ads: [] // مصفوفة الإعلانات المجدولة
        };
        saveConfig(initial);
        return initial;
    }
    try {
        return JSON.parse(fs.readFileSync(DATA_FILE));
    } catch (err) {
        return { totalViews: 113000, activeUsers: 9452, ads: [] };
    }
}

let config = loadConfig();

// --- إعدادات رفع الصور (Multer) ---
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

// --- المسارات البرمجية (APIs) ---

// 1. جلب بيانات الموقع وتتبع النشاط الحقيقي
app.get('/api/site-data', (req, res) => {
    // تتبع الـ IP للمستخدم
    const userIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    realActiveUsers.add(userIp);

    // إزالة المستخدم من القائمة بعد 30 ثانية من الخمول
    setTimeout(() => { realActiveUsers.delete(userIp); }, 30000);

    // زيادة وهمية بسيطة للزيارات
    config.totalViews += Math.floor(Math.random() * 2);

    res.json({
        ...config,
        realUsersCount: realActiveUsers.size
    });
});

// 2. رفع إعلان جديد مع الجدولة الزمنية
app.post('/api/upload-ad', upload.single('adImage'), (req, res) => {
    const { startTime, endTime } = req.body;
    
    if (req.file && startTime && endTime) {
        const newAd = {
            id: Date.now(),
            url: `/uploads/${req.file.filename}`,
            start: startTime, // تنسيق HH:mm
            end: endTime      // تنسيق HH:mm
        };
        
        config.ads.push(newAd); // إضافة الإعلان للقائمة
        saveConfig(config);
        res.json({ success: true });
    } else {
        res.status(400).json({ success: false, message: "بيانات ناقصة" });
    }
});

// 3. حذف إعلان معين من القائمة
app.post('/api/delete-ad', (req, res) => {
    const { id } = req.body;
    if (!id) return res.status(400).json({ success: false });

    // تصفية المصفوفة لإزالة الإعلان المطلوب
    config.ads = config.ads.filter(ad => ad.id !== parseInt(id));
    saveConfig(config);
    res.json({ success: true });
});

// 4. تحديث الإحصائيات اليدوية (الرقم الوهمي)
app.post('/api/update-manual-stats', (req, res) => {
    const { type, value } = req.body;
    if (type === 'total') config.totalViews = parseInt(value);
    if (type === 'active') config.activeUsers = parseInt(value);
    
    saveConfig(config);
    res.json({ success: true });
});

// --- تشغيل السيرفر ---
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    if (!fs.existsSync('./uploads')) fs.mkdirSync('./uploads');
    console.log(`
    =============================================
    🚀 السيرفر المطور يعمل بنجاح
    📅 نظام جدولة الإعلانات: مفعل
    👥 تتبع المستخدمين الحقيقيين: مفعل
    💾 قاعدة بيانات JSON: متصلة
    =============================================
    `);
});

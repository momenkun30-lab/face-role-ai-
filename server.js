const express = require('express');
const path = require('path');
const multer = require('multer');
const fs = require('fs');

const app = express();
const DATA_FILE = './site-config.json';

app.use(express.json());
app.use(express.static(__dirname));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ذاكرة مؤقتة للزوار الحقيقيين
let realActiveUsers = new Set();

// --- 1. محرك المحاكاة الواقعي (التحديث التلقائي للأرقام) ---

function startSimulation() {
    // تحديث إجمالي الزيارات كل دقيقتين (زيادة بـ 300 أو أكثر)
    setInterval(() => {
        const extraViews = Math.floor(Math.random() * 150) + 300; // زيادة عشوائية بين 300 و 450
        config.totalViews += extraViews;
        saveConfig(config);
        console.log(`[Simulation] Views increased by ${extraViews}. Total: ${config.totalViews}`);
    }, 120000); // 120,000ms = 2 minutes

    // تحديث المتصلين الآن كل دقيقة (تذبذب واقعي: زيادة ونقصان)
    setInterval(() => {
        // مصفوفة التغيرات المطلوبة: [10, -1, 5, -6, 26, ...]
        const behavior = [10, -1, 5, -6, 26, 12, -8, 33, -4, 18];
        const randomChange = behavior[Math.floor(Math.random() * behavior.length)];
        
        config.activeUsers += randomChange;

        // حماية: التأكد من أن الرقم لا ينزل عن مستوى معين ويستمر في الصعود الطردي
        if (config.activeUsers < 2000) config.activeUsers += 150;
        
        saveConfig(config);
        console.log(`[Simulation] Active users changed by (${randomChange}). Current: ${config.activeUsers}`);
    }, 60000); // 60,000ms = 1 minute
}

// --- 2. إدارة ملف الإعدادات (التخزين الدائم) ---

function saveConfig(config) {
    try {
        fs.writeFileSync(DATA_FILE, JSON.stringify(config, null, 2));
    } catch (err) {
        console.error("Error saving config:", err);
    }
}

function loadConfig() {
    if (!fs.existsSync(DATA_FILE)) {
        const initial = { 
            totalViews: 150000, 
            activeUsers: 8400, 
            ads: [] 
        };
        saveConfig(initial);
        return initial;
    }
    try {
        return JSON.parse(fs.readFileSync(DATA_FILE));
    } catch (err) {
        return { totalViews: 150000, activeUsers: 8400, ads: [] };
    }
}

let config = loadConfig();
startSimulation(); // تفعيل نظام المحاكاة فور التشغيل

// --- 3. إعدادات رفع صور الإعلانات ---

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const dir = './uploads';
        if (!fs.existsSync(dir)) fs.mkdirSync(dir);
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        cb(null, 'ad-' + Date.now() + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage });

// --- 4. المسارات البرمجية (APIs) ---

// جلب بيانات الموقع ومراقبة الزوار الحقيقيين
app.get('/api/site-data', (req, res) => {
    const userIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    realActiveUsers.add(userIp);

    // إزالة المستخدم الحقيقي من القائمة بعد 30 ثانية من الخمول
    setTimeout(() => { realActiveUsers.delete(userIp); }, 30000);

    res.json({
        ...config,
        realUsersCount: realActiveUsers.size
    });
});

// رفع إعلان مجدول
app.post('/api/upload-ad', upload.single('adImage'), (req, res) => {
    const { startTime, endTime } = req.body;
    if (req.file && startTime && endTime) {
        const newAd = {
            id: Date.now(),
            url: `/uploads/${req.file.filename}`,
            start: startTime,
            end: endTime
        };
        config.ads.push(newAd);
        saveConfig(config);
        res.json({ success: true });
    } else {
        res.status(400).json({ success: false });
    }
});

// حذف إعلان
app.post('/api/delete-ad', (req, res) => {
    const { id } = req.body;
    config.ads = config.ads.filter(ad => ad.id !== parseInt(id));
    saveConfig(config);
    res.json({ success: true });
});

// تحديث الإحصائيات يدوياً من لوحة التحكم
app.post('/api/update-manual-stats', (req, res) => {
    const { type, value } = req.body;
    if (type === 'total') config.totalViews = parseInt(value);
    if (type === 'active') config.activeUsers = parseInt(value);
    saveConfig(config);
    res.json({ success: true });
});

// --- 5. تشغيل السيرفر ---
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`
    =============================================
    ✅ Face Role AI Server is LIVE
    🌐 Port: ${PORT}
    🤖 Simulation: ACTIVE (Auto-increase stats)
    📅 Ads Scheduler: READY
    =============================================
    `);
});

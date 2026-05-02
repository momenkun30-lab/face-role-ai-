const express = require('express');
const path = require('path');
const app = express();

app.use(express.json());
// السماح بالوصول للملفات في المجلد الرئيسي
app.use(express.static(__dirname));

// قاعدة بيانات بسيطة في الذاكرة
let siteConfig = {
    announcement: "مرحباً بك في Face Role AI! اكتشف شخصيتك السينمائية الآن 🎬",
    stats: { users: 1250, analyses: 5430 }
};

// نقطة نهاية لجلب الإعدادات (API)
app.get('/api/config', (req, res) => {
    res.json(siteConfig);
});

// استقبال طلبات تحديث الإحصائيات
app.post('/api/analyze', (req, res) => {
    siteConfig.stats.analyses++;
    siteConfig.stats.users += 1;
    res.json({ success: true, stats: siteConfig.stats });
});

// توجيه أي رابط للملف الرئيسي
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Face Role AI is LIVE on port ${PORT}`));

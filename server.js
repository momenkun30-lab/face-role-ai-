const express = require('express');
const path = require('path');
const multer = require('multer');
const fs = require('fs');

const app = express();
app.use(express.json());
app.use(express.static(__dirname));
app.use('/uploads', express.static('uploads'));

const upload = multer({ dest: 'uploads/' });

// إحصائيات تبدأ من الأرقام التي حددتها
let totalViews = 113000; 

app.get('/api/site-data', (req, res) => {
    // زيادة حقيقية طفيفة مع كل طلب لجعل الرقم في تصاعد دائم
    totalViews += Math.floor(Math.random() * 3) + 1;
    
    // إرسال البيانات للمتصفح (المتصفح سيتولى حساب الخوارزمية الرياضية للمتصلين الآن)
    res.json({
        totalViews: totalViews,
        currentAd: global.currentAd || ""
    });
});

app.post('/api/upload-ad', upload.single('adImage'), (req, res) => {
    if (req.file) {
        global.currentAd = `/uploads/${req.file.filename}`;
        res.json({ success: true });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    if (!fs.existsSync('./uploads')) fs.mkdirSync('./uploads');
    console.log("Server is running...");
});

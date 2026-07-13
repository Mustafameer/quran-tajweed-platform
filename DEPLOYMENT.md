# دليل النشر على السيرفر السحابي

## الاختبار المحلي مع HTTPS (ngrok)

لاختبار الميكروفون على الموبايل محلياً بدون سيرفر سحابي:

### 1. تثبيت ngrok

```bash
# على Windows
choco install ngrok

# على macOS
brew install ngrok

# على Linux
wget https://bin.equinox.io/c/bNyj1mQVY4c/ngrok-v3-stable-linux-amd64.tgz
tar xvzf ngrok-v3-stable-linux-amd64.tgz
sudo mv ngrok /usr/local/bin
```

### 2. تسجيل الدخول

```bash
ngrok authtoken YOUR_AUTH_TOKEN
```

### 3. تشغيل السيرفر المحلي

```bash
npm run dev
```

### 4. تشغيل ngrok

في نافذة جديدة:

```bash
ngrok http 3000
```

سيظهر رابط HTTPS مثل: `https://abc123.ngrok-free.app`

### 5. استخدام الرابط على الموبايل

- افتح الرابط على الموبايل
- الميكروفون سيعمل لأنه HTTPS
- لا حاجة لتغيير الكود!

### 6. تحديث .env للاختبار

```env
APP_URL="https://abc123.ngrok-free.app"
```

## المتطلبات الأساسية

1. **Node.js** (الإصدار 18 أو أحدث)
2. **npm** أو **yarn**
3. **HTTPS** (مطلوب للوصول للميكروفون على الموبايل)

## الخطوات

### 1. إعداد متغيرات البيئة

أنشئ ملف `.env` في جذر المشروع:

```bash
# نسخ من الملف النموذجي
cp .env.example .env
```

ثم عدل `.env` بالقيم المناسبة:

```env
# مطلوب: مفتاح API لـ Gemini
GEMINI_API_KEY="your_gemini_api_key_here"

# مطلوب: رابط التطبيق (السيرفر السحابي)
APP_URL="https://your-domain.com"

# اختياري: المنفذ (الافتراضي 3000)
PORT=3000

# اختياري: بيئة التشغيل
NODE_ENV=production

# اختياري: خوادم STUN لـ WebRTC (الافتراضي: خوادم Google المجانية)
WEBRTC_STUN_SERVERS="stun:stun.l.google.com:19302,stun:stun1.l.google.com:19302"

# اختياري: توكن بوت التلكرام
TELEGRAM_BOT_TOKEN="your_telegram_bot_token"

# اختياري: اسم بوت التلكرام
TELEGRAM_BOT_NAME="your_bot_username"
```

### 2. تثبيت الاعتماديات

```bash
npm install
```

### 3. بناء المشروع للإنتاج

```bash
npm run build
```

### 4. تشغيل السيرفر

```bash
# التطوير
npm run dev

# الإنتاج
npm start
```

## خيارات النشر

### Option 1: Vercel

1. اربط المستودع بـ Vercel
2. أضف متغيرات البيئة في إعدادات Vercel
3. Vercel سيقوم بالنشر تلقائياً

### Option 2: Railway

1. أنشئ مشروع جديد في Railway
2. اربط المستودع
3. أضف متغيرات البيئة في إعدادات Railway
4. Railway سيقوم بالنشر تلقائياً

### Option 3: VPS (DigitalOcean, AWS, etc.)

```bash
# على السيرفر
git clone your-repo
cd quran-reading-&-tajweed-platform
npm install
npm run build

# استخدام PMM2 للحفاظ على السيرفر يعمل
npm install -g pm2
pm2 start server.ts --name quran-platform
pm2 save
pm2 startup
```

### Option 4: Docker

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

## HTTPS ضروري للموبايل

لأن المتصفحات الحديثة تتطلب HTTPS للوصول للميكروفون:

### استخدام Let's Encrypt (مجاني)

```bash
# على Ubuntu/Debian
sudo apt install certbot
sudo certbot certonly --standalone -d your-domain.com
```

### استخدام Cloudflare

1. أضف نطاقك إلى Cloudflare
2. فعّل SSL/TLS (وضع Full)
3. أشر نطاقك إلى سيرفرك

## قاعدة البيانات

المشروع يستخدم ملف JSON محلي (`data-store.json`). للإنتاج:

- استخدم خدمة استضافة ملفات (مثل AWS S3)
- أو عدل الكود لاستخدام قاعدة بيانات حقيقية (MongoDB, PostgreSQL)

## فحص الصحة

```bash
# فحص أن السيرفر يعمل
curl https://your-domain.com/api/sessions

# فحص logs
pm2 logs quran-platform
```

## استكشاف الأخطاء

### الميكروفون لا يعمل على الموبايل
- تأكد من استخدام HTTPS
- تحقق من إعدادات الميكروفون في المتصفح
- افتح console وابحث عن أخطاء `[WebRTC]`

### WebRTC فشل الاتصال
- تحقق من خوادم STUN
- تأكد من أن جدار الحماية يسمح بمرور UDP
- جرب خوادم TURN (مطلوبة لبعض الشبكات)

### التلكرام لا يعمل
- تحقق من توكن البوت
- تأكد من تعيين webhook صحيح
- تحقق من logs السيرفر

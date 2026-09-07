# Cal.com Integration — Salam Journey

## كيف يعمل الربط

```
العميل يحجز موعد على الموقع
        ↓
POST /api/consultations
        ↓
1. نحفظ الحجز في قاعدة بياناتنا (bookings table)
2. نرسل طلب إلى Cal.com API لإنشاء Booking
3. نحفظ cal_booking_id في قاعدة البيانات
        ↓
Cal.com يرسل تذكير تلقائي بـ24 ساعة (via Workflows)
  → للعميل (Attendee)
  → للأدمن (Admin email)
```

---

## إعداد البيئة (`.env`)

```env
CAL_API_KEY=cal_live_xxxxxxxxxxxxxxxxxxxx
CAL_EVENT_TYPE_ID=123456
CAL_TIMEZONE=Africa/Cairo
CAL_WEBHOOK_SECRET=your_secret_here
```

| المتغير | من أين تحصل عليه |
|---|---|
| `CAL_API_KEY` | cal.com → Settings → Developer → API Keys |
| `CAL_EVENT_TYPE_ID` | الرقم في رابط الـ Event Type: `cal.com/event-types/123456` |
| `CAL_TIMEZONE` | اسم التوقيت (default: `Africa/Cairo`) |
| `CAL_WEBHOOK_SECRET` | cal.com → Settings → Developer → Webhooks → Secret |

> ⚠️ لو `CAL_API_KEY` أو `CAL_EVENT_TYPE_ID` فاضيين، الحجز المحلي هيكمل بدون Cal.com ومفيش خطأ.

---

## إعداد Cal.com يدوياً

### 1. إنشاء Event Type
- cal.com/event-types → New Event Type
- اسم: "استشارة مجانية - Salam Journey"
- مدة: 20 دقيقة
- الأوقات المتاحة: 11:00، 13:00، 17:30، 19:00 (الأحد–الخميس)

### 2. إعداد Workflows (التذكيرات)
- cal.com/workflows → New Workflow
- **للعميل:**
  - Trigger: "Before event starts" → 24 hours
  - Action: Send Email → To Attendee
  - ربطه بالـ Event Type
- **للأدمن:**
  - نفس الإعدادات، لكن Action: Send Email → To specific address
  - الإيميل: `hello@salamjourney.com`

### 3. إعداد Webhook
- cal.com → Settings → Developer → Webhooks → Add Webhook
- URL: `https://your-domain.com/api/cal-webhook`
- Events: `BOOKING_CREATED`, `BOOKING_CANCELLED`, `BOOKING_RESCHEDULED`
- انسخ الـ Secret وضعه في `CAL_WEBHOOK_SECRET`

---

## تغيير توقيت التذكير

من Cal.com مباشرة:
- cal.com/workflows → اختار الـ Workflow → غيّر الـ timing
- لا يوجد أي كود يحتاج تعديل.

---

## إضافة نوع ميعاد جديد

1. على Cal.com: أنشئ Event Type جديد واحصل على ID جديد.
2. في الكود: `CAL_EVENT_TYPE_ID` في `.env` يدعم قيمة واحدة حالياً.
3. لو محتاج أكثر من نوع، عدّل `createCalBooking()` في `artifacts/api-server/src/lib/calcom.ts` عشان يقبل `eventTypeId` كمعامل.

---

## الملفات المُعدَّلة

| الملف | التغيير |
|---|---|
| `lib/db/src/schema/bookings.ts` | إضافة عمود `cal_booking_id` |
| `lib/db/src/schema/consultations.ts` | إضافة عمود `cal_booking_id` |
| `artifacts/api-server/src/lib/calcom.ts` | **جديد** — Cal.com API helper |
| `artifacts/api-server/src/routes/cal-webhook.ts` | **جديد** — Webhook handler |
| `artifacts/api-server/src/routes/giveaway.ts` | إضافة استدعاء Cal.com بعد الحجز |
| `artifacts/api-server/src/routes/index.ts` | تسجيل الـ webhook route |
| `lib/api-spec/openapi.yaml` | إضافة `calBookingId` للـ Consultation schema |
| `artifacts/api-server/.env` | إضافة متغيرات Cal.com |

---

## سلوك الأخطاء

| الحالة | السلوك |
|---|---|
| `CAL_API_KEY` غير موجود | الحجز المحلي يكمل، Cal.com مش مفعّل |
| الـ Slot اتحجز في نفس اللحظة | `409 Conflict` + رسالة عربية، الحجز المحلي يُلغى |
| خطأ في Cal.com (شبكة، إلخ) | الحجز المحلي يُحفظ + تحذير في اللوج |
| Webhook signature غلط | `401 Unauthorized` |

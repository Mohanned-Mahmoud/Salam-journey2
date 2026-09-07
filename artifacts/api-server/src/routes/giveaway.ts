import { and, eq } from "drizzle-orm";
import { Router, type IRouter } from "express";
import {
  CreateConsultationBody,
  CreateConsultationResponse,
  CreateLeadBody,
  CreateLeadResponse,
  ListConsultationSlotsResponse,
} from "@workspace/api-zod";
import {
  consultationsTable,
  db,
  leadsTable,
} from "@workspace/db";

const router: IRouter = Router();
const consultationTimes = ["11:00", "13:00", "17:30", "19:00"];
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const phonePattern = /^(?:\+?20|0)?1[0125]\d{8}$/;

function formatDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getUpcomingDays() {
  const days: Array<{ date: string; label: string; times: string[] }> = [];
  const cursor = new Date();
  cursor.setHours(0, 0, 0, 0);

  while (days.length < 5) {
    cursor.setDate(cursor.getDate() + 1);
    if (cursor.getDay() === 5) {
      continue;
    }

    days.push({
      date: formatDateKey(cursor),
      label: cursor.toLocaleDateString("ar-EG", {
        weekday: "long",
        day: "numeric",
        month: "long",
      }),
      times: [...consultationTimes],
    });
  }

  return days;
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function getDownloadUrl(): string {
  if (process.env.EBOOK_DOWNLOAD_URL) {
    return process.env.EBOOK_DOWNLOAD_URL;
  }

  const domain = process.env.REPLIT_DOMAINS?.split(",")[0];
  return domain
    ? `https://${domain}/images/ebook-blank.jpeg`
    : "https://salamjourney.com";
}

async function sendGiveawayEmail(
  name: string,
  email: string,
): Promise<boolean> {
  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) {
    return false;
  }

  const senderEmail = process.env.BREVO_SENDER_EMAIL ?? "hello@salamjourney.com";
  const senderName = process.env.BREVO_SENDER_NAME ?? "Salam Journey";
  const downloadUrl = getDownloadUrl();
  const safeName = escapeHtml(name);

  const emailResponse = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      "api-key": apiKey,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      sender: { name: senderName, email: senderEmail },
      to: [{ email, name }],
      subject: "دليلك المجاني جاهز | Salam Journey",
      htmlContent: `
        <div dir="rtl" style="font-family:Arial,sans-serif;line-height:1.9">
          <p>مرحباً ${safeName}،</p>
          <p>يسعدنا أن نشاركك دليل «٧ خطوات لتنشئة طفل واثق وسعيد».</p>
          <p><a href="${downloadUrl}">تحميل الدليل الآن</a></p>
          <p>نتمنى أن يكون رفيقاً لطيفاً في رحلتك.</p>
        </div>
      `,
    }),
  });

  if (!emailResponse.ok) {
    return false;
  }

  const listId = Number(process.env.BREVO_LIST_ID);
  if (Number.isInteger(listId) && listId > 0) {
    const contactResponse = await fetch("https://api.brevo.com/v3/contacts", {
      method: "POST",
      headers: {
        "api-key": apiKey,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        email,
        attributes: { FIRSTNAME: name },
        listIds: [listId],
        updateEnabled: true,
      }),
    });

    if (!contactResponse.ok) {
      throw new Error(`Brevo contact list returned ${contactResponse.status}`);
    }
  }

  return true;
}

router.post("/leads", async (req, res): Promise<void> => {
  const parsed = CreateLeadBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const name = parsed.data.name.trim();
  const phone = parsed.data.phone.replace(/[\s-]/g, "");
  const email = parsed.data.email.trim().toLowerCase();

  if (name.split(/\s+/).length < 2 || !/[\u0600-\u06ff]/.test(name)) {
    res.status(400).json({ error: "Please provide the full Arabic name." });
    return;
  }
  if (!emailPattern.test(email)) {
    res.status(400).json({ error: "Please provide a valid email address." });
    return;
  }
  if (!phonePattern.test(phone) && !/^\+?[1-9]\d{7,14}$/.test(phone)) {
    res.status(400).json({ error: "Please provide a valid phone number." });
    return;
  }

  const [lead] = await db
    .insert(leadsTable)
    .values({ name, phone, email })
    .returning();

  let emailDelivery: "sent" | "failed" = "failed";
  try {
    emailDelivery = (await sendGiveawayEmail(name, email)) ? "sent" : "failed";
  } catch (error) {
    req.log.warn({ error, leadId: lead.id }, "Brevo delivery failed");
  }

  res.status(201).json(
    CreateLeadResponse.parse({
      id: lead.id,
      email: lead.email,
      emailDelivery,
      createdAt: lead.createdAt,
    }),
  );
});

router.get("/consultation-slots", async (_req, res): Promise<void> => {
  const booked = await db
    .select({
      scheduledDate: consultationsTable.scheduledDate,
      scheduledTime: consultationsTable.scheduledTime,
    })
    .from(consultationsTable);
  const bookedKeys = new Set(
    booked.map((slot) => `${slot.scheduledDate}:${slot.scheduledTime}`),
  );
  const available = getUpcomingDays().map((day) => ({
    ...day,
    times: day.times.filter((time) => !bookedKeys.has(`${day.date}:${time}`)),
  }));

  res.json(ListConsultationSlotsResponse.parse(available));
});

router.post("/consultations", async (req, res): Promise<void> => {
  const parsed = CreateConsultationBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const scheduledDate = formatDateKey(parsed.data.scheduledDate);
  const { leadId, scheduledTime } = parsed.data;
  const validDay = getUpcomingDays().find((day) => day.date === scheduledDate);
  if (!validDay || !validDay.times.includes(scheduledTime)) {
    res.status(400).json({ error: "That consultation slot is not available." });
    return;
  }

  const [lead] = await db
    .select({ id: leadsTable.id })
    .from(leadsTable)
    .where(eq(leadsTable.id, leadId));
  if (!lead) {
    res.status(400).json({ error: "Register your details before booking." });
    return;
  }

  const [existing] = await db
    .select({ id: consultationsTable.id })
    .from(consultationsTable)
    .where(
      and(
        eq(consultationsTable.scheduledDate, scheduledDate),
        eq(consultationsTable.scheduledTime, scheduledTime),
      ),
    );
  if (existing) {
    res.status(409).json({ error: "That slot was just booked. Please choose another." });
    return;
  }

  const [consultation] = await db
    .insert(consultationsTable)
    .values({
      leadId,
      scheduledDate,
      scheduledTime,
      status: "booked",
    })
    .returning();

  res.status(201).json(
    CreateConsultationResponse.parse({
      id: consultation.id,
      leadId: consultation.leadId,
      scheduledDate: new Date(`${consultation.scheduledDate}T00:00:00Z`),
      scheduledTime: consultation.scheduledTime,
      status: consultation.status,
      createdAt: consultation.createdAt,
    }),
  );
});

export default router;
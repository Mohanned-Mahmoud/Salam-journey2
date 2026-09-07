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
  bookingsTable,
  coachesTable,
  db,
  funnelPageTable,
  funnelRegistrationsTable,
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
    ? `https://${domain}/salam-journey-ebook.pdf`
    : "https://salamjourney.com/salam-journey-ebook.pdf";
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
        <div dir="rtl" style="font-family:Arial,sans-serif;line-height:1.9; padding: 20px; color: #000; text-align: right;">
          <p style="font-size: 16px;">مرحباً ${safeName}،</p>
          <br/>
          <p style="font-size: 16px;">مبروك حصولك على الكتيّب الإلكتروني المجاني!</p>
          <p style="font-size: 16px;">شكراٌ لاهتمامك لمعرفة المزيد حول أساليب التربية الفعالة.</p>
          <p style="font-size: 16px;">كما وعدتك في هذا الكتاب ستتعرفين على الخطوات السبع لتنشئة طفل سعيد وواثق.</p>
          <p style="font-size: 16px;">الكتاب يتضمن طرق وأساليب عملية يمكن تطبيقها!</p>
          <br/>
          <a href="${downloadUrl}" style="display: inline-block; background-color: #a9523a; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">حملي الكتيّب من هنا</a>
          <br/><br/>
          <p style="font-size: 16px;">إذا أعجبك الكتيب، خذي له صورة وشاركيها على ستوري الانستغرام واعملي لي تاغ عبر صفحتي 
          <a href="https://www.instagram.com/emannasser_salam/" style="color: #a9523a; font-weight: bold;">@emannasser_salam</a>
          </p>
          <br/>
          <p style="font-size: 16px;">لدي هدية اخرى لك! أنتِ مدعوة لحجز جلسة إستشارية مجانية معي أنا إيمان ناصر.</p>
          <p style="font-size: 16px;">حيث سأشارك معك 5 أسرار لتحقيق السعادة فى نفسك وحياتك الأسرية.</p>
          <p style="font-size: 16px;">إليكي لينك التسجيل: <a href="https://salamjourney.com/sessions" style="color: #a9523a; font-weight: bold;">احجزي جلستك المجانية</a></p>
          <br/>
          <p style="font-size: 16px;">أتمنى لك قراءة ممتعة وأوقات سعيدة،<br/>إيمان ناصر 😉 سلام</p>
        </div>
      `,
    }),
  });

  if (!emailResponse.ok) {
    return false;
  }

  // Schedule the second email 5 minutes later (for testing)
  const now = new Date();
  const scheduledTime = new Date(now.getTime() + 5 * 60 * 1000);

  const secondEmailResponse = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      "api-key": apiKey,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      sender: { name: senderName, email: senderEmail },
      to: [{ email, name }],
      scheduledAt: scheduledTime.toISOString(),
      subject: "خطوتك الأولى لتحقيق السعادة لنفسك ولحياتك الأسرية",
      htmlContent: `
        <div dir="rtl" style="font-family:Arial,sans-serif;line-height:1.9; padding: 20px; color: #000; text-align: right;">
          <p style="font-size: 16px;">عزيزتي ${safeName}،</p>
          <br/>
          <p style="font-size: 16px;">طلبتي بالأمس نسخة من الكتيب المجاني <strong>7 خطوات لتنشئة طفل واثق وسعيد</strong>، وأردت فقط التواصل معك ومعرفة ما إذا كانت لديكي فرصة لقراءته حتى الآن.</p>
          <p style="font-size: 16px;">هذا الكتيب هو خطوة أولى رائعة نحو خلق علاقة جيدة مع أبنائك ورحلة تربية ممتعة بإذن الله. وأنا متأكدة من أنك ستستفيدين كثيرًا من ذلك.</p>
          <br/>
          <p style="font-size: 16px;">لكنني أردت أيضًا التأكد من أنك رأيت رابط الجلسة الاستشارية المجانية، هاهو:</p>
          <p style="font-size: 16px;">إذا كنتِ جاده بشأن خلق علاقة آمنة مع طفلك والاستمتاع بأمومتك، فلا توجد طريقة أفضل للبدء من جدولة جلسة استشارية مجانية معي أنا إيمان ناصر.</p>
          <p style="font-size: 16px;">خلال 30 دقيقة فقط سأقدم لك المخطط الدقيق الذي استخدمته مع العديد من الأمهات لبناء علاقة آمنة مع أطفالهم وتحقيق أهدافهم التربوية على المدي البعيد والقصير.</p>
          <p style="font-size: 16px;">وسنقوم أيضًا بمشاركة بعض الأسرار التي يمكنك استخدامها من أجل <strong>تحقيق السعادة في نفسك وحياتك الأسرية.</strong></p>
          <p style="font-size: 16px;">هذه جلسة استشارية مجانية تمامًا وبدون التزام.</p>
          <p style="font-size: 16px;">فقط دعيني أوضح لك مدى إمكانية خلق نظام في بيتك يتضمن تحقيق أهدافك التربوية وأستمتاعك بأمومتك فى الوقت ذاته، وبعد ذلك سنبدأ من هناك.</p>
          <p style="font-size: 16px;">لا يتوفر لدي سوى عدد قليل من المقاعد كل شهر، لذلك إذا كنت لا تزالين مهتمة بكيفية بناء علاقة آمنة وقوية مع أبنائك وتوفير جو أسري سعيد، فانقري على الرابط أدناه لحجز مكانك لأن المقاعد محدودة!</p>
          <br/>
          <a href="https://salamjourney.com/sessions" style="display: inline-block; background-color: #a9523a; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">احجزي جلستك المجانية من هنا</a>
          <br/><br/>
          <p style="font-size: 16px;">أتمنى التحدث إليك قريبًا،<br/>إيمان ناصر</p>
          <br/>
          <hr style="border: 0; border-top: 1px solid #ccc; margin: 20px 0;" />
          <p style="font-size: 14px; color: #666; font-style: italic; text-align: center;">
            رسالتي هي مساعدة الأمهات والآباء الذين يعانون يومياً في رحلتهم مع أبنائهم على البقاء هادئين وفهم أنفسهم وأطفالهم، وبناء تواصل عميق بين جميع أفراد الأسرة.
          </p>
          <br/>
          <p style="font-size: 16px;">لذا لا تترددي فى متابعة حساباتي عبر مواقع التواصل الإجتماعي ليصلك الكثير فيما يخص التربية وتحسين جوده حياتك فى وجود أطفال.</p>
          <p style="font-size: 16px;">أتمنى لك قراءة ممتعة وأوقات سعيدة.<br/>إيمان ناصر 😉 سلام</p>
        </div>
      `,
    }),
  });

  if (!secondEmailResponse.ok) {
    console.warn("Failed to schedule the second email in Brevo", await secondEmailResponse.text());
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

  let [page] = await db
    .select({ id: funnelPageTable.id })
    .from(funnelPageTable)
    .where(eq(funnelPageTable.slug, "giveaway"))
    .limit(1);

  if (!page) {
    [page] = await db
      .insert(funnelPageTable)
      .values({
        title: "Giveaway Funnel",
        slug: "giveaway",
        blocks: [],
      })
      .returning();
  }

  const [lead] = await db
    .insert(funnelRegistrationsTable)
    .values({ name, phone, email, pageId: page.id })
    .returning();

  const emailDelivery: "sent" | "failed" = "failed"; // Will be sent later in the send-email endpoint

  res.status(201).json(
    CreateLeadResponse.parse({
      id: lead.id,
      email: lead.email,
      emailDelivery,
      createdAt: lead.createdAt,
    }),
  );
});

router.post("/leads/:id/send-email", async (req, res): Promise<void> => {
  const leadId = req.params.id;
  const [lead] = await db
    .select({ id: funnelRegistrationsTable.id, name: funnelRegistrationsTable.name, email: funnelRegistrationsTable.email })
    .from(funnelRegistrationsTable)
    .where(eq(funnelRegistrationsTable.id, leadId));
  
  if (!lead) {
    res.status(404).json({ error: "Lead not found." });
    return;
  }

  let emailDelivery: "sent" | "failed" = "failed";
  try {
    emailDelivery = (await sendGiveawayEmail(lead.name, lead.email)) ? "sent" : "failed";
  } catch (error) {
    req.log.warn({ error, leadId: lead.id }, "Brevo delivery failed");
  }

  res.status(200).json({
    success: emailDelivery === "sent",
    emailDelivery
  });
});

router.get("/consultation-slots", async (_req, res): Promise<void> => {
  const booked = await db
    .select({
      scheduledDate: bookingsTable.date,
      scheduledTime: bookingsTable.slot,
    })
    .from(bookingsTable)
    .where(eq(bookingsTable.sessionType, "giveaway_consultation"));
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
    .select({ id: funnelRegistrationsTable.id, name: funnelRegistrationsTable.name, email: funnelRegistrationsTable.email, phone: funnelRegistrationsTable.phone })
    .from(funnelRegistrationsTable)
    .where(eq(funnelRegistrationsTable.id, leadId));
  if (!lead) {
    res.status(400).json({ error: "Register your details before booking." });
    return;
  }

  const [existing] = await db
    .select({ id: bookingsTable.id })
    .from(bookingsTable)
    .where(
      and(
        eq(bookingsTable.date, scheduledDate),
        eq(bookingsTable.slot, scheduledTime),
      ),
    );
  if (existing) {
    res.status(409).json({ error: "That slot was just booked. Please choose another." });
    return;
  }

  const [coach] = await db
    .select({ id: coachesTable.id })
    .from(coachesTable)
    .limit(1);

  if (!coach) {
    res.status(500).json({ error: "No coaches available to book." });
    return;
  }

  const [consultation] = await db
    .insert(bookingsTable)
    .values({
      coachId: coach.id,
      date: scheduledDate,
      slot: scheduledTime,
      sessionType: "giveaway_consultation",
      guestName: lead.name,
      guestEmail: lead.email,
      guestWhatsapp: lead.phone,
      status: "confirmed",
    })
    .returning();

  res.status(201).json(
    CreateConsultationResponse.parse({
      id: consultation.id,
      leadId: leadId,
      scheduledDate: new Date(`${consultation.date}T00:00:00Z`),
      scheduledTime: consultation.slot,
      status: "booked",
      createdAt: consultation.createdAt,
    }),
  );
});

export default router;
export type AdminSection =
  | 'dashboard'
  | 'bookings'
  | 'courses'
  | 'products'
  | 'users'
  | 'testimonials'
  | 'ai-knowledge'
  | 'settings';

export type BookingStatus = 'confirmed' | 'pending' | 'cancelled';

export type BookingRecord = {
  id: string;
  userId: string | null;
  coachId: string;
  date: string;
  slot: string | null;
  sessionType: string | null;
  bookingKind: 'single' | 'package';
  packageSessionsTotal: number | null;
  packageSessionsRemaining: number | null;
  topic: string | null;
  notes: string | null;
  name: string | null;       // يعادل guest_name في الباكيند
  email: string | null;      // يعادل guest_email في الباكيند
  whatsapp: string | null;   // يعادل guest_whatsapp في الباكيند
  status: BookingStatus;
  createdAt: string;
};

export type AdminCourse = {
  id: string;
  coachId: string;
  titleAr: string;
  titleEn: string;
  descAr: string | null;
  category: 'course' | 'workshop' | 'free';
  price: string | number;
  duration: number | null;
  status: 'active' | 'hidden';
  gradient: string | null;
  students: string | null;
  imageUrl?: string | null;
  createdAt?: string;
};

export type AdminProduct = {
  id: string;
  titleAr: string;
  titleEn: string;
  descAr: string | null;
  price: string | number;
  free: boolean;             // تقرأ من الحقل الجديد is_free
  type: 'pdf' | 'printable' | 'guide' | 'other';
  downloadUrl: string | null;
  status: 'active' | 'hidden';
  createdAt?: string;
};

export type AdminTestimonial = {
  id: string;
  nameAr: string | null;
  roleAr: string | null;
  quoteAr: string;
  rating: number | null;
  status: 'active' | 'hidden';
  createdAt?: string;
};

export type AdminSettings = {
  siteName: string;
  contactEmail: string;
  whatsappNumber: string;
  instagramUrl: string;
  youtubeUrl: string;
  availableTimes: string[];
  offDays: string[];
  advanceDays: number;
  confirmationMessage: string;
};

export type SalamUser = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: string | null;
  createdAt?: string;
  enrolledCourses: { id: string; title: string; enrolledAt: string; progress: number }[];
  bookings: BookingRecord[];
};

/* ── localStorage helpers ── */
export const BOOKINGS_KEY = 'salam_bookings';
export const COURSES_ADMIN_KEY = 'salam_courses';
export const PRODUCTS_ADMIN_KEY = 'salam_products';
export const TESTIMONIALS_ADMIN_KEY = 'salam_testimonials';
export const SETTINGS_KEY = 'salam_settings';
export const USERS_KEY = 'salam_users';

export function loadJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function saveJson<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore
  }
}

export const DEFAULT_SETTINGS: AdminSettings = {
  siteName: 'رحلة سلام',
  contactEmail: 'info@salamjourney.com',
  whatsappNumber: '+447700000000',
  instagramUrl: 'https://instagram.com/salamjourney',
  youtubeUrl: 'https://youtube.com/@salamjourney',
  availableTimes: ['10:00', '12:00', '14:00', '16:00', '18:00'],
  offDays: ['الجمعة', 'السبت'],
  advanceDays: 30,
  confirmationMessage: 'شكراً لحجزك! سيتم التواصل معك عبر الواتساب خلال 24 ساعة.',
};

// 🌟 استبدل الجزء الخاص بالـ SEED_COURSES في ملف types.ts بالنسخة الرقمية دي:
export const SEED_COURSES: AdminCourse[] = [
  { id: 'calm', coachId: '00000000-0000-0000-0000-000000000000', titleAr: 'وأصبحتُ أُمّاً هادئة', titleEn: 'Becoming a Calm Mother', descAr: 'برنامج ٤ أسابيع لتعلّم التعامل مع الغضب وبناء علاقة هادئة.', category: 'course', price: 299, duration: 4, students: '+820', status: 'active', gradient: 'linear-gradient(135deg, var(--sage-dark), var(--sage))', imageUrl: '' },
  { id: 'boundaries', coachId: '00000000-0000-0000-0000-000000000000', titleAr: 'حدود واضحة بحب', titleEn: 'Boundaries with Love', descAr: 'كيف تضعين حدوداً واضحة لأطفالك دون فقدان دفء العلاقة.', category: 'course', price: 249, duration: 3, students: '+540', status: 'active', gradient: 'linear-gradient(135deg, var(--blush), var(--blush-light))', imageUrl: '' },
  { id: 'tantrums', coachId: '00000000-0000-0000-0000-000000000000', titleAr: 'ورشة: نوبات الغضب', titleEn: 'Workshop: Tantrums', descAr: 'ورشة عملية لمدة ٩٠ دقيقة لفهم نوبات الغضب.', category: 'workshop', price: 99, duration: 90, students: '+310', status: 'active', gradient: 'linear-gradient(135deg, var(--sage), var(--sage-light))', imageUrl: '' },
  { id: 'self-care', coachId: '00000000-0000-0000-0000-000000000000', titleAr: 'ورشة: الأم تستحقّ', titleEn: "Workshop: A Mother Deserves", descAr: 'ورشة عن العناية بالذات والوقت الخاص للأم.', category: 'workshop', price: 79, duration: 60, students: '+220', status: 'active', gradient: 'linear-gradient(135deg, var(--blush-light), var(--cream-dark))', imageUrl: '' },
  { id: 'starter', coachId: '00000000-0000-0000-0000-000000000000', titleAr: 'دليل الأم الواعية (مجاناً)', titleEn: 'Conscious Mother Guide (free)', descAr: 'دليل تمهيدي مجاني للتعرّف على مبادئ التربية الواعية.', category: 'free', price: 0, duration: null, students: '+1.2K', status: 'active', gradient: 'linear-gradient(135deg, var(--sage-light), var(--sage-muted))', imageUrl: '' },
  { id: 'newborn', coachId: '00000000-0000-0000-0000-000000000000', titleAr: 'الأم الجديدة (مجاناً)', titleEn: 'The New Mother (free)', descAr: 'محاضرة مجانية للأمهات في الأشهر الأولى من الأمومة.', category: 'free', price: 0, duration: 45, students: '+680', status: 'active', gradient: 'linear-gradient(135deg, var(--cream-dark), var(--blush-light))', imageUrl: '' },
];

export const SEED_PRODUCTS: AdminProduct[] = [
  { id: 'morning-routine', titleAr: 'مفكّرة الروتين الصباحي', titleEn: 'Morning Routine Planner', descAr: 'قابل للطباعة لمساعدتك على بناء صباح هادئ مع طفلك.', price: '٣٩ ريال', free: false, type: 'printable', downloadUrl: '', status: 'active' },
  { id: 'feelings-cards', titleAr: 'بطاقات المشاعر للأطفال', titleEn: "Children's Feelings Cards", descAr: '٣٠ بطاقة ملوّنة لتعليم الطفل التعبير عن مشاعره.', price: '٤٩ ريال', free: false, type: 'printable', downloadUrl: '', status: 'active' },
  { id: 'calm-guide', titleAr: 'دليل الأم الهادئة', titleEn: 'Calm Mother Guide', descAr: 'دليل PDF مكوّن من ٢٤ صفحة بأدوات عملية يومية.', price: '٢٩ ريال', free: false, type: 'pdf', downloadUrl: '', status: 'active' },
  { id: 'self-care', titleAr: 'قائمة العناية بالأم', titleEn: 'Mother Self-Care Checklist', descAr: 'قائمة أسبوعية لذكّرك أن تعتني بنفسك أيضاً.', price: 'مجاناً', free: true, type: 'printable', downloadUrl: '', status: 'active' },
  { id: 'kids-worksheet', titleAr: 'ورق عمل للأطفال', titleEn: 'Kids Activity Worksheets', descAr: '١٠ أوراق عمل ممتعة وتعليمية للأعمار ٤–٩.', price: '٣٥ ريال', free: false, type: 'printable', downloadUrl: '', status: 'active' },
  { id: 'affirmations', titleAr: 'بطاقات تأكيدات للأم', titleEn: 'Mother Affirmation Cards', descAr: '٢١ بطاقة تأكيد إيجابي تبدئين بها يومك.', price: 'مجاناً', free: true, type: 'pdf', downloadUrl: '', status: 'active' },
];

export const SEED_TESTIMONIALS: AdminTestimonial[] = [
  { id: 't1', nameAr: 'سارة العتيبي', roleAr: 'أم لطفلين', quoteAr: 'غيّرت طريقة تعاملي مع طفلي تماماً. المحتوى عملي ومن قلب أم تفهمنا.', rating: 5, status: 'active' },
  { id: 't2', nameAr: 'نورة الشهري', roleAr: 'أم جديدة', quoteAr: 'الجلسات الفردية كانت نقطة تحوّل. شعرت لأول مرة أن صوتي مسموع.', rating: 5, status: 'active' },
  { id: 't3', nameAr: 'مها القحطاني', roleAr: 'أم لثلاثة', quoteAr: 'محتوى راقٍ يجمع بين الجانب التربوي والروحي. أنصح به كل أم.', rating: 5, status: 'active' },
  { id: 't4', nameAr: 'ريم الدوسري', roleAr: 'أم عاملة', quoteAr: 'أحب أسلوب الكوتش إيمان، حنون ومرشد في نفس الوقت.', rating: 5, status: 'active' },
];
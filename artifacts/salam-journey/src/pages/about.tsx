import { Link } from "wouter";
import { Heart, Users, Sparkles, Award } from "lucide-react";
import { useLanguage, tx, type Bilingual } from "@/lib/i18n";
import { useReveal } from "@/lib/use-reveal";
import { SoftBlob, SectionDivider } from "@/components/section-divider";

type Value = {
  Icon: React.ComponentType<{ size?: number }>;
  title: Bilingual;
  desc: Bilingual;
};

type StorySection = {
  title: Bilingual;
  paragraphs: Bilingual[];
};

const VALUES: Value[] = [
  {
    Icon: Heart,
    title: tx("الأم هي الأساس", "The mother is the foundation"),
    desc: tx(
      "لا نعلّم التربية بمعزل عن كينونة الأم واحتياجاتها وسلامها الداخلي.",
      "We do not teach parenting in isolation from the mother's essence, needs, and inner peace.",
    ),
  },
  {
    Icon: Sparkles,
    title: tx("تجربة ووعي", "Experience and awareness"),
    desc: tx(
      "نقدّم علماً مرّ بتجربة حقيقية، لا نظريات بعيدة عن حياة الأمهات اليومية.",
      "We offer knowledge that has gone through real experience, not theories detached from mothers' daily lives.",
    ),
  },
  {
    Icon: Users,
    title: tx("سلام داخلي وخارجي", "Inner and outer peace"),
    desc: tx(
      "نساعدك في رحلتك نحو السلام مع نفسك، ومع أبنائك، ومع الآخرين.",
      "We help you on your journey toward peace with yourself, your children, and others.",
    ),
  },
  {
    Icon: Award,
    title: tx("علم بروح وثقافة", "Knowledge with soul and culture"),
    desc: tx(
      "نبحث عن جذور علوم التربية في ديننا وثقافتنا ونقدّمها بطريقة معاصرة.",
      "We look for the roots of parenting sciences in our religion and culture, and present them in a contemporary way.",
    ),
  },
];

const STORY_SECTIONS: StorySection[] = [
  {
    title: tx("من أنا", "Who am I"),
    paragraphs: [
      tx(
        "أنا إيمان عمري 32 سنة\nأم لطفلة من أصحاب الهمم ومدرية بالتربية والوعي ومؤسسة شركة\n\"رحلة سلام\"",
        "I am Iman, 32 years old.\nA mother of a child of determination, a parenting and awareness coach, and the founder of the company \"Salam Journey\".",
      ),
    ],
  },
  {
    title: tx("البداية", "The beginning"),
    paragraphs: [
      tx(
        "بدأت رحلتي بعد تخرجي من كلية حاسبات ومعلومات والتي عملت بعدها لفترة\nقصيرة جداً مطورة مواقع كان هذا بالتزامن مع ولادة بنتي وتأكد لي أنه صعب\nجداً الانخراط في سوق العمل ومتطلباته مع وجود طفل رضيع",
        "My journey began after graduating from the Faculty of Computers and Information, after which I worked for a very short period as a web developer. This coincided with the birth of my daughter, and it became clear to me how difficult it is to engage in the job market and its demands with a newborn baby.",
      ),
      tx(
        "قررت أن أعمل في مجالي بعد أن تكبر ابنتي و انتهزت الفرصة لأدرس و أتعلم عن\n المنتسوري و التربية الايجابية وأُعتمدت من الجمعية الأمريكية.",
        "I decided to work in my field after my daughter grows up, and I seized the opportunity to study and learn about Montessori and positive parenting, and became certified by the American Association.",
      ),
    ],
  },
  {
    title: tx("منعطف الأمومة", "A turning point in motherhood"),
    paragraphs: [
      tx(
        "علمنا عند عمر سنه أن ابنتي لديها مرض جيني نادر وأنها سوف تستخدم الكرسي\nالمتحرك وسيكون وضعها الصحي غير مستقر وسوف تحتاجني في كل دقيقة\nفي حياتها حينها ألغيت فكرة العمل نهائي وبدأت أعلم بنتي منزلي أي لن تذهب\nإلى المدرسة",
        "When she was one year old, we learned that my daughter has a rare genetic disease, that she will use a wheelchair, and that her health status will remain unstable, requiring me every single minute of her life. At that moment, I canceled the idea of work completely and started homeschooling my daughter, meaning she will not go to school.",
      ),
      tx(
        "زادت مسؤولياتي كثيراً ورحلة المرض أخذت من وقتنا و جهدنا و طاقتنا الكثير \n ومع الضغوط التي مررت بها أصبت أنا بمرض مناعي ومرض مزمن واكتئاب \nحاد وهذا جعلني أبدأ رحلة علاج طويله اكتشفت فيها الكثير عن نفسي و الحياة \nو هذا أعطاني الخبرة العملية, ليست النظرية فقط فقد مررت بما أدربهُ للأمهات \nالآن",
        "My responsibilities increased significantly, and the journey with illness took a lot of our time, effort, and energy. Under the pressures I went through, I developed an autoimmune disease, a chronic illness, and severe depression. This led me to begin a long healing journey where I discovered a lot about myself and life, which gave me practical experience, not just theoretical, as I have personally gone through what I train mothers on now.",
      ),
    ],
  },
  {
    title: tx("التعلم وبناء الطريق", "Learning and building the path"),
    paragraphs: [
      tx(
        "اكملت دراسه معلم و الدروف و العلاج بالفن و درست العلاج المعرفي السلوكي",
        "I completed studies in Waldorf education and art therapy, and I studied Cognitive Behavioral Therapy (CBT).",
      ),
      tx(
        "أطلقت كورسات تربوية أنشر فيها العلم الذي تعلمته وكنت أوثق رحلة تعليمنا\nالمنزلي, للأسف كانت طاقتي قليلة ومسؤولياتي كثيرة ولم استطع الاستمرار",
        "I launched educational courses to share the knowledge I learned and was documenting our homeschooling journey. Unfortunately, my energy was low, my responsibilities were many, and I could not continue.",
      ),
      tx(
        "إلى أن عملت كثيرا على تغيير نمط حياتي وجعلته مستطاع نوعا ما واليوم\nأمضيت سنه كاملة أشارك بشكل دائم محتوي على منصات السوشيال ميديا\nدرست مؤخرا بيزنس ماركتينج كي استطيع تأسيس عملي الخاص المناسب\nلظروفي وبما أني مطورة مواقع فكان موقع \"رحلة سالم\" منصة تعليمية\nلتدريب الآباء والأمهات خصوصا",
        "Until I worked hard to change my lifestyle and make it somewhat manageable. Today, I have spent a full year continuously sharing content on social media platforms. I recently studied business marketing so that I could establish my own business suitable for my circumstances. Since I am a web developer, the \"Salam Journey\" website became an educational platform for training parents, especially mothers.",
      ),
    ],
  },
  {
    title: tx("رؤية رحلة سلام", "The vision of Salam Journey"),
    paragraphs: [
      tx(
        "الموقع إسمه قريب جدا لقلبي وحالي أضع فيه من كل قلبي خبرتي وعلمي\nوكل ما أستطيع أن أساعد به الأمهات لتمر بتجارب وعي أفضل وتكون في سلام\nداخلي مع أطفالها وسلام خارجي مع أولادها والآخرين",
        "The website's name is very close to my heart and my current state. I pour my experience, knowledge, and everything I can into it with all my heart to help mothers go through better awareness experiences and be in inner peace with themselves, and outer peace with their children and others.",
      ),
      tx(
        "لدي وجهة نظر في نقل علوم الغرب, إن علومهم بلا روح مبنية فقط على\nالدراسات والنظريات لكن نحن في رحلة سالم دائما نحاول معرفة أصل هذه\nالعلوم في ديننا وثقافتنا ونقدمها بطريقة جذابة ومعاصرة للأمهات والآباء",
        "I have a viewpoint regarding importing Western sciences: their sciences are soulless, built only on studies and theories. However, at Salam Journey, we always try to find the roots of these sciences in our religion and culture, and present them in an attractive and contemporary way for mothers and fathers.",
      ),
      tx(
        "أيضا لا أحب أن أتكلم في التربية فقط وأهمل كينونة الأم لأن الأم دائما هي\nالأساس ولا يمكن لأم تشعر بالتشتت والضياع أن تربي طفل قادر وواعي\nوسعيا لذلك دائما ما أقول أني مدربة بالتربية والوعي الذاتي معا لأنهما يكملان\nبعضهما البعض",
        "Also, I do not like to talk about parenting alone while neglecting the mother's own being, because the mother is always the foundation. A mother who feels scattered and lost cannot raise a capable and aware child. In pursuit of this, I always say that I am a coach in both parenting and self-awareness together, because they complement each other.",
      ),
      tx(
        "أخيراً أعتمدت في الكوتشينجمن  الـ ICF وبدأت عمل جلسات مع\nالأمهات أساعد كل أم على حدى لتجعل حياتها و حياه اولادها افضل و يستمتعوا\nبالرلحة",
        "Finally, I became certified in coaching by the ICF and started conducting sessions with mothers, helping each mother individually to make her life and her children's lives better, so they can enjoy the journey.",
      ),
    ],
  },
  {
    title: tx("معنى السلام", "The meaning of peace"),
    paragraphs: [
      tx(
        "كثيراً ما كنت أتأمل كلمة \"سلام\" كيف أن تحيتنا في الإسلام هي السلام عليكم\nومعانيها في القرآن وكنت أتمنى أن يرزقني الله تعالى بعضاً من السلام لتطمئن نفسي\nحالياً أنا أعيش الحياة التي أحمد الله عليها كل يوم راضية بفضل الله وممتنه\nلكل شئ رزقني الله به ومتمكنة اكتر في حياتي و مع ابنتي وأستطيع القول الحمد\nلله حصلت على الكثير من \"السلام\" الذي كنت أتمناه",
        "I often used to contemplate the word \"Salam\" (Peace), how our greeting in Islam is \"Peace be upon you\", and its meanings in the Quran. I used to hope that Almighty Allah would grant me some peace so my soul could rest. Currently, I live the life that I thank Allah for every day, content by Allah's grace and grateful for everything Allah has provided me with. I am more empowered in my life and with my daughter, and I can say, Praise be to Allah, I have obtained a lot of the \"peace\" I had hoped for.",
      ),
      tx(
        "و اليوم موقع \"رحلة سلام\" يصحبك في رحلتك نحو السلام الداخلي، مع نفسك\nوالسلام الخارجي مع أولادك والآخرين فاسمحي لنا أن نكون جزء من رحلتك\nواحجزي مقعدك معنا",
        "And today, the \"Salam Journey\" website accompanies you on your journey toward inner peace with yourself, and outer peace with your children and others. So please allow us to be a part of your journey, and reserve your seat with us.",
      ),
    ],
  },
];

const STORY_GROUPS = [
  { sectionIndexes: [0, 1], image: "coach" },
  { sectionIndexes: [2, 3], image: "second" },
  { sectionIndexes: [4, 5], image: "third" },
];

export default function About() {
  const ref = useReveal<HTMLDivElement>();
  const { lang, t } = useLanguage();

  return (
    <div ref={ref} key={lang} className="lang-fade w-full overflow-hidden">
      {/* Hero */}
      <section className="relative overflow-hidden w-full" style={{ background: "var(--cream)" }}>
        <SoftBlob
          color="var(--sage-light)"
          className="absolute -top-24 -start-20 w-[420px] h-[420px] opacity-50 animate-drift pointer-events-none"
        />
        <SoftBlob
          color="var(--blush)"
          className="absolute bottom-0 -end-16 w-[320px] h-[320px] opacity-40 animate-float-slow pointer-events-none"
        />
        <div className="relative container mx-auto px-5 md:px-8 pt-20 md:pt-28 pb-16 max-w-full">
          <div className="text-center max-w-2xl mx-auto reveal break-words">
            <p
              className="uppercase tracking-[0.18em] text-xs font-semibold mb-3"
              style={{ color: "var(--sage-dark)" }}
            >
              {t(tx("من نحن", "About us"))}
            </p>
            <h1 className="text-4xl md:text-6xl leading-[1.1] mb-5">
              {t(tx("أكاديمية بدأت من قلب أم", "An academy born from a mother's heart"))}
            </h1>
            <p className="text-lg leading-relaxed text-pretty" style={{ color: "var(--text-body)" }}>
              {t(
                tx(
                  "منصة تعليمية وتدريبية ولدت من تجربة أم، لترافق الأمهات نحو وعي أعمق وسلام داخلي وخارجي.",
                  "An educational and coaching platform born from a mother's lived experience, supporting mothers toward deeper awareness and inner and outer peace.",
                ),
              )}
            </p>
          </div>
        </div>
        <SectionDivider color="var(--blush-light)" />
      </section>

      {/* Coach story */}
      <section style={{ background: "var(--blush-light)" }} className="w-full">
        <div className="container mx-auto px-5 md:px-8 py-20 md:py-28 max-w-full">
          <div className="text-center max-w-2xl mx-auto mb-14 reveal break-words">
            <h2 className="text-3xl md:text-5xl mb-4 leading-tight">
              {t(tx("قصة إيمان", "Iman's story"))}
            </h2>
            <p className="text-lg leading-relaxed text-pretty" style={{ color: "var(--text-body)" }}>
              {t(
                tx(
                  "رحلة شخصية ومهنية تشكّلت بين الأمومة، التعلم، الشفاء، وبناء مساحة آمنة للأمهات.",
                  "A personal and professional journey shaped by motherhood, learning, healing, and building a safe space for mothers.",
                ),
              )}
            </p>
          </div>

          <div className="space-y-16 md:space-y-24 w-full">
            {STORY_GROUPS.map((group, groupIndex) => {
              const isReversed = groupIndex % 2 === 1;

              return (
                <article
                  key={group.image}
                  className={`grid grid-cols-1 lg:grid-cols-12 gap-7 lg:gap-12 items-center reveal w-full ${
                    isReversed ? "lg:-translate-x-6" : "lg:translate-x-6"
                  }`}
                  data-reveal-delay={groupIndex * 90}
                >
                  <div className={`lg:col-span-5 w-full max-w-full ${isReversed ? "lg:order-2" : ""}`}>
                    {group.image === "second" ? (
                      <div
                        className="rounded-[2.5rem] p-2"
                        style={{ background: "var(--white)", border: "1px solid rgba(127,169,155,0.3)" }}
                      >
                        <div
                          className="rounded-[2rem] aspect-[4/5] overflow-hidden flex items-center justify-center relative"
                          style={{ background: "linear-gradient(135deg, var(--blush), var(--cream))" }}
                        >
                          <img
                            src="/images/Mother.jpg"
                            alt="Mother and child"
                            className="w-full h-full object-cover"
                          />
                        </div>
                      </div>
                    ) : group.image !== "coach" ? (
                      <div
                        className="rounded-[2.5rem] p-2"
                        style={{ background: "var(--white)", border: "1px solid rgba(127,169,155,0.3)" }}
                      >
                        <div
                          className="rounded-[2rem] aspect-[4/5] overflow-hidden flex items-center justify-center relative"
                          style={{ background: "linear-gradient(135deg, var(--blush-light), var(--cream))" }}
                        >
                          <img
                            src="/images/logo.png"
                            alt="Salam Journey Logo"
                            className="w-full h-full object-cover"
                          />
                        </div>
                      </div>
                    ) : (
                      <div
                        className="rounded-[2.5rem] p-2"
                        style={{ background: "var(--white)", border: "1px solid rgba(127,169,155,0.3)" }}
                      >
                        <div
                          className="rounded-[2rem] aspect-[4/5] overflow-hidden flex items-center justify-center relative"
                          style={{ background: "linear-gradient(135deg, var(--sage), var(--sage-light))" }}
                        >
                          <img
                            src="/images/Coach.jpg"
                            alt="Coach Iman"
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-6">
                            <h3 className="text-2xl mb-1" style={{ color: "var(--white)" }}>
                              {t(tx("المدربة إيمان", "Coach Iman"))}
                            </h3>
                            <p style={{ color: "rgba(255,255,255,0.85)" }}>
                              {t(tx("مؤسسة رحلة سلام", "Founder of Salam Journey"))}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className={`lg:col-span-7 w-full max-w-full ${isReversed ? "lg:order-1" : ""}`}>
                    <div className="space-y-5 w-full">
                      {group.sectionIndexes.map((sectionIndex) => {
                        const section = STORY_SECTIONS[sectionIndex];

                        return (
                          <div
                            key={section.title.ar}
                            className="rounded-[1.75rem] p-6 md:p-8 w-full block break-words h-auto"
                            style={{
                              background: "rgba(255,255,255,0.72)",
                              border: "1px solid rgba(127,169,155,0.22)",
                            }}
                          >
                            <h3 className="text-2xl md:text-3xl mb-4" style={{ color: "var(--text-dark)" }}>
                              {t(section.title)}
                            </h3>
                            {/* تعديل الكلاس هنا لـ whitespace-normal ليتماشى النص مع أبعاد الصندوق تلقائياً */}
                            <div className="space-y-4 whitespace-normal text-base md:text-lg leading-relaxed text-pretty" style={{ color: "var(--text-body)" }}>
                              {section.paragraphs.map((paragraph) => (
                                <p key={paragraph.ar} className="break-words max-w-full">{t(paragraph)}</p>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>

          <div className="text-center mt-14 reveal">
            <Link href="/sessions" className="pill-btn pill-btn-primary">
              {t(tx("احجزي جلستك الأولى", "Book your first session"))}
            </Link>
          </div>
        </div>
        <SectionDivider color="var(--cream)" />
      </section>

      {/* Values */}
      <section style={{ background: "var(--cream)" }} className="w-full">
        <div className="container mx-auto px-5 md:px-8 py-20 md:py-28 max-w-full">
          <div className="text-center max-w-xl mx-auto mb-12 reveal break-words">
            <p
              className="uppercase tracking-[0.18em] text-xs font-semibold mb-3"
              style={{ color: "var(--sage-dark)" }}
            >
              {t(tx("قيمنا", "Our values"))}
            </p>
            <h2 className="text-3xl md:text-5xl mb-3 leading-tight">
              {t(tx("ما الذي يقودنا", "What guides us"))}
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8 w-full">
            {VALUES.map((v, i) => (
              <div
                key={v.title.ar}
                className="glass-card p-7 flex gap-5 reveal break-words min-w-0 h-auto"
                data-reveal-delay={i * 90}
                style={{ background: "var(--white)" }}
              >
                <span
                  className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0"
                  style={{ background: "var(--sage-muted)", color: "var(--sage-dark)" }}
                >
                  <v.Icon size={22} />
                </span>
                <div className="min-w-0 flex-1">
                  <h3 className="text-xl mb-2 break-words">{t(v.title)}</h3>
                  <p className="leading-relaxed text-pretty break-words" style={{ color: "var(--text-body)" }}>
                    {t(v.desc)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
export type Locale = "ar" | "en";

export const translations = {
  ar: {
    navbar: {
      home: "الرئيسية",
      programs: "الكورسات",
      contact: "التواصل",
      myAccount: "حسابي",
      logout: "تسجيل خروج",
      login: "دخول",
      register: "تسجيل",
      admin: "الإدارة"
    },
    hero: {
      unleash: "UNLEASH YOUR POWER",
      trainer: "Physical trainer",
      slogan: "اتمرن بعقلك مش بجسمك",
      cta: "ابدأ رحلتك الآن",
      viewPrograms: "عرض الكورسات",
      coaching: "1:1 Coaching",
      coachingLabel: "تدريب شخصي",
      programsCount: "12W Programs",
      programsLabel: "برامج رياضية",
      support: "24/7 Support",
      supportLabel: "دعم مستمر",
      subscribers: "مشتركين"
    },
    programs: {
      title: "الكورسات",
      subtitle: "كورسات رياضية قوية تبني جسمك وتطوّر أدائك",
      desc: "اختار الكورس المناسب ليك، وابدأ تدريب عملي بخطة واضحة ونتيجة تشوفها.",
      empty: "الكورسات مش ظاهرة حالياً",
      emptyDesc: "تأكد إن الكورسات منشورة is_published = true. ولو عايز تظهر باقات داخل الكورس: تأكد إن الباقات active = true وربطتها بالكورسات في package_courses.",
      cta: "افتح الكورس",
      footerTitle: "أنا مدرب بدني… شغل علمي ونتيجة واضحة",
      footerDesc: "تدريبي مش كلام حماس وخلاص. هتدخل بخطة، هتمشي على نظام، وهتطلع بنسخة أقوى منك. قوة، لياقة، مرونة، وتحكم في جسمك… وكل ده بتدرّج محسوب وقياسات حقيقية.",
      footerCta: "تواصل وابدأ الآن"
    },
    details: {
      title: "تفاصيل الكورس",
      selectPackage: "اختر الباقة:",
      bookNow: "احجز مكانك",
      loginToSubscribe: "سجل دخول للاشتراك",
      backToPrograms: "رجوع للكورسات",
      cardNote: "كروت (طول / وزن / عمر)",
      cardNoteInjuries: "كروت (اسم الكارت)",
      courseContent: "محتوى الكورس",
      cardTitle: "كارت رقم",
      subscribe: "اشترك",
      loginToSubscribeCard: "سجل دخول للاشتراك",
      openDetails: "افتح التفاصيل",
      openMonth1: "افتح الشهر الأول",
      subscribeToPackage: "اشترك في الباقة",
      openVideos: "افتح الفيديوهات",
      selectPackageFirst: "اختر باقة أولاً",
      selectPackageFirstDesc: "علشان تظهر الكروت، اختار الباقة من فوق.",
      monthsMode: "الكورس ده بيشتغل بنظام الشهور",
      availableMonths: "الشهور المتاحة في الكورس:",
      month: "شهر",
      noCardsAvailable: "مفيش كروت مخصصة ليك حالياً. استخدم كود التفعيل بالأعلى أو اشترك في الباقة.",
      noCardsAvailableNoPkg: "مفيش كروت مخصصة ليك حالياً.",
      courseNotConfigured: "الكورس لسه مش متجهّز (مفيش مجموعات). لازم الأدمن يضيف مجموعة وبعدها الشهور."
    },
    welcome: {
      ready: "جاهز يا بطل؟",
      welcome: "مرحباً بك",
      welcomeWorld: "في عالم الأبطال",
      chooseLang: "اختر لغة الموقع لتخصيص محتواك",
      chooseLangSub: "Choose your language to personalize your training dashboard",
      loading: "تحميل..."
    }
  },
  en: {
    navbar: {
      home: "Home",
      programs: "Programs",
      contact: "Contact",
      myAccount: "My Account",
      logout: "Logout",
      login: "Login",
      register: "Register",
      admin: "Admin"
    },
    hero: {
      unleash: "UNLEASH YOUR POWER",
      trainer: "Physical Trainer",
      slogan: "Train with your brain, not your body",
      cta: "START YOUR TRANSFORMATION",
      viewPrograms: "VIEW PROGRAMS",
      coaching: "1:1 Coaching",
      coachingLabel: "Coaching",
      programsCount: "12W Programs",
      programsLabel: "Programs",
      support: "24/7 Support",
      supportLabel: "Support",
      subscribers: "Subscribers"
    },
    programs: {
      title: "Programs",
      subtitle: "Powerful Sports Courses Built for Transformation",
      desc: "Choose the right program for you, and start training with a clear plan and real results.",
      empty: "No programs available right now",
      emptyDesc: "Ensure programs are published (is_published = true) and active packages are linked to them.",
      cta: "Open Program",
      footerTitle: "I am a physical trainer... science-backed and real results",
      footerDesc: "My training isn't just motivational talk. You'll join with a plan, follow a system, and emerge as a stronger version of yourself. Strength, fitness, flexibility, and control... all with calculated progress and real tracking.",
      footerCta: "Contact & Start Now"
    },
    details: {
      title: "Course Details",
      selectPackage: "Select Package:",
      bookNow: "Book Your Spot",
      loginToSubscribe: "Log in to Subscribe",
      backToPrograms: "Back to Programs",
      cardNote: "Cards (Height / Weight / Age)",
      cardNoteInjuries: "Cards (Card Name)",
      courseContent: "Course Content",
      cardTitle: "Card #",
      subscribe: "Subscribe",
      loginToSubscribeCard: "Log in to Subscribe",
      openDetails: "Open Details",
      openMonth1: "Open Month 1",
      subscribeToPackage: "Subscribe to Package",
      openVideos: "Open Videos",
      selectPackageFirst: "Select a Package First",
      selectPackageFirstDesc: "To show your customized cards, select a package above.",
      monthsMode: "This course operates on a monthly schedule",
      availableMonths: "Available months in this course:",
      month: "Month",
      noCardsAvailable: "No cards are assigned to you currently. Use the activation code above or subscribe.",
      noCardsAvailableNoPkg: "No cards are assigned to you currently.",
      courseNotConfigured: "This program is not set up yet (no groups). Admin must add an age group followed by months."
    },
    welcome: {
      ready: "Ready, Champion?",
      welcome: "Welcome",
      welcomeWorld: "To the World of Champions",
      chooseLang: "Choose your preferred language",
      chooseLangSub: "اختر لغة الموقع لتخصيص محتواك الرياضي",
      loading: "Loading..."
    }
  }
};

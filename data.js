const siteData = {
  categories: {
    "articles": {
      title: "مضامین",
      type: "article",
      sections: [
        { id: "ramadan", title: "رمضان المبارک" },
        { id: "qurbani", title: "قربانی" },
        { id: "muharram", title: "محرم الحرام" }
      ]
    },
    "letters": {
      title: "مکتوبات",
      type: "article",
      sections: [] // Will be populated dynamically 2006 to 2026
    },
    "posts": {
      title: "اردو پوسٹس",
      type: "post",
      sections: [
        { id: "daily-duas", title: "روزمرہ کی دعائیں" },
        { id: "quotes", title: "اقوال زریں" }
      ]
    },
    "books": {
      title: "کتب",
      type: "book",
      sections: [
        { id: "fiqh", title: "فقہ" },
        { id: "hadees", title: "حدیث" },
        { id: "aqeedah", title: "عقائد" }
      ]
    },
    "audios": {
      title: "آڈیو بیانات",
      type: "audio",
      sections: [
        { id: "tafseer", title: "تفسیر قرآن" },
        { id: "islahi", title: "اصلاحی بیانات" }
      ]
    },
    "audio-books": {
      title: "آڈیو کتب",
      sections: [
        { id: "seerat", title: "سیرت النبی" },
        { id: "history", title: "تاریخ اسلام" }
      ]
    }
  },
  content: {
    // Keyed by categoryId_sectionId
    "articles_ramadan": [
      {
        id: "art-1",
        title: "رمضان المبارک کے فضائل و برکات",
        excerpt: "رمضان کا مہینہ اللہ کی رحمتوں اور برکتوں کا مہینہ ہے، جس میں ہر نیکی کا ثواب بڑھا دیا جاتا ہے۔",
        author: "مفتی محمد تقی عثمانی",
        date: "1 رمضان المبارک، 1447 ھ"
      }
    ],
    // Empty sections will fall back to empty state automatically
  },
  homeArticle: {
    title: "اسلام میں اخلاقیات کی اہمیت",
    excerpt: "اس مضمون میں قرآن و حدیث کی روشنی میں حسن اخلاق کی اہمیت، اس کے فضائل اور معاشرے پر اس کے مثبت اثرات کا تفصیلی جائزہ لیا گیا ہے۔ یہ واضح کیا گیا ہے کہ ایک سچے مسلمان کی پہچان اس کے بہترین اخلاق سے ہوتی ہے...",
    author: "مفتی محمد تقی عثمانی",
    date: "15 محرم الحرام، 1448 ھ",
    fullContent: "<p>یہاں مضمون کی مکمل تفصیل آئے گی۔</p>",
    mediaUrl: ""
  },
  adImage: "",
  newsTicker: {
    items: [
      "معارف شیخ ویب سائٹ پر خوش آمدید۔",
      "رمضان المبارک کے خصوصی مضامین شامل کیے گئے ہیں۔",
      "شیخ صاحب کے نئے بیانات اپلوڈ کر دیے گئے ہیں۔",
      "نئی کتب جلد ویب سائٹ پر دستیاب ہوں گی۔"
    ],
    settings: {
      speed: 15,
      pauseOnHover: true,
      bgColor: '#16a085',
      textColor: '#ffffff'
    }
  },
  footer: {
    aboutText: "یہ ویب سائٹ مستند اسلامی مواد، مضامین، کتب اور آڈیو بیانات کی فراہمی کے لیے قائم کی گئی ہے۔ ہمارا مقصد دین کی صحیح تعلیمات کو عام کرنا ہے۔",
    socialLinks: {
      facebook: "#",
      youtube: "#",
      whatsapp: "#",
      twitter: "",
      instagram: ""
    },
    contactInfo: {
      email: "info@maarifesheikh.com",
      phone: "+92 300 1234567"
    },
    copyrightText: "© 2026 معارف شیخ۔ جملہ حقوق محفوظ ہیں۔"
  },
  background: {
    type: 'color',
    value: '#f5f7fa',
    gradientColor1: '#f5f7fa',
    gradientColor2: '#c3cfe2'
  }
};

// Generate years for letters category
for (let year = 2026; year >= 2006; year--) {
  siteData.categories.letters.sections.push({
    id: `year-${year}`,
    title: `سن ${year}`
  });
}

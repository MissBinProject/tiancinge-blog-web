import type { Article, ContactMessage, MediaAsset, Service, SiteSettings } from './index';

const asset = (name: string) => `/assets/${name}`;

/**
 * A deterministic content set shared by the public site and admin preview.
 * It is intentionally marked as fixture data and must be replaced before launch.
 */
export const fixtureSettings: SiteSettings = {
  brandName: '天心閣養生會館',
  tagline: '放鬆身心・找回最美的自己',
  logoUrl: asset('logo/logo_1_去背.png'),
  phone: '0900-000-000',
  lineId: '@tianxinge',
  lineUrl: 'https://line.me/ti/p/@tianxinge',
  address: '臺北市中山區幸福路100號',
  businessHours: '10:00 - 02:00',
  mapEmbedUrl: 'https://www.google.com/maps?q=台北市中山區幸福路100號&output=embed',
  social: { line: 'https://line.me/ti/p/@tianxinge', instagram: '#', facebook: '#', youtube: '#' },
  heroTitle: '天心閣',
  heroSubtitle: '養生會館',
  heroDescription: '專業・貼心・隱私・尊貴體驗',
  heroBackgroundUrl: asset('design/01_標題.png'),
  servicesTitle: '服務項目',
  servicesSubtitle: '多元養生課程・滿足您的需求',
  servicesNote: '在天心閣，我們用專業的手技與貼心的服務，為您打造身心放鬆的尊貴體驗。',
  servicesBackgroundUrl: '',
  pricingTitle: '服務價格',
  pricingSubtitle: '透明收費・安心享受・寵愛自己',
  pricingBackgroundUrl: asset('design/02_服務價格背景.png'),
  newsTitle: '最新消息',
  newsSubtitle: '掌握最新活動・享受更多優惠',
  newsBackgroundUrl: asset('design/03_最新消息背景.png'),
  blogTitle: '部落格',
  blogSubtitle: '分享養生知識・遇見更好的自己',
  blogBackgroundUrl: asset('design/04_部落格背景.png'),
  contactTitle: '聯繫我們',
  contactLead: '歡迎預約・我們期待為您服務',
  contactBackgroundUrl: asset('design/contact.png'),
  benefits: [
    { title: '最新活動', caption: '不錯過任何優惠' },
    { title: '第一手資訊', caption: '掌握館內動態' },
    { title: '會員專屬', caption: '享受更多福利' },
    { title: '與您同行', caption: '一起變更好的自己' },
  ],
  pricingBenefits: [
    { title: '透明收費', caption: '無隱藏費用' },
    { title: '專業技師', caption: '貼心服務' },
    { title: '舒適環境', caption: '安心放鬆' },
    { title: '尊寵體驗', caption: '值得信賴' },
  ],
  privacyText: '我們重視您的隱私，僅於提供服務及回覆聯繫時使用您主動提供的資料。',
  termsText: '使用本網站即表示您同意相關服務規範。實際服務內容與價格以現場公告為準。',
  seoTitle: '天心閣養生會館｜放鬆身心・找回最美的自己',
  seoDescription: '天心閣養生會館，提供專業、貼心、隱私的養生體驗。',
  ogImageUrl: asset('design/01_標題.png'),
};

export const fixtureServices: Service[] = [
  { id: 's1', slug: 'full-body', name: '全身舒壓', summary: '釋放壓力・舒緩筋骨', description: '釋放壓力・舒緩筋骨\n重拾輕盈自在', imageUrl: asset('crops/service-1.png'), icon: 'lotus', durationMinutes: 60, price: 1500, sortOrder: 1, isVisible: true },
  { id: 's2', slug: 'essential-oil', name: '精油按摩', summary: '香氛療癒・放鬆身心', description: '香氛療癒・放鬆身心\n喚醒身體能量', imageUrl: asset('crops/service-2.png'), icon: 'oil', durationMinutes: 90, price: 2000, sortOrder: 2, isVisible: true },
  { id: 's3', slug: 'hot-stone', name: '熱石養生', summary: '溫熱能量・促進循環', description: '溫熱能量・促進循環\n深層放鬆', imageUrl: asset('crops/service-3.png'), icon: 'stone', durationMinutes: 90, price: 2200, sortOrder: 3, isVisible: true },
  { id: 's4', slug: 'foot', name: '足部舒壓', summary: '舒緩疲勞・促進代謝', description: '舒緩疲勞・促進代謝\n一夜好眠', imageUrl: asset('crops/service-4.png'), icon: 'foot', durationMinutes: 60, price: 1200, sortOrder: 4, isVisible: true },
  { id: 's5', slug: 'custom-course', name: '客製化課程', summary: '專屬方案・貼心安排', description: '專屬方案・貼心安排\n打造屬於您的放鬆體驗', imageUrl: asset('crops/service-5.png'), icon: 'flower', priceLabel: '洽詢', sortOrder: 5, isVisible: true },
];

export const fixtureArticles: Article[] = [
  { id: 'n1', slug: 'mid-autumn-offer', type: 'news', category: '活動訊息', title: '中秋限定優惠活動', excerpt: '放鬆身心，與您一起迎接美好的節日。即日起預約享專屬優惠！', seoTitle: '中秋限定優惠活動｜天心閣養生會館', seoDescription: '天心閣中秋限定療程與預約優惠。', coverUrl: asset('crops/news-1.png'), publishedAt: '2025-09-10', status: 'published', body: [{ type: 'paragraph', text: '在團聚的季節裡，留一段溫柔時光給自己。中秋限定療程即日起開放預約。' }] },
  { id: 'n2', slug: 'new-essential-oil-course', type: 'news', category: '課程介紹', title: '全新精油課程登場', excerpt: '嚴選天然精油，帶給您更深層的放鬆體驗，喚醒身心能量。', seoTitle: '全新精油課程登場｜天心閣養生會館', seoDescription: '認識天心閣全新精油按摩課程。', coverUrl: asset('crops/news-2.png'), publishedAt: '2025-09-05', status: 'published', body: [{ type: 'paragraph', text: '全新精油課程以舒緩香氣與細緻手技，陪你放下日常的忙碌。' }] },
  { id: 'n3', slug: 'space-upgrade', type: 'news', category: '館內公告', title: '環境升級・更舒適的空間', excerpt: '全新空間完成，提供更舒適、溫馨的養生環境，期待與您相見。', seoTitle: '環境升級・更舒適的空間｜天心閣養生會館', seoDescription: '看看天心閣為你準備的舒適養生空間。', coverUrl: asset('crops/news-3.png'), publishedAt: '2025-08-28', status: 'published', body: [{ type: 'paragraph', text: '我們完成了接待區與療程空間的升級，讓每次到訪都更加安心。' }] },
  { id: 'b1', slug: 'healing-power-of-oils', type: 'blog', category: '養生知識', title: '精油的療癒力量', excerpt: '認識不同精油的功效，讓身心獲得深層放鬆。', seoTitle: '精油的療癒力量｜天心閣養生會館', seoDescription: '了解精油香氣與放鬆體驗的關係。', coverUrl: asset('crops/blog-1.png'), publishedAt: '2025-09-05', status: 'published', body: [{ type: 'heading', text: '香氣與身心的連結' }, { type: 'paragraph', text: '精油的香氣能為日常帶來一點餘裕，搭配專業按摩，讓呼吸重新變得深長。' }] },
  { id: 'b2', slug: 'daily-wellness-tips', type: 'blog', category: '生活美學', title: '日常養生小技巧', excerpt: '從生活細節開始，打造健康與美麗的日常。', seoTitle: '日常養生小技巧｜天心閣養生會館', seoDescription: '從生活細節開始建立放鬆的養生習慣。', coverUrl: asset('crops/blog-2.png'), publishedAt: '2025-08-25', status: 'published', body: [{ type: 'paragraph', text: '每天給自己幾分鐘伸展、補充水分，就是照顧自己的溫柔練習。' }] },
  { id: 'b3', slug: 'relieve-stress', type: 'blog', category: '心靈成長', title: '如何舒緩壓力？', excerpt: '幾個簡單的方法，讓心情回到平靜。', seoTitle: '如何舒緩壓力？｜天心閣養生會館', seoDescription: '幾個簡單方法陪你找回平靜。', coverUrl: asset('crops/blog-3.png'), publishedAt: '2025-08-18', status: 'published', body: [{ type: 'list', text: '每天留一段安靜時間', items: ['深呼吸三次', '放下手機，感受當下', '讓睡眠成為優先'] }] },
  { id: 'b4', slug: 'comfortable-space', type: 'blog', category: '館內日常', title: '環境升級・更舒適的空間', excerpt: '全新空間完成，提供更舒適、溫馨的養生環境。', seoTitle: '環境升級・更舒適的空間｜天心閣養生會館', seoDescription: '看看天心閣為你準備的舒適養生空間。', coverUrl: asset('crops/blog-4.png'), publishedAt: '2025-08-10', status: 'published', body: [{ type: 'paragraph', text: '一盞燈、一朵花，都是我們希望你感受到的安心。' }] },
  { id: 'n-draft', slug: 'internal-autumn-draft', type: 'news', category: '館內公告', title: '內部草稿：秋季養生企劃', excerpt: '尚未發布的內部內容。', coverUrl: asset('crops/news-3.png'), publishedAt: '2025-09-14', status: 'draft', body: [] },
];

export const fixtureCategories = [
  { id: 'cat-news-offer', name: '活動訊息', type: 'news' as const },
  { id: 'cat-news-course', name: '課程介紹', type: 'news' as const },
  { id: 'cat-news-announcement', name: '館內公告', type: 'news' as const },
  { id: 'cat-blog-knowledge', name: '養生知識', type: 'blog' as const },
  { id: 'cat-blog-life', name: '生活美學', type: 'blog' as const },
  { id: 'cat-blog-mind', name: '心靈成長', type: 'blog' as const },
  { id: 'cat-blog-daily', name: '館內日常', type: 'blog' as const },
];

export const fixtureMessages: ContactMessage[] = [
  { id: 'message-1', name: '王小姐', phone: '0912-345-678', email: 'visitor@example.com', message: '想詢問精油按摩的預約方式，請協助回覆。', status: 'unread', createdAt: '2025-09-14T10:30:00+08:00' },
  { id: 'message-2', name: '林先生', phone: '0987-654-321', message: '上次服務很滿意，謝謝團隊的照顧。', status: 'handled', note: '已於電話中回覆', createdAt: '2025-09-13T16:20:00+08:00' },
];

const mediaDefinition: Array<[string, string, string, number, number]> = [
  ['service-1.png', '全身舒壓', 'crops', 285, 125], ['service-2.png', '精油按摩', 'crops', 285, 125], ['service-3.png', '熱石養生', 'crops', 285, 125], ['service-4.png', '足部舒壓', 'crops', 285, 125], ['service-5.png', '客製化課程', 'crops', 285, 125],
  ['news-1.png', '中秋限定優惠活動', 'crops', 410, 175], ['news-2.png', '全新精油課程登場', 'crops', 410, 175], ['news-3.png', '環境升級', 'crops', 410, 175],
  ['blog-1.png', '精油的療癒力量', 'crops', 320, 180], ['blog-2.png', '日常養生小技巧', 'crops', 320, 180], ['blog-3.png', '如何舒緩壓力', 'crops', 320, 180], ['blog-4.png', '舒適的空間', 'crops', 320, 180],
  ['icon-01.png', '全身舒壓圖示', 'icons', 62, 56], ['icon-02.png', '精油按摩圖示', 'icons', 62, 56], ['icon-03.png', '熱石養生圖示', 'icons', 62, 56], ['icon-04.png', '足部舒壓圖示', 'icons', 62, 56], ['icon-05.png', '客製化課程圖示', 'icons', 62, 56],
  ['01_標題.png', '主視覺背景', 'design', 2172, 724], ['02_服務價格背景.png', '價格區背景', 'design', 1737, 906], ['03_最新消息背景.png', '消息區背景', 'design', 1670, 941], ['04_部落格背景.png', '部落格區背景', 'design', 1666, 944], ['contact.png', '聯繫區背景', 'design', 1767, 890], ['logo_1_去背.png', '品牌 Logo', 'logo', 1254, 1254],
];

export const fixtureMedia: MediaAsset[] = mediaDefinition.map(([name, alt, folder, width, height], index) => ({
  id: `media-${index + 1}`,
  name,
  url: asset(`${folder}/${name}`),
  alt,
  mimeType: 'image/png',
  size: 0,
  width,
  height,
  createdAt: '2025-09-01T00:00:00.000Z',
}));

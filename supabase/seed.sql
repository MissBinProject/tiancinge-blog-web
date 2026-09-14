-- Local fixture data for an empty Supabase project. Replace contact and policy
-- values with the confirmed store information before production launch.
insert into site_settings (
  id, brand_name, tagline, logo_url, phone, line_id, line_url, address,
  business_hours, map_embed_url, social, hero_title, hero_subtitle,
  hero_description, hero_background_url, services_title, services_subtitle,
  services_note, services_background_url, pricing_title, pricing_subtitle,
  pricing_background_url, news_title, news_subtitle, news_background_url,
  blog_title, blog_subtitle, blog_background_url, contact_title, contact_lead,
  contact_background_url, benefits, pricing_benefits, privacy_text, terms_text, seo_title,
  seo_description, og_image_url
) values (
  '00000000-0000-0000-0000-000000000001', '天心閣養生會館',
  '放鬆身心・找回最美的自己', '/assets/logo/logo_1_去背.png',
  '0900-000-000', '@tianxinge', 'https://line.me/ti/p/@tianxinge',
  '臺北市中山區幸福路100號', '10:00 - 02:00',
  'https://www.google.com/maps?q=台北市中山區幸福路100號&output=embed',
  '{"line":"https://line.me/ti/p/@tianxinge","instagram":"#","facebook":"#","youtube":"#"}'::jsonb,
  '天心閣', '養生會館', '專業・貼心・隱私・尊貴體驗',
  '/assets/design/01_標題.png', '服務項目', '多元養生課程・滿足您的需求',
  '在天心閣，我們用專業的手技與貼心的服務，為您打造身心放鬆的尊貴體驗。',
  null, '服務價格', '透明收費・安心享受・寵愛自己',
  '/assets/design/02_服務價格背景.png', '最新消息', '掌握最新活動・享受更多優惠',
  '/assets/design/03_最新消息背景.png', '部落格', '分享養生知識・遇見更好的自己',
  '/assets/design/04_部落格背景.png', '聯繫我們', '歡迎預約・我們期待為您服務',
  '/assets/design/contact.png',
  '[{"title":"最新活動","caption":"不錯過任何優惠"},{"title":"第一手資訊","caption":"掌握館內動態"},{"title":"會員專屬","caption":"享受更多福利"},{"title":"與您同行","caption":"一起變更好的自己"}]'::jsonb,
  '[{"title":"透明收費","caption":"無隱藏費用"},{"title":"專業技師","caption":"貼心服務"},{"title":"舒適環境","caption":"安心放鬆"},{"title":"尊寵體驗","caption":"值得信賴"}]'::jsonb,
  '我們重視您的隱私，僅於提供服務及回覆聯繫時使用您主動提供的資料。',
  '使用本網站即表示您同意相關服務規範。實際服務內容與價格以現場公告為準。',
  '天心閣養生會館｜放鬆身心・找回最美的自己',
  '天心閣養生會館，提供專業、貼心、隱私的養生體驗。',
  '/assets/design/01_標題.png'
) on conflict (id) do update set
  brand_name = excluded.brand_name, tagline = excluded.tagline,
  logo_url = excluded.logo_url, phone = excluded.phone,
  line_id = excluded.line_id, line_url = excluded.line_url,
  address = excluded.address, business_hours = excluded.business_hours,
  map_embed_url = excluded.map_embed_url, social = excluded.social,
  hero_title = excluded.hero_title, hero_subtitle = excluded.hero_subtitle,
  hero_description = excluded.hero_description,
  hero_background_url = excluded.hero_background_url,
  services_title = excluded.services_title,
  services_subtitle = excluded.services_subtitle,
  services_note = excluded.services_note,
  services_background_url = excluded.services_background_url,
  pricing_title = excluded.pricing_title,
  pricing_subtitle = excluded.pricing_subtitle,
  pricing_background_url = excluded.pricing_background_url,
  news_title = excluded.news_title, news_subtitle = excluded.news_subtitle,
  news_background_url = excluded.news_background_url,
  blog_title = excluded.blog_title, blog_subtitle = excluded.blog_subtitle,
  blog_background_url = excluded.blog_background_url,
  contact_title = excluded.contact_title, contact_lead = excluded.contact_lead,
  contact_background_url = excluded.contact_background_url,
  benefits = excluded.benefits, pricing_benefits = excluded.pricing_benefits, privacy_text = excluded.privacy_text,
  terms_text = excluded.terms_text, seo_title = excluded.seo_title,
  seo_description = excluded.seo_description, og_image_url = excluded.og_image_url;

insert into services (id, slug, name, summary, description, image_url, icon, duration_minutes, price, price_label, sort_order, is_visible) values
  ('10000000-0000-0000-0000-000000000001', 'full-body', '全身舒壓', '釋放壓力・舒緩筋骨', E'釋放壓力・舒緩筋骨\n重拾輕盈自在', '/assets/crops/service-1.png', 'lotus', 60, 1500, null, 1, true),
  ('10000000-0000-0000-0000-000000000002', 'essential-oil', '精油按摩', '香氛療癒・放鬆身心', E'香氛療癒・放鬆身心\n喚醒身體能量', '/assets/crops/service-2.png', 'oil', 90, 2000, null, 2, true),
  ('10000000-0000-0000-0000-000000000003', 'hot-stone', '熱石養生', '溫熱能量・促進循環', E'溫熱能量・促進循環\n深層放鬆', '/assets/crops/service-3.png', 'stone', 90, 2200, null, 3, true),
  ('10000000-0000-0000-0000-000000000004', 'foot', '足部舒壓', '舒緩疲勞・促進代謝', E'舒緩疲勞・促進代謝\n一夜好眠', '/assets/crops/service-4.png', 'foot', 60, 1200, null, 4, true),
  ('10000000-0000-0000-0000-000000000005', 'custom-course', '客製化課程', '專屬方案・貼心安排', E'專屬方案・貼心安排\n打造屬於您的放鬆體驗', '/assets/crops/service-5.png', 'flower', null, null, '洽詢', 5, true)
on conflict (slug) do update set
  name = excluded.name, summary = excluded.summary, description = excluded.description,
  image_url = excluded.image_url, icon = excluded.icon,
  duration_minutes = excluded.duration_minutes, price = excluded.price,
  price_label = excluded.price_label, sort_order = excluded.sort_order,
  is_visible = excluded.is_visible;

insert into article_categories (name, type) values
  ('活動訊息', 'news'), ('課程介紹', 'news'), ('館內公告', 'news'),
  ('養生知識', 'blog'), ('生活美學', 'blog'), ('心靈成長', 'blog'),
  ('館內日常', 'blog')
on conflict (name) do update set type = excluded.type;

insert into articles (id, slug, type, category_id, title, excerpt, seo_title, seo_description, cover_url, body, published_at, status) values
  ('20000000-0000-0000-0000-000000000001', 'mid-autumn-offer', 'news', (select id from article_categories where name = '活動訊息'), '中秋限定優惠活動', '放鬆身心，與您一起迎接美好的節日。即日起預約享專屬優惠！', '中秋限定優惠活動｜天心閣養生會館', '天心閣中秋限定療程與預約優惠。', '/assets/crops/news-1.png', '[{"type":"paragraph","text":"在團聚的季節裡，留一段溫柔時光給自己。中秋限定療程即日起開放預約。"}]'::jsonb, '2025-09-10', 'published'),
  ('20000000-0000-0000-0000-000000000002', 'new-essential-oil-course', 'news', (select id from article_categories where name = '課程介紹'), '全新精油課程登場', '嚴選天然精油，帶給您更深層的放鬆體驗，喚醒身心能量。', '全新精油課程登場｜天心閣養生會館', '認識天心閣全新精油按摩課程。', '/assets/crops/news-2.png', '[{"type":"paragraph","text":"全新精油課程以舒緩香氣與細緻手技，陪你放下日常的忙碌。"}]'::jsonb, '2025-09-05', 'published'),
  ('20000000-0000-0000-0000-000000000003', 'space-upgrade', 'news', (select id from article_categories where name = '館內公告'), '環境升級・更舒適的空間', '全新空間完成，提供更舒適、溫馨的養生環境，期待與您相見。', '環境升級・更舒適的空間｜天心閣養生會館', '看看天心閣為你準備的舒適養生空間。', '/assets/crops/news-3.png', '[{"type":"paragraph","text":"我們完成了接待區與療程空間的升級，讓每次到訪都更加安心。"}]'::jsonb, '2025-08-28', 'published'),
  ('20000000-0000-0000-0000-000000000004', 'healing-power-of-oils', 'blog', (select id from article_categories where name = '養生知識'), '精油的療癒力量', '認識不同精油的功效，讓身心獲得深層放鬆。', '精油的療癒力量｜天心閣養生會館', '了解精油香氣與放鬆體驗的關係。', '/assets/crops/blog-1.png', '[{"type":"heading","text":"香氣與身心的連結"},{"type":"paragraph","text":"精油的香氣能為日常帶來一點餘裕，搭配專業按摩，讓呼吸重新變得深長。"}]'::jsonb, '2025-09-05', 'published'),
  ('20000000-0000-0000-0000-000000000005', 'daily-wellness-tips', 'blog', (select id from article_categories where name = '生活美學'), '日常養生小技巧', '從生活細節開始，打造健康與美麗的日常。', '日常養生小技巧｜天心閣養生會館', '從生活細節開始建立放鬆的養生習慣。', '/assets/crops/blog-2.png', '[{"type":"paragraph","text":"每天給自己幾分鐘伸展、補充水分，就是照顧自己的溫柔練習。"}]'::jsonb, '2025-08-25', 'published'),
  ('20000000-0000-0000-0000-000000000006', 'relieve-stress', 'blog', (select id from article_categories where name = '心靈成長'), '如何舒緩壓力？', '幾個簡單的方法，讓心情回到平靜。', '如何舒緩壓力？｜天心閣養生會館', '幾個簡單方法陪你找回平靜。', '/assets/crops/blog-3.png', '[{"type":"list","text":"每天留一段安靜時間","items":["深呼吸三次","放下手機，感受當下","讓睡眠成為優先"]}]'::jsonb, '2025-08-18', 'published'),
  ('20000000-0000-0000-0000-000000000007', 'comfortable-space', 'blog', (select id from article_categories where name = '館內日常'), '環境升級・更舒適的空間', '全新空間完成，提供更舒適、溫馨的養生環境。', '環境升級・更舒適的空間｜天心閣養生會館', '看看天心閣為你準備的舒適養生空間。', '/assets/crops/blog-4.png', '[{"type":"paragraph","text":"一盞燈、一朵花，都是我們希望你感受到的安心。"}]'::jsonb, '2025-08-10', 'published'),
  ('20000000-0000-0000-0000-000000000008', 'internal-autumn-draft', 'news', (select id from article_categories where name = '館內公告'), '內部草稿：秋季養生企劃', '尚未發布的內部內容。', null, null, '/assets/crops/news-3.png', '[]'::jsonb, '2025-09-14', 'draft')
on conflict (slug) do update set
  type = excluded.type, category_id = excluded.category_id, title = excluded.title,
  excerpt = excluded.excerpt, seo_title = excluded.seo_title,
  seo_description = excluded.seo_description, cover_url = excluded.cover_url, body = excluded.body,
  published_at = excluded.published_at, status = excluded.status;

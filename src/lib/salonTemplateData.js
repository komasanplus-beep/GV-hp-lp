/**
 * salonTemplateData.js
 * サロンテンプレートの初期データセット
 */

export const SALON_TEMPLATE_SERVICES = [
  {
    name: 'ヘアカット',
    description: 'プロのスタイリストによる似合わせカット。トレンドスタイルから定番スタイルまで対応します。',
    price: 5500,
    duration: '60分',
    capacity: 1,
    image_url: 'https://images.unsplash.com/photo-1595361984547-3d41b5e34d25?w=500&h=400&fit=crop',
    category: 'hair_cut',
    amenities: ['シャンプー込み', 'ドライセット', 'カウンセリング'],
    status: 'available',
  },
  {
    name: 'カラーリング',
    description: '髪に優しい高級カラー剤を使用。デザインカラーから白髪染めまで幅広い施術に対応。',
    price: 8800,
    duration: '90分',
    capacity: 1,
    image_url: 'https://images.unsplash.com/photo-1596729936813-5b6d34e8e5d3?w=500&h=400&fit=crop',
    category: 'hair_color',
    amenities: ['頭皮ケア', 'トリートメント', 'デザイン相談'],
    status: 'available',
  },
  {
    name: 'パーマ',
    description: 'ダメージを最小限に抑えた高級パーマメニュー。デジタルパーマも対応。',
    price: 9900,
    duration: '120分',
    capacity: 1,
    image_url: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=500&h=400&fit=crop',
    category: 'hair_perm',
    amenities: ['ヘッドマッサージ', 'トリートメント', 'スタイリング'],
    status: 'available',
  },
];

export const SALON_BLOCK_HERO = {
  hero_mode: 'slider',
  headline: 'Hair Salon Bawi',
  subheadline: 'あなたの理想のスタイルを実現する',
  eyebrow: 'Welcome to',
  cta_text: 'ご予約はこちら',
  cta_url: '#contact',
  image_urls: [
    'https://images.unsplash.com/photo-1595361984547-3d41b5e34d25?w=1200&h=800&fit=crop',
    'https://images.unsplash.com/photo-1596729936813-5b6d34e8e5d3?w=1200&h=800&fit=crop',
  ],
  image_opacity: 0.5,
  image_brightness: 100,
  overlay_type: 'gradient',
  gradient_from: '#00000080',
  gradient_to: '#000000CC',
  gradient_direction: 'to-bottom',
  text_align: 'center',
  text_color: '#ffffff',
  text_shadow: true,
  autoplay: true,
  slide_interval: 4000,
  transition_type: 'fade',
};

export const SALON_BLOCK_ABOUT = {
  title: '「美しく」「心地よく」を大切にしたサロン',
  body: 'Hair Salon Bawiでは、経験豊富なスタイリストがお客様一人ひとりに寄り添い、理想のスタイルを実現します。最新のテクニックと上質なケア商品で、あなたの髪と心をケアします。',
  tagline: 'Beautiful Hair, Happy Life',
  image_url: 'https://images.unsplash.com/photo-1595361984547-3d41b5e34d25?w=600&h=400&fit=crop',
};

export const SALON_BLOCK_STAFF = {
  title: 'スタイリスト',
  members: 'Yuki Tanaka|ヘッドスタイリスト、カラー専門\nHaruka Nakamura|カット＆パーマ専門\nMisaki Yamamoto|トリートメント・アシスタント',
};

export const SALON_BLOCK_GALLERY = {
  title: 'ギャラリー',
  body: '最新のスタイル提案とスタイリング実績',
  image_urls: [
    'https://images.unsplash.com/photo-1595361984547-3d41b5e34d25?w=500&h=400&fit=crop',
    'https://images.unsplash.com/photo-1596729936813-5b6d34e8e5d3?w=500&h=400&fit=crop',
    'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=500&h=400&fit=crop',
    'https://images.unsplash.com/photo-1505664202109-b89fbc8ac1f1?w=500&h=400&fit=crop',
    'https://images.unsplash.com/photo-1596729936813-5b6d34e8e5d3?w=500&h=400&fit=crop',
    'https://images.unsplash.com/photo-1595361984547-3d41b5e34d25?w=500&h=400&fit=crop',
  ],
};

export const SALON_BLOCK_VOICE = {
  title: 'お客様の声',
  voices: 'Aさん|毎回、丁寧なカウンセリングで理想のスタイルにしてくれます。スタッフも明るくて気持ちいい！\nBさん|カラーで傷んだ髪を見事に蘇らせてくれました。トリートメントの効果も凄い。\nCさん|予約も取りやすくて、居心地がいいサロンです。これからも通い続けます。',
};

export const SALON_BLOCK_FAQ = {
  title: 'よくあるご質問',
  faqs: 'はじめてですが大丈夫ですか？|もちろんです！詳しくカウンセリングさせていただきます。気になることはお気軽にお聞きください。\n予約は必須ですか？|はい、完全予約制です。お電話またはWebでのご予約をお待ちしております。\nキャンセル料金はかかりますか？|ご予約の前日までのキャンセルは無料です。当日キャンセルは施術料金の50%をいただきます。\nカットの時間はどのくらい？|通常60分程度です。ロングヘアやスタイルによって異なります。',
};

export const SALON_BLOCK_CONTACT = {
  title: 'ご予約はこちら',
  body: '理想のスタイルを実現するために、まずはお気軽にご予約ください。スタイリストがお待ちしています。',
  button_text: '予約する',
};
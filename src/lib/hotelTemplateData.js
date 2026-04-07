/**
 * hotelTemplateData.js
 * ホテルテンプレートの初期データセット
 */

export const HOTEL_TEMPLATE_SERVICES = [
  {
    name: 'Single Room',
    description: 'Cozy room with premium bedding, ideal for solo travelers. Includes en-suite bathroom and high-speed WiFi.',
    price: 12000,
    duration: '1泊',
    capacity: 1,
    image_url: 'https://images.unsplash.com/photo-1631049307038-da0ec89d4d0a?w=500&h=400&fit=crop',
    category: 'room',
    amenities: ['WiFi', 'Air Conditioning', 'Private Bath', 'Work Desk'],
    size: 25,
    bed_type: 'Single Bed',
    status: 'available',
  },
  {
    name: 'Twin Room',
    description: 'Spacious room with two single beds, perfect for friends or colleagues. Enjoy our premium mattresses and city views.',
    price: 16000,
    duration: '1泊',
    capacity: 2,
    image_url: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=500&h=400&fit=crop',
    category: 'room',
    amenities: ['WiFi', 'Air Conditioning', 'Private Bath', 'Flat-screen TV', 'Work Desk'],
    size: 35,
    bed_type: 'Twin Beds',
    status: 'available',
  },
  {
    name: 'Deluxe Suite',
    description: 'Luxurious suite with separate living area, premium amenities, and panoramic city views. Ultimate comfort and elegance.',
    price: 28000,
    duration: '1泊',
    capacity: 3,
    image_url: 'https://images.unsplash.com/photo-1559023027-3bfb66c60b06?w=500&h=400&fit=crop',
    category: 'room',
    amenities: ['WiFi', 'Air Conditioning', 'Marble Bath', 'Separate Lounge', 'Smart TV', 'Concierge'],
    size: 65,
    bed_type: 'King Bed + Sofabed',
    status: 'available',
  },
];

export const HOTEL_BLOCK_HERO = {
  hero_mode: 'slider',
  headline: 'Bawi Hotel',
  subheadline: 'Luxury Accommodation & Unforgettable Experiences',
  eyebrow: 'Welcome to',
  cta_text: 'Book Your Stay',
  cta_url: '#contact',
  image_urls: [
    'https://images.unsplash.com/photo-1631049307038-da0ec89d4d0a?w=1200&h=800&fit=crop',
    'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1200&h=800&fit=crop',
  ],
  image_opacity: 0.6,
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

export const HOTEL_BLOCK_ABOUT = {
  title: 'Experience Luxury & Comfort',
  body: 'At Bawi Hotel, we believe in providing more than just accommodation. Our thoughtfully designed rooms, world-class amenities, and attentive staff ensure every moment of your stay is extraordinary. Whether you\'re here for business or leisure, immerse yourself in the perfect blend of comfort and elegance.',
  tagline: 'Where Every Moment Becomes A Memory',
  image_url: 'https://images.unsplash.com/photo-1631049307038-da0ec89d4d0a?w=600&h=400&fit=crop',
};

export const HOTEL_BLOCK_FACILITIES = {
  title: 'Our Facilities & Amenities',
  features: 'Premium Bedding & Linens\nHigh-Speed WiFi\nFitness Center\nRestaurant & Lounge\n24-Hour Concierge\nValet Parking',
};

export const HOTEL_BLOCK_GALLERY = {
  title: 'Gallery',
  body: 'Explore the beauty and elegance of our hotel',
  image_urls: [
    'https://images.unsplash.com/photo-1631049307038-da0ec89d4d0a?w=500&h=400&fit=crop',
    'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=500&h=400&fit=crop',
    'https://images.unsplash.com/photo-1559023027-3bfb66c60b06?w=500&h=400&fit=crop',
    'https://images.unsplash.com/photo-1582719471384-894fbb16e074?w=500&h=400&fit=crop',
    'https://images.unsplash.com/photo-1578683519653-38a9cfef5627?w=500&h=400&fit=crop',
    'https://images.unsplash.com/photo-1631049307038-da0ec89d4d0a?w=500&h=400&fit=crop',
  ],
};

export const HOTEL_BLOCK_ACCESS = {
  title: 'Location & Access',
  address: '東京都渋谷区道玄坂1-2-3 Bawi Hotel Building',
  phone: '03-XXXX-XXXX',
  hours: '24 Hours\nCheck-in: 15:00\nCheck-out: 11:00',
  map_embed_url: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3240.823521572327!2d139.7029!3d35.6595!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x60188b5b5f5f5f5f%3A0x0!2sBawi%20Hotel!5e0!3m2!1sja!2sjp',
};

export const HOTEL_BLOCK_CONTACT = {
  title: 'Make Your Reservation',
  body: 'Ready to experience luxury? Book your stay with us today and create unforgettable memories.',
  button_text: 'Reserve Now',
};
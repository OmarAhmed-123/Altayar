/**
 * Database Seeder Script
 * ==========================================
 * This script populates the database with realistic tourism-related data
 * Uses Unsplash API for images and Pexels API for videos
 * All data is secure, professional, and related to tourism
 * ==========================================
 */

require('dotenv').config();
const { Model } = require('objection');
const Knex = require('knex');
const knexConfig = require('../knexfile');
const bcrypt = require('bcryptjs');
const axios = require('axios');

// Initialize Knex
const knex = Knex(knexConfig.development);
Model.knex(knex);

// Import Models
const User = require('../models/User');
const Package = require('../models/Package');
const Membership = require('../models/Membership');
const Booking = require('../models/Booking');
const Blog = require('../models/Blog');
const Ad = require('../models/Ad');
const Review = require('../models/Review');
const Comment = require('../models/Comment');
const Notification = require('../models/Notification');
const Transaction = require('../models/Transaction');
const Voucher = require('../models/Voucher');
const Trip = require('../models/Trip');
const Document = require('../models/Document');
const Setting = require('../models/Setting');
const Language = require('../models/Language');
const Currency = require('../models/Currency');
const Partner = require('../models/Partner');
const PartnerService = require('../models/PartnerService');
const Itinerary = require('../models/Itinerary');

// Image API Helper - Using Unsplash (free tier)
async function getImageFromUnsplash(query, width = 800, height = 600) {
  try {
    // Unsplash Source API (no key required for basic usage)
    const url = `https://source.unsplash.com/${width}x${height}/?${encodeURIComponent(query)}`;
    return url;
  } catch (error) {
    console.error(`Error fetching image for ${query}:`, error.message);
    // Fallback to placeholder
    return `https://via.placeholder.com/${width}x${height}?text=${encodeURIComponent(query)}`;
  }
}

// Video API Helper - Using Pexels (free tier)
async function getVideoFromPexels(query) {
  try {
    // Pexels API (requires API key, but we'll use a placeholder for now)
    // In production, you should add PEXELS_API_KEY to .env
    const apiKey = process.env.PEXELS_API_KEY || '';
    if (apiKey) {
      const response = await axios.get(`https://api.pexels.com/videos/search?query=${encodeURIComponent(query)}&per_page=1`, {
        headers: { 'Authorization': apiKey }
      });
      if (response.data.videos && response.data.videos.length > 0) {
        return response.data.videos[0].video_files[0].link;
      }
    }
    // Fallback to a sample video URL (you can replace with actual video URLs)
    return `https://sample-videos.com/video123/mp4/720/big_buck_bunny_720p_1mb.mp4`;
  } catch (error) {
    console.error(`Error fetching video for ${query}:`, error.message);
    return null;
  }
}

// Tourism-related data in Arabic and English
const tourismData = {
  packages: [
    {
      name: 'رحلة الأهرامات وأبو الهول',
      description: 'رحلة مميزة لاستكشاف عجائب مصر القديمة، زيارة الأهرامات وأبو الهول مع مرشد سياحي محترف',
      days: 1,
      nights: 0,
      price: 1500,
      services: ['نقل من وإلى الفندق', 'تذاكر الدخول', 'مرشد سياحي', 'غداء'],
      images: [],
      is_exclusive: false,
      is_active: true
    },
    {
      name: 'رحلة نيلية من الأقصر إلى أسوان',
      description: 'رحلة بحرية رائعة على نهر النيل لمدة 4 أيام، استمتع بالمناظر الطبيعية الخلابة والمعابد الفرعونية',
      days: 4,
      nights: 3,
      price: 8500,
      services: ['إقامة في كروز فاخر', 'وجبات كاملة', 'جولات سياحية', 'ترفيه'],
      images: [],
      is_exclusive: true,
      is_active: true
    },
    {
      name: 'رحلة شرم الشيخ',
      description: 'عطلة بحرية ممتعة في شرم الشيخ مع أنشطة الغوص والسباحة والاسترخاء على الشواطئ الذهبية',
      days: 5,
      nights: 4,
      price: 12000,
      services: ['إقامة في فندق 5 نجوم', 'وجبات', 'أنشطة بحرية', 'نقل'],
      images: [],
      is_exclusive: false,
      is_active: true
    },
    {
      name: 'رحلة واحة سيوة',
      description: 'مغامرة فريدة في واحة سيوة، استكشف الصحراء والبحيرات المالحة والثقافة البربرية',
      days: 3,
      nights: 2,
      price: 4500,
      services: ['إقامة في لودج صحراوي', 'جولات صحراوية', 'وجبات تقليدية', 'نقل'],
      images: [],
      is_exclusive: false,
      is_active: true
    },
    {
      name: 'رحلة الإسكندرية التاريخية',
      description: 'جولة في عروس البحر المتوسط، زيارة مكتبة الإسكندرية والقلعة والمناطق التاريخية',
      days: 2,
      nights: 1,
      price: 2800,
      services: ['إقامة في فندق', 'جولات سياحية', 'وجبات', 'نقل'],
      images: [],
      is_exclusive: false,
      is_active: true
    },
    {
      name: 'رحلة دير سانت كاترين وجبل موسى',
      description: 'رحلة روحية وتاريخية إلى دير سانت كاترين وتسلق جبل موسى لمشاهدة شروق الشمس',
      days: 2,
      nights: 1,
      price: 3200,
      services: ['إقامة', 'نقل', 'مرشد', 'وجبات'],
      images: [],
      is_exclusive: false,
      is_active: true
    },
    {
      name: 'رحلة وادي الملوك والأقصر',
      description: 'استكشف وادي الملوك ومعابد الأقصر وكرنك، رحلة إلى قلب الحضارة الفرعونية',
      days: 2,
      nights: 1,
      price: 3500,
      services: ['إقامة', 'تذاكر', 'مرشد', 'نقل'],
      images: [],
      is_exclusive: true,
      is_active: true
    },
    {
      name: 'رحلة الغردقة للغوص',
      description: 'رحلة متخصصة للغوص في البحر الأحمر، استمتع بالشعاب المرجانية والأسماك الملونة',
      days: 4,
      nights: 3,
      price: 9800,
      services: ['إقامة', 'معدات غوص', 'مدرب', 'وجبات'],
      images: [],
      is_exclusive: true,
      is_active: true
    }
  ],
  memberships: [
    {
      name: 'عضوية برونزية',
      price: 500,
      points: 1000,
      benefits: ['خصم 5% على جميع الرحلات', 'نقاط مكافآت', 'دعم فني'],
      pdf_url: null,
      is_active: true
    },
    {
      name: 'عضوية فضية',
      price: 1500,
      points: 5000,
      benefits: ['خصم 10% على جميع الرحلات', 'نقاط مكافآت مضاعفة', 'دعم فني مميز', 'وصول مبكر للعروض'],
      pdf_url: null,
      is_active: true
    },
    {
      name: 'عضوية ذهبية',
      price: 3500,
      points: 15000,
      benefits: ['خصم 15% على جميع الرحلات', 'نقاط مكافآت ثلاثية', 'دعم فني 24/7', 'وصول مبكر', 'ترقية مجانية'],
      pdf_url: null,
      is_active: true
    },
    {
      name: 'عضوية بلاتينية',
      price: 7500,
      points: 40000,
      benefits: ['خصم 20% على جميع الرحلات', 'نقاط مكافآت غير محدودة', 'دعم فني مخصص', 'ترقيات مجانية', 'رحلات حصرية'],
      pdf_url: null,
      is_active: true
    }
  ],
  users: [
    {
      name: 'أحمد سيف الدين',
      email: 'ahmedsaifdin237@gmail.com',
      password: 'AAIOH2040%%Ff%',
      role: 'customer',
      points: 25000,
      cashback: 12500.50
    },
    {
      name: 'علي أحمد',
      email: 'aliahme8720@gmail.com',
      password: 'AAIOH2040%%Ff%',
      role: 'customer',
      points: 18000,
      cashback: 8900.75
    },
    {
      name: 'علي عمر',
      email: 'aliomar12608@gmail.com',
      password: 'AAIOH2040%%Ff%',
      role: 'customer',
      points: 32000,
      cashback: 15600.00
    },
    {
      name: 'فاطمة أحمد',
      email: 'fatima@example.com',
      password: 'AAIOH2040%%Ff%',
      role: 'customer',
      points: 15000,
      cashback: 7500.25
    },
    {
      name: 'محمد حسن',
      email: 'mohamed@example.com',
      password: 'AAIOH2040%%Ff%',
      role: 'customer',
      points: 45000,
      cashback: 22500.00
    },
    {
      name: 'سارة محمود',
      email: 'sara@example.com',
      password: 'AAIOH2040%%Ff%',
      role: 'customer',
      points: 28000,
      cashback: 14000.50
    },
    {
      name: 'خالد سعيد',
      email: 'khaled@example.com',
      password: 'AAIOH2040%%Ff%',
      role: 'customer',
      points: 550000, // أكثر من نصف مليون
      cashback: 275000.00
    },
    {
      name: 'نورا أحمد',
      email: 'nora@example.com',
      password: 'AAIOH2040%%Ff%',
      role: 'customer',
      points: 600000, // أكثر من نصف مليون
      cashback: 300000.00
    },
    {
      name: 'يوسف محمود',
      email: 'youssef@example.com',
      password: 'AAIOH2040%%Ff%',
      role: 'admin',
      points: 0,
      cashback: 0
    },
    {
      name: 'ليلى حسن',
      email: 'layla@example.com',
      password: 'AAIOH2040%%Ff%',
      role: 'super_admin',
      points: 0,
      cashback: 0
    }
  ],
  blogs: [
    {
      title: 'أفضل 10 أماكن سياحية في مصر',
      content: 'مصر بلد غني بالتاريخ والثقافة، من الأهرامات إلى معابد الأقصر، اكتشف أفضل الوجهات السياحية في مصر...',
      category: 'سياحة',
      image: null,
      is_published: true
    },
    {
      title: 'دليل شامل للرحلات النيلية',
      content: 'الرحلات النيلية تجربة فريدة لا تُنسى، تعرف على أفضل الكروزات وأهم النصائح للاستمتاع برحلة نيلية مثالية...',
      category: 'رحلات',
      image: null,
      is_published: true
    },
    {
      title: 'أفضل وقت لزيارة مصر',
      content: 'متى يكون أفضل وقت لزيارة مصر؟ تعرف على الفصول المناسبة والمناخ المثالي للسياحة في مصر...',
      category: 'نصائح',
      image: null,
      is_published: true
    },
    {
      title: 'الغوص في البحر الأحمر',
      content: 'البحر الأحمر موطن لأجمل الشعاب المرجانية في العالم، اكتشف أفضل مواقع الغوص في مصر...',
      category: 'مغامرات',
      image: null,
      is_published: true
    },
    {
      title: 'المأكولات المصرية التقليدية',
      content: 'استمتع بأشهى المأكولات المصرية التقليدية، من الكشري إلى الفول والطعمية...',
      category: 'ثقافة',
      image: null,
      is_published: true
    }
  ]
};

// Main seeding function
async function seedDatabase() {
  try {
    console.log('🌱 Starting database seeding...\n');

    // 1. Seed Languages
    console.log('📝 Seeding Languages...');
    const languagesData = [
      { code: 'ar', name: 'Arabic', native_name: 'العربية', flag_emoji: '🇪🇬', is_rtl: true, is_active: true, is_default: true, sort_order: 1 },
      { code: 'en', name: 'English', native_name: 'English', flag_emoji: '🇺🇸', is_rtl: false, is_active: true, is_default: false, sort_order: 2 },
      { code: 'fr', name: 'French', native_name: 'Français', flag_emoji: '🇫🇷', is_rtl: false, is_active: true, is_default: false, sort_order: 3 }
    ];
    const languages = [];
    for (const langData of languagesData) {
      const lang = await Language.query().insert(langData).onConflict('code').merge();
      languages.push(lang.id || lang);
    }
    console.log(`✅ Inserted ${languages.length} languages\n`);

    // 2. Seed Currencies
    console.log('💰 Seeding Currencies...');
    const currenciesData = [
      { code: 'EGP', name: 'Egyptian Pound', symbol: 'E£', exchange_rate: 1.0, is_active: true, is_default: true, decimal_places: 2, position: 'before' },
      { code: 'USD', name: 'US Dollar', symbol: '$', exchange_rate: 30.5, is_active: true, is_default: false, decimal_places: 2, position: 'before' },
      { code: 'EUR', name: 'Euro', symbol: '€', exchange_rate: 33.2, is_active: true, is_default: false, decimal_places: 2, position: 'before' }
    ];
    const currencies = [];
    for (const currData of currenciesData) {
      const curr = await Currency.query().insert(currData).onConflict('code').merge();
      currencies.push(curr.id || curr);
    }
    console.log(`✅ Inserted ${currencies.length} currencies\n`);

    // 3. Seed Memberships
    console.log('🎫 Seeding Memberships...');
    const membershipIds = [];
    for (const membershipData of tourismData.memberships) {
      const membership = await Membership.query().insert(membershipData).onConflict('name').merge();
      membershipIds.push(membership.id || membership);
      console.log(`  ✓ ${membershipData.name}`);
    }
    console.log(`✅ Inserted ${membershipIds.length} memberships\n`);

    // 4. Seed Users with hashed passwords
    console.log('👥 Seeding Users...');
    const userIds = [];
    for (const userData of tourismData.users) {
      const hashedPassword = await bcrypt.hash(userData.password, 10);
      const membershipId = userData.role === 'customer' 
        ? membershipIds[Math.floor(Math.random() * membershipIds.length)]
        : null;
      
      const profilePicture = await getImageFromUnsplash('portrait person', 200, 200);
      
      const user = await User.query().insert({
        name: userData.name,
        email: userData.email,
        password: hashedPassword,
        role: userData.role,
        membership_id: membershipId,
        points: userData.points,
        cashback: userData.cashback,
        profile_picture_url: profilePicture
      }).onConflict('email').merge();
      
      userIds.push(user.id || user);
      console.log(`  ✓ ${userData.name} (${userData.email}) - Points: ${userData.points}, Cashback: ${userData.cashback}`);
    }
    console.log(`✅ Inserted ${userIds.length} users\n`);

    // 5. Seed Packages with images
    console.log('📦 Seeding Packages...');
    const packageIds = [];
    for (const packageData of tourismData.packages) {
      // Get multiple high-quality images for each package (5 images per package)
      const images = [];
      let imageQueries = [];
      
      // تحديد استعلامات الصور حسب نوع الرحلة
      if (packageData.name.includes('أهرامات')) {
        imageQueries = ['pyramids egypt', 'sphinx egypt', 'giza plateau', 'egyptian monuments', 'ancient egypt'];
      } else if (packageData.name.includes('نيلية')) {
        imageQueries = ['nile cruise egypt', 'nile river', 'luxor temple', 'karnak temple', 'nile boat'];
      } else if (packageData.name.includes('شرم')) {
        imageQueries = ['sharm el sheikh beach', 'red sea resort', 'diving egypt', 'beach resort', 'coral reef'];
      } else if (packageData.name.includes('سيوة')) {
        imageQueries = ['siwa oasis', 'desert egypt', 'oasis palm trees', 'desert landscape', 'egyptian desert'];
      } else if (packageData.name.includes('الإسكندرية')) {
        imageQueries = ['alexandria egypt', 'alexandria library', 'mediterranean sea', 'alexandria corniche', 'qaitbay citadel'];
      } else if (packageData.name.includes('دير')) {
        imageQueries = ['saint catherine monastery', 'mount sinai', 'sinai desert', 'monastery egypt', 'mountain egypt'];
      } else if (packageData.name.includes('وادي')) {
        imageQueries = ['valley of the kings', 'luxor egypt', 'pharaohs tomb', 'ancient egyptian tombs', 'egyptian archaeology'];
      } else if (packageData.name.includes('غوص')) {
        imageQueries = ['red sea diving', 'coral reef diving', 'underwater egypt', 'diving egypt', 'marine life'];
      } else {
        imageQueries = ['egypt tourism', 'egypt travel', 'egyptian culture', 'egyptian landmarks', 'egypt vacation'];
      }
      
      // الحصول على 5 صور لكل رحلة
      for (let i = 0; i < 5; i++) {
        const imageQuery = imageQueries[i % imageQueries.length];
        const image = await getImageFromUnsplash(imageQuery, 1920, 1080);
        images.push(image);
        // إضافة تأخير صغير لتجنب rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      const packageWithImages = {
        ...packageData,
        images: images
      };
      
      const pkg = await Package.query().insert(packageWithImages);
      packageIds.push(pkg.id);
      console.log(`  ✓ ${packageData.name} (${images.length} images)`);
    }
    console.log(`✅ Inserted ${packageIds.length} packages with images\n`);

    // 6. Seed Blogs with images
    console.log('📰 Seeding Blogs...');
    const blogIds = [];
    for (let i = 0; i < tourismData.blogs.length; i++) {
      const blogData = tourismData.blogs[i];
      const authorId = userIds[Math.floor(Math.random() * userIds.length)];
      
      const imageQuery = blogData.title.includes('أماكن') ? 'egypt tourism'
        : blogData.title.includes('نيلية') ? 'nile cruise'
        : blogData.title.includes('وقت') ? 'egypt landscape'
        : blogData.title.includes('غوص') ? 'red sea diving'
        : 'egyptian food';
      
      const image = await getImageFromUnsplash(imageQuery, 1200, 600);
      
      const blog = await Blog.query().insert({
        title: blogData.title,
        content: blogData.content + ' '.repeat(500), // Extended content
        author_id: authorId,
        category: blogData.category,
        image: image,
        is_published: blogData.is_published
      });
      blogIds.push(blog.id);
      console.log(`  ✓ ${blogData.title}`);
    }
    console.log(`✅ Inserted ${blogIds.length} blogs\n`);

    // 7. Seed Bookings with images
    console.log('📅 Seeding Bookings...');
    const bookingTypes = ['tour', 'nile_cruise', 'flight_ticket', 'hotel_booking', 'transfer', 'nile_trip', 'general_tour'];
    const bookingStatuses = ['pending', 'confirmed', 'cancelled', 'completed'];
    
    // Hotel and service names
    const hotelNames = [
      'Nile Grand Hotel',
      'Pyramids Resort',
      'Red Sea Hotel',
      'Alexandria Plaza Hotel',
      'Sharm El Sheikh Lux Hotel',
      'Cairo International Hotel',
      'Luxor Resort',
      'Golden Desert Hotel'
    ];
    
    const airlineNames = [
      'EgyptAir',
      'Gulf Air',
      'Emirates',
      'Saudi Airlines',
      'Etihad Airways'
    ];
    
    for (let i = 0; i < 20; i++) {
      const userId = userIds[Math.floor(Math.random() * userIds.length)];
      const packageId = packageIds[Math.floor(Math.random() * packageIds.length)];
      const bookingType = bookingTypes[Math.floor(Math.random() * bookingTypes.length)];
      const status = bookingStatuses[Math.floor(Math.random() * bookingStatuses.length)];
      
      const packageData = await Package.query().findById(packageId);
      const totalPrice = packageData ? packageData.price : 2000 + Math.random() * 10000;
      
      // Add images based on booking type
      let bookingImages = [];
      let bookingDetails = {
        packageId: packageId,
        participants: Math.floor(Math.random() * 4) + 1,
        startDate: new Date(Date.now() + Math.random() * 90 * 24 * 60 * 60 * 1000).toISOString(),
        endDate: new Date(Date.now() + Math.random() * 90 * 24 * 60 * 60 * 1000).toISOString()
      };
      
      if (bookingType === 'hotel_booking') {
        const hotelName = hotelNames[Math.floor(Math.random() * hotelNames.length)];
        const hotelImage = await getImageFromUnsplash('luxury hotel egypt', 1200, 800);
        bookingImages = [hotelImage];
        bookingDetails.hotelName = hotelName;
        bookingDetails.hotelImage = hotelImage;
        bookingDetails.roomType = ['Standard Room', 'Deluxe Room', 'Suite', 'Presidential Suite'][Math.floor(Math.random() * 4)];
        bookingDetails.checkIn = bookingDetails.startDate;
        bookingDetails.checkOut = bookingDetails.endDate;
      } else if (bookingType === 'flight_ticket') {
        const airlineName = airlineNames[Math.floor(Math.random() * airlineNames.length)];
        const flightImage = await getImageFromUnsplash('airplane flight', 1200, 800);
        bookingImages = [flightImage];
        bookingDetails.airline = airlineName;
        bookingDetails.flightImage = flightImage;
        bookingDetails.flightNumber = `MS${Math.floor(Math.random() * 9000) + 1000}`;
        bookingDetails.departureAirport = 'Cairo International Airport';
        bookingDetails.arrivalAirport = ['Sharm El Sheikh Airport', 'Luxor Airport', 'Alexandria Airport', 'Aswan Airport'][Math.floor(Math.random() * 4)];
      } else if (bookingType === 'nile_cruise' || bookingType === 'nile_trip') {
        const cruiseImage = await getImageFromUnsplash('nile cruise ship', 1200, 800);
        bookingImages = [cruiseImage];
        bookingDetails.cruiseImage = cruiseImage;
        bookingDetails.cruiseName = ['Golden Nile Cruise', 'Pharaohs Cruise', 'Luxor Aswan Cruise'][Math.floor(Math.random() * 3)];
        bookingDetails.cabinType = ['Standard Cabin', 'Deluxe Cabin', 'Suite'][Math.floor(Math.random() * 3)];
      } else if (bookingType === 'tour' || bookingType === 'general_tour') {
        // Use images from the associated package
        if (packageData && packageData.images && packageData.images.length > 0) {
          bookingImages = [packageData.images[0]];
          bookingDetails.tourImage = packageData.images[0];
        } else {
          const tourImage = await getImageFromUnsplash('egypt tour guide', 1200, 800);
          bookingImages = [tourImage];
          bookingDetails.tourImage = tourImage;
        }
        bookingDetails.tourGuide = 'Professional Tour Guide';
        bookingDetails.transportation = ['Bus', 'Private Car', 'Minibus'][Math.floor(Math.random() * 3)];
      } else if (bookingType === 'transfer') {
        const transferImage = await getImageFromUnsplash('airport transfer car', 1200, 800);
        bookingImages = [transferImage];
        bookingDetails.transferImage = transferImage;
        bookingDetails.vehicleType = ['Standard Car', 'Luxury Car', 'Van', 'Bus'][Math.floor(Math.random() * 4)];
      }
      
      bookingDetails.images = bookingImages;
      
      await Booking.query().insert({
        user_id: userId,
        booking_type: bookingType,
        details: bookingDetails,
        status: status,
        total_price: totalPrice,
        invoice_id: `INV-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      });
      
      // Add small delay
      await new Promise(resolve => setTimeout(resolve, 50));
    }
    console.log(`✅ Inserted 20 bookings with images\n`);

    // 7.5. Seed Itineraries with images
    console.log('🗺️ Seeding Itineraries...');
    const itineraryNames = [
      'Pyramids and Giza Tour',
      'Nile Cruise from Luxor to Aswan',
      'Sharm El Sheikh Diving Trip',
      'Alexandria Historical Tour',
      'Siwa Oasis Adventure'
    ];
    
    const itineraryIds = [];
    for (let i = 0; i < 10; i++) {
      const userId = userIds[Math.floor(Math.random() * userIds.length)];
      const itineraryName = itineraryNames[Math.floor(Math.random() * itineraryNames.length)];
      
      // Add images for the itinerary
      let itineraryImage = '';
      if (itineraryName.includes('Pyramids')) {
        itineraryImage = await getImageFromUnsplash('pyramids egypt giza', 1200, 800);
      } else if (itineraryName.includes('Nile')) {
        itineraryImage = await getImageFromUnsplash('nile cruise luxor aswan', 1200, 800);
      } else if (itineraryName.includes('Sharm')) {
        itineraryImage = await getImageFromUnsplash('sharm el sheikh diving', 1200, 800);
      } else if (itineraryName.includes('Alexandria')) {
        itineraryImage = await getImageFromUnsplash('alexandria egypt', 1200, 800);
      } else {
        itineraryImage = await getImageFromUnsplash('siwa oasis egypt', 1200, 800);
      }
      
      const startDate = new Date(Date.now() + Math.random() * 60 * 24 * 60 * 60 * 1000);
      const endDate = new Date(startDate.getTime() + (Math.floor(Math.random() * 7) + 3) * 24 * 60 * 60 * 1000);
      
      const shareCode = await Itinerary.generateShareCode();
      
      // Prepare destinations array properly for JSONB
      const destinations = [
        {
          city: itineraryName.includes('Pyramids') ? 'Giza' 
            : itineraryName.includes('Nile') ? 'Luxor'
            : itineraryName.includes('Sharm') ? 'Sharm El Sheikh'
            : itineraryName.includes('Alexandria') ? 'Alexandria'
            : 'Siwa',
          country: 'Egypt',
          activities: ['Sightseeing', 'Guided Tours', 'Recreational Activities']
        }
      ];
      
      // Prepare travel_details object properly for JSONB
      const travelDetails = {
        image: itineraryImage,
        images: [itineraryImage],
        hotel: 'Luxury Hotel',
        transportation: 'Tour Bus',
        guide: 'Professional Tour Guide'
      };
      
      const itinerary = await Itinerary.query().insert({
        user_id: userId,
        name: `${itineraryName} - ${i + 1}`,
        description: `Comprehensive travel itinerary for ${itineraryName} with all details and activities`,
        start_date: startDate,
        end_date: endDate,
        destinations: JSON.stringify(destinations),
        travel_details: JSON.stringify(travelDetails),
        share_code: shareCode,
        is_public: Math.random() > 0.7
      });
      itineraryIds.push(itinerary.id);
      
      await new Promise(resolve => setTimeout(resolve, 50));
    }
    console.log(`✅ Inserted ${itineraryIds.length} itineraries with images\n`);

    // 8. Seed Reviews
    console.log('⭐ Seeding Reviews...');
    const ratings = [4, 5, 4, 5, 5, 4, 5];
    const reviewComments = [
      'Amazing trip, excellent service',
      'Unforgettable experience, highly recommended',
      'Everything was well organized',
      'The tour guide was very professional',
      'Delicious food and clean hotel',
      'Exceptional trip, I will come back',
      'Excellent service and reasonable price'
    ];
    
    for (let i = 0; i < 15; i++) {
      const userId = userIds[Math.floor(Math.random() * userIds.length)];
      const packageId = packageIds[Math.floor(Math.random() * packageIds.length)];
      
      await Review.query().insert({
        user_id: userId,
        package_id: packageId,
        rating: ratings[Math.floor(Math.random() * ratings.length)],
        comment: reviewComments[Math.floor(Math.random() * reviewComments.length)]
      });
    }
    console.log(`✅ Inserted 15 reviews\n`);

    // 9. Seed Comments
    console.log('💬 Seeding Comments...');
    const commentTexts = [
      'Great article, thanks for the information',
      'Very useful information',
      'I want to know more about this trip',
      'When can I book?',
      'Is there a family discount?'
    ];
    
    for (let i = 0; i < 10; i++) {
      const userId = userIds[Math.floor(Math.random() * userIds.length)];
      const blogId = blogIds[Math.floor(Math.random() * blogIds.length)];
      
      await Comment.query().insert({
        user_id: userId,
        text: commentTexts[Math.floor(Math.random() * commentTexts.length)],
        commentable_type: 'Blog',
        commentable_id: blogId
      });
    }
    console.log(`✅ Inserted 10 comments\n`);

    // 10. Seed Ads
    console.log('📢 Seeding Ads...');
    const adTypes = ['popup', 'banner', 'notification'];
    const adTitles = [
      'Special Offer on Nile Cruises',
      '20% Discount on All Bookings',
      'Free Trip with Early Booking'
    ];
    
    for (let i = 0; i < 5; i++) {
      const createdBy = userIds[Math.floor(Math.random() * userIds.length)];
      const image = await getImageFromUnsplash('travel promotion', 1080, 1920);
      
      await Ad.query().insert({
        title: adTitles[Math.floor(Math.random() * adTitles.length)],
        content: 'Take advantage of our special offers and book now',
        image: image,
        type: adTypes[Math.floor(Math.random() * adTypes.length)],
        size: '1080x1920',
        created_by: createdBy,
        is_active: true
      });
    }
    console.log(`✅ Inserted 5 ads\n`);

    // 11. Seed Notifications
    console.log('🔔 Seeding Notifications...');
    const notificationTypes = ['offer', 'booking_status', 'membership_upgrade', 'voucher_gift', 'ad_popup', 'chat_message', 'general'];
    const notificationTitles = [
      'New Special Offer',
      'Your Booking Confirmed',
      'Membership Upgrade Available',
      'You Have a Gift Voucher',
      'New Message'
    ];
    
    for (let i = 0; i < 30; i++) {
      const userId = userIds[Math.floor(Math.random() * userIds.length)];
      
      await Notification.query().insert({
        user_id: userId,
        type: notificationTypes[Math.floor(Math.random() * notificationTypes.length)],
        title: notificationTitles[Math.floor(Math.random() * notificationTitles.length)],
        message: 'You have a new notification, please review it',
        is_read: Math.random() > 0.5
      });
    }
    console.log(`✅ Inserted 30 notifications\n`);

    // 12. Seed Transactions
    console.log('💳 Seeding Transactions...');
    // Use correct types according to database constraints
    const transactionTypes = ['membership_purchase', 'booking_payment', 'cashback_earned', 'points_spent', 'manual_deposit', 'invoice_payment'];
    const transactionStatuses = ['pending', 'completed', 'failed', 'cancelled'];
    
    for (let i = 0; i < 25; i++) {
      const userId = userIds[Math.floor(Math.random() * userIds.length)];
      const transactionType = transactionTypes[Math.floor(Math.random() * transactionTypes.length)];
      const amount = 500 + Math.random() * 10000;
      const status = transactionStatuses[Math.floor(Math.random() * transactionStatuses.length)];
      
      // حساب points_change و cashback_change حسب نوع المعاملة
      let pointsChange = 0;
      let cashbackChange = 0;
      
      if (transactionType === 'cashback_earned') {
        cashbackChange = amount * 0.1; // 10% cashback
      } else if (transactionType === 'points_spent') {
        pointsChange = -Math.floor(amount / 10); // 1 point per 10 EGP
      } else if (transactionType === 'membership_purchase') {
        pointsChange = Math.floor(amount * 2); // Earn points for membership
      }
      
      await Transaction.query().insert({
        user_id: userId,
        type: transactionType,
        amount: amount,
        points_change: pointsChange,
        cashback_change: cashbackChange,
        status: status,
        currency: 'EGP',
        payment_method: 'card',
        description: 'Financial Transaction',
        completed_at: status === 'completed' ? new Date() : null
      });
    }
    console.log(`✅ Inserted 25 transactions\n`);

    // 13. Seed Vouchers
    console.log('🎟️ Seeding Vouchers...');
    // Use correct types according to database constraints
    const voucherTypes = ['dinner', 'breakfast', 'spa', 'gym', 'dental_cleaning', 'makeup', 'manual_gift'];
    const voucherDescriptions = {
      'dinner': 'Free dinner voucher',
      'breakfast': 'Free breakfast voucher',
      'spa': 'Spa session voucher',
      'gym': 'Gym access voucher',
      'dental_cleaning': 'Dental cleaning voucher',
      'makeup': 'Makeup voucher',
      'manual_gift': 'Manual gift voucher'
    };
    
    // Get admin user to issue vouchers
    let adminUserId = null;
    for (let i = 0; i < tourismData.users.length; i++) {
      if (tourismData.users[i].role === 'admin' || tourismData.users[i].role === 'super_admin') {
        adminUserId = userIds[i];
        break;
      }
    }
    if (!adminUserId) {
      adminUserId = userIds[0]; // Fallback to first user
    }
    
    for (let i = 0; i < 10; i++) {
      const userId = userIds[Math.floor(Math.random() * userIds.length)];
      const voucherType = voucherTypes[Math.floor(Math.random() * voucherTypes.length)];
      
      await Voucher.query().insert({
        user_id: userId,
        code: `VOUCHER${Date.now()}${i}`,
        type: voucherType,
        value: 100 + Math.random() * 500,
        description: voucherDescriptions[voucherType] || 'Gift voucher',
        issued_by: adminUserId,
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        is_used: false
      });
    }
    console.log(`✅ Inserted 10 vouchers\n`);

    // 14. Seed Settings
    console.log('⚙️ Seeding Settings...');
    await Setting.query().insert({
      unique_key: 'general_settings',
      site_name: 'Altayar Tourism',
      currency: 'EGP',
      contact_email: 'info@altayar.com',
      maintenance_mode: false
    }).onConflict('unique_key').merge();
    console.log(`✅ Inserted settings\n`);

    // 15. Seed Partners with services and images
    console.log('🤝 Seeding Partners...');
    const partnerNames = [
      'Nile Tourism Company',
      'Pyramids Travel Agency',
      'Red Sea Travel Company',
      'Desert Adventures Agency'
    ];
    
    const partnerTypes = ['tour_operator', 'hotel', 'airline', 'travel_agent'];
    const serviceTypes = ['hotel_room', 'flight_ticket', 'tour_package', 'transfer_service'];
    
    const partnerIds = [];
    const partnerServiceIds = [];
    
    for (let i = 0; i < partnerNames.length; i++) {
      // Create user for partner
      const hashedPassword = await bcrypt.hash('Partner123!', 10);
      const partnerUser = await User.query().insert({
        name: `Manager of ${partnerNames[i]}`,
        email: `partner${i + 1}@example.com`,
        password: hashedPassword,
        role: 'customer',
        points: 0,
        cashback: 0,
        profile_picture_url: await getImageFromUnsplash('business person', 200, 200)
      }).onConflict('email').merge();
      
      const partner = await Partner.query().insert({
        user_id: partnerUser.id || partnerUser,
        company_name: partnerNames[i],
        contact_person: `Manager of ${partnerNames[i]}`,
        email: `partner${i + 1}@example.com`,
        phone: `+20${1000000000 + i}`,
        partner_type: partnerTypes[i] || 'tour_operator',
        commission_rate: 10.00 + (i * 2.5),
        status: 'active'
      }).onConflict('email').merge();
      partnerIds.push(partner.id || partner);
      console.log(`  ✓ ${partnerNames[i]}`);
      
      // Add services for partner with images
      const serviceType = serviceTypes[i] || 'tour_package';
      let serviceImage = '';
      let serviceName = '';
      let serviceDescription = '';
      
      if (serviceType === 'hotel_room') {
        serviceImage = await getImageFromUnsplash('luxury hotel room egypt', 1200, 800);
        serviceName = 'Luxury Hotel Room';
        serviceDescription = 'Comfortable hotel room with great view';
      } else if (serviceType === 'flight_ticket') {
        serviceImage = await getImageFromUnsplash('airplane egypt', 1200, 800);
        serviceName = 'Domestic Flight Ticket';
        serviceDescription = 'Comfortable and safe domestic flights';
      } else if (serviceType === 'tour_package') {
        serviceImage = await getImageFromUnsplash('egypt tour package', 1200, 800);
        serviceName = 'Comprehensive Tour Package';
        serviceDescription = 'Complete tour package with professional guide';
      } else {
        serviceImage = await getImageFromUnsplash('airport transfer', 1200, 800);
        serviceName = 'Airport Transfer Service';
        serviceDescription = 'Comfortable and safe transfer service';
      }
      
      const partnerService = await PartnerService.query().insert({
        partner_id: partner.id || partner,
        name: serviceName,
        description: serviceDescription,
        service_type: serviceType,
        price: 500 + Math.random() * 5000,
        details: {
          image: serviceImage,
          images: [serviceImage],
          features: ['Excellent Service', 'Reasonable Prices', 'High Quality']
        },
        is_active: true
      });
      partnerServiceIds.push(partnerService.id);
      
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    console.log(`✅ Inserted ${partnerIds.length} partners with ${partnerServiceIds.length} services\n`);

    console.log('\n✅ Database seeding completed successfully!');
    console.log(`📊 Summary:`);
    console.log(`   - Languages: ${languages.length}`);
    console.log(`   - Currencies: ${currencies.length}`);
    console.log(`   - Memberships: ${membershipIds.length}`);
    console.log(`   - Users: ${userIds.length}`);
    console.log(`   - Packages: ${packageIds.length}`);
    console.log(`   - Blogs: ${blogIds.length}`);
    console.log(`   - Bookings: 20`);
    console.log(`   - Reviews: 15`);
    console.log(`   - Comments: 10`);
    console.log(`   - Ads: 5`);
    console.log(`   - Notifications: 30`);
    console.log(`   - Transactions: 25`);
    console.log(`   - Vouchers: 10`);
    console.log(`   - Partners: ${partnerIds.length}`);
    console.log(`   - Itineraries: ${itineraryIds.length}\n`);
    
    // Print user credentials
    console.log('🔐 User Credentials:');
    console.log('═══════════════════════════════════════════════════════════');
    for (let i = 0; i < tourismData.users.length; i++) {
      const userData = tourismData.users[i];
      console.log(`\n👤 ${userData.name}`);
      console.log(`   📧 Email: ${userData.email}`);
      console.log(`   🔑 Password: ${userData.password}`);
      console.log(`   👔 Role: ${userData.role}`);
      if (userData.role === 'customer') {
        console.log(`   💰 Points: ${userData.points.toLocaleString()}`);
        console.log(`   💵 Cashback: ${userData.cashback.toLocaleString()} EGP`);
      }
    }
    console.log('\n═══════════════════════════════════════════════════════════\n');

  } catch (error) {
    console.error('❌ Error seeding database:', error);
    throw error;
  } finally {
    await knex.destroy();
  }
}

// Run the seeder
if (require.main === module) {
  seedDatabase()
    .then(() => {
      console.log('✨ Seeding process completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Seeding failed:', error);
      process.exit(1);
    });
}

module.exports = { seedDatabase };


require('dotenv').config()
const { query } = require('./connection')

async function seed() {
  console.log('🌱 Seeding Farmiti v2 database...\n')

  // ── Market Prices (70+ crops) ─────────────────────────────
  console.log('📊 Seeding market prices...')
  await query('DELETE FROM price_history')
  await query('DELETE FROM market_prices')

  const crops = [
    // Cereals
    ['Rice (Samba)',      'Cereals',    2600,2500,'₹/Qtl','Chennai',     'Tamil Nadu',      'https://images.unsplash.com/photo-1536304993881-ff86e0c9ef82?w=400&q=80'],
    ['Rice (Ponni)',      'Cereals',    2450,2380,'₹/Qtl','Thanjavur',   'Tamil Nadu',      'https://images.unsplash.com/photo-1536304993881-ff86e0c9ef82?w=400&q=80'],
    ['Rice (Basmati)',    'Cereals',    4200,4100,'₹/Qtl','Karnal',      'Haryana',         'https://images.unsplash.com/photo-1536304993881-ff86e0c9ef82?w=400&q=80'],
    ['Wheat',            'Cereals',    2275,2200,'₹/Qtl','Ludhiana',    'Punjab',           'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=400&q=80'],
    ['Maize',            'Cereals',    1900,1850,'₹/Qtl','Dharwad',     'Karnataka',        'https://images.unsplash.com/photo-1551754655-cd27e38d2076?w=400&q=80'],
    ['Jowar (Sorghum)',  'Cereals',    2970,2900,'₹/Qtl','Solapur',     'Maharashtra',      'https://images.unsplash.com/photo-1464226184884-fa280b87c399?w=400&q=80'],
    ['Bajra (Millet)',   'Cereals',    2625,2500,'₹/Qtl','Jaipur',      'Rajasthan',        'https://images.unsplash.com/photo-1464226184884-fa280b87c399?w=400&q=80'],
    ['Ragi (Finger Millet)','Cereals', 3846,3700,'₹/Qtl','Mysuru',      'Karnataka',        'https://images.unsplash.com/photo-1464226184884-fa280b87c399?w=400&q=80'],
    ['Barley',           'Cereals',    1735,1700,'₹/Qtl','Agra',        'Uttar Pradesh',    'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=400&q=80'],
    // Pulses
    ['Tur Dal (Arhar)',  'Pulses',     7000,6800,'₹/Qtl','Gulbarga',    'Karnataka',        'https://images.unsplash.com/photo-1550989460-0adf9ea622e2?w=400&q=80'],
    ['Urad Dal',         'Pulses',     6950,6700,'₹/Qtl','Indore',      'Madhya Pradesh',   'https://images.unsplash.com/photo-1550989460-0adf9ea622e2?w=400&q=80'],
    ['Green Gram (Moong)','Pulses',    8558,8200,'₹/Qtl','Chennai',     'Tamil Nadu',       'https://images.unsplash.com/photo-1593280359364-8d6b8b9c4b16?w=400&q=80'],
    ['Chana (Gram)',     'Pulses',     5440,5300,'₹/Qtl','Bhopal',      'Madhya Pradesh',   'https://images.unsplash.com/photo-1550989460-0adf9ea622e2?w=400&q=80'],
    ['Masoor Dal',       'Pulses',     6000,5800,'₹/Qtl','Kanpur',      'Uttar Pradesh',    'https://images.unsplash.com/photo-1550989460-0adf9ea622e2?w=400&q=80'],
    ['Cowpea',           'Pulses',     5800,5600,'₹/Qtl','Coimbatore',  'Tamil Nadu',       'https://images.unsplash.com/photo-1550989460-0adf9ea622e2?w=400&q=80'],
    // Vegetables
    ['Tomato',           'Vegetables', 1500,1200,'₹/Qtl','Hosur',       'Tamil Nadu',       'https://images.unsplash.com/photo-1546094096-0df4bcaaa337?w=400&q=80'],
    ['Onion (Red)',      'Vegetables',  900, 980,'₹/Qtl','Nashik',      'Maharashtra',      'https://images.unsplash.com/photo-1518977956812-cd3dbadaaf31?w=400&q=80'],
    ['Onion (White)',    'Vegetables',  850, 900,'₹/Qtl','Pune',        'Maharashtra',      'https://images.unsplash.com/photo-1518977956812-cd3dbadaaf31?w=400&q=80'],
    ['Potato',           'Vegetables', 1100,1000,'₹/Qtl','Agra',        'Uttar Pradesh',    'https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=400&q=80'],
    ['Brinjal (Eggplant)','Vegetables',800, 700,'₹/Qtl','Varanasi',    'Uttar Pradesh',    'https://images.unsplash.com/photo-1610832958506-aa56368176cf?w=400&q=80'],
    ['Okra (Ladyfinger)', 'Vegetables',1200,1100,'₹/Qtl','Patna',       'Bihar',            'https://images.unsplash.com/photo-1464226184884-fa280b87c399?w=400&q=80'],
    ['Cabbage',          'Vegetables', 600, 550,'₹/Qtl','Ooty',        'Tamil Nadu',       'https://images.unsplash.com/photo-1568702846914-96b305d2aaeb?w=400&q=80'],
    ['Cauliflower',      'Vegetables', 800, 750,'₹/Qtl','Delhi',       'Delhi',             'https://images.unsplash.com/photo-1568702846914-96b305d2aaeb?w=400&q=80'],
    ['Bitter Gourd',     'Vegetables', 1400,1300,'₹/Qtl','Lucknow',    'Uttar Pradesh',     'https://images.unsplash.com/photo-1464226184884-fa280b87c399?w=400&q=80'],
    ['Bottle Gourd',     'Vegetables', 600, 550,'₹/Qtl','Hyderabad',   'Telangana',         'https://images.unsplash.com/photo-1464226184884-fa280b87c399?w=400&q=80'],
    ['Ridge Gourd',      'Vegetables', 900, 850,'₹/Qtl','Chennai',     'Tamil Nadu',        'https://images.unsplash.com/photo-1464226184884-fa280b87c399?w=400&q=80'],
    ['Green Beans',      'Vegetables', 1600,1500,'₹/Qtl','Bengaluru',  'Karnataka',         'https://images.unsplash.com/photo-1464226184884-fa280b87c399?w=400&q=80'],
    ['Spinach (Palak)',  'Vegetables', 1000, 900,'₹/Qtl','Delhi',      'Delhi',             'https://images.unsplash.com/photo-1576045057995-568f588f82fb?w=400&q=80'],
    ['Carrot',           'Vegetables', 1200,1100,'₹/Qtl','Ooty',       'Tamil Nadu',        'https://images.unsplash.com/photo-1447175008436-054170c2e979?w=400&q=80'],
    ['Capsicum',         'Vegetables', 2500,2400,'₹/Qtl','Pune',       'Maharashtra',       'https://images.unsplash.com/photo-1563565375-f3fdfdbefa83?w=400&q=80'],
    ['Garlic',           'Vegetables', 4000,3800,'₹/Qtl','Mandsaur',   'Madhya Pradesh',    'https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=400&q=80'],
    ['Ginger',           'Vegetables', 5000,4800,'₹/Qtl','Wayanad',    'Kerala',            'https://images.unsplash.com/photo-1598386651573-9232b840b8c4?w=400&q=80'],
    ['Green Peas',       'Vegetables', 2500,2400,'₹/Qtl','Patna',      'Bihar',             'https://images.unsplash.com/photo-1595855759920-86582396756a?w=400&q=80'],
    ['Drumstick (Murungai)','Vegetables',2000,1900,'₹/Qtl','Coimbatore','Tamil Nadu',       'https://images.unsplash.com/photo-1464226184884-fa280b87c399?w=400&q=80'],
    // Fruits
    ['Banana (Poovan)',  'Fruits',     1450,1380,'₹/Qtl','Trichy',      'Tamil Nadu',        'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=400&q=80'],
    ['Mango (Alphonso)', 'Fruits',     8000,7500,'₹/Qtl','Ratnagiri',  'Maharashtra',       'https://images.unsplash.com/photo-1553279768-865429fa0078?w=400&q=80'],
    ['Mango (Totapuri)', 'Fruits',     3500,3200,'₹/Qtl','Krishnagiri', 'Tamil Nadu',       'https://images.unsplash.com/photo-1553279768-865429fa0078?w=400&q=80'],
    ['Papaya',           'Fruits',     1200,1100,'₹/Qtl','Pune',        'Maharashtra',       'https://images.unsplash.com/photo-1598569304009-85e0e3c4e26a?w=400&q=80'],
    ['Guava',            'Fruits',     1800,1700,'₹/Qtl','Allahabad',   'Uttar Pradesh',     'https://images.unsplash.com/photo-1536511132770-e5058c7e8c46?w=400&q=80'],
    ['Pomegranate',      'Fruits',     5000,4800,'₹/Qtl','Solapur',    'Maharashtra',       'https://images.unsplash.com/photo-1541344999736-83eca272f6fc?w=400&q=80'],
    ['Grapes',           'Fruits',     3500,3400,'₹/Qtl','Nashik',     'Maharashtra',        'https://images.unsplash.com/photo-1537640538966-79f369143f8f?w=400&q=80'],
    ['Watermelon',       'Fruits',     600,  550,'₹/Qtl','Madurai',    'Tamil Nadu',         'https://images.unsplash.com/photo-1563114773-84221bd62daa?w=400&q=80'],
    ['Coconut',          'Fruits',     1500,1400,'₹/100 nuts','Coimbatore','Tamil Nadu',      'https://images.unsplash.com/photo-1513677785800-9df79ae4b10b?w=400&q=80'],
    // Cash Crops
    ['Cotton (Seed)',    'Cash Crops', 6900,6700,'₹/Qtl','Coimbatore', 'Tamil Nadu',         'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&q=80'],
    ['Sugarcane',        'Cash Crops',  340,  330,'₹/Qtl','Erode',     'Tamil Nadu',         'https://images.unsplash.com/photo-1580119368215-d0f48cf49f3b?w=400&q=80'],
    ['Jute',             'Cash Crops', 3500,3400,'₹/Qtl','Siliguri',   'West Bengal',        'https://images.unsplash.com/photo-1464226184884-fa280b87c399?w=400&q=80'],
    ['Tobacco',          'Cash Crops', 8000,7800,'₹/Qtl','Guntur',     'Andhra Pradesh',     'https://images.unsplash.com/photo-1464226184884-fa280b87c399?w=400&q=80'],
    // Oilseeds
    ['Groundnut',        'Oilseeds',   5850,5700,'₹/Qtl','Tirunelveli','Tamil Nadu',         'https://images.unsplash.com/photo-1567337710282-00832b415979?w=400&q=80'],
    ['Mustard (Rapeseed)','Oilseeds',  5650,5500,'₹/Qtl','Jaipur',     'Rajasthan',          'https://images.unsplash.com/photo-1464226184884-fa280b87c399?w=400&q=80'],
    ['Sunflower',        'Oilseeds',   5800,5600,'₹/Qtl','Bellary',    'Karnataka',          'https://images.unsplash.com/photo-1596445836561-991bcd39a86d?w=400&q=80'],
    ['Soybean',          'Oilseeds',   4600,4400,'₹/Qtl','Indore',     'Madhya Pradesh',     'https://images.unsplash.com/photo-1605000797499-95a51c5269ae?w=400&q=80'],
    ['Sesame (Til)',      'Oilseeds',  15000,14000,'₹/Qtl','Surat',    'Gujarat',             'https://images.unsplash.com/photo-1464226184884-fa280b87c399?w=400&q=80'],
    ['Coconut Oil',      'Oilseeds',  16000,15500,'₹/Qtl','Coimbatore','Tamil Nadu',         'https://images.unsplash.com/photo-1513677785800-9df79ae4b10b?w=400&q=80'],
    // Spices
    ['Turmeric',         'Spices',     7200,6900,'₹/Qtl','Erode',      'Tamil Nadu',         'https://images.unsplash.com/photo-1615485500704-8e990f9900f7?w=400&q=80'],
    ['Chilli (Dry)',     'Spices',     9800,9200,'₹/Qtl','Guntur',     'Andhra Pradesh',      'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&q=80'],
    ['Coriander',        'Spices',     8000,7800,'₹/Qtl','Kota',       'Rajasthan',           'https://images.unsplash.com/photo-1518977956812-cd3dbadaaf31?w=400&q=80'],
    ['Cumin (Jeera)',    'Spices',    22000,21000,'₹/Qtl','Unjha',     'Gujarat',             'https://images.unsplash.com/photo-1464226184884-fa280b87c399?w=400&q=80'],
    ['Black Pepper',     'Spices',    35000,34000,'₹/Qtl','Wayanad',   'Kerala',              'https://images.unsplash.com/photo-1588058365548-9ded1f5e5e14?w=400&q=80'],
    ['Cardamom',         'Spices',    80000,78000,'₹/Qtl','Idukki',    'Kerala',              'https://images.unsplash.com/photo-1594020293008-5f99db53b8dc?w=400&q=80'],
    ['Fenugreek (Methi)','Spices',     5500,5300,'₹/Qtl','Ahmedabad',  'Gujarat',             'https://images.unsplash.com/photo-1464226184884-fa280b87c399?w=400&q=80'],
    // Flowers
    ['Jasmine',          'Flowers',    8000,7500,'₹/Qtl','Madurai',    'Tamil Nadu',          'https://images.unsplash.com/photo-1490750967868-88df5691cc71?w=400&q=80'],
    ['Rose',             'Flowers',    6000,5500,'₹/Qtl','Hosur',      'Tamil Nadu',          'https://images.unsplash.com/photo-1490750967868-88df5691cc71?w=400&q=80'],
    ['Marigold',         'Flowers',    2500,2200,'₹/Qtl','Pune',       'Maharashtra',         'https://images.unsplash.com/photo-1490750967868-88df5691cc71?w=400&q=80'],
  ]

  const priceIds = []
  for (const [crop_name, category, price, prev_price, unit, market, state, img_url] of crops) {
    const res = await query(
      'INSERT INTO market_prices (crop_name, category, price, prev_price, unit, market, state, img_url) VALUES (?,?,?,?,?,?,?,?)',
      [crop_name, category, price, prev_price, unit, market, state, img_url]
    )
    priceIds.push({ id: res.insertId, price })
  }

  // Insert 6-month price history for each crop
  const months = ['2025-01-01','2025-02-01','2025-03-01','2025-04-01','2025-05-01','2025-06-01']
  for (const { id, price } of priceIds) {
    for (const month of months) {
      const variation = Math.round(price * (0.82 + Math.random() * 0.36))
      await query('INSERT INTO price_history (crop_id, price, recorded_at) VALUES (?,?,?)', [id, variation, month])
    }
  }
  console.log(`  ✅ ${crops.length} crops seeded with price history`)

  // ── Government Schemes (15 schemes) ──────────────────────────
  console.log('📋 Seeding government schemes...')
  await query('DELETE FROM scheme_enrollments')
  await query('DELETE FROM schemes')

  const schemes = [
    {
      name:'PM-KISAN', full_name:'Pradhan Mantri Kisan Samman Nidhi',
      category:'Income Support', amount:'₹6,000/year',
      ministry:'Ministry of Agriculture & Farmers Welfare',
      deadline:'Open All Year',
      description:'Direct income support of ₹6,000 per year to all land-holding farmer families in 3 equal installments of ₹2,000 each directly to bank accounts.',
      requirements:JSON.stringify(['Aadhaar Card','Land Records (Patta/RoR)','Bank Account linked to Aadhaar','Mobile Number']),
      benefits:'₹2,000 every 4 months directly to bank account',
      website_url:'https://pmkisan.gov.in',
      img_url:'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=600&q=80',
    },
    {
      name:'PM Fasal Bima', full_name:'Pradhan Mantri Fasal Bima Yojana',
      category:'Insurance', amount:'Up to ₹2 Lakh/season',
      ministry:'Ministry of Agriculture & Farmers Welfare',
      deadline:'Before sowing season',
      description:'Comprehensive crop insurance providing financial support to farmers suffering crop loss due to natural calamities, pests, and diseases. Premium as low as 1.5-2%.',
      requirements:JSON.stringify(['Aadhaar Card','Land Records','Bank Account','Sowing Certificate']),
      benefits:'Coverage up to sum insured for crop loss from natural calamities',
      website_url:'https://pmfby.gov.in',
      img_url:'https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=600&q=80',
    },
    {
      name:'Kisan Credit Card', full_name:'Kisan Credit Card Scheme',
      category:'Credit', amount:'Up to ₹3 Lakh @ 4% interest',
      ministry:'NABARD & Scheduled Banks',
      deadline:'Open All Year',
      description:'Short-term revolving credit to farmers for crop cultivation, post-harvest expenses and allied activities at subsidized 4% interest rate. Flexible repayment.',
      requirements:JSON.stringify(['Aadhaar Card','Land Records','Passport Photo','Bank Passbook']),
      benefits:'Low interest credit with flexible repayment aligned to harvest cycle',
      website_url:'https://www.nabard.org/kcc',
      img_url:'https://images.unsplash.com/photo-1501167786227-4cba60f6d58f?w=600&q=80',
    },
    {
      name:'RKVY', full_name:'Rashtriya Krishi Vikas Yojana',
      category:'Development', amount:'Project-based grants',
      ministry:'Ministry of Agriculture & Farmers Welfare',
      deadline:'Rolling applications',
      description:'Provides flexibility to states to plan and execute agriculture programs with focus on 4% annual growth in agriculture sector through infrastructure and technology.',
      requirements:JSON.stringify(['FPO Membership','Project Proposal','Land Records','Bank Account']),
      benefits:'Capital subsidy for agriculture infrastructure and value chain development',
      website_url:'https://rkvy.nic.in',
      img_url:'https://images.unsplash.com/photo-1574943320219-553eb213f72d?w=600&q=80',
    },
    {
      name:'eNAM', full_name:'National Agriculture Market',
      category:'Marketing', amount:'Better prices through online trading',
      ministry:'SFAC, Government of India',
      deadline:'Open All Year',
      description:'Online trading platform integrating APMCs creating a unified national market. Farmers can sell produce to buyers across India, getting best price through transparent bidding.',
      requirements:JSON.stringify(['Aadhaar Card','Bank Account','Farmer ID Card','Mobile Number']),
      benefits:'Access to pan-India buyers and transparent price discovery',
      website_url:'https://enam.gov.in',
      img_url:'https://images.unsplash.com/photo-1535379453347-1ffd615e2e08?w=600&q=80',
    },
    {
      name:'Soil Health Card', full_name:'Soil Health Card Scheme',
      category:'Advisory', amount:'Free Service',
      ministry:'Ministry of Agriculture & Farmers Welfare',
      deadline:'Open All Year',
      description:'Free soil testing and health cards with crop-wise recommendations on nutrients and fertilizers. Helps farmers improve soil fertility and reduce input costs by 8-10%.',
      requirements:JSON.stringify(['Farmer ID or Aadhaar','Land Survey Number','Mobile Number']),
      benefits:'Free soil testing + personalized fertilizer recommendations',
      website_url:'https://soilhealth.dac.gov.in',
      img_url:'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=600&q=80',
    },
    {
      name:'PM Kusum', full_name:'PM Kisan Urja Suraksha Utthan Mahabhiyan',
      category:'Technology', amount:'90% subsidy on solar pumps',
      ministry:'Ministry of New & Renewable Energy',
      deadline:'30 Sep 2025',
      description:'Solar powered irrigation pumps replacing diesel pumps. Farmers can also sell surplus electricity to DISCOMs earning additional income. Up to 7.5 HP solar pumps covered.',
      requirements:JSON.stringify(['Aadhaar Card','Land Records','Electricity Bill','Bank Account']),
      benefits:'90% subsidized solar pump + income from surplus electricity',
      website_url:'https://mnre.gov.in/solar/schemes',
      img_url:'https://images.unsplash.com/photo-1509391366360-2e959784a276?w=600&q=80',
    },
    {
      name:'PMKSY', full_name:'Pradhan Mantri Krishi Sinchayee Yojana',
      category:'Irrigation', amount:'Subsidy on drip/sprinkler',
      ministry:'Ministry of Agriculture & Farmers Welfare',
      deadline:'Open All Year',
      description:'Promotes micro irrigation (drip and sprinkler) with 55% subsidy for small/marginal farmers and 45% for others. Saves 40-50% water and improves yield by 40-50%.',
      requirements:JSON.stringify(['Aadhaar Card','Land Records','Water Source Certificate','Bank Account']),
      benefits:'55% subsidy on drip/sprinkler installation + 40% water saving',
      website_url:'https://pmksy.gov.in',
      img_url:'https://images.unsplash.com/photo-1464226184884-fa280b87c399?w=600&q=80',
    },
    {
      name:'PM Kisan MaanDhan', full_name:'Pradhan Mantri Kisan MaanDhan Yojana',
      category:'Pension', amount:'₹3,000/month pension at age 60',
      ministry:'Ministry of Agriculture & Farmers Welfare',
      deadline:'Open All Year',
      description:'Voluntary and contributory pension scheme for small and marginal farmers. Monthly contribution of ₹55-₹200 (age based) ensures ₹3,000/month pension after age 60.',
      requirements:JSON.stringify(['Age 18-40 years','Land holding ≤2 hectares','Aadhaar','Bank Account linked to Aadhaar']),
      benefits:'₹3,000/month guaranteed pension after age 60',
      website_url:'https://pmkmy.gov.in',
      img_url:'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=600&q=80',
    },
    {
      name:'FPO Scheme', full_name:'Formation & Promotion of 10,000 FPOs',
      category:'Collective', amount:'Up to ₹15 lakh/FPO equity grant',
      ministry:'Ministry of Agriculture & Farmers Welfare',
      deadline:'Rolling applications',
      description:'Government promotes formation of Farmer Producer Organizations for collective bargaining, shared resources, and market access. Each FPO gets equity grant up to ₹15 lakh.',
      requirements:JSON.stringify(['Min 100 farmers to form FPO','Registration documents','Business plan','Bank Account']),
      benefits:'Equity grant + credit guarantee + management support',
      website_url:'https://sfacindia.com',
      img_url:'https://images.unsplash.com/photo-1574943320219-553eb213f72d?w=600&q=80',
    },
    {
      name:'ATMA', full_name:'Agricultural Technology Management Agency',
      category:'Training', amount:'Free training & demonstrations',
      ministry:'Ministry of Agriculture & Farmers Welfare',
      deadline:'Open All Year',
      description:'Block-level government agency providing free agricultural training, exposure visits, demonstrations of new technologies and farmer-scientist interactions to improve farm practices.',
      requirements:JSON.stringify(['Farmer ID or Aadhaar','District registration']),
      benefits:'Free training, exposure visits and technology demonstrations',
      website_url:'https://atma.gov.in',
      img_url:'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&q=80',
    },
    {
      name:'MIDH', full_name:'Mission for Integrated Development of Horticulture',
      category:'Horticulture', amount:'50-100% subsidy based on crop',
      ministry:'Ministry of Agriculture & Farmers Welfare',
      deadline:'Season-based',
      description:'Comprehensive scheme for holistic development of horticulture sector covering fruits, vegetables, spices, flowers, plantation crops. Subsidies on planting material, protected cultivation.',
      requirements:JSON.stringify(['Land ownership proof','Bank Account','State Horticulture Dept registration']),
      benefits:'Subsidy on planting material, protected cultivation, post-harvest infra',
      website_url:'https://midh.gov.in',
      img_url:'https://images.unsplash.com/photo-1498036882173-b41c28a8ba34?w=600&q=80',
    },
    {
      name:'NMSA', full_name:'National Mission for Sustainable Agriculture',
      category:'Sustainability', amount:'50% subsidy on soil health measures',
      ministry:'Ministry of Agriculture & Farmers Welfare',
      deadline:'Open All Year',
      description:'Promotes sustainable agriculture through improved soil health, resource conservation, water use efficiency and climate resilient practices. Subsidies on organic inputs and soil amendments.',
      requirements:JSON.stringify(['Farmer registration','Soil test report','Aadhaar','Bank Account']),
      benefits:'Subsidy on organic inputs, soil amendments and water conservation',
      website_url:'https://nmsa.dac.gov.in',
      img_url:'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=600&q=80',
    },
    {
      name:'GrAM', full_name:'Gramin Agricultural Markets',
      category:'Infrastructure', amount:'₹25 lakh/market development',
      ministry:'Ministry of Agriculture & Farmers Welfare',
      deadline:'State applications',
      description:'Develops and upgrades 22,000 rural haats (markets) as Gramin Agricultural Markets to provide farmers direct market access near their farms, reducing intermediary costs.',
      requirements:JSON.stringify(['Gram Panchayat approval','State government nomination','Basic infrastructure']),
      benefits:'Direct market access near farms with better infrastructure',
      website_url:'https://dac.gov.in',
      img_url:'https://images.unsplash.com/photo-1535379453347-1ffd615e2e08?w=600&q=80',
    },
    {
      name:'Paramparagat Krishi', full_name:'Paramparagat Krishi Vikas Yojana',
      category:'Organic', amount:'₹50,000/hectare over 3 years',
      ministry:'Ministry of Agriculture & Farmers Welfare',
      deadline:'Before Kharif season',
      description:'Promotes organic farming through cluster-based approach. Provides ₹50,000/hectare assistance for cluster formation, organic inputs, certification, and market linkage over 3 years.',
      requirements:JSON.stringify(['Minimum 50 farmers/cluster','20 hectare minimum area','Organic conversion commitment','Aadhaar & Land records']),
      benefits:'₹50,000/ha financial support + organic certification support + market linkage',
      website_url:'https://pgsindia-ncof.gov.in',
      img_url:'https://images.unsplash.com/photo-1464226184884-fa280b87c399?w=600&q=80',
    },
  ]

  for (const s of schemes) {
    await query(
      'INSERT INTO schemes (name, full_name, category, amount, ministry, deadline, description, requirements, benefits, website_url, img_url) VALUES (?,?,?,?,?,?,?,?,?,?,?)',
      [s.name, s.full_name, s.category, s.amount, s.ministry, s.deadline, s.description, s.requirements, s.benefits, s.website_url, s.img_url]
    )
  }
  console.log(`  ✅ ${schemes.length} government schemes seeded`)

  console.log('\n🎉 Farmiti v2 database seeding complete!')
  process.exit(0)
}

seed().catch(err => {
  console.error('❌ Seed failed:', err.message)
  process.exit(1)
})

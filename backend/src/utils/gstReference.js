/**
 * Indian GST Reference — Complete HSN/SAC code and rate mapping
 * Source: CBIC GST Rate Schedule (as of FY 2024-25)
 *
 * Structure: { hsn, rate, description, keywords[] }
 * HSN = Harmonized System of Nomenclature (goods)
 * SAC = Services Accounting Code (services)
 */

const GST_REFERENCE = [
  // ─── ELECTRONICS ──────────────────────────────────────────────────────────
  { hsn: '8517', rate: 18, description: 'Smartphones & Mobile Phones',         keywords: ['mobile', 'smartphone', 'iphone', 'android', 'redmi', 'samsung galaxy', 'oppo', 'vivo', 'oneplus', 'realme', 'poco', 'nokia'] },
  { hsn: '8528', rate: 18, description: 'Television (≤32 inch)',                keywords: ['32" tv', '32 inch tv', 'mi 32', 'led tv 32', 'small tv'] },
  { hsn: '8528', rate: 28, description: 'Television (>32 inch)',                keywords: ['television', 'smart tv', 'oled', '4k tv', 'led tv', 'samsung tv', 'lg tv', 'sony tv', 'mi tv', '43"', '55"', '65"'] },
  { hsn: '8415', rate: 28, description: 'Air Conditioners',                    keywords: ['air conditioner', 'split ac', 'window ac', 'inverter ac', 'daikin', 'voltas', 'lg ac', 'carrier', 'hitachi ac'] },
  { hsn: '8418', rate: 28, description: 'Refrigerators & Freezers',            keywords: ['refrigerator', 'fridge', 'double door fridge', 'single door fridge', 'freezer'] },
  { hsn: '8450', rate: 28, description: 'Washing Machines',                    keywords: ['washing machine', 'front load', 'top load', 'dryer'] },
  { hsn: '8471', rate: 18, description: 'Laptops & Computers',                 keywords: ['laptop', 'computer', 'notebook', 'macbook', 'chromebook', 'desktop', 'pc', 'imac'] },
  { hsn: '8518', rate: 18, description: 'Audio Equipment',                     keywords: ['earphone', 'headphone', 'headset', 'speaker', 'boat', 'jbl', 'sony headphone', 'neckband', 'earbuds', 'tws', 'rockerz'] },
  { hsn: '8504', rate: 18, description: 'Chargers & Power Adapters',           keywords: ['charger', 'adapter', 'power adapter', 'gan charger', '65w', '33w', 'usb charger', 'fast charger'] },
  { hsn: '8507', rate: 28, description: 'Power Banks & Lithium Batteries',     keywords: ['power bank', 'powerbank', 'mi power bank', 'battery pack', 'portable charger'] },
  { hsn: '8544', rate: 18, description: 'Cables & Wires',                      keywords: ['usb cable', 'cable', 'data cable', 'type-c', 'lightning cable', 'hdmi'] },
  { hsn: '7007', rate: 18, description: 'Tempered / Safety Glass',             keywords: ['tempered glass', 'screen protector', 'glass guard', 'screen guard'] },
  { hsn: '3926', rate: 18, description: 'Plastic Articles (Phone Cases)',       keywords: ['phone cover', 'phone case', 'back cover', 'silicon cover', 'silicone case', 'mobile cover'] },
  { hsn: '9102', rate: 18, description: 'Smart Watches & Fitness Bands',       keywords: ['smart watch', 'smartwatch', 'fitness band', 'apple watch', 'galaxy watch', 'mi band', 'noise watch'] },
  { hsn: '8525', rate: 18, description: 'Cameras',                             keywords: ['camera', 'dslr', 'mirrorless', 'webcam', 'action camera', 'gopro'] },
  { hsn: '8539', rate: 12, description: 'LED Bulbs & Lighting',                keywords: ['led bulb', 'led light', 'cfl', 'tubelight', 'led strip', 'downlight', 'philips bulb', 'syska'] },
  { hsn: '8414', rate: 18, description: 'Fans',                                keywords: ['fan', 'ceiling fan', 'table fan', 'pedestal fan', 'exhaust fan', 'wall fan'] },
  { hsn: '8516', rate: 18, description: 'Electrothermic Appliances',           keywords: ['induction', 'cooktop', 'electric kettle', 'kettle', 'toaster', 'electric iron', 'iron', 'room heater', 'geyser', 'water heater'] },
  { hsn: '8516', rate: 18, description: 'Ovens & Air Fryers',                  keywords: ['air fryer', 'microwave', 'oven', 'otg', 'sandwich maker'] },
  { hsn: '8509', rate: 12, description: 'Electromechanical Domestic Appliances', keywords: ['mixer', 'grinder', 'mixer grinder', 'juicer', 'blender', 'food processor', 'bajaj mixer', 'prestige mixer', 'butterfly mixer'] },
  { hsn: '8443', rate: 18, description: 'Printers & Scanners',                 keywords: ['printer', 'scanner', 'inkjet', 'laser printer', 'hp printer', 'epson'] },
  { hsn: '8471', rate: 18, description: 'Tablets',                             keywords: ['tablet', 'ipad', 'galaxy tab', 'mi tab', 'realme pad'] },

  // ─── GROCERY / FMCG ────────────────────────────────────────────────────────
  // 0% items
  { hsn: '0713', rate: 0,  description: 'Dried Pulses / Dal (unbranded)',       keywords: ['dal loose', 'toor dal loose', 'chana loose', 'unbranded dal'] },
  { hsn: '0713', rate: 5,  description: 'Dried Pulses / Dal (branded)',         keywords: ['toor dal', 'chana dal', 'moong dal', 'urad dal', 'masoor dal', 'arhar dal', 'tur dal', 'chana'] },
  { hsn: '1006', rate: 0,  description: 'Rice (unbranded)',                     keywords: ['rice loose', 'chawal loose'] },
  { hsn: '1006', rate: 5,  description: 'Rice (branded packaged)',              keywords: ['basmati rice', 'india gate', 'dawat rice', 'kohinoor rice'] },
  { hsn: '1101', rate: 0,  description: 'Wheat Flour / Atta (unbranded)',       keywords: ['atta loose', 'wheat flour loose'] },
  { hsn: '1101', rate: 5,  description: 'Wheat Flour / Atta (branded)',         keywords: ['aashirvaad atta', 'fortune atta', 'annapurna atta', 'atta', 'wheat flour'] },
  { hsn: '2501', rate: 0,  description: 'Salt',                                keywords: ['salt', 'tata salt', 'namak', 'iodized salt'] },
  { hsn: '0401', rate: 0,  description: 'Fresh / Pasteurized Milk',            keywords: ['amul milk', 'milk', 'doodh', 'skimmed milk', 'full cream milk'] },
  { hsn: '0407', rate: 0,  description: 'Eggs',                                keywords: ['egg', 'anda', 'eggs'] },
  { hsn: '0701', rate: 0,  description: 'Fresh Vegetables',                    keywords: ['potato', 'tomato', 'onion', 'vegetable', 'sabzi', 'carrot', 'cabbage', 'spinach', 'palak'] },
  { hsn: '0801', rate: 0,  description: 'Fresh Fruits',                        keywords: ['apple', 'banana', 'mango', 'fruit', 'grape', 'orange', 'pear', 'papaya'] },
  { hsn: '4901', rate: 0,  description: 'Books & Printed Material',            keywords: ['book', 'textbook', 'study material', 'notebook blank', 'copy', 'register'] },

  // 5% items
  { hsn: '0902', rate: 5,  description: 'Tea',                                 keywords: ['tea', 'chai', 'red label', 'tata tea', 'taaza', 'green tea', 'masala chai', 'lipton', 'brooke bond', 'society tea'] },
  { hsn: '0901', rate: 5,  description: 'Coffee Beans / Ground Coffee',        keywords: ['coffee beans', 'ground coffee', 'filter coffee', 'bru coffee'] },
  { hsn: '1507', rate: 5,  description: 'Edible Oils (Soy/Sunflower/Groundnut)', keywords: ['soya bean oil', 'sunflower oil', 'groundnut oil', 'fortune oil', 'saffola oil', 'sundrop', 'dhara', 'postman oil', 'gemini oil'] },
  { hsn: '1511', rate: 5,  description: 'Palm Oil',                            keywords: ['palm oil', 'vanaspati'] },
  { hsn: '1513', rate: 5,  description: 'Coconut Oil (edible)',                keywords: ['coconut oil', 'parachute coconut', 'marico'] },
  { hsn: '0910', rate: 5,  description: 'Spices & Masala',                     keywords: ['masala', 'spice', 'haldi', 'turmeric', 'chilli powder', 'red chilli', 'garam masala', 'coriander', 'cumin', 'jeera', 'mdh', 'everest', 'catch', 'rajah'] },
  { hsn: '0403', rate: 5,  description: 'Curd / Dahi / Yoghurt (branded)',     keywords: ['dahi', 'curd', 'yoghurt', 'amul dahi', 'mother dairy dahi'] },
  { hsn: '1902', rate: 5,  description: 'Pasta & Noodles (unbranded)',         keywords: ['unbranded noodles', 'plain pasta'] },

  // 12% items
  { hsn: '0405', rate: 12, description: 'Butter & Ghee',                      keywords: ['ghee', 'butter', 'amul ghee', 'amul butter', 'desi ghee', 'pure ghee', 'clarified butter'] },
  { hsn: '0406', rate: 12, description: 'Cheese & Paneer',                    keywords: ['paneer', 'cheese', 'amul cheese', 'cottage cheese', 'processed cheese'] },
  { hsn: '2001', rate: 12, description: 'Pickles, Jams & Preserves',          keywords: ['jam', 'jelly', 'preserve', 'pickle', 'achar', 'kissan jam', 'mixed pickle'] },
  { hsn: '2103', rate: 12, description: 'Sauces, Ketchup & Condiments',       keywords: ['ketchup', 'tomato sauce', 'sauce', 'maggi ketchup', 'kissan ketchup', 'chilli sauce', 'soy sauce'] },
  { hsn: '9619', rate: 12, description: 'Sanitary Products',                  keywords: ['sanitary pad', 'sanitary napkin', 'diaper', 'pampers', 'stayfree', 'whisper', 'huggies'] },

  // 18% items
  { hsn: '2101', rate: 18, description: 'Instant Coffee / Coffee Extracts',   keywords: ['nescafe', 'bru instant', 'instant coffee', 'coffee powder', 'cold coffee', 'cold brew'] },
  { hsn: '1806', rate: 18, description: 'Chocolate & Cocoa Products',         keywords: ['chocolate', 'cadbury', 'kitkat', 'dairy milk', 'ferrero', 'munch', 'five star', 'bournvita', 'horlicks', 'boost', 'ovaltine', 'cocoa'] },
  { hsn: '1901', rate: 18, description: 'Malt Extracts / Health Drinks',      keywords: ['health drink', 'malt', 'complan', 'pediasure', 'ensure', 'protinex'] },
  { hsn: '1905', rate: 18, description: 'Biscuits & Bakery (branded)',        keywords: ['biscuit', 'cookie', 'parle-g', 'marie', 'good day', 'oreo', 'bourbon', 'crackers', 'britannia', 'sunfeast', 'mcvities'] },
  { hsn: '2008', rate: 18, description: 'Processed Snacks / Chips',           keywords: ['chips', 'lays', 'kurkure', 'frito lay', 'uncle chips', 'wafers', 'pringles'] },
  { hsn: '2106', rate: 18, description: 'Food Preparations & Namkeen',        keywords: ['namkeen', 'bhujia', 'aloo bhujia', 'haldirams', 'bikaji', 'bikanervala', 'mixture', 'chivda'] },
  { hsn: '1902', rate: 18, description: 'Branded Noodles & Pasta',            keywords: ['maggi', 'yippee', 'top ramen', 'ching\'s', 'knorr noodles', 'pasta branded'] },
  { hsn: '3305', rate: 18, description: 'Hair Care Products',                 keywords: ['shampoo', 'conditioner', 'head & shoulders', 'pantene', 'dove shampoo', 'loreal shampoo', 'tresemme', 'himalaya shampoo', 'clinic plus', 'sunsilk', 'hair serum', 'schwarzkopf', 'matrix shampoo'] },
  { hsn: '3305', rate: 18, description: 'Hair Colour / Dye',                  keywords: ['hair colour', 'hair color', 'hair dye', 'loreal colour', 'garnier colour', 'godrej colour', 'schwarzkopf colour', 'indigo powder', 'henna'] },
  { hsn: '3304', rate: 18, description: 'Beauty & Skin Care',                 keywords: ['face cream', 'moisturiser', 'sunscreen', 'spf', 'fairness cream', 'bb cream', 'foundation', 'lakme', 'pond\'s', 'olay', 'neutrogena', 'face serum', 'toner', 'vlcc', 'lotus cream'] },
  { hsn: '3401', rate: 18, description: 'Soap / Handwash / Body Wash',        keywords: ['soap', 'handwash', 'body wash', 'lux', 'dove', 'dettol soap', 'lifebuoy', 'pears', 'hamam', 'savlon', 'himalaya soap', 'face wash', 'cleanser'] },
  { hsn: '3306', rate: 18, description: 'Oral Care',                          keywords: ['toothpaste', 'toothbrush', 'mouthwash', 'colgate', 'pepsodent', 'closeup', 'sensodyne', 'oral-b', 'dabur red', 'dental'] },
  { hsn: '3402', rate: 18, description: 'Detergents & Washing Products',      keywords: ['detergent', 'washing powder', 'washing liquid', 'surf excel', 'ariel', 'tide', 'rin', 'wheel', 'vim', 'dishwash', 'bar detergent'] },
  { hsn: '3808', rate: 18, description: 'Household Insecticides / Cleaners',  keywords: ['phenyl', 'floor cleaner', 'harpic', 'lizol', 'toilet cleaner', 'disinfectant', 'colin', 'hit spray', 'mosquito coil', 'goodnight', 'mortein', 'allout'] },
  { hsn: '3303', rate: 28, description: 'Perfumes & Deodorants',              keywords: ['perfume', 'deodorant', 'deo', 'axe deo', 'nivea deo', 'fogg', 'engage', 'park avenue', 'body spray', 'attar', 'cologne'] },

  // 28% items
  { hsn: '2202', rate: 28, description: 'Aerated / Carbonated Beverages',     keywords: ['coca cola', 'pepsi', 'sprite', 'fanta', 'thums up', 'limca', 'mirinda', 'mountain dew', 'cold drink', 'soda', 'aerated', 'carbonated'] },
  { hsn: '2201', rate: 18, description: 'Packaged Drinking Water',            keywords: ['mineral water', 'bisleri', 'kinley', 'aquafina', 'packaged water', 'drinking water bottle'] },
  { hsn: '2203', rate: 28, description: 'Beer & Malt Beverages',              keywords: ['beer', 'kingfisher', 'heineken', 'budweiser', 'malt beverage'] },

  // ─── BEAUTY / SALON SERVICES ───────────────────────────────────────────────
  { hsn: '999721', rate: 18, description: 'Hairdressing & Grooming Services', keywords: ['haircut', 'hair cut', 'trim', 'blow dry', 'hair styling', 'hair treatment', 'keratin', 'smoothening', 'rebonding', 'hair spa'] },
  { hsn: '999721', rate: 18, description: 'Beauty & Skin Care Services',      keywords: ['facial', 'face treatment', 'cleanup', 'bleach', 'de-tan', 'face pack', 'skin treatment', 'anti-aging'] },
  { hsn: '999721', rate: 18, description: 'Waxing, Threading & Nail Services', keywords: ['waxing', 'threading', 'eyebrow', 'manicure', 'pedicure', 'nail art', 'nail extension', 'gel nails'] },
  { hsn: '999721', rate: 18, description: 'Spa & Massage Services',           keywords: ['massage', 'spa', 'body massage', 'head massage', 'aromatherapy', 'reflexology'] },
  { hsn: '999721', rate: 18, description: 'Bridal & Special Packages',        keywords: ['bridal', 'wedding package', 'party makeup', 'makeup', 'bridal package', 'pre-bridal'] },

  // ─── MEDICAL / CLINIC ──────────────────────────────────────────────────────
  { hsn: '999311', rate: 0,  description: 'Healthcare Services (GST Exempt)', keywords: ['consultation', 'doctor fee', 'physician', 'visit fee', 'opd', 'ipd', 'surgery', 'operation', 'medical procedure', 'clinical service', 'hospital service', 'nursing', 'ambulance'] },
  { hsn: '999312', rate: 0,  description: 'Diagnostic Services (GST Exempt)', keywords: ['blood test', 'urine test', 'x-ray', 'ecg', 'mri', 'ct scan', 'ultrasound', 'biopsy', 'pathology', 'lab test', 'cbc', 'diagnostic'] },
  { hsn: '3004', rate: 5,   description: 'Medicines & Pharmaceuticals',       keywords: ['tablet', 'capsule', 'syrup', 'injection', 'medicine', 'drug', 'antibiotic', 'paracetamol', 'cetirizine', 'omeprazole', 'metformin', 'amoxicillin', 'dolo', 'crocin', 'combiflam', 'pantop'] },
  { hsn: '3005', rate: 12,  description: 'Medical Dressings & Bandages',      keywords: ['bandage', 'dressing', 'plaster', 'cotton', 'gauze', 'adhesive bandage', 'band-aid', 'crepe bandage'] },
  { hsn: '9018', rate: 12,  description: 'Medical Instruments & Devices',     keywords: ['stethoscope', 'bp machine', 'blood pressure', 'thermometer', 'glucometer', 'glucose meter', 'oximeter', 'nebulizer', 'medical instrument', 'surgical instrument'] },
  { hsn: '3006', rate: 12,  description: 'Pharmaceutical goods (sterile)',    keywords: ['glucose saline', 'iv fluid', 'saline', 'infusion', 'drip'] },

  // ─── EDUCATION / COACHING ──────────────────────────────────────────────────
  { hsn: '999294', rate: 18, description: 'Coaching & Tutorial Services',     keywords: ['tuition', 'coaching fee', 'class fee', 'course fee', 'admission fee', 'registration fee', 'jee coaching', 'neet coaching', 'board coaching', 'tutorial', 'batch fee'] },
  { hsn: '999293', rate: 0,  description: 'Education by Approved Institution', keywords: ['school fee', 'college fee', 'university fee', 'degree program', 'diploma'] },
  { hsn: '4901', rate: 0,   description: 'Books & Printed Study Material',    keywords: ['study material', 'notes', 'printed notes', 'question bank', 'test paper', 'reference book', 'ncert'] },
  { hsn: '4820', rate: 18,  description: 'Stationery Items',                  keywords: ['notebook ruled', 'spiral notebook', 'register', 'drawing book', 'graph book'] },
  { hsn: '9608', rate: 18,  description: 'Pens, Pencils & Stationery',       keywords: ['pen', 'pencil', 'eraser', 'sharpener', 'scale', 'ruler', 'highlighter', 'marker', 'ball pen', 'gel pen', 'reynolds'] },

  // ─── CLOTHING & TEXTILES ───────────────────────────────────────────────────
  { hsn: '6101', rate: 5,  description: 'Clothing / Apparel (≤₹1000)',       keywords: ['t-shirt', 'shirt', 'pant', 'trouser', 'kurta', 'kurti', 'dress', 'jeans', 'salwar', 'lehenga', 'saree', 'dupatta', 'clothing'] },
  { hsn: '6101', rate: 12, description: 'Clothing / Apparel (>₹1000)',       keywords: ['premium shirt', 'branded clothing', 'formal shirt', 'suit', 'blazer', 'jacket', 'hoodie'] },
  { hsn: '6401', rate: 5,  description: 'Footwear (≤₹1000)',                 keywords: ['slipper', 'chappal', 'sandal', 'hawai chappal', 'basic shoe', 'canvas shoe'] },
  { hsn: '6401', rate: 12, description: 'Footwear (>₹1000)',                 keywords: ['shoe', 'sneaker', 'sports shoe', 'nike', 'adidas', 'puma', 'reebok', 'woodland', 'bata', 'leather shoe', 'formal shoe', 'boot'] },

  // ─── JEWELLERY ─────────────────────────────────────────────────────────────
  { hsn: '7113', rate: 3,  description: 'Gold Jewellery & Articles',         keywords: ['gold', 'gold ring', 'gold chain', 'gold necklace', 'gold bangle', 'gold earring', 'gold bracelet', 'hallmark gold'] },
  { hsn: '7114', rate: 3,  description: 'Silver Articles & Jewellery',       keywords: ['silver', 'silver ring', 'silver necklace', 'silver coin', 'silver bangle', 'silver jewellery'] },
  { hsn: '7117', rate: 3,  description: 'Imitation Jewellery',               keywords: ['imitation jewellery', 'fashion jewellery', 'artificial jewellery', 'costume jewellery', 'oxidized jewellery'] },

  // ─── MISC ──────────────────────────────────────────────────────────────────
  { hsn: '3401', rate: 18, description: 'Liquid Handwash / Sanitizer',       keywords: ['sanitizer', 'hand sanitizer', 'purell', 'dettol sanitizer', 'liquid soap'] },
  { hsn: '8302', rate: 18, description: 'Hardware & Fittings',               keywords: ['door handle', 'lock', 'hinge', 'screw', 'nail', 'bolt', 'nut', 'hardware'] },
  { hsn: '7323', rate: 18, description: 'Kitchenware (Steel)',               keywords: ['tiffin', 'lunchbox', 'steel bowl', 'steel plate', 'pressure cooker', 'kadhai', 'steel glass'] },
  { hsn: '3924', rate: 18, description: 'Kitchenware (Plastic)',             keywords: ['plastic container', 'storage box', 'plastic bottle', 'water bottle', 'sipper', 'casserole'] },
  { hsn: '9403', rate: 18, description: 'Furniture',                         keywords: ['chair', 'table', 'sofa', 'bed', 'wardrobe', 'shelf', 'furniture', 'cupboard'] },
  { hsn: '4819', rate: 18, description: 'Packaging / Paper Bags',           keywords: ['carry bag', 'paper bag', 'packaging', 'polybag', 'wrapper'] },
];

/**
 * Suggest GST rate and HSN code based on product name / keywords
 * Returns the best match or null
 */
const suggestGst = (productName = '', categoryName = '') => {
  const text = `${productName} ${categoryName}`.toLowerCase();
  let bestMatch = null;
  let bestScore = 0;

  for (const entry of GST_REFERENCE) {
    const score = entry.keywords.reduce((s, kw) => {
      if (text.includes(kw.toLowerCase())) return s + kw.length;
      return s;
    }, 0);
    if (score > bestScore) { bestScore = score; bestMatch = entry; }
  }

  return bestScore > 0 ? bestMatch : null;
};

/**
 * Get all unique GST rate slabs
 */
const getStandardSlabs = () => [
  { name: 'GST 0%',  rate: 0,  cgst: 0,    sgst: 0,    igst: 0,  isGst: true },
  { name: 'GST 3%',  rate: 3,  cgst: 1.5,  sgst: 1.5,  igst: 3,  isGst: true },
  { name: 'GST 5%',  rate: 5,  cgst: 2.5,  sgst: 2.5,  igst: 5,  isGst: true },
  { name: 'GST 12%', rate: 12, cgst: 6,    sgst: 6,    igst: 12, isGst: true },
  { name: 'GST 18%', rate: 18, cgst: 9,    sgst: 9,    igst: 18, isGst: true },
  { name: 'GST 28%', rate: 28, cgst: 14,   sgst: 14,   igst: 28, isGst: true },
];

module.exports = { GST_REFERENCE, suggestGst, getStandardSlabs };

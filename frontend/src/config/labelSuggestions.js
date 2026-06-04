/**
 * Label suggestion registry.
 * For each route, provides smart rename suggestions per business type.
 * Used in WorkspaceTab inline label editor.
 *
 * Structure: LABEL_SUGGESTIONS[route][businessType] = ['Option1', 'Option2', 'Option3']
 * Falls back to LABEL_SUGGESTIONS[route].DEFAULT if businessType not found.
 */

export const LABEL_SUGGESTIONS = {

  // ─────────────────────────────────────────────────────────────────────────────
  '/customers': {
    // Healthcare
    CLINIC:           ['Patients', 'Patient Registry', 'People'],
    NURSING_HOME:     ['Patients', 'Patient Registry', 'Residents'],
    HOSPITAL:         ['Patients', 'In-patients', 'People'],
    DENTAL:           ['Patients', 'Patient List', 'People'],
    PHYSIOTHERAPY:    ['Patients', 'Clients', 'People'],
    AYURVEDA:         ['Patients', 'Clients', 'People'],
    VET_CLINIC:       ['Pet Owners', 'Clients', 'Patients'],
    DIAGNOSTIC_LAB:   ['Patients', 'Clients', 'People'],
    OPTICAL:          ['Patients', 'Customers', 'Clients'],
    // Fitness
    GYM:              ['Members', 'Athletes', 'Trainees'],
    YOGA_STUDIO:      ['Members', 'Students', 'Practitioners'],
    MARTIAL_ARTS:     ['Students', 'Members', 'Trainees'],
    SPORTS_ACADEMY:   ['Athletes', 'Students', 'Members'],
    SWIMMING_ACADEMY: ['Students', 'Members', 'Swimmers'],
    CROSSFIT_STUDIO:  ['Members', 'Athletes', 'Trainees'],
    SPA:              ['Clients', 'Guests', 'Members'],
    // Education
    COACHING:         ['Students', 'Learners', 'Batch'],
    HOME_TUITION:     ['Students', 'Learners', 'Pupils'],
    MUSIC_SCHOOL:     ['Students', 'Learners', 'Pupils'],
    DANCE_ACADEMY:    ['Students', 'Dancers', 'Learners'],
    DRIVING_SCHOOL:   ['Learners', 'Students', 'Trainees'],
    COMPUTER_TRAINING:['Students', 'Trainees', 'Learners'],
    // Professional Services
    LAW_FIRM:         ['Clients', 'Cases', 'Client List'],
    CA_FIRM:          ['Clients', 'Client Registry', 'Accounts'],
    REAL_ESTATE:      ['Leads', 'Buyers', 'Prospects'],
    INSURANCE_AGENCY: ['Policy Holders', 'Clients', 'Leads'],
    TRAVEL_AGENCY:    ['Travellers', 'Clients', 'Bookings'],
    FREELANCER:       ['Clients', 'Projects', 'Contacts'],
    DIGITAL_AGENCY:   ['Clients', 'Brands', 'Accounts'],
    INTERIOR_DESIGN:  ['Clients', 'Homeowners', 'Projects'],
    PHOTOGRAPHY:      ['Clients', 'Couples', 'Shoots'],
    // Beauty & Personal Care
    SALON:            ['Clients', 'Guests', 'People'],
    BEAUTY_PARLOUR:   ['Clients', 'Guests', 'People'],
    BARBERSHOP:       ['Clients', 'Guests', 'Walk-ins'],
    LAUNDRY:          ['Customers', 'Walk-ins', 'Clients'],
    TAILORING:        ['Customers', 'Clients', 'Walk-ins'],
    // Food & Beverage
    RESTAURANT:       ['Guests', 'Diners', 'Regulars'],
    DHABA:            ['Regulars', 'Diners', 'Customers'],
    CLOUD_KITCHEN:    ['Customers', 'Online Customers', 'Regulars'],
    JUICE_BAR:        ['Customers', 'Regulars', 'Walk-ins'],
    CANTEEN_MESS:     ['Members', 'Subscribers', 'Regulars'],
    // Events
    EVENT_PLANNER:    ['Clients', 'Event Clients', 'Leads'],
    DECORATOR:        ['Clients', 'Event Parties', 'Customers'],
    TENT_HOUSE:       ['Clients', 'Event Parties', 'Customers'],
    // Retail & Commerce
    RETAIL:           ['Customers', 'Regular Customers', 'Buyers'],
    KIRANA:           ['Customers', 'Regular Customers', 'Buyers'],
    MEDICAL_STORE:    ['Customers', 'Patients', 'Buyers'],
    STATIONARY:       ['Customers', 'School Clients', 'Buyers'],
    SWEET_SHOP:       ['Customers', 'Regulars', 'Buyers'],
    BAKERY:           ['Customers', 'Regulars', 'Walk-ins'],
    JEWELLERY:        ['Customers', 'Buyers', 'Clients'],
    HARDWARE:         ['Customers', 'Contractors', 'Buyers'],
    ELECTRICAL:       ['Customers', 'Clients', 'Contractors'],
    CLOTHING:         ['Customers', 'Shoppers', 'Buyers'],
    FOOTWEAR:         ['Customers', 'Buyers', 'Shoppers'],
    ELECTRONICS:      ['Customers', 'Buyers', 'Clients'],
    MOBILE_REPAIR:    ['Customers', 'Walk-ins', 'Clients'],
    BOOKSTORE:        ['Customers', 'Readers', 'Buyers'],
    FLORIST:          ['Customers', 'Buyers', 'Clients'],
    // Trade & B2B
    DEALER:           ['Dealers', 'Buyers', 'Trade Clients'],
    SUPPLIER:         ['Buyers', 'Trade Partners', 'Clients'],
    WHOLESALE:        ['Retailers', 'Bulk Buyers', 'Trade Clients'],
    // Transport
    CAB_SERVICE:      ['Riders', 'Clients', 'Passengers'],
    TRANSPORT:        ['Clients', 'Shippers', 'Parties'],
    COURIER:          ['Senders', 'Clients', 'Walk-ins'],
    PACKERS_MOVERS:   ['Clients', 'Movers', 'Parties'],
    CAR_RENTAL:       ['Clients', 'Renters', 'Drivers'],
    // Others
    MALL:             ['Tenants', 'Shop Owners', 'Retailers'],
    CO_WORKING:       ['Members', 'Tenants', 'Clients'],
    PEST_CONTROL:     ['Clients', 'Properties', 'Contacts'],
    WORKSHOP:         ['Customers', 'Walk-ins', 'Clients'],
    HOTEL:            ['Guests', 'Residents', 'Clients'],
    CATERING:         ['Clients', 'Event Parties', 'Customers'],
    NGO:              ['Beneficiaries', 'Members', 'People'],
    OTHER:            ['Clients', 'Customers', 'Contacts'],
    DEFAULT:          ['Clients', 'People', 'Contacts'],
  },

  // ─────────────────────────────────────────────────────────────────────────────
  '/appointments': {
    // Healthcare
    CLINIC:           ['Consultations', 'OPD Visits', 'Visits'],
    NURSING_HOME:     ['Consultations', 'Admissions', 'Visits'],
    DENTAL:           ['Dental Visits', 'Consultations', 'Appointments'],
    PHYSIOTHERAPY:    ['Therapy Sessions', 'Sessions', 'Visits'],
    AYURVEDA:         ['Consultations', 'Treatments', 'Sessions'],
    VET_CLINIC:       ['Pet Visits', 'Consultations', 'Visits'],
    OPTICAL:          ['Eye Tests', 'Fittings', 'Consultations'],
    // Fitness
    GYM:              ['Sessions', 'Workouts', 'Training'],
    YOGA_STUDIO:      ['Classes', 'Sessions', 'Practices'],
    MARTIAL_ARTS:     ['Classes', 'Training', 'Sessions'],
    SPORTS_ACADEMY:   ['Practice', 'Sessions', 'Training'],
    SPA:              ['Spa Sessions', 'Treatments', 'Bookings'],
    // Education
    COACHING:         ['Classes', 'Sessions', 'Lectures'],
    MUSIC_SCHOOL:     ['Lessons', 'Classes', 'Sessions'],
    DANCE_ACADEMY:    ['Classes', 'Rehearsals', 'Sessions'],
    DRIVING_SCHOOL:   ['Driving Lessons', 'Sessions', 'Slots'],
    COMPUTER_TRAINING:['Training Sessions', 'Classes', 'Sessions'],
    // Beauty & Personal Care
    SALON:            ['Bookings', 'Services', 'Slots'],
    BEAUTY_PARLOUR:   ['Bookings', 'Services', 'Appointments'],
    BARBERSHOP:       ['Bookings', 'Slots', 'Walk-ins'],
    LAUNDRY:          ['Pickup Orders', 'Laundry Orders', 'Orders'],
    TAILORING:        ['Stitching Orders', 'Orders', 'Measurements'],
    // Professional Services
    LAW_FIRM:         ['Hearings', 'Meetings', 'Client Meetings'],
    CA_FIRM:          ['Client Meetings', 'Appointments', 'Slots'],
    REAL_ESTATE:      ['Site Visits', 'Meetings', 'Tours'],
    PHOTOGRAPHY:      ['Shoots', 'Photo Sessions', 'Bookings'],
    INTERIOR_DESIGN:  ['Site Visits', 'Client Meetings', 'Consultations'],
    // Events
    EVENT_PLANNER:    ['Events', 'Client Meetings', 'Bookings'],
    DECORATOR:        ['Events', 'Decoration Jobs', 'Bookings'],
    TENT_HOUSE:       ['Events', 'Tent Bookings', 'Bookings'],
    CATERING:         ['Events', 'Catering Jobs', 'Bookings'],
    // Transport
    CAR_RENTAL:       ['Bookings', 'Rentals', 'Reservations'],
    PACKERS_MOVERS:   ['Move Jobs', 'Shifting Orders', 'Bookings'],
    PEST_CONTROL:     ['Service Calls', 'Treatments', 'Jobs'],
    // Retail variants with service component
    MOBILE_REPAIR:    ['Repair Jobs', 'Service Requests', 'Work Orders'],
    WORKSHOP:         ['Work Orders', 'Service Jobs', 'Repair Jobs'],
    ELECTRICAL:       ['Service Calls', 'Installation Jobs', 'Work Orders'],
    BAKERY:           ['Custom Orders', 'Pre-orders', 'Cake Orders'],
    FLORIST:          ['Custom Orders', 'Bouquet Orders', 'Orders'],
    CANTEEN_MESS:     ['Meal Subscriptions', 'Bookings', 'Orders'],
    DEFAULT:          ['Bookings', 'Sessions', 'Meetings'],
  },

  // ─────────────────────────────────────────────────────────────────────────────
  '/staff': {
    // Healthcare
    CLINIC:           ['Medical Team', 'Clinic Staff', 'Healthcare Team'],
    NURSING_HOME:     ['Medical Staff', 'Nursing Team', 'Healthcare Team'],
    DENTAL:           ['Dental Team', 'Staff', 'Clinic Team'],
    // Fitness
    GYM:              ['Trainers', 'Coaches', 'Fitness Team'],
    YOGA_STUDIO:      ['Instructors', 'Teachers', 'Coaches'],
    MARTIAL_ARTS:     ['Instructors', 'Coaches', 'Masters'],
    SPORTS_ACADEMY:   ['Coaches', 'Trainers', 'Instructors'],
    SPA:              ['Therapists', 'Spa Team', 'Staff'],
    // Education
    COACHING:         ['Faculty', 'Teachers', 'Instructors'],
    MUSIC_SCHOOL:     ['Faculty', 'Music Teachers', 'Instructors'],
    DANCE_ACADEMY:    ['Choreographers', 'Instructors', 'Faculty'],
    // Food & Beverage
    RESTAURANT:       ['Kitchen Team', 'Crew', 'Floor Staff'],
    DHABA:            ['Kitchen Staff', 'Helpers', 'Crew'],
    CLOUD_KITCHEN:    ['Kitchen Team', 'Cooks', 'Staff'],
    CANTEEN_MESS:     ['Kitchen Staff', 'Mess Team', 'Crew'],
    // Beauty
    SALON:            ['Stylists', 'Beauticians', 'Team'],
    BEAUTY_PARLOUR:   ['Beauticians', 'Stylists', 'Team'],
    BARBERSHOP:       ['Barbers', 'Team', 'Staff'],
    LAUNDRY:          ['Wash Staff', 'Team', 'Workers'],
    TAILORING:        ['Tailors', 'Designers', 'Team'],
    // Professional
    FREELANCER:       ['Collaborators', 'Sub-contractors', 'Team'],
    DIGITAL_AGENCY:   ['Designers', 'Developers', 'Team'],
    PHOTOGRAPHY:      ['Photographers', 'Editors', 'Team'],
    INTERIOR_DESIGN:  ['Designers', 'Decorators', 'Team'],
    // Events
    EVENT_PLANNER:    ['Event Team', 'Coordinators', 'Crew'],
    DECORATOR:        ['Decorators', 'Event Crew', 'Team'],
    TENT_HOUSE:       ['Setup Crew', 'Workers', 'Team'],
    // Transport
    TRANSPORT:        ['Drivers', 'Transport Team', 'Crew'],
    COURIER:          ['Delivery Staff', 'Riders', 'Team'],
    PACKERS_MOVERS:   ['Movers', 'Packers', 'Team'],
    // Trade
    DEALER:           ['Sales Team', 'Staff', 'Team'],
    SUPPLIER:         ['Dispatch Team', 'Warehouse Staff', 'Team'],
    WHOLESALE:        ['Sales Team', 'Warehouse Staff', 'Team'],
    // Retail
    RETAIL:           ['Shop Staff', 'Salespeople', 'Team'],
    KIRANA:           ['Shop Staff', 'Helpers', 'Team'],
    BAKERY:           ['Bakers', 'Kitchen Staff', 'Team'],
    SWEET_SHOP:       ['Shop Staff', 'Helpers', 'Team'],
    // Others
    CONSTRUCTION:     ['Workers', 'Site Team', 'Crew'],
    WORKSHOP:         ['Technicians', 'Mechanics', 'Team'],
    ELECTRICAL:       ['Electricians', 'Technicians', 'Team'],
    MOBILE_REPAIR:    ['Technicians', 'Repair Staff', 'Team'],
    PEST_CONTROL:     ['Technicians', 'Field Team', 'Crew'],
    CO_WORKING:       ['Community Team', 'Support Staff', 'Team'],
    MALL:             ['Mall Staff', 'Management Team', 'Team'],
    HOTEL:            ['Hotel Staff', 'Team', 'Crew'],
    DEFAULT:          ['Team', 'Employees', 'Crew'],
  },

  // ─────────────────────────────────────────────────────────────────────────────
  '/inventory': {
    // Healthcare
    CLINIC:           ['Medical Supplies', 'Stock', 'Inventory'],
    MEDICAL_STORE:    ['Medicine Stock', 'Drug Inventory', 'Stock'],
    // Food & Beverage
    RESTAURANT:       ['Kitchen Stock', 'Ingredients', 'Inventory'],
    DHABA:            ['Kitchen Ingredients', 'Daily Stock', 'Inventory'],
    CLOUD_KITCHEN:    ['Kitchen Stock', 'Ingredients', 'Inventory'],
    JUICE_BAR:        ['Fruits & Supplies', 'Stock', 'Inventory'],
    BAKERY:           ['Bakery Stock', 'Ingredients', 'Raw Materials'],
    SWEET_SHOP:       ['Sweet Stock', 'Ingredients', 'Products'],
    CANTEEN_MESS:     ['Kitchen Stock', 'Ingredients', 'Supplies'],
    // Fitness
    GYM:              ['Supplements', 'Merchandise', 'Stock'],
    // Events
    EVENT_PLANNER:    ['Event Materials', 'Supplies', 'Stock'],
    DECORATOR:        ['Decoration Items', 'Props', 'Stock'],
    TENT_HOUSE:       ['Tents & Equipment', 'Items', 'Stock'],
    // Trade & B2B
    DEALER:           ['Product Stock', 'Goods', 'Catalogue'],
    SUPPLIER:         ['Supply Stock', 'Products', 'Goods'],
    WHOLESALE:        ['Bulk Stock', 'Products', 'Warehouse'],
    // Retail
    RETAIL:           ['Shop Stock', 'Products', 'Catalogue'],
    KIRANA:           ['Store Stock', 'Daily Items', 'Products'],
    STATIONARY:       ['Stationery Stock', 'Products', 'Items'],
    JEWELLERY:        ['Jewellery Stock', 'Gold & Silver', 'Items'],
    HARDWARE:         ['Hardware Stock', 'Materials', 'Products'],
    ELECTRICAL:       ['Electrical Items', 'Materials', 'Stock'],
    CLOTHING:         ['Garments', 'Clothing Stock', 'Products'],
    FOOTWEAR:         ['Footwear Stock', 'Shoes', 'Products'],
    ELECTRONICS:      ['Electronics Stock', 'Products', 'Items'],
    MOBILE_REPAIR:    ['Spare Parts', 'Components', 'Stock'],
    OPTICAL:          ['Frames & Lenses', 'Products', 'Stock'],
    BOOKSTORE:        ['Book Stock', 'Titles', 'Catalogue'],
    FLORIST:          ['Flowers & Plants', 'Stock', 'Inventory'],
    // Others
    CONSTRUCTION:     ['Construction Materials', 'Site Stock', 'Materials'],
    WORKSHOP:         ['Tools & Parts', 'Workshop Stock', 'Materials'],
    DEFAULT:          ['Stock', 'Warehouse', 'Inventory'],
  },

  // ─────────────────────────────────────────────────────────────────────────────
  '/pos': {
    // Healthcare
    CLINIC:           ['OTC Sales', 'Counter Sales', 'POS'],
    MEDICAL_STORE:    ['Medicine Sales', 'Billing', 'Counter'],
    // Food & Beverage
    RESTAURANT:       ['Table Orders', 'Billing', 'POS'],
    DHABA:            ['Food Billing', 'Table Orders', 'Counter'],
    CLOUD_KITCHEN:    ['Order Billing', 'Online Orders', 'Billing'],
    JUICE_BAR:        ['Counter Sales', 'Billing', 'Orders'],
    CANTEEN_MESS:     ['Meal Billing', 'Counter', 'Billing'],
    // Retail
    RETAIL:           ['Counter Billing', 'Sales Counter', 'Billing'],
    KIRANA:           ['Cash Counter', 'Billing', 'Sales'],
    SWEET_SHOP:       ['Counter Sales', 'Billing', 'Cash Counter'],
    BAKERY:           ['Counter Billing', 'Sales', 'Billing'],
    JEWELLERY:        ['Sales Billing', 'Counter', 'Billing'],
    HARDWARE:         ['Counter Sales', 'Billing', 'POS'],
    CLOTHING:         ['Counter Billing', 'Sales', 'Billing'],
    ELECTRONICS:      ['Sales Counter', 'Billing', 'POS'],
    FOOTWEAR:         ['Counter Billing', 'Sales', 'Billing'],
    // Services
    LAUNDRY:          ['Order Billing', 'Counter', 'Billing'],
    COURIER:          ['Counter Booking', 'Parcel Billing', 'Booking'],
    DEFAULT:          ['Billing', 'Counter Sales', 'POS'],
  },

  // ─────────────────────────────────────────────────────────────────────────────
  '/invoices': {
    // Healthcare
    CLINIC:           ['Patient Bills', 'Medical Bills', 'Invoices'],
    // Professional
    LAW_FIRM:         ['Legal Bills', 'Fee Notes', 'Invoices'],
    CA_FIRM:          ['Fee Notes', 'Professional Bills', 'Invoices'],
    FREELANCER:       ['Client Bills', 'Project Bills', 'Fee Notes'],
    DIGITAL_AGENCY:   ['Client Bills', 'Project Invoices', 'Retainer Bills'],
    PHOTOGRAPHY:      ['Shoot Bills', 'Client Bills', 'Invoices'],
    INTERIOR_DESIGN:  ['Project Bills', 'Design Bills', 'Invoices'],
    // Construction
    CONSTRUCTION:     ['Project Bills', 'Work Orders', 'Invoices'],
    REAL_ESTATE:      ['Sale Bills', 'Agreements', 'Invoices'],
    // Trade
    DEALER:           ['Sale Bills', 'Trade Invoices', 'Bills'],
    SUPPLIER:         ['Supply Bills', 'Delivery Bills', 'Invoices'],
    WHOLESALE:        ['Trade Bills', 'Bulk Sale Bills', 'Invoices'],
    // Events
    EVENT_PLANNER:    ['Event Bills', 'Project Invoices', 'Bills'],
    // Transport
    TRANSPORT:        ['Trip Bills', 'Freight Bills', 'Invoices'],
    PACKERS_MOVERS:   ['Moving Bills', 'Service Bills', 'Invoices'],
    // Services
    PEST_CONTROL:     ['Service Bills', 'Treatment Bills', 'Invoices'],
    CATERING:         ['Catering Bills', 'Event Bills', 'Invoices'],
    DEFAULT:          ['Bills', 'Tax Invoices', 'Invoices'],
  },

  // ─────────────────────────────────────────────────────────────────────────────
  '/expenses': {
    // Healthcare
    CLINIC:           ['Operating Costs', 'Clinic Expenses', 'Overheads'],
    // Food
    RESTAURANT:       ['Running Costs', 'Kitchen Expenses', 'Overheads'],
    DHABA:            ['Daily Costs', 'Running Costs', 'Expenses'],
    CLOUD_KITCHEN:    ['Kitchen Costs', 'Running Costs', 'Expenses'],
    // Construction
    CONSTRUCTION:     ['Project Costs', 'Site Expenses', 'Spends'],
    INTERIOR_DESIGN:  ['Project Costs', 'Material Costs', 'Expenses'],
    // Events
    EVENT_PLANNER:    ['Event Costs', 'Project Spends', 'Expenses'],
    // Transport
    TRANSPORT:        ['Fuel & Maintenance', 'Running Costs', 'Expenses'],
    COURIER:          ['Delivery Costs', 'Running Costs', 'Expenses'],
    // Retail
    RETAIL:           ['Shop Expenses', 'Running Costs', 'Costs'],
    KIRANA:           ['Shop Expenses', 'Daily Costs', 'Overheads'],
    // Others
    NGO:              ['Program Spends', 'Grant Usage', 'Costs'],
    FREELANCER:       ['Project Costs', 'Work Expenses', 'Costs'],
    DEFAULT:          ['Costs', 'Spends', 'Overheads'],
  },

  // ─────────────────────────────────────────────────────────────────────────────
  '/reports': {
    CLINIC:           ['Clinic Reports', 'Practice Analytics', 'Reports'],
    GYM:              ['Gym Analytics', 'Performance Reports', 'Reports'],
    RESTAURANT:       ['Sales Reports', 'Daily Reports', 'Reports'],
    RETAIL:           ['Sales Reports', 'Shop Reports', 'Reports'],
    KIRANA:           ['Daily Reports', 'Sales Reports', 'Reports'],
    EVENT_PLANNER:    ['Event Reports', 'Project Reports', 'Reports'],
    DEALER:           ['Sales Reports', 'Trade Reports', 'Reports'],
    WHOLESALE:        ['Trade Reports', 'Bulk Sales Reports', 'Reports'],
    TRANSPORT:        ['Trip Reports', 'Fleet Reports', 'Reports'],
    DEFAULT:          ['Analytics', 'Insights', 'Reports'],
  },

  // ─────────────────────────────────────────────────────────────────────────────
  '/attendance': {
    CLINIC:           ['Staff Attendance', 'Duty Roster', 'Attendance'],
    GYM:              ['Staff Roster', 'Member Check-ins', 'Attendance'],
    COACHING:         ['Student Attendance', 'Class Register', 'Attendance'],
    RESTAURANT:       ['Staff Roster', 'Shift Log', 'Attendance'],
    RETAIL:           ['Staff Roster', 'Shift Log', 'Attendance'],
    KIRANA:           ['Staff Log', 'Shift Log', 'Attendance'],
    CONSTRUCTION:     ['Worker Attendance', 'Site Roster', 'Attendance'],
    WORKSHOP:         ['Technician Roster', 'Shift Log', 'Attendance'],
    EVENT_PLANNER:    ['Crew Roster', 'Team Attendance', 'Attendance'],
    TRANSPORT:        ['Driver Log', 'Duty Roster', 'Attendance'],
    DEFAULT:          ['Roster', 'Time Log', 'Attendance'],
  },

  // ─────────────────────────────────────────────────────────────────────────────
  '/assets': {
    CLINIC:           ['Equipment', 'Medical Assets', 'Assets'],
    GYM:              ['Gym Equipment', 'Machines', 'Assets'],
    RESTAURANT:       ['Kitchen Equipment', 'Appliances', 'Assets'],
    CONSTRUCTION:     ['Machinery', 'Site Assets', 'Equipment'],
    WORKSHOP:         ['Workshop Equipment', 'Tools', 'Assets'],
    TRANSPORT:        ['Fleet', 'Vehicles', 'Assets'],
    DECORATOR:        ['Decoration Props', 'Items', 'Assets'],
    TENT_HOUSE:       ['Tents & Props', 'Equipment', 'Assets'],
    INTERIOR_DESIGN:  ['Tools & Equipment', 'Machinery', 'Assets'],
    HOTEL:            ['Hotel Assets', 'Property', 'Equipment'],
    DEFAULT:          ['Equipment', 'Fixed Assets', 'Assets'],
  },

  // ─────────────────────────────────────────────────────────────────────────────
  '/campaigns': {
    CLINIC:           ['Patient Outreach', 'Health Campaigns', 'Campaigns'],
    GYM:              ['Member Promotions', 'Membership Offers', 'Campaigns'],
    SALON:            ['Client Offers', 'Promotions', 'Campaigns'],
    RETAIL:           ['Customer Offers', 'Shop Promotions', 'Campaigns'],
    KIRANA:           ['Customer Offers', 'Deals', 'Campaigns'],
    BAKERY:           ['Seasonal Offers', 'Promotions', 'Campaigns'],
    RESTAURANT:       ['Food Offers', 'Dining Deals', 'Campaigns'],
    DHABA:            ['Food Offers', 'Promotions', 'Deals'],
    EVENT_PLANNER:    ['Event Promotions', 'Seasonal Offers', 'Campaigns'],
    COACHING:         ['Admission Campaigns', 'Offers', 'Campaigns'],
    DEFAULT:          ['Promotions', 'Offers', 'Campaigns'],
  },

  // ─────────────────────────────────────────────────────────────────────────────
  '/whatsapp': {
    CLINIC:           ['Patient Messaging', 'WhatsApp', 'Notifications'],
    GYM:              ['Member Messaging', 'WhatsApp', 'Notifications'],
    RETAIL:           ['Customer Messaging', 'WhatsApp', 'Alerts'],
    KIRANA:           ['Customer Messaging', 'WhatsApp', 'Alerts'],
    COACHING:         ['Student Messaging', 'Parent Updates', 'Notifications'],
    RESTAURANT:       ['Diner Messaging', 'WhatsApp', 'Notifications'],
    EVENT_PLANNER:    ['Client Messaging', 'Event Updates', 'Notifications'],
    DEFAULT:          ['Messaging', 'Notifications', 'WhatsApp'],
  },

  // ─────────────────────────────────────────────────────────────────────────────
  '/vendors': {
    CLINIC:           ['Suppliers', 'Medical Vendors', 'Vendors'],
    RESTAURANT:       ['Suppliers', 'Food Vendors', 'Vendors'],
    RETAIL:           ['Distributors', 'Suppliers', 'Vendors'],
    KIRANA:           ['Suppliers', 'Distributors', 'Vendors'],
    CONSTRUCTION:     ['Contractors', 'Material Suppliers', 'Vendors'],
    WORKSHOP:         ['Parts Suppliers', 'Vendors', 'Suppliers'],
    BAKERY:           ['Raw Material Suppliers', 'Vendors', 'Suppliers'],
    EVENT_PLANNER:    ['Event Vendors', 'Partners', 'Suppliers'],
    WHOLESALE:        ['Manufacturers', 'Suppliers', 'Vendors'],
    DEALER:           ['Suppliers', 'Distributors', 'Vendors'],
    DEFAULT:          ['Suppliers', 'Partners', 'Vendors'],
  },

  // ─────────────────────────────────────────────────────────────────────────────
  '/quotations': {
    FREELANCER:       ['Project Proposals', 'Estimates', 'Quotes'],
    DIGITAL_AGENCY:   ['Project Proposals', 'Pitches', 'Quotes'],
    CONSTRUCTION:     ['Project Estimates', 'Tenders', 'Quotations'],
    INTERIOR_DESIGN:  ['Design Proposals', 'Project Quotes', 'Estimates'],
    EVENT_PLANNER:    ['Event Proposals', 'Estimates', 'Quotes'],
    PEST_CONTROL:     ['Service Estimates', 'Quotes', 'Proposals'],
    DEALER:           ['Price Quotes', 'Trade Estimates', 'Quotations'],
    WHOLESALE:        ['Bulk Quotes', 'Trade Estimates', 'Quotations'],
    SUPPLIER:         ['Supply Quotes', 'Price Lists', 'Estimates'],
    REAL_ESTATE:      ['Property Quotes', 'Estimates', 'Proposals'],
    DEFAULT:          ['Estimates', 'Proposals', 'Quotes'],
  },

  // ─────────────────────────────────────────────────────────────────────────────
  '/accounts': {
    CONSTRUCTION:     ['Project Accounts', 'Finance', 'Ledger'],
    WHOLESALE:        ['Trade Accounts', 'Finance', 'Ledger'],
    FREELANCER:       ['Earnings', 'Finance', 'Accounts'],
    DEFAULT:          ['Bank Accounts', 'Finance', 'Ledger'],
  },

  // ─────────────────────────────────────────────────────────────────────────────
  '/lease': {
    MALL:             ['Shop Leases', 'Tenant Agreements', 'Leases'],
    REAL_ESTATE:      ['Property Leases', 'Rentals', 'Agreements'],
    CO_WORKING:       ['Desk Rentals', 'Space Leases', 'Memberships'],
    DEFAULT:          ['Rentals', 'Leases', 'Agreements'],
  },
};

/**
 * Returns up to 3 suggestions for a given route + businessType.
 * Falls back to DEFAULT if businessType not listed.
 */
export function getSuggestions(route, businessType) {
  const routeMap = LABEL_SUGGESTIONS[route];
  if (!routeMap) return [];
  return routeMap[businessType] || routeMap.DEFAULT || [];
}

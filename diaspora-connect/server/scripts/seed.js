/**
 * Seed script — pre-populates DiasporaConnect with community groups.
 * Run: node scripts/seed.js
 *
 * Covers: Nigeria (IT, Docker, Food, Business, PhD), broader Africa,
 *         South/Southeast Asia, MENA, East Asia, Europe, Americas, Oceania.
 */
require('dotenv').config({ path: require('path').join(__dirname, '../../../.env') });
const mongoose = require('mongoose');
const Group = require('../models/Group');

const GROUPS = [
  // ─── Nigerian IT & Tech ──────────────────────────────────────────────────
  {
    name: 'Nigerian Software Engineers Worldwide',
    description: 'A hub for Nigerian software developers and engineers across the globe to network, share opportunities, and grow together.',
    category: 'IT & Tech',
    homeCountry: 'Nigeria',
    region: 'West Africa',
    industry: 'Software Engineering',
  },
  {
    name: 'Nigerian Docker & DevOps Professionals',
    description: 'Nigerian-born DevOps engineers, Docker/Kubernetes specialists, and cloud architects worldwide. Share configs, job leads, and support.',
    category: 'IT & Tech',
    homeCountry: 'Nigeria',
    region: 'West Africa',
    industry: 'DevOps & Cloud (Docker/Kubernetes)',
  },
  {
    name: 'Nigerian Data Scientists & AI Engineers',
    description: 'Data science, machine learning, and AI professionals of Nigerian origin connecting globally.',
    category: 'IT & Tech',
    homeCountry: 'Nigeria',
    region: 'West Africa',
    industry: 'Data Science & AI',
  },
  {
    name: 'Nigerian Cybersecurity Professionals',
    description: 'Ethical hackers, security analysts, and cybersecurity experts from Nigeria.',
    category: 'IT & Tech',
    homeCountry: 'Nigeria',
    region: 'West Africa',
    industry: 'Cybersecurity',
  },
  {
    name: 'Nigerian IT Professionals in the UK',
    description: 'Nigerian tech talent living and working in the United Kingdom.',
    category: 'IT & Tech',
    homeCountry: 'Nigeria',
    hostCountry: 'United Kingdom',
    region: 'West Africa',
    industry: 'Software Engineering',
  },
  {
    name: 'Nigerian IT Professionals in the USA',
    description: 'Nigerian-born engineers, developers, and IT specialists in the United States.',
    category: 'IT & Tech',
    homeCountry: 'Nigeria',
    hostCountry: 'United States',
    region: 'West Africa',
    industry: 'Software Engineering',
  },
  {
    name: 'Nigerian IT Professionals in Canada',
    description: 'Nigerian tech community across Toronto, Vancouver, Calgary, Ottawa, and beyond.',
    category: 'IT & Tech',
    homeCountry: 'Nigeria',
    hostCountry: 'Canada',
    region: 'West Africa',
    industry: 'Software Engineering',
  },

  // ─── Nigerian Food & Business ────────────────────────────────────────────
  {
    name: 'Nigerian Food Business Owners Abroad',
    description: 'Nigerian restaurant owners, caterers, and food entrepreneurs worldwide. Share recipes, business tips, supplier contacts, and support.',
    category: 'Food & Business',
    homeCountry: 'Nigeria',
    region: 'West Africa',
    industry: 'Food Business & Catering',
  },
  {
    name: 'Nigerian Import & Export Entrepreneurs',
    description: 'Nigerian business owners in import/export, trading, and supply chain across the diaspora.',
    category: 'Entrepreneurs',
    homeCountry: 'Nigeria',
    region: 'West Africa',
    industry: 'Import & Export',
  },
  {
    name: 'Nigerian Real Estate Investors Abroad',
    description: 'Nigerians investing in real estate at home and abroad — tips, deals, and due diligence.',
    category: 'Entrepreneurs',
    homeCountry: 'Nigeria',
    region: 'West Africa',
    industry: 'Real Estate',
  },
  {
    name: 'Nigerian Retail & E-commerce Owners',
    description: 'Online and brick-and-mortar shop owners from Nigeria around the world.',
    category: 'Entrepreneurs',
    homeCountry: 'Nigeria',
    region: 'West Africa',
    industry: 'Retail & E-commerce',
  },

  // ─── Nigerian Healthcare ────────────────────────────────────────────────
  {
    name: 'Nigerian Doctors & Consultants Abroad',
    description: 'Nigerian-born medical doctors, consultants, and specialists sharing challenges, career tips, and mutual support.',
    category: 'Healthcare',
    homeCountry: 'Nigeria',
    region: 'West Africa',
    industry: 'Medicine (Doctor/GP)',
  },
  {
    name: 'Nigerian Nurses in the UK (NHS)',
    description: 'Nigerian nurses working in the National Health Service — support, career growth, and community.',
    category: 'Healthcare',
    homeCountry: 'Nigeria',
    hostCountry: 'United Kingdom',
    region: 'West Africa',
    industry: 'Nursing',
  },
  {
    name: 'Nigerian Nurses Worldwide',
    description: 'Nigerian nurses across North America, Europe, Australia, Middle East and beyond.',
    category: 'Healthcare',
    homeCountry: 'Nigeria',
    region: 'West Africa',
    industry: 'Nursing',
  },
  {
    name: 'Nigerian Pharmacists Abroad',
    description: 'Nigerian-trained pharmacists practising internationally. Licensing, career, and community support.',
    category: 'Healthcare',
    homeCountry: 'Nigeria',
    region: 'West Africa',
    industry: 'Pharmacy',
  },

  // ─── Nigerian Masters & PhD Holders ────────────────────────────────────
  {
    name: 'Nigerian PhD Holders & Academics Worldwide',
    description: 'Nigerians with doctorate degrees — professors, postdocs, and researchers sharing academic opportunities and supporting each other.',
    category: 'Masters & PhD Holders',
    homeCountry: 'Nigeria',
    region: 'West Africa',
    educationLevel: 'PhD / Doctorate',
    industry: 'Higher Education & Academia',
  },
  {
    name: 'Nigerian Masters Degree Holders Abroad',
    description: 'Nigerians holding MSc, MBA, MA, MEng degrees — from all industries — connecting globally.',
    category: 'Masters & PhD Holders',
    homeCountry: 'Nigeria',
    region: 'West Africa',
    educationLevel: "Master's Degree (MSc/MBA/MA/MEng)",
  },
  {
    name: 'Nigerian STEM PhD Network',
    description: 'Nigerian scientists, engineers, and technologists with PhDs collaborating on research and career development.',
    category: 'Masters & PhD Holders',
    homeCountry: 'Nigeria',
    region: 'West Africa',
    educationLevel: 'PhD / Doctorate',
    industry: 'Research & Development',
  },

  // ─── Broader Africa ──────────────────────────────────────────────────────
  {
    name: 'Ghanaian Professionals Worldwide',
    description: 'Ghanaians across all professions supporting one another in the diaspora.',
    category: 'Professional Networking',
    homeCountry: 'Ghana',
    region: 'West Africa',
  },
  {
    name: 'Kenyan Entrepreneurs in the UAE',
    description: 'Kenyan business owners and entrepreneurs making waves in the United Arab Emirates.',
    category: 'Entrepreneurs',
    homeCountry: 'Kenya',
    hostCountry: 'United Arab Emirates',
    region: 'East Africa',
  },
  {
    name: 'South African Professionals in Australia',
    description: 'South Africans in Australia sharing career advice, life tips, and community support.',
    category: 'Professional Networking',
    homeCountry: 'South Africa',
    hostCountry: 'Australia',
    region: 'Southern Africa',
  },
  {
    name: 'Ethiopian & Eritrean Diaspora Network',
    description: 'East African professionals from Ethiopia and Eritrea connecting globally.',
    category: 'Cultural & Social',
    region: 'East Africa',
  },
  {
    name: 'African PhD Holders Worldwide',
    description: 'Pan-African doctorate holders supporting academic and professional excellence across the globe.',
    category: 'Masters & PhD Holders',
    region: 'Africa',
    educationLevel: 'PhD / Doctorate',
  },
  {
    name: 'African Food Business Owners Abroad',
    description: 'African restaurant owners, caterers, and food brand founders in the diaspora.',
    category: 'Food & Business',
    region: 'Africa',
    industry: 'Food Business & Catering',
  },
  {
    name: 'African Women in Tech',
    description: 'Women of African origin in technology roles — engineers, product managers, data scientists, designers.',
    category: 'IT & Tech',
    region: 'Africa',
    industry: 'Software Engineering',
  },
  {
    name: 'Zimbabwean Professionals in the UK',
    description: 'Zimbabweans across all industries in the United Kingdom.',
    category: 'Professional Networking',
    homeCountry: 'Zimbabwe',
    hostCountry: 'United Kingdom',
    region: 'Southern Africa',
  },
  {
    name: 'Cameroonian Diaspora Professionals',
    description: 'Cameroonians — anglophone and francophone — in the global workforce.',
    category: 'Cultural & Social',
    homeCountry: 'Cameroon',
    region: 'Central Africa',
  },
  {
    name: 'Senegalese & West African French-Speaking Professionals',
    description: "Francophone West Africans (Senegal, Côte d'Ivoire, Mali, Benin, Burkina Faso, Togo) in the diaspora.",
    category: 'Professional Networking',
    region: 'West Africa',
  },

  // ─── South Asia ─────────────────────────────────────────────────────────
  {
    name: 'Indian IT Professionals in the USA',
    description: 'Indian software engineers, architects, and tech leads thriving in the United States.',
    category: 'IT & Tech',
    homeCountry: 'India',
    hostCountry: 'United States',
    region: 'South Asia',
    industry: 'Software Engineering',
  },
  {
    name: 'Indian IT Professionals in Canada',
    description: 'Indian tech diaspora in Canada — Express Entry, job market, and professional networking.',
    category: 'IT & Tech',
    homeCountry: 'India',
    hostCountry: 'Canada',
    region: 'South Asia',
    industry: 'Software Engineering',
  },
  {
    name: 'Indian Doctors & Healthcare Professionals Abroad',
    description: 'Indian-trained doctors, dentists, and allied health professionals working globally.',
    category: 'Healthcare',
    homeCountry: 'India',
    region: 'South Asia',
    industry: 'Medicine (Doctor/GP)',
  },
  {
    name: 'Indian Food Business Owners in Europe',
    description: 'Indian restaurant owners, chefs, and food entrepreneurs across European cities.',
    category: 'Food & Business',
    homeCountry: 'India',
    region: 'South Asia',
    industry: 'Food Business & Catering',
  },
  {
    name: 'Pakistani Professionals in the UAE & Gulf',
    description: 'Pakistani expats — engineers, doctors, tradespeople, and entrepreneurs — in the Gulf region.',
    category: 'Professional Networking',
    homeCountry: 'Pakistan',
    region: 'South Asia',
  },
  {
    name: 'Bangladeshi Diaspora Professionals',
    description: 'Bangladeshis across all professions and education levels worldwide.',
    category: 'Professional Networking',
    homeCountry: 'Bangladesh',
    region: 'South Asia',
  },

  // ─── Southeast Asia ──────────────────────────────────────────────────────
  {
    name: 'Filipino Healthcare Workers Worldwide',
    description: 'Filipino nurses, doctors, caregivers, and allied health professionals supporting each other globally.',
    category: 'Healthcare',
    homeCountry: 'Philippines',
    region: 'Southeast Asia',
    industry: 'Nursing',
  },
  {
    name: 'Filipino IT & Tech Professionals Abroad',
    description: 'Filipino software engineers and IT specialists in North America, Europe, and the Middle East.',
    category: 'IT & Tech',
    homeCountry: 'Philippines',
    region: 'Southeast Asia',
    industry: 'Software Engineering',
  },
  {
    name: 'Indonesian Professionals in the Diaspora',
    description: 'Indonesian expats — professionals, entrepreneurs, and students — worldwide.',
    category: 'Professional Networking',
    homeCountry: 'Indonesia',
    region: 'Southeast Asia',
  },

  // ─── MENA ────────────────────────────────────────────────────────────────
  {
    name: 'Lebanese Diaspora Business Network',
    description: 'Lebanese entrepreneurs and professionals in the Americas, Africa, Europe, and beyond.',
    category: 'Entrepreneurs',
    homeCountry: 'Lebanon',
    region: 'MENA',
  },
  {
    name: 'Egyptian Professionals Abroad',
    description: 'Egyptian diaspora across engineering, medicine, academia, and business.',
    category: 'Professional Networking',
    homeCountry: 'Egypt',
    region: 'MENA',
  },
  {
    name: 'Moroccan Diaspora in Europe',
    description: 'Moroccan professionals and entrepreneurs in France, Spain, Belgium, the Netherlands, and beyond.',
    category: 'Professional Networking',
    homeCountry: 'Morocco',
    region: 'MENA',
  },

  // ─── East Asia ───────────────────────────────────────────────────────────
  {
    name: 'Chinese Professionals in North America',
    description: 'Chinese engineers, academics, entrepreneurs, and healthcare workers in the USA and Canada.',
    category: 'Professional Networking',
    homeCountry: 'China',
    region: 'East Asia',
  },
  {
    name: 'Japanese Professionals Abroad',
    description: 'Japanese expats in technology, finance, academia, and the creative industries worldwide.',
    category: 'Professional Networking',
    homeCountry: 'Japan',
    region: 'East Asia',
  },

  // ─── Latin America ───────────────────────────────────────────────────────
  {
    name: 'Mexican & Latin American Tradespeople in the USA',
    description: 'Construction workers, electricians, plumbers, and skilled tradespeople from Latin America in North America.',
    category: 'Skilled Trades',
    region: 'Latin America',
    industry: 'Construction & Civil Engineering',
  },
  {
    name: 'Brazilian Professionals in Europe',
    description: 'Brazilian expats in engineering, IT, business, and the arts living in Europe.',
    category: 'Professional Networking',
    homeCountry: 'Brazil',
    region: 'Latin America',
  },

  // ─── Europe ──────────────────────────────────────────────────────────────
  {
    name: 'Polish Workers in the UK & Germany',
    description: 'Polish expats in skilled trades, engineering, healthcare, and hospitality in Western Europe.',
    category: 'Skilled Trades',
    homeCountry: 'Poland',
    region: 'Europe',
  },
  {
    name: 'Eastern European IT Professionals Abroad',
    description: 'Developers, engineers, and IT professionals from Romania, Ukraine, Bulgaria, and neighboring countries.',
    category: 'IT & Tech',
    region: 'Europe',
    industry: 'Software Engineering',
  },

  // ─── Oceania ────────────────────────────────────────────────────────────
  {
    name: 'African Diaspora in Australia & New Zealand',
    description: 'Africans from all countries building lives and careers in Australia and New Zealand.',
    category: 'Cultural & Social',
    hostCountry: 'Australia',
    region: 'Oceania',
  },

  // ─── Cross-cutting Academic Groups ──────────────────────────────────────
  {
    name: 'Global African PhD & Masters Network',
    description: 'Pan-African postgraduate community — all countries, all disciplines. Research collaboration, scholarships, and career support.',
    category: 'Masters & PhD Holders',
    region: 'Africa',
    educationLevel: 'PhD / Doctorate',
    industry: 'Research & Development',
  },
  {
    name: 'Diaspora MBA Holders',
    description: 'MBA graduates from the global diaspora sharing business insights, investment opportunities, and entrepreneurship advice.',
    category: 'Masters & PhD Holders',
    educationLevel: "Master's Degree (MSc/MBA/MA/MEng)",
    industry: 'Consulting',
  },

  // ─── Support & Wellness ─────────────────────────────────────────────────
  {
    name: 'Mental Health & Wellbeing for the Diaspora',
    description: 'A safe, supportive space to talk about the mental health challenges of immigrant life — loneliness, discrimination, cultural pressures.',
    category: 'Support & Wellness',
  },
  {
    name: 'New Arrivals Survival Guide',
    description: 'Tips, advice, and warm welcomes for those who have just moved to a new country.',
    category: 'Cultural & Social',
  },
];

async function seed() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to MongoDB');

  let created = 0;
  let skipped = 0;

  for (const data of GROUPS) {
    const exists = await Group.findOne({ name: data.name });
    if (exists) { skipped++; continue; }
    await Group.create({ ...data, isSeeded: true, members: [], admins: [] });
    console.log(`  ✓  ${data.name}`);
    created++;
  }

  console.log(`\nSeed complete — ${created} groups created, ${skipped} already existed.`);
  await mongoose.disconnect();
}

seed().catch((err) => { console.error(err); process.exit(1); });

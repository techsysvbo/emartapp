# 🌐 DiasporaConnect

A full-stack community platform for diaspora professionals worldwide — connecting people by country of origin, profession, education level, and industry.

## ✨ Features

| Feature | Description |
|---------|-------------|
| **Community Feed** | Public posts filtered by region, industry, and country |
| **Vent Space** | 🔒 Private anonymous posting — max 5/day, auto-hides on 3+ flags |
| **Communities** | 50+ pre-seeded groups (Nigerian Docker/IT, Food Business, PhD holders, and more) |
| **Events** | Create and RSVP to meetups, webinars, job fairs |
| **Mentorship** | Filter mentors by industry, education level, and country |
| **Direct Messaging** | Real-time DMs powered by Socket.io |
| **Profiles** | Full profiles with profession, industry, education level, institution |

## 🏗️ Tech Stack

- **Frontend:** React 18 + Vite → served as static build via Nginx
- **Backend:** Node.js 18 + Express REST API
- **Database:** MongoDB (self-hosted or Atlas free tier)
- **Real-time:** Socket.io for DMs and group chat
- **Auth:** JWT + bcrypt (12 rounds)
- **File Storage:** Cloudinary (free tier for avatars/images)
- **Process Manager:** PM2 (cluster mode)
- **Reverse Proxy:** Nginx + Let's Encrypt SSL

---

## 🗂️ Project Structure

```
diaspora-connect/
├── client/                   # React (Vite) frontend
│   ├── src/
│   │   ├── pages/            # Feed, VentSpace, Groups, Events, Mentorship, Messages, Profile
│   │   ├── components/       # Layout, PostCard, GroupCard
│   │   ├── context/          # AuthContext
│   │   └── api/              # Axios instance
│   └── vite.config.js
│
├── server/                   # Node.js + Express backend
│   ├── models/               # User, Post, VentPost, Group, Message, Event
│   ├── routes/               # auth, users, posts, vents, groups, events, messages, mentors
│   ├── middleware/            # auth.js, rateLimiter.js
│   ├── socket/               # Socket.io handlers
│   ├── config/               # cloudinary.js
│   ├── scripts/              # seed.js
│   └── server.js
│
├── nginx/
│   └── default.conf          # Hostinger VPS reverse proxy config
├── .env.example
├── ecosystem.config.js       # PM2 cluster config
└── README.md
```

---

## 🚀 Hostinger VPS Deployment

### 1. Provision Your VPS

- Recommended plan: **KVM 2** (2 vCPU, 8 GB RAM, Ubuntu 22.04)
- SSH into your server

### 2. Install Dependencies

```bash
# Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# MongoDB
wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | sudo apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list
sudo apt-get update && sudo apt-get install -y mongodb-org
sudo systemctl start mongod && sudo systemctl enable mongod

# PM2, Nginx, Certbot
sudo npm install -g pm2
sudo apt install -y nginx certbot python3-certbot-nginx
```

### 3. Deploy the App

```bash
# Clone the repo
git clone https://github.com/YOUR_REPO/emartapp.git /var/www
cd /var/www/emartapp/diaspora-connect

# Configure environment
cp .env.example .env
nano .env   # Fill in MONGO_URI, JWT_SECRET, CLOUDINARY keys

# Install server dependencies
cd server && npm install && cd ..

# Install and build client
cd client && npm install && npm run build && cd ..

# Copy client build to web root
mkdir -p /var/www/diaspora-connect
cp -r client/dist /var/www/diaspora-connect/client/dist
```

### 4. Configure Nginx

```bash
sudo cp nginx/default.conf /etc/nginx/sites-available/diaspora-connect
# Edit the file to replace 'yourdomain.com' with your actual domain
sudo nano /etc/nginx/sites-available/diaspora-connect
sudo ln -s /etc/nginx/sites-available/diaspora-connect /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

### 5. SSL with Let's Encrypt

```bash
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

### 6. Start the API with PM2

```bash
cd /var/www/emartapp/diaspora-connect
mkdir -p /var/log/diaspora-connect
pm2 start ecosystem.config.js --env production
pm2 save && pm2 startup
```

### 7. Seed Community Groups

```bash
cd server
node scripts/seed.js
```

---

## 🌍 Pre-seeded Communities (50+)

### Nigeria
- Nigerian Software Engineers Worldwide
- **Nigerian Docker & DevOps Professionals** 🐳
- Nigerian Data Scientists & AI Engineers
- Nigerian Cybersecurity Professionals
- Nigerian IT Professionals in the UK / USA / Canada
- **Nigerian Food Business Owners Abroad** 🍲
- Nigerian Import & Export Entrepreneurs
- Nigerian Real Estate Investors Abroad
- Nigerian Retail & E-commerce Owners
- Nigerian Doctors & Consultants Abroad
- Nigerian Nurses in the UK (NHS) / Worldwide
- Nigerian Pharmacists Abroad
- **Nigerian PhD Holders & Academics Worldwide** 🎓
- **Nigerian Masters Degree Holders Abroad** 📚
- Nigerian STEM PhD Network

### Africa (broader)
- Ghanaian Professionals Worldwide
- Kenyan Entrepreneurs in the UAE
- South African Professionals in Australia
- Ethiopian & Eritrean Diaspora Network
- **African PhD Holders Worldwide** 🎓
- **African Food Business Owners Abroad** 🍽️
- African Women in Tech
- Zimbabwean Professionals in the UK
- Cameroonian Diaspora Professionals
- Senegalese & Francophone West African Professionals

### South Asia
- Indian IT Professionals in USA / Canada
- Indian Doctors & Healthcare Professionals Abroad
- Indian Food Business Owners in Europe
- Pakistani Professionals in UAE & Gulf
- Bangladeshi Diaspora Professionals

### Southeast Asia
- Filipino Healthcare Workers Worldwide
- Filipino IT & Tech Professionals Abroad
- Indonesian Professionals in the Diaspora

### MENA
- Lebanese Diaspora Business Network
- Egyptian Professionals Abroad
- Moroccan Diaspora in Europe

### East Asia
- Chinese Professionals in North America
- Japanese Professionals Abroad

### Latin America
- Mexican & Latin American Tradespeople in the USA
- Brazilian Professionals in Europe

### Europe
- Polish Workers in the UK & Germany
- Eastern European IT Professionals Abroad

### Oceania & Cross-cutting
- African Diaspora in Australia & New Zealand
- Global African PhD & Masters Network
- Diaspora MBA Holders
- Mental Health & Wellbeing for the Diaspora
- New Arrivals Survival Guide

---

## 🔒 Privacy & Safety (Vent Space)

1. Author ID stored in DB for moderation — **never sent to clients** for anonymous posts
2. **3+ flags** auto-hides a post pending mod review
3. **Rate limit**: max 5 vent posts per user per day
4. **Auth required**: all vent routes need a valid JWT token
5. **Soft delete**: posts are marked `removed`, never physically deleted
6. SSL/HTTPS enforced via Nginx + Let's Encrypt

---

## 👤 User Model Fields

| Field | Values |
|-------|--------|
| `industry` | 50+ categories: Docker/DevOps, Food Business, Nursing, PhD Academia, etc. |
| `educationLevel` | High School, Diploma, BSc, **MSc/MBA**, **PhD/Doctorate**, Professional Cert |
| `profession` | Free-text (e.g. "Docker Engineer", "Jollof Rice Caterer", "Cardiologist") |
| `institution` | Free-text university/college |
| `fieldOfStudy` | Free-text (e.g. "Computer Science", "Food Technology") |
| `isMentor` | Boolean — opt-in to mentor others |

---

## 🔧 Local Development

```bash
# Terminal 1 — API server
cd diaspora-connect/server
cp ../../.env.example .env   # edit with local values
npm install
npm run dev

# Terminal 2 — React client
cd diaspora-connect/client
npm install
npm run dev

# Seed database
cd diaspora-connect/server
node scripts/seed.js
```

Frontend runs at `http://localhost:5173`, API at `http://localhost:5000`.

---

## 🛣️ API Reference

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| POST | `/api/auth/register` | ❌ | Register |
| POST | `/api/auth/login` | ❌ | Login |
| GET | `/api/posts` | ✅ | Public feed |
| POST | `/api/posts` | ✅ | Create post |
| GET | `/api/vents` | ✅ | Private vent feed |
| POST | `/api/vents` | ✅ | Create vent (5/day limit) |
| POST | `/api/vents/:id/flag` | ✅ | Flag vent post |
| GET | `/api/groups` | ✅ | Browse communities |
| POST | `/api/groups` | ✅ | Create community |
| POST | `/api/groups/:id/join` | ✅ | Join/leave community |
| GET | `/api/events` | ✅ | Upcoming events |
| POST | `/api/events` | ✅ | Create event |
| GET | `/api/mentors` | ✅ | Browse mentors |
| PATCH | `/api/mentors/enroll` | ✅ | Opt in/out as mentor |
| GET | `/api/messages` | ✅ | Inbox (conversation list) |
| GET | `/api/messages/:userId` | ✅ | Message thread |
| POST | `/api/messages/:userId` | ✅ | Send DM |
| GET | `/api/users` | ✅ | Search users |
| PATCH | `/api/users/me` | ✅ | Update profile |

---

## 💰 Future Monetisation

- Premium membership (ad-free, priority mentorship)
- Sponsored job posts (Paystack / Stripe integration)
- Event ticket sales
- Featured group listings

# 🪙 GoldLoan Manager

Complete gold shop loan management system with customer tracking, automatic interest calculation, payment recording, and WhatsApp Business API reminders.

## ✨ Features
- 🏪 Multi-shop accounts
- 👥 Customer profiles with Aadhar, address
- 🪙 Loan tracking with gold items (weight, purity, value)
- 📈 Auto monthly compound interest calculation
- 💳 Payment recording with running balance
- ⚠️ Dashboard reminders for overdue and due-soon loans
- 📱 WhatsApp Business API reminders
- ⏰ Vercel Cron auto-reminders at 9 AM daily

## 🚀 Quick Start

### 1. Prerequisites
- Node.js 18+
- Redis (local or [Upstash](https://upstash.com))

### 2. Install & Configure
```bash
npm install
cp .env.example .env.local
# Edit .env.local with your Redis URL and secrets
```

### 3. Run
```bash
npm run dev
```

## 🌐 Deploy to Vercel

### Step 1: Upstash Redis (Free)
1. Create free account at [upstash.com](https://upstash.com)
2. Create a Redis database, copy the `rediss://` URL

### Step 2: Deploy
```bash
npm i -g vercel
vercel
```

### Step 3: Vercel Environment Variables
| Variable | Value |
|----------|-------|
| `REDIS_URL` | Upstash Redis URL (rediss://...) |
| `JWT_SECRET` | Random 32+ char string |
| `CRON_SECRET` | Secret to protect cron endpoint |

### Step 4: Cron Reminders
`vercel.json` is pre-configured to run auto-reminders at 9 AM UTC daily.

## 📱 WhatsApp Setup
1. Go to [Meta for Developers](https://developers.facebook.com)
2. Create App → WhatsApp → Business
3. Get your **Access Token** and **Phone Number ID**
4. Enter in Dashboard → Settings → WhatsApp

## 💡 Interest Calculation
Monthly compound interest: `Total = Principal × (1 + rate/100)^months`

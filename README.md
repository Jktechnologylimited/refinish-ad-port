# AutoOps — Refinish PHC Platform

Built by JK Technology Limited (jktl.com.ng)

## Stack
- **Next.js 16.2** (App Router, Turbopack)
- **Neon** (PostgreSQL — no pausing, production-ready free tier)
- **Prisma** (ORM + migrations)
- **NextAuth v5** (role-based auth: owner, manager, worker)
- **Paystack** (deposits + shop checkout)
- **Cloudinary** (product + intake photos)
- **Resend** (transactional emails)
- **Workbox PWA** (offline worker app with background sync)
- **Tailwind CSS v4**

---

## Quick Start

### 1. Clone & install
```bash
git clone <repo>
cd autoops
npm install
```

### 2. Set up Neon database
1. Go to [neon.tech](https://neon.tech) → New Project → `refinish-phc`
2. Copy the **pooled** connection string → `DATABASE_URL` in `.env.local`
3. Copy the **direct** connection string → `DIRECT_URL` in `.env.local`

### 3. Fill in `.env.local`
```bash
cp .env.local.example .env.local
# Fill in all values
```

### 4. Run migrations + seed
```bash
npm run db:push     # push schema to Neon
npm run db:seed     # create initial users + products
```

### 5. Start dev server
```bash
npm run dev
# Opens at http://localhost:3000
```

---

## Default Login Credentials
| Role | Email | Password |
|---|---|---|
| Owner | owner@refinishphc.com | RefinishOwner2026! |
| Manager | manager@refinishphc.com | RefinishManager2026! |
| Worker | worker@refinishphc.com | RefinishWorker2026! |

**⚠️ Change all passwords before deploying to production!**

---

## URL Structure
| URL | What |
|---|---|
| `/` | Shop homepage |
| `/shop` | Product listing |
| `/shop/[slug]` | Product detail |
| `/cart` | Cart |
| `/checkout` | Checkout + Paystack |
| `/admin/login` | Admin login |
| `/admin/dashboard` | Owner/manager dashboard |
| `/admin/dashboard/bookings` | Booking pipeline (Kanban) |
| `/admin/dashboard/orders` | Shop orders |
| `/admin/dashboard/products` | Product CRUD |
| `/admin/dashboard/customers` | CRM |
| `/admin/dashboard/workers` | Worker management |
| `/worker/jobs` | Worker PWA (offline-capable) |

---

## Deploy to Vercel
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Add all env vars in Vercel dashboard
# Set custom domain: shop.refinishphc.com
```

---

## Per-Client Setup (New Client Checklist)
When deploying for a new auto detailing client:

- [ ] Clone this repo → rename → push to new GitHub repo
- [ ] Create new Neon project → get connection strings
- [ ] Create new Vercel project → link to repo
- [ ] Set all env vars in Vercel (new Paystack keys, Resend from email etc.)
- [ ] Update `prisma/seed.ts` with client's business name + services
- [ ] Run `npm run db:push && npm run db:seed` via Vercel CLI or locally
- [ ] Update branding: logo, colours in `globals.css` CSS vars
- [ ] Set up custom domain in Vercel
- [ ] Set Paystack webhook URL: `https://[client-domain]/api/paystack/webhook`
- [ ] Verify Resend domain for client's email
- [ ] Change seed passwords → send credentials to client owner

**Time per client: ~2-3 hours**
**Monthly retainer: ₦150,000**

---

## Project Structure
```
autoops/
├── prisma/
│   ├── schema.prisma     # Full database schema
│   └── seed.ts           # Initial data seeder
├── public/
│   ├── sw.js             # Service worker (Workbox)
│   └── manifest.json     # PWA manifest
├── src/
│   ├── app/
│   │   ├── store/        # Customer shop pages
│   │   ├── admin/        # Admin dashboard
│   │   ├── worker/       # Worker PWA
│   │   └── api/          # API routes
│   ├── components/
│   │   ├── ui/           # Shared UI components
│   │   ├── admin/        # Admin-specific components
│   │   ├── store/        # Shop components
│   │   └── worker/       # Worker PWA components
│   ├── lib/
│   │   ├── prisma.ts     # DB client
│   │   ├── auth.ts       # NextAuth config
│   │   ├── paystack.ts   # Paystack helpers
│   │   ├── resend.ts     # Email helpers
│   │   ├── cloudinary.ts # Image upload helpers
│   │   └── offline.ts    # IndexedDB / Dexie config
│   ├── hooks/            # Custom React hooks
│   └── types/            # TypeScript types
```

---

Built with ❤️ by [JK Technology Limited](https://jktl.com.ng)

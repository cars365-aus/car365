# Hire Car – Premium Vehicle Marketplace

Hire Car is a modern, scalable, multi-tenant marketplace connecting customers with premium local car rental operators. It enables vendors to manage their fleets, locations, and leads, while offering customers an intuitive platform to discover and book vehicles.

## Tech Stack
- **Frontend Framework**: Next.js 16 (App Router, Server Actions)
- **Styling**: Tailwind CSS v4, shadcn/ui, Framer Motion
- **Database & Auth**: Supabase (PostgreSQL, Row Level Security)
- **Search Engine**: Typesense Cloud
- **Security**: Cloudflare Turnstile, Upstash Redis Rate Limiting
- **Emails**: Resend
- **Payments**: Stripe

## Project Structure
```text
src/
├── app/                  # Next.js App Router (pages & API routes)
│   ├── (public)/         # SEO-friendly marketing and discovery pages
│   ├── admin/            # Superadmin dashboard
│   ├── api/              # Route handlers and webhooks
│   ├── customer/         # Customer account portal
│   └── vendor/           # Vendor fleet & lead management portal
├── components/           # Reusable UI elements (shadcn + custom)
└── lib/                  # Core utilities (auth, search, DB clients)
supabase/                 # Database migrations, edge functions, config
docs/                     # Comprehensive developer & architectural documentation
```

## Local Development Setup

1. **Clone the repository and install dependencies:**
   ```bash
   git clone [repo-url]
   cd Carhire
   npm install
   ```

2. **Configure Environment Variables:**
   Copy the example environment template and populate it with your local Supabase and Typesense keys.
   ```bash
   cp .env.example .env.local
   ```

3. **Start the Development Server:**
   ```bash
   npm run dev
   ```
   The application will be available at `http://localhost:3000`.

## Scripts
- `npm run dev` - Starts the Next.js development server
- `npm run build` - Creates an optimized production build
- `npm run start` - Runs the production build
- `npm run lint` - Runs ESLint to check for code quality issues
- `npm run test` - Runs Vitest test suites

## Documentation
For deep technical guides, please refer to the `/docs` directory:
- [Architecture & System Design](docs/ARCHITECTURE.md)
- [Codebase Guide](docs/CODEBASE_GUIDE.md)
- [Database Schema & Migrations](docs/DATABASE.md)
- [API Reference](docs/API.md)
- [Deployment & Operations](docs/DEPLOYMENT.md)
- [SEO Strategy](docs/SEO.md)
- [Security Boundaries](docs/SECURITY.md)
- [Contributing Guidelines](docs/CONTRIBUTING.md)

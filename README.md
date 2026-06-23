# Harbor & Key - Property Rental & Booking Platform

##  Live URL
*Deploy coming soon*

## 💡 Purpose
The Property Rental & Booking Platform helps property owners list rental properties and allows tenants to discover, book, and pay reservation fees online. The system includes role-based access control, property management, booking workflows, secure payments, review systems, and administrative moderation.
The platform connects tenants and property owners through a transparent and secure rental marketplace.

##  Key Features
- **Role-based Dashboards:** Dedicated views and capabilities for `Tenant`, `Owner`, and `Admin` roles.
- **Advanced Search & Filtering:** Backend-driven search with pagination, sorting, and multi-factor filtering.
- **Secure Stripe Checkout:** Seamless payment flow for booking properties with automated transaction tracking.
- **Interactive Analytics:** Owners can view their monthly earnings through a dynamic `Recharts` graph.
- **PDF Reports:** Owners can export their earnings reports and summaries directly to PDF.
- **Dark/Light Mode:** Full theming support via `next-themes` for an accessible viewing experience.
- **Framer Motion Animations:** Smooth entrance animations and page transitions.
- **Social Sharing:** Native Web Share API integration to easily share property links.

##  Tech Stack & Key NPM Packages

**Frontend (Client):**
- `next` (16.2.9)
- `react` / `react-dom` (19.2.4)
- `tailwindcss` / `@tailwindcss/postcss` (^4)
- `@heroui/react` / `@heroui/theme` (Component Library)
- `framer-motion` (Animations)
- `recharts` (Data Visualization)
- `html2pdf.js` (PDF generation)
- `lucide-react` (Icons)
- `better-auth` / `@better-auth/mongo-adapter` (Authentication)

**Backend (Server):**
- `express` (Web framework)
- `mongoose` (MongoDB object modeling)
- `cors` (Cross-Origin Resource Sharing)
- `dotenv` (Environment variables)
- `jose` (JWT handling)
- `stripe` (Payment Gateway)
- `express-rate-limit` (API Security)

## 🛠️ Local Development

1. **Clone the repository.**
2. **Install dependencies:**
   ```bash
   cd client && npm install
   cd ../server && npm install
   ```
3. **Set up Environment Variables:**
   - Create `.env` in `/server` (MongoDB URI, Stripe keys, JWT secrets).
   - Create `.env.local` in `/client` (API URL, Better Auth URL, etc).
4. **Run the development servers:**
   - Client: `npm run dev`
   - Server: `npm run dev`

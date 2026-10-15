  # Hostel Management Website

  Tech Stack: React (JavaScript/JSX), Vite, Tailwind CSS, Supabase, PostgreSQL

  1.Designed and developed a full-stack hostel management platform for room allocation, student records, and administrative workflows.
  
  2.Implemented secure authentication and role-based access control using Supabase Authentication.
  
  3.Built responsive user interfaces and integrated real-time database operations for efficient hostel management.

## Getting started

Requires Node.js 18+.

```bash
npm install
npm run dev      # start the dev server at http://localhost:5173
npm run build    # production build into dist/
```

Supabase credentials are read from `.env`:

```
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
```

Run `supabase_setup.sql` in the Supabase SQL editor to create the tables.

## Icons and branding

- **Logo:** `src/app/components/brand/Logo.jsx` exports `LogoMark` (the SVG mark) and `Logo` (mark + "DormDesk" wordmark with an optional tagline). `public/favicon.svg` uses the same artwork.
- **Icons:** all UI icons come from [`lucide-react`](https://lucide.dev/icons). Decorative icons are hidden from screen readers automatically; give icon-only buttons an `aria-label`.

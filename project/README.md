# AdFlowPro

Pakistan's Moderated Ads Marketplace - A comprehensive platform for buying and selling sponsored listings with built-in moderation and role-based access control.

## Features

- **User Roles**: Client, Moderator, Admin, Super Admin with tailored dashboards
- **Ad Management**: Create, browse, and manage advertisements across categories and cities
- **Moderation Workflow**: Automated approval process for listings
- **Payment Integration**: Secure payment proof submission and queue management
- **Analytics & Monitoring**: System health logs, user analytics, and audit trails
- **Responsive Design**: Built with Tailwind CSS for mobile-first experience

## Tech Stack

- **Frontend**: React 18, TypeScript, Vite
- **Styling**: Tailwind CSS, PostCSS, Autoprefixer
- **Backend**: Supabase (PostgreSQL, Auth, Storage)
- **Icons**: Lucide React
- **Routing**: React Router DOM
- **Linting**: ESLint with TypeScript support

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Supabase account and project

### Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd project
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   Create a `.env.local` file in the root directory with your Supabase credentials:
   ```
   VITE_SUPABASE_URL=your-supabase-url
   VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
   ```

4. Run database migrations:
   Navigate to the `supabase` folder and run migrations as needed.

5. Start the development server:
   ```bash
   npm run dev
   ```

6. Open [http://localhost:5173](http://localhost:5173) in your browser.

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm run typecheck` - Run TypeScript type checking

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── common/         # Shared components (AdCard, LoadingSpinner, etc.)
│   └── layout/         # Layout components (Navbar, Footer, etc.)
├── contexts/           # React contexts (AuthContext)
├── lib/                # Utilities (Supabase client, Router, etc.)
├── pages/              # Page components
│   ├── admin/          # Admin-specific pages
│   ├── client/         # Client dashboard pages
│   ├── moderator/      # Moderator pages
│   └── superadmin/     # Super admin pages
└── types/              # TypeScript type definitions
```

## Database Schema

The application uses Supabase with the following main tables:
- `users` - User profiles with roles
- `seller_profiles` - Public seller information
- `ads` - Advertisement listings
- `packages` - Ad package definitions
- `categories` & `cities` - Taxonomy tables
- `payments` - Payment records
- `notifications` - In-app notifications
- `audit_logs` - Activity tracking

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is private and proprietary.</content>
<parameter name="filePath">c:\Users\SUNIT\midproj006\project\README.md
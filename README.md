# SSC Exam Hub - Admin Panel

A comprehensive Next.js admin panel for managing the SSC Exam Hub mobile application.

## 🚀 Features

### ✅ **Implemented**

1. **Authentication System**
   - Secure login with Supabase Auth
   - Admin-only access control
   - Session management
   - Protected routes with middleware

2. **Dashboard**
   - Real-time analytics
   - User growth charts
   - Activity feed
   - Key metrics (users, tests, questions, revenue)

3. **Responsive UI**
   - Modern Tailwind CSS design
   - Mobile-friendly layout
   - Dark mode support
   - Smooth animations

### 🚧 **In Progress**

4. **User Management**
   - View all users
   - Search and filter
   - Edit user details
   - Manage subscriptions
   - Block/unblock users

5. **Test Management**
   - Create/edit tests
   - Manage test sections
   - Set difficulty levels
   - Schedule live tests

6. **Question Bank**
   - Add questions (single/bulk)
   - Bilingual support (English/Hindi)
   - Category management
   - Import from CSV/Excel

7. **Content Upload**
   - PDF upload to R2
   - Formula management
   - Current affairs updates
   - Image optimization

8. **Analytics**
   - User engagement metrics
   - Test performance analytics
   - Revenue reports
   - Export data

## 📁 Project Structure

```
admin-panel/
├── app/
│   ├── dashboard/          # Main dashboard pages
│   │   ├── users/          # User management
│   │   ├── tests/          # Test management
│   │   ├── questions/      # Question bank
│   │   ├── materials/      # Study materials
│   │   ├── upload/         # Content upload
│   │   ├── analytics/      # Analytics & reports
│   │   ├── database/       # Database viewer
│   │   └── settings/       # Settings
│   ├── login/              # Auth pages
│   ├── layout.tsx          # Root layout
│   └── page.tsx            # Home redirect
├── components/
│   ├── dashboard/          # Dashboard components
│   │   ├── sidebar.tsx
│   │   ├── header.tsx
│   │   ├── stats-card.tsx
│   │   └── ...
│   └── ui/                 # Reusable UI components
│       ├── button.tsx
│       ├── input.tsx
│       └── ...
├── lib/
│   ├── supabase-browser.ts
│   ├── supabase-server.ts
│   └── utils.ts
├── middleware.ts           # Auth middleware
├── next.config.js
├── tailwind.config.js
└── package.json
```

## 🛠️ Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Database**: Supabase (PostgreSQL)
- **Storage**: Cloudflare R2
- **State Management**: TanStack Query
- **Forms**: React Hook Form + Zod
- **Charts**: Recharts
- **Icons**: Lucide React
- **Notifications**: React Hot Toast

## 📦 Installation

```bash
# Navigate to admin panel directory
cd admin-panel

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env.local

# Edit .env.local with your credentials

# Run development server
npm run dev
```

## 🔐 Environment Variables

Required environment variables (see `.env.example`):

- `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anon key
- `SUPABASE_SERVICE_ROLE_KEY` - Service role key for admin operations
- `R2_*` - Cloudflare R2 credentials for file uploads

## 📊 Database Schema

The admin panel works with these main tables:

- `users` - User accounts and profiles
- `tests` - Test metadata
- `questions` - Question bank
- `test_attempts` - User test submissions
- `content` - PDFs, formulas, current affairs
- `payments` - Payment transactions
- `analytics` - Usage analytics

## 🎯 Key Features

### Dashboard
- Real-time user count
- Active users (7 days)
- Test and question statistics
- Revenue tracking
- User growth chart
- Recent activity feed

### User Management
- Search and filter users
- View user details
- Manage subscriptions (Free/Pro)
- Update coins and streaks
- Block/unblock users
- Export user data

### Test Management
- Create tests with sections
- Set duration and marking scheme
- Add questions from bank
- Schedule live tests
- Preview tests
- Publish/unpublish

### Question Upload
- Single question entry
- Bulk upload via CSV/Excel
- Bilingual support
- Image upload for diagrams
- Category tagging
- Difficulty levels

### Content Management
- Upload PDFs to R2
- Manage formulas
- Add current affairs
- Set free/premium access
- Preview content
- Analytics tracking

### Analytics
- User engagement metrics
- Test completion rates
- Average scores
- Popular content
- Revenue trends
- Export reports

## 🔒 Security

- Admin-only authentication
- Server-side session validation
- Protected API routes
- Row-level security (RLS) in Supabase
- Secure file uploads
- CORS configuration

## 🚀 Deployment

### Vercel (Recommended)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Set environment variables in Vercel dashboard
```

### Manual Deployment

```bash
# Build for production
npm run build

# Start production server
npm start
```

## 📝 Usage Guide

### 1. First Time Setup

1. Create an admin user in Supabase:
```sql
-- In Supabase SQL Editor
UPDATE users 
SET plan = 'admin' 
WHERE email = 'admin@sscexamhub.com';
```

2. Login with admin credentials
3. Complete the initial setup wizard

### 2. Adding Content

**Upload Questions:**
1. Go to Dashboard → Questions
2. Click "Add Question" or "Bulk Upload"
3. Fill in question details (English & Hindi)
4. Add options and correct answer
5. Save

**Upload PDFs:**
1. Go to Dashboard → Content Upload
2. Select PDF file
3. Add title, description, language
4. Set free/premium access
5. Upload

**Create Tests:**
1. Go to Dashboard → Tests
2. Click "Create Test"
3. Add test details
4. Select questions from bank
5. Set marking scheme
6. Publish

### 3. Managing Users

1. Go to Dashboard → Users
2. Search/filter users
3. Click user to view details
4. Edit subscription, coins, etc.
5. Save changes

## 🐛 Troubleshooting

**Login issues:**
- Check Supabase credentials
- Verify user has 'admin' plan
- Clear browser cache

**Upload fails:**
- Check R2 credentials
- Verify file size limits
- Check CORS settings

**Slow performance:**
- Enable database indexes
- Optimize queries
- Use pagination

## 📈 Future Enhancements

- [ ] Email notifications
- [ ] SMS integration
- [ ] Advanced analytics
- [ ] A/B testing
- [ ] Multi-language UI
- [ ] Mobile app
- [ ] AI content generation
- [ ] Automated backups

## 🤝 Contributing

This is a private admin panel. Contact the development team for access.

## 📄 License

Proprietary - All rights reserved

## 📞 Support

For support, email: admin@sscexamhub.com

---

**Built with ❤️ for SSC aspirants**

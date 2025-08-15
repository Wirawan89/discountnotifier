# 🛍️ DiscountNotifier

A smart discount discovery platform that uses AI to find and notify users about the best deals and discounts in their area. Built with Next.js, TypeScript, and Prisma.

## ✨ Features

### 🎯 Core Features
- **AI-Powered Discount Discovery**: Uses multiple AI APIs (OpenRouter, Gemini, Claude) to find real-time discounts
- **Smart Categorization**: Organizes discounts by categories (Food, Electronics, Fashion, etc.)
- **Location-Based Search**: Find discounts in specific suburbs and cities
- **User Authentication**: Secure signup/login with email/password and social login options

### 📧 Email Notifications
- **Welcome Emails**: Personalized welcome messages for new users
- **Discount Alerts**: Real-time email notifications for new discounts in favorite categories
- **Multi-Provider Support**: Gmail, SendGrid, and Resend integration
- **Personalized Content**: User-specific discount recommendations

### 🔔 Notification System
- **In-App Notifications**: Real-time notification bell with unread counts
- **Email Notifications**: Configurable email alerts
- **Push Notifications**: Browser-based push notifications
- **Customizable Preferences**: Control notification frequency and categories

### 🎨 User Experience
- **Modern UI**: Clean, responsive design with Tailwind CSS
- **Favorite System**: Save and track favorite stores and discounts
- **Search & Filter**: Advanced search and filtering capabilities
- **Mobile Responsive**: Optimized for all device sizes

## 🚀 Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Prisma ORM
- **Database**: PostgreSQL
- **Authentication**: NextAuth.js with multiple providers
- **Email**: Nodemailer with multi-provider support
- **AI Integration**: OpenRouter, Google Gemini, Anthropic Claude
- **Deployment**: Vercel-ready

## 📋 Prerequisites

- Node.js 18+ 
- PostgreSQL database
- Email provider account (Gmail, SendGrid, or Resend)
- AI API keys (OpenRouter, Gemini, Claude)

## 🛠️ Installation

### 1. Clone the Repository
```bash
git clone https://github.com/yourusername/discountnotifier.git
cd discountnotifier
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Setup
Create a `.env.local` file in the root directory:

```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/discountnotifier"

# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-nextauth-secret

# Email Configuration
EMAIL_FROM=noreply@discountnotifier.com
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Choose one email provider:
# Gmail
GMAIL_USER=your-email@gmail.com
GMAIL_PASS=your-app-password

# OR SendGrid
SENDGRID_API_KEY=your-sendgrid-api-key

# OR Resend
RESEND_API_KEY=your-resend-api-key

# AI API Keys
OPENROUTER_API_KEY=your-openrouter-api-key
GEMINI_API_KEY=your-gemini-api-key
ANTHROPIC_API_KEY=your-anthropic-api-key

# Social Login (Optional)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
APPLE_ID=your-apple-id
APPLE_SECRET=your-apple-secret
```

### 4. Database Setup
```bash
# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma migrate dev

# Seed the database (optional)
npx prisma db seed
```

### 5. Start Development Server
```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to see the application.

## 📧 Email Setup

The application supports multiple email providers for sending notifications. See [EMAIL_SETUP.md](./EMAIL_SETUP.md) for detailed setup instructions.

### Quick Email Test
```bash
npm run test:email your-email@example.com
```

## 🗄️ Database Schema

The application uses PostgreSQL with the following main tables:

- **Users**: User accounts and authentication
- **UserPreferences**: Email settings, favorite categories, notification preferences
- **Categories**: Discount categories (Food, Electronics, etc.)
- **Stores**: Store information and details
- **Discounts**: Discount details, dates, and descriptions
- **Notifications**: In-app notification system

## 🔧 Available Scripts

```bash
# Development
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint

# Database
npm run db:generate  # Generate Prisma client
npm run db:migrate   # Run migrations
npm run db:seed      # Seed database

# Email
npm run test:email   # Test email configuration

# Cleanup
npm run cleanup      # Clean expired data
npm run cleanup:full # Full database cleanup
```

## 🎯 Usage

### For Users
1. **Sign Up**: Create an account with email or social login
2. **Set Preferences**: Choose favorite categories and notification settings
3. **Browse Discounts**: Explore discounts by category or location
4. **Get Notified**: Receive email alerts for new discounts

### For Developers
1. **API Integration**: Use the discount fetching APIs to add new AI providers
2. **Email Customization**: Modify email templates in `src/lib/email.ts`
3. **UI Customization**: Update components in `src/components/`
4. **Database**: Add new fields using Prisma migrations

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/signup` - User registration
- `POST /api/auth/signin` - User login
- `GET /api/auth/session` - Get current session

### Discounts
- `POST /api/openrouter/fetch-discounts` - Fetch discounts via OpenRouter
- `POST /api/gemini/fetch-discounts` - Fetch discounts via Gemini
- `POST /api/claude/fetch-discounts` - Fetch discounts via Claude
- `GET /api/discounts` - Get all discounts
- `GET /api/stores` - Get all stores

### User Preferences
- `GET /api/preferences` - Get user preferences
- `PUT /api/preferences` - Update user preferences
- `GET /api/notifications` - Get user notifications

## 🚀 Deployment

### Vercel (Recommended)
1. Connect your GitHub repository to Vercel
2. Add environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

### Manual Deployment
```bash
npm run build
npm run start
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Documentation**: Check the [EMAIL_SETUP.md](./EMAIL_SETUP.md) for email configuration
- **Issues**: Report bugs and feature requests via GitHub Issues
- **Discussions**: Use GitHub Discussions for questions and ideas

## 🙏 Acknowledgments

- Next.js team for the amazing framework
- Prisma team for the excellent ORM
- Tailwind CSS for the utility-first CSS framework
- All AI providers for their APIs

## 📊 Project Status

- ✅ Core functionality implemented
- ✅ Email notifications working
- ✅ User authentication complete
- ✅ AI integration functional
- ✅ Database schema optimized
- 🔄 Continuous improvements

---

**Made with ❤️ for discount hunters everywhere**

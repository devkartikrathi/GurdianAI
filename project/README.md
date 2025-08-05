# Guardian AI - Trading Psychology & Risk Management Platform

Guardian AI is a comprehensive trading psychology and risk management platform designed to help traders overcome emotional biases and develop disciplined trading habits. The platform combines advanced behavioral analysis, real-time risk monitoring, and personalized insights to create a "second self" that watches over trading decisions.

## 🚀 Features

- **Real-Time Risk Management**: Instant warnings and position size recommendations based on personal risk profile
- **Behavioral Pattern Recognition**: Advanced analytics that identify emotional trading zones and psychological biases
- **Smart CSV Upload**: Automatic format detection and column mapping for trade data
- **Personalized Insights**: AI-powered coaching that learns individual trading patterns
- **Professional Dashboard**: Trading desk interface optimized for trading sessions

## 🛠 Tech Stack

- **Frontend**: Next.js 14 App Router with TypeScript
- **Backend**: Next.js API Routes with Supabase PostgreSQL
- **Authentication**: Clerk
- **AI Engine**: Google Gemini API
- **Database**: Supabase with Row Level Security (RLS)
- **Styling**: Tailwind CSS with shadcn/ui components
- **Real-time**: Supabase Realtime subscriptions

## 📋 Prerequisites

- Node.js 18+ 
- npm or yarn
- Supabase account
- Clerk account
- Google Gemini API key

## 🚀 Quick Start

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd guardian-ai
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env.local` file in the root directory:
   ```env
   # Supabase
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   
   # Clerk Authentication
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
   CLERK_SECRET_KEY=your_clerk_secret_key
   
   # Google Gemini API
   GOOGLE_GEMINI_API_KEY=your_gemini_api_key
   ```

4. **Set up Supabase Database**
   ```bash
   # Run the database migrations
   npx supabase db push
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 📁 Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   │   ├── trades/        # Trade processing endpoints
│   │   └── auth/          # Authentication endpoints
│   ├── dashboard/         # Dashboard pages
│   ├── sign-in/          # Authentication pages
│   ├── sign-up/          # Authentication pages
│   ├── layout.tsx        # Root layout
│   └── page.tsx          # Landing page
├── components/            # React components
│   ├── ui/               # shadcn/ui components
│   └── dashboard/        # Dashboard-specific components
├── lib/                  # Utility functions
│   ├── supabase.ts       # Supabase client
│   └── utils.ts          # General utilities
└── types/                # TypeScript type definitions
```

## 🗄 Database Schema

The application uses a comprehensive PostgreSQL schema with the following key tables:

- **users**: User profiles and risk settings
- **raw_trades**: Uploaded trade data
- **matched_trades**: Processed BUY/SELL pairs with P&L
- **risk_sessions**: Real-time risk monitoring
- **guardian_ai_insights**: Behavioral analysis results

## 🔐 Security

- **Row Level Security (RLS)**: Users can only access their own data
- **Authentication**: Clerk-based secure authentication
- **Data Encryption**: All sensitive data encrypted at rest and in transit
- **API Protection**: Rate limiting and input validation

## 🚀 Deployment

### Vercel (Recommended)

1. **Connect your repository to Vercel**
2. **Set environment variables** in Vercel dashboard
3. **Deploy**: Vercel will automatically build and deploy

### Manual Deployment

1. **Build the application**
   ```bash
   npm run build
   ```

2. **Start the production server**
   ```bash
   npm start
   ```

## 📊 API Endpoints

### Trade Management
- `POST /api/trades/upload` - Upload CSV trade data
- `GET /api/trades/history` - Get trade history
- `POST /api/trades/schema-detect` - Auto-detect CSV schema

### Authentication
- `POST /api/auth/profile` - User profile management
- `POST /api/auth/session` - Session management

### Guardian AI
- `GET /api/guardian/risk-status` - Real-time risk assessment
- `GET /api/guardian/insights` - Behavioral insights

## 🧪 Testing

```bash
# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Run type checking
npm run type-check
```

## 📝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🤝 Support

For support, email support@guardianai.com or join our Discord community.

## 🗺 Roadmap

- [ ] Mobile app (iOS/Android)
- [ ] Advanced AI models for pattern prediction
- [ ] Social features and trader communities
- [ ] Broker API integrations
- [ ] Portfolio optimization tools

---

Built with ❤️ for the trading community 
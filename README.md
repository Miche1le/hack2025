# Hack2025 Frontend - News Aggregator

A modern Next.js 14 application for aggregating and summarizing news from RSS feeds with local AI-powered summarization.

## Features

- **RSS Feed Aggregation**: Collect news from multiple RSS sources
- **Local Summarization**: AI-powered article summarization with OpenAI integration and local fallback
- **Smart Deduplication**: Remove duplicate articles across feeds
- **Keyword Filtering**: Filter articles by keywords in title or content
- **Real-time Updates**: Auto-refresh feeds at configurable intervals
- **Responsive Design**: Modern UI built with Tailwind CSS
- **Error Handling**: Graceful handling of failed feeds with warnings

## Tech Stack

- **Framework**: Next.js 14 with App Router
- **Styling**: Tailwind CSS
- **TypeScript**: Full type safety
- **RSS Parsing**: rss-parser library
- **AI Summarization**: OpenAI API with local fallback
- **State Management**: React hooks and local state

## Getting Started

### Prerequisites

- Node.js 20+
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd hack2025-frontend
```

2. Install dependencies:
```bash
npm install
# or
yarn install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
```

Edit `.env.local` and add your OpenAI API key (optional):
```
OPENAI_API_KEY=your_openai_api_key_here
OPENAI_MODEL=gpt-4o-mini
SUMMARY_CACHE_TTL_MS=1800000
```

4. Run the development server:
```bash
npm run dev
# or
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage

1. **Add RSS Feeds**: Paste RSS feed URLs in the textarea (one per line)
2. **Set Keywords**: Add comma-separated keywords to filter articles
3. **Configure Refresh**: Set auto-refresh interval in minutes
4. **View Articles**: Browse summarized articles with source attribution

## Local Summarization

The app includes a sophisticated local summarization system:

- **OpenAI Integration**: Uses GPT-4o-mini for high-quality summaries
- **Local Fallback**: Extractive summarization when API is unavailable
- **Caching**: In-memory cache to reduce API calls
- **Configurable**: Adjustable cache TTL and character limits

## Project Structure

```
src/
├── app/                 # Next.js App Router pages
├── components/          # React components
├── lib/                 # Utility functions and services
│   ├── summarizer.ts    # AI summarization logic
│   ├── feed-utils.ts    # Feed processing utilities
│   └── rss-parser.ts    # RSS parsing service
└── types/               # TypeScript type definitions
```

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint issues
- `npm run type-check` - Run TypeScript type checking

### Code Quality

- ESLint configuration for code quality
- TypeScript for type safety
- Prettier for code formatting
- Tailwind CSS for consistent styling

## Deployment

The application is ready for deployment on:

- **Vercel** (recommended for Next.js)
- **Netlify**
- **Railway**
- **Docker** containers

### Vercel Deployment

1. Connect your GitHub repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.

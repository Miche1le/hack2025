# Environment Variables for Production Deployment

## Required Variables (Optional - with fallbacks)

### OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key_here
OPENAI_MODEL=gpt-4o-mini

### Cache Configuration  
SUMMARY_CACHE_TTL_MS=1800000

### Next.js Configuration
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app

## Instructions for Vercel:

1. Go to your Vercel project dashboard
2. Navigate to Settings > Environment Variables
3. Add each variable with appropriate values
4. For OPENAI_API_KEY: Get your key from https://platform.openai.com/api-keys
5. For NEXT_PUBLIC_APP_URL: Use your actual Vercel domain

## Instructions for Netlify:

1. Go to Site settings > Environment variables
2. Add each variable with appropriate values
3. Redeploy the site after adding variables

## Instructions for Railway:

1. Go to your project dashboard
2. Navigate to Variables tab
3. Add each variable with appropriate values
4. The app will automatically redeploy

## Local Development:

Create a `.env.local` file in the project root with these variables for local testing.

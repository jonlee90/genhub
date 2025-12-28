# SerpAPI Home Depot Integration Setup Guide

## Quick Start

Get your materials module connected to real Home Depot product data in under 5 minutes.

## Step 1: Get Your API Key

1. Visit https://serpapi.com/
2. Click "Sign Up" and create a free account
3. Verify your email address
4. Navigate to your dashboard: https://serpapi.com/manage-api-key
5. Copy your API key (it looks like: `abc123def456...`)

## Step 2: Configure Your Environment

1. Open `.env.local` in your project root
2. Find the SerpAPI section (or add it if not present):

```bash
#serpapi env - Home Depot Product Search API
# Get your API key from: https://serpapi.com/
# Sign up for a free account to get 100 searches/month
SERPAPI_API_KEY=paste_your_key_here
```

3. Replace `paste_your_key_here` with your actual API key
4. Save the file

## Step 3: Restart Your Development Server

```bash
# Stop your server (Ctrl+C)
# Restart it
npm run dev
```

## Step 4: Test the Integration

1. Navigate to `/app/materials` in your browser
2. Try searching for products:
   - "2x4 lumber"
   - "concrete mix"
   - "drywall screws"
   - "paint primer"

3. You should see real Home Depot products with live pricing!

## Verification

Check your browser console:
- **With API key**: You'll see `Fetching from SerpAPI: {query}`
- **Without API key**: You'll see `SERPAPI_API_KEY not configured, using mock data`

## Free Tier Limits

The free SerpAPI account includes:
- **100 searches per month**
- Full access to Home Depot product data
- No credit card required

Each search query counts as 1 API call. The system caches results for 30 minutes to reduce API usage.

## Upgrading Your Plan

Need more than 100 searches per month?

Visit https://serpapi.com/pricing to view paid plans:
- **Starter**: $50/month - 5,000 searches
- **Professional**: $150/month - 15,000 searches
- **Business**: $300/month - 30,000 searches

## Fallback Mode

The system works even without an API key:

- **No API Key**: Uses 12 sample products across all categories
- **API Failure**: Automatically falls back to sample products
- **Rate Limit**: Falls back to sample products when limit exceeded

Your app will never break, it just uses sample data instead of live data.

## Troubleshooting

### "No results found" when searching

1. Check that your API key is correctly configured
2. Verify the key is valid at https://serpapi.com/playground?engine=home_depot
3. Try a more general search term (e.g., "lumber" instead of "premium whitewood stud")
4. Check browser console for error messages

### "API rate limit exceeded"

You've used all 100 searches for the month. Options:
1. Wait until next month for reset
2. Upgrade to a paid plan
3. Use sample data (system automatically falls back)

### Products showing but prices seem outdated

The system caches results for 30 minutes. To get fresh data:
1. Wait 30 minutes, or
2. Restart your development server to clear the cache

### API key not working

1. Make sure you copied the entire key (no spaces or line breaks)
2. Check that `.env.local` is in the project root directory
3. Verify the environment variable name is exactly `SERPAPI_API_KEY`
4. Restart your dev server after adding the key

## Security Best Practices

1. **Never commit API keys to Git**
   - `.env.local` is already in `.gitignore`
   - Don't add the key to `.env.example` or other committed files

2. **Keep your key private**
   - Don't share screenshots with visible API keys
   - Don't post keys in public forums or Discord

3. **Monitor usage**
   - Check your SerpAPI dashboard regularly
   - Set up usage alerts if available

## Advanced Configuration

### Custom Cache Duration

Edit `lib/services/home-depot-api.ts`:

```typescript
const CACHE_TTL = 1000 * 60 * 30; // 30 minutes (default)
// Change to 1 hour:
const CACHE_TTL = 1000 * 60 * 60;
```

### Disable Caching

Set cache TTL to 0:

```typescript
const CACHE_TTL = 0; // No caching
```

### Force Mock Data (for testing)

Comment out your API key in `.env.local`:

```bash
# SERPAPI_API_KEY=your_key_here
```

## Support

- **SerpAPI Issues**: support@serpapi.com
- **Integration Issues**: Check project documentation
- **Feature Requests**: Submit to project repository

## Next Steps

Once you have the integration working:

1. Test the product comparison feature
2. Try assigning materials to tasks
3. Test the procurement workflow
4. Explore the materials dashboard

Enjoy real-time Home Depot product data in your materials management system!

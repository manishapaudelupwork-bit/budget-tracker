# Google AdSense Setup Guide

## Step 1: Apply for Google AdSense

1. Go to https://www.google.com/adsense/start/
2. Sign in with your Google account
3. Enter your website URL (your Netlify URL once deployed)
4. Fill out the form with your information
5. Google will review your site (takes 24-48 hours)
6. Once approved, you'll get your **Publisher ID** (ca-pub-xxxxxxxxxxxxxxxx)

## Step 2: Get Your Publisher ID

After approval:
1. Go to https://adsense.google.com
2. Click "Settings" → "Account"
3. Copy your **Publisher ID** (looks like: ca-pub-1234567890123456)

## Step 3: Update Your App

Replace `ca-pub-xxxxxxxxxxxxxxxx` in these files with your actual Publisher ID:

### In `public/app.html`:
- Line 11: Update the AdSense script tag
- Line 71: Update the ad slot data-ad-client

### Generate Ad Slots:
1. In AdSense dashboard, go to "Ads" → "Ad units"
2. Create new ad units
3. Copy the ad slot IDs
4. Replace `1234567890` with your actual slot IDs

## Step 4: Deployment

1. Deploy to Netlify with your Publisher ID
2. Wait 24-48 hours for ads to start showing
3. Monitor earnings in AdSense dashboard

## Important Notes

- ⚠️ Do NOT click your own ads (violates AdSense policy)
- ⚠️ Do NOT encourage users to click ads
- ⚠️ Minimum traffic required for approval (usually 10,000+ monthly users)
- ✅ Ads will show after your site gets enough traffic
- ✅ You earn money from impressions and clicks

## Earnings

- Average: $0.25 - $4 per 1000 impressions (CPM)
- Depends on: Traffic location, content type, user engagement
- Payments: Monthly via AdSense (minimum $100 to cash out)

## Alternative Ad Networks

If AdSense is too slow, try:
- **Mediavine**: Higher CPM but requires 25,000+ monthly users
- **AdThrive**: Similar to Mediavine
- **Propeller Ads**: Lower barrier to entry
- **Infolinks**: Contextual ads

---

**Next Steps:**
1. Deploy app to Netlify
2. Apply for Google AdSense
3. Wait for approval
4. Update Publisher ID in code
5. Redeploy
6. Start earning!

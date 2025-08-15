# Social Authentication Setup Guide

This guide will help you set up Google and Apple OAuth providers for your DiscountNotifier app.

## Current Status

**⚠️ Social login is currently disabled** because the required environment variables are not configured.

## Quick Fix

To enable social login, you need to add the following environment variables to your `.env` file:

```bash
# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here

# Apple OAuth  
APPLE_ID=your_apple_client_id_here
APPLE_SECRET=your_apple_client_secret_here
```

## Setup Instructions

### 1. Google OAuth Setup

1. **Go to Google Cloud Console**
   - Visit: https://console.cloud.google.com/
   - Create a new project or select an existing one

2. **Enable Google+ API**
   - Go to "APIs & Services" > "Library"
   - Search for "Google+ API" and enable it

3. **Create OAuth 2.0 Credentials**
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "OAuth 2.0 Client IDs"
   - Choose "Web application"
   - Add authorized redirect URIs:
     - `http://localhost:3000/api/auth/callback/google` (for development)
     - `https://yourdomain.com/api/auth/callback/google` (for production)

4. **Copy Credentials**
   - Copy the Client ID and Client Secret
   - Add them to your `.env` file

### 2. Apple OAuth Setup

1. **Go to Apple Developer Console**
   - Visit: https://developer.apple.com/
   - Sign in with your Apple Developer account

2. **Create App ID**
   - Go to "Certificates, Identifiers & Profiles"
   - Click "Identifiers" > "+" > "App IDs"
   - Choose "App" and fill in the details
   - Enable "Sign In with Apple"

3. **Create Service ID**
   - Go to "Identifiers" > "+" > "Services IDs"
   - Choose "Services IDs" and fill in the details
   - Enable "Sign In with Apple"
   - Add your domain to "Domains and Subdomains"
   - Add redirect URLs:
     - `http://localhost:3000/api/auth/callback/apple` (for development)
     - `https://yourdomain.com/api/auth/callback/apple` (for production)

4. **Create Private Key**
   - Go to "Keys" > "+"
   - Choose "Sign In with Apple"
   - Download the key file (.p8)
   - Note the Key ID

5. **Generate Client Secret**
   - Use the Apple key generator or a library to create the client secret
   - You'll need: Team ID, Key ID, and the .p8 key file

6. **Add to Environment Variables**
   ```bash
   APPLE_ID=your_service_id_here
   APPLE_SECRET=your_generated_client_secret_here
   ```

## Testing

After setting up the environment variables:

1. **Restart your development server**
   ```bash
   npm run dev
   ```

2. **Check the sign-in page**
   - Go to `http://localhost:3000/auth/signin`
   - You should see the Google and Apple buttons
   - Click them to test the OAuth flow

## Troubleshooting

### Common Issues

1. **"client_id is required" error**
   - Make sure environment variables are set correctly
   - Restart the development server after adding them

2. **Redirect URI mismatch**
   - Ensure the redirect URIs in your OAuth provider match exactly
   - Check for trailing slashes or protocol mismatches

3. **Apple OAuth not working**
   - Apple OAuth requires HTTPS in production
   - Make sure your Service ID is configured correctly
   - Verify the client secret is generated properly

### Development vs Production

- **Development**: Use `http://localhost:3000` for redirect URIs
- **Production**: Use `https://yourdomain.com` for redirect URIs
- **Apple OAuth**: Requires HTTPS in production

## Security Notes

- Never commit your `.env` file to version control
- Keep your client secrets secure
- Use different OAuth apps for development and production
- Regularly rotate your client secrets

## Need Help?

If you're still having issues:

1. Check the browser console for errors
2. Check the server logs for OAuth errors
3. Verify your environment variables are loaded correctly
4. Test with a simple OAuth flow first

## Alternative: Email/Password Only

If you prefer to use only email/password authentication:

1. The app will work fine without social providers
2. Users can still sign up and sign in with email/password
3. The social login buttons will be hidden automatically 
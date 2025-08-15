# Email Notification Setup Guide

This guide will help you set up email notifications for the DiscountNotifier application. The system supports multiple email providers and will automatically send notifications to subscribers when new discounts are found in their preferred categories.

## Features

- **Welcome Emails**: Sent to new users upon registration
- **Discount Notifications**: Sent when new discounts are found in user's favorite categories
- **Personalized Content**: Emails include discount details, store information, and personalized links
- **Multiple Email Providers**: Support for Gmail, SendGrid, and Resend
- **In-App Notifications**: Creates in-app notifications alongside email notifications

## Email Provider Setup

### Option 1: Gmail (Recommended for Development)

1. **Enable 2-Factor Authentication** on your Gmail account
2. **Generate an App Password**:
   - Go to Google Account settings
   - Navigate to Security → 2-Step Verification → App passwords
   - Generate a new app password for "Mail"
3. **Add to Environment Variables**:
   ```env
   GMAIL_USER=your-email@gmail.com
   GMAIL_PASS=your-app-password
   EMAIL_FROM=your-email@gmail.com
   ```

### Option 2: SendGrid (Recommended for Production)

1. **Create a SendGrid Account** at [sendgrid.com](https://sendgrid.com)
2. **Verify Your Sender Domain** or use Single Sender Verification
3. **Generate an API Key**:
   - Go to Settings → API Keys
   - Create a new API Key with "Mail Send" permissions
4. **Add to Environment Variables**:
   ```env
   SENDGRID_API_KEY=your-sendgrid-api-key
   EMAIL_FROM=your-verified-email@yourdomain.com
   ```

### Option 3: Resend

1. **Create a Resend Account** at [resend.com](https://resend.com)
2. **Verify Your Domain** or use the sandbox domain
3. **Generate an API Key**:
   - Go to API Keys section
   - Create a new API Key
4. **Add to Environment Variables**:
   ```env
   RESEND_API_KEY=your-resend-api-key
   EMAIL_FROM=your-verified-email@yourdomain.com
   ```

## Environment Variables

Add these variables to your `.env.local` file:

```env
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
```

## How It Works

### 1. User Registration
- When a user signs up, they receive a welcome email
- Default preferences are created with email notifications enabled

### 2. User Preferences
- Users can manage their preferences at `/profile/preferences`
- They can select favorite categories and enable/disable email notifications
- Notification frequency can be set to instant, daily, or weekly

### 3. Discount Discovery
- When new discounts are fetched via AI APIs (OpenRouter, Gemini, Claude)
- The system checks if any users have the category in their favorites
- Email notifications are sent to users with email notifications enabled

### 4. Email Content
- Personalized greeting with user's name
- List of new discounts with details (title, description, percentage, coupon, end date)
- Store information for each discount
- Links to manage preferences and visit the application

## Testing Email Notifications

### 1. Test Welcome Email
1. Sign up a new user account
2. Check the user's email for the welcome message

### 2. Test Discount Notifications
1. Go to `/profile/preferences`
2. Add some categories to your favorites
3. Trigger a discount fetch for one of those categories:
   ```bash
   curl -X POST http://localhost:3000/api/openrouter/fetch-discounts \
     -H "Content-Type: application/json" \
     -d '{"categoryId": 1}'
   ```
4. Check your email for the discount notification

### 3. Test Email Configuration
You can test your email configuration by checking the console logs when discounts are created. Look for:
- "Email sent successfully to [email]"
- "Email notification summary: X sent, Y failed"

## Troubleshooting

### Common Issues

1. **Emails not sending**:
   - Check your email provider credentials
   - Verify your sender email is properly configured
   - Check console logs for error messages

2. **Gmail authentication errors**:
   - Ensure 2FA is enabled
   - Use app password, not your regular password
   - Check if "Less secure app access" is disabled

3. **SendGrid errors**:
   - Verify your sender domain or email
   - Check API key permissions
   - Ensure you're not in sandbox mode (if using free tier)

4. **No notifications being sent**:
   - Check if users have email notifications enabled
   - Verify users have favorite categories selected
   - Check if new discounts are actually being created (not just updated)

### Debug Mode

To enable detailed logging, add this to your environment:
```env
DEBUG_EMAIL=true
```

This will log detailed information about email sending attempts.

## Email Templates

The system uses HTML email templates located in `src/lib/email.ts`:

- **Welcome Email**: Introduces the service and provides getting started tips
- **Discount Notification**: Lists new discounts with store information and action buttons

### Customizing Templates

To customize email templates:

1. Edit the template functions in `src/lib/email.ts`
2. Modify the HTML structure and styling
3. Update the content to match your branding

## Security Considerations

1. **Environment Variables**: Never commit email credentials to version control
2. **Rate Limiting**: Consider implementing rate limiting for email sending
3. **Unsubscribe**: Include unsubscribe links in emails (future enhancement)
4. **Data Privacy**: Ensure compliance with email marketing regulations

## Future Enhancements

- [ ] Email digest functionality (daily/weekly summaries)
- [ ] Unsubscribe mechanism
- [ ] Email templates with dynamic content
- [ ] A/B testing for email content
- [ ] Email analytics and tracking
- [ ] SMS notifications as an alternative

## Support

If you encounter issues with email setup:

1. Check the console logs for error messages
2. Verify your email provider configuration
3. Test with a simple email first
4. Check your email provider's documentation for troubleshooting

For additional help, refer to the email provider's documentation:
- [Gmail SMTP](https://support.google.com/mail/answer/7126229)
- [SendGrid API](https://sendgrid.com/docs/API_Reference/index.html)
- [Resend API](https://resend.com/docs/api-reference)

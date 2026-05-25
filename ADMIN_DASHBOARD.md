# Admin Dashboard Guide

## Overview

The Admin Dashboard provides comprehensive management capabilities for the DiscountNotifier application. It allows administrators to configure AI providers, manage categories, monitor statistics, and manage user accounts.

## Access

### Initial Setup
1. Run the admin initialization script:
   ```bash
   npm run init:admin
   ```

2. Default admin credentials:
   - **Email**: admin@discountnotifier.com
   - **Password**: admin123

3. Access the dashboard at: `/admin`

### Custom Admin Setup
You can customize the admin credentials by setting environment variables:
```bash
ADMIN_EMAIL=your-admin@email.com
ADMIN_PASSWORD=your-secure-password
```

## Dashboard Sections

### 1. Overview Dashboard (`/admin`)

**Key Metrics:**
- Total Users, Stores, Discounts, Categories
- Active API Providers
- Today's User Access, Token Usage, Fetch Operations

**Quick Actions:**
- API Configuration
- Categories Management
- Statistics & Analytics
- Users Management

### 2. API Configuration (`/admin/api-config`)

**Manage AI Provider Settings:**
- **OpenRouter**: Configure API key, model name, tokens, temperature
- **Gemini**: Google's AI model settings
- **Claude**: Anthropic's AI model settings

**Configuration Options:**
- **API Key**: Secure storage of provider API keys
- **Model Name**: Specific AI model to use (e.g., "perplexity/sonar-medium-online")
- **Max Tokens**: Response length limit (1-8000)
- **Temperature**: Randomness control (0-2, lower = more deterministic)
- **Priority**: Provider preference order (1 = highest)
- **Enabled/Disabled**: Toggle providers on/off

**Recommended Models:**
- **OpenRouter**: `perplexity/sonar-medium-online`, `anthropic/claude-3-5-sonnet`
- **Gemini**: `gemini-1.5-pro`, `gemini-1.5-flash`
- **Claude**: `claude-3-5-sonnet-20241022`, `claude-3-haiku-20240307`

### 3. Categories Management (`/admin/categories`)

**Configure Smart Fetching:**
- **Refresh Period**: Days between data updates (1-30 days)
- **Last Fetched**: When category was last updated
- **Status**: Success/Failed/Partial fetch results
- **Stores/Discounts**: Count of items found

**Recommended Refresh Periods:**
- **High-Value Categories** (Electronics, Fashion): 1-3 days
- **Medium-Value Categories** (Food, Services): 3-7 days
- **Low-Value Categories** (Books, Home): 7-14 days

### 4. Statistics & Analytics (`/admin/statistics`)

**AI Performance Metrics:**
- Response time averages
- Success rates
- Data quality scores
- Total request counts

**User Access Statistics:**
- Daily user activity
- Access patterns
- User engagement metrics

**Token Usage Tracking:**
- Daily token consumption
- Cost tracking per provider
- Usage trends

**Fetch Performance:**
- Category-specific performance
- Provider comparison
- Success/failure rates
- Data quality metrics

**Time Ranges:**
- Last 7 days
- Last 30 days
- Last 90 days

### 5. Users Management (`/admin/users`)

**User Account Management:**
- View all user accounts
- Change user roles (User/Admin)
- Monitor user activity
- Track access patterns

**User Information:**
- Email and name
- Location (suburb)
- Account creation date
- Last login time
- Total access count

**Role Management:**
- **User**: Standard application access
- **Admin**: Full dashboard access
- Security: Admins cannot remove their own admin privileges

## Database Schema

### New Tables Added

#### `ApiConfiguration`
```sql
- id: Primary key
- provider: AI provider name (openrouter, gemini, claude)
- isEnabled: Boolean flag
- apiKey: Encrypted API key
- modelName: AI model identifier
- maxTokens: Token limit
- temperature: Randomness parameter
- priority: Provider preference order
```

#### `UserAccessLog`
```sql
- id: Primary key
- userId: User reference
- categoryId: Category reference (optional)
- action: Access action type
- ipAddress: User IP
- userAgent: Browser info
- createdAt: Timestamp
```

#### `TokenUsageLog`
```sql
- id: Primary key
- provider: AI provider name
- categoryId: Category reference (optional)
- tokensUsed: Token count
- cost: Monetary cost
- status: Success/Failed/Rate limited
- errorMessage: Error details
- createdAt: Timestamp
```

#### `AiPerformanceLog`
```sql
- id: Primary key
- provider: AI provider name
- categoryId: Category reference (optional)
- responseTime: Response time in milliseconds
- successRate: Success percentage
- dataQuality: Quality score
- storesFound: Store count
- discountsFound: Discount count
- createdAt: Timestamp
```

## Security Features

### Authentication & Authorization
- Admin-only access to dashboard
- Role-based permissions
- Session validation
- API key encryption

### Data Protection
- Secure API key storage
- User data privacy
- Access logging
- Audit trails

### Admin Safeguards
- Cannot remove own admin privileges
- Confirmation for critical actions
- Input validation
- Error handling

## API Endpoints

### Admin Authentication
- `GET /api/admin/check` - Verify admin status

### Dashboard Statistics
- `GET /api/admin/stats` - Overview metrics
- `GET /api/admin/statistics` - Detailed analytics

### API Configuration
- `GET /api/admin/api-config` - List configurations
- `PUT /api/admin/api-config` - Update configuration
- `POST /api/admin/api-config` - Create configuration

### Categories Management
- `GET /api/admin/categories` - List categories with logs
- `PUT /api/admin/categories/refresh-period` - Update refresh period

### Users Management
- `GET /api/admin/users` - List users with stats
- `PUT /api/admin/users/role` - Update user role

## Monitoring & Maintenance

### Regular Tasks
1. **Monitor API Usage**: Check token consumption and costs
2. **Review Performance**: Analyze AI provider performance
3. **Update Configurations**: Adjust settings based on usage patterns
4. **User Management**: Monitor user activity and manage roles

### Performance Optimization
1. **Refresh Periods**: Optimize based on category importance
2. **Provider Priority**: Adjust based on performance and cost
3. **Model Selection**: Choose optimal models for each provider
4. **Rate Limiting**: Monitor and adjust API limits

### Troubleshooting
1. **API Failures**: Check provider status and API keys
2. **Performance Issues**: Review response times and success rates
3. **User Issues**: Monitor access logs and user feedback
4. **Data Quality**: Analyze fetch results and validation

## Best Practices

### Configuration Management
- Use environment variables for sensitive data
- Regularly rotate API keys
- Monitor API quotas and limits
- Test configurations before deployment

### User Management
- Grant admin privileges sparingly
- Monitor user activity regularly
- Maintain audit logs
- Implement proper access controls

### Performance Monitoring
- Set up alerts for critical metrics
- Monitor cost trends
- Track user engagement
- Analyze performance patterns

### Security
- Use strong passwords
- Enable two-factor authentication
- Regular security audits
- Keep dependencies updated

## Support

For technical support or questions about the admin dashboard:
1. Check the application logs
2. Review the database schema
3. Monitor API provider status
4. Contact the development team

## Updates

The admin dashboard is regularly updated with new features and improvements. Check the changelog for the latest updates and new functionality.








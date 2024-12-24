# Medusa Restock Notification Plugin

A plugin for Medusa e-commerce that adds restock notification functionality using SendGrid.

## Features

- Allow customers to subscribe to out-of-stock products
- Automatically notify customers when products are back in stock
- Manage subscriptions through admin API
- SendGrid integration for reliable email delivery

## Installation

```bash
npm install medusa-plugin-restock-notification @sendgrid/mail @sendgrid/client
```

## Configuration

Add to your `medusa-config.js`:

```javascript
const plugins = [
  // ... other plugins
  {
    resolve: `medusa-plugin-restock-notification`,
    options: {
      sendgrid_api_key: process.env.SENDGRID_API_KEY,
      sendgrid_from: process.env.SENDGRID_FROM,
      sendgrid_template_id: process.env.SENDGRID_RESTOCK_TEMPLATE_ID,
      store_name: process.env.STORE_NAME
    }
  }
]
```

Required environment variables:
```bash
SENDGRID_API_KEY=your_api_key
SENDGRID_FROM=your@email.com
SENDGRID_RESTOCK_TEMPLATE_ID=your_template_id
STORE_NAME="Your Store"
```

## API Routes

### Store API

```bash
# Subscribe to restock notifications
POST /store/restock-notifications
{
  "email": "customer@example.com",
  "variant_id": "variant_123"
}

# Get user's subscriptions
GET /store/restock-notifications?email=customer@example.com

# Unsubscribe
DELETE /store/restock-notifications/{subscription_id}
{
  "email": "customer@example.com"
}
```

### Admin API

```bash
# Get all subscriptions
GET /admin/restock-notifications

# Get subscribers for variant
GET /admin/restock-notifications?variant_id=variant_123

# Force send notifications
POST /admin/restock-notifications
{
  "variant_id": "variant_123"
}
```

## SendGrid Template Variables

Available template variables:
- `product_title`
- `variant_title`
- `current_stock`
- `store_name`

## Development

```bash
# Clone the repository
git clone your-repo-url
cd medusa-restock-notification

# Install dependencies
npm install

# Build
npm run build

# Run migrations
npx medusa migrations run

# Watch mode
npx medusa develop
```

## License

MIT
# Medusa Restock Notification Plugin

A plugin for Medusa e-commerce that adds restock notification functionality using SendGrid.

## Features

- Allow customers to subscribe to out-of-stock products
- Automatically notify customers when products are back in stock
- Manage subscriptions through admin API
- SendGrid integration for reliable email delivery

## Installation

```bash
npm install @intuio/medusa-restock-notification@medusa-v1
```

## Configuration

Add to your `medusa-config.js`:

```javascript
const plugins = [
  // ... other plugins
  {
    resolve: `@intuio/medusa-restock-notification`,
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

## 💬 Let's Connect
We’re building this in public at Intuio Software Labs — a premium product studio focused on ecommerce and open-source innovation.
☕ Like the plugin? Buy us a coffee or support our efforts : [Donate here](https://buymeacoffee.com/intuio)

### 👥 Collaborate With Us
We’re looking for contributors, collaborators, and ecommerce founders to partner with. If you’re doing something cool with Medusa or want to build the next big thing, reach out!

📩 info@intuio.io / sales@intuio.io

🌐 https://intuio.io

## 🤝 Contributing
Pull requests are welcome! For major changes, please open an issue first to discuss what you would like to change.

Check out the contributing guide to get started.

## 📜 License
MIT © Intuio Software Labs

## 📈 Loved By the Community?
If you’ve used this plugin and found it helpful, leave us a ⭐ on GitHub and share it with others using Medusa.

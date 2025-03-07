# Temi OS

A Next.js application for managing merchant operations with Stripe integration, authentication, and knowledge base management.

## Prerequisites

Before you begin, ensure you have the following installed on your machine:

1. [Node.js](https://nodejs.org/) (version 18 or higher)
2. [PostgreSQL](https://www.postgresql.org/download/) (version 14 or higher)
3. [Git](https://git-scm.com/downloads)

## Getting Started

### 1. Clone the Repository

```bash
git clone <your-repository-url>
cd temi-os
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Set Up Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
# Database
DATABASE_URL="postgresql://your_username@localhost:5432/temi_os_db?schema=public"

# Authentication (Google OAuth)
AUTH_GOOGLE_ID=your_google_client_id
AUTH_GOOGLE_SECRET=your_google_client_secret
AUTH_SECRET=your_auth_secret

# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret

# Base URL
NEXT_PUBLIC_BASE_URL="http://localhost:3000"

# ElevenLabs (for voice features)
ELEVENLABS_API_KEY=your_elevenlabs_api_key

# Ngrok (for webhook testing)
NEXT_PUBLIC_NGROK_AUTHTOKEN=your_ngrok_auth_token
```

### 4. Set Up the Database

1. Create a PostgreSQL database:
```bash
createdb temi_os_db
```

2. Run Prisma migrations:
```bash
npx prisma migrate dev
```

3. Generate Prisma Client:
```bash
npx prisma generate
```

### 5. Run the Development Server

```bash
npm run dev
```

The application will be available at `http://localhost:3000`

## Project Structure

- `/app` - Next.js app directory containing pages and API routes
- `/components` - Reusable React components
- `/lib` - Utility functions and shared code
- `/prisma` - Database schema and migrations
- `/public` - Static assets
- `/styles` - Global styles and Tailwind CSS configuration

## Key Features

- Google Authentication
- Stripe Integration for payments
- Merchant Management
- Terminal Management
- Product Management
- Knowledge Base System
- Location Management
- Worker Management
- Voice Integration with ElevenLabs

## Available Scripts

- `npm run dev` - Start the development server
- `npm run build` - Build the production application
- `npm run start` - Start the production server
- `npm run lint` - Run ESLint for code linting

## Troubleshooting

### Common Issues

1. **Database Connection Issues**
   - Ensure PostgreSQL is running
   - Verify your DATABASE_URL is correct
   - Check if the database exists

2. **Authentication Issues**
   - Verify Google OAuth credentials are correct
   - Ensure AUTH_SECRET is properly set

3. **Stripe Integration Issues**
   - Verify Stripe API keys are correct
   - Check webhook configuration

### Getting Help

If you encounter any issues:
1. Check the console for error messages
2. Review the project's issue tracker
3. Contact the project maintainers

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

# Prisma Commands

## `npm exec prisma generate`
- Generates the Prisma Client based on your schema
- Use this after any changes to your `schema.prisma` file
- Creates type-safe database queries for your application
- Must be run before your application can interact with the database

## `npm exec prisma migrate dev`
- Creates and applies a new migration based on your schema changes
- Updates your database schema
- Also generates Prisma Client
- Use during development when you want to:
  - Track schema changes in version control
  - Have proper migration history
  - Need rollback capability

## `npm exec prisma db push`
- Directly pushes schema changes to the database
- Doesn't create migration files
- Use during development when you:
  - Don't need to track schema changes
  - Want to quickly prototype and iterate
  - Don't need migration history


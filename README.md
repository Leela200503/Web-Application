# Reno Notice Board

A responsive notice board built with Next.js Pages Router, Prisma, and a hosted MySQL database. It supports full CRUD operations for notices, server-side validation, urgent-first ordering from the database, and confirmation before delete.

## Features
- Create, read, update, and delete notices
- Responsive card-based list view
- Server-side validation for required fields and valid dates
- Urgent notices sorted above normal notices in the database query
- Delete confirmation dialog

## Local development
1. Install dependencies
   ```bash
   npm install
   ```
2. Set up your environment variables
   ```bash
   cp .env.example .env.local
   ```
   Update the `DATABASE_URL` value to your hosted MySQL connection string.
3. Run Prisma migration
   ```bash
   npx prisma migrate dev --name init
   ```
4. Start the app
   ```bash
   npm run dev
   ```

## Deployment notes
- Deploy the app to Vercel.
- Add the `DATABASE_URL` environment variable in Vercel project settings.
- Ensure the database provider is MySQL-compatible and hosted.

## AI usage
- AI tools were used to scaffold the project structure, generate the CRUD UI, and help refine the server-side validation and styling.

## One thing to improve with more time
- Add image upload support with cloud storage instead of relying on external image URLs.

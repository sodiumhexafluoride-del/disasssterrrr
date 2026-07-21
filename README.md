# Disaster Management System

A React + Vite disaster-management dashboard with Vercel API routes and Firebase Firestore persistence.

## Deploy to GitHub

1. Create a new GitHub repository.
2. Upload all files in this project folder.
3. Do **not** upload `.env` files or Firebase service-account JSON files.

## Deploy to Vercel

1. Import the GitHub repository into Vercel.
2. Set the framework to **Vite** (or let Vercel detect it).
3. Build command: `npm run build`
4. Output directory: `dist`
5. Add these Environment Variables in Vercel:
   - `FIREBASE_PROJECT_ID`
   - `FIREBASE_CLIENT_EMAIL`
   - `FIREBASE_PRIVATE_KEY`

For `FIREBASE_PRIVATE_KEY`, paste the complete private key. If your platform stores newlines as `\\n`, the application converts them automatically.

## Firebase setup

Create a Firestore database in Firebase/Google Cloud and ensure the service account used by the environment variables has permission to read and write Firestore.

The application stores the active drill state in:

`drills/active_drill_state`

## Local development

```bash
npm install
npm run dev
```

The Vercel API routes are intended for deployment on Vercel. For the most accurate local API testing, use Vercel's local development tooling or deploy a preview.

## Important

The old always-on Express server was replaced for deployment compatibility. Vercel now serves the React frontend as static output and the backend through `/api/*` serverless routes.

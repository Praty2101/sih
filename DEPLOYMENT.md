# Vercel Deployment Guide for UNI-CHAIN

## Prerequisites

1. **Vercel Account**: Sign up at [vercel.com](https://vercel.com)
2. **GitHub Repository**: Push your code to GitHub
3. **PostgreSQL Database**: Set up a PostgreSQL database (e.g., using Vercel Postgres, Supabase, or Railway)

## Step 1: Prepare Your Database

1. Set up a PostgreSQL database
2. Get your connection string (DATABASE_URL)
3. Run migrations:
   ```bash
   cd backend
   npx prisma migrate deploy
   npx prisma generate
   ```

## Step 2: Deploy to Vercel

### Option A: Deploy via Vercel Dashboard

1. **Import Project**:
   - Go to [vercel.com/dashboard](https://vercel.com/dashboard)
   - Click "Add New Project"
   - Import your GitHub repository

2. **Configure Project Settings**:
   - **Framework Preset**: Other
   - **Root Directory**: `/` (project root)
   - **Build Command**: `cd frontend && npm run build`
   - **Output Directory**: `frontend/dist`
   - **Install Command**: `cd frontend && npm install && cd ../backend && npm install`

3. **Set Environment Variables**:
   Add these in Vercel project settings → Environment Variables:
   ```
   DATABASE_URL=your_postgresql_connection_string
   JWT_SECRET=your_jwt_secret_key_min_32_chars
   MASTER_KEY=your_master_encryption_key_32_chars
   ```

4. **Deploy**:
   - Click "Deploy"
   - Wait for build to complete

### Option B: Deploy via Vercel CLI

1. **Install Vercel CLI**:
   ```bash
   npm i -g vercel
   ```

2. **Login**:
   ```bash
   vercel login
   ```

3. **Deploy**:
   ```bash
   vercel
   ```

4. **Set Environment Variables**:
   ```bash
   vercel env add DATABASE_URL
   vercel env add JWT_SECRET
   vercel env add MASTER_KEY
   ```

5. **Deploy to Production**:
   ```bash
   vercel --prod
   ```

## Step 3: Post-Deployment Setup

1. **Run Database Migrations**:
   After deployment, you may need to run migrations. You can do this via:
   - Vercel CLI: `vercel env pull` then run migrations locally
   - Or use a database migration tool

2. **Seed Database** (Optional):
   ```bash
   cd backend
   npm run seed
   ```

## Step 4: Verify Deployment

1. **Check Health Endpoint**:
   Visit: `https://your-project.vercel.app/api/health`
   Should return: `{"status":"ok","timestamp":"..."}`

2. **Test Frontend**:
   Visit: `https://your-project.vercel.app`
   Should load the React application

3. **Test API**:
   Visit: `https://your-project.vercel.app/api/supplies`
   Should return supply data

## Project Structure for Vercel

```
sih/
├── api/
│   └── index.ts          # Vercel serverless function handler
├── backend/              # Backend source code
├── frontend/             # Frontend source code
├── vercel.json           # Vercel configuration
└── package.json          # Root package.json
```

## Important Notes

1. **API Routes**: All `/api/*` requests are handled by the serverless function in `api/index.ts`

2. **Frontend Routes**: All other routes serve the React app (handled by Vite build)

3. **Environment Variables**: Must be set in Vercel dashboard for production

4. **Database**: Ensure your PostgreSQL database allows connections from Vercel's IP addresses

5. **CORS**: The API handler includes CORS configuration. Update `origin: '*'` in `api/index.ts` to your frontend domain for production security.

## Troubleshooting

### Build Fails
- Check build logs in Vercel dashboard
- Ensure all dependencies are in `package.json`
- Verify Node.js version (Vercel uses Node 18+ by default)

### API Returns 500 Errors
- Check Vercel function logs
- Verify environment variables are set
- Ensure database is accessible from Vercel

### Frontend Can't Connect to API
- Verify API URL in `frontend/src/services/api.ts` uses relative paths in production
- Check CORS configuration in `api/index.ts`

## Custom Domain

1. Go to Vercel project settings → Domains
2. Add your custom domain
3. Follow DNS configuration instructions

## Continuous Deployment

Vercel automatically deploys on every push to your main branch. For other branches, it creates preview deployments.

## Support

For issues, check:
- Vercel documentation: https://vercel.com/docs
- Project README.md
- Vercel dashboard logs


# Quick Vercel Deployment Guide

## 🚀 Deploy in 3 Steps

### Step 1: Push to GitHub
```bash
git add .
git commit -m "Prepare for Vercel deployment"
git push origin main
```

### Step 2: Connect to Vercel

1. Go to [vercel.com](https://vercel.com) and sign in
2. Click **"Add New Project"**
3. Import your GitHub repository
4. Configure:
   - **Framework Preset**: Other
   - **Root Directory**: `/` (leave as default)
   - **Build Command**: `cd frontend && npm run build`
   - **Output Directory**: `frontend/dist`
   - **Install Command**: `cd frontend && npm install && cd ../backend && npm install`

### Step 3: Add Environment Variables

In Vercel project settings → Environment Variables, add:

```
DATABASE_URL=your_postgresql_connection_string
JWT_SECRET=your_jwt_secret_key_min_32_characters
MASTER_KEY=your_master_encryption_key_32_characters
```

**Click Deploy!** 🎉

## 📝 Post-Deployment

1. **Run Database Migrations**:
   ```bash
   cd backend
   npx prisma migrate deploy
   ```

2. **Seed Database** (optional):
   ```bash
   npm run seed
   ```

3. **Verify**:
   - Visit: `https://your-project.vercel.app`
   - Check API: `https://your-project.vercel.app/api/health`

## 🔧 Troubleshooting

- **Build fails?** Check Vercel logs in dashboard
- **API errors?** Verify environment variables are set
- **Database connection?** Ensure PostgreSQL allows Vercel IPs

## 📚 Full Documentation

See `DEPLOYMENT.md` for detailed instructions.


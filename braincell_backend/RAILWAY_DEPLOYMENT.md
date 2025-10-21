# Railway Deployment Guide for BrainCell Backend

## ✅ Pre-Deployment Checklist

### 1. Required Environment Variables in Railway

Set these in your Railway project dashboard:

```bash
# Database (Supabase PostgreSQL)
DATABASE_URL=postgresql+asyncpg://user:password@host:port/database

# Google AI API
GOOGLE_API_KEY=your_google_api_key_here
MODEL_PROVIDER=google
MODEL_ID=gemini-2.5-flash

# Optional: Environment flag
ENVIRONMENT=production
```

### 2. Files Already Configured ✅

- ✅ `Dockerfile` - Optimized for Railway with Debian Trixie packages
- ✅ `requirements.txt` - All dependencies including opencv-python-headless
- ✅ `.dockerignore` - Excludes unnecessary files from build
- ✅ `Procfile` - Railway start command configured
- ✅ Database setup - PostgreSQL/Supabase ready with asyncpg

## 🚀 Deployment Steps

### Step 1: Push to GitHub
```bash
git add .
git commit -m "fix: Railway deployment with correct Debian packages"
git push origin main
```

### Step 2: Connect to Railway
1. Go to [Railway Dashboard](https://railway.app)
2. Click "New Project" → "Deploy from GitHub repo"
3. Select your `BrainCell Syndicate` repository
4. Railway will auto-detect the Dockerfile

### Step 3: Configure Environment Variables
In Railway dashboard:
1. Go to your service → "Variables" tab
2. Add all required environment variables (see checklist above)
3. Click "Deploy" to trigger rebuild

### Step 4: Monitor Deployment
1. Click "Deployments" tab to see build logs
2. Wait for "Build successful" and "Deployed" status
3. Click the generated Railway URL to test: `https://your-app.railway.app/health`

## 🔍 Key Changes Made

### Dockerfile Fixes:
- ✅ Changed `libgl1-mesa-glx` → `libgl1` (Debian Trixie compatibility)
- ✅ Added comprehensive system dependencies for OpenCV and ML
- ✅ Optimized layer caching for faster builds
- ✅ Added health check endpoint
- ✅ Railway `$PORT` variable support

### Dependencies Fixed:
- ✅ `opencv-python` → `opencv-python-headless` (no GUI dependencies)
- ✅ Added `asyncpg` for PostgreSQL async support
- ✅ Added `sqlalchemy` for ORM
- ✅ All ML libraries (TensorFlow, PyTorch, Transformers) included

## 🐛 Troubleshooting

### Build Fails with Package Errors
**Error**: `Package 'libgl1-mesa-glx' has no installation candidate`
**Solution**: ✅ Already fixed! Dockerfile now uses `libgl1` for Debian Trixie

### Runtime Errors with cv2
**Error**: `ModuleNotFoundError: No module named 'cv2'`
**Solution**: ✅ Already fixed! Using `opencv-python-headless` in requirements.txt

### Database Connection Issues
**Error**: `asyncpg.exceptions.InvalidCatalogNameError`
**Solution**: Verify `DATABASE_URL` in Railway dashboard uses `postgresql+asyncpg://` scheme

### Port Binding Issues
**Error**: `Error: [Errno 48] Address already in use`
**Solution**: ✅ Already fixed! Dockerfile uses Railway's `$PORT` variable

## 📊 Health Check

After deployment, test these endpoints:

```bash
# Health check
curl https://your-app.railway.app/health

# API docs
curl https://your-app.railway.app/docs
```

## 🎯 Next Steps

1. **Frontend Deployment** (Vercel):
   - Update `.env.local` with Railway backend URL
   - Deploy to Vercel: `vercel --prod`

2. **Database Migrations**:
   - Tables auto-create on first startup
   - Monitor Railway logs for database init

3. **Testing**:
   - Test session endpoints: `/api/v1/session/`
   - Test classroom endpoints: `/api/v1/classroom/`
   - Verify Supabase Auth integration

## 📞 Support

If deployment fails:
1. Check Railway build logs for specific errors
2. Verify all environment variables are set
3. Test database connection from Railway logs
4. Check this guide's troubleshooting section

---

**Last Updated**: Railway-optimized Dockerfile with Debian Trixie support

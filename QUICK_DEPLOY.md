# 🚀 Quick Deployment Steps

## Prerequisites
- [ ] GitHub repo is up to date (`git push origin main`)
- [ ] Backend running locally on port 8002
- [ ] Frontend running locally on port 5173
- [ ] Supabase database credentials ready

---

## Step 1: Deploy Backend (Railway - Recommended)

### Create Railway Account
1. Go to https://railway.app
2. Sign up with GitHub

### Deploy Backend
1. Click "New Project" → "Deploy from GitHub repo"
2. Select `BrainCell` repository
3. **Settings (Railway auto-detects most):**
   - Root Directory: `braincell_backend`
   - Build Command: `pip install -r requirements.txt` (auto-detected)
   - Start Command: Will use `Procfile` automatically
   
   **OR manually set:**
   - Go to Settings → Deploy
   - Custom Start Command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`

### Add Environment Variables
Go to **Variables** tab and add these ONE BY ONE:

```bash
# Database (Supabase connection string)
DATABASE_URL=postgresql+asyncpg://postgres:Braincell%401@db.nsxbpxlsjbkphhfkiosq.supabase.co:5432/postgres

# Google AI Studio API
GOOGLE_API_KEY=AIzaSyDfvAFvuHckuAKzmCorGUJeuMrEpIolQHk
MODEL_PROVIDER=google
MODEL_ID=gemini-2.5-flash

# Emotion Model (optional - auto-downloads if not set)
# EMO_MODEL_PATH=/app/models/emo0.1

# Environment
ENVIRONMENT=production
```

**Important Notes:**
- Railway automatically sets `PORT` variable - DON'T add it manually!
- Password special characters must be URL-encoded (`@` becomes `%40`)
- Leave `EMO_MODEL_PATH` empty to auto-download from HuggingFace
- **Authentication:** Using Supabase Auth (frontend handles auth, no backend API key needed)

### Get Backend URL
After deployment completes, copy the Railway URL:
Example: `https://braincell-backend-production.up.railway.app`

---

## Step 2: Deploy Frontend (Vercel)

### Create Vercel Account
1. Go to https://vercel.com
2. Sign up with GitHub

### Deploy Frontend
1. Click "Add New..." → "Project"
2. Select `BrainCell` repository
3. Click "Import"
4. **Settings will auto-detect from vercel.json:**
   - Framework: Vite
   - Build Command: `npm run build`
   - Output Directory: `dist`

### Add Environment Variables
Go to **Environment Variables**:
```bash
VITE_API_URL=https://braincell-backend-production.up.railway.app
VITE_SUPABASE_URL=https://nsxbpxlsjbkphhfkiosq.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5zeGJweGxzamJrcGhoZmtpb3NxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA3OTQwOTIsImV4cCI6MjA3NjM3MDA5Mn0.51Dz4XikSLaV9ALx4GrhzPeGH3-o6o4DJKQrrDPub88
VITE_DEMO_MODE=false
VITE_USE_MOCK=false
VITE_ENABLE_TFJS=true
```

**Important:** Replace `VITE_API_URL` with your actual Railway backend URL!

### Deploy
Click "Deploy" and wait 2-3 minutes.

---

## Step 3: Verify Deployment

### Test Backend
1. Visit: `https://your-backend.railway.app/health`
2. Should return: `{"status": "healthy"}` or similar

### Test Frontend
1. Visit your Vercel URL (e.g., `https://braincell.vercel.app`)
2. Try creating an account
3. Join a classroom
4. Check browser console for errors

### Common Issues

#### ❌ "Invalid value for '--port': '$PORT' is not a valid integer"
**Problem:** Railway/Render not injecting PORT variable correctly

**Solution:**
1. Check that `Procfile` exists in `braincell_backend/` directory
2. Verify Procfile content: `web: uvicorn app.main:app --host 0.0.0.0 --port $PORT`
3. In Railway Settings → Deploy → Ensure "Use Procfile" is enabled
4. Railway auto-sets PORT - don't add it manually to environment variables!

#### ❌ "Module not found" or "No module named 'asyncpg'"
**Problem:** Missing database drivers

**Solution:**
1. Updated `requirements.txt` includes: `asyncpg`, `sqlalchemy`, `aiosqlite`
2. Commit changes: `git add . && git commit -m "fix: Add database drivers" && git push`
3. Railway will auto-redeploy with new dependencies

#### ❌ "ModuleNotFoundError: No module named 'cv2'" (OpenCV Error)
**Problem:** OpenCV requires system libraries not available by default

**Solution (ALREADY FIXED):**
1. ✅ Changed `opencv-python` → `opencv-python-headless` (no GUI needed)
2. ✅ Created `nixpacks.toml` with system dependencies (libgl1, libglib2.0)
3. ✅ Created `Aptfile` for Render (if using Render instead of Railway)
4. Just commit and push - Railway will auto-install system packages:
   ```powershell
   git add .
   git commit -m "fix: Add OpenCV system dependencies"
   git push origin main
   ```

#### ❌ CORS Error
**Problem:** Frontend can't connect to backend

**Solution:**
- Backend CORS already includes `*.vercel.app` and `*.railway.app` wildcards
- No changes needed!

#### ❌ API Connection Failed
**Problem:** Frontend can't find backend

**Solution:**
- Double-check `VITE_API_URL` in Vercel environment variables
- Make sure it matches your Railway URL exactly
- Redeploy frontend after updating environment variables

#### ❌ Build Failed
**Problem:** Deployment fails during build

**Solution:**
- Check build logs in Vercel/Railway dashboard for specific errors
- Common issues: Python version mismatch, missing dependencies
- Verify `runtime.txt` specifies `python-3.11`

---

## Step 4: Update Domain (Optional)

### Add Custom Domain to Vercel
1. Project Settings → Domains
2. Add domain: `braincell.app`
3. Follow DNS instructions

### Add Custom Domain to Railway
1. Service Settings → Networking
2. Add custom domain: `api.braincell.app`
3. Update DNS with CNAME record

---

## 📊 Deployment Status

Once deployed:
- **Frontend:** https://braincell.vercel.app
- **Backend:** https://braincell-backend.railway.app
- **Database:** Supabase (already configured)

---

## 🔧 Post-Deployment

### Monitor Logs
- **Vercel:** Dashboard → Deployments → Click latest → Function Logs
- **Railway:** Dashboard → Service → Deployments → View Logs

### Auto-Deploy
Both platforms auto-deploy on `git push origin main`!

### Scale
- **Railway:** Free tier gives $5 credit/month (~500 hours)
- **Vercel:** Free tier unlimited for personal projects
- **Upgrade when needed:** Railway $5/month, Vercel $20/month

---

## 🎉 You're Live!

Share your project:
- LinkedIn: "Just deployed my AI-powered education platform!"
- Twitter/X: #BrainCell #EdTech #AI
- Product Hunt: Launch when ready for beta users

---

## Need Help?

Check `DEPLOYMENT_GUIDE.md` for detailed troubleshooting!

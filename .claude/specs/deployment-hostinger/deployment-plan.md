# GenHub Deployment Plan - Hostinger

> Comprehensive deployment strategy for taking GenHub (Next.js 15 + Supabase PWA) live on Hostinger

**Created:** 2026-01-13
**Status:** READY FOR REVIEW

---

## Executive Summary

GenHub is a production-ready construction management PWA with the following deployment requirements:

| Component | Current State | Production Action |
|-----------|--------------|-------------------|
| **Next.js 15** | Configured with SSR + experimental features | Requires VPS with Node.js 20+ |
| **Supabase** | Cloud-hosted, 44 tables with RLS | Configure production environment |
| **PWA** | Service worker + manifest ready | Verify HTTPS + manifest paths |
| **Authentication** | Google OAuth + Email (Nodemailer) | Update OAuth callbacks |
| **Integrations** | Stripe, Firebase (push), SerpAPI | Update webhooks + secrets |

**Recommended Hostinger Plan:** Cloud Professional or VPS KVM2+ (for SSR support)

**Estimated Deployment Time:** 4-6 hours (first deployment)

---

## Critical Decision: Hosting Type

### Option A: Hostinger VPS (RECOMMENDED)

Required for GenHub because:
- Next.js 15 uses SSR (Server Components, Server Actions)
- Dynamic API routes (21 endpoints)
- Webhook handlers (Stripe, Kakao)
- Real-time features (chat with Supabase)

**Minimum Specs:**
- 2 vCPU / 4 GB RAM (Cloud Professional or KVM2)
- Ubuntu 22.04 LTS
- Node.js 20.x or 22.x via NVM
- PM2 process manager
- Nginx reverse proxy
- Let's Encrypt SSL

### Option B: Static Export (NOT RECOMMENDED)

Would require:
- Removing all Server Components
- Converting Server Actions to client-side API calls
- Losing SSR benefits (SEO, performance)
- Significant code refactoring

**Verdict:** Use VPS deployment for full GenHub functionality.

---

## Pre-Deployment Checklist

### 1. Code Readiness

| Item | Check | Notes |
|------|-------|-------|
| Build passes locally | `npm run build` | Must complete without errors |
| TypeScript errors | `npm run lint:ts` | Zero type errors |
| ESLint passes | `npm run lint` | Zero linting errors |
| Environment variables documented | `.env.example` | All 40+ vars listed |
| Sensitive data excluded | `.gitignore` | No secrets in repo |
| Service worker tested | `/sw.js` | Verify caching works |
| PWA manifest valid | `/manifest.json` | Icons exist at paths |

**Commands to run:**
```bash
# Full validation
npm run lint
npm run lint:ts
npm run build

# PWA validation
npx pwa-asset-generator --help  # Verify icons
```

### 2. Database Readiness (Supabase)

| Item | Check | Notes |
|------|-------|-------|
| All migrations applied | 25 migrations | `supabase/migrations/` |
| RLS policies enabled | 44 tables | All have RLS |
| Indexes optimized | Performance | Check slow query log |
| Storage buckets configured | project-files, project-photos | Verify CORS |
| Edge Functions deployed | Push notifications | FCM integration |

**Supabase Production Checklist:**
```
[ ] Create production project (if using separate dev/prod)
[ ] Apply all migrations
[ ] Configure storage bucket policies
[ ] Set up database backups
[ ] Configure connection pooling (if high traffic)
[ ] Update project URL in environment
```

### 3. Third-Party Services

| Service | Production Setup Required |
|---------|--------------------------|
| **Supabase** | Production project URL + keys |
| **Google OAuth** | Add production domain to authorized redirects |
| **Stripe** | Switch to live keys, update webhook URL |
| **Firebase** | Production FCM credentials |
| **SerpAPI** | Verify API quota for production load |
| **Email (SMTP)** | Configure production email service |

### 4. Security Audit

| Item | Action |
|------|--------|
| API keys | Rotate all keys for production |
| AUTH_SECRET | Generate new 32+ char random string |
| CRON_SECRET | Generate new secure random string |
| Supabase JWT_SECRET | Use production secret |
| Rate limiting | Implement if not present |
| CORS | Configure for production domain only |

---

## Environment Variables (Production)

Create `.env.production` with these categories:

### Core Application
```env
# App Configuration
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://yourdomain.com

# Feature Flags (adjust for production)
NEXT_PUBLIC_PAYMENTS_ENABLED=true
NEXT_PUBLIC_SPATIAL_VIEWER_ENABLED=true
NEXT_PUBLIC_OFFLINE_MODE_ENABLED=true
```

### Supabase
```env
NEXT_PUBLIC_SUPABASE_URL=https://[project-id].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SECRET_KEY=eyJ... (service role - KEEP SECRET)
SUPABASE_JWT_SECRET=your-jwt-secret
```

### Authentication
```env
AUTH_SECRET=generate-32-char-random-string
AUTH_GOOGLE_ID=your-production-google-client-id
AUTH_GOOGLE_SECRET=your-production-google-secret
```

### Stripe (Live Mode)
```env
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

### Email
```env
MAIL_HOST=smtp.youremailprovider.com
MAIL_PORT=465
MAIL_USER=noreply@yourdomain.com
MAIL_PASS=your-email-password
MAIL_FROM=GenHub <noreply@yourdomain.com>
```

### Firebase (Push Notifications)
```env
NEXT_PUBLIC_FIREBASE_API_KEY=your-firebase-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id
NEXT_PUBLIC_FIREBASE_VAPID_KEY=your-vapid-key
FCM_SERVER_KEY=your-fcm-server-key
```

### External APIs
```env
SERPAPI_API_KEY=your-production-serpapi-key
CRON_SECRET=your-secure-cron-secret
```

---

## Deployment Steps (VPS)

### Phase 1: VPS Setup (30 min)

```bash
# 1. SSH into VPS
ssh root@your-vps-ip

# 2. Update system
sudo apt update && sudo apt upgrade -y

# 3. Install essential packages
sudo apt install -y git curl wget build-essential

# 4. Install Node.js via NVM
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
source ~/.bashrc
nvm install 20
nvm use 20
nvm alias default 20

# 5. Verify installations
node --version  # Should show v20.x.x
npm --version

# 6. Install PM2 globally
npm install -g pm2

# 7. Install pnpm (optional, if using pnpm)
npm install -g pnpm
```

### Phase 2: Nginx Setup (20 min)

```bash
# 1. Install Nginx
sudo apt install -y nginx

# 2. Create Nginx configuration
sudo nano /etc/nginx/sites-available/genhub

# Paste this configuration:
```

```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 86400;
    }

    # Static files caching
    location /_next/static {
        proxy_pass http://localhost:3000;
        add_header Cache-Control "public, max-age=31536000, immutable";
    }

    # PWA service worker
    location /sw.js {
        proxy_pass http://localhost:3000;
        add_header Cache-Control "no-cache";
    }

    # PWA manifest
    location /manifest.json {
        proxy_pass http://localhost:3000;
        add_header Cache-Control "no-cache";
    }
}
```

```bash
# 3. Enable the site
sudo ln -s /etc/nginx/sites-available/genhub /etc/nginx/sites-enabled/
sudo rm /etc/nginx/sites-enabled/default

# 4. Test and reload Nginx
sudo nginx -t
sudo systemctl reload nginx
```

### Phase 3: SSL Certificate (10 min)

```bash
# 1. Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# 2. Obtain SSL certificate
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# 3. Verify auto-renewal
sudo certbot renew --dry-run
```

### Phase 4: Application Deployment (30 min)

```bash
# 1. Create app directory
mkdir -p /var/www/genhub
cd /var/www/genhub

# 2. Clone repository (or set up deploy key)
git clone git@github.com:yourusername/genhub.git .

# 3. Install dependencies
npm install --legacy-peer-deps
# OR with pnpm: pnpm install

# 4. Create environment file
nano .env.local
# Paste all production environment variables

# 5. Build the application
npm run build

# 6. Start with PM2
pm2 start npm --name "genhub" -- start

# 7. Save PM2 configuration
pm2 save
pm2 startup
```

### Phase 5: PM2 Ecosystem (Optional - Better Management)

Create `ecosystem.config.js`:

```javascript
module.exports = {
  apps: [{
    name: 'genhub',
    script: 'npm',
    args: 'start',
    cwd: '/var/www/genhub',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    max_memory_restart: '500M',
    error_file: '/var/log/pm2/genhub-error.log',
    out_file: '/var/log/pm2/genhub-out.log',
    time: true
  }]
};
```

```bash
# Start with ecosystem file
pm2 start ecosystem.config.js --env production
```

---

## Post-Deployment Validation

### Immediate Checks (15 min)

| Check | Command/URL | Expected Result |
|-------|-------------|-----------------|
| App loads | `https://yourdomain.com` | Landing page renders |
| Login works | Click "Sign In" | Google OAuth redirect works |
| Dashboard loads | `/app` | Dashboard with data |
| PWA installable | Chrome menu | "Install GenHub" option |
| Service worker | DevTools > Application | SW registered |
| HTTPS | Browser padlock | Valid SSL certificate |
| API routes | `/api/feature-flags` | Returns JSON |

### Functional Tests (30 min)

```
[ ] Create a new project
[ ] Add tasks to project
[ ] Upload a file
[ ] Send a chat message
[ ] View 3D spatial viewer
[ ] Create an expense
[ ] Invite a team member
[ ] Check push notifications (if enabled)
```

### Performance Checks

```bash
# 1. Run Lighthouse audit
# Open Chrome DevTools > Lighthouse > Generate report

# 2. Check Core Web Vitals
# - LCP < 2.5s
# - FID < 100ms
# - CLS < 0.1

# 3. Monitor server resources
pm2 monit
htop
```

---

## Webhook Configuration

After deployment, update these webhook URLs:

### Stripe Webhook
1. Go to Stripe Dashboard > Developers > Webhooks
2. Add endpoint: `https://yourdomain.com/api/webhook/stripe`
3. Select events: `checkout.session.completed`, `invoice.paid`, etc.
4. Copy new `whsec_...` secret to environment

### Google OAuth
1. Go to Google Cloud Console > APIs & Credentials
2. Edit OAuth 2.0 Client
3. Add Authorized redirect URIs:
   - `https://yourdomain.com/api/auth/callback/google`
4. Add Authorized JavaScript origins:
   - `https://yourdomain.com`

### Firebase Cloud Messaging
1. Update authorized domains in Firebase Console
2. Verify VAPID key matches

---

## Ongoing Maintenance

### Daily Monitoring

```bash
# Check application status
pm2 status

# View recent logs
pm2 logs genhub --lines 100

# Monitor resources
pm2 monit
```

### Weekly Tasks

| Task | Command | Notes |
|------|---------|-------|
| Check disk space | `df -h` | Clean if >80% |
| Review error logs | `pm2 logs --err` | Investigate patterns |
| Update dependencies | `npm audit` | Security patches |
| Backup database | Supabase dashboard | Verify backups running |
| Check SSL expiry | `certbot certificates` | Auto-renews at 30 days |

### Monthly Tasks

| Task | Notes |
|------|-------|
| Security audit | Review access logs |
| Performance review | Lighthouse + Core Web Vitals |
| Dependency updates | Minor versions only |
| Database optimization | VACUUM, index analysis |
| Cost review | Hostinger + Supabase billing |

### Deployment Updates

```bash
# Pull latest code
cd /var/www/genhub
git pull origin main

# Install any new dependencies
npm install --legacy-peer-deps

# Rebuild
npm run build

# Restart with zero downtime
pm2 reload genhub
```

---

## Rollback Procedure

If deployment fails:

```bash
# 1. Check recent commits
git log --oneline -5

# 2. Revert to previous working version
git checkout <previous-commit-hash>

# 3. Rebuild
npm run build

# 4. Restart
pm2 restart genhub

# 5. Verify
curl -I https://yourdomain.com
```

---

## Troubleshooting

### Common Issues

| Issue | Cause | Solution |
|-------|-------|----------|
| 502 Bad Gateway | App not running | `pm2 restart genhub` |
| Auth redirect fails | Wrong OAuth URL | Update Google Console |
| Stripe webhook 400 | Secret mismatch | Update STRIPE_WEBHOOK_SECRET |
| PWA not installing | Invalid manifest | Check `/manifest.json` |
| Images not loading | Supabase CORS | Update storage policies |
| Build fails OOM | Insufficient RAM | Upgrade VPS or add swap |

### Adding Swap (if RAM issues)

```bash
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

### Viewing Detailed Errors

```bash
# PM2 error logs
pm2 logs genhub --err --lines 200

# Nginx error logs
sudo tail -f /var/log/nginx/error.log

# System logs
sudo journalctl -u nginx -f
```

---

## Cost Estimate

### Hostinger (Monthly)

| Service | Cost |
|---------|------|
| VPS KVM2 (2 vCPU, 8GB RAM) | ~$10-15/month |
| Domain (optional) | ~$10/year |
| **Total Hostinger** | **~$12/month** |

### Third-Party Services

| Service | Cost |
|---------|------|
| Supabase (Free tier) | $0 |
| Supabase (Pro - if needed) | $25/month |
| Stripe | 2.9% + $0.30 per transaction |
| Firebase (Free tier) | $0 |
| SerpAPI (100 searches/month free) | $0-50/month |

---

## Summary Checklist

### Before Going Live

```
[ ] Local build passes without errors
[ ] All environment variables configured
[ ] Supabase production project ready
[ ] Google OAuth production credentials set
[ ] Stripe live mode configured
[ ] Domain DNS configured to Hostinger VPS
[ ] SSL certificate installed
[ ] PM2 running with startup configured
[ ] Nginx reverse proxy configured
[ ] Webhook URLs updated
```

### Go-Live Day

```
[ ] Final code push to production
[ ] npm run build succeeds
[ ] PM2 starts application
[ ] HTTPS works
[ ] Login flow works
[ ] All core features functional
[ ] PWA installable
[ ] Monitoring active
```

### Post-Launch (First Week)

```
[ ] Monitor error logs daily
[ ] Track performance metrics
[ ] Gather user feedback
[ ] Address critical bugs immediately
[ ] Verify email delivery
[ ] Test push notifications
[ ] Check Stripe transactions
```

---

## Sources

- [Hostinger Node.js Web Apps Hosting](https://www.hostinger.com/web-apps-hosting)
- [How to Deploy Next.js to Hostinger VPS - Complete Guide 2025](https://ayyaztech.com/blog/how-to-deploy-nextjs-to-hostinger-vps-complete-guide-2025)
- [Deploying Next.js on Hostinger with Docker](https://medium.com/@afaqak124/deploying-your-next-js-app-on-hostinger-vps-with-docker-part-1-26741c113d33)
- [Hostinger Help Center - Node.js Deployment](https://www.hostinger.com/support/how-to-deploy-a-nodejs-website-in-hostinger/)
- [Deploying Next.js on Hostinger - DEV Community](https://dev.to/oandersonmagalhaes/deploying-your-nextjs-project-on-hostinger-4gpm)

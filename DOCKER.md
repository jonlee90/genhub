# Docker Deployment Guide for GenHub

This guide covers deploying GenHub using Docker and Docker Compose.

---

## Quick Start

### 1. Prerequisites

- Docker 20.10+
- Docker Compose 2.0+
- `.env.local` file with all required environment variables

### 2. Build and Run

```bash
# Build the Docker image
docker-compose build

# Start the container
docker-compose up -d

# View logs
docker-compose logs -f genhub

# Check health
curl http://localhost:3000/api/health
```

### 3. Stop and Remove

```bash
# Stop containers
docker-compose down

# Remove volumes too
docker-compose down -v
```

---

## Configuration

### Environment Variables

The `docker-compose.yml` loads environment variables from `.env.local`. Ensure all required variables are set:

**Required:**
- `AUTH_SECRET` - 32+ character random string
- `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anon key
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key
- `DATABASE_URL` - PostgreSQL connection string

**OAuth:**
- `AUTH_GOOGLE_ID` - Google OAuth client ID
- `AUTH_GOOGLE_SECRET` - Google OAuth client secret

**Stripe:**
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`

See `.env.local.example` for complete list.

### Production URLs

Update these for production deployment:

```env
NEXT_PUBLIC_APP_URL=https://yourdomain.com
NEXTAUTH_URL=https://yourdomain.com
```

---

## Deployment to Hostinger VPS

### Option 1: Using Docker Compose (Recommended)

```bash
# 1. SSH into your VPS
ssh user@your-vps-ip

# 2. Install Docker and Docker Compose
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# 3. Clone your repository
git clone https://github.com/yourusername/genhub.git
cd genhub

# 4. Create .env.local with production values
nano .env.local
# Add all required environment variables

# 5. Build and start
docker-compose up -d

# 6. Check status
docker-compose ps
docker-compose logs -f
```

### Option 2: Build Locally, Push to Registry

```bash
# 1. Build image
docker build -t genhub:v1.0.0 .

# 2. Tag for registry (Docker Hub example)
docker tag genhub:v1.0.0 yourusername/genhub:v1.0.0

# 3. Push to registry
docker push yourusername/genhub:v1.0.0

# 4. On VPS, pull and run
docker pull yourusername/genhub:v1.0.0
docker run -d \
  --name genhub \
  -p 3000:3000 \
  --env-file .env.local \
  --restart unless-stopped \
  yourusername/genhub:v1.0.0
```

---

## Nginx Reverse Proxy

For production, use Nginx in front of the Docker container:

```nginx
# /etc/nginx/sites-available/genhub
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    # Redirect to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

    # Proxy to Docker container
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
    }

    # Optimize static files
    location /_next/static {
        proxy_pass http://localhost:3000;
        proxy_cache_valid 60m;
    }
}
```

---

## Monitoring & Maintenance

### View Logs

```bash
# All logs
docker-compose logs -f

# Last 100 lines
docker-compose logs --tail=100 genhub

# Filter by time
docker-compose logs --since 30m genhub
```

### Container Management

```bash
# Restart container
docker-compose restart genhub

# Stop container
docker-compose stop genhub

# Start container
docker-compose start genhub

# Rebuild after code changes
docker-compose up -d --build
```

### Health Checks

```bash
# Via API
curl http://localhost:3000/api/health

# Docker health status
docker inspect --format='{{.State.Health.Status}}' genhub-app
```

### Resource Usage

```bash
# Container stats
docker stats genhub-app

# Disk usage
docker system df
```

---

## Updating the Application

```bash
# 1. Pull latest code
git pull origin master

# 2. Rebuild and restart
docker-compose down
docker-compose build --no-cache
docker-compose up -d

# 3. Verify
docker-compose logs -f genhub
curl http://localhost:3000/api/health
```

---

## Troubleshooting

### Container Won't Start

```bash
# Check logs
docker-compose logs genhub

# Inspect container
docker inspect genhub-app

# Check environment variables
docker exec genhub-app env
```

### Port Already in Use

```bash
# Find process using port 3000
lsof -i :3000

# Change port in docker-compose.yml
ports:
  - "8080:3000"  # Access on port 8080 instead
```

### Build Failures

```bash
# Clear build cache
docker builder prune -a

# Rebuild from scratch
docker-compose build --no-cache
```

### Out of Disk Space

```bash
# Remove unused images
docker image prune -a

# Remove unused volumes
docker volume prune

# Complete cleanup
docker system prune -a --volumes
```

---

## Performance Optimization

### Multi-Stage Build

The Dockerfile uses multi-stage builds to minimize final image size:

- **deps stage**: Installs production dependencies only
- **builder stage**: Builds the Next.js app with standalone output
- **runner stage**: Minimal runtime with only necessary files

### Image Size

```bash
# Check image size
docker images genhub:latest

# Expected size: ~500-800MB (depending on dependencies)
```

### Memory Limits

Add memory limits to docker-compose.yml:

```yaml
services:
  genhub:
    deploy:
      resources:
        limits:
          memory: 2G
        reservations:
          memory: 1G
```

---

## Security Best Practices

1. **Non-root user**: Container runs as `nextjs` user (UID 1001)
2. **Secrets**: Never commit `.env.local` to version control
3. **Updates**: Regularly update base image and dependencies
4. **Network**: Use Docker networks to isolate containers
5. **SSL**: Always use HTTPS in production via Nginx/Traefik

---

## Additional Resources

- [Next.js Docker Documentation](https://nextjs.org/docs/deployment#docker-image)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [Hostinger VPS Guides](https://www.hostinger.com/tutorials/vps)

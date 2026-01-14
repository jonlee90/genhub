#!/bin/bash
set -e

# GenHub Docker Deployment Script
# Usage: ./scripts/docker-deploy.sh [environment]

ENVIRONMENT=${1:-production}
PROJECT_NAME="genhub"

echo "🚀 GenHub Docker Deployment"
echo "Environment: $ENVIRONMENT"
echo "================================"

# Color codes
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker is not installed${NC}"
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo -e "${RED}❌ Docker Compose is not installed${NC}"
    exit 1
fi

# Check if .env.local exists
if [ ! -f .env.local ]; then
    echo -e "${RED}❌ .env.local file not found${NC}"
    echo "Create .env.local with required environment variables"
    exit 1
fi

# Verify critical environment variables
echo -e "\n${YELLOW}Checking environment variables...${NC}"
REQUIRED_VARS=(
    "AUTH_SECRET"
    "NEXT_PUBLIC_SUPABASE_URL"
    "NEXT_PUBLIC_SUPABASE_ANON_KEY"
    "DATABASE_URL"
)

for var in "${REQUIRED_VARS[@]}"; do
    if ! grep -q "^${var}=" .env.local; then
        echo -e "${RED}❌ Missing required variable: ${var}${NC}"
        exit 1
    fi
done

echo -e "${GREEN}✓ Environment variables OK${NC}"

# Stop existing containers
echo -e "\n${YELLOW}Stopping existing containers...${NC}"
docker-compose down

# Pull latest code (if in production)
if [ "$ENVIRONMENT" = "production" ]; then
    echo -e "\n${YELLOW}Pulling latest code...${NC}"
    git pull origin master || {
        echo -e "${RED}❌ Failed to pull latest code${NC}"
        exit 1
    }
fi

# Build the Docker image
echo -e "\n${YELLOW}Building Docker image...${NC}"
docker-compose build --no-cache || {
    echo -e "${RED}❌ Docker build failed${NC}"
    exit 1
}

echo -e "${GREEN}✓ Docker image built successfully${NC}"

# Start containers
echo -e "\n${YELLOW}Starting containers...${NC}"
docker-compose up -d || {
    echo -e "${RED}❌ Failed to start containers${NC}"
    exit 1
}

# Wait for health check
echo -e "\n${YELLOW}Waiting for application to be healthy...${NC}"
MAX_ATTEMPTS=30
ATTEMPT=0

while [ $ATTEMPT -lt $MAX_ATTEMPTS ]; do
    if curl -sf http://localhost:3000/api/health > /dev/null 2>&1; then
        echo -e "${GREEN}✓ Application is healthy${NC}"
        break
    fi

    ATTEMPT=$((ATTEMPT + 1))
    echo -e "${YELLOW}Waiting... (${ATTEMPT}/${MAX_ATTEMPTS})${NC}"
    sleep 2
done

if [ $ATTEMPT -eq $MAX_ATTEMPTS ]; then
    echo -e "${RED}❌ Application failed to start${NC}"
    echo -e "\n${YELLOW}Container logs:${NC}"
    docker-compose logs --tail=50 genhub
    exit 1
fi

# Show status
echo -e "\n${GREEN}================================${NC}"
echo -e "${GREEN}✅ Deployment successful!${NC}"
echo -e "${GREEN}================================${NC}"
echo ""
echo "Container status:"
docker-compose ps

echo ""
echo "View logs:"
echo "  docker-compose logs -f genhub"

echo ""
echo "Health check:"
echo "  curl http://localhost:3000/api/health"

echo ""
echo -e "${GREEN}GenHub is now running at http://localhost:3000${NC}"

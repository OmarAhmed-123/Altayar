#!/bin/bash

# Deployment script for Google Cloud Run
# This script handles the complete deployment process

set -e  # Exit on error

echo "🚀 Starting deployment to Google Cloud Run..."
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if gcloud is installed
if ! command -v gcloud &> /dev/null; then
    echo -e "${RED}❌ Error: gcloud CLI is not installed${NC}"
    echo "Please install Google Cloud SDK: https://cloud.google.com/sdk/docs/install"
    exit 1
fi

# Check if user is authenticated
if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" | grep -q .; then
    echo -e "${YELLOW}⚠️  Not authenticated with gcloud${NC}"
    echo "Running: gcloud auth login"
    gcloud auth login
fi

# Get project ID
PROJECT_ID=$(gcloud config get-value project 2>/dev/null)
if [ -z "$PROJECT_ID" ]; then
    echo -e "${RED}❌ Error: No Google Cloud project set${NC}"
    echo "Please set a project: gcloud config set project YOUR_PROJECT_ID"
    exit 1
fi

echo -e "${GREEN}✅ Project ID: ${PROJECT_ID}${NC}"

# Check if Cairo fonts exist (check multiple locations)
FONTS_FOUND=false
if [ -f "assets/fonts/Cairo-Regular.ttf" ] && [ -f "assets/fonts/Cairo-Bold.ttf" ]; then
    echo -e "${GREEN}✅ Cairo fonts found in assets/fonts/${NC}"
    FONTS_FOUND=true
elif [ -f "assets/fonts/static/Cairo-Regular.ttf" ] && [ -f "assets/fonts/static/Cairo-Bold.ttf" ]; then
    echo -e "${GREEN}✅ Cairo fonts found in assets/fonts/static/${NC}"
    FONTS_FOUND=true
fi

if [ "$FONTS_FOUND" = false ]; then
    echo -e "${YELLOW}⚠️  Warning: Cairo fonts not found${NC}"
    echo "Arabic text in PDFs may not display correctly."
    echo "To fix: Download Cairo fonts from https://fonts.google.com/specimen/Cairo"
    echo "        and place them in assets/fonts/ or assets/fonts/static/"
    read -p "Continue anyway? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Set deployment variables
SERVICE_NAME="altayar-backend"
REGION="us-central1"
IMAGE_NAME="gcr.io/${PROJECT_ID}/${SERVICE_NAME}"

echo ""
echo "📦 Building Docker image..."
docker build -t ${IMAGE_NAME}:latest .

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Docker build failed${NC}"
    exit 1
fi

echo ""
echo "📤 Pushing image to Google Container Registry..."
docker push ${IMAGE_NAME}:latest

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Docker push failed${NC}"
    exit 1
fi

echo ""
echo "🚀 Deploying to Cloud Run..."
# PORT is automatically set by Cloud Run, don't set it manually
# --concurrency 80 allows handling multiple requests per instance (important for concurrent registrations)
gcloud run deploy ${SERVICE_NAME} \
    --image ${IMAGE_NAME}:latest \
    --platform managed \
    --region ${REGION} \
    --allow-unauthenticated \
    --port 8080 \
    --memory 2Gi \
    --cpu 2 \
    --timeout 300 \
    --max-instances 10 \
    --min-instances 1 \
    --concurrency 80 \
    --set-env-vars NODE_ENV=production

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Deployment failed${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}✅ Deployment successful!${NC}"
echo ""
echo "🌐 Service URL:"
gcloud run services describe ${SERVICE_NAME} --region ${REGION} --format="value(status.url)"
echo ""
echo "📊 View logs:"
echo "gcloud run services logs read ${SERVICE_NAME} --region ${REGION}"
echo ""


#!/bin/bash

# Altayar Backend Deployment Script for Google Cloud
# Usage: ./deploy.sh [cloud-run|app-engine]

set -e

PROJECT_ID="altayarback"
REGION="us-central1"
SERVICE_NAME="altayar-backend"
IMAGE_NAME="gcr.io/${PROJECT_ID}/${SERVICE_NAME}"

echo "🚀 Starting deployment to Google Cloud Platform..."
echo "Project: ${PROJECT_ID}"
echo "Region: ${REGION}"

# Check if gcloud is installed
if ! command -v gcloud &> /dev/null; then
    echo "❌ Error: gcloud CLI is not installed"
    echo "Install it from: https://cloud.google.com/sdk/docs/install"
    exit 1
fi

# Set the project
echo "📋 Setting GCP project..."
gcloud config set project ${PROJECT_ID}

# Check if user is authenticated
echo "🔐 Checking authentication..."
if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" | grep -q .; then
    echo "⚠️  Not authenticated. Please run: gcloud auth login"
    exit 1
fi

# Enable required APIs
echo "🔧 Enabling required APIs..."
gcloud services enable cloudbuild.googleapis.com
gcloud services enable run.googleapis.com
gcloud services enable sqladmin.googleapis.com
gcloud services enable containerregistry.googleapis.com

DEPLOYMENT_TYPE=${1:-cloud-run}

if [ "$DEPLOYMENT_TYPE" = "cloud-run" ]; then
    echo "🐳 Building Docker image..."
    docker build -t ${IMAGE_NAME}:latest .
    
    echo "📤 Pushing image to Container Registry..."
    docker push ${IMAGE_NAME}:latest
    
    echo "🚀 Deploying to Cloud Run..."
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
        --set-env-vars NODE_ENV=production,PORT=8080 \
        --project ${PROJECT_ID}
    
    echo "✅ Deployment complete!"
    echo "🌐 Getting service URL..."
    SERVICE_URL=$(gcloud run services describe ${SERVICE_NAME} --region ${REGION} --format 'value(status.url)')
    echo "📍 Service URL: ${SERVICE_URL}"
    echo "🔗 API URL: ${SERVICE_URL}/api"
    echo "❤️  Health Check: ${SERVICE_URL}/api/health"
    
elif [ "$DEPLOYMENT_TYPE" = "app-engine" ]; then
    echo "📦 Deploying to App Engine..."
    gcloud app deploy app.yaml --project ${PROJECT_ID}
    
    echo "✅ Deployment complete!"
    echo "🌐 Getting service URL..."
    SERVICE_URL=$(gcloud app describe --format 'value(defaultHostname)')
    echo "📍 Service URL: https://${SERVICE_URL}"
    echo "🔗 API URL: https://${SERVICE_URL}/api"
    echo "❤️  Health Check: https://${SERVICE_URL}/api/health"
else
    echo "❌ Invalid deployment type: ${DEPLOYMENT_TYPE}"
    echo "Usage: ./deploy.sh [cloud-run|app-engine]"
    exit 1
fi

echo ""
echo "🎉 Deployment successful!"
echo "📝 Next steps:"
echo "1. Update your .env file with production database credentials"
echo "2. Run migrations: gcloud run jobs create migrate --image ${IMAGE_NAME}:latest --command 'npx' --args 'knex,migrate:latest'"
echo "3. Update frontend API_BASE_URL to: ${SERVICE_URL}/api"


#!/bin/bash

# Script to set up Cloud SQL for Altayar Backend
# Usage: ./setup-cloud-sql.sh

set -e

PROJECT_ID="altayarback"
REGION="us-central1"
INSTANCE_NAME="altayar-db"
DATABASE_NAME="tourist_app_db"
DB_USER="postgres"

echo "🗄️  Setting up Cloud SQL for Altayar Backend..."
echo "Project: ${PROJECT_ID}"
echo "Region: ${REGION}"
echo "Instance: ${INSTANCE_NAME}"

# Check if gcloud is installed
if ! command -v gcloud &> /dev/null; then
    echo "❌ Error: gcloud CLI is not installed"
    exit 1
fi

# Set the project
gcloud config set project ${PROJECT_ID}

# Enable SQL Admin API
echo "🔧 Enabling SQL Admin API..."
gcloud services enable sqladmin.googleapis.com

# Check if instance already exists
if gcloud sql instances describe ${INSTANCE_NAME} &>/dev/null; then
    echo "⚠️  Instance ${INSTANCE_NAME} already exists. Skipping creation."
else
    echo "📦 Creating Cloud SQL instance..."
    read -sp "Enter database root password: " DB_PASSWORD
    echo ""
    
    gcloud sql instances create ${INSTANCE_NAME} \
        --database-version=POSTGRES_15 \
        --tier=db-f1-micro \
        --region=${REGION} \
        --root-password=${DB_PASSWORD} \
        --storage-type=SSD \
        --storage-size=10GB \
        --backup-start-time=03:00 \
        --enable-bin-log \
        --maintenance-window-day=SUN \
        --maintenance-window-hour=4
    
    echo "✅ Instance created successfully!"
fi

# Get connection name
CONNECTION_NAME=$(gcloud sql instances describe ${INSTANCE_NAME} --format="value(connectionName)")
echo "🔗 Connection Name: ${CONNECTION_NAME}"

# Check if database exists
if gcloud sql databases describe ${DATABASE_NAME} --instance=${INSTANCE_NAME} &>/dev/null; then
    echo "⚠️  Database ${DATABASE_NAME} already exists. Skipping creation."
else
    echo "📊 Creating database..."
    gcloud sql databases create ${DATABASE_NAME} --instance=${INSTANCE_NAME}
    echo "✅ Database created successfully!"
fi

# Check if user exists
if gcloud sql users describe ${DB_USER} --instance=${INSTANCE_NAME} &>/dev/null; then
    echo "⚠️  User ${DB_USER} already exists."
    read -p "Do you want to update the password? (y/n): " UPDATE_PASSWORD
    if [ "$UPDATE_PASSWORD" = "y" ]; then
        read -sp "Enter new password: " NEW_PASSWORD
        echo ""
        gcloud sql users set-password ${DB_USER} \
            --instance=${INSTANCE_NAME} \
            --password=${NEW_PASSWORD}
        echo "✅ Password updated!"
    fi
else
    echo "👤 Creating database user..."
    read -sp "Enter password for user ${DB_USER}: " USER_PASSWORD
    echo ""
    gcloud sql users create ${DB_USER} \
        --instance=${INSTANCE_NAME} \
        --password=${USER_PASSWORD}
    echo "✅ User created successfully!"
fi

echo ""
echo "✅ Cloud SQL setup complete!"
echo ""
echo "📝 Connection details:"
echo "   Connection Name: ${CONNECTION_NAME}"
echo "   Host: /cloudsql/${CONNECTION_NAME}"
echo "   Database: ${DATABASE_NAME}"
echo "   User: ${DB_USER}"
echo ""
echo "📋 Update your .env file with:"
echo "   DB_HOST=/cloudsql/${CONNECTION_NAME}"
echo "   DB_NAME=${DATABASE_NAME}"
echo "   DB_USER=${DB_USER}"
echo "   DB_PASSWORD=<your-password>"
echo ""
echo "🔧 To connect locally, use Cloud SQL Proxy:"
echo "   ./cloud_sql_proxy -instances=${CONNECTION_NAME}=tcp:5432"


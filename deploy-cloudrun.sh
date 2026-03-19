#!/bin/bash
# deploy-cloudrun.sh - Deploy Akilah API Gateway to Google Cloud Run

set -e

# Configuration
PROJECT_ID="${GOOGLE_CLOUD_PROJECT:-akilahstack}"
REGION="${GOOGLE_CLOUD_REGION:-us-central1}"
SERVICE_NAME="${CLOUD_RUN_SERVICE:-akilahapigateway}"
IMAGE_NAME="gcr.io/${PROJECT_ID}/${SERVICE_NAME}"

# Existing Secret Manager names in akilahstack
BASE_SECRETS=(
  "github-token"
  "notion-api-key"
  "openai-api-key"
  "linkedin-client-id"
  "linkedin-client-secret"
)

OPTIONAL_SECRET_BINDINGS=(
  "GOOGLE_CLIENT_ID=google-client-id:latest"
  "GOOGLE_CLIENT_SECRET=google-client-secret:latest"
  "NEXTAUTH_SECRET=nextauth-secret:latest"
)

echo "🚀 Deploying Akilah API Gateway to Cloud Run"
echo "   Project: ${PROJECT_ID}"
echo "   Region: ${REGION}"
echo "   Service: ${SERVICE_NAME}"

# Check if gcloud is installed
if ! command -v gcloud &> /dev/null; then
    echo "❌ gcloud CLI not found. Install from: https://cloud.google.com/sdk/docs/install"
    exit 1
fi

# Authenticate if needed
echo "🔐 Checking authentication..."
gcloud auth print-identity-token &>/dev/null || gcloud auth login

# Set project
echo "📦 Setting project..."
gcloud config set project ${PROJECT_ID}

# Verify required secrets exist
echo "🔐 Verifying required Secret Manager secrets..."
for secret_name in "${BASE_SECRETS[@]}"; do
    if ! gcloud secrets describe "${secret_name}" --project "${PROJECT_ID}" >/dev/null 2>&1; then
        echo "❌ Missing required secret: ${secret_name}"
        exit 1
    fi
done

# Build Cloud Run secret bindings from existing names
SECRET_BINDINGS="GITHUB_PAT=github-token:latest,NOTION_TOKEN=notion-api-key:latest,OPENAI_API_KEY=openai-api-key:latest,LINKEDIN_CLIENT_ID=linkedin-client-id:latest,LINKEDIN_CLIENT_SECRET=linkedin-client-secret:latest"

# Optional LinkedIn access token secret (if you store long-lived token in Secret Manager)
if gcloud secrets describe linkedin-access-token --project "${PROJECT_ID}" >/dev/null 2>&1; then
    SECRET_BINDINGS="${SECRET_BINDINGS},LINKEDIN_ACCESS_TOKEN=linkedin-access-token:latest"
elif gcloud secrets describe linkedin-token --project "${PROJECT_ID}" >/dev/null 2>&1; then
    SECRET_BINDINGS="${SECRET_BINDINGS},LINKEDIN_ACCESS_TOKEN=linkedin-token:latest"
else
    echo "ℹ️ No LinkedIn access token secret found; LinkedIn OAuth token flow can be used at runtime."
fi

for binding in "${OPTIONAL_SECRET_BINDINGS[@]}"; do
    env_name="${binding%%=*}"
    secret_ref="${binding#*=}"
    secret_name="${secret_ref%%:*}"

    if gcloud secrets describe "${secret_name}" --project "${PROJECT_ID}" >/dev/null 2>&1; then
        SECRET_BINDINGS="${SECRET_BINDINGS},${binding}"
    else
        echo "ℹ️ Optional secret not found for ${env_name}: ${secret_name}"
    fi
done

# Enable required APIs
echo "🔧 Enabling required APIs..."
gcloud services enable run.googleapis.com containerregistry.googleapis.com cloudbuild.googleapis.com

# Build and push using Cloud Build
echo "🏗️ Building container with Cloud Build..."
gcloud builds submit --tag ${IMAGE_NAME} .

# Deploy to Cloud Run
echo "🚀 Deploying to Cloud Run..."
gcloud run deploy ${SERVICE_NAME} \
    --image ${IMAGE_NAME} \
    --platform managed \
    --region ${REGION} \
    --allow-unauthenticated \
    --port 8080 \
    --memory 512Mi \
    --cpu 1 \
    --min-instances 0 \
    --max-instances 10 \
    --set-env-vars "NODE_ENV=production" \
    --set-secrets "${SECRET_BINDINGS}"

# Get the URL
echo ""
echo "✅ Deployment complete!"
SERVICE_URL=$(gcloud run services describe ${SERVICE_NAME} --region ${REGION} --format 'value(status.url)')
echo "🌐 Service URL: ${SERVICE_URL}"
echo ""
echo "Test with: curl ${SERVICE_URL}/health"

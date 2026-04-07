# deploy.ps1 - Deployment script for Book Buddy AI Backend to Google Cloud Run

$PROJECT_ID = "famt-library"
$REGION = "us-central1"
$SERVICE_NAME = "book-buddy-ai-backend"
$IMAGE_NAME = "gcr.io/$PROJECT_ID/$SERVICE_NAME"

Write-Host "🚀 Starting Deployment for $SERVICE_NAME to $PROJECT_ID..." -ForegroundColor Cyan

# Check if gcloud is installed
if (!(Get-Command gcloud -ErrorAction SilentlyContinue)) {
    Write-Error "❌ gcloud CLI not found. Please install Google Cloud SDK."
    exit 1
}

# 1. Configure gcloud
Write-Host "⚙️ Configuring gcloud project..." -ForegroundColor Yellow
gcloud config set project $PROJECT_ID

# 2. Build the container image using Cloud Build
Write-Host "🏗️ Building container image via Cloud Build..." -ForegroundColor Yellow
gcloud builds submit --tag $IMAGE_NAME

# 3. Deploy to Cloud Run
Write-Host "🚢 Deploying to Cloud Run..." -ForegroundColor Yellow
gcloud run deploy $SERVICE_NAME `
    --image $IMAGE_NAME `
    --platform managed `
    --region $REGION `
    --allow-unauthenticated `
    --max-instances 2 `
    --memory 256Mi `
    --cpu 1 `
    --timeout 60 `
    --set-env-vars "NODE_ENV=production" `
    --update-secrets "GEMINI_API_KEY=GEMINI_API_KEY:latest,EMAIL_USER=EMAIL_USER:latest,EMAIL_PASS=EMAIL_PASS:latest"

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Deployment Successful!" -ForegroundColor Green
    $URL = gcloud run services describe $SERVICE_NAME --platform managed --region $REGION --format 'value(status.url)'
    Write-Host "🌐 Service URL: $URL" -ForegroundColor Cyan
} else {
    Write-Host "❌ Deployment Failed!" -ForegroundColor Red
}

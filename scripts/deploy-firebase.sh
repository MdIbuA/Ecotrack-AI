#!/bin/bash
# EcoTrack AI - Firebase Hosting Deployment Script
# Prerequisites: Firebase CLI installed and authenticated

set -e

echo "🌿 EcoTrack AI - Firebase Hosting Deployment"
echo "=============================================="

# Build the frontend
echo "📦 Building frontend..."
cd client
npm run build

# Initialize Firebase if not already done
if [ ! -f "../firebase.json" ]; then
  echo "🔧 Initializing Firebase..."
  cd ..
  firebase init hosting --project "${FIREBASE_PROJECT_ID:?Set FIREBASE_PROJECT_ID}"
  cd client
fi

# Deploy to Firebase Hosting
echo "🚀 Deploying to Firebase Hosting..."
cd ..
firebase deploy --only hosting

echo ""
echo "✅ Frontend deployment complete!"

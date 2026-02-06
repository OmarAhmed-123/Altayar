#!/bin/bash

# Script to rebuild Android app after installing react-native-webview
# This ensures native modules are properly linked

echo "🔧 Rebuilding Android app for react-native-webview..."

# Step 1: Clean Gradle
echo "📦 Cleaning Gradle..."
cd android
./gradlew clean
cd ..

# Step 2: Remove build folders
echo "🗑️  Removing build folders..."
rm -rf android/app/build
rm -rf android/build
rm -rf android/.gradle

# Step 3: Clean Metro bundler cache
echo "🧹 Cleaning Metro bundler cache..."
rm -rf node_modules/.cache

# Step 4: Rebuild
echo "🔨 Rebuilding app..."
cd android
./gradlew assembleDebug
cd ..

echo "✅ Rebuild complete! Now run: npx react-native run-android"


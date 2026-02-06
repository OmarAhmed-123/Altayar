#!/bin/bash

echo "========================================"
echo "Fixing react-native-video Native Module"
echo "========================================"
echo ""

echo "[1/7] Cleaning node_modules..."
rm -rf node_modules package-lock.json
echo "Done."
echo ""

echo "[2/7] Reinstalling dependencies..."
npm install
echo "Done."
echo ""

echo "[3/7] Installing react-native-video..."
npm run install:video
echo "Done."
echo ""

echo "[4/7] Cleaning Android build..."
cd android
./gradlew clean
cd ..
echo "Done."
echo ""

echo "[5/7] Cleaning Gradle cache..."
cd android
rm -rf .gradle app/build build
cd ..
echo "Done."
echo ""

echo "[6/7] Rebuilding Android project..."
cd android
./gradlew assembleDebug
cd ..
echo "Done."
echo ""

echo "[7/7] Starting Metro bundler with reset cache..."
npx metro start --reset-cache --host 0.0.0.0 &
echo "Done."
echo ""

echo "========================================"
echo "Fix complete! Please run:"
echo "  npx react-native run-android"
echo "========================================"


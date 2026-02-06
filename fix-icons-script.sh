#!/bin/bash

echo "========================================"
echo "Fixing React Native Vector Icons"
echo "========================================"

echo ""
echo "Step 1: Creating assets/fonts directory..."
mkdir -p android/app/src/main/assets/fonts

echo ""
echo "Step 2: Copying fonts from node_modules..."
if [ -d "node_modules/react-native-vector-icons/Fonts" ]; then
    cp -R node_modules/react-native-vector-icons/Fonts/* android/app/src/main/assets/fonts/
    echo "Fonts copied successfully!"
else
    echo "ERROR: Fonts directory not found in node_modules!"
    echo "Please run: npm install react-native-vector-icons"
    exit 1
fi

echo ""
echo "Step 3: Cleaning Android build..."
cd android
./gradlew clean
cd ..

echo ""
echo "========================================"
echo "Fix completed!"
echo "========================================"
echo ""
echo "Next steps:"
echo "1. Run: npm start -- --reset-cache"
echo "2. Run: npm run android"
echo ""


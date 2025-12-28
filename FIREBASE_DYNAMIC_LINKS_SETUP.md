# Firebase Dynamic Links Setup Guide

## Overview
This guide explains how to set up Firebase Dynamic Links for the Altayar app to create shareable links that work on both web and mobile.

## Step 1: Firebase Console Setup

1. Go to [Firebase Console](https://console.firebase.google.com/project/altayar-46d6f/durablelinks)
2. Navigate to **Dynamic Links** section
3. Click **Get Started** or **Create Link**
4. Set up your domain:
   - Option A: Use Firebase's default domain (e.g., `altayar.page.link`)
   - Option B: Use your custom domain (requires DNS configuration)

## Step 2: Get Firebase API Key

1. Go to Firebase Console > Project Settings > General
2. Scroll down to **Your apps** section
3. Find **Web API Key** (or create a web app if not exists)
4. Copy the API Key

## Step 3: Configure Backend

1. Add to your `.env` file:

```env
FIREBASE_API_KEY=your-firebase-api-key-here
FIREBASE_DYNAMIC_LINKS_DOMAIN=altayar.page.link
DEEP_LINK_BASE_URL=https://altayar.com
LANDING_PAGE_URL=https://altayar.com
ANDROID_PACKAGE_NAME=com.example.Altayar
IOS_BUNDLE_ID=com.example.Altayar
IOS_APP_STORE_ID=your-ios-app-store-id
```

2. Restart the backend server

## Step 4: Test Dynamic Links

### Create a Dynamic Link via API

```bash
POST /api/deep-links/share
Authorization: Bearer <token>
Content-Type: application/json

{
  "type": "package",
  "id": "123",
  "title": "Amazing Package",
  "description": "Check out this amazing travel package",
  "imageUrl": "https://altayar.com/uploads/images/package.jpg",
  "params": {
    "source": "share"
  }
}
```

### Response

```json
{
  "success": true,
  "data": {
    "deepLink": "https://altayar.com/package/123",
    "customSchemeLink": "altayar://open/package/123",
    "webFallbackUrl": "https://altayar.com/packages/123",
    "firebaseDynamicLink": "https://altayar.page.link/xxxxx",
    "shareableUrl": "https://altayar.page.link/xxxxx",
    "metadata": {
      "title": "Amazing Package",
      "description": "Check out this amazing travel package",
      "imageUrl": "https://altayar.com/uploads/images/package.jpg",
      "type": "package",
      "id": "123"
    }
  }
}
```

## Step 5: Configure Mobile Apps

### Android

1. Add package name in Firebase Console > Project Settings > Your apps > Android
2. Download `google-services.json` and place in `android/app/`
3. Update `AndroidManifest.xml` (already configured)

### iOS

1. Add bundle ID in Firebase Console > Project Settings > Your apps > iOS
2. Download `GoogleService-Info.plist` and place in `ios/Runner/`
3. Update `Info.plist` (already configured)

## Step 6: Flutter App Configuration

1. Run `flutter pub get` to install dependencies
2. Run `flutterfire configure` to set up Firebase
3. The app will automatically use Firebase Dynamic Links

## How It Works

1. **User shares content**: App calls `/api/deep-links/share`
2. **Backend creates link**: Backend creates Firebase Dynamic Link
3. **Short link returned**: User gets short, shareable link
4. **Link clicked**:
   - If app installed: Opens app directly
   - If app not installed: Opens web version or app store
   - On web: Opens web version

## Supported Content Types

- `package` - Travel packages
- `trip` - Trips
- `booking` - Bookings
- `voucher` - Vouchers
- `membership` - Memberships
- `profile` - User profiles
- `blog` - Blog posts

## Troubleshooting

1. **API Key not working**: Verify key in Firebase Console
2. **Links not opening app**: Check Android/iOS configuration
3. **Web fallback not working**: Verify `LANDING_PAGE_URL` is correct
4. **Short links not generating**: Check Firebase API key and domain

## Security Notes

- Keep Firebase API Key secure (use environment variables)
- Use `UNGUESSABLE` suffix option for sensitive links
- Set expiration times for temporary links
- Monitor link usage in Firebase Console


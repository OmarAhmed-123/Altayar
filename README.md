# Altayar
A comprehensive professional system that combines membership management, travel bookings, an electronic wallet, and direct communication

# ALTAYAR - Integrated Loyalty and Tourism Platform 🌟

**A comprehensive professional system combining membership management, tourism bookings, electronic wallet, and direct communication.**

---

## 📌 Overview

ALTAYAR is an integrated platform offering comprehensive solutions for membership and loyalty management in the tourism sector:

- **Frontend:** Flutter/Dart Multi-platform mobile application (Android, iOS, Web)
- **Backend:** Node.js + Express + PostgreSQL
- **Paths:**
  - Frontend: `E:\AltayarFlutter\Altayar`
  - Backend: `E:\Altayar-app\Altayar-app-final\backend`

---

## ✨ Key Features

### 🎯 For Customers
- ✅ **Tiered Membership System** (Silver, Gold, Platinum, VIP, Diamond, Business)
- ✅ **Electronic Wallet** for tracking points and cashback
- ✅ **Comprehensive Booking** (Trips, Hotels, Flights, Nile Cruises)
- ✅ **Vouchers & Rewards** (SPA, Dinner, Gym, Dental Care...)
- ✅ **Referral System** to earn rewards for inviting friends
- ✅ **Interactive Content** (Blogs, Short Videos "Reels")
- ✅ **Live Chat + Smart Chatbot** powered by Gemini AI

### 💼 For Management & Sales
- ✅ **Comprehensive Dashboard** with real-time statistics
- ✅ **User & Role Management** (RBAC)
- ✅ **CRM Tools** to view customer data and send offers
- ✅ **Quotation System** for professional price quotes
- ✅ **Detailed Financial Reports** with PDF invoice generation
- ✅ **Ad Management** with customer notifications

---

## 🚀 Quick Start

### Prerequisites
- **Backend:** Node.js ≥18, PostgreSQL ≥14
- **Frontend:** Flutter ≥3.24, Dart ≥3.4

### 1. Run Backend

```bash
cd E:\Altayar-app\Altayar-app-final\backend
npm install
npm run migrate
npm start
```

### 2. Run Frontend

```bash
cd E:\AltayarFlutter\Altayar
flutter pub get
flutter run --dart-define=API_BASE_URL=http://localhost:5000/api
```

> **Note:** For Android Emulator use `http://10.0.2.2:5000/api`

---

## 📚 Complete Documentation

| Document | Description |
|---------|-------|
| [INTEGRATION_GUIDE.md](INTEGRATION_GUIDE.md) | Comprehensive integration guide between Frontend and Backend |
| [API_ENDPOINTS.md](API_ENDPOINTS.md) | Quick reference for all APIs |
| [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) | Deployment and production guide |

---

## 📱 Frontend (Flutter)

The Flutter interface is designed to manage the ALTAYAR membership and loyalty system.
The code is ready for direct connection with the backend located at `E:\Altayar-app\Altayar-app-final\backend`.

## Completed Features

- Professional dashboard displaying membership packages (Silver, Gold, Platinum, VIP, Diamond, Business).
- Interactive digital membership card showing level, points, and cashback data.
- Instant analytics section showing points and cashback performance using `fl_chart`.
- Integrated Referral system with invitation sending and user code display.
- Professional state management using `provider` + `MultiProvider`.
- Unified network layer via `ApiClient` configurable through `--dart-define=API_BASE_URL`.
- User & Role Management Module (RBAC) including:
  - Secure Login (Email/Password + Google/Apple OAuth).
  - Full User Management Dashboard with filters, role changes, and manual gifting (points/cashback/vouchers).
  - Interactive Employee Profile showing performance and security indicators (2FA, digital signature).
  - Dynamic Permission Matrix pulled directly from backend with live role activity monitoring.
- Membership Module Expansion:
  - Full integration with Fawaterak (generate invoice, open payment link, verify status before activation).
  - Interactive Checkout screen with payment state persistence and auto-subscription after confirmation.
  - Management of prices and points/cashback ratios for each package via Admin Panel.
  - Download Digital Certificate/QR directly from server with one click.
- Booking Engine Module:
  - Support for all required categories (Tour, Nile Cruise, Flight Ticket, Hotel Booking, Transfers, Nile Trips, General Tours, Custom Request).
  - Full Lifecycle (Pending → Confirmed → Paid → Completed → Cancelled) via `GET/POST/PUT /bookings`.
  - Built-in dashboard showing admin bookings and 'My Bookings' with status/category filters and search.
  - Custom request creation sheet and details screen showing Status Timeline and Upgrade/Cancel actions.
- Booking Management Improvements:
  - Support for uploading images and attachments directly from UI using `multipart/form-data`.
  - Participants field and pre-configured inputs for all request data before submission.
- Packages & Offers Module:
  - Attractive grid display, advanced filters (destination, price, duration), and Exclusive Badge support.
  - Ability to add packages to Favorites (saved locally via SharedPreferences).
- Trip Maker Module:
  - Interactive tool to build a daily schedule (destination, hotel, transport, activities).
  - Save as Draft button or send for pricing via `/trips` and `/trips/status/:id`.
  - Visual representation for each day with dropdowns and Chips for common activities.
- Activities & Order History Module:
  - Customer screen showing all bookings from `/bookings/myactivities` with current status, invoice/tickets, and dates.
  - Time filters (Today, Last Week, Last Month) with instant alert after adding any new booking.
  - Auto-refresh after creating any booking (Provider reloads data immediately upon success).
- Sales & CRM Lite Module:
  - Filtered customer list (role=customer) displaying points, membership, and total spending.
  - Full customer profile view including recent bookings and sent quotations.
  - "Send Offer" button creates instant notification via `/notifications` to target selected customer.
  - Professional Quotation creation form (`/quotations`) with dynamic elements, discount, and validity, with auto-sending (Email + Notification).
- Accounting & Wallet Module:
  - Consuming `/transactions` to display payment history (memberships, bookings, cashback) with transaction type filters.
  - Wallet card displaying points balance, cashback, total spending, and historical earned points/cashback using `/memberships/card/my` data.
  - Referrals dashboard showing summary from `/referrals/summary` with invite friend button calling `/referrals/invite`.
- Content & Engagement Module:
  - Blog section based on `/blogs` allowing like, share, and opening unified comment system.
  - Reels interface (short videos) using same API with `isReel=true`, internal video player, and like/comment/share support.
  - Unified Comment System `/comments` now linked to Blogs, Reels, and Travel Packages (from package details sheet).
- Communication & Support Module:
  - Messenger-like Chat Center supporting conversation list, message window, and attachments (images/files) via `/chat` and `/chat/message`.
  - Direct Chatbot button (Gemini) using `/chat/bot` and `/chat/gemini/bot`.
  - Built-in Notification Panel using `/notifications`, `/notifications/unread-count` with mark-as-read capability and new message alerts.
- Ad Management Module:
  - Admin interface to create/edit/delete ads with image upload and CTA links based on `/ads`.
  - "Send Notification" button sends the ad to customers via `/ads/send/:id`.
  - Regular users see an automatic Popup Carousel of active ads with link opening button upon entry.
- Reports Module:
  - Financial History screen displaying `/reports/payment-history` results with search and filtering by transaction type.
  - Invoice generation card calls `/reports/invoice/:bookingId` to open PDF directly, plus option to download comprehensive financial report.
- Settings & UI:
  - New Admin `SettingsPage` allows Super Admin to modify global platform settings (Name, Email, Currency, Maintenance Mode) via `/settings/general`.
  - Full Frontend Page Management (Create/Edit/Delete/Preview) with auto-slug generation and publishing states relying on `/settings/pages`.
  - Modern Dashboard displaying `/dashboard/stats`, revenue chart, and shortcut buttons for each module.
  - Frontend Pages (Home, About Us, Contact Us, Membership Page, Terms & Privacy) in Landing Page style, content synchronized with CMS pages.
  - Full Language Switch Support (Arabic/English) with preference saving, Google Fonts, and Identity Colors (#2265C3, #19B6E8, #1D231F, #000).
- Vouchers & Rewards System:
  - Consuming `/vouchers/my` and `/vouchers/admin` with status and type filtering.
  - Interactive cards displaying code, value, status, and expiry date with direct activation button.
  - Admin sheet to grant manual vouchers (Dinner, Breakfast, SPA, Gym, Dental, Makeup...) specifying customer, value, and expiry.
  - All operations use Token via `ApiClient` to ensure secure access and Super/Admin/Sales permissions only.

## Project Execution

```bash
cd E:\AltayarFlutter\Altayar
flutter pub get
flutter run --dart-define=API_BASE_URL=http://localhost:5000/api
```

> **Note:** When working from Android Emulator use `10.0.2.2` instead of `localhost` (handled automatically inside `AppConfig`).

### Running App on USB Connected Device

1. **Run Backend (Port 5000):**
   ```bash
   cd E:\Altayar-app\Altayar-app-final\backend
   npm install
   npm start
   ```
2. **Install Flutter dependencies** (Once):
   ```bash
   cd E:\AltayarFlutter\Altayar
   flutter pub get
   ```
3. **Enable USB debugging** on Android phone, connect to PC and use:
   ```bash
   flutter devices
   ```
   To copy the displayed `deviceId` (e.g., `R58T12345`).
4. **Determine Backend Address** on local network (IPv4 address from `ipconfig`, e.g., `192.168.1.40`).
5. **Run App on Phone:**
   ```bash
   flutter run -d <deviceId> --dart-define=API_BASE_URL=http://192.168.1.40:5000/api
   ```
   Ensure phone and PC are on the same network and port 5000 is open in firewall.
6. **When switching devices or restarting**, just repeat step 5 as long as Backend is running on the same address.

> The above steps can be shortened via `run_app.bat` file in project root, which stops old Gradle, cleans cache, sets `GRADLE_USER_HOME`, then runs `flutter run` on connected device passing appropriate `API_BASE_URL`.

## Folder Structure

- `lib/core`: Theme, Network, General Utilities.
- `lib/features/membership`: Data Models, Repository, Providers, Membership UI.
- `lib/main.dart`: Entry point and global provider setup.

## Backend Integration

- Consumes `GET /memberships`, `GET /memberships/card/my`, `POST /memberships/subscribe`.
- Prepared endpoints for referrals via `referrals/summary` and `referrals/invite`.
- Headers (e.g., JWT) customizable via `ApiClient` update.

## Requirements

- Flutter 3.24 or higher.
- Dart 3.4 or higher.
- Ready Backend running on same network (or via VPN if applicable).

---

## 🛠️ Technologies Used

### Frontend
- **Framework:** Flutter 3.24+
- **State Management:** Provider
- **Networking:** HTTP + ApiClient (Unified)
- **UI Libraries:** cached_network_image, carousel_slider, fl_chart
- **Authentication:** JWT + Google/Apple OAuth
- **Video:** video_player
- **File Upload:** image_picker, file_picker

### Backend
- **Runtime:** Node.js 18+
- **Framework:** Express.js
- **Database:** PostgreSQL 14+
- **Authentication:** JWT + Passport.js
- **Payment Gateway:** Fawaterak
- **AI Chatbot:** Google Gemini API
- **Real-time:** Socket.IO
- **File Upload:** Multer
- **PDF Generation:** PDFKit

---

## 🔐 Security

- ✅ **JWT Authentication** for all sensitive requests
- ✅ **Role-Based Access Control (RBAC)** for permissions
- ✅ **Rate Limiting** to protect APIs
- ✅ **CORS Configuration** precisely defined
- ✅ **Input Validation** on all inputs
- ✅ **SQL Injection Protection** using Parameterized Queries
- ✅ **HTTPS/SSL** in production environment

---

## 📊 Statistics

- **Modules:** 13 Complete Modules
- **APIs:** 100+ Endpoints
- **Screens:** 40+ Pages and Interfaces
- **Supported Roles:** Customer, Sales, Admin, Super Admin, Accountant, Marketing
- **Languages:** Arabic, English (Extensible)

---

## 👥 Roles & Permissions

| Role | Description | Permissions |
|-------|-------|-----------|
| **Customer** | Regular Customer | Bookings, Memberships, Wallet, Chat |
| **Sales** | Sales Employee | Customer Management, Offers, Manual Vouchers |
| **Admin** | System Manager | All permissions except User Management |
| **Super Admin** | Top Manager | Full permissions without restrictions |
| **Accountant** | Accountant | Financial Reports, Invoices |
| **Marketing** | Marketing | Ad Management, Content |

---

## 🌐 Support

### Contact
- **WhatsApp:** [Click Here](https://wa.me/201234567890)
- **Email:** support@altayar.com
- **Website:** https://altayar.com

### Technical
In case of technical issues:
1. Check Server Logs
2. Check Flutter Console
3. Use Postman to test APIs
4. Review [INTEGRATION_GUIDE.md](INTEGRATION_GUIDE.md)

---

## ✅ Current Status

✅ **All modules completed and production-ready**
✅ **Code organized and professionally documented**
✅ **Frontend-Backend integration tested and secure**
✅ **Ready for deployment to Google Play & App Store**

---

## 📝 License

This project is Copyright © 2024 ALTAYAR

---

## 🎉 Special Thanks

This system was developed to the highest quality and professional standards to provide an exceptional experience for customers and management.

**System Ready for Launch! 🚀**

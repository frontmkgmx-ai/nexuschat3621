# Nexus Chat

A robust real-time messenger application built with React, Tailwind CSS, Firebase, and Supabase featuring S3-native media uploads, status stories, real-time sync, and user profile management.

## 🚀 Features

- **Real-time Messaging**: Instant message delivery with Firebase Realtime Database & Firestore.
- **Media Uploads**: S3-native media uploads leveraging Supabase Storage.
- **Status Stories**: WhatsApp-style expiring status updates.
- **User Profiles**: Custom avatars and presence (online/idle/offline) tracking.
- **Responsive Design**: Mobile-first UI using Tailwind CSS.

## 🛠️ Tech Stack

- **Frontend**: React 19, Vite, Tailwind CSS, Lucide React
- **Backend/Services**: Node.js/Express, Firebase (Firestore & RTDB), Supabase Storage (S3-compatible)
- **Real-time Engine**: Firebase & WebRTC
- **Animations**: Motion

## ⚙️ Getting Started

### Prerequisites

- Node.js (v18+ recommended)
- npm or yarn
- Firebase Project
- Supabase Project (for S3 storage)

### Installation

1. Clone the repository:
   ```bash
   git clone <your-repo-url>
   cd <your-repo-directory>
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Environment Setup:
   Copy `.env.example` to `.env` and fill in your keys:
   ```bash
   cp .env.example .env
   ```
   *Make sure you provide the credentials for Firebase, Supabase S3, and Google Auth.*

### Running the App

Start the development server with Hot-Module Replacement (HMR):
```bash
npm run dev
```

The app will be available at [http://localhost:3000](http://localhost:3000).

### Building for Production

Compile the TypeScript and build the Vite bundle:
```bash
npm run build
```

The compiled static files will be placed in the `dist` directory. You can run the production server using:
```bash
npm run start
```

## 📄 License

This project is open-source and available under the terms of the MIT License.

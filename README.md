# SocialPedia - Modern Social Network

A premium, full-stack social media application featuring real-time messaging, threaded comments, @mentions, and a high-end responsive UI.

## 🚀 Deployment Instructions

### Prerequisites
1. Create a **GitHub** repository and push this entire project to it.
2. Create a **MongoDB Atlas** account and get your connection string.

---

### 1. Backend Deployment (Render)
Render is perfect for hosting your Node.js API.

1.  **Create a New Web Service**: Connect your GitHub repository.
2.  **Root Directory**: Set this to `backend`.
3.  **Build Command**: `npm install`
4.  **Start Command**: `npm start`
5.  **Environment Variables**:
    *   `MONGODB_URI`: Your MongoDB Atlas connection string.
    *   `JWT_SECRET`: A long random string (e.g., `SocialPedia_Secret_2026`).
    *   `PORT`: `5000` (Render handles this automatically usually, but good to have).
6.  **Wait for Deploy**: Once finished, copy your **backend URL** (e.g., `https://socialpedia-api.onrender.com`).

---

### 2. Frontend Deployment (Vercel)
Vercel is the best choice for Vite/React applications.

1.  **New Project**: Select your GitHub repository.
2.  **Root Directory**: Set this to `frontend`.
3.  **Framework Preset**: Select `Vite`.
4.  **Environment Variables**:
    *   `VITE_API_URL`: Paste your **Render backend URL** here (no trailing slash).
5.  **Deploy**: Hit the deploy button.

---

## 🛠️ What to do Right Now?

1.  **Initialize Git**: 
    ```bash
    git init
    git add .
    git commit -m "Initial SocialPedia setup"
    ```
2.  **Create GitHub Repo**: Go to GitHub, create a new empty repo, and follow the instructions to `git remote add origin ...` and `git push`.
3.  **Deploy Backend**: Follow the Render steps above.
4.  **Deploy Frontend**: Follow the Vercel steps above once the backend is live.

---

## 🔄 How to update in the future?

### I. Making Code Changes
1.  Make your changes locally in the `frontend` or `backend` folders.
2.  Test them locally if possible.
3.  Commit and Push:
    ```bash
    git add .
    git commit -m "Describe your update"
    git push origin main
    ```
4.  **Automatic Deployment**: Both Render and Vercel will detect the push to GitHub and automatically start a new "Build." Your changes will be live in a few minutes.

### II. Adding New Environment Variables
If you add a new feature that needs a secret key (like an image upload service):
1.  Add it to your local `.env` files.
2.  Go to the Render/Vercel dashboard for your project.
3.  Go to **Settings** -> **Environment Variables**.
4.  Add the new key and value there.
5.  Trigger a manual "Redeploy" if it doesn't happen automatically.

---

## 🎨 Branding Note
The application uses an integrated **S<Logo />cialPedia** branding.
*   The logo background is forced to **White** for visibility across all themes.
*   To change the logo size, modify the `size` prop in `Navbar.jsx`, `Login.jsx`, or `ChatWidget.jsx`.

---
&copy; 2026 - Present. All rights reserved to **Rupam Roy**

# AI Resume Screening Tool

A comprehensive, fully offline, and transparent AI-powered Resume Screening Tool. This tool allows recruiters to upload multiple resumes, compare them against customizable job descriptions, and get detailed, explainable rankings.

## 🚀 Features

- **Multi-Format Support**: Parse text from PDF, DOCX, and TXT files.
- **Customizable Scoring**: Adjust keyword weights and balance between Skills, Experience, and Education.
- **Explainable AI**: No black-box decisions. View exactly why a candidate matched (or didn't) with context snippets from their resume.
- **Pro Dashboard**: Clean, modern dark UI with glassmorphism aesthetics.
- **Export Reports**: Generate professional Excel and PDF screening reports.
- **Job Profiles**: Save and load criteria for different roles.

## 📦 Deployment

This project is pre-configured for easy deployment to **Railway** or **Render**.

### Option 1: Railway (Recommended)
1. Install [Railway CLI](https://docs.railway.app/guides/cli).
2. Run `railway login`.
3. Run `railway link` to connect to your project.
4. Run `railway up` to deploy.
5. **Persistence**: In the Railway dashboard, add a **Mount** to `/app/backend/data` to keep your SQLite database across deploys.

### Option 2: Render
1. Connect your GitHub repository to [Render](https://render.com).
2. Create a new **Web Service**.
3. Use the following settings:
   - **Environment**: `Python`
   - **Build Command**: `pip install -r backend/requirements.txt`
   - **Start Command**: `gunicorn --chdir backend app:app`
4. **Persistence**: Add a **Persistent Disk** mounted at `/backend/data`.

### Option 3: Vercel
1. Connect your repository to [Vercel](https://vercel.com).
2. The included `vercel.json` will automatically configure the build.
3. > [!CAUTION]
   > SQLite data will **NOT persist** on Vercel. Every time the app goes idle, your saved job profiles will be reset. This is only recommended for demonstration purposes.

## 🛠️ Tech Stack

- **Frontend**: HTML5, Vanilla CSS (Custom Design System), JavaScript (Modular SPA).
- **Backend**: Python, Flask, SQLite.
- **Infrastructure**: Gunicorn (for production).

## 💻 Local Setup & Installation

### 1. Prerequisites
- Python 3.8 or higher installed on your machine.

### 2. Install Dependencies
`pip install -r backend/requirements.txt`

### 3. Run Locally
Navigate to the `backend` folder and start the server:
`python backend/app.py`
The tool will be available at `http://localhost:5000`.

---
Developed with ❤️ for recruiters who value transparency and data privacy.

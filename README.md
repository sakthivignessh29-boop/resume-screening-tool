# 📄 AI Resume Screening Tool

## 🚀 Overview

The **AI Resume Screening Tool** is a smart recruitment system that automates resume analysis and candidate ranking using rule-based AI logic. It helps recruiters quickly filter candidates based on job descriptions, saving time and improving hiring accuracy.

---

## 🛠️ Tech Stack

### 🎨 Frontend

* HTML5
* Vanilla CSS (Custom Design System)
* JavaScript (Modular SPA Architecture)

### ⚙️ Backend

* Python
* Flask
* SQLite

### 📄 Parsing Libraries

* pdfplumber (PDF extraction)
* python-docx (Word document parsing)

### 📦 Export Tools

* openpyxl (Excel export)
* reportlab (PDF report generation)

---

## 📦 Setup & Installation

### 1. Prerequisites

* Python **3.8 or higher**

---

### 2. Install Dependencies

Run this in the project root:

```bash id="k8xq21"
pip install -r backend/requirements.txt
```

---

### 3. Run Backend

Navigate to backend folder:

```bash id="p9d2ks"
python backend/app.py
```

📍 Backend runs at:

```
http://localhost:5000
```

---

### 4. Run Frontend

Simply open:

```
frontend/index.html
```

in any modern browser (Chrome / Edge / Firefox)

---

## 🔍 How to Use

### 📤 1. Upload Resumes

Go to **Upload Resumes** tab and drag & drop candidate files.

---

### 🧠 2. Define Job Criteria

* Paste job description in **Job Profiles**
* Click **Auto-Generate Keywords** or add manually

---

### ⚖️ 3. Weighting System

Adjust sliders to prioritize skills:

* Experience (e.g., 50% for senior roles)
* Skills
* Education
* Keywords

---

### 🚀 4. Run Analysis

Click:

```
Run Screen Analysis
```

---

### 📊 5. View Results

* View ranked candidates
* Click **Analyze** for detailed breakdown

---

### 📁 6. Export Results

Export reports as:

* 📊 Excel (openpyxl)
* 📄 PDF (reportlab)

---

## 🌐 Prototype / Demo

👉 **Live Prototype / Demo Link:**
🔗 https://your-prototype-link-here.com

*(Replace this with: localhost link, hosted app, or video demo)*

---

## 📁 Project Structure

```id="z7q1pl"
resume-screening-tool/
│── frontend/
│   ├── index.html
│   ├── style.css
│   └── app.js
│
│── backend/
│   ├── app.py
│   ├── requirements.txt
│
│── data/
│── exports/
│── README.md
```

---

## 🔮 Future Improvements

* 🤖 NLP-based semantic matching
* ☁️ Cloud deployment (AWS / Render / Vercel)
* 📊 Dashboard analytics
* 🔐 User authentication system

---

## 👩‍💻 Author

**Sakthi Vignessh T**

---

## ⭐ Note

## This project is built as a **prototype for hackathons and academic evaluation**, demonstrating full-stack integration and intelligent resume screening workflow.


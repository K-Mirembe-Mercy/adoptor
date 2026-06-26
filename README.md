# AdaptIQ — Adaptive Learning Platform 🧠⚡

> **Hackathon 2025** · Built by **Kafeero Mirembe Mercy** & **Kukiriza Samuel**

AdaptIQ is an AI-powered adaptive learning platform that creates a personalized learning experience for every individual. Unlike static curricula, AdaptIQ adjusts lesson depth, quiz difficulty, and tutoring style in real-time based on how you learn.

---

## 🌐 Live Demo

**[ https://k-mirembe-mercy.github.io/adoptor/]
(https://k-mirembe-mercy.github.io/adoptor/)**

---

## ✨ Features

| Feature | Description |
|---|---|
| 🧠 **Adaptive Curriculum** | AI-generated lessons that adapt to your knowledge level |
| 🤖 **AI Tutor** | Live chat with Gemini or Featherless AI |
| 🎯 **Smart Quizzes** | Auto-generated assessments targeting your knowledge gaps |
| 📊 **Progress Tracking** | XP system, mastery rings, and activity logs |
| 🪶 **Multi-Model** | Switch between Gemini and 100+ Featherless AI models |
| 🔒 **Privacy First** | API keys stored locally only, never sent to our servers |

---

## 🚀 Deploying to GitHub Pages

### Option 1: Direct Upload
1. Create a new GitHub repository (e.g. `adaptiq`)
2. Upload `index.html`, `styles.css`, and `app.js`
3. Go to **Settings → Pages → Source: Deploy from branch → main / root**
4. Your site will be live at `https://yourusername.github.io/adaptiq`

### Option 2: GitHub CLI
```bash
git init
git add .
git commit -m "AdaptIQ — Build woth AI Hackathon 2026"
gh repo create adaptiq --public
git push -u origin main
# Enable Pages in GitHub settings
```

---

## 🔑 Getting API Keys

### Gemini API Key (Required)
1. Go to [https://aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey)
2. Sign in with Google
3. Click "Create API Key"
4. Copy and paste it into AdaptIQ's setup screen

### Featherless AI Key (Optional — unlocks 100+ models)
1. Go to [https://featherless.ai](https://featherless.ai)
2. Create an account
3. Navigate to API Keys section
4. Create and copy your key

---

## 🏗️ Architecture

```
AdaptIQ (Static SPA)
├── index.html          — Structure & markup
├── styles.css          — Full design system
└── app.js              — All logic:
    ├── State management (localStorage)
    ├── Gemini API integration
    ├── Featherless AI integration
    ├── Lesson generation
    ├── Quiz engine
    ├── AI Tutor chat
    └── Progress tracking
```

**No backend. No build step. Pure HTML/CSS/JS.**  
Runs entirely in the browser. Deploy to any static host.

---

## 🧪 Tech Stack

- **Frontend:** Vanilla HTML5, CSS3, JavaScript (ES6+)
- **AI Engines:** Google Gemini 1.5 Flash, Featherless AI (OpenAI-compatible)
- **Fonts:** Space Grotesk, Inter, JetBrains Mono
- **Hosting:** GitHub Pages

---

## 👥 Team

| Name | Role |
|---|---|
| **Kafeero Mirembe Mercy** | Lead Developer & UI/UX Design |
| **Kukiriza Samuel** | AI Integration & Product Strategy |

---

## 📄 License

MIT License — Free to use, modify, and build upon.

---

*Built for the 2026 Build with AI Hackathon · AdaptIQ makes learning feel like it was made just for you.*

# 🧑‍💻 Avatar Tutor – AI-Powered Interactive Avatar Teacher

> 🎓 A hackathon project that brings **human-like interactivity** to online learning with a talking, expressive AI avatar.
---

## 👥 Team Information





Team Name: Teachnify 

Project Name: Avatar Tutor – AI-Powered Interactive Teaching Assistant


Team ID: ET13  

Hackathon Track: IEEE AI in Education 2025  

Team Members:
1. 👩‍💻 Isha Karnawat  
2. 👩‍💻 Rachana Hinge  
3. 👨‍💻 Sushant Kakade  

---

## 🚩 Problem Statement

📚 Online learning platforms are powerful, but they still lack human-like engagement and real-time interaction.  
Students often face these challenges:

- ⏳ Limited access to instructors outside class hours
- 🖼️ Static, non-interactive teaching content
- ⏱️ Lack of adaptive, instant feedback
- 💔 Weak emotional connection with digital learning

👉 These gaps reduce motivation, hinder doubt-solving, and lower retention rates.

---

## 💡 Project Abstract

Avatar Tutor is an AI-powered interactive teaching assistant that delivers 24/7 personalized learning through a lifelike 3D avatar.  
It listens, understands, and responds just like a human teacher — combining voice, expressions, and gestures for emotionally intelligent learning.

Highlights:

- Conversational, voice-enabled AI tutor
- Emotionally expressive 3D avatar
- Real-time speech & lip-sync synchronization
- Adaptive feedback based on learner input
- Scalable for multiple languages & subjects

🎯 Goal: To create a human-like AI teacher that bridges engagement gaps and improves learning outcomes in digital education.

---

## 💡 Our Solution

We built Avatar Tutor – a system that fuses cutting-edge Generative AI, **speech synthesis, and **3D animation to create an emotionally aware teaching experience.

👩‍🏫 Think of it as a virtual teacher — one that listens, speaks, smiles, and provides adaptive guidance 24/7.

### ✨ Key Features

- 🎤 Voice Interaction: Speak naturally; the AI listens and replies instantly.
- 🗣️ Human-like Avatar: Real-time expressions & gestures for natural conversation.
- 🧠 AI Brain: Powered by Google Gemini + LangChain for contextual learning.
- 🔊 Voice Output: ElevenLabs generates realistic human-like voices.
- 👄 Lip-Sync Engine: Rhubarb Lip Sync ensures perfect mouth movements.
- 🧏 Personalized Tutor: Adapts to each student’s pace and understanding.

---

## ⚙️ How It Works

The system adapts based on Text Input ✍️ or Audio Input 🎙️.

### 🔹 Text Input Workflow

1. ⌨️ Student enters a query.
2. 🤖 Gemini generates a natural, context-aware response.
3. 🔊 ElevenLabs converts response text → voice.
4. 👄 Rhubarb generates lip-sync visemes.
5. 🧑‍🏫 Avatar displays synchronized speech & expressions.

### 🔹 Audio Input Workflow

1. 🎤 Student speaks to the mic.
2. 📝 Whisper transcribes audio → text.
3. 🤖 Gemini processes text → answer.
4. 🔊 ElevenLabs creates voice.
5. 👄 Rhubarb syncs mouth movement.
6. 🧑‍🏫 Avatar responds with emotion & gestures.

<p align="center">
  <img src="resources/architecture.drawio.svg" alt="System Architecture" width="90%">
</p>

---

## 🧠 Tech Stack

| Component         | Technology                           | Function                                    |
| ----------------- | ------------------------------------ | ------------------------------------------- |
| 🧠 AI Engine      | Google Gemini + LangChain          | Generates intelligent teaching responses    |
| 🗣️ Speech-to-Text | OpenAI Whisper                     | Converts audio to text                      |
| 🔊 Text-to-Speech | ElevenLabs TTS                     | Produces realistic voice                    |
| 👄 Lip-Sync       | Rhubarb Lip-Sync                   | Generates visemes for accurate lip movement |
| 🎨 3D Frontend    | React + Three.js + Ready Player Me | Displays animated avatar                    |
| ⚙️ Backend        | Node.js + Express                  | Orchestrates APIs & manages data            |
| 💾 Config         | dotenv + Yarn                      | Environment & package management            |

---

## 🧾 Dataset Used

This system doesn’t rely on a fixed dataset — it dynamically interacts using real-time language model responses (Gemini/OpenAI APIs).  
However, it can be fine-tuned with educational content datasets in the future for subject-specific tutoring.

---

# 🚀 Getting Started

## ✅ Prerequisites

- [Google Gemini API Key](https://ai.google.dev/)
- [ElevenLabs API Key](https://elevenlabs.io/)
- [Rhubarb Lip-Sync](https://github.com/DanielSWolf/rhubarb-lip-sync/releases)
- [FFmpeg](https://ffmpeg.org/download.html)

---

## ⚡ Installation Steps

bash
# Clone the repository
git clone https://github.com/Ishakarnawat/InteractiveAvatar.git
cd digital-human


---

### 🔹 Backend Setup

bash
cd apps/backend

# Install backend dependencies
npm install

# Create .env file
touch .env


.env example:

env
# GEMINI
GEMINI_MODEL=gemini-2.5-flash
GEMINI_API_KEY=your_gemini_api_key_here

# ELEVEN LABS
ELEVEN_LABS_API_KEY=your_elevenlabs_key
ELEVEN_LABS_VOICE_ID=your_voice_id
ELEVEN_LABS_MODEL_ID=your_model_id


Run backend in dev mode:

bash
npm run dev


---

### 🔹 Frontend Setup

Open a new terminal:

bash
cd apps/frontend

# Install frontend dependencies
npm install

# Run frontend
npm run dev


## 👉 Now open [http://localhost:5173/](http://localhost:5173/) in your browser.

## 📸 Demo



https://github.com/user-attachments/assets/30315f6b-5938-4297-a715-5dc6ea64fd08



<video width="640" height="360" controls>
  <source src="https://github.com/user-attachments/assets/ae8b509c-88e1-474c-b5c5-36b7341f1ad7?" type="video/mp4">
  Your browser does not support the video tag.
</video>

---

## 📚 References

- 📖 [Monadical – Build a Avatar Tutor](https://monadical.com/posts/build-a-digital-human-with-large-language-models.html)
- 👄 [Rhubarb Lip-Sync](https://github.com/DanielSWolf/rhubarb-lip-sync)
- 🧑‍🎨 [Ready Player Me Docs](https://docs.readyplayer.me/ready-player-me/api-reference/avatars/morph-targets)
- 🎭 [Mixamo Animations](https://www.mixamo.com/)
- 🌐 [Ex-Human](https://exh.ai/#home)

---

Built for Hackathons. Designed for Learning. Powered by AI. 🚀

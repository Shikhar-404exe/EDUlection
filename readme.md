# 🗳️ EDUlection (DemocracyOS Lite)

### A Civic Intelligence & Election Simulation Dashboard

🚀 **Live Production URL:** [https://edulection-630258863198.asia-south1.run.app](https://edulection-630258863198.asia-south1.run.app)

---

## 📌 Overview
EDUlection is a high-fidelity, interactive platform designed to bridge the gap between complex civic processes and citizen understanding. Built for the Google Cloud Run environment, it serves as a "Civic Intelligence Assistant" that educates users on the voting journey, election scenarios, and regional political nuances through a modern, responsive interface.

---

## ✨ Core Features

### 🧠 Resilient Intelligence Assistant (Multi-Model)
The dashboard features a unique **Resilient AI Layer** that guarantees responses even during model outages.
- **Primary**: Google Gemini 1.5 Flash (optimized for speed/Hinglish).
- **Secondary**: Google Gemini 1.5 Pro (advanced reasoning fallback).
- **Final Fallback**: OpenAI GPT-3.5 Turbo (ensures 100% uptime).
- **Voice-Enabled**: Native "Read Aloud" accessibility (🔊) for all AI responses, optimized for English and Hindi.

### 🧭 Interactive Voting Journey
A 6-step gamified simulator that walks users through the lifecycle of a voter:
- Registration → List Verification → ID Checks → Booth Identification → Vote Casting → Success.
- Provides "Why this matters" educational context for every phase.

### 🎛️ Scenario Simulation Engine
A real-time outcome projector that allows users to adjust variables:
- **Turnout**, **Misinformation**, **Governance Satisfaction**, and **Local Issues**.
- Dynamic visualizations powered by **Chart.js**.
- Instant stability indexing and outcome explanations.

### 🌍 Regional Intelligence (State-Aware)
- **Horizontal State Slider**: Mobile-friendly selector for all 36 Indian regions.
- **Dynamic Context**: Automatically updates local issues, resource priorities, and AI context based on the selected state's profile (Urban, Industrial, Agricultural, or Mixed).

### 🛡️ Smart Misinformation Checker
- Direct interface to verify claims using rigorous, non-partisan AI fact-checking.
- Provides verdicts (True/False/Misleading) with 1-2 sentence logical explanations.

---

## 🛠️ Technical Stack & Architecture

### **Frontend (Public)**
- **Modern UI**: Tailwind CSS (CDN) with Glassmorphism aesthetic.
- **Visuals**: Chart.js for outcome and priority visualizations.
- **Resilience**: Safe-DOM access patterns and lazy-loading for all external dependencies.

### **Backend (Node.js/Express)**
- **API Strategy**: Direct Axios implementation with OpenRouter integration.
- **Security**: 
  - **Input Sanitization**: Global `sanitize()` utility to mitigate XSS.
  - **IAM Integration**: Configured for Google Cloud IAM permissions.
- **Observability**: **Google Cloud Logging** (Winston transport) for real-time production monitoring.

### **Deployment**
- **Platform**: Google Cloud Run (Serverless).
- **Region**: `asia-south1` (Mumbai) for low-latency local access.
- **CI/CD ready**: Configured for standard Git-to-Cloud-Run workflows.

---

## 🧪 Testing & Quality
- **Pseudo Unit Tests**: Automated health checks run on every page load (Sanitization, Logic, Data Integrity).
- **Manual Verification**: Extensive test cases documented in [tests.md](tests.md).
- **Accessibility**: High contrast, ARIA labels, and Voice Synthesis support.

---

## ⚠️ Disclaimer
EDUlection is an **educational simulator**. It does not provide real-time election results, political endorsements, or binding legal advice. All simulation scores are calculated based on mathematical models for educational demonstration.

---

## 👨‍💻 Author
**EDUlection Team** - *Building the future of civic awareness.*
⭐ *If you find this project helpful for civic education, consider giving it a star on GitHub!*

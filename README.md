# 🩺 DrGodly Web Telehealth CRM

> **Your self-hosted WhatsApp Telehealth Clinic & GLP-1 Weight Loss CRM — running on your own server.**

[![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)](#)
[![Docker](https://img.shields.io/badge/docker-ready-2496ED.svg)](#)
[![Setup](https://img.shields.io/badge/setup-1--command--install-success.svg)](#-deploy-it-yourself)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](#)

---

## 🤔 What is DrGodly Web Telehealth?

**DrGodly Web** is a complete, self-hosted WhatsApp Telehealth Clinic and GLP-1 Weight Loss CRM built for medical clinics, physicians, and D2C healthcare brands. Instead of paying monthly SaaS subscription fees, you run DrGodly Web on your own server (e.g. Hetzner CX23) with **100% ownership of your patient data and chat conversations**.

It connects to WhatsApp using a native **Baileys WebSockets Engine** (no Meta API fees required) and provides:

- 💬 **Shared Team WhatsApp Inbox**: Live chat with patients, voice note recording, and AI audio transcriptions.
- 📋 **20-Question GLP-1 Intake Wizard**: Clinical state machine calculating BMI, Metabolic Score (out of 100), Weekly Loss Rate, and Chance of Success %.
- 🩺 **3-Condition Medical Decision Engine**: Auto-qualifies eligible patients or auto-refers complex files directly to board-certified doctor Kalyan Chakravarthy Kalwa.
- 💊 **Medication Product Shot Dispatches**: Sends high-resolution product shot photos of **Wegovy 0.25mg Weekly Injection Pen (₹5,660)** or **Rybelsus 7mg Daily Tablets (₹3,300)** directly to patient WhatsApp.
- 💳 **Method B Payment Verification & QR Checkout**: Generates dynamic UPI QR checkout cards, accepts 12-digit UTR/screenshot proofs, and auto-dispatches a 24-hour delivery promise.
- 📦 **Admin Courier Tracking Engine**: Admin inputs courier name (e.g. *BlueDart*) and tracking AWB to auto-dispatch live courier tracking links.
- 🗂️ **Visual Kanban Patient Pipeline Board**: Drag-and-drop deals across 6 clinical stages (*Lead*, *Intake Started*, *Doctor Assessment*, *Payment Verified*, *Dispatched*, *Retained*).
- 📣 **Bulk Broadcast Campaigns & CSV Uploader**: OpenWA 3-step sanitized queue with anti-ban delay throttling (`minDelay: 2s`, `maxDelay: 5s`).
- 📝 **Interactive WhatsApp Template Builder**: Live iPhone 15 WhatsApp message template editor with variable placeholders (`{{1}}`, `{{2}}`).
- ↔️ **ForgeChat Collapsible Sidebar**: Collapsible navigation drawer (224px ↔ 68px toggle) with active page highlighting.

---

## ✨ Features Breakdown

| Feature Module | Capabilities |
| :--- | :--- |
| **Team Inbox** | Text, images, documents, PTT voice notes, AI audio transcriptions |
| **GLP-1 Intake Wizard** | 20 clinical questions, BMI calculator, metabolic score (out of 100), weekly loss estimation |
| **Medical Decision Engine** | 3 condition triggers, doctor referral routing to Dr. Kalyan |
| **Checkout & Payments** | Dynamic UPI QR card, Method B UTR/screenshot logger, 24hr dispatch promise |
| **Fulfillment & Tracking** | Admin payment verification, courier tracking link generator (BlueDart / Delhivery) |
| **Patient Pipeline** | Visual Kanban board with stage totals and drag-and-drop workflow |
| **Broadcast Campaigns** | Desktop CSV / Excel contact uploader, OpenWA digit sanitizer, anti-ban delay |
| **Template Builder** | Meta WhatsApp template editor with live iPhone 15 visual preview |

---

## 🚀 Deploy It Yourself (Hetzner CX23 / Ubuntu VPS)

DrGodly Web includes a ForgeChat-style **1-command installer script** (`install.sh`) and an automated **Caddy HTTPS proxy** container (`caddy:2-alpine`) that requests and renews free SSL certificates from Let's Encrypt automatically.

### 🖥️ Hetzner CX23 Server Installation

1. Rent a Hetzner CX23 Cloud Server (Ubuntu 22.04 / 24.04 LTS).
2. Open your Hetzner Web Console terminal and install Docker:
   ```bash
   apt update && apt install -y docker.io docker-compose-v2 git
   ```
3. Clone your GitHub repository and run the installer:
   ```bash
   mkdir -p /opt/drgodly-web && cd /opt/drgodly-web
   git clone <YOUR_GITHUB_REPO_URL> .
   ./install.sh clinic.drgodly.com
   ```

*(Replace `clinic.drgodly.com` with your actual domain or server IP address).*

---

## 📱 Connect Your WhatsApp

1. Open your browser to `https://clinic.drgodly.com` (or `http://YOUR_SERVER_IP:3000`).
2. Navigate to **Settings** ➔ **WhatsApp Pairing**.
3. Scan the generated WhatsApp QR Code using your phone's WhatsApp app (**Linked Devices** ➔ **Link a Device**).
4. Your WhatsApp is now connected! All incoming messages will automatically trigger the AI Intake Wizard.

---

## 🛠️ Management Commands

```bash
# View live container logs
docker compose -f docker-compose.yml -f docker-compose.prod.yml logs -f

# Check container health
docker compose -f docker-compose.yml -f docker-compose.prod.yml ps

# Update to latest version
git pull && ./install.sh clinic.drgodly.com
```

---

## 🔒 Security & Privacy

- All patient data and chat histories live **100% on your own server** in Neon Cloud PostgreSQL.
- Encryption at rest for WhatsApp auth state and session tokens.
- Secure NextAuth.js authentication for clinic staff login.

---

<div align="center">

**DrGodly Web Telehealth CRM** — Own Your Patient Data & WhatsApp Inbox.

</div>

# 🎙️ VaaniOS – AI-Powered Multilingual Voice Support Platform

**VaaniOS** is an AI-powered multilingual voice customer-support platform designed for Indian e-commerce businesses. It enables customers to communicate naturally through voice in multiple Indian languages and helps businesses automate complaint understanding, ticket creation, prioritization, and escalation.

Built using **Gnani AI Speech APIs, Gemini AI, MongoDB, Express.js, React.js, and Node.js**.

---

## 🚀 Key Features

- **Multilingual Speech Recognition:** Converts customer voice messages into text using Gnani AI Prisma V3.
- **AI-Powered Complaint Understanding:** Uses Gemini AI to identify customer intent, classify complaints, and extract important information.
- **Automated Ticket Generation:** Creates support tickets with category, priority, order ID, and requested action.
- **Smart Escalation:** Identifies complaints that require human support and records escalation reasons.
- **Clarification Handling:** Detects missing information and generates follow-up questions.
- **Multilingual Voice Responses:** Converts AI-generated responses into speech using Gnani AI Timbre V2.5.
- **Support Ticket Management:** Allows support teams to track and update ticket statuses.
- **Analytics Dashboard:** Displays conversation statistics, ticket distribution, resolution rates, and escalation metrics.

## 🛠️ Tech Stack

| Technology | Purpose |
|---|---|
| React.js | Frontend |
| CSS | UI styling |
| Node.js | Backend runtime |
| Express.js | REST API |
| MongoDB | Database |
| Mongoose | Database modeling |
| Gnani AI Prisma V3 | Speech-to-Text |
| Gemini AI | Complaint understanding and reasoning |
| Gnani AI Timbre V2.5 | Text-to-Speech |
| Multer | Audio file uploads |

## 🧠 AI Architecture

VaaniOS follows a voice-to-AI-to-voice workflow.

1. Customer records or uploads a voice message.
2. Gnani AI Prisma V3 converts speech into text.
3. Gemini AI analyzes the complaint and extracts structured information.
4. The backend creates a conversation record and support ticket in MongoDB.
5. The system determines whether clarification or human escalation is required.
6. Gnani AI Timbre V2.5 converts the response into audio.
7. Support teams can manage tickets through the dashboard.

## 🏗️ Project Structure

```text
vaanios/
│
├── client/
│   └── src/
│       ├── components/
│       ├── pages/
│       │   ├── Overview.jsx
│       │   ├── Conversations.jsx
│       │   ├── VoiceAssistant.jsx
│       │   ├── SupportTickets.jsx
│       │   └── Analytics.jsx
│       ├── App.jsx
│       ├── main.jsx
│       └── index.css
│
├── server/
│   ├── config/
│   │   └── db.js
│   ├── models/
│   │   ├── Conversation.js
│   │   └── SupportTicket.js
│   ├── services/
│   │   └── geminiService.js
│   ├── .env
│   ├── .gitignore
│   ├── server.js
│   └── package.json
│
└── README.md
```

## ⚙️ Installation and Setup

### 1. Clone the repository

```bash
git clone https://github.com/2006simranjeet1997-spec/vaanios.git
cd vaanios
```

### 2. Install frontend dependencies

```bash
cd client
npm install
```

### 3. Install backend dependencies

Open another terminal:

```bash
cd vaanios/server
npm install
```

### 4. Configure environment variables

Create a `.env` file inside the `server` directory.

```env
PORT=5001
MONGODB_URI=your_mongodb_connection_string
GNANI_API_KEY=your_gnani_api_key
GEMINI_API_KEY=your_gemini_api_key
```

**Important:** Never upload API keys or your `.env` file to GitHub.

### 5. Start the backend

From the `server` directory:

```bash
node server.js
```

Backend runs locally at:

`http://localhost:5001`

Deployed backend:

`https://vaanios-backend.onrender.com`

### 6. Start the frontend

From the `client` directory:

```bash
npm run dev
```

Open the local URL displayed by Vite, usually:

`http://localhost:5173`

## 🔗 API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| GET | `/` | Backend health check |
| GET | `/api/config-check` | Checks Gnani API configuration |
| POST | `/api/stt` | Speech-to-Text transcription |
| POST | `/api/understand` | AI complaint analysis and ticket creation |
| POST | `/api/tts` | Text-to-Speech generation |
| GET | `/api/conversations` | Fetch conversations |
| GET | `/api/tickets` | Fetch support tickets |
| PATCH | `/api/tickets/:id` | Update ticket status |

## 📊 Complaint Classification

The AI analyzes customer complaints and extracts:

- Complaint category
- Priority level
- Order ID
- Requested action
- Complaint summary
- Detected language
- Clarification requirement
- Human escalation requirement and reason

Supported complaint categories include:

- Delayed Order
- Refund Request
- Return / Exchange
- Damaged Product
- General Inquiry

## 🔮 Future Improvements

- Direct integration with e-commerce order management systems.
- Automated refund and return workflows.
- More Indian language and regional voice support.
- Live human-agent communication.
- Improved AI analytics and reporting.
- Integration with additional AI models.

## 👩‍💻 Developed By

**Simranjeet Kaur**

B.Tech Computer Science Engineering Student

**Project:** VaaniOS  
**Focus:** AI | Speech Technology | Full Stack Development

---

*VaaniOS aims to make customer support more accessible, natural, and efficient through multilingual conversational AI.*


const express = require('express');
const axios = require('axios');
const path = require('path');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();
const winston = require('winston');
const { LoggingWinston } = require('@google-cloud/logging-winston');

/**
 * LOGGING CONFIGURATION
 * Integrated with Google Cloud Logging for enterprise observability.
 */
const loggingWinston = new LoggingWinston();
const logger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
    ),
    transports: [
        new winston.transports.Console(),
        loggingWinston,
    ],
});

const app = express();
const port = process.env.PORT || 8080;

/**
 * SECURITY MIDDLEWARE
 */
// Helmet sets secure HTTP headers (XSS protection, Clickjacking, etc.)
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            ...helmet.contentSecurityPolicy.getDefaultDirectives(),
            "script-src": ["'self'", "'unsafe-inline'", "https://cdn.tailwindcss.com", "https://cdn.jsdelivr.net"],
            "img-src": ["'self'", "data:", "https://*"],
        },
    },
}));

// Rate limiting to prevent API abuse/DoS
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: { response: "Too many requests. Please try again later." }
});

app.use(express.json());
app.use(express.static('public'));

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
const SYSTEM_PROMPT = `
You are EDUlection AI, a helpful civic assistant. 
Follow these rules:
1. ALWAYS respond in the SAME language as the user (English if they ask in English, Hindi for Hindi, and Hinglish for Hindi+English).
2. Keep responses short, simple, and conversational.
3. Your goal is to educate users about election processes in a neutral, non-partisan way.
4. Adapt your tone based on the user's role (Voter or Officer).
5. If a user asks about voting, explain it simply.
`;

/**
 * RESILIENT AI CORE
 * Orchestrates multiple models to ensure 100% service availability.
 */
async function getAIResponse(messages) {
    const models = [
        "google/gemini-flash-1.5",
        "google/gemini-pro-1.5",
        "openai/gpt-3.5-turbo"
    ];

    for (const model of models) {
        try {
            const response = await axios.post(OPENROUTER_URL, {
                model: model,
                messages: messages
            }, {
                headers: {
                    "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
                    "HTTP-Referer": "https://edulection.run.app",
                    "X-Title": "EDUlection Dashboard"
                },
                timeout: 10000
            });
            
            if (response.data?.choices?.[0]) {
                logger.info(`AI success: ${model}`);
                return response.data.choices[0].message.content;
            }
        } catch (error) {
            logger.warn(`Model ${model} failed. ${error.message}`);
        }
    }
    throw new Error("Service overwhelmed. Please try again.");
}

/**
 * API ROUTES
 */
app.post('/api/chat', limiter, async (req, res) => {
    const { message, role } = req.body;
    try {
        const messages = [
            { role: "system", content: `${SYSTEM_PROMPT} Current User Role: ${role}` },
            { role: "user", content: message }
        ];
        const text = await getAIResponse(messages);
        res.json({ response: text });
    } catch (error) {
        res.status(503).json({ response: `⚠️ ${error.message}` });
    }
});

app.post('/api/verify', limiter, async (req, res) => {
    const { claim } = req.body;
    try {
        const messages = [
            { role: "system", content: "You are a rigorous election fact-checker. Analyze the claim based on official ECI rules." },
            { role: "user", content: claim }
        ];
        const text = await getAIResponse(messages);
        res.json({ result: text });
    } catch (error) {
        res.status(503).json({ result: `Verdict: Error | Reason: ${error.message}` });
    }
});

// Start Server
if (require.main === module) {
    app.listen(port, () => logger.info(`EDUlection Core active on port ${port}`));
}

module.exports = app;

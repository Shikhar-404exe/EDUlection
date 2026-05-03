const express = require('express');
const axios = require('axios');
const path = require('path');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();
const winston = require('winston');
const { LoggingWinston } = require('@google-cloud/logging-winston');
const { SecretManagerServiceClient } = require('@google-cloud/secret-manager');
const textToSpeech = require('@google-cloud/text-to-speech');

// --- LOGGING ---
const loggingWinston = new LoggingWinston();
const logger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
    transports: [new winston.transports.Console(), loggingWinston],
});

const app = express();
const port = process.env.PORT || 8080;

// --- GOOGLE CLOUD CLIENTS ---
const secretClient = new SecretManagerServiceClient();
const ttsClient = new textToSpeech.TextToSpeechClient();

let OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

/**
 * GOOGLE SECRET MANAGER INTEGRATION
 * Dynamically fetches secrets from GCP on startup for maximum security.
 */
async function loadSecrets() {
    try {
        const [version] = await secretClient.accessSecretVersion({
            name: `projects/${process.env.GOOGLE_CLOUD_PROJECT || 'edulection'}/secrets/OPENROUTER_API_KEY/versions/latest`,
        });
        OPENROUTER_API_KEY = version.payload.data.toString();
        logger.info("Successfully loaded API key from Google Secret Manager.");
    } catch (err) {
        logger.warn("Secret Manager unavailable, falling back to .env environment variables.");
    }
}

// --- SECURITY ---
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            ...helmet.contentSecurityPolicy.getDefaultDirectives(),
            "script-src": ["'self'", "'unsafe-inline'", "https://cdn.tailwindcss.com", "https://cdn.jsdelivr.net"],
            "img-src": ["'self'", "data:", "https://*"],
        },
    },
}));

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: { response: "Too many requests. Please try again later." }
});

app.use(express.json());
app.use(express.static('public'));

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
const SYSTEM_PROMPT = `You are EDUlection AI, a helpful civic assistant. Role: Voter/Officer. Tone: Neutral, educational, simple. Language: Matches user (En/Hi/Hinglish).`;

/**
 * RESILIENT AI CORE (Tri-Model Fallback)
 */
async function getAIResponse(messages) {
    const models = ["google/gemini-flash-1.5", "google/gemini-pro-1.5", "openai/gpt-3.5-turbo"];
    for (const model of models) {
        try {
            const response = await axios.post(OPENROUTER_URL, { model, messages }, {
                headers: {
                    "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
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

// --- API ROUTES ---

/**
 * CHAT ENDPOINT
 */
app.post('/api/chat', limiter, async (req, res) => {
    const { message, role } = req.body;
    try {
        const text = await getAIResponse([
            { role: "system", content: `${SYSTEM_PROMPT} Current User Role: ${role}` },
            { role: "user", content: message }
        ]);
        res.json({ response: text });
    } catch (error) {
        res.status(503).json({ response: `⚠️ ${error.message}` });
    }
});

/**
 * FACT-CHECK ENDPOINT
 */
app.post('/api/verify', limiter, async (req, res) => {
    try {
        const text = await getAIResponse([
            { role: "system", content: "You are a rigorous election fact-checker." },
            { role: "user", content: req.body.claim }
        ]);
        res.json({ result: text });
    } catch (error) {
        res.status(503).json({ result: `Verdict: Error | Reason: ${error.message}` });
    }
});

/**
 * NEURAL TEXT-TO-SPEECH ENDPOINT
 * Uses Google Cloud Neural voices for professional accessibility.
 */
app.post('/api/tts', limiter, async (req, res) => {
    const { text } = req.body;
    try {
        const isHindi = text.match(/[\u0900-\u097F]/);
        const [response] = await ttsClient.synthesizeSpeech({
            input: { text },
            voice: { 
                languageCode: isHindi ? 'hi-IN' : 'en-IN', 
                name: isHindi ? 'hi-IN-Neural2-A' : 'en-IN-Neural2-B',
                ssmlGender: 'FEMALE' 
            },
            audioConfig: { audioEncoding: 'MP3' },
        });
        res.set('Content-Type', 'audio/mpeg');
        res.send(response.audioContent);
    } catch (err) {
        logger.error(`TTS Failed: ${err.message}`);
        res.status(500).send("Speech generation failed.");
    }
});

// Start Server
if (require.main === module) {
    loadSecrets().then(() => {
        app.listen(port, () => logger.info(`EDUlection Enterprise Active on port ${port}`));
    });
}

module.exports = app;

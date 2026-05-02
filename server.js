const express = require('express');
const { OpenAI } = require('openai');
const path = require('path');
require('dotenv').config();
const winston = require('winston');
const { LoggingWinston } = require('@google-cloud/logging-winston');

const loggingWinston = new LoggingWinston();
const logger = winston.createLogger({
    level: 'info',
    transports: [
        new winston.transports.Console(),
        loggingWinston,
    ],
});

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static('public'));

const { SecretManagerServiceClient } = require('@google-cloud/secret-manager');
const client = new SecretManagerServiceClient();

async function getApiKey() {
    try {
        // Attempt to fetch from Google Cloud Secret Manager
        const [version] = await client.accessSecretVersion({
            name: 'projects/edulection/secrets/OPENROUTER_API_KEY/versions/latest',
        });
        return version.payload.data.toString();
    } catch (err) {
        // Fallback to .env for local development or if API is not enabled
        return process.env.OPENROUTER_API_KEY;
    }
}

let openai;
async function initAI() {
    if (openai) return openai;
    const key = await getApiKey();
    openai = new OpenAI({
        baseURL: "https://openrouter.ai/api/v1",
        apiKey: key,
    });
    return openai;
}

// Pre-initialize
initAI();

const SYSTEM_PROMPT = `
You are EDUlection AI, a helpful civic assistant. 
Follow these rules:
1. ALWAYS respond in the SAME language as the user (English if they ask in English, Hindi for Hindi, and Hinglish for Hinglish).
2. Keep responses short, simple, and conversational.
3. Your goal is to educate users about election processes in a neutral, non-partisan way.
4. Adapt your tone based on the user's role (Voter or Officer).
5. If a user asks about voting, explain it simply.
`;

app.post('/api/chat', async (req, res) => {
    const { message, role } = req.body;
    try {
        const ai = await initAI();
        const response = await ai.chat.completions.create({
            model: "google/gemini-flash-1.5",
            messages: [
                { role: "system", content: `${SYSTEM_PROMPT} Current User Role: ${role}` },
                { role: "user", content: message }
            ],
            max_tokens: 250
        });
        res.json({ response: response.choices[0].message.content });
    } catch (error) {
        logger.error('OpenAI Error:', error);
        res.json({ response: `⚠️ Diagnostic Error: ${error.message}. Please check your OpenRouter balance and API key.` });
    }
});

app.post('/api/verify', async (req, res) => {
    const { claim } = req.body;
    try {
        const ai = await initAI();
        const response = await ai.chat.completions.create({
            model: "google/gemini-flash-1.5",
            messages: [
                { 
                    role: "system", 
                    content: `You are a rigorous election fact-checker. 
                    Analyze the claim based on official Election Commission rules and known facts.
                    Provide the output in the SAME language as the claim.
                    FORMAT: 
                    Verdict: [Likely True / Likely False / Misleading]
                    Reason: [A 1-2 sentence explanation of why, citing general rules if applicable]` 
                },
                { role: "user", content: claim }
            ],
            max_tokens: 200
        });
        res.json({ result: response.choices[0].message.content });
    } catch (error) {
        logger.error('Verification Error:', error);
        res.json({ result: `Verdict: Error | Reason: ${error.message}` });
    }
});

app.listen(port, () => {
    logger.info(`Server running at http://localhost:${port}`);
});

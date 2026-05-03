const express = require('express');
const axios = require('axios');
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
const port = process.env.PORT || 8080;

app.use(express.json());
app.use(express.static('public'));

const SYSTEM_PROMPT = `
You are EDUlection AI, a helpful civic assistant. 
Follow these rules:
1. ALWAYS respond in the SAME language as the user (English if they ask in English, Hindi for Hindi, and Hinglish for Hindi+English).
2. Keep responses short, simple, and conversational.
3. Your goal is to educate users about election processes in a neutral, non-partisan way.
4. Adapt your tone based on the user's role (Voter or Officer).
5. If a user asks about voting, explain it simply.
`;

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

// RESILIENT AI CALLER (Tries Gemini, falls back to GPT if needed)
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
                timeout: 10000 // 10 second timeout
            });
            
            if (response.data && response.data.choices && response.data.choices[0]) {
                logger.info(`AI Response success with model: ${model}`);
                return response.data.choices[0].message.content;
            }
        } catch (error) {
            const status = error.response ? error.response.status : 'TIMEOUT';
            logger.warn(`Model ${model} failed (Status: ${status}). Trying next...`);
        }
    }
    throw new Error("Civic Intelligence service is currently overwhelmed. Please try again in a moment.");
}

app.post('/api/chat', async (req, res) => {
    const { message, role } = req.body;
    try {
        const messages = [
            { role: "system", content: `${SYSTEM_PROMPT} Current User Role: ${role}` },
            { role: "user", content: message }
        ];
        const text = await getAIResponse(messages);
        res.json({ response: text });
    } catch (error) {
        logger.error('Final Chat Error:', error.message);
        res.json({ response: `⚠️ Error: ${error.message}` });
    }
});

app.post('/api/verify', async (req, res) => {
    const { claim } = req.body;
    try {
        const messages = [
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
        ];
        const text = await getAIResponse(messages);
        res.json({ result: text });
    } catch (error) {
        logger.error('Final Verification Error:', error.message);
        res.json({ result: `Verdict: Error | Reason: ${error.message}` });
    }
});

if (require.main === module) {
    app.listen(port, () => {
        logger.info(`Server running at http://localhost:${port}`);
    });
}

module.exports = app;

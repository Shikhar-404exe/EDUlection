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

app.post('/api/chat', async (req, res) => {
    const { message, role } = req.body;
    try {
        const response = await axios.post(OPENROUTER_URL, {
            model: "openai/gpt-3.5-turbo",
            messages: [
                { role: "system", content: `${SYSTEM_PROMPT} Current User Role: ${role}` },
                { role: "user", content: message }
            ]
        }, {
            headers: {
                "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
                "HTTP-Referer": "https://edulection.run.app",
                "X-Title": "EDUlection Dashboard"
            }
        });
        
        res.json({ response: response.data.choices[0].message.content });
    } catch (error) {
        const errMsg = error.response ? JSON.stringify(error.response.data) : error.message;
        logger.error('OpenRouter Chat Error:', errMsg);
        res.json({ response: `⚠️ Error: ${errMsg}. Please check your OpenRouter configuration.` });
    }
});

app.post('/api/verify', async (req, res) => {
    const { claim } = req.body;
    try {
        const response = await axios.post(OPENROUTER_URL, {
            model: "openai/gpt-3.5-turbo",
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
            ]
        }, {
            headers: {
                "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
                "HTTP-Referer": "https://edulection.run.app",
                "X-Title": "EDUlection Dashboard"
            }
        });
        
        res.json({ result: response.data.choices[0].message.content });
    } catch (error) {
        const errMsg = error.response ? JSON.stringify(error.response.data) : error.message;
        logger.error('Verification Error:', errMsg);
        res.json({ result: `Verdict: Error | Reason: ${errMsg}` });
    }
});

app.listen(port, () => {
    logger.info(`Server running at http://localhost:${port}`);
});

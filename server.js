const express = require('express');
const path = require('path');
require('dotenv').config();
const winston = require('winston');
const { LoggingWinston } = require('@google-cloud/logging-winston');
const { VertexAI } = require('@google-cloud/vertexai');

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

// Initialize Vertex AI
const vertexAI = new VertexAI({ project: 'edulection', location: 'us-central1' });
const generativeModel = vertexAI.getGenerativeModel({
    model: 'gemini-1.5-flash',
});

const SYSTEM_PROMPT = `
You are EDUlection AI, a helpful civic assistant. 
Follow these rules:
1. ALWAYS respond in the SAME language as the user (English if they ask in English, Hindi for Hindi, and Hinglish for Hindi+English).
2. Keep responses short, simple, and conversational.
3. Your goal is to educate users about election processes in a neutral, non-partisan way.
4. Adapt your tone based on the user's role (Voter or Officer).
5. If a user asks about voting, explain it simply.
`;

app.post('/api/chat', async (req, res) => {
    const { message, role } = req.body;
    try {
        const chat = generativeModel.startChat({
            history: [
                { role: 'user', parts: [{ text: `${SYSTEM_PROMPT} Current User Role: ${role}` }] },
                { role: 'model', parts: [{ text: "Understood. I am ready to assist as EDUlection AI." }] },
            ],
        });

        const result = await chat.sendMessage(message);
        const response = result.response;
        const text = response.candidates[0].content.parts[0].text;
        
        res.json({ response: text });
    } catch (error) {
        logger.error('Vertex AI Error:', error);
        res.json({ response: `⚠️ Vertex AI Error: ${error.message}. Please ensure the Vertex AI API is enabled in your Google Cloud Console.` });
    }
});

app.post('/api/verify', async (req, res) => {
    const { claim } = req.body;
    try {
        const prompt = `You are a rigorous election fact-checker. 
        Analyze the claim based on official Election Commission rules and known facts.
        Provide the output in the SAME language as the claim.
        FORMAT: 
        Verdict: [Likely True / Likely False / Misleading]
        Reason: [A 1-2 sentence explanation of why, citing general rules if applicable]
        
        Claim: ${claim}`;

        const result = await generativeModel.generateContent(prompt);
        const response = result.response;
        const text = response.candidates[0].content.parts[0].text;

        res.json({ result: text });
    } catch (error) {
        logger.error('Verification Error:', error);
        res.json({ result: `Verdict: Error | Reason: ${error.message}` });
    }
});

app.listen(port, () => {
    logger.info(`Server running at http://localhost:${port}`);
});

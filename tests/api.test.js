const request = require('supertest');
const app = require('../server');

describe('EDUlection API Endpoints', () => {
    
    // Test 1: Static Content
    it('should serve the index.html on the root path', async () => {
        const res = await request(app).get('/');
        expect(res.statusCode).toEqual(200);
        expect(res.type).toBe('text/html');
    });

    // Test 2: Chat API (Sanity check)
    it('should receive a response from the chat API', async () => {
        // We use a short timeout as this hits the resilient AI layer
        const res = await request(app)
            .post('/api/chat')
            .send({
                message: "Hello",
                role: "voter"
            });
        
        expect(res.statusCode).toEqual(200);
        expect(res.body).toHaveProperty('response');
    }, 15000); // Allow time for AI fallback

    // Test 3: Verification API
    it('should receive a result from the verify API', async () => {
        const res = await request(app)
            .post('/api/verify')
            .send({
                claim: "Voting is mandatory in India."
            });
        
        expect(res.statusCode).toEqual(200);
        expect(res.body).toHaveProperty('result');
    }, 15000);

    // Test 4: Error Handling
    it('should return 404 for non-existent routes', async () => {
        const res = await request(app).get('/api/wrong-route');
        expect(res.statusCode).toEqual(404);
    });
});

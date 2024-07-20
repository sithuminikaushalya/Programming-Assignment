const request = require('supertest');
const app = require('./index');

describe('POST /transfer', () => {
    it('should transfer money between accounts', async () => {
        const res = await request(app)
            .post('/transfer')
            .send({
                sourceAccount: '123',
                destinationAccount: '456',
                amount: 100,
            });

        expect(res.status).toBe(200);
        expect(res.body.message).toBe('Transfer successful');
    });

    it('should return an error for insufficient balance', async () => {
        const res = await request(app)
            .post('/transfer')
            .send({
                sourceAccount: '123',
                destinationAccount: '456',
                amount: 2000,
            });

        expect(res.status).toBe(400);
        expect(res.body.error).toBe('Insufficient balance');
    });
});

import express from 'express';
import jwt from 'jsonwebtoken';
import bodyParser from 'body-parser';

const app = express();
app.use(bodyParser.json());

const PORT = 3000;
const SECRET_KEY = 'your_secret_key';
let account = { username: 'user1', password: 'password123', balance: 1000 };

app.post('/login', (req, res) => {
    const { username, password } = req.body;
    if (username === account.username && password === account.password) {
        const token = jwt.sign({ username }, SECRET_KEY, { expiresIn: '1h' });
        res.json({ token });
    } else {
        res.status(401).json({ message: 'Invalid credentials' });
    }
});

function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'Token missing' });
    jwt.verify(token, SECRET_KEY, (err, user) => {
        if (err) return res.status(403).json({ message: 'Invalid token' });
        req.user = user;
        next();
    });
}

app.get('/balance', authenticateToken, (req, res) => {
    res.json({ balance: account.balance });
});

app.post('/deposit', authenticateToken, (req, res) => {
    const { amount } = req.body;
    if (amount <= 0) return res.status(400).json({ message: 'Invalid amount' });
    account.balance += amount;
    res.json({ balance: account.balance });
});

app.post('/withdraw', authenticateToken, (req, res) => {
    const { amount } = req.body;
    if (amount <= 0) return res.status(400).json({ message: 'Invalid amount' });
    if (amount > account.balance) return res.status(400).json({ message: 'Insufficient balance' });
    account.balance -= amount;
    res.json({ balance: account.balance });
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

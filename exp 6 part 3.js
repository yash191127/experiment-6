import express from 'express';
import mongoose from 'mongoose';
import bodyParser from 'body-parser';

const app = express();
app.use(bodyParser.json());

const PORT = 3000;
const MONGO_URI = 'mongodb://127.0.0.1:27017/bank';

await mongoose.connect(MONGO_URI);

const accountSchema = new mongoose.Schema({
    username: { type: String, unique: true },
    balance: { type: Number, default: 0 }
});

const Account = mongoose.model('Account', accountSchema);

app.post('/transfer', async (req, res) => {
    const { fromUser, toUser, amount } = req.body;
    if (!fromUser || !toUser || amount <= 0) return res.status(400).json({ message: 'Invalid input' });

    const sender = await Account.findOne({ username: fromUser });
    const receiver = await Account.findOne({ username: toUser });

    if (!sender) return res.status(404).json({ message: 'Sender account not found' });
    if (!receiver) return res.status(404).json({ message: 'Receiver account not found' });
    if (sender.balance < amount) return res.status(400).json({ message: 'Insufficient balance' });

    sender.balance -= amount;
    receiver.balance += amount;

    await sender.save();
    await receiver.save();

    res.json({ message: 'Transfer successful', senderBalance: sender.balance, receiverBalance: receiver.balance });
});

app.post('/create', async (req, res) => {
    const { username, balance } = req.body;
    if (!username || balance < 0) return res.status(400).json({ message: 'Invalid input' });
    try {
        const account = new Account({ username, balance });
        await account.save();
        res.json({ message: 'Account created', account });
    } catch (err) {
        res.status(400).json({ message: 'Username already exists' });
    }
});

app.get('/balance/:username', async (req, res) => {
    const account = await Account.findOne({ username: req.params.username });
    if (!account) return res.status(404).json({ message: 'Account not found' });
    res.json({ balance: account.balance });
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

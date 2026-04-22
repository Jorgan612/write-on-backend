const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173'
}));

app.use(express.json());

app.get('/api/status', (req, res) => {
    res.send({message: 'Hello from the backend!'});
});

app.listen(PORT, ()=> {
    console.log(`Server is running on http://localhost:${PORT}`);
});
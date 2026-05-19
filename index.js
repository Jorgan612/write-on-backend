require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({
    origin: ['http://localhost:3000', 'http://localhost:5173']
}));

app.use(express.json());

app.get('/', (req, res) => {
    res.send({message: 'Hello from the backend!'});
});

const userRouter = require('./routes/users');

app.use('/users', userRouter);

app.listen(PORT, ()=> {
    console.log(`Server is running on http://localhost:${PORT}`);
});
import express, { Request, Response } from 'express';
import path from 'path'

const app = express();

app.use(express.static(path.join(__dirname, '..', 'client')));

app.listen(4000, () => {
    console.log('Server is running on port 4000');
})
import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import mainRouter from './Routes/index.js';

const app = express();
const port = 5000;

app.use(bodyParser.json());
app.use(cors());

app.use('/api', mainRouter);

app.listen(port, () => {
    console.log(`Server is listening on port ${port}`);
});

import mongoose from 'mongoose';
import express from 'express';
import { accountRouter } from './routes/accountRouter.js';

require('dotenv').config();

(async () => {
  try {
    mongoose.connect(
      'mongodb+srv://' +
        process.env.USER_DB +
        ':' +
        process.env.PASSWORD +
        '@cluster0.rpxs7.mongodb.net/accounts?retryWrites=true&w=majority',
      {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      }
    );
    console.log('Conectado');
  } catch (err) {
    console.log('Erro ao conectar');
  }
})();

const app = express();
app.use(express.json());
app.use(accountRouter);

app.listen(process.env.PORT, () => console.log('API Iniciada'));

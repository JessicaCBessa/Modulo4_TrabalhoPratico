import mongoose from 'mongoose';
import express from 'express';
import { accountRouter } from './routes/accountRouter.js';

(async () => {
  try {
    mongoose.connect(
      'mongodb+srv://dbUser:passwd123@cluster0.rpxs7.mongodb.net/accounts?retryWrites=true&w=majority',
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

app.listen(3000, () => console.log('API Iniciada'));

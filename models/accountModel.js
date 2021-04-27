import mongoose from 'mongoose';

//Criando esquema da base
const accountSchema = mongoose.Schema({
  agencia: {
    type: Number,
    required: true,
  },
  conta: {
    type: Number,
    required: true,
  },
  balance: {
    type: Number,
    required: true,
    min: 0,
  },
  name: {
    type: String,
    required: true,
  },
});

const accountModel = mongoose.model('account', accountSchema, 'account');

export { accountModel };

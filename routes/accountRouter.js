import express from 'express';
import { accountModel } from '../models/accountModel.js';
const app = express();

//CREATE
app.patch('/deposito', async (req, res) => {
  try {
    const agencia = req.body.agencia;
    const conta = req.body.conta;
    const valor = req.body.valor;

    const account = await accountModel.findOne({
      conta: conta,
      agencia: agencia,
    });
    if (!account) {
      throw new Error('Conta inexistente');
    } else {
      const accountUpdated = await accountModel.findOneAndUpdate(
        { conta: account.conta, agencia: account.agencia },
        { $inc: { balance: valor } },
        { new: true }
      );

      res
        .status(200)
        .send(
          `Conta : ${accountUpdated.conta} | Agencia ${accountUpdated.agencia} | Novo Saldo: R$ ${accountUpdated.balance}`
        );
    }
  } catch (error) {
    res.status(500).send(error.message);
  }
});

app.patch('/saque', async (req, res) => {
  try {
    const agencia = req.body.agencia;
    const conta = req.body.conta;
    const valor = req.body.valor;
    const tarifa = 1;
    const account = await accountModel.findOne({
      conta: conta,
      agencia: agencia,
    });
    if (!account) {
      throw new Error('Conta inexistente');
    } else {
      if (account.balance > valor + tarifa) {
        const accountUpdated = await accountModel.findOneAndUpdate(
          { conta: account.conta, agencia: account.agencia },
          { $inc: { balance: (valor + tarifa) * -1 } },
          { new: true }
        );

        res
          .status(200)
          .send(
            `Conta : ${accountUpdated.conta} | Agencia ${accountUpdated.agencia} | Novo Saldo: R$ ${accountUpdated.balance}`
          );
      } else {
        throw new Error('Saldo insuficiente para saque');
      }
    }
  } catch (error) {
    res.status(500).send(error.message);
  }
});

app.get('/saldo', async (req, res) => {
  try {
    const agencia = req.body.agencia;
    const conta = req.body.conta;

    const account = await accountModel.findOne({
      conta: conta,
      agencia: agencia,
    });
    if (!account) {
      throw new Error('Conta inexistente');
    } else {
      res
        .status(200)
        .send(
          `Conta : ${account.conta} | Agencia ${account.agencia} | Saldo: R$ ${account.balance}`
        );
    }
  } catch (error) {
    res.status(500).send(error.message);
  }
});

app.delete('/remove', async (req, res) => {
  try {
    const agencia = req.body.agencia;
    const conta = req.body.conta;

    await accountModel.deleteOne({
      conta: conta,
      agencia: agencia,
    });

    let numeroContasAtivas = await accountModel.aggregate([
      {
        $match: { agencia: agencia },
      },
    ]);

    res
      .status(200)
      .send(`Numero de contas ativas: ${numeroContasAtivas.length}`);
  } catch (err) {
    res.status(500).send(JSON.stringify(err.message));
  }
});

app.patch('/transferencia', async (req, res) => {
  try {
    const contaOrigem = req.body.contaOrigem;
    const contaDestino = req.body.contaDestino;
    const valorTransferencia = req.body.valor;
    const tarifaTransferencia = 8;

    const accountOrigin = await accountModel.findOne({
      conta: contaOrigem,
    });

    const accountDestiny = await accountModel.findOne({
      conta: contaDestino,
    });

    if (!accountOrigin || !accountDestiny) {
      throw new Error('Conta de origem ou de destino inexistente');
    } else {
      if (accountOrigin.balance < valorTransferencia) {
        throw new Error('Saldo insuficiente');
      }
      if (accountOrigin.agencia == accountDestiny.agencia) {
        const result = await accountModel.bulkWrite([
          {
            updateOne: {
              filter: { conta: accountOrigin.conta },
              update: { $inc: { balance: valorTransferencia * -1 } },
            },
          },
          {
            updateOne: {
              filter: { conta: accountDestiny.conta },
              update: { $inc: { balance: valorTransferencia } },
            },
          },
        ]);
      } else {
        if (accountOrigin.balance < valorTransferencia + tarifaTransferencia) {
          throw new Error('Saldo insuficiente');
        }
        const teste = (valorTransferencia + tarifaTransferencia) * -1;
        const result = await accountModel.bulkWrite([
          {
            updateOne: {
              filter: { conta: accountOrigin.conta },
              update: {
                $inc: {
                  balance: teste,
                },
              },
            },
          },
          {
            updateOne: {
              filter: { conta: accountDestiny.conta },
              update: {
                $inc: {
                  balance: valorTransferencia,
                },
              },
            },
          },
        ]);
      }
    }
    const contaFinal = await accountModel.findOne({
      conta: accountOrigin.conta,
    });
    res
      .status(200)
      .send(
        `Conta : ${contaFinal.conta} | Agencia ${contaFinal.agencia} | Saldo: R$ ${contaFinal.balance}`
      );
  } catch (error) {
    res.status(500).send(error.message);
  }
});

app.get('/media', async (req, res) => {
  try {
    const agencia = req.body.agencia;

    const agragados = await accountModel.aggregate([
      { $match: { agencia: agencia } },
      {
        $group: {
          _id: null,
          avg: { $avg: '$balance' },
        },
      },
    ]);

    res.status(200).send(`Media da agencia: ${agencia} : ${agragados[0].avg}`);
  } catch (err) {
    res.status(500).send(JSON.stringify(err.message));
  }
});

app.get('/menorSaldo', async (req, res) => {
  try {
    const quantidade = req.body.quantidade;
    let retorno = '';

    const listaMenorSaldo = await accountModel
      .find()
      .sort({ balance: 1 })
      .limit(quantidade);
    listaMenorSaldo.map(({ agencia, conta, balance }) => {
      retorno += `Agencia: ${agencia} | Conta: ${conta} | Saldo: ${balance}\n`;
    });
    res.status(200).send(retorno);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

app.get('/maiorSaldo', async (req, res) => {
  try {
    const quantidade = req.body.quantidade;
    let retorno = '';

    const listaMaiorSaldo = await accountModel
      .find()
      .sort({ balance: -1, name: 1 })
      .limit(quantidade);
    listaMaiorSaldo.map(({ agencia, conta, balance, name }) => {
      retorno += `Cliente: ${name} | Agencia: ${agencia} | Conta: ${conta} | Saldo: ${balance}\n`;
    });
    res.status(200).send(retorno);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

app.patch('/transfereContas', async (req, res) => {
  try {
    let retorno = '';

    const agregados = await accountModel.aggregate([
      {
        $sort: { balance: -1 },
      },
      {
        $group: {
          _id: '$agencia',
          contas: {
            $push: {
              name: '$name',
              balance: '$balance',
              conta: '$conta',
              agencia: '$agencia',
            },
          },
        },
      },
      { $project: { contas: { $slice: ['$contas', 1] } } },
    ]);

    const listaContas = agregados.map((conta) => {
      return new accountModel({
        conta: conta.contas[0].conta,
        name: conta.contas[0].name,
        balance: conta.contas[0].balance,
        agencia: conta.contas[0].agencia,
      });
    });

    for (let contaAtual of listaContas) {
      await accountModel.updateOne(
        { conta: contaAtual.conta },
        { $set: { agencia: 99 } },
        { new: true }
      );
    }
    //outra forma de fazer a função
    /*
export const promoteRichests = async (idAccounts) => {
  const accountsUpdated = await accountModel.updateMany(
    {
      _id: { $in: idAccounts },
    },
    { $set: { agencia: 99 } },
    { new: true }
  )

  return accountsUpdated
}

export const getRichestsPerAgency = async () => {
  const richestAccountsPerAgency = await accountModel.aggregate([
    {
      $sort: {
        balance: -1,
      },
    },
    {
      $group: {
        _id: '$agencia',
        max: {
          $max: '$balance',
        },
        doc: {
          $first: '$$ROOT',
        },
      },
    },
  ])

  return richestAccountsPerAgency
}
*/
    const listaNova = await accountModel.find({ agencia: 99 });
    listaNova.map(({ agencia, conta, balance, name }) => {
      retorno += `Cliente: ${name} | Agencia: ${agencia} | Conta: ${conta} | Saldo: ${balance}\n`;
    });

    res.status(200).send(retorno);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

app.put('/account/:id', async (req, res) => {
  res.status(200).send(retorno);
});

export { app as accountRouter };

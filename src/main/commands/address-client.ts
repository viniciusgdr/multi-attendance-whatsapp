import { prismaClient } from '../config/app'
import { helperClient } from '../config/clientCommands'
import { type WAMessage } from '../helpers/makeBaileysConnectionSocket'
import { type UtilsMessage } from '../interfaces/utilsMessage'
import { type WAConnection } from '../interfaces/WAConnection'
import finalizarClient from './finalizar-client'

export default async (connection: WAConnection, message: WAMessage, utils: UtilsMessage): Promise<void> => {
  if (message.body === '/address') {
    helperClient[message.author].asSelectionedAddress = true
    void connection.sendMessage(message.groupId, [
      {
        type: 'text',
        message: `Me informe o endereço completo para entrega do pedido, ${message.notifyName}.
        
Exemplo: Rua das Flores, 123, Bairro, Cidade - UF, CEP
  
Obs: Não esqueça de informar o CEP!
Obs2: Não esqueça de informar o número da casa!`
      }
    ])
    return
  }
  if (message.body.length < 10) {
    void connection.sendMessage(message.groupId, [
      {
        type: 'text',
        message: `⚠️ O endereço informado é inválido, ${message.notifyName}!`
      }
    ])
    helperClient[message.author].retrys += 1
    if (helperClient[message.author].retrys > 3) {
      helperClient[message.author].retrys = 0
      helperClient[message.author].asSelectionedAddress = false
      void connection.sendMessage(message.groupId, [
        {
          type: 'text',
          message: `⚠️ Você atingiu o limite de tentativas, ${message.notifyName}! Tente novamente mais tarde.`
        }
      ])
      await finalizarClient(connection, message, utils)
    }
    return
  }
  await prismaClient.user.update({
    where: {
      userId: message.author
    },
    data: {
      address: message.body
    }
  })
  const cart = await prismaClient.cart.findMany({
    where: {
      userId: message.author
    },
    include: {
      product: true
    }
  })
  const total = cart.reduce((acc, v) => (acc + v.product.price) * v.quantity, 0)
  void connection.sendMessage(message.groupId, [
    {
      type: 'text',
      message: `📝 Endereço cadastrado com sucesso, ${message.notifyName}!

${message.body}`
    },
    {
      type: 'button',
      body: `📝 Detalhes do seu pedido, ${message.notifyName}:
      
${cart.map((v) => `🍕 ${v.quantity}x | ${v.product.name} - R$${v.product.price * v.quantity}`).join('\n')}

Total: R$${total.toFixed(2)}

Vamos selecionar a forma de pagamento?`,
      buttons: [
        {
          body: 'Continuar',
          id: '/payment'
        },
        {
          body: 'Voltar ao Carrinho',
          id: '/pedido'
        },
        {
          body: 'Limpar pedido',
          id: '/limpar'
        }
      ]
    }
  ])
}

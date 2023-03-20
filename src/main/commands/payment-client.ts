import { prismaClient } from '../config/app'
import { helperClient } from '../config/clientCommands'
import { type WAMessage } from '../helpers/makeBaileysConnectionSocket'
import { type UtilsMessage } from '../interfaces/utilsMessage'
import { type WAConnection } from '../interfaces/WAConnection'

export default async (connection: WAConnection, message: WAMessage, utils: UtilsMessage): Promise<void> => {
  const cart = await prismaClient.cart.findMany({
    where: {
      userId: message.author
    },
    include: {
      product: true
    }
  })
  const user = await prismaClient.user.findUnique({
    where: {
      userId: message.author
    }
  })
  if (!user) {
    void connection.sendMessage(message.groupId, [
      {
        type: 'text',
        message: '📝 Você não está cadastrado!'
      }
    ])
    return
  }
  const total = cart.reduce((acc, v) => (acc + v.product.price) * v.quantity, 0)
  if (!utils.query) {
    void connection.sendMessage(message.groupId, [
      {
        type: 'list',
        body: 'Qual a forma de pagamento?',
        buttonText: 'Clique para selecionar',
        sections: [
          {
            title: 'Formas de Pagamento',
            rows: [
              {
                title: 'Dinheiro',
                description: 'Pague em dinheiro na entrega',
                rowId: '/payment dinheiro'
              }
            ]
          }
        ]
      }
    ])
    return
  }
  if (utils.query === 'dinheiro') {
    void connection.sendMessage(message.groupId, [
      {
        type: 'button',
        body: `Vamos lá, ${message.notifyName}!
        
Você escolheu pagar em dinheiro na entrega.

Endereço de entrega:
${user?.address ?? 'Não informado'}

O seu pedido é:
${cart.map((v) => `🍕 ${v.quantity}x | ${v.product.name} - R$${v.product.price * v.quantity}`).join('\n')}

Total: R$${total.toFixed(2)}

Confirma o pedido?`,
        buttons: [
          {
            body: 'Confirmar',
            id: `/payment ${utils.query} confirmar`
          },
          {
            body: 'Voltar ao Carrinho',
            id: '/pedido'
          },
          {
            body: 'Cancelar',
            id: '/limpar'
          }
        ]
      }
    ])
  } else if (utils.query === 'dinheiro confirmar') {
    void connection.sendMessage(message.groupId, [
      {
        type: 'text',
        message: `📝 Pedido finalizado com sucesso!

Avalie o nosso atendimento!
Estamos sempre buscando melhorar a cada dia!

O Prazo de entrega é de 30 minutos.`
      }
    ])
    delete helperClient[message.author]
  }
}

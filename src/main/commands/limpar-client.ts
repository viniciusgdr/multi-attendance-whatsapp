import { prismaClient } from '../config/app'
import { type WAMessage } from '../helpers/makeBaileysConnectionSocket'
import { type UtilsMessage } from '../interfaces/utilsMessage'
import { type WAConnection } from '../interfaces/WAConnection'

export default async (connection: WAConnection, message: WAMessage, utils: UtilsMessage): Promise<void> => {
  await prismaClient.cart.deleteMany({
    where: {
      userId: message.author
    }
  })
  void connection.sendMessage(message.groupId, [
    {
      type: 'text',
      message: '📝 Seu carrinho foi limpo com sucesso!'
    },
    {
      type: 'button',
      body: 'Você deseja encerrar o atendimento? Ou deseja continuar comprando?',
      footer: 'Escolha uma opção abaixo:',
      buttons: [
        {
          body: '📝 Encerrar atendimento',
          id: '/encerrar'
        },
        {
          body: '📝 Continuar comprando',
          id: '/pedido'
        }
      ]
    }
  ])
}

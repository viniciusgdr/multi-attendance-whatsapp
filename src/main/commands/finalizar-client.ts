import { prismaClient } from '../config/app'
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
  const total = cart.reduce((acc, v) => (acc + v.product.price) * v.quantity, 0)
  void connection.sendMessage(message.groupId, [
    {
      type: 'button',
      body: `📝 Detalhes do seu pedido, ${message.notifyName}:
      
${cart.map((v) => `🍕 ${v.quantity}x | ${v.product.name} - R$${v.product.price * v.quantity}`).join('\n')}

Total: R$${total.toFixed(2)}

Vamos adicionar o endereço?`,
      buttons: [
        {
          body: 'Configurar endereço',
          id: '/address'
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

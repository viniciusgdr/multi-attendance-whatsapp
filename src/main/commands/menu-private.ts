import { type WAMessage } from '../helpers/makeBaileysConnectionSocket'
import { type WAConnection } from '../interfaces/WAConnection'

export default (connection: WAConnection, message: WAMessage): void => {
  void connection.sendMessage(message.groupId, [
    {
      type: 'button',
      body: 'Central de Controle - Pizzaria ETEGEC',
      footer: 'Escolha uma opção abaixo:',
      title: 'Central',
      buttons: [
        {
          body: '📝 Listar Produtos',
          id: '/produtos'
        },
        {
          body: '📝 Listar Pedidos',
          id: '/pedidos'
        }
      ]
    }
  ], {
    quotedMessage: message
  })
}

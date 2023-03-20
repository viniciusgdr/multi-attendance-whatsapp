import { type WAMessage } from '../helpers/makeBaileysConnectionSocket'
import { type WAConnection } from '../interfaces/WAConnection'

export default (connection: WAConnection, message: WAMessage): void => {
  void connection.sendMessage(message.groupId, [
    {
      type: 'text',
      message: `Contato:
      
📞 Telefone: (11) 99999-9999
📧 E-mail: pizzariaetegec@vinicius.com
📌 Endereço: Rua dos Bobos, nº 0`
    }
  ], {
    quotedMessage: message
  })
}

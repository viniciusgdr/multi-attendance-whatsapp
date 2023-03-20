import { helperClient } from '../config/clientCommands'
import { type WAMessage } from '../helpers/makeBaileysConnectionSocket'
import { type UtilsMessage } from '../interfaces/utilsMessage'
import { type WAConnection } from '../interfaces/WAConnection'

export default async (connection: WAConnection, message: WAMessage, utils: UtilsMessage): Promise<void> => {
  delete helperClient[message.author]
  void connection.sendMessage(message.groupId, [
    {
      type: 'text',
      message: '📝 Atendimento encerrado com sucesso!'
    }
  ])
}

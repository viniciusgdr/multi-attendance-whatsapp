import { type WAConnection } from '../interfaces/WAConnection'
import glob from 'fast-glob'
import { utilsMessage } from '../helpers/utilsMessage'
import { prismaClient } from './app'
import addressClient from '../commands/address-client'
import env from './.env'
export const helperClient: Record<string, {
  started: boolean
  timeout: number
  asSelectionedAddress: boolean
  retrys: number
}> = {}
export default (connection: WAConnection): void => {
  console.log('Started client commands configuration')
  const filesClient = glob.sync([
    env.PROD ? '**/build/commands/*-client.js' : '**/src/main/commands/*-client.ts'
  ])
  connection.ev.on('message', async (msg) => {
    const utils = utilsMessage(msg)
    if (!utils.command && !msg.isGroup) {
      if (helperClient[msg.author]) {
        console.log('Started helperClient')
        if (helperClient[msg.author].asSelectionedAddress) {
          await addressClient(connection, msg, utils)
        }
        return
      }
      helperClient[msg.author] = {
        started: true,
        timeout: 1000 * 60 * 5,
        asSelectionedAddress: false,
        retrys: 0
      }
      const users = await prismaClient.user.findMany()
      const user = users.find((v) => v.userId === msg.author)
      if (!user) {
        await prismaClient.user.create({
          data: {
            userId: msg.author
          }
        })
      }
      void connection.sendMessage(msg.author, [
        {
          type: 'list',
          body: `Olá, ${msg.notifyName}!
          
Seja bem vindo ao nosso atendimento da Pizzaria ETEGEC!

Para realizar um pedido, basta selecionar a opção "📝 Realizar Pedido" no menu abaixo!`,
          buttonText: 'Selecione',
          sections: [
            {
              title: 'Pedidos',
              rows: [
                {
                  description: 'Realizar um pedido',
                  title: '📝 Realizar Pedido',
                  rowId: '/pedido'
                }
              ]
            },
            {
              title: 'Outros',
              rows: [
                {
                  title: '📞 Contato',
                  description: 'Entre em contato com a Pizzaria ETEGEC',
                  rowId: '/contato'
                }
              ]
            }
          ]
        }
      ])
    }
  })
  filesClient.map(async file => {
    console.log('Loaded command for Clients: ', file)
    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    connection.ev.on('message', async (msg) => {
      const utils = utilsMessage(msg)
      const splited = file.split('/')
      const commandName = splited[splited.length - 1].replace(/-client|\.ts|\.js/g, '')
      if (commandName === utils.command && !msg.isGroup && helperClient[msg.author]) {
        env.PROD ? (await import(`../../${file}`)).default(connection, msg, utils) : (await import(`../../../${file}`)).default(connection, msg, utils)
      }
    })
  })

  setInterval(() => {
    // eslint-disable-next-line array-callback-return
    Object.keys(helperClient).map(key => {
      helperClient[key].timeout -= 1000
      if (helperClient[key].timeout <= 0) {
        void connection.sendMessage(key, [
          {
            type: 'text',
            message: '📝 Atendimento Finalizado por falta de comunicação. Caso precise de nossa presença, basta enviar qualquer mensagem!'
          }
        ])
        delete helperClient[key]
      }
    })
  }, 1000)
}

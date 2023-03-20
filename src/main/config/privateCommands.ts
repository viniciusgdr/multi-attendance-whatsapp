import { type WAConnection } from '../interfaces/WAConnection'
import glob from 'fast-glob'
import { utilsMessage } from '../helpers/utilsMessage'
import env from './.env'

const groupsJidVerified = [
  '120363052505872519@g.us',
  '120363048119129530@g.us'
]
export default (connection: WAConnection): void => {
  console.log('Started admin commands configuration')
  const filesPrivate = glob.sync([
    env.PROD ? '**/build/commands/*-private.js' : '**/src/main/commands/*-private.ts'
  ])
  filesPrivate.map(async file => {
    console.log('Loaded command for Admin: ', file)
    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    connection.ev.on('message', async (msg) => {
      const utils = utilsMessage(msg)
      const splited = file.split('/')
      const commandName = splited[splited.length - 1].replace(/-private|\.ts|\.js/g, '')
      if (commandName === utils.command && groupsJidVerified.includes(msg.groupId)) {
        env.PROD ? (await import(`../../${file}`)).default(connection, msg, utils) : (await import(`../../../${file}`)).default(connection, msg, utils)
      }
    })
  })
}

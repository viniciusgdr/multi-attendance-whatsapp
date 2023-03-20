import { type UtilsMessage } from '../interfaces/utilsMessage'
import { type WAMessage } from './makeBaileysConnectionSocket'

const prefix = [
  '!',
  '/',
  '@',
  '$'
]

export function utilsMessage (msg: WAMessage): UtilsMessage {
  const quotedMsg = msg.getQuotedMessage()
  const body = msg.body
  const isCmd: boolean = prefix.includes((body !== '' && body.slice(0, 1)) as any) && body.slice(1) !== ''
  const command = isCmd ? body.slice(1).trim().split(' ')[0].toLowerCase() : ''
  const prefixUsed = isCmd ? body.slice(0, 1) : ''
  const arg: string = isCmd ? body.slice(1).slice(command.length + 1).trim() : ''
  const args: string[] = body.startsWith(prefixUsed + ' ') ? body.trim().split(/ +/).slice(2) : body.trim().split(/ +/).slice(1)
  const query = args.join(' ').length === 0 ? quotedMsg !== undefined ? msg.body : undefined : args.join(' ').length !== 0 ? args.join(' ') : undefined

  return {
    query,
    args,
    arg,
    prefixUsed,
    command,
    isCmd,
    body,
    quotedMsg
  }
}

import { type WAMessage } from '../helpers/makeBaileysConnectionSocket'

export interface UtilsMessage {
  query: string | undefined
  args: string[]
  arg: string
  prefixUsed: string
  command: string
  isCmd: boolean
  body: string
  quotedMsg: WAMessage | undefined
}

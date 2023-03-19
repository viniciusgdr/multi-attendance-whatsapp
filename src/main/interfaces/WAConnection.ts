import { type WAProto } from '@adiwajshing/baileys'
import { type SocketEventEmitter } from '../config/app'
import { type Message } from '../helpers/makeBaileysConnectionSocket'

export interface WAConnection {
  info: {
    id: string
    imgUrl: string | null | undefined
    name: string | undefined
  }
  getProfilePicture: (contactId: string) => Promise<string | undefined>
  sendMessage: (contactId: string, messages: Message[], options?: {
    quotedMessage?: WAProto.IWebMessageInfo
  }) => Promise<void>
  ev: SocketEventEmitter
}

import makeWASocket, { type AuthenticationState } from '@adiwajshing/baileys'
import { makeCacheableSignalKeyStore, useMultiFileAuthState } from '@adiwajshing/baileys/lib/Utils'
import EventEmitter from 'events'
import P from 'pino'
import { makeBaileysConnectionSocket, type WAMessage } from '../helpers/makeBaileysConnectionSocket'
import { type WAConnection } from '../interfaces/WAConnection'
import NodeCache from 'node-cache'

interface Connection {
  prepareAuth: (folder: string) => Promise<Authentication>
  connect: () => Promise<WAConnection>
}

interface Authentication {
  state: AuthenticationState
  saveCreds: () => Promise<void>
}

export declare interface SocketEventMap {
  'message': WAMessage
}
export interface SocketEventEmitter {
  on: <T extends keyof SocketEventMap>(event: T, listener: (arg: SocketEventMap[T]) => void) => void
  off: <T extends keyof SocketEventMap>(event: T, listener: (arg: SocketEventMap[T]) => void) => void
  removeAllListeners: <T extends keyof SocketEventMap>(event: T) => void
  emit: <T extends keyof SocketEventMap>(event: T, arg: SocketEventMap[T]) => boolean
}
export class BaileysConnection implements Connection {
  authentication: Authentication | undefined
  ev: SocketEventEmitter
  msgRetryCounterCache: NodeCache

  constructor () {
    this.ev = new EventEmitter()
    this.msgRetryCounterCache = new NodeCache()
  }

  async prepareAuth (folder: string): Promise<Authentication> {
    const auth = await useMultiFileAuthState(folder)
    this.authentication = auth
    return auth
  }

  async connect (): Promise<WAConnection> {
    if (this.authentication == null) {
      throw new Error('Authentication not prepared')
    }
    const { creds, keys } = this.authentication.state
    const logger = P({ level: 'warn' })
    const socket = makeWASocket({
      auth: {
        creds,
        keys: makeCacheableSignalKeyStore(keys, logger)
      },
      logger,
      printQRInTerminal: true,
      msgRetryCounterCache: this.msgRetryCounterCache,
      generateHighQualityLinkPreview: true
    })
    return await makeBaileysConnectionSocket(this.ev, socket)
  }
};

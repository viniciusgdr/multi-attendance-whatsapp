import { downloadContentFromMessage, getContentType, isJidGroup, jidNormalizedUser, type WASocket } from '@adiwajshing/baileys'
import { type MediaType, type WAProto } from '@adiwajshing/baileys/lib/Types/Message'
import { fromBuffer } from 'file-type'
import type core from 'file-type/core'
import { unlinkSync, writeFileSync } from 'fs'
import type internal from 'stream'
import { type Authentication, type SocketEventEmitter } from '../config/app'
import { type TypeMessage } from '../interfaces/type'
import { type WAConnection } from '../interfaces/WAConnection'
import { MessageMedia } from '../structures/MessageMedia'
import { getBodyMessage } from './getBodyMessage'
import { processMessage } from './processMessage'

export interface Text {
  message: string
  type: 'text'
}
export interface Buttons {
  id: string
  body: string
  index?: number
}
export interface IRows {
  title: string
  rowId: string
  description: string
}
export interface List {
  type: 'list'
  body: string
  buttonText: string
  options?: {
    title?: string
    footer?: string
  }
  sections: Array<{
    title: string
    rows: IRows[]
  }>
}
export interface Media {
  type: 'media'
  caption?: string
  messageMedia: MessageMedia
  mediaType: 'video' | 'image' | 'audio' | 'document'
  mimeType?: string
  sendVideoAsGif?: boolean
  sendMediaAsDocument?: boolean
  sendAudioAsVoice?: boolean
  fileName?: string
}

export interface Sticker {
  type: 'sticker'
  messageMedia: MessageMedia
  stickerAuthor?: string
  stickerName?: string
  stickerCategories?: string[]
}
export interface Button {
  body: string
  footer?: string
  title?: string
  buttons: Buttons[]
  type: 'button'
  messageMedia?: MessageMedia
  mediaType?: 'video' | 'image' | 'audio'
  sendVideoAsGif?: boolean
  sendMediaAsDocument?: boolean
  fileName?: string
}

export type Message = ({
  extra?: any
  mentions?: string[]
} & (Text | Button | List | Media | Sticker))

export async function makeBaileysConnectionSocket (ev: SocketEventEmitter, socket: WASocket, authentication: Authentication): Promise<WAConnection> {
  const info = (): {
    id: string
    imgUrl: string | null | undefined
    name: string | undefined
  } => ({
    id: jidNormalizedUser(socket?.user?.id),
    imgUrl: socket.user?.imgUrl,
    name: socket.user?.name
  })
  socket.ev.on('messages.upsert', ({
    messages,
    type
  }) => {
    for (const message of messages) {
      if ((message.key.fromMe === true) || message.key.remoteJid === 'status@broadcast' || ((message.message?.protocolMessage) != null)) return
      const msg = makeMessage(message)

      // eslint-disable-next-line @typescript-eslint/no-unused-expressions
      msg.type === 'ephemeralMessage' && ((msg.message?.ephemeralMessage?.message) != null) ? msg.message = msg.message.ephemeralMessage.message : undefined
      ev.emit('message', msg)
    }
  })
  // eslint-disable-next-line @typescript-eslint/no-misused-promises
  socket.ev.on('creds.update', async (arg) => {
    await authentication.saveCreds()
    ev.emit('creds', arg)
  })
  return {
    info: info(),
    async getProfilePicture (contactId: string) {
      return await socket.profilePictureUrl(contactId, 'image')
    },
    async sendMessage (contactId: string, messages: Message[], options?: {
      quotedMessage?: WAProto.IWebMessageInfo
    }) {
      for (const message of messages) await processMessage(socket, contactId, message, options)
    },
    ev
  }
}
export interface IMessageKey {
  remoteJid: string
  fromMe: boolean
  id: string
  participant: string
}
export interface WAMessage {
  key: IMessageKey
  type: TypeMessage
  body: string
  t: number
  notifyName: string
  isGroup: boolean
  author: string
  groupId: string
  /* Used to download media attachment */
  message: WAProto.IMessage
  hasMedia: boolean
  downloadMedia: () => Promise<MessageMedia>
  downloadMediaToFilePath: (archive: string) => Promise<{
    buffer: MessageMedia
    archive: string
    delete: () => void
  }>
  getQuotedMessage: () => WAMessage | undefined
}

export function makeMessage (msg: WAProto.IWebMessageInfo, asQuotedMsgInfo: boolean = false): WAMessage {
  const message = msg.message as unknown as WAProto.IMessage
  const key = msg.key as unknown as IMessageKey
  const type = getContentType(message) as unknown as TypeMessage
  const getQuotedMessage = (): WAMessage | undefined => {
    const quotedMsg = ((msg.message?.extendedTextMessage?.contextInfo?.quotedMessage) != null) ? msg.message.extendedTextMessage.contextInfo.quotedMessage : undefined
    if (quotedMsg == null) return undefined
    return makeMessage({
      key: {
        fromMe: false,
        id: msg.message?.extendedTextMessage?.contextInfo?.stanzaId,
        participant: msg.message?.extendedTextMessage?.contextInfo?.participant,
        remoteJid: msg.message?.extendedTextMessage?.contextInfo?.remoteJid
      },
      message: quotedMsg
    }, true)
  }
  let quotedMsg: WAMessage | undefined
  if (!asQuotedMsgInfo) {
    quotedMsg = getQuotedMessage()
  } else {
    quotedMsg = undefined
  }
  const getQuotedMessageType = (): string | undefined => {
    if (quotedMsg?.type === undefined) return undefined
    else return quotedMsg.type
  }
  const isQuotedMedia = (): boolean => {
    const typeQuoted = getQuotedMessageType()
    if (typeQuoted === 'imageMessage') return true
    else if (typeQuoted === 'videoMessage') return true
    else if (typeQuoted === 'audioMessage') return true
    else if (typeQuoted === 'documentMessage') return true
    else if (typeQuoted === 'stickerMessage') return true
    else if (typeQuoted === 'documentWithCaptionMessage') return true
    else return false
  }
  const groupId = (msg.key.remoteJid ?? msg.key.participant) as unknown as string
  return {
    body: getBodyMessage(message),
    author: jidNormalizedUser(groupId) ?? '',
    key,
    isGroup: isJidGroup(groupId) ?? false,
    notifyName: msg.pushName ?? '',
    t: Number(msg.messageTimestamp) ?? 0,
    groupId: msg.key.remoteJid ?? '',
    type,
    message,
    hasMedia: type === 'videoMessage' || type === 'imageMessage' || type === 'stickerMessage' || type === 'documentMessage',
    getQuotedMessage,
    async downloadMedia (): Promise<MessageMedia> {
      const isQuoted = isQuotedMedia()
      if (isQuoted && typeof quotedMsg !== 'undefined') return await quotedMsg.downloadMedia()
      const MediaData = msg.message

      try {
        const content = {
          message: MediaData
        }

        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-expect-error
        const buffer = await downloadMediaMessage(content, 'buffer', {})
        const mime = await fromBuffer(buffer) as unknown as core.FileTypeResult
        return new MessageMedia(mime.mime, buffer)
      } catch (err) {
        const mineType: any = ((MediaData?.audioMessage) != null) ||
          ((MediaData?.videoMessage) != null) ||
          ((MediaData?.imageMessage) != null) ||
          ((MediaData?.documentMessage) != null) ||
          ((MediaData?.stickerMessage) != null) ||
          ((MediaData?.extendedTextMessage?.contextInfo?.quotedMessage?.imageMessage) != null) ||
          ((MediaData?.extendedTextMessage?.contextInfo?.quotedMessage?.videoMessage) != null) ||
          ((MediaData?.extendedTextMessage?.contextInfo?.quotedMessage?.buttonsMessage?.videoMessage) != null) ||
          ((MediaData?.extendedTextMessage?.contextInfo?.quotedMessage?.buttonsMessage?.imageMessage) != null) ||
          ((MediaData?.buttonsMessage?.videoMessage) != null) ||
          ((MediaData?.buttonsMessage?.imageMessage) != null) ||
          ((MediaData?.viewOnceMessage?.message?.imageMessage) != null) ||
          ((MediaData?.viewOnceMessage?.message?.videoMessage) != null) ||
          MediaData?.documentWithCaptionMessage?.message?.documentMessage

        mineType.mimetype = mineType?.mimetype?.replace('image/webp', 'sticker/webp')
        const messageType = (((msg.message?.documentMessage) != null) || ((msg.message?.documentWithCaptionMessage) != null))
          ? 'document'
          // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
          : mineType.mimetype
            ?.split('/')[0]
            ?.replace('application', 'document')
            ? (mineType.mimetype
                ?.split('/')[0]
                ?.replace('application', 'document') as MediaType)
            : (mineType.mimetype?.split('/')[0] as MediaType)

        let stream: internal.Transform | undefined
        let contDownload = 0

        while (contDownload < 10 && (stream == null)) {
          try {
            stream = await downloadContentFromMessage(
              ((msg.message?.audioMessage != null) ||
              (msg.message?.videoMessage != null) ||
              (msg.message?.documentMessage != null) ||
              (msg.message?.imageMessage != null) ||
              (msg.message?.stickerMessage != null) ||
              ((msg.message?.extendedTextMessage?.contextInfo?.quotedMessage?.imageMessage) != null) ||
              ((msg.message?.buttonsMessage?.imageMessage) != null) ||
              ((msg.message?.templateMessage?.fourRowTemplate?.imageMessage) != null) ||
              ((msg.message?.templateMessage?.fourRowTemplate?.videoMessage) != null) ||
              ((msg.message?.templateMessage?.hydratedTemplate?.imageMessage) != null) ||
              ((msg.message?.templateMessage?.hydratedTemplate?.videoMessage) != null) ||
              ((msg.message?.templateMessage?.hydratedFourRowTemplate?.imageMessage) != null) ||
              ((msg.message?.templateMessage?.hydratedFourRowTemplate?.videoMessage) != null) ||
              ((msg.message?.buttonsMessage?.videoMessage) != null) ||
              ((MediaData?.buttonsMessage?.imageMessage) != null) ||
              ((msg.message?.interactiveMessage?.header?.imageMessage) != null) ||
              ((MediaData?.viewOnceMessage?.message?.imageMessage) != null) ||
              ((MediaData?.viewOnceMessage?.message?.videoMessage) != null) ||
              MediaData?.documentWithCaptionMessage?.message?.documentMessage) as any,
              messageType
            )
          } catch (error) {
            contDownload++
            await new Promise(resolve => setTimeout(resolve, 1000 * contDownload * 2))
          }
        }

        let buffer = Buffer.from([])
        for await (const chunk of stream as internal.Transform) {
          buffer = Buffer.concat([buffer, chunk])
        }
        const mime = await fromBuffer(buffer) as unknown as core.FileTypeResult
        return new MessageMedia(mime.mime, buffer)
      }
    },
    downloadMediaToFilePath: async function (archive: string) {
      const buffer: MessageMedia = await this.downloadMedia()
      writeFileSync(archive, buffer.buffer)
      return {
        buffer,
        archive,
        delete: () => { unlinkSync(archive) }
      }
    }
  }
}

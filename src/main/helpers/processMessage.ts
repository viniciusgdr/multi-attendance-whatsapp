import { type WASocket, type WAProto } from '@adiwajshing/baileys'
import { type MessageMedia } from '../structures/MessageMedia'
import { Sticker as StickerConvert } from '../structures/Sticker'
import { type Message } from './makeBaileysConnectionSocket'

export async function processMessage (socket: WASocket, contactId: string, message: Message, options?: {
  quotedMessage?: WAProto.IWebMessageInfo
}): Promise<void> {
  switch (message.type) {
    case 'text':
      await socket.sendMessage(contactId, {
        text: message.message,
        mentions: message.mentions,
        ...options
      }, { quoted: options?.quotedMessage })
      break
    case 'button':
      // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
      if (((message?.messageMedia) == null) && !message.mediaType) {
        await socket.sendMessage(contactId, {
          buttons: message.buttons.map((v) => {
            return {
              buttonId: v.id,
              buttonText: {
                displayText: v.body
              },
              type: 1
            }
          }),
          footer: message.footer,
          text: message.body,
          mentions: message.mentions ?? []
        })
      } else if (message.mediaType === 'video') {
        const messageMedia = message.messageMedia as MessageMedia
        await socket.sendMessage(contactId, {
          video: Buffer.from(messageMedia.buffer),
          gifPlayback: message.sendVideoAsGif,
          mimetype: messageMedia.mimetype,
          fileName: messageMedia.filename,
          buttons: message.buttons.map((v) => {
            return {
              buttonId: v.id,
              buttonText: {
                displayText: v.body
              },
              type: 1
            }
          }),
          caption: message.body
        }, { quoted: options?.quotedMessage })
      } else if (message.mediaType === 'image') {
        const messageMedia = message.messageMedia as MessageMedia
        await socket.sendMessage(contactId, {
          image: Buffer.from(messageMedia.buffer),
          mimetype: messageMedia.mimetype,
          fileName: messageMedia.filename,
          buttons: message.buttons.map((v) => {
            return {
              buttonId: v.id,
              buttonText: {
                displayText: v.body
              },
              type: 1
            }
          }),
          caption: message.body
        }, { quoted: options?.quotedMessage })
        break
      }
      break
    case 'list':
      await socket.sendMessage(contactId, {
        text: message.body,
        footer: message.options?.footer,
        mentions: message?.mentions,
        buttonText: message.buttonText,
        title: message.options?.title,
        sections: message.sections
      }, { quoted: options?.quotedMessage })
      break
    case 'media':
      if (message.mediaType === 'audio') {
        await socket.sendMessage(contactId, {
          audio: Buffer.from(message.messageMedia.buffer),
          mimetype: message.messageMedia.mimetype,
          fileName: message.messageMedia.filename,
          mentions: message?.mentions,
          ptt: message?.sendAudioAsVoice
        }, { quoted: options?.quotedMessage })
      } else if (message.mediaType === 'image') {
        await socket.sendMessage(contactId, {
          image: Buffer.from(message.messageMedia.buffer),
          mimetype: message.messageMedia.mimetype,
          fileName: message.messageMedia.filename,
          mentions: message?.mentions,
          ptt: message?.sendAudioAsVoice,
          caption: message?.caption
        }, { quoted: options?.quotedMessage })
      } else if (message.mediaType === 'document') {
        await socket.sendMessage(contactId, {
          document: Buffer.from(message.messageMedia.buffer),
          mimetype: message.messageMedia.mimetype,
          fileName: message?.fileName ?? message.messageMedia.filename,
          caption: message?.caption,
          mentions: message?.mentions
        }, { quoted: options?.quotedMessage })
      } else if (message.mediaType === 'video') {
        await socket.sendMessage(contactId, {
          video: Buffer.from(message.messageMedia.buffer),
          mimetype: message.messageMedia.mimetype,
          fileName: message.messageMedia.filename,
          mentions: message?.mentions,
          ptt: message?.sendAudioAsVoice
        }, { quoted: options?.quotedMessage })
      }
      break
    case 'sticker':
      // eslint-disable-next-line no-case-declarations
      const sticker = new StickerConvert(Buffer.from(message.messageMedia.buffer))
      // eslint-disable-next-line no-case-declarations
      const buffer = await sticker.build({
        packname: message?.stickerName ?? '',
        author: message?.stickerAuthor ?? ''
      })
      await socket.sendMessage(contactId, {
        sticker: buffer.buffer,
        mentions: message?.mentions
      }, { quoted: options?.quotedMessage })
      buffer.deleteArchives()
      break
  }
}

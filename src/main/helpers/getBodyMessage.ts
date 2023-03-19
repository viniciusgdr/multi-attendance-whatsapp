import { getContentType, type proto } from '@adiwajshing/baileys'

export function getBodyMessage (message: proto.IMessage): string {
  const type = getContentType(message)
  const body = (type === 'conversation')
    ? message?.conversation
    : (type === 'imageMessage')
        ? message?.imageMessage?.caption
        : (type === 'videoMessage')
            ? message?.videoMessage?.caption
            : (type === 'extendedTextMessage')
                ? message?.extendedTextMessage?.text
                : (type === 'documentMessage')
                    ? message?.documentMessage?.title
                    : (type === 'locationMessage')
                        ? message?.locationMessage?.name
                        : (type === 'requestPaymentMessage')
                            ? message?.requestPaymentMessage?.noteMessage?.extendedTextMessage?.text
                            : (type === 'buttonsResponseMessage')
                                ? message?.buttonsResponseMessage?.selectedButtonId
                                : (type === 'contactMessage')
                                    ? message?.contactMessage?.displayName
                                    : (type === 'productMessage')
                                        ? message?.productMessage?.product?.title
                                        : (type === 'liveLocationMessage')
                                            ? message?.liveLocationMessage?.caption
                                            : (type === 'listResponseMessage')
                                                ? message?.listResponseMessage?.singleSelectReply?.selectedRowId
                                                : (type === 'templateButtonReplyMessage')
                                                    ? message?.templateButtonReplyMessage?.selectedId
                                                    : ''

  return body ?? ''
}

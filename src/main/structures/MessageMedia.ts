import * as fs from 'fs'
import mime from 'mime'
import path from 'path'
import fetch from 'node-fetch'

export async function getBuffer (url: string): Promise<{
  buffer: any
  mimetype: string
  fileName: string
}> {
  const response = await fetch(url, {
    headers: {
      'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.45 Safari/537.36',
      'cache-control': 'no-cache',
      pragma: 'no-cache',
      range: 'bytes=0-',
      'sec-ch-ua-mobile': '?0',
      'sec-fetch-dest': 'video',
      Referer: url,
      'Referrer-Policy': 'strict-origin-when-cross-origin'
    }
  })
  return {
    buffer: await response.buffer(),
    mimetype: response.headers.get('content-type') as string,
    fileName: response.headers.get('content-disposition') as string
  }
}
export class MessageMedia {
  mimetype: string
  buffer: Buffer
  filename: string
  constructor (mimetype: string, bufferOrBase64: Buffer | string, filename?: string) {
    this.mimetype = mimetype
    this.buffer = bufferOrBase64 instanceof Buffer ? bufferOrBase64 : Buffer.from(bufferOrBase64, 'base64')
    this.filename = filename ?? ''
  }

  /**
     * Creates a MessageMedia instance from a url
     * @param {string} url (URL Media)
     * @returns {MessageMedia}
     */
  static async fromUrl (url: string): Promise<MessageMedia> {
    const { fileName, mimetype, buffer } = await getBuffer(url)
    return new MessageMedia(mimetype, buffer, fileName)
  }

  /**
     * Creates a MessageMedia instance from a local file path
     * @param {string} filePath
     * @returns {MessageMedia}
     */
  static fromFilePath (filePath: string): MessageMedia {
    const b64data = fs.readFileSync(filePath)
    const filename = path.basename(filePath)
    let mimetype: string
    try {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      mimetype = mime.getType(filePath)!
    } catch {
      mimetype = filename.endsWith('mp3') ? 'audio/mp4' : 'video/mp4'
    }

    return new MessageMedia(mimetype, b64data, filename)
  }
};

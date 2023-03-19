/* eslint-disable */
import * as fs from 'fs'
import ffmpeg from 'fluent-ffmpeg'
const webp = require('node-webpmux')

interface IBuild {
  packname?: string
  author?: string
}
export class Sticker {
  media: string | Buffer
  fileNameTemp: number
  defaultDir: string
  constructor (media: Buffer | string) {
    this.media = media
    this.fileNameTemp = Date.now()
    this.defaultDir = './assets/temp/'
  }

  toFilePath (): string {
    if (typeof this.media === 'string') {
      return this.media
    } else {
      const file = this.defaultDir + this.fileNameTemp
      fs.writeFileSync(file, this.media)
      return file
    }
  }

  async build ({
    packname,
    author
  }: IBuild): Promise<{
      buffer: Buffer
      deleteArchives: () => void
    }> {
    return await new Promise(async (resolve, reject) => {
      const file = this.toFilePath()
      const fileWebp = this.defaultDir + this.fileNameTemp + '.webp'
      const fileWithExif = this.defaultDir + this.fileNameTemp + '_exif.webp'
      function deleteArchives () {
        fs.unlinkSync(file)
        fs.unlinkSync(fileWebp)
        if (packname || author) fs.unlinkSync(fileWithExif)
      }
      async function result () {
        if (packname || author) {
          const img = new webp.Image()
          const json = {
            'sticker-pack-id': 'https://bit.ly/TomoriBOT',
            'sticker-pack-name': packname,
            'sticker-pack-publisher': author,
            emojis: ['']
          }

          const exifAttr = Buffer.from([0x49, 0x49, 0x2A, 0x00, 0x08, 0x00, 0x00, 0x00, 0x01, 0x00, 0x41, 0x57, 0x07, 0x00, 0x00, 0x00, 0x00, 0x00, 0x16, 0x00, 0x00, 0x00])
          const jsonBuff = Buffer.from(JSON.stringify(json), 'utf-8')
          const exif = Buffer.concat([exifAttr, jsonBuff])
          exif.writeUIntLE(jsonBuff.length, 14, 4)

          await img.load(fileWebp)
          img.exif = exif
          await img.save(fileWithExif)
          resolve({
            buffer: fs.readFileSync(fileWithExif),
            deleteArchives
          })
        } else {
          resolve({
            buffer: fs.readFileSync(fileWebp),
            deleteArchives
          })
        }
      }
      ffmpeg(file)
        .addOutputOptions([
          '-vcodec',
          'libwebp',
          '-vf',
          'scale=\'iw*min(300/iw\,300/ih)\':\'ih*min(300/iw\,300/ih)\',format=rgba,pad=300:300:\'(300-iw)/2\':\'(300-ih)/2\':\'#00000000\',setsar=1,fps=15',
          '-loop',
          '0',
          '-ss',
          '00:00:00.0',
          '-t',
          '00:00:05.0',
          '-preset',
          'default',
          '-an',
          '-vsync',
          '0',
          '-s',
          '512:512'
        ])
        .save(fileWebp)
        .on('end', async () => { await result() })
    })
  }
}

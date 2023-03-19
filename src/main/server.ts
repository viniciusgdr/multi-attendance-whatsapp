import { BaileysConnection } from './config/app'


void (async () => {
  const baileysConnection = new BaileysConnection()
  await baileysConnection.prepareAuth('session')

  const connection = await baileysConnection.connect()

  connection.ev.on('message', (arg) => {
    console.log(arg)
    const time = (Date.now() / 1000 - Number(arg.t)).toFixed(3)
    if (time.toString().startsWith('-')) return Number(time.toString().replace('-', ''))
    console.log(time)
  })
})()

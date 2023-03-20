import { BaileysConnection } from './config/app'
import setupMiddlewares from './config/middlewares'
import setupPrivateCommands from './config/privateCommands'
import setupClientCommands from './config/clientCommands'

void (async () => {
  const baileysConnection = new BaileysConnection()
  await baileysConnection.prepareAuth('session')

  const connection = await baileysConnection.connect()
  setupMiddlewares(connection)
  setupPrivateCommands(connection)
  setupClientCommands(connection)
})()

import { type WAConnection } from '../interfaces/WAConnection'

export default (connection: WAConnection): void => {
  console.log('Middlewares loaded')
}

require('dotenv').config();

export default {
  PROD: process.env.PROD == 'true'
}
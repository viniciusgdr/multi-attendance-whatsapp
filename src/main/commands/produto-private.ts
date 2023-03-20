import { prismaClient } from '../config/app'
import { type WAMessage } from '../helpers/makeBaileysConnectionSocket'
import { type UtilsMessage } from '../interfaces/utilsMessage'
import { type WAConnection } from '../interfaces/WAConnection'

const helper: Record<string, {
  name: string
}> = {}
export default async (connection: WAConnection, message: WAMessage, utils: UtilsMessage): Promise<void> => {
  if (!utils.query && !helper[message.author]) {
    void connection.sendMessage(message.groupId, [
      {
        type: 'button',
        body: `📝 Criação de Produto
        
Digite o nome do produto juntamente ao comando:
Exemplo: /produto Pizza de Calabresa`,
        buttons: [
          {
            body: '📝 Cancelar',
            id: '/produto cancelar'
          }
        ]
      }
    ])
  } else if (utils.query === 'cancelar') {
    // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
    delete helper[message.author]
    void connection.sendMessage(message.groupId, [
      {
        type: 'text',
        message: '📝 Criação de Produto cancelada'
      }
    ], {
      quotedMessage: message
    })
  } else if (utils.query && !helper[message.author]) {
    const [operation, type, productId] = utils.query.split(' ')
    const productName = utils.query.replace(`${operation} ${type} ${productId} `, '')
    console.log(operation, type, productId)
    if (operation === 'editar') {
      const product = await prismaClient.product.findUnique({
        where: {
          id: Number(productId)
        }
      })
      if (!product) {
        void connection.sendMessage(message.groupId, [
          {
            type: 'text',
            message: '📝 Produto não encontrado'
          }
        ], {
          quotedMessage: message
        })
        return
      }
      if (type === 'nome') {
        if (productName.length > 5 && message.type !== 'listResponseMessage') {
          await prismaClient.product.update({
            where: {
              id: Number(productId)
            },
            data: {
              name: productName
            }
          })
          void connection.sendMessage(message.groupId, [
            {
              type: 'text',
              message: '📝 Nome editado'
            }
          ], {
            quotedMessage: message
          })
          return
        }
        void connection.sendMessage(message.groupId, [
          {
            type: 'text',
            message: `📝 Edição de ${type.toUpperCase()}
            
Digite o novo nome do produto juntamente ao comando:
Exemplo: /produto editar nome ${productId} Pizza de Calabresa`
          }
        ], {
          quotedMessage: message
        })
        return
      } else if (type === 'descricao') {
        if (productName.length > 5 && message.type !== 'listResponseMessage') {
          await prismaClient.product.update({
            where: {
              id: Number(productId)
            },
            data: {
              description: productName
            }
          })
          void connection.sendMessage(message.groupId, [
            {
              type: 'text',
              message: '📝 Descrição editado'
            }
          ], {
            quotedMessage: message
          })
          return
        }
        void connection.sendMessage(message.groupId, [
          {
            type: 'text',
            message: `📝 Edição de ${type.toUpperCase()}
            
Digite a nova descrição do produto juntamente ao comando:
Exemplo: /produto editar descricao ${productId} Pizza de Calabresa`
          }
        ], {
          quotedMessage: message
        })
        return
      } else if (type === 'preco') {
        const price = parseFloat(productName)
        if (price && message.type !== 'listResponseMessage') {
          await prismaClient.product.update({
            where: {
              id: Number(productId)
            },
            data: {
              price
            }
          })
          void connection.sendMessage(message.groupId, [
            {
              type: 'text',
              message: '📝 Preço editado'
            }
          ], {
            quotedMessage: message
          })
          return
        }
        void connection.sendMessage(message.groupId, [
          {
            type: 'text',
            message: `📝 Edição de ${type.toUpperCase()}
            
Digite o novo preço do produto juntamente ao comando:
Exemplo: /produto editar preco ${productId} 15.00`
          }
        ], {
          quotedMessage: message
        })
        return
      }
      void connection.sendMessage(message.groupId, [
        {
          type: 'list',
          body: `O que deseja fazer com ${product.name.toUpperCase()}?
          
Descrição: ${product.description}
Preço: R$ ${product.price}`,
          sections: [
            {
              title: '📝 Opções',
              rows: [
                {
                  title: '📝 Editar Nome',
                  description: 'Editar o nome do produto',
                  rowId: `/produto editar nome ${productId}`
                },
                {
                  title: '📝 Editar Preço',
                  description: 'Editar o preço do produto',
                  rowId: `/produto editar preco ${productId}`
                },
                {
                  title: '📝 Alterar Descricão',
                  description: 'Alterar a descrição do produto',
                  rowId: `/produto editar descricao ${productId}`
                },
                {
                  title: '📝 Excluir Produto',
                  description: 'Excluir o produto',
                  rowId: `/produto excluir produto ${productId}`
                }
              ]
            }
          ],
          buttonText: '📝 Ações'
        }
      ], {
        quotedMessage: message
      })
    } else if (operation === 'excluir') {
      await prismaClient.product.delete({
        where: {
          id: Number(productId)
        }
      })
      void connection.sendMessage(message.groupId, [
        {
          type: 'text',
          message: '📝 Produto excluído'
        }
      ], {
        quotedMessage: message
      })
    } else {
      helper[message.author] = {
        name: utils.query
      }
      void connection.sendMessage(message.groupId, [
        {
          type: 'text',
          message: `📝 Criação de Produto
  
*Nome:* ${utils.query}

Digite o preço do produto juntamente ao comando:
Exemplo: /produto 25.00`
        }
      ])
    }
  } else if (helper[message.author]) {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const price = parseFloat(utils.query!)
    if (!price) {
      void connection.sendMessage(message.groupId, [
        {
          type: 'text',
          message: `📝 Criação de Produto
  
Digite o preço do produto juntamente ao comando:
Exemplo: /produto 25.00`
        }
      ])
    } else {
      await prismaClient.product.create({
        data: {
          name: helper[message.author].name,
          price
        }
      })
      // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
      delete helper[message.author]
      void connection.sendMessage(message.groupId, [
        {
          type: 'text',
          message: '📝 Produto criado com sucesso!'
        }
      ])
    }
  }
}

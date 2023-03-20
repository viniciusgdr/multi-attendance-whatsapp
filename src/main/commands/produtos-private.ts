import { prismaClient } from '../config/app'
import { type WAMessage } from '../helpers/makeBaileysConnectionSocket'
import { type WAConnection } from '../interfaces/WAConnection'

export default async (connection: WAConnection, message: WAMessage): Promise<void> => {
  const products = await prismaClient.product.findMany()
  if (products.length === 0) {
    void connection.sendMessage(message.groupId, [
      {
        type: 'button',
        body: '📝 Lista de Produtos',
        footer: 'Nenhum produto cadastrado',
        title: 'Central',
        buttons: [
          {
            body: '📝 Cadastrar Produto',
            id: '/produto'
          }
        ]
      }
    ], {
      quotedMessage: message
    })
    return
  }
  void connection.sendMessage(message.groupId, [
    {
      type: 'list',
      body: '📝 Lista de Produtos',
      buttonText: 'Clique para editar',
      sections: products.filter((v) => !v.asAdditional).map((product) => {
        return {
          title: product.name,
          rows: [
            {
              title: `R$ ${product.price}`,
              description: product.description,
              rowId: `/produto editar type ${product.id}`
            }
          ]
        }
      }),
      options: {
        footer: 'Clique em um produto para editar'
      }
    }
  ])
}

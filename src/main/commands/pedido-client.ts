import { prismaClient } from '../config/app'
import { type WAMessage } from '../helpers/makeBaileysConnectionSocket'
import { type UtilsMessage } from '../interfaces/utilsMessage'
import { type WAConnection } from '../interfaces/WAConnection'

export default async (connection: WAConnection, message: WAMessage, utils: UtilsMessage): Promise<void> => {
  const products = await prismaClient.product.findMany()
  async function sendMsg (asFirstWelcome: boolean = false): Promise<void> {
    const cart = await prismaClient.cart.findMany({
      where: {
        userId: message.author
      },
      include: {
        product: true
      }
    })
    const sections = [
      {
        title: 'Pizzas',
        rows: products.filter((v) => !v.asAdditional).map((product) => {
          return {
            title: `${product.name} - R$${product.price}`,
            description: product.description,
            rowId: `/pedido view ${product.id}`
          }
        })
      }
    ]
    if (cart.length) {
      sections.unshift({
        title: 'Finalizar Pedido',
        rows: [
          {
            title: 'Finalizar Pedido',
            description: 'Clique para finalizar seu pedido',
            rowId: '/finalizar'
          }
        ]
      }, {
        title: 'Limpar Carrinho',
        rows: [
          {
            title: 'Limpar Carrinho',
            description: 'Clique para limpar seu carrinho',
            rowId: '/limpar'
          }
        ]
      })
    }
    void connection.sendMessage(message.groupId, [
      {
        type: 'list',
        body: `${asFirstWelcome
? 'Selecionamos os melhores produtos para você! 😍'
: `📝 Carrinho
        
${cart.length === 0 ? 'Seu carrinho está vazio.' : cart.map((v) => `🍕 ${v.quantity}x | ${v.product.name} - R$${v.product.price * v.quantity}`).join('\n')}`}
      
${cart.length === 0 ? 'Bem-vindo(a) ao menu de pedidos da ETEGEC Pizzaria! Aqui você encontrará uma grande variedade de sabores deliciosos para satisfazer seu paladar. Escolha seus ingredientes favoritos e monte sua pizza perfeita. Aproveite nosso sistema de pedidos via lista e faça sua encomenda com facilidade.' : `Total: R$${(cart.reduce((acc, v) => (acc + v.product.price) * v.quantity, 0)).toFixed(2)}`}`,
        buttonText: 'Opções',
        options: {
          footer: cart.length === 0
            ? '📝 Selecione na lista abaixo o produto que deseja adicionar ao seu pedido.'
            : `📝 Selecione na lista abaixo o produto que deseja adicionar ao seu pedido.
          
Caso queira finalizar seu pedido, clique no primeiro botão da lista.`
        },
        sections
      }
    ], {
      quotedMessage: message
    })
  }
  if (!utils.query) {
    const cart = await prismaClient.cart.findMany({
      where: {
        userId: message.author
      },
      include: {
        product: true
      }
    })
    if (!cart.length) await sendMsg(true)
    else if (cart.length) await sendMsg(false)
    return
  }
  const [action, idProduct] = utils.query.split(' ')
  const product = await prismaClient.product.findUnique({
    where: {
      id: Number(idProduct)
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
  if (action === 'view') {
    void connection.sendMessage(message.groupId, [
      {
        type: 'button',
        body: `📝 ${product.name}

${product.description}

R$ ${product.price}`,
        footer: 'Escolha uma opção abaixo:',
        buttons: [
          {
            body: '📝 Adicionar ao pedido',
            id: `/pedido ask ${product.id}`
          },
          {
            body: '📝 Voltar',
            id: '/pedido'
          }
        ]
      }
    ])
  } else if (action === 'ask') {
    void connection.sendMessage(message.groupId, [
      {
        type: 'list',
        body: `📝 ${product.name}

Quantas unidades você deseja adicionar ao seu pedido?`,
        buttonText: 'Opções',
        sections: [
          {
            title: 'Quantidade',
            rows: Array.from({ length: 10 }, (_, i) => i + 1).map((v) => {
              return {
                title: `${v} unidade${v > 1 ? 's' : ''}`,
                rowId: `/pedido add ${product.id} ${v}`,
                description: `R$ ${(product.price * v).toFixed(2)}`
              }
            })
          }
        ]
      }
    ])
  } else if (action === 'add') {
    await prismaClient.cart.create({
      data: {
        productId: product.id,
        userId: message.author,
        quantity: Number(utils.query.split(' ')[2])
      }
    })
    void connection.sendMessage(message.groupId, [
      {
        type: 'text',
        message: '📝 Produto adicionado ao seu pedido com sucesso!'
      }
    ])
    await sendMsg()
  }
}

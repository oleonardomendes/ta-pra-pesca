import { blingFetch } from '@/lib/bling'
import { supabase } from '@/lib/supabase'
export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const codigo = searchParams.get('codigo') || '81102'
  const produtoId = Number(searchParams.get('produtoId') || 0) || undefined
  const nome = searchParams.get('nome') || 'Vara de Pesca Enjoylure'
  const valor = Number(searchParams.get('valor') || '129.89')
  const frete = Number(searchParams.get('frete') || '14.00')

  const delay = (ms: number) => new Promise(r => setTimeout(r, ms))
  const hoje = new Date().toISOString().split('T')[0]

  try {
    // 1. Cria contato de teste
    await delay(300)
    const contato = await blingFetch('/contatos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nome: 'Cliente Teste Site',
        tipo: 'F',
        situacao: 'A',
        enderecos: [{
          tipo: 'R',
          endereco: 'Rua Teste',
          numero: '123',
          bairro: 'Centro',
          municipio: 'São Paulo',
          uf: 'SP',
          cep: '01310100',
          pais: 'Brasil',
          nomePais: 'Brasil',
        }],
      }),
    })
    const contatoId = contato?.data?.id
    console.log('[teste-bling] contato criado:', contatoId)

    // 2. Cria pedido com produto real
    await delay(500)
    const pedido = await blingFetch('/pedidos/vendas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        data: hoje,
        situacao: { id: 6 },
        contato: { id: contatoId },
        observacoes: `TESTE — Pedido via site taprapesca.com.br`,
        transporte: {
          fretePorConta: 'D',
          frete: frete,
          volumes: [{ servico: 'Correios SEDEX' }],
        },
        enderecoEntrega: {
          endereco: 'Rua Teste',
          numero: '123',
          bairro: 'Centro',
          municipio: 'São Paulo',
          uf: 'SP',
          cep: '01310100',
          pais: 'Brasil',
          nomePais: 'Brasil',
        },
        itens: [{
          produto: { id: produtoId },
          descricao: nome,
          quantidade: 1,
          valor: valor,
          unidade: 'UN',
          tipo: 'P',
        }],
      }),
    })

    console.log('[teste-bling] pedido criado:', JSON.stringify(pedido))
    return Response.json({
      ok: true,
      contatoId,
      pedido: pedido?.data,
    })

  } catch (e: any) {
    console.error('[teste-bling] erro:', e.message)
    return Response.json({ erro: e.message }, { status: 500 })
  }
}

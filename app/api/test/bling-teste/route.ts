import { blingFetch } from '@/lib/bling'
import { supabase } from '@/lib/supabase'
export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const codigo = searchParams.get('codigo') || '81102'
  const nome = searchParams.get('nome') || 'Vara de Pesca Enjoylure'
  const valor = Number(searchParams.get('valor') || '129.89')
  const frete = Number(searchParams.get('frete') || '14.00')

  const delay = (ms: number) => new Promise(r => setTimeout(r, ms))
  const hoje = new Date().toISOString().split('T')[0]

  try {
    // 1. Busca produto no Bling pelo código SKU
    await delay(300)
    const produtoRes = await blingFetch(`/produtos?codigo=${codigo}&limite=1`)
    const produtoBling = produtoRes?.data?.[0]
    const produtoId = produtoBling?.id || null
    console.log('[teste-bling] produto encontrado:', produtoId, produtoBling?.nome)

    // 2. Busca ou cria contato de teste
    let contatoId: number | null = null

    try {
      await delay(300)
      const busca = await blingFetch('/contatos?pesquisa=Cliente+Teste+Site&limite=5')
      const encontrado = busca?.data?.find((c: any) => c.nome === 'Cliente Teste Site')
      if (encontrado) {
        contatoId = encontrado.id
        console.log('[teste-bling] contato existente:', contatoId)
      }
    } catch {}

    if (!contatoId) {
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
      contatoId = contato?.data?.id
      console.log('[teste-bling] contato criado:', contatoId)
    }

    // 3. Cria pedido com produto real
    const enderecoEntregaData = {
      endereco: 'Rua das Flores',
      numero: '100',
      complemento: '',
      bairro: 'Centro',
      municipio: 'São Paulo',
      uf: 'SP',
      cep: '01310-100',
      pais: 'Brasil',
      nomePais: 'Brasil',
    }

    await delay(500)
    const pedido = await blingFetch('/pedidos/vendas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        data: hoje,
        situacao: { id: 6 },
        contato: { id: contatoId },
        observacoes: `TESTE — ${new Date().toISOString()} — Pedido via site taprapesca.com.br`,
        enderecoEntrega: enderecoEntregaData,
        transporte: {
          fretePorConta: 'D',
          frete: frete,
          volumes: [{ servico: 'Correios SEDEX' }],
          enderecoEntrega: enderecoEntregaData,
        },
        itens: [{
          ...(produtoId ? { produto: { id: produtoId } } : {}),
          descricao: produtoBling?.nome || nome,
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

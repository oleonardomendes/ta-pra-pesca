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
    const cpfTeste = '52998224725'
    const cpfTesteFormatado = '529.982.247-25'
    let contatoId: number | null = null

    // ETAPA 1: Busca por CPF primeiro
    try {
      await delay(300)
      const [buscaFormatado, buscaSemFormato] = await Promise.allSettled([
        blingFetch(`/contatos?pesquisa=${encodeURIComponent(cpfTesteFormatado)}&limite=10`),
        blingFetch(`/contatos?pesquisa=${cpfTeste}&limite=10`),
      ])

      const resultados = [
        ...(buscaFormatado.status === 'fulfilled' ? buscaFormatado.value?.data || [] : []),
        ...(buscaSemFormato.status === 'fulfilled' ? buscaSemFormato.value?.data || [] : []),
      ]

      const encontrado = resultados.find((c: any) =>
        (c.numeroDocumento || '').replace(/\D/g, '') === cpfTeste
      )

      if (encontrado) {
        contatoId = encontrado.id
        console.log('[teste-bling] contato existente encontrado:', contatoId, encontrado.nome)
      }
    } catch (e: any) {
      console.log('[teste-bling] erro na busca CPF:', e.message)
    }

    // ETAPA 2: Só cria se não encontrou
    if (!contatoId) {
      try {
        await delay(300)
        const contato = await blingFetch('/contatos', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            nome: 'Cliente Teste Site',
            tipo: 'F',
            situacao: 'A',
            numeroDocumento: cpfTesteFormatado,
            endereco: {
              geral: {
                endereco: 'Rua das Flores',
                cep: '01310100',
                bairro: 'Centro',
                municipio: 'São Paulo',
                uf: 'SP',
                numero: '100',
                complemento: '',
              },
            },
          }),
        })
        contatoId = contato?.data?.id
        console.log('[teste-bling] contato criado:', contatoId)
      } catch (e: any) {
        console.log('[teste-bling] erro criar contato:', e.message)
      }
    }

    // PUT para garantir CPF e endereço atualizados
    if (contatoId) {
      try {
        await delay(300)
        const putRes = await blingFetch(`/contatos/${contatoId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            nome: 'Cliente Teste Site',
            tipo: 'F',
            situacao: 'A',
            numeroDocumento: cpfTesteFormatado,
            endereco: {
              geral: {
                endereco: 'Rua das Flores',
                cep: '01310100',
                bairro: 'Centro',
                municipio: 'São Paulo',
                uf: 'SP',
                numero: '100',
                complemento: '',
              },
            },
          }),
        })
        console.log('[teste-bling] PUT contato:', JSON.stringify(putRes))
      } catch (putErr: any) {
        console.error('[teste-bling] PUT contato erro:', putErr.message)
      }
    }

    // 4. Cria pedido com produto real
    await delay(500)
    const pedido = await blingFetch('/pedidos/vendas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        data: hoje,
        situacao: { id: 6 },
        contato: { id: contatoId },
        observacoes: `TESTE — ${new Date().toISOString()} — Pedido via site taprapesca.com.br`,
        transporte: {
          fretePorConta: 'D',
          frete: frete,
          quantidadeVolumes: 1,
          pesoBruto: 0.26,
          volumes: [{ id: 1, servico: 'Correios SEDEX' }],
          etiqueta: {
            nome: 'Cliente Teste Site',
            endereco: 'Rua das Flores',
            numero: '100',
            complemento: '',
            bairro: 'Centro',
            municipio: 'São Paulo',
            uf: 'SP',
            cep: '01310100',
            nomePais: 'Brasil',
          },
        },
        observacoesInternas: 'Vara de Pesca: 0.26kg | 9x9x127cm',
        itens: [{
          id: 1,
          ...(produtoId ? { produto: { id: produtoId } } : {}),
          descricao: produtoBling?.nome || nome,
          quantidade: 1,
          valor: valor,
          unidade: 'UN',
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

import { MercadoPagoConfig, Payment } from 'mercadopago'
import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { blingFetch } from '@/lib/bling'

export const dynamic = 'force-dynamic'

const client = new MercadoPagoConfig({
  accessToken: process.env.NEXT_PUBLIC_MP_ENV === 'test'
    ? process.env.MP_ACCESS_TOKEN_TEST!
    : process.env.MP_ACCESS_TOKEN!
})

const delay = (ms: number) => new Promise(r => setTimeout(r, ms))

export async function POST(req: Request) {
  try {
    const body = await req.json()
    console.log('[webhook] recebido:', JSON.stringify(body))

    if (body.type !== 'payment') {
      return NextResponse.json({ ok: true })
    }

    const paymentId = body.data?.id
    if (!paymentId) return NextResponse.json({ ok: true })

    // Busca dados do pagamento no MP
    let data: any
    try {
      const payment = new Payment(client)
      data = await payment.get({ id: paymentId })
    } catch (e: any) {
      console.log('[webhook] pagamento não encontrado:', paymentId)
      return NextResponse.json({ ok: true })
    }

    console.log('[webhook] status:', data.status, 'ref:', data.external_reference)

    if (data.status !== 'approved') {
      return NextResponse.json({ ok: true })
    }

    const externalRef = data.external_reference

    let pedidoId: string | null = null

    if (externalRef) {
      const { data: updated, error } = await supabase
        .from('pedidos')
        .update({
          status: 'aprovado',
          mp_payment_id: String(paymentId),
          updated_at: new Date().toISOString(),
        })
        .eq('id', externalRef)
        .select()
        .single()

      if (error) {
        console.error('[webhook] erro ao atualizar:', error)
      } else {
        console.log('[webhook] pedido atualizado:', updated.id)
        pedidoId = updated.id
      }
    }

    // Fallback: cria novo pedido se não encontrou pelo external_reference
    if (!pedidoId) {
      const { data: novo } = await supabase
        .from('pedidos')
        .insert({
          mp_payment_id: String(paymentId),
          status: 'aprovado',
          total: data.transaction_amount || 0,
          itens: [],
          updated_at: new Date().toISOString(),
        })
        .select()
        .single()

      pedidoId = novo?.id || null
      console.log('[webhook] novo pedido criado (fallback):', pedidoId)
    }

    // Busca dados completos do pedido
    const { data: pedidoCompleto } = await supabase
      .from('pedidos')
      .select('*')
      .eq('id', pedidoId!)
      .single()

    if (!pedidoCompleto) {
      return NextResponse.json({ ok: true })
    }

    // Lock distribuído: só processa se bling_pedido_id ainda for null
    const { data: lockResult } = await supabase
      .from('pedidos')
      .update({ bling_pedido_id: 'processing' })
      .eq('id', pedidoId!)
      .is('bling_pedido_id', null)
      .select('id')
      .single()

    if (!lockResult) {
      console.log('[webhook] pedido já sendo processado por outro webhook')
      return NextResponse.json({ ok: true })
    }

    console.log('[webhook] lock adquirido, processando Bling...')

    // Nome do cliente: Supabase Auth > MP payer > fallback
    let nomeCliente = 'Cliente'
    if (pedidoCompleto.user_id) {
      try {
        const { data: userData } = await supabase.auth.admin.getUserById(
          pedidoCompleto.user_id
        )
        nomeCliente = userData?.user?.user_metadata?.nome || 'Cliente'
        console.log('[webhook] nome do cliente:', nomeCliente)
      } catch {}
    }
    if (nomeCliente === 'Cliente') {
      nomeCliente = data.payer?.first_name
        ? `${data.payer.first_name} ${data.payer.last_name || ''}`.trim()
        : 'Cliente'
    }

    const cpfLimpo = (pedidoCompleto.cpf || '').replace(/\D/g, '')
    const emailPagador = data.payer?.email || ''
    const emailValido = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailPagador)
      && !emailPagador.includes('taprapesca')
      && !emailPagador.includes('testuser')
      ? emailPagador : undefined

    console.log('[webhook] nome final:', nomeCliente, '| email:', emailPagador, '| emailValido:', !!emailValido)

    // Helper para montar array de endereços no formato Bling
    const montarEndereco = (endereco: any) => {
      if (!endereco) return []
      const e = typeof endereco === 'string' ? JSON.parse(endereco) : endereco
      return [{
        tipo: 'R',
        endereco: e.logradouro || '',
        numero: e.numero || '',
        complemento: e.complemento || '',
        bairro: e.bairro || '',
        municipio: e.cidade || '',
        uf: e.estado || '',
        cep: (e.cep || '').replace(/\D/g, ''),
        pais: 'Brasil',
        nomePais: 'Brasil',
      }]
    }

    // Função auxiliar para criar contato no Bling
    const criarContato = async (comEndereco: boolean) => {
      const contatoBody: any = {
        nome: nomeCliente,
        tipo: 'F',
        situacao: 'A',
        numeroDocumento: cpfLimpo || undefined,
        email: emailValido,
      }
      if (comEndereco) {
        contatoBody.enderecos = montarEndereco(pedidoCompleto.endereco)
      }
      return blingFetch('/contatos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(contatoBody),
      })
    }

    // Criação de contato com fallbacks
    let contatoId: number | null = null

    try {
      await delay(300)
      const resultado = await criarContato(true)
      contatoId = resultado?.data?.id || null
      console.log('[webhook] contato criado com endereço:', contatoId)

    } catch (e: any) {
      console.error('[webhook] erro criar contato:', e.message)

      if (e.message.includes('cidade')) {
        // Cidade não encontrada no Bling — cria sem endereço
        console.log('[webhook] cidade inválida, criando sem endereço...')
        try {
          await delay(300)
          const resultado = await criarContato(false)
          contatoId = resultado?.data?.id || null
          console.log('[webhook] contato criado sem endereço:', contatoId)
        } catch (e2: any) {
          console.error('[webhook] erro criar contato sem endereço:', e2.message)
        }

      } else if (cpfLimpo && e.message.includes('CPF')) {
        // CPF já existe — busca contato existente
        try {
          await delay(400)
          const busca = await blingFetch(`/contatos?pesquisa=${cpfLimpo}&limite=20`)
          const lista = busca?.data || []
          const encontrado = lista.find((c: any) =>
            (c.numeroDocumento || '').replace(/\D/g, '') === cpfLimpo
          )
          if (encontrado) {
            contatoId = encontrado.id
            console.log('[webhook] contato encontrado por CPF:', contatoId)

            // Atualiza endereço do contato existente
            if (pedidoCompleto.endereco) {
              try {
                await delay(400)
                await blingFetch(`/contatos/${contatoId}`, {
                  method: 'PUT',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    nome: nomeCliente,
                    tipo: 'F',
                    situacao: 'A',
                    enderecos: montarEndereco(pedidoCompleto.endereco),
                  }),
                })
                console.log('[webhook] contato atualizado com endereço:', contatoId)
              } catch (upErr: any) {
                console.log('[webhook] não foi possível atualizar endereço:', upErr.message)
              }
            }
          } else {
            // Não encontrou por CPF — cria sem CPF
            await delay(300)
            const resultado = await criarContato(false)
            contatoId = resultado?.data?.id || null
            console.log('[webhook] contato sem CPF criado:', contatoId)
          }
        } catch {}
      }
    }

    if (!contatoId) {
      await supabase.from('pedidos').update({ bling_pedido_id: null }).eq('id', pedidoId!)
      console.error('[webhook] não foi possível criar contato — lock liberado')
      return NextResponse.json({ ok: true })
    }

    // Cria o pedido no Bling
    const itensPedido = Array.isArray(pedidoCompleto.itens)
      ? pedidoCompleto.itens
      : JSON.parse(typeof pedidoCompleto.itens === 'string' ? pedidoCompleto.itens : '[]')

    console.log('[webhook] itens do pedido:', JSON.stringify(itensPedido))

    const hoje = new Date().toISOString().split('T')[0]

    const blingBody = {
      data: hoje,
      numero: String(paymentId).slice(-6),
      numeroPedidoCompra: String(paymentId),
      situacao: { id: 6 },
      contato: { id: contatoId },
      observacoes: `Pedido via site taprapesca.com.br | MP: ${paymentId}`,
      transporte: {
        fretePorConta: 'D',
        frete: Number(pedidoCompleto.frete_valor) || 0,
        volumes: [{ servico: pedidoCompleto.frete_servico || 'Correios' }],
      },
      enderecoEntrega: pedidoCompleto.endereco ? {
        endereco: pedidoCompleto.endereco.logradouro || '',
        numero: pedidoCompleto.endereco.numero || '',
        complemento: pedidoCompleto.endereco.complemento || '',
        bairro: pedidoCompleto.endereco.bairro || '',
        municipio: pedidoCompleto.endereco.cidade || '',
        uf: pedidoCompleto.endereco.estado || '',
        cep: (pedidoCompleto.endereco.cep || '').replace(/\D/g, ''),
        pais: 'Brasil',
        nomePais: 'Brasil',
      } : undefined,
      itens: itensPedido.length > 0
        ? itensPedido.map((item: any) => ({
            codigo: String(item.codigo || ''),
            descricao: item.nome || 'Produto',
            quantidade: Number(item.quantidade) || 1,
            valor: Number(item.valor) || 0,
            unidade: 'UN',
            tipo: 'P',
          }))
        : [{
            descricao: 'Pedido Tá Pra Pesca',
            quantidade: 1,
            valor: Math.max(0, Number(pedidoCompleto.total) - Number(pedidoCompleto.frete_valor || 0)),
            unidade: 'UN',
            tipo: 'P',
          }],
    }

    try {
      await delay(600)
      console.log('[webhook] criando pedido Bling...')
      const blingRes = await blingFetch('/pedidos/vendas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(blingBody),
      })

      const blingPedidoId = blingRes?.data?.id
      console.log('[webhook] pedido Bling criado:', blingPedidoId)

      await supabase.from('pedidos')
        .update({ bling_pedido_id: String(blingPedidoId) })
        .eq('id', pedidoId!)

    } catch (bErr: any) {
      console.error('[webhook] erro criar pedido Bling:', bErr.message)

      const isDuplicata = bErr.message.includes('"code":3')
        || bErr.message.includes('"code":50')
        || bErr.message.includes('idênticas')
        || bErr.message.includes('mesma situa')

      if (isDuplicata) {
        console.log('[webhook] pedido já existe no Bling — marcando como processado')
        await supabase.from('pedidos')
          .update({ bling_pedido_id: 'duplicata-bling' })
          .eq('id', pedidoId!)
      } else {
        // Erro real — libera o lock para nova tentativa
        await supabase.from('pedidos')
          .update({ bling_pedido_id: null })
          .eq('id', pedidoId!)
      }
    }

    return NextResponse.json({ ok: true })

  } catch (e: any) {
    console.error('[webhook] erro geral:', e.message)
    return NextResponse.json({ ok: true })
  }
}

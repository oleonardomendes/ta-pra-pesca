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

    // ============================================
    // BLOCO DE CONTATO — nunca aborta por CPF
    // ============================================

    let contatoId: number | null = null

    const enderecos = pedidoCompleto.endereco ? [{
      tipo: 'R',
      endereco: typeof pedidoCompleto.endereco === 'string'
        ? JSON.parse(pedidoCompleto.endereco).logradouro
        : pedidoCompleto.endereco.logradouro || '',
      numero: typeof pedidoCompleto.endereco === 'string'
        ? JSON.parse(pedidoCompleto.endereco).numero
        : pedidoCompleto.endereco.numero || '',
      complemento: typeof pedidoCompleto.endereco === 'string'
        ? JSON.parse(pedidoCompleto.endereco).complemento
        : pedidoCompleto.endereco.complemento || '',
      bairro: typeof pedidoCompleto.endereco === 'string'
        ? JSON.parse(pedidoCompleto.endereco).bairro
        : pedidoCompleto.endereco.bairro || '',
      municipio: typeof pedidoCompleto.endereco === 'string'
        ? JSON.parse(pedidoCompleto.endereco).cidade
        : pedidoCompleto.endereco.cidade || '',
      uf: typeof pedidoCompleto.endereco === 'string'
        ? JSON.parse(pedidoCompleto.endereco).estado
        : pedidoCompleto.endereco.estado || '',
      cep: (typeof pedidoCompleto.endereco === 'string'
        ? JSON.parse(pedidoCompleto.endereco).cep
        : pedidoCompleto.endereco.cep || '').replace(/\D/g, ''),
      pais: 'Brasil',
      nomePais: 'Brasil',
    }] : []

    // ETAPA 1: Tenta criar contato completo (com CPF e endereço)
    try {
      await delay(300)
      const res = await blingFetch('/contatos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome: nomeCliente,
          tipo: 'F',
          situacao: 'A',
          numeroDocumento: cpfLimpo || undefined,
          email: emailValido,
          enderecos,
        }),
      })
      contatoId = res?.data?.id || null
      console.log('[webhook] contato criado com CPF:', contatoId)
    } catch (e: any) {
      console.log('[webhook] não criou com CPF:', e.message.slice(0, 100))

      // ETAPA 2: CPF já existe — busca o contato
      if (cpfLimpo && e.message.includes('CPF')) {
        try {
          await delay(300)
          const busca = await blingFetch(`/contatos?pesquisa=${cpfLimpo}&limite=20`)
          const lista = busca?.data || []
          console.log('[webhook] busca CPF retornou:', lista.length, 'contatos')

          const encontrado = lista.find((c: any) =>
            (c.numeroDocumento || '').replace(/\D/g, '') === cpfLimpo
          )

          if (encontrado) {
            contatoId = encontrado.id
            console.log('[webhook] contato encontrado:', contatoId, encontrado.nome)

            // Atualiza endereço com os dados do pedido atual
            try {
              await delay(300)
              await blingFetch(`/contatos/${contatoId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  nome: encontrado.nome,
                  tipo: 'F',
                  situacao: 'A',
                  enderecos,
                }),
              })
              console.log('[webhook] endereço atualizado no contato existente')
            } catch (upErr: any) {
              console.log('[webhook] não atualizou endereço:', upErr.message.slice(0, 80))
            }
          }
        } catch (bErr: any) {
          console.log('[webhook] busca falhou:', bErr.message.slice(0, 80))
        }
      }
    }

    // ETAPA 3: Se ainda sem contato, cria SEM CPF (nunca bloqueia o pedido)
    if (!contatoId) {
      try {
        await delay(300)
        const res = await blingFetch('/contatos', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            nome: nomeCliente,
            tipo: 'F',
            situacao: 'A',
            email: emailValido,
            enderecos,
          }),
        })
        contatoId = res?.data?.id || null
        console.log('[webhook] contato criado sem CPF:', contatoId)
      } catch (e3: any) {
        console.log('[webhook] falha sem CPF também:', e3.message.slice(0, 80))
      }
    }

    // ETAPA 4: Último recurso — cria contato mínimo sem nada
    if (!contatoId) {
      try {
        await delay(300)
        const res = await blingFetch('/contatos', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            nome: nomeCliente,
            tipo: 'F',
            situacao: 'A',
          }),
        })
        contatoId = res?.data?.id || null
        console.log('[webhook] contato mínimo criado:', contatoId)
      } catch (e4: any) {
        console.error('[webhook] falha total no contato:', e4.message.slice(0, 80))
      }
    }

    // SE MESMO ASSIM NÃO TEM CONTATO, libera lock e sai
    if (!contatoId) {
      await supabase.from('pedidos')
        .update({ bling_pedido_id: null })
        .eq('id', pedidoId!)
      console.error('[webhook] impossível criar contato — pedido não enviado ao Bling')
      return NextResponse.json({ ok: true })
    }

    // ============================================
    // A PARTIR DAQUI: SEMPRE CRIA O PEDIDO
    // ============================================

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
        ? itensPedido.map((item: any) => {
            const codigoValido = item.codigo
              && item.codigo !== '123456'
              && item.codigo.length <= 20
              && !/^\d{10,}$/.test(item.codigo)
              ? String(item.codigo)
              : ''

            return {
              ...(codigoValido ? { codigo: codigoValido } : {}),
              descricao: item.nome || 'Produto',
              quantidade: Number(item.quantidade) || 1,
              valor: Number(item.valor) || 0,
              unidade: 'UN',
              tipo: 'P',
            }
          })
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

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

    const externalRef = data.external_reference // = pedidoId (UUID)

    let pedidoId: string | null = null

    if (externalRef) {
      // Atualiza o pré-registro existente pelo external_reference
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

    // Se não encontrou pelo external_reference, cria novo (fallback)
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

    // Busca dados completos para o Bling
    const { data: pedidoCompleto } = await supabase
      .from('pedidos')
      .select('*')
      .eq('id', pedidoId!)
      .single()

    if (!pedidoCompleto) {
      return NextResponse.json({ ok: true })
    }

    // Evita duplicata: se já foi enviado ao Bling, encerra
    if (pedidoCompleto.bling_pedido_id) {
      console.log('[webhook] pedido já enviado ao Bling:', pedidoCompleto.bling_pedido_id)
      return NextResponse.json({ ok: true })
    }

    // Envia ao Bling
    try {
      const hoje = new Date().toISOString().split('T')[0]
      const cpfLimpo = pedidoCompleto.cpf?.replace(/\D/g, '') || ''
      const emailPagador = data.payer?.email || ''
      const emailValido = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailPagador)
        && !emailPagador.includes('taprapesca')
        && !emailPagador.includes('testuser')
        ? emailPagador
        : undefined
      console.log('[webhook] email pagador:', emailPagador, 'válido:', !!emailValido)

      // Busca nome real do usuário no Supabase Auth
      let nomeCliente = 'Cliente'
      if (pedidoCompleto.user_id) {
        try {
          const { data: userData } = await supabase.auth.admin.getUserById(
            pedidoCompleto.user_id
          )
          const nomeAuth = userData?.user?.user_metadata?.nome
          if (nomeAuth) {
            nomeCliente = nomeAuth
            console.log('[webhook] nome do usuário Supabase:', nomeCliente)
          }
        } catch {}
      }
      if (nomeCliente === 'Cliente') {
        nomeCliente = data.payer?.first_name
          ? `${data.payer.first_name} ${data.payer.last_name || ''}`.trim()
          : 'Cliente'
      }
      console.log('[webhook] nome final para Bling:', nomeCliente)

      let contatoId: number | null = null

      try {
        const novoContato = await blingFetch('/contatos', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            nome: nomeCliente,
            tipo: 'F',
            situacao: 'A',
            numeroDocumento: cpfLimpo || undefined,
            email: emailValido,
            enderecos: pedidoCompleto.endereco ? [{
              tipo: 'R',
              endereco: pedidoCompleto.endereco.logradouro || '',
              numero: pedidoCompleto.endereco.numero || '',
              complemento: pedidoCompleto.endereco.complemento || '',
              bairro: pedidoCompleto.endereco.bairro || '',
              municipio: pedidoCompleto.endereco.cidade || '',
              uf: pedidoCompleto.endereco.estado || '',
              cep: (pedidoCompleto.endereco.cep || '').replace(/\D/g, ''),
              pais: 'Brasil',
              nomePais: 'Brasil',
            }] : [],
          }),
        })
        contatoId = novoContato?.data?.id || null
        console.log('[webhook] contato criado:', contatoId, nomeCliente)

      } catch (e: any) {
        console.error('[webhook] erro ao criar contato:', e.message)

        // CPF já existe — busca contato existente
        if (cpfLimpo && e.message.includes('CPF')) {
          try {
            console.log('[webhook] CPF já existe — buscando contato...')
            const busca = await blingFetch(
              `/contatos?pesquisa=${cpfLimpo}&limite=5`
            )
            console.log('[webhook] busca CPF:', JSON.stringify(busca?.data))

            const contatoComCpf = busca?.data?.find((c: any) =>
              (c.numeroDocumento || '').replace(/\D/g, '') === cpfLimpo
            )

            if (contatoComCpf) {
              contatoId = contatoComCpf.id
              console.log('[webhook] contato encontrado por CPF:', contatoId, contatoComCpf.nome)

              if (
                contatoComCpf.nome === 'Cliente' ||
                contatoComCpf.nome === 'Consumidor Final'
              ) {
                try {
                  await blingFetch(`/contatos/${contatoId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ nome: nomeCliente, tipo: 'F', situacao: 'A' }),
                  })
                  console.log('[webhook] contato atualizado para:', nomeCliente)
                } catch {}
              }
            }
          } catch (buscaErr: any) {
            console.error('[webhook] erro busca CPF:', buscaErr.message)
          }
        }
      }

      // Último fallback: cria sem CPF
      if (!contatoId) {
        try {
          const semCpf = await blingFetch('/contatos', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nome: nomeCliente, tipo: 'F', situacao: 'A' }),
          })
          contatoId = semCpf?.data?.id || null
          console.log('[webhook] contato criado sem CPF:', contatoId)
        } catch (e: any) {
          console.error('[webhook] falha total ao criar contato:', e.message)
        }
      }

      if (!contatoId) {
        console.error('[webhook] não foi possível obter contato — abortando')
        return NextResponse.json({ ok: true })
      }

      // 3. Cria o pedido no Bling com o contato encontrado/criado
      const itensPedido = Array.isArray(pedidoCompleto.itens)
        ? pedidoCompleto.itens
        : JSON.parse(typeof pedidoCompleto.itens === 'string'
            ? pedidoCompleto.itens : '[]')

      const blingBody = {
        data: hoje,
        numero: String(paymentId).slice(-6),
        numeroPedidoCompra: String(paymentId),
        situacao: { id: 6 },
        contato: { id: contatoId },
        observacoes: `Pedido via site - MP Payment ID: ${paymentId}`,
        transporte: {
          fretePorConta: 'D',
          frete: Number(pedidoCompleto.frete_valor) || 0,
          volumes: [{
            servico: pedidoCompleto.frete_servico || 'Correios',
          }],
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
              descricao: item.nome || 'Produto',
              quantidade: Number(item.quantidade) || 1,
              valor: Number(item.valor) || 0,
              unidade: 'UN',
              tipo: 'P',
            }))
          : [{
              descricao: 'Pedido Tá Pra Pesca',
              quantidade: 1,
              valor: Math.max(0,
                Number(pedidoCompleto.total) - Number(pedidoCompleto.frete_valor || 0)
              ),
              unidade: 'UN',
              tipo: 'P',
            }],
      }

      console.log('[webhook] enviando Bling:', JSON.stringify(blingBody))
      const blingRes = await blingFetch('/pedidos/vendas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(blingBody),
      })
      console.log('[webhook] Bling ok:', JSON.stringify(blingRes))

      // Salva o ID do pedido Bling para evitar duplicatas futuras
      if (blingRes?.data?.id) {
        await supabase
          .from('pedidos')
          .update({ bling_pedido_id: String(blingRes.data.id) })
          .eq('id', pedidoId!)
        console.log('[webhook] bling_pedido_id salvo:', blingRes.data.id)
      }

    } catch (blingErr: any) {
      console.error('[webhook] erro Bling:', blingErr.message)
    }

    return NextResponse.json({ ok: true })

  } catch (e: any) {
    console.error('[webhook] erro geral:', e.message)
    return NextResponse.json({ ok: true })
  }
}

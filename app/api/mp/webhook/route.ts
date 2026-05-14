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
  const body = await req.json()
  console.log('[webhook] recebido:', JSON.stringify(body))

  // Dispara processamento em background (sem await)
  processarPedido(body).catch(e =>
    console.error('[webhook] erro background:', e.message)
  )

  // Responde imediatamente ao MP
  return NextResponse.json({ ok: true })
}

async function processarPedido(body: any) {
  try {
    if (body.type !== 'payment') return

    const paymentId = body.data?.id
    if (!paymentId) return

    // Busca dados do pagamento no MP
    let data: any
    try {
      const payment = new Payment(client)
      data = await payment.get({ id: paymentId })
    } catch (e: any) {
      console.log('[webhook] pagamento não encontrado:', paymentId)
      return
    }

    console.log('[webhook] status:', data.status, 'ref:', data.external_reference)

    if (data.status !== 'approved') return

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

    if (!pedidoCompleto) return

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
      return
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

    // Parse do endereço (vem como string do Supabase)
    const enderecoParsed = pedidoCompleto.endereco
      ? (typeof pedidoCompleto.endereco === 'string'
          ? JSON.parse(pedidoCompleto.endereco)
          : pedidoCompleto.endereco)
      : null

    console.log('[webhook] endereco parsed:', JSON.stringify(enderecoParsed))

    // ============================================
    // BLOCO DE CONTATO — busca primeiro, cria se não existe
    // ============================================

    let contatoId: number | null = null

    // ETAPA 1: Busca por CPF primeiro (evita duplicatas)
    if (cpfLimpo) {
      try {
        await delay(300)
        const cpfFormatado = cpfLimpo.replace(
          /(\d{3})(\d{3})(\d{3})(\d{2})/,
          '$1.$2.$3-$4'
        )

        const [buscaFormatado, buscaSemFormato] = await Promise.allSettled([
          blingFetch(`/contatos?pesquisa=${encodeURIComponent(cpfFormatado)}&limite=10`),
          blingFetch(`/contatos?pesquisa=${cpfLimpo}&limite=10`),
        ])

        const resultados = [
          ...(buscaFormatado.status === 'fulfilled' ? buscaFormatado.value?.data || [] : []),
          ...(buscaSemFormato.status === 'fulfilled' ? buscaSemFormato.value?.data || [] : []),
        ]

        const encontrado = resultados.find((c: any) =>
          (c.numeroDocumento || '').replace(/\D/g, '') === cpfLimpo
        )

        if (encontrado) {
          contatoId = encontrado.id
          console.log('[webhook] contato existente encontrado:', contatoId, encontrado.nome)

          // Atualiza endereço com campos planos
          try {
            await delay(300)
            await blingFetch(`/contatos/${contatoId}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                nome: encontrado.nome,
                tipo: 'F',
                situacao: 'A',
                endereco: enderecoParsed?.logradouro || '',
                numero: enderecoParsed?.numero || '',
                complemento: enderecoParsed?.complemento || '',
                bairro: enderecoParsed?.bairro || '',
                municipio: enderecoParsed?.cidade || '',
                uf: enderecoParsed?.estado || '',
                cep: (enderecoParsed?.cep || '').replace(/\D/g, ''),
                pais: 'Brasil',
              }),
            })
            console.log('[webhook] contato atualizado com endereço plano')
          } catch (upErr: any) {
            console.log('[webhook] não atualizou endereço:', upErr.message.slice(0, 80))
          }
        }
      } catch (e: any) {
        console.log('[webhook] erro na busca CPF:', e.message)
      }
    }

    // ETAPA 2: Só cria se não encontrou
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
            numeroDocumento: cpfLimpo || undefined,
            email: emailValido,
            endereco: enderecoParsed?.logradouro || '',
            numero: enderecoParsed?.numero || '',
            complemento: enderecoParsed?.complemento || '',
            bairro: enderecoParsed?.bairro || '',
            municipio: enderecoParsed?.cidade || '',
            uf: enderecoParsed?.estado || '',
            cep: (enderecoParsed?.cep || '').replace(/\D/g, ''),
            pais: 'Brasil',
          }),
        })
        contatoId = res?.data?.id || null
        console.log('[webhook] contato criado:', contatoId, nomeCliente)
      } catch (e: any) {
        console.log('[webhook] erro criar contato:', e.message)

        // CPF já existe em outro contato — busca pelo erro
        if (e.message.includes('CPF') || e.message.includes('cnpj')) {
          try {
            await delay(300)
            const cpfFormatado = cpfLimpo.replace(
              /(\d{3})(\d{3})(\d{3})(\d{2})/,
              '$1.$2.$3-$4'
            )
            const busca = await blingFetch(
              `/contatos?pesquisa=${encodeURIComponent(cpfFormatado)}&limite=10`
            )
            const encontrado = busca?.data?.find((c: any) =>
              (c.numeroDocumento || '').replace(/\D/g, '') === cpfLimpo
            )
            if (encontrado) {
              contatoId = encontrado.id
              console.log('[webhook] contato encontrado após erro CPF:', contatoId)
            }
          } catch {}
        }
      }
    }

    // ETAPA 3: Último fallback — cria sem CPF (nunca bloqueia o pedido)
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
            endereco: enderecoParsed?.logradouro || '',
            numero: enderecoParsed?.numero || '',
            complemento: enderecoParsed?.complemento || '',
            bairro: enderecoParsed?.bairro || '',
            municipio: enderecoParsed?.cidade || '',
            uf: enderecoParsed?.estado || '',
            cep: (enderecoParsed?.cep || '').replace(/\D/g, ''),
            pais: 'Brasil',
          }),
        })
        contatoId = res?.data?.id || null
        console.log('[webhook] contato sem CPF criado:', contatoId)
      } catch (e: any) {
        console.error('[webhook] falha total contato:', e.message)
      }
    }

    if (!contatoId) {
      await supabase.from('pedidos')
        .update({ bling_pedido_id: null })
        .eq('id', pedidoId!)
      return
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
      enderecoEntrega: enderecoParsed ? {
        endereco: enderecoParsed.logradouro || '',
        numero: enderecoParsed.numero || '',
        complemento: enderecoParsed.complemento || '',
        bairro: enderecoParsed.bairro || '',
        municipio: enderecoParsed.cidade || '',
        uf: enderecoParsed.estado || '',
        cep: (enderecoParsed.cep || '').replace(/\D/g, ''),
        pais: 'Brasil',
        nomePais: 'Brasil',
      } : undefined,
      transporte: {
        fretePorConta: 'D',
        frete: Number(pedidoCompleto.frete_valor) || 0,
        volumes: [{ servico: pedidoCompleto.frete_servico || 'Correios' }],
        enderecoEntrega: enderecoParsed ? {
          endereco: enderecoParsed.logradouro || '',
          numero: enderecoParsed.numero || '',
          complemento: enderecoParsed.complemento || '',
          bairro: enderecoParsed.bairro || '',
          municipio: enderecoParsed.cidade || '',
          uf: enderecoParsed.estado || '',
          cep: (enderecoParsed.cep || '').replace(/\D/g, ''),
          pais: 'Brasil',
          nomePais: 'Brasil',
        } : undefined,
      },
      itens: itensPedido.length > 0
        ? itensPedido.map((item: any) => {
            const produtoId = item.id && !/^\d{1,8}$/.test(String(item.id))
              ? Number(item.id)
              : null

            return {
              ...(produtoId ? { produto: { id: produtoId } } : {}),
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
        await supabase.from('pedidos')
          .update({ bling_pedido_id: null })
          .eq('id', pedidoId!)
      }
    }

  } catch (e: any) {
    console.error('[webhook] erro geral:', e.message)
  }
}

import { MercadoPagoConfig, Payment } from 'mercadopago'
import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { blingFetch } from '@/lib/bling'
import { melhorEnvioFetch } from '@/lib/melhor-envio'

export const dynamic = 'force-dynamic'

const client = new MercadoPagoConfig({
  accessToken: process.env.NEXT_PUBLIC_MP_ENV === 'test'
    ? process.env.MP_ACCESS_TOKEN_TEST!
    : process.env.MP_ACCESS_TOKEN!
})

const delay = (ms: number) => new Promise(r => setTimeout(r, ms))

export async function POST(req: Request) {
  const body = await req.json()

  const type = body?.type || body?.topic
  const paymentId = body?.data?.id || body?.resource

  if (type !== 'payment' || !paymentId) {
    return NextResponse.json({ ok: true })
  }

  console.log('[webhook] recebido:', JSON.stringify(body))

  try {
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

    if (data.status !== 'approved') return NextResponse.json({ ok: true })

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

    if (!pedidoCompleto) return NextResponse.json({ ok: true })

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

    // ETAPA 1: Busca por CPF com parâmetro correto
    if (cpfLimpo) {
      try {
        await delay(300)
        // Tenta encontrar com diferentes criterios (1=ativo, 2=excluido, 3=inativo, 4=todos)
        let lista: any[] = []

        for (const criterio of [1, 2, 3, 4]) {
          if (lista.length > 0) break
          try {
            const r = await blingFetch(
              `/contatos?numeroDocumento=${cpfLimpo}&criterio=${criterio}&limite=5`
            )
            lista = r?.data || []
            console.log('[webhook] busca criterio', criterio, '->', lista.length)
          } catch {}
        }

        if (lista.length > 0) {
          const contato = lista[0]
          contatoId = contato.id
          console.log('[webhook] contato encontrado:', contatoId, contato.nome, contato.situacao)

          // Se contato está deletado, reativa
          if (contato.situacao === 'E' || contato.situacao === 'I') {
            try {
              await delay(300)
              await blingFetch(`/contatos/${contatoId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  nome: contato.nome === 'Cliente' || contato.nome === 'Consumidor Final'
                    ? nomeCliente
                    : contato.nome,
                  tipo: 'F',
                  situacao: 'A',
                  endereco: {
                    geral: {
                      endereco: enderecoParsed?.logradouro || '',
                      cep: (enderecoParsed?.cep || '').replace(/\D/g, ''),
                      bairro: enderecoParsed?.bairro || '',
                      municipio: enderecoParsed?.cidade || '',
                      uf: enderecoParsed?.estado || '',
                      numero: enderecoParsed?.numero || '',
                      complemento: enderecoParsed?.complemento || '',
                    },
                  },
                }),
              })
              console.log('[webhook] contato reativado:', contatoId)
            } catch (reErr: any) {
              console.log('[webhook] erro reativar:', reErr.message.slice(0, 80))
            }
          } else {
            // Contato ativo — atualiza endereço
            try {
              await delay(300)
              await blingFetch(`/contatos/${contatoId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  nome: contato.nome,
                  tipo: 'F',
                  situacao: 'A',
                  endereco: {
                    geral: {
                      endereco: enderecoParsed?.logradouro || '',
                      cep: (enderecoParsed?.cep || '').replace(/\D/g, ''),
                      bairro: enderecoParsed?.bairro || '',
                      municipio: enderecoParsed?.cidade || '',
                      uf: enderecoParsed?.estado || '',
                      numero: enderecoParsed?.numero || '',
                      complemento: enderecoParsed?.complemento || '',
                    },
                  },
                }),
              })
              console.log('[webhook] endereço atualizado no contato existente')
            } catch {}
          }
        }
      } catch (bErr: any) {
        console.log('[webhook] erro busca numeroDocumento:', bErr.message.slice(0, 80))
      }
    }

    // ETAPA 2: Só cria se não encontrou por CPF
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
            endereco: {
              geral: {
                endereco: enderecoParsed?.logradouro || '',
                cep: (enderecoParsed?.cep || '').replace(/\D/g, ''),
                bairro: enderecoParsed?.bairro || '',
                municipio: enderecoParsed?.cidade || '',
                uf: enderecoParsed?.estado || '',
                numero: enderecoParsed?.numero || '',
                complemento: enderecoParsed?.complemento || '',
              },
            },
          }),
        })
        contatoId = res?.data?.id || null
        console.log('[webhook] contato criado:', contatoId, nomeCliente)
      } catch (e: any) {
        console.log('[webhook] erro criar contato:', e.message.slice(0, 100))

        // CPF conflita mas busca não encontrou (contato excluído definitivamente)
        // Cria sem CPF como último recurso
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
              endereco: {
                geral: {
                  endereco: enderecoParsed?.logradouro || '',
                  cep: (enderecoParsed?.cep || '').replace(/\D/g, ''),
                  bairro: enderecoParsed?.bairro || '',
                  municipio: enderecoParsed?.cidade || '',
                  uf: enderecoParsed?.estado || '',
                  numero: enderecoParsed?.numero || '',
                  complemento: enderecoParsed?.complemento || '',
                },
              },
            }),
          })
          contatoId = res?.data?.id || null
          console.log('[webhook] contato sem CPF criado:', contatoId)
        } catch (e3: any) {
          console.error('[webhook] falha total contato:', e3.message.slice(0, 80))
        }
      }
    }

    if (!contatoId) {
      await supabase.from('pedidos')
        .update({ bling_pedido_id: null })
        .eq('id', pedidoId!)
      return NextResponse.json({ ok: true })
    }

    // ============================================
    // A PARTIR DAQUI: SEMPRE CRIA O PEDIDO
    // ============================================

    const itensPedido = Array.isArray(pedidoCompleto.itens)
      ? pedidoCompleto.itens
      : JSON.parse(typeof pedidoCompleto.itens === 'string' ? pedidoCompleto.itens : '[]')

    console.log('[webhook] itens do pedido:', JSON.stringify(itensPedido))

    const hoje = new Date().toISOString().split('T')[0]

    const pesoTotal = itensPedido.reduce((acc: number, item: any) =>
      acc + (Number(item.peso) || 0.5) * (Number(item.quantidade) || 1), 0
    )

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
        quantidadeVolumes: itensPedido.length,
        pesoBruto: Number(pesoTotal.toFixed(3)),
        volumes: [{ id: 1, servico: pedidoCompleto.frete_servico || 'Correios' }],
        etiqueta: enderecoParsed ? {
          nome: nomeCliente,
          endereco: enderecoParsed.logradouro || '',
          numero: enderecoParsed.numero || '',
          complemento: enderecoParsed.complemento || '',
          bairro: enderecoParsed.bairro || '',
          municipio: enderecoParsed.cidade || '',
          uf: enderecoParsed.estado || '',
          cep: (enderecoParsed.cep || '').replace(/\D/g, ''),
          nomePais: 'Brasil',
        } : undefined,
      },
      itens: itensPedido.length > 0
        ? itensPedido.map((item: any, index: number) => {
            const produtoId = item.id && String(item.id).length >= 10
              ? Number(item.id)
              : null

            return {
              id: index + 1,
              ...(produtoId ? { produto: { id: produtoId } } : {}),
              descricao: item.nome || 'Produto',
              quantidade: Number(item.quantidade) || 1,
              valor: Number(item.valor) || 0,
              unidade: 'UN',
            }
          })
        : [{
            id: 1,
            descricao: 'Pedido Tá Pra Pesca',
            quantidade: 1,
            valor: Math.max(0, Number(pedidoCompleto.total) - Number(pedidoCompleto.frete_valor || 0)),
            unidade: 'UN',
          }],
    }

    let blingPedidoId: any = null

    try {
      await delay(600)
      console.log('[webhook] criando pedido Bling...')
      const blingRes = await blingFetch('/pedidos/vendas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(blingBody),
      })

      blingPedidoId = blingRes?.data?.id
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

    // Adiciona ao carrinho do Melhor Envio — roda sempre, novo ou duplicata
    if (!pedidoCompleto.me_carrinho_id && pedidoCompleto.frete_servico_id) {
      try {
        await delay(500)

        const meBody = {
          service: Number(pedidoCompleto.frete_servico_id),
          from: {
            name: 'Tá Pra Pesca',
            phone: process.env.STORE_PHONE,
            postal_code: process.env.MELHOR_ENVIO_ORIGIN_CEP?.replace(/\D/g, ''),
            address: process.env.STORE_ADDRESS,
            city: process.env.STORE_CITY,
          },
          to: {
            name: nomeCliente,
            postal_code: (enderecoParsed?.cep || '').replace(/\D/g, ''),
            address: enderecoParsed?.logradouro || '',
            number: enderecoParsed?.numero || '',
            complement: enderecoParsed?.complemento || '',
            district: enderecoParsed?.bairro || '',
            city: enderecoParsed?.cidade || '',
            state_abbr: enderecoParsed?.estado || '',
            document: cpfLimpo || '',
            email: emailValido || '',
          },
          products: itensPedido.map((item: any) => ({
            name: item.nome,
            quantity: Number(item.quantidade) || 1,
            unitary_value: Number(item.valor) || 0,
            weight: Number(item.peso) || 0.5,
          })),
          volumes: itensPedido.map((item: any) => ({
            height: Number(item.altura) || 15,
            width: Number(item.largura) || 15,
            length: Number(item.comprimento) || 30,
            weight: Number(item.peso) || 0.5,
          })),
          options: {
            insurance_value: Number(pedidoCompleto.total) || 0,
            receipt: false,
            own_hand: false,
            tags: [{
              tag: pedidoCompleto.id,
              url: `https://taprapesca.com.br/admin/pedidos/${pedidoCompleto.id}`,
            }],
          },
        }

        console.log('[webhook] ME body completo:', JSON.stringify(meBody))

        const meCarrinho = await melhorEnvioFetch('/me/cart', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(meBody),
        })

        const meCarrinhoId = meCarrinho?.id
        console.log('[webhook] ME carrinho criado:', meCarrinhoId)

        if (meCarrinhoId) {
          await supabase.from('pedidos')
            .update({ me_carrinho_id: meCarrinhoId })
            .eq('id', pedidoId!)

          if (blingPedidoId) {
            await delay(400)
            await blingFetch(`/pedidos/vendas/${blingPedidoId}`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                observacoesInternas: `ME Carrinho ID: ${meCarrinhoId} | ` +
                  itensPedido.map((item: any) =>
                    `${item.nome}: ${item.peso || 0.5}kg | ` +
                    `${item.altura || 15}x${item.largura || 15}x${item.comprimento || 30}cm`
                  ).join(' | '),
              }),
            })
            console.log('[webhook] ME ID salvo no Bling')
          }
        }
      } catch (meErr: any) {
        console.log('[webhook] erro ME carrinho:', meErr.message)
      }
    }

  } catch (e: any) {
    console.error('[webhook] erro geral:', e.message)
  }

  return NextResponse.json({ ok: true })
}

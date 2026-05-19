'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import PixButton from '@/components/PixButton'
import MPCheckoutBrick from '@/components/MPCheckoutBrick'
import { createSupabaseBrowserClient } from '@/lib/supabase-browser'

interface FreteOpcao {
  id: number
  nome: string
  empresa: string
  preco: number
  prazo: number
  logo: string
}

interface Props {
  kitNome: string
  kitPreco: number
  backUrls?: { success: string; failure: string; pending: string }
  onFreteSelected: (frete: { servico: string; valor: number; prazo: number }) => void
  onEnderecoComplete: (dados: { endereco: any; cpf: string; frete: any }) => void
  produtosParaFrete: Array<{
    id: string
    codigo?: string
    nome: string
    peso: number
    altura: number
    largura: number
    comprimento: number
    valor: number
    quantidade: number
  }>
}

const fmt = (n: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(n)

function mascaraCEP(v: string) {
  return v.replace(/\D/g, '').slice(0, 8).replace(/(\d{5})(\d)/, '$1-$2')
}

function mascaraCPF(v: string) {
  return v.replace(/\D/g, '').slice(0, 11)
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2')
}

function validarCPF(cpf: string): boolean {
  const d = cpf.replace(/\D/g, '')
  if (d.length !== 11 || /^(\d)\1{10}$/.test(d)) return false
  let sum = 0
  for (let i = 0; i < 9; i++) sum += Number(d[i]) * (10 - i)
  let r = (sum * 10) % 11
  if (r === 10 || r === 11) r = 0
  if (r !== Number(d[9])) return false
  sum = 0
  for (let i = 0; i < 10; i++) sum += Number(d[i]) * (11 - i)
  r = (sum * 10) % 11
  if (r === 10 || r === 11) r = 0
  return r === Number(d[10])
}

export default function CheckoutForm({
  kitNome, kitPreco, backUrls, onFreteSelected, onEnderecoComplete, produtosParaFrete,
}: Props) {
  const [isGuest, setIsGuest] = useState<boolean | null>(null)
  const [step, setStep] = useState(1)
  const [checkoutUrl, setCheckoutUrl] = useState('')
  const [pedidoId, setPedidoId] = useState('')
  const [loadingPayment, setLoadingPayment] = useState(false)

  // Guest data (Step 0)
  const [guestNome, setGuestNome] = useState('')
  const [guestEmail, setGuestEmail] = useState('')

  // Endereço
  const [cep, setCep] = useState('')
  const [logradouro, setLogradouro] = useState('')
  const [numero, setNumero] = useState('')
  const [complemento, setComplemento] = useState('')
  const [bairro, setBairro] = useState('')
  const [cidade, setCidade] = useState('')
  const [estado, setEstado] = useState('')
  const [cpf, setCpf] = useState('')
  const [buscandoCep, setBuscandoCep] = useState(false)

  // Frete
  const [opcoesFrete, setOpcoesFrete] = useState<FreteOpcao[]>([])
  const [freteSelected, setFreteSelected] = useState<FreteOpcao | null>(null)
  const [calculandoFrete, setCalculandoFrete] = useState(false)

  const [erros, setErros] = useState<Record<string, string>>({})

  useEffect(() => {
    const supabase = createSupabaseBrowserClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      const guest = !user
      setIsGuest(guest)
      setStep(guest ? 0 : 1)
    })
  }, [])

  async function handleCepChange(valor: string) {
    const masked = mascaraCEP(valor)
    setCep(masked)
    const digits = masked.replace(/\D/g, '')
    if (digits.length === 8) {
      setBuscandoCep(true)
      try {
        const res = await fetch(`/api/cep/lookup?cep=${digits}`)
        const data = await res.json()
        if (!data.error) {
          setLogradouro(data.logradouro || '')
          setBairro(data.bairro || '')
          setCidade(data.cidade || '')
          setEstado(data.estado || '')
        }
      } catch {}
      setBuscandoCep(false)
    }
  }

  function validarStep0() {
    const e: Record<string, string> = {}
    if (guestNome.trim().length < 3) e.guestNome = 'Informe seu nome completo (mínimo 3 caracteres)'
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(guestEmail)) e.guestEmail = 'E-mail inválido'
    if (!validarCPF(cpf)) e.cpf = 'CPF inválido'
    setErros(e)
    return Object.keys(e).length === 0
  }

  function validarStep1() {
    const e: Record<string, string> = {}
    if (cep.replace(/\D/g, '').length !== 8) e.cep = 'CEP inválido'
    if (!logradouro.trim()) e.logradouro = 'Obrigatório'
    if (!numero.trim()) e.numero = 'Obrigatório'
    if (!bairro.trim()) e.bairro = 'Obrigatório'
    // CPF validado no Step 0 para guests
    if (!isGuest && !validarCPF(cpf)) e.cpf = 'CPF inválido'
    setErros(e)
    return Object.keys(e).length === 0
  }

  function handleAvancarStep0() {
    if (!validarStep0()) return
    setErros({})
    setStep(1)
  }

  async function handleCalcularFrete() {
    if (!validarStep1()) return
    setCalculandoFrete(true)
    try {
      const res = await fetch('/api/shipping/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cepDestino: cep.replace(/\D/g, ''),
          produtos: produtosParaFrete,
        }),
      })
      const data = await res.json()
      if (data.opcoes?.length) {
        setOpcoesFrete(data.opcoes)
        setStep(2)
      } else {
        setErros({ frete: 'Não foi possível calcular o frete. Tente novamente.' })
      }
    } catch {
      setErros({ frete: 'Erro ao calcular frete.' })
    }
    setCalculandoFrete(false)
  }

  async function handleIrPagamento() {
    if (!freteSelected) return
    setLoadingPayment(true)
    try {
      const res = await fetch('/api/mp/create-preference', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kitId: produtosParaFrete[0]?.id || '',
          kitNome,
          kitPreco,
          freteValor: freteSelected.preco,
          freteServico: freteSelected.nome,
          ...(backUrls ? { backUrls } : {}),
        }),
      })
      const { preferenceId, checkoutUrl: url, pedidoId: pid } = await res.json()
      setCheckoutUrl(url || '')
      if (pid) setPedidoId(pid)

      if (pid && preferenceId) {
        fetch('/api/pedidos/pre-registro', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            pedidoId: pid,
            mpPreferenceId: preferenceId,
            endereco: { cep, logradouro, numero, complemento, bairro, cidade, estado },
            cpf,
            freteValor: freteSelected?.preco,
            freteServico: `${freteSelected?.empresa || ''} ${freteSelected?.nome || ''}`.trim(),
            freteServicoId: freteSelected?.id,
            itens: produtosParaFrete,
            total: Number(kitPreco) + Number(freteSelected?.preco || 0),
            ...(isGuest ? { guestNome, guestEmail } : {}),
          }),
        }).catch(() => {})
      }
    } catch {}
    onFreteSelected({ servico: freteSelected.nome, valor: freteSelected.preco, prazo: freteSelected.prazo })
    onEnderecoComplete({
      endereco: { cep, logradouro, numero, complemento, bairro, cidade, estado },
      cpf,
      frete: freteSelected,
    })
    setLoadingPayment(false)
    setStep(3)
  }

  const totalComFrete = kitPreco + (freteSelected?.preco || 0)

  if (isGuest === null) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: 'var(--muted)', fontSize: '14px' }}>
        Carregando...
      </div>
    )
  }

  const progressLabels = isGuest
    ? ['Seus dados', 'Endereço', 'Frete', 'Pagamento']
    : ['Endereço', 'Frete', 'Pagamento']

  const progressOffset = isGuest ? 0 : 1

  return (
    <>
      <style>{styles}</style>

      {/* Barra de progresso */}
      <div className="cf-progress">
        {progressLabels.map((label, i) => {
          const n = i + progressOffset
          const ativo = step === n
          const completo = step > n
          return (
            <div key={label} className="cf-progress-item">
              <div className={`cf-progress-dot${ativo ? ' cf-dot-ativo' : completo ? ' cf-dot-completo' : ''}`}>
                {completo ? '✓' : i + 1}
              </div>
              <span className={`cf-progress-label${ativo ? ' cf-label-ativo' : ''}`}>{label}</span>
              {i < progressLabels.length - 1 && (
                <div className={`cf-progress-line${completo ? ' cf-line-completo' : ''}`} />
              )}
            </div>
          )
        })}
      </div>

      {/* STEP 0 — Dados do guest */}
      {step === 0 && (
        <div className="cf-section">
          <div className="cf-field">
            <label className="cf-label">Nome completo</label>
            <input
              className={`cf-input${erros.guestNome ? ' cf-input-erro' : ''}`}
              placeholder="Seu nome completo"
              value={guestNome}
              onChange={e => setGuestNome(e.target.value)}
              autoComplete="name"
            />
            {erros.guestNome && <span className="cf-erro-msg">{erros.guestNome}</span>}
          </div>

          <div className="cf-field">
            <label className="cf-label">E-mail</label>
            <input
              className={`cf-input${erros.guestEmail ? ' cf-input-erro' : ''}`}
              type="email"
              placeholder="seu@email.com"
              value={guestEmail}
              onChange={e => setGuestEmail(e.target.value)}
              autoComplete="email"
            />
            {erros.guestEmail && <span className="cf-erro-msg">{erros.guestEmail}</span>}
          </div>

          <div className="cf-field">
            <label className="cf-label">CPF</label>
            <input
              className={`cf-input${erros.cpf ? ' cf-input-erro' : ''}`}
              placeholder="000.000.000-00"
              value={cpf}
              onChange={e => setCpf(mascaraCPF(e.target.value))}
              inputMode="numeric"
            />
            {erros.cpf && <span className="cf-erro-msg">{erros.cpf}</span>}
          </div>

          <div className="cf-info-guest">
            Após o pagamento, você receberá um e-mail para criar sua senha e acompanhar seus pedidos.
          </div>

          <button className="cf-btn-primary" onClick={handleAvancarStep0}>
            Continuar →
          </button>

          <div style={{ textAlign: 'center', marginTop: '4px' }}>
            <Link href="/login" className="cf-link-login">
              Já tenho conta — entrar
            </Link>
          </div>
        </div>
      )}

      {/* STEP 1 — Endereço */}
      {step === 1 && (
        <div className="cf-section">
          {isGuest && (
            <button className="cf-btn-back" onClick={() => setStep(0)}>← Editar dados pessoais</button>
          )}

          <div className="cf-field">
            <label className="cf-label">CEP</label>
            <div style={{ position: 'relative' }}>
              <input
                className={`cf-input${erros.cep ? ' cf-input-erro' : ''}`}
                placeholder="00000-000"
                value={cep}
                onChange={e => handleCepChange(e.target.value)}
                inputMode="numeric"
              />
              {buscandoCep && <span className="cf-cep-spinner">⏳</span>}
            </div>
            {erros.cep && <span className="cf-erro-msg">{erros.cep}</span>}
          </div>

          <div className="cf-field">
            <label className="cf-label">Logradouro</label>
            <input
              className={`cf-input${erros.logradouro ? ' cf-input-erro' : ''}`}
              placeholder="Rua, Av., etc."
              value={logradouro}
              onChange={e => setLogradouro(e.target.value)}
            />
            {erros.logradouro && <span className="cf-erro-msg">{erros.logradouro}</span>}
          </div>

          <div className="cf-row">
            <div className="cf-field">
              <label className="cf-label">Número</label>
              <input
                className={`cf-input${erros.numero ? ' cf-input-erro' : ''}`}
                placeholder="123"
                value={numero}
                onChange={e => setNumero(e.target.value)}
              />
              {erros.numero && <span className="cf-erro-msg">{erros.numero}</span>}
            </div>
            <div className="cf-field">
              <label className="cf-label">Complemento</label>
              <input
                className="cf-input"
                placeholder="Apto, bloco... (opcional)"
                value={complemento}
                onChange={e => setComplemento(e.target.value)}
              />
            </div>
          </div>

          <div className="cf-field">
            <label className="cf-label">Bairro</label>
            <input
              className={`cf-input${erros.bairro ? ' cf-input-erro' : ''}`}
              placeholder="Bairro"
              value={bairro}
              onChange={e => setBairro(e.target.value)}
            />
            {erros.bairro && <span className="cf-erro-msg">{erros.bairro}</span>}
          </div>

          <div className="cf-row">
            <div className="cf-field">
              <label className="cf-label">Cidade</label>
              <input className="cf-input cf-input-readonly" value={cidade} readOnly />
            </div>
            <div className="cf-field" style={{ maxWidth: '100px' }}>
              <label className="cf-label">UF</label>
              <input className="cf-input cf-input-readonly" value={estado} readOnly />
            </div>
          </div>

          {/* CPF só aparece aqui para usuários logados */}
          {!isGuest && (
            <div className="cf-field">
              <label className="cf-label">CPF</label>
              <input
                className={`cf-input${erros.cpf ? ' cf-input-erro' : ''}`}
                placeholder="000.000.000-00"
                value={cpf}
                onChange={e => setCpf(mascaraCPF(e.target.value))}
                inputMode="numeric"
              />
              {erros.cpf && <span className="cf-erro-msg">{erros.cpf}</span>}
            </div>
          )}

          {erros.frete && <div className="cf-alert">{erros.frete}</div>}

          <button
            className="cf-btn-primary"
            onClick={handleCalcularFrete}
            disabled={calculandoFrete}
          >
            {calculandoFrete ? '⏳ Calculando frete...' : 'Calcular frete →'}
          </button>
        </div>
      )}

      {/* STEP 2 — Frete */}
      {step === 2 && (
        <div className="cf-section">
          <button className="cf-btn-back" onClick={() => setStep(1)}>← Editar endereço</button>

          <div className="cf-frete-lista">
            {opcoesFrete.map(op => (
              <div
                key={op.id}
                className={`cf-frete-card${freteSelected?.id === op.id ? ' cf-frete-selected' : ''}`}
                onClick={() => setFreteSelected(op)}
              >
                <div className="cf-frete-left">
                  {op.logo
                    ? <img src={op.logo} alt={op.empresa} className="cf-frete-logo" />
                    : <div className="cf-frete-logo-fallback">📦</div>
                  }
                  <div>
                    <div className="cf-frete-nome">{op.nome}</div>
                    <div className="cf-frete-prazo">{op.prazo} dias úteis</div>
                  </div>
                </div>
                <div className="cf-frete-preco">{fmt(op.preco)}</div>
              </div>
            ))}
          </div>

          <div style={{ background: '#fff', border: '1px solid var(--border)',
            borderRadius: 'var(--r-md)', padding: '16px', marginBottom: '4px' }}>
            <div style={{ fontSize: '11px', fontWeight: '700', letterSpacing: '.1em',
              textTransform: 'uppercase', color: 'var(--muted)', marginBottom: '12px' }}>
              Resumo do pedido
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between',
              fontSize: '14px', color: 'var(--dark)', marginBottom: '8px' }}>
              <span>{kitNome}</span>
              <span>R$ {Number(kitPreco).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
            {freteSelected && (
              <div style={{ display: 'flex', justifyContent: 'space-between',
                fontSize: '14px', color: 'var(--dark)', marginBottom: '8px' }}>
                <span>{freteSelected.empresa} {freteSelected.nome}</span>
                <span>R$ {Number(freteSelected.preco).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
            )}
            {freteSelected && (
              <div style={{ display: 'flex', justifyContent: 'space-between',
                fontSize: '12px', color: 'var(--muted)', marginBottom: '12px' }}>
                <span>Prazo estimado</span>
                <span>{freteSelected.prazo} dias úteis</span>
              </div>
            )}
            <div style={{ borderTop: '1px solid var(--border)', paddingTop: '12px',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: '700', fontSize: '15px', color: 'var(--g900)' }}>Total</span>
              <span style={{ fontFamily: 'var(--ff-display)', fontSize: '28px',
                color: 'var(--g700)', letterSpacing: '.02em' }}>
                R$ {(Number(kitPreco) + Number(freteSelected?.preco || 0))
                  .toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
            {freteSelected && (
              <div style={{ fontSize: '12px', color: 'var(--g500)', fontWeight: '600',
                marginTop: '8px', textAlign: 'right' }}>
                ⚡ PIX com 5% de desconto: R$ {(Number(kitPreco) * 0.95 + Number(freteSelected.preco))
                  .toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            )}
          </div>

          <button
            className="cf-btn-primary"
            onClick={handleIrPagamento}
            disabled={!freteSelected || loadingPayment}
          >
            {loadingPayment ? '⏳ Preparando pagamento...' : 'Ir para pagamento →'}
          </button>
        </div>
      )}

      {/* STEP 3 — Pagamento */}
      {step === 3 && freteSelected && (
        <div className="cf-section">
          <button className="cf-btn-back" onClick={() => setStep(2)}>← Alterar frete</button>

          <div style={{ background: '#fff', border: '1px solid var(--border)',
            borderRadius: 'var(--r-md)', padding: '16px', marginBottom: '4px' }}>
            <div style={{ fontSize: '11px', fontWeight: '700', letterSpacing: '.1em',
              textTransform: 'uppercase', color: 'var(--muted)', marginBottom: '12px' }}>
              Resumo do pedido
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between',
              fontSize: '14px', color: 'var(--dark)', marginBottom: '8px' }}>
              <span>{kitNome}</span>
              <span>R$ {Number(kitPreco).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between',
              fontSize: '14px', color: 'var(--dark)', marginBottom: '8px' }}>
              <span>{freteSelected.empresa} {freteSelected.nome}</span>
              <span>R$ {Number(freteSelected.preco).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between',
              fontSize: '12px', color: 'var(--muted)', marginBottom: '12px' }}>
              <span>Prazo estimado</span>
              <span>{freteSelected.prazo} dias úteis</span>
            </div>
            <div style={{ borderTop: '1px solid var(--border)', paddingTop: '12px',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: '700', fontSize: '15px', color: 'var(--g900)' }}>Total</span>
              <span style={{ fontFamily: 'var(--ff-display)', fontSize: '28px',
                color: 'var(--g700)', letterSpacing: '.02em' }}>
                R$ {totalComFrete.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
            <div style={{ fontSize: '12px', color: 'var(--g500)', fontWeight: '600',
              marginTop: '8px', textAlign: 'right' }}>
              ⚡ PIX com 5% de desconto: R$ {(kitPreco * 0.95 + freteSelected.preco)
                .toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </div>

          <PixButton kitNome={kitNome} kitPreco={kitPreco} freteValor={freteSelected.preco} pedidoId={pedidoId} />

          <div className="cf-divisor">
            <div className="cf-divisor-line" />
            ou pague com cartão
            <div className="cf-divisor-line" />
          </div>

          <MPCheckoutBrick
            checkoutUrl={checkoutUrl}
            kitPreco={totalComFrete}
          />

          {!isGuest && (
            <div className="cf-criar-conta">
              <p className="cf-criar-conta-txt">
                Crie sua conta e acompanhe seus pedidos facilmente
              </p>
              <Link href="/login?register=true" className="cf-criar-conta-btn">
                Criar conta
              </Link>
            </div>
          )}

          {isGuest && (
            <div className="cf-info-guest" style={{ marginTop: '16px' }}>
              Após a confirmação do pagamento, enviaremos um e-mail para <strong>{guestEmail}</strong> para você criar sua senha.
            </div>
          )}
        </div>
      )}
    </>
  )
}

const styles = `
  .cf-progress {
    display: flex; align-items: center; justify-content: center;
    gap: 0; margin-bottom: 28px;
  }
  .cf-progress-item {
    display: flex; align-items: center; gap: 6px;
  }
  .cf-progress-dot {
    width: 28px; height: 28px; border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    font-size: 12px; font-weight: 700; font-family: var(--ff-body);
    background: var(--border); color: var(--muted);
    flex-shrink: 0; transition: all .2s;
  }
  .cf-dot-ativo { background: var(--g700); color: #fff; }
  .cf-dot-completo { background: var(--g500); color: #fff; }
  .cf-progress-label {
    font-size: 12px; font-weight: 600; color: var(--muted);
    white-space: nowrap;
  }
  .cf-label-ativo { color: var(--g700); }
  .cf-progress-line {
    width: 32px; height: 2px; background: var(--border); margin: 0 4px; flex-shrink: 0;
  }
  .cf-line-completo { background: var(--g500); }

  .cf-section { display: flex; flex-direction: column; gap: 14px; }

  .cf-field { display: flex; flex-direction: column; gap: 4px; }
  .cf-label {
    font-size: 12px; font-weight: 700; color: var(--dark);
    text-transform: uppercase; letter-spacing: .04em;
  }
  .cf-input {
    border: 1.5px solid var(--border); border-radius: var(--r-md, 8px);
    padding: 11px 13px; font-size: 14px; font-family: var(--ff-body);
    color: var(--dark); background: #fff; outline: none;
    transition: border-color .15s;
  }
  .cf-input:focus { border-color: var(--g700); }
  .cf-input-erro { border-color: #A32D2D !important; }
  .cf-input-readonly { background: var(--cream); color: var(--muted); cursor: default; }
  .cf-erro-msg { font-size: 11px; color: #A32D2D; font-weight: 600; }
  .cf-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
  .cf-cep-spinner {
    position: absolute; right: 12px; top: 50%; transform: translateY(-50%);
    font-size: 14px; pointer-events: none;
  }

  .cf-alert {
    background: #FCEBEB; color: #A32D2D;
    border-radius: var(--r-sm, 6px); padding: 10px 14px;
    font-size: 13px; font-weight: 600;
  }

  .cf-info-guest {
    background: #EAF5EA; color: #1a5c1a;
    border-radius: var(--r-sm, 6px); padding: 10px 14px;
    font-size: 13px;
  }

  .cf-link-login {
    font-size: 13px; color: var(--g500);
    text-decoration: underline; font-family: var(--ff-body);
  }
  .cf-link-login:hover { color: var(--g700); }

  .cf-btn-primary {
    width: 100%; padding: 13px; border-radius: 50px;
    background: var(--g700); color: #fff;
    border: none; font-size: 14px; font-weight: 700; font-family: var(--ff-body);
    cursor: pointer; transition: background .2s, transform .15s;
  }
  .cf-btn-primary:hover:not(:disabled) { background: var(--g900); transform: translateY(-1px); }
  .cf-btn-primary:disabled { opacity: .5; cursor: not-allowed; }

  .cf-btn-back {
    background: none; border: none; color: var(--muted);
    font-size: 13px; font-family: var(--ff-body); cursor: pointer;
    padding: 0; text-align: left; font-weight: 600;
  }
  .cf-btn-back:hover { color: var(--g700); }

  .cf-frete-lista { display: flex; flex-direction: column; gap: 10px; }
  .cf-frete-card {
    border: 1.5px solid var(--border); border-radius: var(--r-md, 10px);
    padding: 14px 16px; display: flex; align-items: center;
    justify-content: space-between; cursor: pointer; transition: border-color .15s, background .15s;
  }
  .cf-frete-card:hover { border-color: var(--g500); background: var(--g50); }
  .cf-frete-selected { border-color: var(--g700) !important; background: #f0f7f0 !important; }
  .cf-frete-left { display: flex; align-items: center; gap: 12px; }
  .cf-frete-logo { width: 36px; height: 36px; object-fit: contain; border-radius: 4px; }
  .cf-frete-logo-fallback { font-size: 28px; }
  .cf-frete-nome { font-size: 13px; font-weight: 700; color: var(--dark); }
  .cf-frete-prazo { font-size: 12px; color: var(--muted); }
  .cf-frete-preco { font-family: var(--ff-display); font-size: 18px; color: var(--g700); }

  .cf-divisor {
    display: flex; align-items: center; gap: 12px;
    color: var(--muted); font-size: 12px; margin: 4px 0;
  }
  .cf-divisor-line { flex: 1; height: 1px; background: var(--border); }
  .cf-criar-conta {
    margin-top: 20px; padding: 16px;
    border: 1px solid var(--border); border-radius: var(--r-md);
    background: var(--cream); text-align: center;
  }
  .cf-criar-conta-txt {
    font-size: 13px; color: var(--muted); margin-bottom: 10px;
  }
  .cf-criar-conta-btn {
    display: inline-block; padding: 9px 24px;
    border: 1.5px solid var(--g700); border-radius: 50px;
    font-size: 13px; font-weight: 700; color: var(--g700);
    text-decoration: none; transition: background .15s, color .15s;
  }
  .cf-criar-conta-btn:hover { background: var(--g700); color: #fff; }
`

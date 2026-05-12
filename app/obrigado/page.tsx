import type { Metadata } from "next";
import Link from "next/link";
import { PurchaseTracker } from "@/components/analytics/PurchaseTracker";
import PurchaseEvent from "@/components/PurchaseEvent";
import SalvarPedido from "@/components/SalvarPedido";

export const metadata: Metadata = {
  title: "Pedido confirmado — Tá Pra Pesca",
  description: "Seu pedido foi confirmado com sucesso!",
  robots: { index: false, follow: false },
};

interface Props {
  searchParams: { payment_id?: string; id?: string; nome?: string; preco?: string }
}

export default function Obrigado({ searchParams }: Props) {
  const paymentId = searchParams?.payment_id
  const id = searchParams?.id
  const nome = searchParams?.nome ? decodeURIComponent(searchParams.nome) : ''
  const preco = Number(searchParams?.preco || 0)

  return (
    <div style={styles.page}>
      <SalvarPedido />
      <PurchaseTracker />
      {id && nome && preco > 0 && (
        <PurchaseEvent
          value={preco}
          transactionId={paymentId}
          items={[{
            id: String(id),
            name: nome,
            price: preco,
            quantity: 1,
            category: 'Pesca',
          }]}
        />
      )}
      <div style={styles.card}>
        <div style={styles.icon}>🎣</div>
        <h1 style={styles.title}>Pedido confirmado!</h1>
        <p style={styles.sub}>
          Seu produto está a caminho. Em breve você recebe um e-mail com os
          dados do pedido e o código de rastreio.
        </p>
        <p style={styles.tip}>
          Dúvidas? Fala com a gente no{" "}
          <a
            href={`https://wa.me/${process.env.NEXT_PUBLIC_WA_NUMBER || "5511900000000"}`}
            style={styles.waLink}
            target="_blank"
            rel="noopener noreferrer"
          >
            WhatsApp
          </a>
          .
        </p>
        <Link href="/" style={styles.btn}>
          Voltar para a loja
        </Link>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    background: "var(--cream)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "40px 5%",
  },
  card: {
    background: "#fff",
    border: "1px solid var(--border)",
    borderRadius: "var(--r-xl)",
    padding: "56px 48px",
    maxWidth: "480px",
    width: "100%",
    textAlign: "center",
    boxShadow: "var(--sh-card)",
  },
  icon: {
    fontSize: "56px",
    marginBottom: "24px",
    display: "block",
  },
  title: {
    fontFamily: "var(--ff-display)",
    fontSize: "48px",
    color: "var(--g900)",
    letterSpacing: ".025em",
    lineHeight: "1",
    marginBottom: "16px",
  },
  sub: {
    fontSize: "16px",
    color: "var(--muted)",
    lineHeight: "1.65",
    marginBottom: "12px",
  },
  tip: {
    fontSize: "14px",
    color: "var(--muted)",
    marginBottom: "36px",
  },
  waLink: {
    color: "var(--g500)",
    fontWeight: "600",
  },
  btn: {
    display: "inline-block",
    background: "var(--g700)",
    color: "#fff",
    fontWeight: "700",
    fontSize: "15px",
    padding: "14px 32px",
    borderRadius: "50px",
    boxShadow: "var(--sh-btn-g)",
    transition: "all .2s",
  },
};

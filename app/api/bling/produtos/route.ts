import { NextResponse } from "next/server";
import { blingFetch } from "@/lib/bling";

export const dynamic = "force-dynamic";
export const preferredRegion = "gru1";
export const revalidate = 300; // 5 minutos

interface BlingEstoque {
  saldoVirtualTotal: number;
}

interface BlingCategoria {
  id: number;
  descricao: string;
}

interface BlingProduto {
  id: number;
  nome: string;
  codigo: string;
  preco: number;
  precoCusto: number;
  situacao: string;
  imagemURL: string;
  descricaoComplementar: string;
  categoria: BlingCategoria | null;
  estoque: BlingEstoque | null;
}

export async function GET() {
  try {
    const body = await blingFetch("/produtos?limite=100&pagina=1&situacao=A");
    const raw: BlingProduto[] = body.data ?? [];

    const produtos = raw
      .filter(
        (p) =>
          p.situacao === "A" && (p.estoque?.saldoVirtualTotal ?? 0) > 0
      )
      .map((p) => ({
        id: p.id,
        nome: p.nome,
        codigo: p.codigo,
        preco: p.preco,
        precoCusto: p.precoCusto,
        imagemURL: p.imagemURL,
        estoque: p.estoque?.saldoVirtualTotal ?? 0,
        descricao: p.descricaoComplementar,
        categoria: p.categoria?.descricao ?? "",
      }));

    return NextResponse.json({ produtos });
  } catch (err) {
    console.error("[bling/produtos] erro completo:", err);
    return NextResponse.json(
      { error: "Erro interno ao buscar produtos" },
      { status: 500 }
    );
  }
}

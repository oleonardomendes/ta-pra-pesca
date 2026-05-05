// =============================================================
// DADOS DOS KITS — edite aqui para atualizar a landing page
// =============================================================

export interface KitItem {
  text: string;
}

export interface KitBonus {
  text: string;
  sub: string;
}

export interface Kit {
  id: number;
  tag: string;
  tagStyle: "entry" | "mid" | "pro";
  name: string;
  nameBreak: string;
  tagline: string;
  price: number;
  items: KitItem[];
  bonus: KitBonus | null;
  checkoutEnvKey: string;
  featured: boolean;
  ctaStyle: "outline" | "main" | "amber";
}

export const kits: Kit[] = [
  {
    id: 1,
    tag: "Iniciante",
    tagStyle: "entry",
    name: "Kit Rio",
    nameBreak: "& Tilápia",
    tagline:
      "Para quem curte uma pescaria leve no rio ou pesqueiro — prático, leve e pronto pra pescar.",
    price: 169,
    items: [
      { text: "Vara CMIK Telescópica 3,60m — 8 a 18lbs" },
      { text: "Molinete Enjoylure SE3000 — 10+1 rolamentos" },
      { text: "Linha CMIK Monofilamento 0,35mm 500m" },
      // LUCAS: adicionar brinde aqui quando definido
      // { text: "Brinde: ..." },
    ],
    bonus: null,
    checkoutEnvKey: "NEXT_PUBLIC_KIT1_URL",
    featured: false,
    ctaStyle: "outline",
  },
  {
    id: 2,
    tag: "Pesqueiro",
    tagStyle: "mid",
    name: "Kit Pesqueiro",
    nameBreak: "Completo",
    tagline:
      "Para quem leva o pesqueiro a sério e quer fisgar os peixes que brigam de verdade.",
    price: 249,
    items: [
      { text: "Vara Enjoylure Maciça 2,10m p/ Molinete — 60 a 100lbs" },
      { text: "Molinete CMIK FB6000 — carretel alumínio, 6 rolamentos" },
      { text: "Linha CMIK Monofilamento 0,35mm 500m" },
    ],
    bonus: {
      text: "Boia Cevadeira inclusa",
      sub: "Pronto pro pesqueiro — sem custo adicional",
    },
    checkoutEnvKey: "NEXT_PUBLIC_KIT2_URL",
    featured: true,
    ctaStyle: "amber",
  },
  {
    id: 3,
    tag: "Expert",
    tagStyle: "pro",
    name: "Kit Carretilha",
    nameBreak: "Expert",
    tagline:
      "Para quem quer dar o próximo nível — carbono, carretilha profissional e 19 rolamentos.",
    price: 299,
    items: [
      { text: "Vara Enjoylure Fibra de Carbono 2,40m — 15 a 60lbs" },
      { text: "Carretilha CMIK SP200 — 18+1 rolamentos, recolhimento 8.1:1" },
      { text: "Linha CMIK Monofilamento 0,35mm 500m" },
      // LUCAS: adicionar brinde aqui quando definido
      // { text: "Brinde: ..." },
    ],
    bonus: null,
    checkoutEnvKey: "NEXT_PUBLIC_KIT3_URL",
    featured: false,
    ctaStyle: "outline",
  },
];

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Nota: el seed no borra datos existentes. Antes de re-seedear, ejecutar en Supabase:
//   DELETE FROM professional_trades;
//   DELETE FROM trades;
//   DELETE FROM trade_categories;

const categories = [
  {
    name: "Construcción",
    icon: "construction",
    trades: [
      "Albañilería",
      "Pintura",
      "Yesería y revoque",
      "Colocación de pisos y revestimientos",
      "Impermeabilización",
      "Techista / Zinguería",
      "Construcción en seco (Durlock)",
      "Microcemento",
      "Marmolería y piedra natural",
      "Pulido de pisos",
      "Hormigón y estructuras",
      "Demoliciones",
    ],
  },
  {
    name: "Instalaciones",
    icon: "wrench",
    trades: [
      "Electricidad",
      "Plomería",
      "Gas",
      "Aire acondicionado y refrigeración",
      "Calefacción",
      "Bombas de agua",
      "Sistemas de riego",
      "Instalación de cámaras de seguridad",
      "Porteros eléctricos y automatismos",
      "Paneles solares",
    ],
  },
  {
    name: "Carpintería y Metal",
    icon: "hammer",
    trades: [
      "Carpintería en madera",
      "Fabricación de muebles a medida",
      "Carpintería metálica y herrería",
      "Soldadura",
      "Cerrajería",
      "Aberturas de aluminio y PVC",
      "Vidriería",
      "Tapicería",
    ],
  },
  {
    name: "Hogar y Mantenimiento",
    icon: "home",
    trades: [
      "Limpieza del hogar",
      "Jardinería y paisajismo",
      "Fumigación y control de plagas",
      "Limpieza de tanques",
      "Mantenimiento de piletas",
      "Mudanzas",
      "Armado de muebles",
      "Pintura de interiores",
    ],
  },
  {
    name: "Reparaciones",
    icon: "tool",
    trades: [
      "Service de electrodomésticos",
      "Reparación de lavarropas",
      "Reparación de heladeras y freezers",
      "Reparación de calefones y termotanques",
      "Reparación de cocinas y hornos",
      "Reparación de portones automáticos",
      "Reparación de persianas y cortinas",
    ],
  },
  {
    name: "Exterior y Obras",
    icon: "tree",
    trades: [
      "Construcción de quinchos y pérgolas",
      "Colocación de decks y pisos exteriores",
      "Colocación de césped sintético",
      "Parquización y movimiento de tierra",
      "Construcción de piscinas",
      "Pocero",
    ],
  },
];

function slugify(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function main() {
  for (const [categoryOrder, category] of categories.entries()) {
    const createdCategory = await prisma.tradeCategory.create({
      data: {
        name: category.name,
        icon: category.icon,
        order: categoryOrder,
      },
    });

    for (const [tradeOrder, tradeName] of category.trades.entries()) {
      await prisma.trade.create({
        data: {
          categoryId: createdCategory.id,
          name: tradeName,
          slug: slugify(tradeName),
          order: tradeOrder,
        },
      });
    }
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });

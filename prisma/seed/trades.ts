import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const categories = [
  {
    name: "Construcción",
    icon: "construction",
    trades: [
      "Albañilería",
      "Pintura",
      "Yesería",
      "Revoque",
      "Colocación de pisos",
      "Impermeabilización",
      "Techista",
      "Demoliciones",
    ],
  },
  {
    name: "Instalaciones",
    icon: "wrench",
    trades: [
      "Plomería",
      "Electricidad",
      "Gas",
      "Aire acondicionado y refrigeración",
      "Calefacción",
      "Instalación de cámaras de seguridad",
      "Sistemas de riego",
      "Paneles solares",
    ],
  },
  {
    name: "Carpintería y Herrería",
    icon: "hammer",
    trades: [
      "Carpintería en madera",
      "Herrería",
      "Soldadura",
      "Fabricación de muebles a medida",
      "Cerrajería",
      "Aberturas de aluminio y PVC",
      "Tapicería",
      "Vidriería",
    ],
  },
  {
    name: "Hogar",
    icon: "home",
    trades: [
      "Limpieza de hogar",
      "Jardinería",
      "Mudanzas",
      "Fumigación y control de plagas",
      "Limpieza de tanques de agua",
      "Decoración de interiores",
      "Mantenimiento de piletas",
      "Service de electrodomésticos",
    ],
  },
  {
    name: "Tecnología",
    icon: "cpu",
    trades: [
      "Service de PC y notebooks",
      "Redes e instalación de WiFi",
      "Instalación de smart TV y home theater",
      "Domótica",
      "Reparación de celulares",
      "Instalación de software y sistemas",
      "Seguridad informática",
      "Soporte técnico remoto",
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

import { prisma } from "../src/index.ts";

const sport = await prisma.category.updateMany({
  where: { slug: "spor" },
  data: { pageTemplate: "sport" },
});
const economy = await prisma.category.updateMany({
  where: { slug: { in: ["ekonomi", "ekonomi-piyasalar"] } },
  data: { pageTemplate: "economy" },
});
const party = await prisma.category.updateMany({
  where: { bucket: "parti" },
  data: { pageTemplate: "chips" },
});

console.log(
  JSON.stringify({
    sport: sport.count,
    economy: economy.count,
    party: party.count,
  }),
);
await prisma.$disconnect();

const { PrismaClient } = require("@prisma/client");
const p = new PrismaClient();

async function main() {
  const all = await p.reactionVote.findMany({ orderBy: { createdAt: "asc" } });
  const seen = new Set();
  const del = [];
  for (const r of all) {
    const k = `${r.articleId}|${r.ipHash}`;
    if (seen.has(k)) del.push(r.id);
    else seen.add(k);
  }
  console.log("total", all.length, "delete", del.length);
  if (del.length) {
    await p.reactionVote.deleteMany({ where: { id: { in: del } } });
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await p.$disconnect();
  });

/**
 * User → Author ayrımı: her panel kullanıcısından author (id=userId),
 * article.authorId zaten user id ise Author ile örtüşür.
 */
import { prisma } from "../src/index.js";

function slugify(input: string): string {
  return input
    .toLocaleLowerCase("tr-TR")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/ğ/g, "g")
    .replace(/ü/g, "u")
    .replace(/ş/g, "s")
    .replace(/ı/g, "i")
    .replace(/ö/g, "o")
    .replace(/ç/g, "c")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || "yazar";
}

async function uniqueSlug(base: string, skipId?: string) {
  let s = base || "yazar";
  let n = 0;
  for (;;) {
    const candidate = n === 0 ? s : `${s}-${n}`;
    const exists = await prisma.author.findFirst({
      where: { slug: candidate, ...(skipId ? { NOT: { id: skipId } } : {}) },
    });
    if (!exists) return candidate;
    n += 1;
  }
}

async function main() {
  const users = await prisma.user.findMany();
  console.log(`Kullanıcı: ${users.length}`);

  for (const u of users) {
    const existing = await prisma.author.findUnique({ where: { id: u.id } });
    if (existing) {
      if (!existing.userId) {
        await prisma.author.update({
          where: { id: u.id },
          data: { userId: u.id },
        });
      }
      continue;
    }
    const byUser = await prisma.author.findUnique({ where: { userId: u.id } });
    if (byUser) continue;

    const baseSlug = u.slug?.trim() || slugify(u.name);
    const slug = await uniqueSlug(baseSlug, u.id);

    await prisma.author.create({
      data: {
        id: u.id,
        userId: u.id,
        displayName: u.name,
        slug,
        title: u.title,
        bio: u.bio,
        photoUrl: u.avatarUrl,
        twitterUrl: u.twitterUrl,
        linkedinUrl: u.linkedinUrl,
        status: "yayinda",
        isColumnist: u.isColumnist,
        columnistOrder: u.columnistOrder,
      },
    });
    console.log(`  author: ${u.name} → ${slug}`);
  }

  // Haber merkezi — hesabı yok
  const hubSlug = await uniqueSlug("haber-merkezi");
  const hub = await prisma.author.findFirst({ where: { slug: hubSlug } });
  if (!hub) {
    await prisma.author.create({
      data: {
        displayName: "Haber Merkezi",
        slug: hubSlug,
        title: "Ajans imza",
        bio: "Düzce Radikal haber merkezi kolektif imzası. Panel hesabı olmayan yayın imzasıdır.",
        status: "yayinda",
        isColumnist: false,
      },
    });
    console.log("  Haber Merkezi (hesapsız) oluşturuldu");
  }

  console.log("Bitti. Author satırları hazır.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

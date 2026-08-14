import { prisma } from "../src/index.ts";

const prefix = (process.env.API_PREFIX || "api/v1").replace(/^\//, "");
const re = new RegExp(`^(https?:\\/\\/[^/]+)\\/media\\/file\\/`, "i");
const repl = `$1/${prefix}/media/file/`;

let storiesFixed = 0;
const stories = await prisma.story.findMany();
for (const r of stories) {
  const mediaUrl = r.mediaUrl.replace(re, repl);
  const posterUrl = r.posterUrl ? r.posterUrl.replace(re, repl) : null;
  if (mediaUrl !== r.mediaUrl || posterUrl !== r.posterUrl) {
    await prisma.story.update({
      where: { id: r.id },
      data: { mediaUrl, posterUrl },
    });
    storiesFixed += 1;
    console.log("story", r.id, mediaUrl);
  }
}

let assetsFixed = 0;
const assets = await prisma.mediaAsset.findMany({
  where: { originalPath: { startsWith: "stories/" } },
});
for (const row of assets) {
  const url = row.url.replace(re, repl);
  if (url !== row.url) {
    await prisma.mediaAsset.update({ where: { id: row.id }, data: { url } });
    assetsFixed += 1;
  }
}

console.log(JSON.stringify({ storiesFixed, assetsFixed, totalStories: stories.length }));
await prisma.$disconnect();

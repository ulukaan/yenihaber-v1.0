import { prisma } from "@yenihaber/database";
import { sendArticlePublishedMail } from "./mail";

/**
 * status YAYINDA'ya ilk geçişte yazarın e-postasına bildirim
 * (önceki durum da YAYINDA ise atlanır)
 */
export async function notifyAuthorIfPublished(opts: {
  articleId: string;
  previousStatus: string;
  nextStatus: string;
}): Promise<void> {
  if (opts.nextStatus !== "YAYINDA") return;
  if (opts.previousStatus === "YAYINDA") return;

  try {
    const article = await prisma.article.findUnique({
      where: { id: opts.articleId },
      select: {
        title: true,
        slug: true,
        author: {
          select: {
            displayName: true,
            user: { select: { email: true, name: true, status: true } },
          },
        },
      },
    });
    if (!article?.author?.user?.email) return;
    if (article.author.user.status !== "aktif") return;

    await sendArticlePublishedMail({
      to: article.author.user.email,
      name: article.author.user.name || article.author.displayName,
      title: article.title,
      slug: article.slug,
    });
  } catch (e) {
    console.error(
      "[notify] yayın e-postası başarısız:",
      e instanceof Error ? e.message : e,
    );
  }
}

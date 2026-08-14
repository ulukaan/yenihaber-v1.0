import { notFound } from "next/navigation";
import type { CategoryBucket } from "@yenihaber/shared";
import { CategoriesPanel } from "../categories-panel";

const ALLOWED = new Set(["bolge", "haber", "parti", "kurum"]);

type Props = { params: Promise<{ bucket: string }> };

export default async function CategoryBucketPage({ params }: Props) {
  const { bucket } = await params;
  if (!ALLOWED.has(bucket)) notFound();
  return <CategoriesPanel bucket={bucket as CategoryBucket} />;
}

/** Yüzü olmayan takım elbiseli placeholder — aday foto yoksa */
export const CANDIDATE_PLACEHOLDER = "/brand/candidate-placeholder.png";

export function PersonSilhouette({
  className,
  title = "Aday görseli",
}: {
  className?: string;
  title?: string;
}) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={CANDIDATE_PLACEHOLDER}
      alt={title}
      className={className}
      width={48}
      height={48}
    />
  );
}

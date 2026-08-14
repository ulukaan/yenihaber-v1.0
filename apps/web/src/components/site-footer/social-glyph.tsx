import { AnimatedIcon, SocialBrandGlyph } from "@yenihaber/ui";

/** Footer / paylaşım sosyal ikonları — marka glyph + hafif animasyon */
export function SocialGlyph({ id }: { id: string }) {
  return (
    <AnimatedIcon motion="pop">
      <SocialBrandGlyph id={id} size={18} />
    </AnimatedIcon>
  );
}

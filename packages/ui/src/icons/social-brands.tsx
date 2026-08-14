import type { SVGProps } from "react";

type GlyphProps = SVGProps<SVGSVGElement> & {
  size?: number;
};

const base = (size: number): SVGProps<SVGSVGElement> => ({
  width: size,
  height: size,
  viewBox: "0 0 24 24",
  fill: "currentColor",
  "aria-hidden": true,
  focusable: false,
});

/** Marka glyph’leri — Simple Icons tarzı resmi yollar (MIT benzeri kullanım) */

export function FacebookGlyph({ size = 18, ...rest }: GlyphProps) {
  return (
    <svg {...base(size)} {...rest}>
      <path d="M14 8.16h2.66V4.83H14c-2.53 0-4.6 1.98-4.6 4.43v1.9H7v3.33h2.4V22h3.6v-7.51h2.66l.54-3.33h-3.2V9.26c0-.61.52-1.1 1.2-1.1z" />
    </svg>
  );
}

export function XGlyph({ size = 18, ...rest }: GlyphProps) {
  return (
    <svg {...base(size)} {...rest}>
      <path d="M18.24 2H21.5l-7.19 8.22L22.5 22h-6.59l-5.16-6.74L5.1 22H1.82l7.69-8.79L1.5 2h6.75l4.66 6.17L18.24 2zm-1.16 18.13h1.83L7.08 3.77H5.12l11.96 16.36z" />
    </svg>
  );
}

export function InstagramGlyph({ size = 18, ...rest }: GlyphProps) {
  return (
    <svg {...base(size)} {...rest}>
      <path d="M12 2.16c3.2 0 3.58.01 4.85.07 3.25.15 4.77 1.69 4.92 4.92.06 1.27.07 1.65.07 4.85s-.01 3.58-.07 4.85c-.15 3.23-1.66 4.77-4.92 4.92-1.27.06-1.64.07-4.85.07s-3.58-.01-4.85-.07c-3.26-.15-4.77-1.7-4.92-4.92-.06-1.27-.07-1.64-.07-4.85s.01-3.58.07-4.85C2.38 3.92 3.9 2.38 7.15 2.23 8.42 2.17 8.8 2.16 12 2.16zm0 1.8c-3.15 0-3.52.01-4.76.07-2.24.1-3.27 1.17-3.37 3.37-.06 1.24-.07 1.61-.07 4.76s.01 3.52.07 4.76c.1 2.2 1.13 3.27 3.37 3.37 1.24.06 1.61.07 4.76.07s3.52-.01 4.76-.07c2.23-.1 3.27-1.17 3.37-3.37.06-1.24.07-1.61.07-4.76s-.01-3.52-.07-4.76c-.1-2.2-1.14-3.27-3.37-3.37-1.24-.06-1.61-.07-4.76-.07zm0 3.06a5.14 5.14 0 1 1 0 10.28A5.14 5.14 0 0 1 12 7.02zm0 1.8a3.34 3.34 0 1 0 0 6.68 3.34 3.34 0 0 0 0-6.68zm6.54-2.1a1.2 1.2 0 1 1-2.4 0 1.2 1.2 0 0 1 2.4 0z" />
    </svg>
  );
}

export function YoutubeGlyph({ size = 18, ...rest }: GlyphProps) {
  return (
    <svg {...base(size)} {...rest}>
      <path d="M23.5 7.6a3 3 0 0 0-2.1-2.12C19.5 5 12 5 12 5s-7.5 0-9.4.48A3 3 0 0 0 .5 7.6 31.5 31.5 0 0 0 0 12a31.5 31.5 0 0 0 .5 4.4 3 3 0 0 0 2.1 2.12C4.5 19 12 19 12 19s7.5 0 9.4-.48a3 3 0 0 0 2.1-2.12A31.5 31.5 0 0 0 24 12a31.5 31.5 0 0 0-.5-4.4zM9.75 15.02V8.98L15.5 12l-5.75 3.02z" />
    </svg>
  );
}

export function WhatsappGlyph({ size = 18, ...rest }: GlyphProps) {
  return (
    <svg {...base(size)} {...rest}>
      <path d="M12.04 2a9.94 9.94 0 0 0-8.6 15.05L2 22l5.1-1.34A9.94 9.94 0 1 0 12.04 2zm5.8 14.24c-.24.68-1.4 1.24-2.28 1.4-.6.12-1.38.2-4.02-.86a11.2 11.2 0 0 1-4.9-4.12c-.52-.72-.86-1.62-.9-2.54-.04-1.06.4-1.98 1.06-2.52.22-.18.5-.28.8-.28h.6c.2 0 .46 0 .7.54l.9 2.2c.1.24.06.4-.08.56l-.4.46c-.14.16-.3.34-.12.66.18.32.84 1.38 1.8 2.24 1.24 1.1 2.28 1.44 2.6 1.6.32.16.5.14.68-.08l.78-.9c.16-.2.4-.24.64-.16l2.12.98c.24.12.4.18.46.28.06.1.06.58-.18 1.26z" />
    </svg>
  );
}

export function TelegramGlyph({ size = 18, ...rest }: GlyphProps) {
  return (
    <svg {...base(size)} {...rest}>
      <path d="M11.94 2C6.48 2 2.06 6.42 2.06 11.88c0 1.9.54 3.68 1.48 5.2L2 22l5.08-1.5a9.8 9.8 0 0 0 4.86 1.28c5.46 0 9.88-4.42 9.88-9.9C21.82 6.42 17.4 2 11.94 2zm4.84 7.12-1.66 7.84c-.12.56-.46.7-.94.44l-2.6-1.92-1.26 1.2c-.14.14-.26.26-.52.26l.18-2.66 4.86-4.4c.22-.18-.04-.3-.32-.12l-6 3.78-2.58-.8c-.56-.18-.58-.56.12-.84l10.08-3.88c.48-.18.88.12.76.7z" />
    </svg>
  );
}

export function SocialBrandGlyph({
  id,
  size = 18,
}: {
  id: string;
  size?: number;
}) {
  switch (id) {
    case "facebook":
      return <FacebookGlyph size={size} />;
    case "x":
    case "twitter":
      return <XGlyph size={size} />;
    case "instagram":
      return <InstagramGlyph size={size} />;
    case "youtube":
      return <YoutubeGlyph size={size} />;
    case "whatsapp":
      return <WhatsappGlyph size={size} />;
    case "telegram":
      return <TelegramGlyph size={size} />;
    default:
      return (
        <svg {...base(size)}>
          <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="1.8" />
          <path
            d="M8 12h8M12 8v8"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
        </svg>
      );
  }
}

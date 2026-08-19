import Image from "next/image";

type BrandLogoVariant = "wordmark" | "mark" | "app-icon";

type BrandLogoProps = {
  variant?: BrandLogoVariant;
  className?: string;
  decorative?: boolean;
  priority?: boolean;
};

const logoConfig: Record<BrandLogoVariant, { src: string; width: number; height: number; alt: string }> = {
  wordmark: {
    src: "/brand/mapa-da-pesquisa-wordmark.png",
    width: 1050,
    height: 289,
    alt: "Mapa da Pesquisa",
  },
  mark: {
    src: "/brand/mapa-da-pesquisa-mark.png",
    width: 711,
    height: 858,
    alt: "Mapa da Pesquisa",
  },
  "app-icon": {
    src: "/brand/mapa-da-pesquisa-app-icon.png",
    width: 919,
    height: 937,
    alt: "Mapa da Pesquisa",
  },
};

export function BrandLogo({ variant = "wordmark", className, decorative = false, priority = false }: BrandLogoProps) {
  const config = logoConfig[variant];
  const classes = ["brand-logo", `brand-logo-${variant}`, className].filter(Boolean).join(" ");

  return (
    <Image
      className={classes}
      src={config.src}
      width={config.width}
      height={config.height}
      alt={decorative ? "" : config.alt}
      aria-hidden={decorative ? true : undefined}
      priority={priority}
    />
  );
}

import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

function Svg({ children, ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.7}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      {children}
    </svg>
  );
}

export const ArrowUpRight = (props: IconProps) => (
  <Svg {...props}>
    <path d="M7 17 17 7" />
    <path d="M8 7h9v9" />
  </Svg>
);

export const ArrowRight = (props: IconProps) => (
  <Svg {...props}>
    <path d="M4 12h16" />
    <path d="m14 6 6 6-6 6" />
  </Svg>
);

export const ArrowLeft = (props: IconProps) => (
  <Svg {...props}>
    <path d="M20 12H4" />
    <path d="m10 18-6-6 6-6" />
  </Svg>
);

export const ChevronDown = (props: IconProps) => (
  <Svg {...props}>
    <path d="m6 9 6 6 6-6" />
  </Svg>
);

export const Heart = (props: IconProps) => (
  <Svg {...props}>
    <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
  </Svg>
);

export const Volume2 = (props: IconProps) => (
  <Svg {...props}>
    <path d="M11 5 6 9H3v6h3l5 4V5Z" />
    <path d="M15.5 8.5a5 5 0 0 1 0 7" />
    <path d="M18.5 5.5a9 9 0 0 1 0 13" />
  </Svg>
);

export const VolumeX = (props: IconProps) => (
  <Svg {...props}>
    <path d="M11 5 6 9H3v6h3l5 4V5Z" />
    <path d="m16 9 5 6" />
    <path d="m21 9-5 6" />
  </Svg>
);

export const Search = (props: IconProps) => (
  <Svg {...props}>
    <circle cx="11" cy="11" r="7" />
    <path d="m20 20-3.6-3.6" />
  </Svg>
);

export const Camera = (props: IconProps) => (
  <Svg {...props}>
    <path d="M4 8h3l2-3h6l2 3h3v11H4V8Z" />
    <circle cx="12" cy="13" r="3.4" />
  </Svg>
);

export const Sliders = (props: IconProps) => (
  <Svg {...props}>
    <path d="M4 6h10M18 6h2M4 12h2M10 12h10M4 18h8M16 18h4" />
    <circle cx="16" cy="6" r="2" />
    <circle cx="8" cy="12" r="2" />
    <circle cx="14" cy="18" r="2" />
  </Svg>
);

export const Menu = (props: IconProps) => (
  <Svg {...props}>
    <path d="M4 7h16M4 12h16M4 17h16" />
  </Svg>
);

export const X = (props: IconProps) => (
  <Svg {...props}>
    <path d="m6 6 12 12M18 6 6 18" />
  </Svg>
);

export const Check = (props: IconProps) => (
  <Svg {...props}>
    <path d="m4 12 5 5L20 6" />
  </Svg>
);

export const Star = (props: IconProps) => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
    <path d="m12 2.6 2.9 5.9 6.5.9-4.7 4.6 1.1 6.5-5.8-3.1-5.8 3.1 1.1-6.5L2.6 9.4l6.5-.9L12 2.6Z" />
  </svg>
);

export const MapPin = (props: IconProps) => (
  <Svg {...props}>
    <path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z" />
    <circle cx="12" cy="10" r="2.5" />
  </Svg>
);

export const Phone = (props: IconProps) => (
  <Svg {...props}>
    <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 2 .7 2.9a2 2 0 0 1-.5 2.1L8.1 10a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.9.5 2.9.6a2 2 0 0 1 1.6 2Z" />
  </Svg>
);

export const Mail = (props: IconProps) => (
  <Svg {...props}>
    <rect x="2.5" y="4.5" width="19" height="15" rx="2.5" />
    <path d="m3 6.5 9 6.5 9-6.5" />
  </Svg>
);

export const Clock = (props: IconProps) => (
  <Svg {...props}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5.5l3.5 2" />
  </Svg>
);

export const Calendar = (props: IconProps) => (
  <Svg {...props}>
    <rect x="3" y="5" width="18" height="16" rx="2.5" />
    <path d="M8 3v4M16 3v4M3 10h18" />
  </Svg>
);

export const Gauge = (props: IconProps) => (
  <Svg {...props}>
    <path d="M4 15a8 8 0 1 1 16 0" />
    <path d="m12 15 3.5-4.5" />
    <path d="M4 19h16" />
  </Svg>
);

export const Fuel = (props: IconProps) => (
  <Svg {...props}>
    <path d="M4 21V6a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v15M3 21h12" />
    <path d="M14 10h2a2 2 0 0 1 2 2v5a1.5 1.5 0 0 0 3 0V9l-3-3" />
    <path d="M6 8h6" />
  </Svg>
);

export const Cog = (props: IconProps) => (
  <Svg {...props}>
    <circle cx="12" cy="12" r="3" />
    <path d="M12 2v3m0 14v3M4.2 4.2l2.1 2.1m11.4 11.4 2.1 2.1M2 12h3m14 0h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1" />
  </Svg>
);

export const Zap = (props: IconProps) => (
  <Svg {...props}>
    <path d="M13 2 4.5 13.5H11L10 22l8.5-11.5H12L13 2Z" />
  </Svg>
);

export const ShieldCheck = (props: IconProps) => (
  <Svg {...props}>
    <path d="M12 2.5 20 6v5.5c0 5-3.4 8.6-8 10-4.6-1.4-8-5-8-10V6l8-3.5Z" />
    <path d="m8.5 12 2.4 2.4L15.5 9.8" />
  </Svg>
);

export const BadgeCheck = (props: IconProps) => (
  <Svg {...props}>
    <circle cx="12" cy="12" r="9.3" />
    <path d="m8.4 12.3 2.3 2.3 4.9-5.1" />
  </Svg>
);

export const Handshake = (props: IconProps) => (
  <Svg {...props}>
    <path d="m11 17 2 2a2 2 0 0 0 2.8 0l3.5-3.5" />
    <path d="m14 14 2.5 2.5" />
    <path d="M3 11.5 7 7.5l4 1 3-3 5 5-2 2-3.5-3.5" />
    <path d="M3 11.5 6.5 15l2 2a2 2 0 0 0 2.8 0l.7-.7" />
  </Svg>
);

export const Sparkles = (props: IconProps) => (
  <Svg {...props}>
    <path d="m12 3 1.8 4.7L18.5 9.5l-4.7 1.8L12 16l-1.8-4.7L5.5 9.5l4.7-1.8L12 3Z" />
    <path d="m19 15 .9 2.1 2.1.9-2.1.9L19 21l-.9-2.1-2.1-.9 2.1-.9L19 15Z" />
  </Svg>
);

export const Plus = (props: IconProps) => (
  <Svg {...props}>
    <path d="M12 5v14M5 12h14" />
  </Svg>
);

export const Play = (props: IconProps) => (
  <Svg {...props}>
    <path d="M7 4.5v15l13-7.5-13-7.5Z" />
  </Svg>
);

export const Key = (props: IconProps) => (
  <Svg {...props}>
    <circle cx="8" cy="8" r="4.5" />
    <path d="m11.2 11.2 9.3 9.3M17 17l2-2M20 20l2-2" />
  </Svg>
);

export const Wallet = (props: IconProps) => (
  <Svg {...props}>
    <path d="M20 7H5a2 2 0 0 1 0-4h13v4" />
    <path d="M3 5v14a2 2 0 0 0 2 2h15V7H5" />
    <path d="M16 13.5h.01" />
  </Svg>
);

export const Instagram = (props: IconProps) => (
  <Svg {...props}>
    <rect x="3" y="3" width="18" height="18" rx="5" />
    <circle cx="12" cy="12" r="4" />
    <path d="M17.5 6.5h.01" />
  </Svg>
);

export const Youtube = (props: IconProps) => (
  <Svg {...props}>
    <rect x="2.5" y="6" width="19" height="12" rx="4" />
    <path d="m10 9.5 5 2.5-5 2.5v-5Z" fill="currentColor" stroke="none" />
  </Svg>
);

export const Linkedin = (props: IconProps) => (
  <Svg {...props}>
    <path d="M6 9v10M6 5v.01M11 19v-6a3 3 0 0 1 6 0v6M11 9v10" />
  </Svg>
);

export const Whatsapp = (props: IconProps) => (
  <Svg {...props}>
    <path d="M21 11.6a8.8 8.8 0 0 1-13.1 7.7L3 21l1.7-4.8A8.8 8.8 0 1 1 21 11.6Z" />
    <path d="M8.8 8.2c-.3.3-.5.9-.3 1.6a8 8 0 0 0 4.8 4.9c.8.3 1.4.1 1.8-.2l.7-.8-2-1-.8.7a6.5 6.5 0 0 1-2.7-2.7l.7-.8-1-2-.8.3Z" />
  </Svg>
);

export const CarIcon = (props: IconProps) => (
  <Svg {...props}>
    <path d="M5 17H3v-4l2-5h12l3 5h1v4h-2" />
    <path d="M3 13h18M7 17h10" />
    <circle cx="7" cy="17.5" r="1.8" />
    <circle cx="17" cy="17.5" r="1.8" />
    <path d="M6.5 8 8 5h8l1.5 3" />
  </Svg>
);

export const Users = (props: IconProps) => (
  <Svg {...props}>
    <circle cx="9" cy="8" r="3.5" />
    <path d="M2.5 20a6.5 6.5 0 0 1 13 0M16 5a3.5 3.5 0 0 1 0 7M17.5 14.5a6.5 6.5 0 0 1 4 5.5" />
  </Svg>
);

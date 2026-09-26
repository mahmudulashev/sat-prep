import type { Metadata, Viewport } from "next";
import { Noto_Serif, Plus_Jakarta_Sans, Roboto } from "next/font/google";
import "katex/dist/katex.min.css";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  display: "swap",
});

const roboto = Roboto({
  variable: "--font-roboto",
  subsets: ["latin"],
  weight: ["300", "400", "500", "700"],
  display: "swap",
});

const notoSerif = Noto_Serif({
  variable: "--font-noto-serif",
  subsets: ["latin"],
  weight: ["400", "700"],
  style: ["normal", "italic"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Satify — Digital SAT practice that feels like test day",
    template: "%s · Satify",
  },
  description:
    "Take full-length Math, Reading and Writing, and combined SAT practice tests in a realistic test interface, then track your progress with detailed score analytics.",
};

export const viewport: Viewport = {
  themeColor: "#f6f6fb",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${jakarta.variable} ${roboto.variable} ${notoSerif.variable} h-full`}>
      <body className="min-h-full">{children}</body>
    </html>
  );
}

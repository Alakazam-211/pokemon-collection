import type { Metadata } from "next";
import { Fredoka } from "next/font/google";
import "./globals.css";
import Navigation from "@/components/Navigation";

const fredoka = Fredoka({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-fredoka",
});

export const metadata: Metadata = {
  title: "Pokemon Card Collection",
  description: "Track your Pokemon card collection and total deck value",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Fredoka+One:wght@400&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className={`${fredoka.variable} antialiased`}>
        <Navigation
          logo="/logo.svg"
          logoAlt="Pokemon Collection Logo"
          links={[
            { href: '/', label: 'Home' },
            { href: '/collection', label: 'Collection' },
          ]}
          cta={{ href: '/collection', label: 'Explore Collection' }}
          primaryColor="rgba(59, 76, 202, 0.95)"
        />
        <div className="pt-24 pb-8">
          {children}
        </div>
      </body>
    </html>
  );
}


import type { Metadata } from "next";
import "./globals.css";
import Navigation from "@/components/Navigation";

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
      <body className="antialiased">
        <Navigation
          logo="/logo.svg"
          logoAlt="Pokemon Collection Logo"
          links={[
            { href: '/', label: 'Home' },
            { href: '/collection', label: 'Collection' },
          ]}
          cta={{ href: '/collection', label: 'Explore Collection' }}
          primaryColor="#26A9E0"
        />
        <div className="pt-24 pb-8">
          {children}
        </div>
      </body>
    </html>
  );
}


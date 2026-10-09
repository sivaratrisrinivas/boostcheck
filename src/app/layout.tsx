import "./globals.css";
import Link from "next/link";

export const metadata = { title: "BoostCheck: pre-boost ad policy check", description: "Checks creator posts against TikTok's public ad policy before they are boosted. Prototype on synthetic data." };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <header className="top">
          <Link href="/" className="logo">BoostCheck</Link>
          <nav>
            <Link href="/">Campaigns</Link>
            <Link href="/eval">Eval</Link>
            <a href="https://github.com/sivaratrisrinivas/boostcheck">GitHub</a>
          </nav>
          <span className="sim">Synthetic campaigns. Boosting is simulated.</span>
        </header>
        <main>{children}</main>
      </body>
    </html>
  );
}

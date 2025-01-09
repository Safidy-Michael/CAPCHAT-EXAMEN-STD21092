export const metadata = {
  title: "Mon Projet Next.js",
  description: "Exemple de projet avec CAPTCHA",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <body>
        <header>
          <h1>Capchat</h1>
        </header>
        <main>{children}</main>
        <footer>
          <p>© examen</p>
        </footer>
      </body>
    </html>
  );
}

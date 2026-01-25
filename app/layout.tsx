import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Model Behavior Eval',
  description: 'Evaluate and compare LLM behavior for production use cases',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-white text-black antialiased">
        <div className="flex min-h-screen flex-col">
          {/* Minimal floating header */}
          <header className="sticky top-0 z-50 bg-white">
            <div className="mx-auto flex h-16 max-w-container items-center justify-between px-6">
              <a href="/" className="text-sm font-medium tracking-tight">
                Model Behavior Eval
              </a>
              <nav className="flex items-center gap-8">
                <a
                  href="/"
                  className="text-sm text-gray-600 transition-colors hover:text-black"
                >
                  Dashboard
                </a>
              </nav>
            </div>
          </header>
          <main className="flex-1">{children}</main>
        </div>
      </body>
    </html>
  );
}

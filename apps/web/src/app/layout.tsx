import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'TaskBridge',
  description: 'Team task coordination',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

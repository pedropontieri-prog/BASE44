import React from 'react';
import Navbar from './Navbar';
import Footer from './Footer';

export default function PageShell({ children, footer = true }) {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1 pt-16">{children}</main>
      {footer && <Footer />}
    </div>
  );
}

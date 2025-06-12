
"use client";

import { useState, useEffect } from 'react';

const Footer = () => {
  const [currentYear, setCurrentYear] = useState<number | null>(null);

  useEffect(() => {
    setCurrentYear(new Date().getFullYear());
  }, []);

  return (
    <footer className="border-t py-8 bg-muted/50 mt-auto">
      <div className="container text-center text-sm text-muted-foreground">
        {currentYear !== null ? (
          <p>&copy; {currentYear} Lodger. All rights reserved.</p>
        ) : (
          // Fallback or placeholder while year is loading
          <p>&copy; Lodger. All rights reserved.</p>
        )}
        <p className="mt-1">Your Home Away From Home.</p>
      </div>
    </footer>
  );
};

export default Footer;

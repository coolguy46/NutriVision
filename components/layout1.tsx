"use client"
import React, { useState, useEffect, ReactNode } from 'react';
import HeaderMenu from './HeaderMenu';

type LayoutProps = {
  children: ReactNode;
};

const Layout = ({ children }: LayoutProps) => {
  const [isMobile, setIsMobile] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      setIsSidebarOpen(!mobile);
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <HeaderMenu 
        isOpen={isSidebarOpen} 
        setIsOpen={setIsSidebarOpen}
      />
      <main
        className={`transition-all duration-300 ease-in-out ${
          !isMobile && isSidebarOpen ? 'ml-[300px]' : ''
        }`}
      >
        {children}
      </main>
    </div>
  );
};

export default Layout;

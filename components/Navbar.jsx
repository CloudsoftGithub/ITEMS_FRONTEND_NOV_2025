'use client';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();

  // Detect scroll to change navbar styling
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const isActive = (href) => pathname === href;

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled || isOpen
          ? 'bg-white/90 backdrop-blur-md shadow-sm border-b border-gray-200'
          : 'bg-white border-b border-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Adjusted height: h-16 for mobile, h-20 for desktop */}
        <div className="flex items-center justify-between h-16 md:h-20">
          
          {/* --- Logo Section --- */}
          <Link href="/" className="flex items-center gap-2 md:gap-3 group shrink-0">
            {/* Icon container: smaller padding on mobile (p-1.5) vs desktop (p-2) */}
            <div className="bg-sky-700 text-white p-1.5 md:p-2 rounded-lg group-hover:bg-sky-600 transition-colors">
              <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 14l9-5-9-5-9 5 9 5z"></path>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z"></path>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5l4-2.222"></path>
              </svg>
            </div>
            <div className="flex flex-col">
              {/* Text size: text-lg on mobile, text-xl on desktop */}
              <span className="font-bold text-lg md:text-xl tracking-tight text-sky-900 leading-none">ITEMS</span>
              <span className="text-[10px] font-medium text-gray-500 uppercase tracking-wider hidden sm:block">
                Integrated Tertiary Education System
              </span>
            </div>
          </Link>

          {/* --- Desktop Menu --- */}
          <div className="hidden md:flex items-center space-x-8">
            <div className="flex items-center space-x-6 text-sm font-medium text-gray-600">
              <Link 
                href="/admin_login" 
                className={`hover:text-sky-700 transition-colors ${isActive('/admin_login') ? 'text-sky-700 font-semibold' : ''}`}
              >
                Admin
              </Link>
              <Link 
                href="/login" 
                className={`hover:text-sky-700 transition-colors ${isActive('/login') ? 'text-sky-700 font-semibold' : ''}`}
              >
                Staff Portal
              </Link>
            </div>

            <div className="h-6 w-px bg-gray-300"></div>

            <div className="flex items-center space-x-3">
              <Link
                href="/student-login"
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all border ${
                    isActive('/student-login') 
                    ? 'bg-sky-50 border-sky-200 text-sky-700' 
                    : 'border-gray-200 text-gray-700 hover:border-sky-300 hover:text-sky-700'
                }`}
              >
                Student Login
              </Link>
              <Link
                href="/application"
                className="px-5 py-2 rounded-lg bg-sky-700 text-white text-sm font-medium shadow-md hover:bg-sky-800 hover:shadow-lg transition-all transform hover:-translate-y-0.5"
              >
                Apply Now
              </Link>
            </div>
          </div>

          {/* --- Mobile Hamburger --- */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="text-gray-600 hover:text-sky-700 focus:outline-none p-2 rounded-md hover:bg-gray-100 transition-colors"
              aria-label="Toggle menu"
            >
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {isOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* --- Mobile Menu --- */}
      {/* max-h-[85vh] allows scrolling on landscape phones without cutting off content */}
      <div
        className={`md:hidden bg-white border-b border-gray-100 overflow-y-auto transition-all duration-300 ease-in-out ${
          isOpen ? 'max-h-[85vh] opacity-100 shadow-lg' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="px-4 py-4 space-y-3 shadow-inner bg-gray-50/50">
          
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-2 mb-2">Portals</p>
          
          <Link 
            href="/student-login" 
            onClick={() => setIsOpen(false)}
            className="block px-4 py-3 rounded-lg text-gray-700 bg-white border border-gray-200 font-medium hover:border-sky-300 hover:text-sky-700 active:bg-gray-50"
          >
            Student Login
          </Link>
          
          <Link 
            href="/login" 
            onClick={() => setIsOpen(false)}
            className={`block px-4 py-3 rounded-lg text-base font-medium ${
                isActive('/login') ? 'text-sky-700 bg-sky-50' : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            Staff Portal
          </Link>

          <Link 
            href="/admin_login" 
            onClick={() => setIsOpen(false)}
            className={`block px-4 py-3 rounded-lg text-base font-medium ${
                isActive('/admin_login') ? 'text-sky-700 bg-sky-50' : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            Admin Access
          </Link>

          <div className="pt-2 border-t border-gray-200 mt-2 pb-2">
             <Link 
                href="/application"
                onClick={() => setIsOpen(false)}
                className="block w-full text-center px-4 py-3 rounded-lg bg-sky-700 text-white font-medium shadow hover:bg-sky-800 active:bg-sky-900"
              >
                Start Application
              </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
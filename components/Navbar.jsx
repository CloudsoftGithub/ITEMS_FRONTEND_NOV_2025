'use client';
import Link from 'next/link';
import { useState } from 'react';
import { usePathname } from 'next/navigation';

export default function Navbar() {
const [isOpen, setIsOpen] = useState(false);
const pathname = usePathname();

const isActive = (href) => pathname === href;

const linkClasses = (href) =>
`block px-4 py-2 rounded ${
      isActive(href) ? 'bg-sky-700 text-white' : 'text-gray-700 hover:bg-gray-100 hover:text-sky-700'
    }`;

const desktopLinkClasses = (href) =>
`px-3 py-2 rounded font-medium ${
      isActive(href) ? 'text-sky-700 underline' : 'text-gray-700 hover:text-sky-700'
    }`;

return ( <nav className="fixed top-0 left-0 right-0 bg-white shadow z-50"> <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between"> <Link href="/" className="font-bold text-xl text-sky-700">ITEMS</Link>

```
    {/* Desktop Menu */}
    <div className="hidden md:flex items-center space-x-6">
      <Link href="/login" className={desktopLinkClasses('/login')}>Staff Login</Link>
      <Link href="/student-login" className={desktopLinkClasses('/student-login')}>Student Login</Link>
      <Link href="/admin_login" className={desktopLinkClasses('/admin_login')}>Admin</Link>
      <Link href="/application" className={desktopLinkClasses('/application')}>Application</Link>
    </div>

    {/* Mobile Hamburger */}
    <div className="md:hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="text-gray-700 focus:outline-none"
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

  {/* Mobile Menu */}
  {isOpen && (
    <div className="md:hidden bg-white border-t border-gray-200">
      <Link href="/login" className={linkClasses('/login')}>Staff Login</Link>
      <Link href="/student-login" className={linkClasses('/student-login')}>Student Login</Link>
      <Link href="/admin" className={linkClasses('/admin')}>Admin</Link>
      <Link href="/application" className={linkClasses('/application')}>Application</Link>
    </div>
  )}
</nav>

);
}

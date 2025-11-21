'use client';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import { motion } from 'framer-motion';

export default function Home() {
  return (
    <div>
      <Navbar />
      <main className="pt-20 max-w-6xl mx-auto px-4">
        <section className="text-center py-12">
          <h1 className="text-4xl font-extrabold">ITEMS — Integrated Tertiary Education Management System</h1>
          <p className="text-gray-600 mt-3">Manage faculties, departments, programs, courses and academic sessions.</p>
          <div className="mt-6 flex justify-center space-x-3">
            <Link href="/dashboard" className="px-4 py-2 bg-blue-600 text-white rounded">Go to Dashboard</Link>
            <Link href="/login" className="px-4 py-2 border rounded">Staff Login</Link>
          </div>
        </section>
      </main>
    </div>
  );
}

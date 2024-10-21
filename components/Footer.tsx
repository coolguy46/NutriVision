"use client";

import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-gray-500 text-gray-700 text-center py-4">
      <p>&copy; 2024 NutriVision. All rights reserved.</p>
      <div className="mt-2">
        <Link href="/terms-of-service" className="text-blue-500 hover:underline mx-2">
          Terms of Service
        </Link>
        <Link href="/privacy-policy" className="text-blue-500 hover:underline mx-2">
          Privacy Policy
        </Link>
      </div>
    </footer>
  );
}
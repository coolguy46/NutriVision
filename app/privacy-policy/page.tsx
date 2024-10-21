"use client";

import Link from 'next/link';
import { FC } from 'react';
import '@/app/globals.css';

const PrivacyPolicy: FC = () => {
  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto bg-white p-8 rounded-lg shadow-md">
        <h1 className="text-3xl font-bold mb-4">Privacy Policy</h1>
        <p className="mb-4">
          Effective Date: [Date]
        </p>
        <p className="mb-4">
          This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our application. Please read this privacy policy carefully. If you do not agree with the terms of this privacy policy, please do not access the application.
        </p>

        <h2 className="text-2xl font-semibold mb-2">1. Information We Collect</h2>
        <p className="mb-4">
          We may collect information about you in a variety of ways. The information we may collect includes:
        </p>
        <ul className="list-disc list-inside mb-4">
          <li className="mb-2">Personal Data: Personally identifiable information, such as your name, email address, and contact information that you voluntarily give to us when you register with the application or when you choose to participate in various activities related to the application.</li>
          <li className="mb-2">Derivatives Data: Information our servers automatically collect when you access the application, such as your IP address, your browser type, your operating system, your access times, and the pages you have viewed directly before and after accessing the application.</li>
          <li className="mb-2">Financial Data: Financial information, such as data related to your payment method (e.g., valid credit card number, card brand, expiration date) that we may collect when you purchase, order, return, exchange, or request information about our services from the application.</li>
        </ul>

        <h2 className="text-2xl font-semibold mb-2">2. Use of Your Information</h2>
        <p className="mb-4">
          Having accurate information about you permits us to provide you with a smooth, efficient, and customized experience. Specifically, we may use information collected about you via the application to:
        </p>
        <ul className="list-disc list-inside mb-4">
          <li className="mb-2">Assist with account creation and login.</li>
          <li className="mb-2">Monitor and analyze usage and trends to improve your experience with the application.</li>
          <li className="mb-2">Send you a newsletter.</li>
          <li className="mb-2">Notify you of updates to the application.</li>
        </ul>

        <h2 className="text-2xl font-semibold mb-2">3. Disclosure of Your Information</h2>
        <p className="mb-4">
          We may share information we have collected about you in certain situations. Your information may be disclosed as follows:
        </p>
        <ul className="list-disc list-inside mb-4">
          <li className="mb-2">By Law or to Protect Rights: If we believe the release of information about you is necessary to respond to legal process, to investigate or remedy potential violations of our policies, or to protect the rights, property, and safety of others, we may share your information as permitted or required by any applicable law, rule, or regulation.</li>
          <li className="mb-2">Business Transfers: We may share or transfer your information in connection with, or during negotiations of, any merger, sale of company assets, financing, or acquisition of all or a portion of our business to another company.</li>
          <li className="mb-2">Third-Party Service Providers: We may share your information with third-party service providers that perform services for us or on our behalf.</li>
        </ul>

        <h2 className="text-2xl font-semibold mb-2">4. Security of Your Information</h2>
        <p className="mb-4">
          We use administrative, technical, and physical security measures to help protect your personal information. While we have taken reasonable steps to secure the personal information you provide to us, please be aware that despite our efforts, no security measures are perfect or impenetrable, and no method of data transmission can be guaranteed against any interception or other type of misuse.
        </p>

        <h2 className="text-2xl font-semibold mb-2">5. Policy for Children</h2>
        <p className="mb-4">
          We do not knowingly solicit information from or market to children under the age of 13. If we learn that we have collected personal information from a child under age 13 without verification of parental consent, we will delete that information as quickly as possible.
        </p>

        <h2 className="text-2xl font-semibold mb-2">6. Changes to This Privacy Policy</h2>
        <p className="mb-4">
          We may update this privacy policy from time to time in order to reflect, for example, changes to our practices or for other operational, legal, or regulatory reasons. We will notify you of any changes by posting the new privacy policy on this page.
        </p>

        <h2 className="text-2xl font-semibold mb-2">7. Contact Us</h2>
        <p className="mb-4">
          If you have questions or comments about this privacy policy, please contact us at:
        </p>
        <p className="mb-4">
          <strong>Email:</strong> support@example.com
        </p>

        <div className="mt-8 text-center">
          <Link href="/" className="text-blue-500 hover:underline">Back to Home</Link>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
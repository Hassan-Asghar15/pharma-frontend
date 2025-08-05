// file: app/page.tsx

import Link from "next/link";

export default function HomePage() {
  return (
    // Main container with a subtle gradient background
    <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 p-8 dark:from-gray-900 dark:to-black">
      
      <div className="w-full max-w-2xl text-center">
        {/* Main Heading */}
        <h1 className="text-5xl font-bold tracking-tight text-gray-900 sm:text-7xl dark:text-gray-50">
          Welcome to Pharmingo-CRM
        </h1>

        {/* Subheading */}
        <p className="mt-6 text-lg leading-8 text-gray-600 dark:text-gray-400">
        "CONNECTING HEALTHCARE, ONE CLICK AT A TIME. SMARTER ORDERS,
HEALTHIER COMMUNITIES."
        </p>

        {/* Button Container */}
        <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
          {/* Register Button (Primary) */}
          <Link
            href="/auth/signup"
            className="w-full rounded-md bg-black px-6 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-gray-800  focus-visible:outline-offset-2 focus-visible:outline-black sm:w-auto dark:bg-white dark:text-black dark:hover:bg-gray-200"
          >
            Register Here!
          </Link>
          
          {/* Sign In Button (Secondary) */}
          <Link
            href="/auth/login"
            className="w-full rounded-md border border-gray-300 px-6 py-3 text-sm font-semibold text-gray-900 shadow-sm transition-colors hover:bg-gray-100 sm:w-auto dark:border-gray-700 dark:text-gray-50 dark:hover:bg-gray-800"
          >
            Sign In <span aria-hidden="true">→</span>
          </Link>
        </div>
      </div>

    </main>
  );
}
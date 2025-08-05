"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState('shopkeeper');
  const [licenseFile, setLicenseFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      setIsLoading(false);
      return;
    }

    if (!licenseFile) {
      setError("A license file is required.");
      setIsLoading(false);
      return;
    }

    const formData = new FormData();
    formData.append("name", name);
    formData.append("email", email);
    formData.append("password", password);
    formData.append("confirmPassword", confirmPassword);
    formData.append("role", role);
    formData.append("license", licenseFile);

    try {
      const apiUrl = `${process.env.NEXT_PUBLIC_API_URL}/api/auth/signup`;

      const res = await fetch(apiUrl, {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Something went wrong");

      router.push("/auth/login");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-100 dark:bg-gray-900 p-6">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <img src="/logo.png" className="mx-auto w-16 h-16 mb-4" alt="Pharma CRM" />
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Create an Account</h1>
          <p className="text-gray-600 dark:text-gray-400">Join our network of professionals.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 rounded-lg bg-white p-8 shadow-md dark:bg-gray-800" encType="multipart/form-data">
          <div className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Full Name</label>
              <input id="name" type="text" value={name} onChange={(e) => setName(e.target.value)} required className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-600 focus:ring-blue-600" />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Email Address</label>
              <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-600 focus:ring-blue-600" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Password</label>
                <input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-600 focus:ring-blue-600" />
              </div>
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Confirm Password</label>
                <input id="confirmPassword" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-600 focus:ring-blue-600" />
              </div>
            </div>

            <div>
              <label htmlFor="role" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Role</label>
              <select id="role" value={role} onChange={(e) => setRole(e.target.value)} required className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-600 focus:ring-blue-600">
                <option value="company">Company</option>
                <option value="distributor">Distributor</option>
                <option value="shopkeeper">Shopkeeper</option>
              </select>
            </div>

            <div>
              <label htmlFor="licenseFile" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Drug License File</label>
              <input id="licenseFile" type="file" onChange={(e) => setLicenseFile(e.target.files ? e.target.files[0] : null)} required accept=".pdf,.jpg,.jpeg,.png" className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:rounded-md file:border-0 file:bg-gray-200 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-gray-700 hover:file:bg-gray-300 dark:file:bg-gray-600 dark:file:text-gray-200 dark:hover:file:bg-gray-500" />
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">PDF, PNG, or JPG. Max size 5MB.</p>
            </div>
          </div>

          {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

          <button type="submit" disabled={isLoading} className="w-full rounded-md bg-blue-600 px-4 py-3 text-white font-semibold hover:bg-blue-700 disabled:opacity-50">
            {isLoading ? "Creating Account..." : "Create Account"}
          </button>
        </form>

        <p className="text-center text-sm text-gray-600 dark:text-gray-400">
          Already have an account?{" "}
          <Link href="/auth/login" className="font-medium text-blue-600 hover:underline dark:text-blue-400">Sign In</Link>
        </p>
      </div>
    </main>
  );
}

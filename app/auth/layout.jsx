import Link from "next/link"

export default function AuthLayout({ children }) {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-3">
            <div className="rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 p-3">
              <span className="text-2xl font-bold text-white">SI</span>
            </div>
            <div>
              <h1 className="font-bold text-slate-900">Sharad Institute</h1>
              <p className="text-xs text-slate-500">Alumni Portal</p>
            </div>
          </Link>
          <Link href="/" className="text-sm text-slate-600 hover:text-slate-900">
            Back to Home
          </Link>
        </div>
      </header>
      <main className="flex flex-1 items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 px-4 py-12 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  )
}

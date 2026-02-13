import { Geist, Geist_Mono } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { Toaster } from "@/components/ui/sonner"
import { ThemeProvider } from "@/components/theme-provider"
import "./globals.css"

const geist = Geist({ subsets: ["latin"] })
const geistMono = Geist_Mono({ subsets: ["latin"] })

export const metadata = {
  title: "Sharad Institute of Technology - Alumni Portal",
  description:
    "Connect with Sharad Institute of Technology Polytechnic alumni network. Manage your profile, academic records, and showcase your projects.",
  icons: {
    icon: [
      {
        url: "/sit-logo.png",
        type: "image/png",
      },
    ],
    apple: "/sit-logo.png",
  },
  generator: 'v0.app'
}

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geist.className} font-sans antialiased`}>
        <ThemeProvider>
          {children}
          <Analytics />
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  )
}

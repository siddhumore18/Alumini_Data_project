"use client"

import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/theme-toggle"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import Link from "next/link"
import { useRouter, usePathname } from "next/navigation"
import { useEffect, useState } from "react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import Image from "next/image"
import { Menu, Bell, Users, User, LogOut, ChevronLeft, ChevronRight, LayoutDashboard, FileText, Info, Phone, MapPin, Mail, Printer } from "lucide-react"

export default function ProtectedLayout({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const router = useRouter()
  const pathname = usePathname()
  const supabase = createClient()

  useEffect(() => {
    let mounted = true
    let subscription = null

    const getInitialSession = async () => {
      try {
        const {
          data: { user },
          error,
        } = await supabase.auth.getUser()

        if (!mounted) return

        if (error || !user) {
          router.replace("/auth/login")
          setLoading(false)
          return
        }

        setUser(user)

        if (window.location.pathname !== "/protected/profile") {
          const { data: profile } = await supabase
            .from("profiles")
            .select("first_name, last_name, email")
            .eq("id", user.id)
            .single()

          const isProfileIncomplete = !profile ||
            !profile.first_name ||
            !profile.last_name ||
            !profile.email

          if (isProfileIncomplete) {
            router.replace("/protected/profile?setup=true")
            setLoading(false)
            return
          }
        }

        setLoading(false)
      } catch (err) {
        if (!mounted) return
        router.replace("/auth/login")
        setLoading(false)
      }
    }

    getInitialSession()

    const {
      data: { subscription: authSubscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!mounted) return

      if (session?.user) {
        setUser(session.user)
        setLoading(false)
      } else {
        if (window.location.pathname !== "/auth/login") {
          setUser(null)
          router.replace("/auth/login")
        }
      }
    })

    subscription = authSubscription

    return () => {
      mounted = false
      if (subscription) {
        subscription.unsubscribe()
      }
    }
  }, [supabase, router])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push("/auth/login")
  }

  // Essential navigation items
  const navItems = [
    { href: "/protected/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/protected/posts", label: "Alumni Feed", icon: FileText },
    { href: "/protected/browse", label: "Directory", icon: Users },
    { href: "/protected/announcements", label: "Announcements", icon: Bell },
    { href: "/protected/about", label: "About Us", icon: Info },
  ]

  const NavLink = ({ href, label, icon: Icon, mobile = false }) => {
    const isActive = pathname === href

    return (
      <Link
        href={href}
        onClick={() => mobile && setMobileMenuOpen(false)}
        className={`
          flex items-center gap-3 px-4 py-3 rounded-xl
          text-sm font-bold transition-all duration-300
          ${isActive
            ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20 scale-[1.02]'
            : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
          }
          ${mobile ? 'w-full' : ''}
          ${!mobile && sidebarCollapsed ? 'justify-center px-0' : ''}
        `}
        title={sidebarCollapsed ? label : ""}
      >
        <Icon className={`${sidebarCollapsed && !mobile ? 'h-6 w-6' : 'h-5 w-5'}`} />
        {(!sidebarCollapsed || mobile) && <span>{label}</span>}
      </Link>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground font-bold">Initializing Portal...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      {/* Desktop Static Sidebar (Toggleable Collapse) */}
      <aside
        className={`
          hidden lg:flex flex-col border-r bg-card/40 backdrop-blur-2xl sticky top-0 h-screen transition-all duration-500 ease-in-out z-40
          ${sidebarCollapsed ? 'w-24' : 'w-72'}
        `}
      >
        <div className="p-6 flex items-center justify-center mb-6">
          <Link href="/protected/dashboard" className="flex items-center gap-3">
            <div className={`relative rounded-2xl overflow-hidden ring-2 ring-primary/20 shadow-xl transition-all duration-500 ${sidebarCollapsed ? 'h-12 w-12' : 'h-14 w-14'}`}>
              <Image src="/logo.png" alt="SIT Logo" fill className="object-contain p-1.5" priority />
            </div>
            {!sidebarCollapsed && (
              <div className="flex flex-col">
                <h1 className="font-black text-foreground text-base tracking-tight leading-none">Sharad Institute</h1>
                <p className="text-[10px] text-primary font-black uppercase tracking-widest mt-1">Alumni Portal</p>
              </div>
            )}
          </Link>
        </div>

        <nav className="flex-1 px-4 space-y-3">
          {navItems.map((item) => (
            <NavLink key={item.href} {...item} />
          ))}
        </nav>

        <div className="p-6 mt-auto space-y-4">
          {!sidebarCollapsed && user && (
            <div className="flex items-center gap-3 p-3 rounded-2xl bg-accent/30 border border-primary/5 mb-4 max-w-full overflow-hidden">
              <div className="h-10 w-10 min-w-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold shadow-inner">
                {user?.user_metadata?.full_name?.charAt(0) || user?.email?.charAt(0).toUpperCase()}
              </div>
              <div className="flex flex-col min-w-0">
                <p className="text-sm font-bold truncate">{user?.user_metadata?.full_name || "User"}</p>
                <p className="text-[10px] text-muted-foreground truncate">{user?.email}</p>
              </div>
            </div>
          )}

          <Button
            variant="ghost"
            className="w-full justify-center text-muted-foreground hover:bg-accent/50 rounded-xl transition-all h-12"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          >
            {sidebarCollapsed ? <ChevronRight size={22} className="text-primary" /> : <div className="flex items-center gap-2"><ChevronLeft size={20} /><span>Minimize Sidebar</span></div>}
          </Button>

          <Button
            variant="ghost"
            className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10 rounded-xl h-12"
            onClick={handleLogout}
          >
            <LogOut className={`h-5 w-5 ${sidebarCollapsed ? 'mx-auto' : 'mr-3'}`} />
            {!sidebarCollapsed && <span className="font-bold">Sign Out</span>}
          </Button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Universal Sub-Header / Mobile Navigation Controller */}
        <header className="border-b bg-background/60 backdrop-blur-xl sticky top-0 z-50 px-4 lg:px-8 py-4 flex items-center justify-between">

          <div className="flex items-center gap-4">
            {/* Mobile/Desktop Sidebar Toggle on the LEFT */}
            <div className="lg:hidden">
              <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="rounded-xl bg-accent/30 hover:bg-primary/20 transition-all active:scale-95">
                    <Menu className="h-6 w-6" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-[280px] p-0 border-r-0 rounded-r-3xl h-full flex flex-col bg-background/95 blur-bg">
                  <div className="p-8 border-b bg-primary/5">
                    <div className="flex items-center gap-4">
                      <div className="relative h-12 w-12 rounded-2xl overflow-hidden ring-2 ring-primary/20 shadow-xl bg-white">
                        <Image src="/logo.png" alt="SIT Logo" fill className="object-contain p-1" />
                      </div>
                      <div>
                        <h2 className="font-black text-xl text-foreground tracking-tight">SIT Portal</h2>
                        <p className="text-[10px] text-primary font-bold uppercase tracking-widest">Alumni Directory</p>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 flex-1 overflow-y-auto space-y-2 mt-4">
                    {navItems.map((item) => (
                      <NavLink key={item.href} {...item} mobile />
                    ))}
                    <div className="h-[1px] bg-border my-4"></div>
                    <NavLink href="/protected/profile" label="My Profile" icon={User} mobile />
                  </div>

                  <div className="p-6 border-t mt-auto space-y-6">
                    {user && (
                      <div className="flex items-center gap-3 p-3 rounded-2xl bg-accent/30 border border-primary/10">
                        <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold shadow-inner">
                          {user?.user_metadata?.full_name?.charAt(0) || user?.email?.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex flex-col min-w-0">
                          <p className="text-sm font-bold text-foreground truncate">{user?.user_metadata?.full_name || "User"}</p>
                          <p className="text-[10px] text-muted-foreground truncate">{user?.email}</p>
                        </div>
                      </div>
                    )}
                    <Button variant="destructive" className="w-full rounded-2xl h-12 text-base font-bold shadow-xl shadow-destructive/20" onClick={handleLogout}>
                      <LogOut className="h-5 w-5 mr-3" />
                      Sign Out
                    </Button>
                  </div>
                </SheetContent>
              </Sheet>
            </div>

            {/* Desktop Collapse Toggle on the LEFT */}
            <div className="hidden lg:block">
              <Button
                variant="ghost"
                size="icon"
                className="rounded-xl bg-accent/20 hover:bg-primary/10 transition-all"
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              >
                <Menu className="h-5 w-5" />
              </Button>
            </div>

            <div className="flex items-center gap-3">
              <div className="lg:hidden relative h-9 w-9 rounded-lg overflow-hidden border bg-background shadow-sm">
                <Image src="/logo.png" alt="SIT Logo" fill className="object-contain p-1" />
              </div>
              <h2 className="hidden sm:block text-xl font-black text-foreground tracking-tight">
                {pathname.split('/').pop().charAt(0).toUpperCase() + pathname.split('/').pop().slice(1).replace('-', ' ')}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <ThemeToggle />
            <div className="h-8 w-[1px] bg-border mx-1"></div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="hidden sm:flex items-center gap-3 rounded-2xl px-3 py-6 hover:bg-accent/50 outline-none">
                  <div className="h-10 w-10 rounded-full bg-primary/30 flex items-center justify-center text-primary font-black shadow-lg">
                    {user?.user_metadata?.full_name?.charAt(0) || "U"}
                  </div>
                  <div className="hidden md:flex flex-col items-start min-w-[30px]">
                    <span className="text-sm font-black text-foreground leading-none">{user?.user_metadata?.full_name?.split(' ')[0] || "User"}</span>
                    <span className="text-[10px] text-muted-foreground font-bold mt-1">Verified Member</span>
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64 mt-4 rounded-3xl p-3 border-primary/10 backdrop-blur-3xl shadow-2xl">
                <Link href="/protected/profile">
                  <DropdownMenuItem className="rounded-2xl cursor-pointer p-4 font-bold hover:bg-primary/10 transition-colors">
                    <User className="mr-3 h-5 w-5 text-primary" />
                    <div className="flex flex-col">
                      <span>Profile Settings</span>
                      <span className="text-[10px] text-muted-foreground font-medium">Update your records</span>
                    </div>
                  </DropdownMenuItem>
                </Link>
                <div className="h-[1px] bg-border my-2"></div>
                <DropdownMenuItem onClick={handleLogout} className="rounded-2xl cursor-pointer p-4 font-bold text-destructive hover:bg-destructive/10 transition-colors">
                  <LogOut className="mr-3 h-5 w-5" />
                  <span>Sign out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto bg-background flex flex-col">
          <div className="flex-1 p-6 lg:p-10">
            <div className="max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700">
              {children}
            </div>
          </div>

          {/* User Requested Footer - Now Theme Aware */}
          <footer className="mt-auto border-t bg-card text-card-foreground p-8 lg:p-12 shadow-inner">
            <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-20">
              {/* Logo & Address Section */}
              <div className="space-y-8">
                <div className="flex items-center gap-4">
                  <div className="relative h-12 w-12 rounded-xl overflow-hidden bg-white p-1 shadow-lg">
                    <Image src="/logo.png" alt="SIT Logo" fill className="object-contain" />
                  </div>
                  <div className="flex flex-col">
                    <h3 className="text-xl font-black uppercase tracking-tight">Sharad Institute</h3>
                    <p className="text-[10px] text-primary font-bold uppercase tracking-[0.2em] leading-none">Polytechnic, Yadrav</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="text-2xl font-black uppercase tracking-tight border-b border-primary/20 pb-2 mb-4">Address</h4>
                  <div className="space-y-1 text-sm font-medium opacity-80 leading-relaxed text-muted-foreground">
                    <p>Sharad Institute of Technology,</p>
                    <p>Polytechnic,</p>
                    <p>Yadrav, Jay-Sangli Naka,</p>
                    <p>Yadrav – Ichalkaranji – 416121</p>
                    <p>Tal- Shirol, Dist - Kolhapur,</p>
                    <p>Maharashtra, India.</p>
                  </div>
                </div>
              </div>

              {/* Contact Details Section */}
              <div className="grid grid-cols-1 gap-8 relative">
                <div className="hidden md:block absolute -left-10 lg:-left-12 top-0 bottom-0 w-[1px] bg-border/50"></div>
                <div className="space-y-4">
                  <h4 className="text-2xl font-black uppercase tracking-tight border-b border-primary/20 pb-2 mb-4">Contact Details</h4>

                  <div className="space-y-6">
                    <div className="flex items-start gap-4 group">
                      <div className="p-2 rounded-lg bg-primary/10 border border-primary/20 text-primary">
                        <Phone size={20} />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">Toll Free</span>
                        <span className="text-sm font-bold text-foreground">1800-233-1419</span>
                      </div>
                    </div>

                    <div className="flex items-start gap-4 group">
                      <div className="p-2 rounded-lg bg-primary/10 border border-primary/20 text-primary">
                        <MapPin size={20} />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">Landline</span>
                        <span className="text-sm font-bold text-foreground">(02322) 253050, 253055, 253071</span>
                      </div>
                    </div>

                    <div className="flex items-start gap-4 group">
                      <div className="p-2 rounded-lg bg-primary/10 border border-primary/20 text-primary">
                        <Printer size={20} />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">Fax</span>
                        <span className="text-sm font-bold text-foreground">(02322) 252027</span>
                      </div>
                    </div>

                    <div className="flex items-start gap-4 group">
                      <div className="p-2 rounded-lg bg-primary/10 border border-primary/20 text-primary">
                        <Mail size={20} />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">Email</span>
                        <span className="text-sm font-bold text-foreground">contact@sitpolytechnic.org</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="max-w-7xl mx-auto mt-12 pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4 text-[10px] font-bold uppercase tracking-widest opacity-30">
              <p>© {new Date().getFullYear()} Sharad Institute of Technology, Polytechnic. All rights reserved.</p>
              <div className="flex gap-6">
                <Link href="#" className="hover:text-primary transition-colors">Privacy Policy</Link>
                <Link href="#" className="hover:text-primary transition-colors">Terms of Service</Link>
              </div>
            </div>
          </footer>
        </main>
      </div>
    </div>
  )
}

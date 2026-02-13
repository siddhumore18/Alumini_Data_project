"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Mail, MapPin, Phone, Printer, Globe, Info, Award, Target, Eye, Users as UsersIcon } from "lucide-react"
import Image from "next/image"
import { Button } from "@/components/ui/button"

export default function AboutPage() {
    const contactInfo = [
        {
            icon: <Phone className="h-5 w-5 text-primary" />,
            title: "Toll Free",
            content: "1800-233-1419",
        },
        {
            icon: <Phone className="h-5 w-5 text-primary" />,
            title: "Landline",
            content: "(02322) 253050, 253055, 253071",
        },
        {
            icon: <Printer className="h-5 w-5 text-primary" />,
            title: "Fax",
            content: "(02322) 252027",
        },
        {
            icon: <Mail className="h-5 w-5 text-primary" />,
            title: "Email",
            content: "contact@sitpolytechnic.org",
        },
    ]

    const addressInfo = [
        "Sharad Institute of Technology,",
        "Polytechnic,",
        "Yadrav, Jay-Sangli Naka,",
        "Yadrav – Ichalkaranji – 416121",
        "Tal- Shirol, Dist - Kolhapur,",
        "Maharashtra, India.",
    ]

    return (
        <div className="space-y-12">
            {/* Hero Section */}
            <section className="relative h-[400px] w-full overflow-hidden rounded-3xl lg:h-[500px]">
                <div className="absolute inset-0 bg-gradient-to-r from-primary/90 to-primary/40 z-10" />
                <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1562774053-701939374585?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80')] bg-cover bg-center" />
                <div className="relative z-20 flex h-full flex-col justify-center px-8 lg:px-16 text-white max-w-4xl">
                    <h1 className="text-5xl font-black tracking-tight lg:text-7xl mb-6 leading-none">
                        Sharad Institute of Technology, Polytechnic
                    </h1>
                    <p className="text-xl font-medium opacity-90 max-w-2xl leading-relaxed">
                        Empowering students with quality technical education and fostering a community of lifelong learners and successful alumni.
                    </p>
                </div>
            </section>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* About Info */}
                <div className="lg:col-span-2 space-y-8">
                    <Card className="border-none shadow-2xl shadow-primary/5 bg-card/50 backdrop-blur-xl">
                        <CardHeader className="pb-4 border-b">
                            <CardTitle className="text-3xl font-black tracking-tight flex items-center gap-3">
                                <Info className="h-8 w-8 text-primary" />
                                About Our Institution
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-8 space-y-6">
                            <p className="text-lg text-muted-foreground leading-relaxed">
                                Sharad Institute of Technology, Polytechnic (SITP) stands as a beacon of excellence in technical education.
                                Our institution is dedicated to providing students with the skills and knowledge required to excel in the
                                rapidly evolving world of technology.
                            </p>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                                <div className="p-6 rounded-2xl bg-primary/5 border border-primary/10">
                                    <div className="flex items-center gap-3 mb-4">
                                        <Target className="h-6 w-6 text-primary" />
                                        <h3 className="font-bold text-xl">Our Mission</h3>
                                    </div>
                                    <p className="text-sm text-muted-foreground leading-relaxed font-medium">
                                        To provide value-based technical education and contribute toward the progress of society by creating technocrats who can face modern challenges.
                                    </p>
                                </div>
                                <div className="p-6 rounded-2xl bg-secondary/5 border border-secondary/10">
                                    <div className="flex items-center gap-3 mb-4">
                                        <Eye className="h-6 w-6 text-secondary" />
                                        <h3 className="font-bold text-xl">Our Vision</h3>
                                    </div>
                                    <p className="text-sm text-muted-foreground leading-relaxed font-medium">
                                        To evolve as a leading institute of technical study focusing on academic excellence, industry interaction, and personality development.
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Achievement section */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="flex flex-col items-center justify-center p-8 rounded-3xl bg-card border shadow-lg text-center">
                            <Award className="h-10 w-10 text-primary mb-4" />
                            <span className="text-3xl font-black text-foreground">20+</span>
                            <span className="text-sm text-muted-foreground font-bold mt-1">Years Excellence</span>
                        </div>
                        <div className="flex flex-col items-center justify-center p-8 rounded-3xl bg-card border shadow-lg text-center">
                            <UsersIcon className="h-10 w-10 text-secondary mb-4" />
                            <span className="text-3xl font-black text-foreground">10k+</span>
                            <span className="text-sm text-muted-foreground font-bold mt-1">Global Alumni</span>
                        </div>
                        <div className="flex flex-col items-center justify-center p-8 rounded-3xl bg-card border shadow-lg text-center">
                            <Globe className="h-10 w-10 text-primary mb-4" />
                            <span className="text-3xl font-black text-foreground">50+</span>
                            <span className="text-sm text-muted-foreground font-bold mt-1">Industry Partners</span>
                        </div>
                    </div>
                </div>

                {/* Contact & Address Sidebar */}
                <div className="space-y-8">
                    <Card className="border-none shadow-2xl shadow-primary/5 bg-primary overflow-hidden text-white">
                        <CardHeader className="pb-4 border-b border-white/10">
                            <CardTitle className="text-2xl font-black tracking-tight flex items-center gap-3">
                                <MapPin className="h-6 w-6" />
                                Our Location
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-8">
                            <div className="space-y-2">
                                {addressInfo.map((line, idx) => (
                                    <p key={idx} className="text-lg font-bold opacity-90 leading-tight">
                                        {line}
                                    </p>
                                ))}
                            </div>
                            <div className="mt-8 pt-8 border-t border-white/10">
                                <Button className="w-full bg-white text-primary hover:bg-slate-100 font-black h-12 rounded-xl">
                                    Get Directions
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-none shadow-2xl shadow-primary/5 bg-card/50 backdrop-blur-xl">
                        <CardHeader className="pb-4 border-b">
                            <CardTitle className="text-2xl font-black tracking-tight flex items-center gap-3">
                                <Phone className="h-6 w-6 text-primary" />
                                Contact Details
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-8 space-y-6">
                            {contactInfo.map((item, idx) => (
                                <div key={idx} className="flex gap-4 group">
                                    <div className="p-3 rounded-xl bg-primary/10 group-hover:bg-primary group-hover:text-white transition-all duration-300">
                                        {item.icon}
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">{item.title}</span>
                                        <span className="text-base font-black text-foreground">{item.content}</span>
                                    </div>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}

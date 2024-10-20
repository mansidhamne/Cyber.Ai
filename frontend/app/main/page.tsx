"use client"
import { HoveredLink, Menu, MenuItem, ProductItem } from "../../components/ui/navbar-menu";
import React, { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { Shield, ChevronDown, Search, MessageSquare, User, Eye, EyeOff, Lock, Unlock, Globe, Server } from 'lucide-react'
import { Boxes } from "../../components/ui/background-boxes";
import { cn } from "@/lib/utils";
import  Button  from "@/components/Button"
import Button2 from "@/components/Button2"
import { Input } from "@/components/ui/input"
import { useUser, UserButton, SignUp } from "@clerk/nextjs";
import { useRouter } from 'next/navigation';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { SignIn } from "@clerk/nextjs";

const DigitalRain = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    canvas.width = window.innerWidth
    canvas.height = window.innerHeight

    const fontSize = 14
    const columns = canvas.width / fontSize

    const drops: number[] = []
    for (let i = 0; i < columns; i++) {
      drops[i] = 1
    }

    const draw = () => {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.05)'
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      ctx.fillStyle = '#0f0'
      ctx.font = `${fontSize}px monospace`

      for (let i = 0; i < drops.length; i++) {
        const text = String.fromCharCode(Math.random() * 128)
        ctx.fillText(text, i * fontSize, drops[i] * fontSize)

        if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) {
          drops[i] = 0
        }

        drops[i]++
      }
    }

    const interval = setInterval(draw, 33)

    const handleResize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }

    window.addEventListener('resize', handleResize)

    return () => {
      clearInterval(interval)
      window.removeEventListener('resize', handleResize)
    }
  }, [])

  return <canvas ref={canvasRef} className="fixed top-0 left-0 w-full h-full -z-10" />
}

export default function LandingPage() {
  const { isSignedIn, user, isLoaded } = useUser();
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    // Handle login logic here
    console.log('Login attempted with:', email, password)
  }

  return (
    <div className="min-h-screen relative w-full overflow-hidden  rounded-lg bg-[conic-gradient(at_bottom_right,_var(--tw-gradient-stops))] from-teal-300 via-blue-300 to-white">
    <div className=" inset-0 w-full h-full  pointer-events-none" />
    <Boxes />

      <div className=" z-10">
        {/* Navigation */}
        
        <div className=" w-full flex items-center justify-center">
        <Navbar className="top-2" />
        </div>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8 pt-36">
          <div className="grid grid-cols-1 md:grid-cols-5  gap-12 items-center">
            {/* Left Column */}
            <div className='max-w-4xl col-span-3'>
              <motion.h1 
                className="text-3xl md:text-5xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-600"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                Unbreakable security.<br />
                It's possible. It's CyberGuard.
              </motion.h1>
              <motion.p 
                className="text-xl text-gray-800 mb-8"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                Navigate the dark alleys of your digital infrastructure with our AI-driven cybersecurity assessment bot. Stay one step ahead in the unforgiving cyber landscape.
              </motion.p>
              <motion.div 
                className="space-x-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
              >
                <Button />
                <Button2/>
              </motion.div>
            </div>

            {/* Right Column */}
            
              <div>
              <SignIn redirectUrl="/dashboard" />              </div>
           
          </div>

          {/* Features Section */}
          <motion.div 
            className="mt-24 grid grid-cols-1 md:grid-cols-3 gap-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.6 }}
          >
            {[
              { icon: Lock, title: "Advanced Encryption", description: "Military-grade encryption to protect your sensitive data." },
              { icon: Globe, title: "Global Threat Intelligence", description: "Real-time updates on emerging cyber threats worldwide." },
              { icon: Server, title: "Secure Infrastructure", description: "Robust and resilient infrastructure to withstand attacks." }
            ].map((feature, index) => (
              <div key={index} className="bg-white bg-opacity-80 backdrop-blur-sm p-6 rounded-lg border border-gray-700 hover:border-blue-500 transition-colors duration-300">
                <feature.icon className="w-12 h-12 text-blue-500 mb-4" />
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-gray-400">{feature.description}</p>
              </div>
            ))}
          </motion.div>
        </main>

        {/* Footer */}
        <footer className="bg-white bg-opacity-80 backdrop-blur-sm mt-24 py-12 border-t border-gray-700">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              <div>
                <h4 className="text-lg font-semibold mb-4">Solutions</h4>
                <ul className="space-y-2">
                  <li><a href="#" className="text-gray-400 hover:text-blue-400">Threat Detection</a></li>
                  <li><a href="#" className="text-gray-400 hover:text-blue-400">Incident Response</a></li>
                  <li><a href="#" className="text-gray-400 hover:text-blue-400">Compliance Management</a></li>
                </ul>
              </div>
              <div>
                <h4 className="text-lg font-semibold mb-4">Pricing</h4>
                <ul className="space-y-2">
                  <li><a href="#" className="text-gray-400 hover:text-blue-400">Blog</a></li>
                  <li><a href="#" className="text-gray-400 hover:text-blue-400">Whitepapers</a></li>
                  <li><a href="#" className="text-gray-400 hover:text-blue-400">Webinars</a></li>
                </ul>
              </div>
              <div>
                <h4 className="text-lg font-semibold mb-4">About Us</h4>
                <ul className="space-y-2">
                  <li><a href="#" className="text-gray-400 hover:text-blue-400">About Us</a></li>
                  <li><a href="#" className="text-gray-400 hover:text-blue-400">Careers</a></li>
                  <li><a href="#" className="text-gray-400 hover:text-blue-400">Contact</a></li>
                </ul>
              </div>
              <div>
                <h4 className="text-lg font-semibold mb-4">Connect</h4>
                <ul className="space-y-2">
                  <li><a href="#" className="text-gray-400 hover:text-blue-400">Twitter</a></li>
                  <li><a href="#" className="text-gray-400 hover:text-blue-400">LinkedIn</a></li>
                  <li><a href="#" className="text-gray-400 hover:text-blue-400">GitHub</a></li>
                </ul>
              </div>
            </div>
            <div className="mt-8 pt-8 border-t border-gray-700 text-center text-gray-400">
              <p>&copy; 2024 CyberGuard. All rights reserved.</p>
            </div>
          </div>
        </footer>
      </div>
    </div>
  )
}

function Navbar({ className }: { className?: string }) {
  const [active, setActive] = useState<string | null>(null);
  return (
    <div
      className={cn("fixed top-10 inset-x-0 max-w-2xl mx-auto z-50 font-medium text-lg", className)}
    >
      <Menu setActive={setActive}>
        <MenuItem setActive={setActive} active={active} item="Services">
          <div className="flex flex-col space-y-4 text-sm">
            <HoveredLink href="/web-dev">Web Development</HoveredLink>
            <HoveredLink href="/interface-design">Interface Design</HoveredLink>
            <HoveredLink href="/seo">Search Engine Optimization</HoveredLink>
            <HoveredLink href="/branding">Branding</HoveredLink>
          </div>
        </MenuItem>
        <MenuItem setActive={setActive} active={active} item="Products">
          <div className="  text-sm grid grid-cols-2 gap-10 p-4">
           
          </div>
        </MenuItem>
        <MenuItem setActive={setActive} active={active} item="Pricing">
          <div className="flex flex-col space-y-4 text-sm">
            <HoveredLink href="/hobby">Hobby</HoveredLink>
            <HoveredLink href="/individual">Individual</HoveredLink>
            <HoveredLink href="/team">Team</HoveredLink>
            <HoveredLink href="/enterprise">Enterprise</HoveredLink>
          </div>
        </MenuItem>
      </Menu>
    </div>
  );
}

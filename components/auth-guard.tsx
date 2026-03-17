'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuthStore } from '@/lib/store'

const protectedPrefixes: string[] = [
  '/customer',
  '/vendor',
  '/delivery',
  '/admin',
  '/products'
]

// Paths that might start with protected prefix but should remain public
const publicExclusions = [
  '/vendor/apply',
  '/vendor/learn-more',
  '/delivery/apply',
]

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const user = useAuthStore((state) => state.user)
  const router = useRouter()
  const pathname = usePathname()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted) return

    const requiresAuth = protectedPrefixes.some(prefix => pathname?.startsWith(prefix))
    const isExcluded = publicExclusions.includes(pathname || '')

    if (requiresAuth && !isExcluded) {
      const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null
      
      if (!user && !token) {
        router.push('/login')
        return
      }

      // Role-based protection
      if (user) {
        if (pathname?.startsWith('/admin') && user.role?.toUpperCase() !== 'ADMIN') {
          router.push('/login') // Or a forbidden page
        } else if (pathname?.startsWith('/vendor') && user.role?.toUpperCase() !== 'VENDOR' && !isExcluded) {
          router.push('/login')
        } else if (pathname?.startsWith('/delivery') && user.role?.toUpperCase() !== 'DELIVERY' && !isExcluded) {
          router.push('/login')
        }
      }
    }
  }, [mounted, user, pathname, router])

  // Prevent UI flash on client-side before mount
  if (!mounted) {
    return <div className="min-h-screen bg-background" />
  }

  return <>{children}</>
}

'use client'

import React from 'react'
import Image from 'next/image'
/* ------------------------------------------------------------------ */
/*  Product card data — all using Refined Violet palette               */
/* ------------------------------------------------------------------ */
const products = [
  {
    name: 'Studio Headphones',
    price: '₹4,999',
    tag: 'Trending',
    rating: '4.9',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 18v-6a9 9 0 0 1 18 0v6" />
        <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3z" />
        <path d="M3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z" />
      </svg>
    ),
  },
  {
    name: 'Ultrabook Pro',
    price: '₹74,999',
    tag: 'Best Seller',
    rating: '4.7',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 16V7a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v9m16 0H4m16 0 1.28 2.55a1 1 0 0 1-.9 1.45H3.62a1 1 0 0 1-.9-1.45L4 16" />
      </svg>
    ),
  },
  {
    name: 'Smart Watch',
    price: '₹3,999',
    tag: 'New Arrival',
    rating: '4.8',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="6" y="6" width="12" height="12" rx="3" />
        <path d="M12 9v3l1.5 1.5" />
        <path d="M8 6V3.5a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1V6" />
        <path d="M8 18v2.5a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V18" />
      </svg>
    ),
  },
  {
    name: 'Sport Sneakers',
    price: '₹2,499',
    tag: 'Best Seller',
    rating: '4.8',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M2 18h20" />
        <path d="M4 18v-4a3 3 0 0 1 3-3h2l2-3 2 2c1.5 1 3 1.5 5 1.5h2v6.5" />
        <circle cx="7" cy="18" r="0.5" fill="currentColor" />
        <circle cx="17" cy="18" r="0.5" fill="currentColor" />
      </svg>
    ),
  },
  {
    name: 'Designer Kurta',
    price: '₹1,899',
    tag: 'Trending',
    rating: '4.6',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20.38 3.46 16 2a4 4 0 0 1-8 0L3.62 3.46a2 2 0 0 0-1.34 2.23l.58 3.47a1 1 0 0 0 .99.84H6v10c0 1.1.9 2 2 2h8a2 2 0 0 0 2-2V10h2.15a1 1 0 0 0 .99-.84l.58-3.47a2 2 0 0 0-1.34-2.23z" />
      </svg>
    ),
  },
]

/* positions for product cards */
const cardPositions = [
  { top: '2%',  left: '12%'  },
  { top: '28%', left: '4%'  },
  { top: '55%', left: '18%' },
  { top: '8%',  right: '15%' },
  { top: '35%', right: '5%' },
]

const floatAnimations = [
  'heroFloat1', 'heroFloat2', 'heroFloat3', 'heroFloat4', 'heroFloat5',
]

/* ------------------------------------------------------------------ */
/*  Component                                                           */
/* ------------------------------------------------------------------ */
export function HeroIllustration() {
  return (
    <div className="hero-illustration">
      <div className="hero-ill-glow" />

      {/* Boy Image with mixBlendMode to remove white background */}
      <div style={{ position: 'relative', width: '100%', maxWidth: '350px', margin: '0 auto' }}>
        <Image
          src="/hero-boy-nobg.png"
          alt="Boy browsing phone"
          width={400}
          height={600}
          priority
          style={{ width: '100%', height: 'auto', objectFit: 'contain' }}
        />
      </div>

      {/* ---- FLOATING PRODUCT CARDS ---- */}
      <div className="hero-ill-cards">
        {products.map((p, i) => (
          <div
            key={p.name}
            className={`hero-ill-card ${floatAnimations[i]}`}
            style={{
              ...cardPositions[i],
              animationDelay: `${i * 0.5}s`,
            } as React.CSSProperties}
          >
            <div className="hero-ill-card-img">
              <span className="hero-ill-card-tag">{p.tag}</span>
              <div className="hero-ill-card-icon">{p.icon}</div>
            </div>
            <div className="hero-ill-card-info">
              <span className="hero-ill-card-name">{p.name}</span>
              <div className="hero-ill-card-row">
                <span className="hero-ill-card-price">{p.price}</span>
                <span className="hero-ill-card-stars">★ {p.rating}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

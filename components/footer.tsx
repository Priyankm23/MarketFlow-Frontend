"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";

export function Footer() {
  return (
    <footer className="bg-[var(--bg-surface)] pt-16 sm:pt-20 pb-12 border-t border-[var(--border-default)] font-body">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 sm:gap-12 mb-12 sm:mb-16">
          <div className="col-span-2">
            <Link href="/" className="inline-flex items-center mb-5">
              <Image
                src="/logo/logo.png"
                alt="Markivo"
                width={172}
                height={46}
                className="h-10 w-auto"
              />
            </Link>
            <p className="text-[var(--text-secondary)] text-sm leading-relaxed max-w-xs">
              The most trusted bridge between offline commerce and digital
              convenience in India.
            </p>
          </div>

          <div>
            <h4 className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)] mb-5">
              Explore
            </h4>
            <ul className="space-y-3">
              <li>
                <Link
                  href="/products"
                  className="text-sm text-[var(--text-secondary)] hover:text-[var(--brand-accent)] transition-colors"
                >
                  Products
                </Link>
              </li>
              <li>
                <Link
                  href="/products"
                  className="text-sm text-[var(--text-secondary)] hover:text-[var(--brand-accent)] transition-colors"
                >
                  Categories
                </Link>
              </li>
              <li>
                <Link
                  href="/deals"
                  className="text-sm text-[var(--text-secondary)] hover:text-[var(--brand-accent)] transition-colors"
                >
                  Browse Deals
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)] mb-5">
              Partners
            </h4>
            <ul className="space-y-3">
              <li>
                <Link
                  href="/vendor/apply"
                  className="text-sm text-[var(--text-secondary)] hover:text-[var(--brand-accent)] transition-colors"
                >
                  Become a Vendor
                </Link>
              </li>
              <li>
                <Link
                  href="/vendor/apply"
                  className="text-sm text-[var(--text-secondary)] hover:text-[var(--brand-accent)] transition-colors"
                >
                  Vendor Guidelines
                </Link>
              </li>
              <li>
                <Link
                  href="/login"
                  className="text-sm text-[var(--text-secondary)] hover:text-[var(--brand-accent)] transition-colors"
                >
                  Support
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)] mb-5">
              Legal
            </h4>
            <ul className="space-y-3">
              <li>
                <Link
                  href="#"
                  className="text-sm text-[var(--text-secondary)] hover:text-[var(--brand-accent)] transition-colors"
                >
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link
                  href="#"
                  className="text-sm text-[var(--text-secondary)] hover:text-[var(--brand-accent)] transition-colors"
                >
                  Terms of Service
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-[var(--border-default)] flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-[11px] text-[var(--text-muted)] uppercase tracking-wider text-center sm:text-left">
            © 2026 Markivo. All rights reserved. Built for India.
          </p>
          <div className="flex gap-6">
            <Link
              href="#"
              className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)] hover:text-[var(--brand-accent)] transition-colors"
            >
              Twitter
            </Link>
            <Link
              href="#"
              className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)] hover:text-[var(--brand-accent)] transition-colors"
            >
              Instagram
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

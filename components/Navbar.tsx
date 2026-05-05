"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const navStyles = `
  .nav {
    position: fixed; top: 0; left: 0; right: 0; z-index: 200;
    padding: 18px 6%;
    display: flex; align-items: center; justify-content: space-between;
    transition: background .35s, backdrop-filter .35s, box-shadow .35s;
  }
  .nav.scrolled {
    background: rgba(10, 61, 43, 0.97);
    backdrop-filter: blur(12px);
    box-shadow: 0 2px 24px rgba(0,0,0,.22);
  }
  .nav-logo {
    font-family: var(--ff-display);
    font-size: 30px;
    letter-spacing: .06em;
    color: #fff;
    line-height: 1;
    user-select: none;
  }
  .nav-logo span { color: var(--a300); }
  .nav-right { display: flex; align-items: center; gap: 20px; }
  .nav-link {
    color: rgba(255,255,255,.75);
    font-size: 13px;
    font-weight: 500;
    letter-spacing: .02em;
    transition: color .2s;
  }
  .nav-link:hover { color: #fff; }
  .nav-cta {
    background: var(--a500);
    color: #fff;
    font-weight: 700;
    font-size: 13px;
    letter-spacing: .03em;
    padding: 10px 22px;
    border-radius: 50px;
    box-shadow: var(--sh-btn-a);
    transition: transform .2s, box-shadow .2s, background .2s;
  }
  .nav-cta:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 28px rgba(212,132,12,.45);
    background: #e8920e;
  }
  @media (max-width: 720px) { .nav-link { display: none; } }
  @media (max-width: 480px) { .nav-cta { padding: 8px 16px; font-size: 12px; } }
`;

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 70);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      <style>{navStyles}</style>
      <nav className={`nav${scrolled ? " scrolled" : ""}`}>
        <div className="nav-logo">
          TÁ<span>.</span>PRA<span>.</span>PESCA
        </div>
        <div className="nav-right">
          <Link href="#kits" className="nav-link">Kits</Link>
          <Link href="#como-funciona" className="nav-link">Como funciona</Link>
          <Link href="#faq" className="nav-link">Dúvidas</Link>
          <Link href="#kits" className="nav-cta">Escolher kit ↓</Link>
        </div>
      </nav>
    </>
  );
}

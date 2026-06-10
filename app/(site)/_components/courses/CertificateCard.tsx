'use client';

import React, { useMemo } from 'react';

interface CertificateCardProps {
  customerName: string;
  courseTitle: string;
  enrolledAt?: number;
  completedAt: number;
  certificateCode: string;
  currentUrl?: string;
  className?: string;
}

// ─── Guilloche helper: generates a spirograph/hypotrochoid path ───────────────
// Formula: x = (R-r)cos(t) + d·cos((R-r)/r · t)
//          y = (R-r)sin(t) - d·sin((R-r)/r · t)
function guillochePathD(
  R: number,
  r: number,
  d: number,
  steps = 1200,
  cx = 0,
  cy = 0,
): string {
  const points: string[] = [];
  for (let i = 0; i <= steps; i++) {
    const t = (i / steps) * Math.PI * 2 * r; // full cycle
    const x = cx + (R - r) * Math.cos(t) + d * Math.cos(((R - r) / r) * t);
    const y = cy + (R - r) * Math.sin(t) - d * Math.sin(((R - r) / r) * t);
    points.push(`${i === 0 ? 'M' : 'L'}${x.toFixed(2)},${y.toFixed(2)}`);
  }
  return points.join(' ') + ' Z';
}



// ─── Starburst helper: N-ray notary seal polygon ──────────────────────────────
// Most praised certificate seal shape (2024 dev community, Certifier, Canva)
function starburstPoints(
  cx: number, cy: number,
  outerR: number, innerR: number,
  rays: number,
): string {
  const pts: string[] = [];
  for (let i = 0; i < rays * 2; i++) {
    const angle = (i * Math.PI) / rays - Math.PI / 2;
    const r = i % 2 === 0 ? outerR : innerR;
    pts.push(`${(cx + r * Math.cos(angle)).toFixed(2)},${(cy + r * Math.sin(angle)).toFixed(2)}`);
  }
  return pts.join(' ');
}

export function CertificateCard({
  customerName,
  courseTitle,
  completedAt,
  certificateCode,
  currentUrl,
  className = '',
}: CertificateCardProps) {
  const completedDateStr = new Date(completedAt).toLocaleDateString('vi-VN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  // Pre-compute guilloche paths (expensive but static)
  const guillocheOuter = useMemo(() => guillochePathD(80, 11, 68, 1800, 0, 0), []);
  const guillocheInner = useMemo(() => guillochePathD(60, 7, 52, 1800, 0, 0), []);
  // 24-ray starburst notary seal (cx=36,cy=36, outerR=35, innerR=28)
  const sealPoints = useMemo(() => starburstPoints(36, 36, 35, 28, 24), []);

  return (
    <>
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Great+Vibes&family=Be+Vietnam+Pro:wght@300;400;500;600;700;800;900&display=swap');

        .font-cert-sans {
          font-family: 'Be Vietnam Pro', var(--font-be-vietnam-pro), sans-serif;
        }
        .font-signature-great-vibes {
          font-family: 'Great Vibes', cursive;
        }

        @media print {
          @page { size: A4 landscape; margin: 0; }
          html, body {
            background: #ffffff !important;
            margin: 0 !important; padding: 0 !important;
            height: 100% !important; overflow: hidden !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          body * { visibility: hidden !important; }
          .print-container, .print-container * { visibility: visible !important; }
          .print-container {
            position: absolute !important;
            top: 0 !important; left: 0 !important;
            width: 297mm !important; height: 210mm !important;
            padding: 32px !important; margin: 0 !important;
            box-shadow: none !important; border: none !important;
            transform: none !important; border-radius: 0 !important;
            background-color: #F8F0DC !important;
            box-sizing: border-box !important;
          }
        }
      `}</style>

      <div
        className={`w-full bg-[#F8F0DC] text-[#0f172a] p-8 md:p-12 shadow-2xl rounded-xl border border-[#C9A84C]/30 relative overflow-hidden print-container select-none ${className}`}
        style={{ aspectRatio: '297 / 185', boxSizing: 'border-box' }}
      >

        {/* ══════════════════════════════════════════════════════
            BACKGROUND LAYER 1 — Fine diagonal cross-hatch (security paper)
            #1 most praised certificate pattern: heropatterns.com, Certifier,
            Canva premium — same aesthetic as banknotes & official documents
        ══════════════════════════════════════════════════════ */}
        <svg
          aria-hidden="true"
          className="absolute inset-0 w-full h-full pointer-events-none"
          xmlns="http://www.w3.org/2000/svg"
          preserveAspectRatio="xMidYMid slice"
        >
          <defs>
            {/*
              Color token system (research-backed, Canva/Certifier/Harvard-style):
              - stroke.gold-metallic: #C9A84C  (true metallic gold, luminous shimmer)
              - bg.parchment:        #F8F0DC  (warm parchment — avoids cold white feel)
              - vignette.edge:       #D4A843  (deeper gold fade at edges)
            */}
            {/* Diamond mesh: two sets of diagonal lines at 45° and -45° */}
            <pattern id="hatch-45" x="0" y="0" width="10" height="10" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
              <line x1="0" y1="0" x2="0" y2="10" stroke="#C9A84C" strokeWidth="0.3" strokeOpacity="0.18"/>
            </pattern>
            <pattern id="hatch-neg45" x="0" y="0" width="10" height="10" patternUnits="userSpaceOnUse" patternTransform="rotate(-45)">
              <line x1="0" y1="0" x2="0" y2="10" stroke="#C9A84C" strokeWidth="0.3" strokeOpacity="0.12"/>
            </pattern>
            <radialGradient id="vignette-cert" cx="50%" cy="50%" r="65%">
              <stop offset="0%" stopColor="#F8F0DC" stopOpacity="0" />
              <stop offset="100%" stopColor="#D4A843" stopOpacity="0.2" />
            </radialGradient>
          </defs>
          {/* Layer cross-hatch: +45° then -45° = diamond mesh */}
          <rect width="100%" height="100%" fill="url(#hatch-45)" />
          <rect width="100%" height="100%" fill="url(#hatch-neg45)" />
          {/* Vignette on top */}
          <rect width="100%" height="100%" fill="url(#vignette-cert)" />
        </svg>


        {/* ══════════════════════════════════════════════════════
            BACKGROUND LAYER 2 — Guilloche spirograph (bottom-left & top-right)
            Iconic security-document pattern — #1 on certificates globally
        ══════════════════════════════════════════════════════ */}

        {/* Guilloche — bottom-left */}
        <svg
          aria-hidden="true"
          className="absolute pointer-events-none"
          style={{ bottom: '-10%', left: '-8%', width: '38%', opacity: 0.07 }}
          viewBox="-90 -90 180 180"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d={guillocheOuter} fill="none" stroke="#7f5d34" strokeWidth="0.5" />
          <path d={guillocheInner} fill="none" stroke="#a27b4c" strokeWidth="0.4" />
        </svg>

        {/* Guilloche — top-right */}
        <svg
          aria-hidden="true"
          className="absolute pointer-events-none"
          style={{ top: '-10%', right: '-8%', width: '38%', opacity: 0.07, transform: 'rotate(45deg)' }}
          viewBox="-90 -90 180 180"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d={guillocheOuter} fill="none" stroke="#7f5d34" strokeWidth="0.5" />
          <path d={guillocheInner} fill="none" stroke="#a27b4c" strokeWidth="0.4" />
        </svg>

        {/* ══════════════════════════════════════════════════════
            BACKGROUND LAYER 3 — Rosette (center-faint watermark)
            Gothic rose window — popular on Harvard/MIT style certs
        ══════════════════════════════════════════════════════ */}
        <svg
          aria-hidden="true"
          className="absolute pointer-events-none"
          style={{
            top: '50%', left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '42%', opacity: 0.035,
          }}
          viewBox="-110 -110 220 220"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Outer ring */}
          <circle cx="0" cy="0" r="100" fill="none" stroke="#a27b4c" strokeWidth="1.2" />
          <circle cx="0" cy="0" r="90" fill="none" stroke="#a27b4c" strokeWidth="0.5" />
          {/* 12-petal rosette */}
          {Array.from({ length: 12 }).map((_, i) => {
            const angle = (i / 12) * Math.PI * 2;
            const bx = 45 * Math.cos(angle);
            const by = 45 * Math.sin(angle);
            return (
              <circle key={i} cx={bx} cy={by} r="45"
                fill="none" stroke="#a27b4c" strokeWidth="0.7" strokeOpacity="0.9"
              />
            );
          })}
          {/* Inner 6-petal */}
          {Array.from({ length: 6 }).map((_, i) => {
            const angle = (i / 6) * Math.PI * 2;
            const bx = 22 * Math.cos(angle);
            const by = 22 * Math.sin(angle);
            return (
              <circle key={i} cx={bx} cy={by} r="22"
                fill="none" stroke="#7f5d34" strokeWidth="0.6" strokeOpacity="0.8"
              />
            );
          })}
          {/* Center dot */}
          <circle cx="0" cy="0" r="5" fill="#a27b4c" fillOpacity="0.6" />
          <circle cx="0" cy="0" r="2" fill="#7f5d34" fillOpacity="1" />
          {/* Radial spokes */}
          {Array.from({ length: 12 }).map((_, i) => {
            const angle = (i / 12) * Math.PI * 2;
            return (
              <line key={i}
                x1={0} y1={0}
                x2={(98 * Math.cos(angle)).toFixed(2)}
                y2={(98 * Math.sin(angle)).toFixed(2)}
                stroke="#a27b4c" strokeWidth="0.35" strokeOpacity="0.5"
              />
            );
          })}
        </svg>

        {/* ─── Double-line ornate frame — sát mép hơn ─── */}
        <div className="absolute inset-1.5 border border-[#a27b4c]/25 pointer-events-none" />
        <div className="absolute inset-[10px] border-[2.5px] border-double border-[#a27b4c]/60 pointer-events-none" />

        {/* ─── Corner ornaments — sát mép theo border ─── */}
        {[
          'top-2 left-2',
          'top-2 right-2 rotate-90',
          'bottom-2 left-2 -rotate-90',
          'bottom-2 right-2 rotate-180',
        ].map((pos, i) => (
          <svg
            key={i}
            aria-hidden="true"
            className={`absolute ${pos} w-12 h-12 text-[#a27b4c] pointer-events-none`}
            viewBox="0 0 56 56"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.4"
          >
            <path d="M0 0 L0 36 L4 36 L4 4 L36 4 L36 0 Z" />
            <path d="M7 7 L7 24 L9 24 L9 9 L24 9 L24 7 Z" strokeWidth="0.9" />
            <circle cx="11" cy="11" r="1.8" fill="currentColor" />
          </svg>
        ))}

        {/* ═══════════════ Certificate Content ═══════════════ */}
        <div className="h-full flex flex-col items-center text-center relative z-10 py-1 font-cert-sans">

          {/* ── SECTION 1: Header — anchored top ── */}
          <div className="space-y-0.5 pt-1">
            <div className="flex items-center justify-center gap-2">
              <span className="h-px w-10 bg-[#a27b4c]/50" />
              <p className="text-[11px] font-black tracking-[0.3em] text-[#a27b4c] uppercase">DOHY ACADEMY</p>
              <span className="h-px w-10 bg-[#a27b4c]/50" />
            </div>
            <p className="text-[8px] tracking-[0.12em] text-slate-400 font-bold uppercase">
              Professional Creative Education &amp; Certification
            </p>
          </div>

          {/* ── SECTION 2: Main content — centered vertically ── */}
          <div className="flex-1 w-full flex flex-col items-center justify-center">

            {/* Title */}
            <div className="space-y-1">
              <h1 className="text-2xl md:text-3xl font-extrabold tracking-[0.06em] text-slate-800 uppercase">
                CHỨNG NHẬN HOÀN THÀNH
              </h1>
              <p className="text-[11px] italic text-slate-400 font-medium">
                Chứng chỉ này được trân trọng trao tặng cho
              </p>
            </div>

            {/* Recipient name */}
            <div className="mt-5">
              <h2 className="text-[3.4rem] md:text-[4rem] font-black text-[#0f172a] tracking-wide uppercase leading-none drop-shadow-sm">
                {customerName}
              </h2>
              <p className="text-[10.5px] text-slate-400 font-semibold max-w-sm mx-auto mt-2 leading-relaxed">
                Đã hoàn thành xuất sắc chương trình đào tạo và đạt tiêu chuẩn tốt nghiệp của khóa học chuyên sâu
              </p>
            </div>

            {/* Course title */}
            <div className="w-[72%] max-w-[560px] border-y border-[#a27b4c]/30 py-2.5 mt-5">
              <h3 className="text-[1.05rem] md:text-[1.15rem] font-extrabold text-[#a27b4c] tracking-[0.04em] uppercase leading-tight">
                {courseTitle}
              </h3>
            </div>

            {/* Date */}
            <div className="text-[9px] text-slate-400 uppercase tracking-widest font-extrabold mt-4">
              Cấp ngày {completedDateStr}
            </div>

          </div>{/* end SECTION 2 */}

          {/* ── SECTION 3: Footer — anchored bottom ── */}
          <div className="w-full grid grid-cols-3 items-end px-2 pb-1">


            {/* Signature */}
            <div className="flex flex-col justify-end items-center text-center pb-1 gap-0">
              <p className="text-[8px] font-extrabold text-slate-700 uppercase tracking-wider">Trần Mạnh Hiếu</p>
              <p className="text-[7px] text-slate-400 uppercase tracking-wider font-bold">Đại diện Dohy Studio</p>
              {/* Great Vibes — #1 certificate signature font */}
              <div className="relative mt-1.5 flex flex-col items-center">
                <span className="font-signature-great-vibes text-[1.65rem] text-slate-600 select-none whitespace-nowrap leading-none block">
                  Tran Manh Hieu
                </span>
                <div className="h-px w-full bg-gradient-to-r from-transparent via-[#a27b4c]/30 to-transparent mt-0.5" />
              </div>
            </div>




            {/* ── Starburst Notary Seal (24-ray, most praised by devs) ── */}
            <div className="flex justify-center items-center">
              <svg
                width="76" height="76" viewBox="0 0 72 72"
                className="select-none"
                aria-label="Verified seal"
                style={{ filter: 'drop-shadow(0px 2px 5px rgba(90,50,0,0.38))' }}
              >
                <defs>
                  {/* Metallic gold — highlights at top-left, deep at bottom-right */}
                  <radialGradient id="sb-outer" cx="38%" cy="30%" r="65%">
                    <stop offset="0%" stopColor="#FAE09A" />
                    <stop offset="48%" stopColor="#C9A84C" />
                    <stop offset="100%" stopColor="#7A4E14" />
                  </radialGradient>
                  <radialGradient id="sb-inner" cx="36%" cy="30%" r="65%">
                    <stop offset="0%" stopColor="#F5D070" />
                    <stop offset="52%" stopColor="#B88A2A" />
                    <stop offset="100%" stopColor="#6A3E10" />
                  </radialGradient>
                </defs>

                {/* Outer 24-ray starburst */}
                <polygon points={sealPoints} fill="url(#sb-outer)" />

                {/* Inner circle */}
                <circle cx="36" cy="36" r="22" fill="url(#sb-inner)" />

                {/* Decorative rings */}
                <circle cx="36" cy="36" r="20" fill="none" stroke="#FAE09A" strokeWidth="0.7" strokeOpacity="0.45" />
                <circle cx="36" cy="36" r="17.5" fill="none" stroke="#FAE09A" strokeWidth="0.45" strokeDasharray="1.6 1.8" strokeOpacity="0.35" />

                {/* Checkmark — bold, centered */}
                <path d="M27,35 L32.5,41 L45.5,29" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" opacity="0.93" />

                {/* VERIFIED label */}
                <text x="36" y="49" textAnchor="middle" fontSize="5" fontFamily="'Be Vietnam Pro',sans-serif" fontWeight="900" fill="white" letterSpacing="1.8" opacity="0.88">VERIFIED</text>
                {/* DOHY STUDIO label */}
                <text x="36" y="54.5" textAnchor="middle" fontSize="3.4" fontFamily="'Be Vietnam Pro',sans-serif" fontWeight="700" fill="white" letterSpacing="1" opacity="0.62">DOHY STUDIO</text>
              </svg>
            </div>

            {/* QR code — cert code là trục căn giữa, QR và label đều center theo */}
            <div className="flex flex-col items-center text-center pb-0 justify-end translate-y-2">
              {currentUrl && (
                <div className="bg-white p-1 border border-slate-200 rounded shadow-sm">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=64x64&data=${encodeURIComponent(currentUrl)}`}
                    alt="Verification QR"
                    className="w-11 h-11 object-contain"
                  />
                </div>
              )}
              <div className="mt-1.5 space-y-0.5">
                <p className="text-[7px] font-mono text-slate-500 select-all font-bold uppercase leading-none">{certificateCode}</p>
                <p className="text-[7px] text-slate-400 uppercase tracking-wider font-extrabold">Quét xác thực</p>
              </div>
            </div>


          </div>
        </div>
      </div>
    </>
  );
}

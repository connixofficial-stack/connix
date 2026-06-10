 'use client';
 
 import React from 'react';
 import { Check } from 'lucide-react';
 
 // ============ SHARED TYPES ============
 export interface BrandColorProps {
   brandColor: string;
   secondary: string;
 }
 
 // ============ BADGE COMPONENT (10% Secondary Accent) ============
 export interface BrandBadgeProps extends BrandColorProps {
   text: string;
   variant?: 'default' | 'outline' | 'minimal' | 'solid';
   className?: string;
 }
 
 /**
  * BrandBadge - Standardized badge theo 60-30-10 rule
  * - Default/Minimal: secondary background 10-15% + secondary text (ACCENT)
  * - Outline: secondary border 40% + secondary text
  * - Solid: secondary 90% background + white text (high contrast accent)
  * 
  * Visual weight: ~5-10% (secondary accent)
  */
 export const BrandBadge: React.FC<BrandBadgeProps> = ({ 
   text, 
   variant = 'default', 
   secondary, 
   className = '' 
 }) => {
   const baseStyles = "inline-flex items-center gap-2 px-3 py-1 rounded-full border text-xs font-semibold uppercase tracking-wider w-fit";
   
   if (variant === 'outline') {
     return (
       <div 
         className={`${baseStyles} bg-transparent font-medium ${className}`}
         style={{ borderColor: `${secondary}40`, color: secondary }}
       >
         {text}
       </div>
     );
   }
   
   if (variant === 'minimal') {
     return (
       <div 
         className={`inline-flex items-center gap-2 px-2.5 py-0.5 rounded-md text-xs font-medium w-fit border-transparent normal-case tracking-normal ${className}`}
         style={{ backgroundColor: `${secondary}15`, color: secondary }}
       >
         {text}
       </div>
     );
   }
 
   if (variant === 'solid') {
     return (
       <div 
         className={`${baseStyles} ${className}`}
         style={{ backgroundColor: secondary, color: 'white', borderColor: secondary }}
       >
         {text}
       </div>
     );
   }
   
   return (
     <div 
       className={`${baseStyles} ${className}`}
       style={{ backgroundColor: `${secondary}10`, borderColor: `${secondary}20`, color: secondary }}
     >
       {text}
     </div>
   );
 };
 
 export interface SaleBadgeProps {
  text: string;
  className?: string;
}

export const SaleBadge: React.FC<SaleBadgeProps> = ({ text, className = '' }) => {
  const baseStyles = "inline-flex items-center gap-2 px-3 py-1 rounded-full border text-xs font-semibold uppercase tracking-wider w-fit";
  return (
    <div
      className={`${baseStyles} ${className}`}
      style={{ backgroundColor: '#dc2626', borderColor: '#dc2626', color: '#ffffff' }}
    >
      {text}
    </div>
  );
};

// ============ STAT BOX COMPONENT (10% Secondary Accent) ============
 export interface StatBoxProps extends BrandColorProps {
   stat: { value: string; label: string };
   variant?: 'default' | 'card' | 'minimal';
   className?: string;
 }
 
 /**
  * StatBox - Hiển thị stat value với secondary color (10% accent)
  * Theo 60-30-10: stat values dùng secondary (accent), không dùng primary
  */
 export const StatBox: React.FC<StatBoxProps> = ({ 
   stat, 
   variant = 'default', 
   secondary, 
   className = '' 
 }) => {
   if (variant === 'card') {
     return (
       <div className={`bg-white p-6 md:p-8 rounded-2xl border border-slate-200/50 shadow-sm flex flex-col items-start justify-end h-full hover:border-slate-300 transition-colors group ${className}`}>
         <span 
           className="text-4xl md:text-5xl font-bold tracking-tighter mb-2 group-hover:scale-105 transition-transform origin-left"
           style={{ color: secondary }}
         >
           {stat.value}
         </span>
         <span className="text-sm font-medium text-slate-500 uppercase tracking-wide">
           {stat.label}
         </span>
       </div>
     );
   }
   
   if (variant === 'minimal') {
     return (
       <div className={`flex flex-col items-start border-l-2 pl-4 ${className}`} style={{ borderColor: `${secondary}30` }}>
         <span className="text-3xl md:text-4xl font-bold tracking-tight" style={{ color: secondary }}>
           {stat.value}
         </span>
         <span className="text-xs font-medium text-slate-500 uppercase tracking-wide mt-1">
           {stat.label}
         </span>
       </div>
     );
   }
   
   return (
     <div className={`flex flex-col items-start ${className}`}>
       <span className="text-2xl md:text-3xl font-bold tracking-tight" style={{ color: secondary }}>
         {stat.value}
       </span>
       <span className="text-sm text-slate-500 mt-1">{stat.label}</span>
     </div>
   );
 };
 
 // ============ ICON CONTAINER (30% Primary) ============
 export interface IconContainerProps extends BrandColorProps {
   icon: React.ReactNode;
   variant?: 'solid' | 'outline' | 'tint' | 'gradient';
   size?: 'sm' | 'md' | 'lg';
   className?: string;
 }
 
 /**
  * IconContainer - Icon với brand primary color (30% visual weight)
  * Theo 60-30-10: icon containers dùng primary, không dùng secondary
  */
 export const IconContainer: React.FC<IconContainerProps> = ({ 
   icon, 
   variant = 'solid', 
   brandColor, 
   size = 'md', 
   className = '' 
 }) => {
   const sizeClasses = {
     sm: 'w-10 h-10',
     md: 'w-12 h-12',
     lg: 'w-16 h-16'
   };
   
   if (variant === 'outline') {
     return (
       <div 
         className={`${sizeClasses[size]} rounded-xl border-2 flex items-center justify-center ${className}`}
         style={{ borderColor: brandColor, color: brandColor }}
       >
         {icon}
       </div>
     );
   }
   
   if (variant === 'tint') {
     return (
       <div 
         className={`${sizeClasses[size]} rounded-xl flex items-center justify-center ${className}`}
         style={{ backgroundColor: `${brandColor}10`, color: brandColor }}
       >
         {icon}
       </div>
     );
   }
 
   if (variant === 'gradient') {
     return (
       <div 
         className={`${sizeClasses[size]} rounded-xl flex items-center justify-center text-white ${className}`}
         style={{ background: `linear-gradient(135deg, ${brandColor}, ${brandColor}dd)` }}
       >
         {icon}
       </div>
     );
   }
   
   return (
     <div 
       className={`${sizeClasses[size]} rounded-xl flex items-center justify-center text-white ${className}`}
       style={{ backgroundColor: brandColor }}
     >
       {icon}
     </div>
   );
 };
 
 // ============ CHECK ICON (10% Secondary Accent) ============
 export interface CheckIconProps extends BrandColorProps {
   variant?: 'circle' | 'square' | 'minimal';
   size?: number;
   className?: string;
 }
 
 /**
  * CheckIcon - Check mark với secondary color (10% accent)
  */
 export const CheckIcon: React.FC<CheckIconProps> = ({ 
   secondary, 
   variant = 'circle', 
   size = 20, 
   className = '' 
 }) => {
   if (variant === 'minimal') {
     return <Check size={size} style={{ color: secondary }} className={className} />;
   }
   
   if (variant === 'square') {
     return (
       <div 
         className={`w-5 h-5 rounded flex items-center justify-center flex-shrink-0 ${className}`}
         style={{ backgroundColor: secondary }}
       >
         <Check size={14} className="text-white" />
       </div>
     );
   }
   
   return (
     <div 
       className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${className}`}
       style={{ backgroundColor: secondary }}
     >
       <Check size={14} className="text-white" />
     </div>
   );
 };
 
 // ============ ACCENT LINE (10% Secondary) ============
 export interface AccentLineProps extends BrandColorProps {
   orientation?: 'horizontal' | 'vertical';
   thickness?: 'thin' | 'medium' | 'thick';
   className?: string;
 }
 
 /**
  * AccentLine - Decorative line với secondary color
  */
 export const AccentLine: React.FC<AccentLineProps> = ({ 
   secondary, 
   orientation = 'horizontal', 
   thickness = 'medium', 
   className = '' 
 }) => {
   const thicknessMap = {
     thin: orientation === 'horizontal' ? 'h-0.5' : 'w-0.5',
     medium: orientation === 'horizontal' ? 'h-1' : 'w-1',
     thick: orientation === 'horizontal' ? 'h-2' : 'w-2'
   };
   
   return (
     <div 
       className={`${thicknessMap[thickness]} rounded-full ${className}`}
       style={{ backgroundColor: secondary }}
     />
   );
 };
 
 // ============ PULSE DOT (30% Primary) ============
 export interface PulseDotProps extends BrandColorProps {
   size?: 'sm' | 'md';
   className?: string;
 }
 
 /**
  * PulseDot - Animated pulse dot với primary color
  */
 export const PulseDot: React.FC<PulseDotProps> = ({ 
   brandColor, 
   size = 'md', 
   className = '' 
 }) => {
   const sizeClasses = {
     sm: 'w-1.5 h-1.5',
     md: 'w-2 h-2'
   };
   
   return (
     <span 
       className={`${sizeClasses[size]} rounded-full animate-pulse ${className}`}
       style={{ backgroundColor: brandColor }} 
     />
   );
 };

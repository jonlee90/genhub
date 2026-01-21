import type { Config } from "tailwindcss";

// Utility function for Aceternity UI - Flatten color palette
function flattenColorPalette(colors: Record<string, any>): Record<string, string> {
  const result: Record<string, string> = {};

  function flatten(obj: any, prefix = '') {
    for (const key in obj) {
      const value = obj[key];
      const newKey = prefix ? `${prefix}-${key}` : key;

      if (typeof value === 'string') {
        result[newKey] = value;
      } else if (typeof value === 'object') {
        flatten(value, newKey);
      }
    }
  }

  flatten(colors);
  return result;
}

export default {
  darkMode: 'class',
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  // Safelist dynamic classes used in project-card-themes.ts
  safelist: [
    // Project type header backgrounds
    'bg-teal-600',
    'bg-slate-800',
    'bg-construction-blue',
    'bg-construction-accent',
    // Project type icon backgrounds
    'bg-white/10',
    'bg-yellow-400/20',
    'bg-cyan-400/20',
    // Project type accent colors
    'text-blue-200',
    'text-yellow-400',
    'text-teal-200',
    'text-cyan-400',
    // Project type border accents
    'border-t-construction-blue',
    'border-t-construction-accent',
    'border-t-teal-600',
    'border-t-slate-800',
    // Project type gradients
    'from-blue-600',
    'to-blue-800',
    'from-gray-600',
    'to-gray-800',
    'from-teal-600',
    'to-teal-800',
    'from-slate-700',
    'to-slate-900',
  ],
  theme: {
    extend: {
      screens: {
        'sm': '480px',   // Mobile portrait
        'md': '768px',   // Tablet
        'lg': '1024px',  // Desktop
        'xl': '1280px',  // Large desktop
      },
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        // Construction theme colors
        construction: {
          accent: "var(--construction-accent)",
          accentLight: "var(--construction-accent-light)",
          yellow: "var(--construction-yellow)",
          blue: "var(--construction-blue)",
          green: "var(--construction-green)",
          red: "var(--construction-red)",
          gray: "var(--construction-gray)",
          'gray-light': "var(--construction-accent-light)",
        },
        status: {
          onTrack: "var(--status-on-track)",
          atRisk: "var(--status-at-risk)",
          delayed: "var(--status-delayed)",
          completed: "var(--status-completed)",
        },
      },
      // Aceternity UI animations
      animation: {
        'tilt': 'tilt 10s infinite linear',
        'fade-in': 'fadeIn 0.5s ease-out',
        'slide-up': 'slideUp 0.5s ease-out',
        'slide-down': 'slideDown 0.5s ease-out',
        'slide-in-left': 'slideInLeft 0.3s ease-out',
        'slide-in-right': 'slideInRight 0.3s ease-out',
        'glow-pulse': 'glowPulse 2s ease-in-out infinite',
        'shimmer': 'shimmer 2s linear infinite',
        'float': 'float 3s ease-in-out infinite',
        'spin-slow': 'spin 3s linear infinite',
        'bounce-slow': 'bounce 2s infinite',
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        // Gantt chart optimized animations (CSS-based, replaces Framer Motion)
        'pulse-opacity': 'pulseOpacity 2s ease-in-out infinite',
        'draw-line': 'drawLine 0.8s ease-in-out forwards',
        'scale-in': 'scaleIn 0.2s ease-out forwards',
      },
      // Aceternity UI keyframes
      keyframes: {
        tilt: {
          '0%, 50%, 100%': { transform: 'rotate(0deg)' },
          '25%': { transform: 'rotate(1deg)' },
          '75%': { transform: 'rotate(-1deg)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideInLeft: {
          '0%': { transform: 'translateX(-100%)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        slideInRight: {
          '0%': { transform: 'translateX(100%)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        glowPulse: {
          '0%, 100%': { boxShadow: '0 0 5px rgba(0, 27, 81, 0.5)' },
          '50%': { boxShadow: '0 0 20px rgba(0, 27, 81, 0.8), 0 0 30px rgba(0, 27, 81, 0.6)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-1000px 0' },
          '100%': { backgroundPosition: '1000px 0' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
        // Gantt chart optimized keyframes (CSS-based, replaces Framer Motion)
        pulseOpacity: {
          '0%, 100%': { opacity: '0.5' },
          '50%': { opacity: '1' },
        },
        drawLine: {
          '0%': { strokeDashoffset: '1000', opacity: '0' },
          '100%': { strokeDashoffset: '0', opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scaleX(0)', opacity: '0' },
          '100%': { transform: 'scaleX(1)', opacity: '1' },
        },
      },
      // Backdrop blur utilities
      backdropBlur: {
        xs: '2px',
        'construction': '8px',
      },
      // Box shadows for depth (Aceternity UI style)
      boxShadow: {
        'construction': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 27, 81, 0.06)',
        'construction-lg': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 27, 81, 0.05)',
        'construction-xl': '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 27, 81, 0.04)',
        'glow': '0 0 15px rgba(0, 27, 81, 0.5)',
        'glow-lg': '0 0 30px rgba(0, 27, 81, 0.6)',
        'inner-glow': 'inset 0 0 10px rgba(0, 27, 81, 0.3)',
      },
    },
  },
  plugins: [
    // Custom plugin for hiding scrollbars
    function({ addUtilities }: any) {
      addUtilities({
        '.scrollbar-hide': {
          /* IE and Edge */
          '-ms-overflow-style': 'none',
          /* Firefox */
          'scrollbar-width': 'none',
          /* Safari and Chrome */
          '&::-webkit-scrollbar': {
            display: 'none'
          }
        }
      })
    }
  ],
} satisfies Config;

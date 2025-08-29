/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./shared-components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    // Mobile-first breakpoints (default Tailwind)
    screens: {
      'sm': '640px',
      'md': '768px', 
      'lg': '1024px',
      'xl': '1280px',
      '2xl': '1536px',
    },
    extend: {
      colors: {
        primary: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
        },
      },
      // Mobile-optimized spacing
      spacing: {
        'touch': '44px', // Minimum touch target
        'touch-lg': '48px', // Optimal touch target
      },
      // Mobile-optimized font sizes
      fontSize: {
        'xs-mobile': '0.75rem',
        'sm-mobile': '0.875rem',
        'base-mobile': '1rem',
        'lg-mobile': '1.125rem',
      },
      // Mobile-optimized animations  
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-in-mobile': 'slideInMobile 0.3s ease-out',
        'bounce-gentle': 'bounceGentle 0.6s ease-in-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideInMobile: {
          '0%': { transform: 'translateX(-100%)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        bounceGentle: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-4px)' },
        },
      },
      // Mobile-optimized transitions
      transitionDuration: {
        '250': '250ms',
        '400': '400ms',
      },
    },
  },
  // Mobile-first utilities
  plugins: [
    function({ addUtilities, _theme }) {
      const newUtilities = {
        // Touch-friendly utilities
        '.touch-manipulation': {
          touchAction: 'manipulation',
        },
        '.tap-highlight-none': {
          '-webkit-tap-highlight-color': 'transparent',
        },
        // Mobile-safe font sizing (prevents zoom on iOS)
        '.input-mobile-safe': {
          fontSize: '16px',
          '@screen sm': {
            fontSize: '14px',
          },
        },
        // Container queries for mobile
        '.container-mobile': {
          width: '100%',
          paddingLeft: '0.75rem',
          paddingRight: '0.75rem',
          '@screen sm': {
            paddingLeft: '1rem',
            paddingRight: '1rem',
          },
          '@screen lg': {
            paddingLeft: '1.5rem',
            paddingRight: '1.5rem',
          },
        },
      };
      addUtilities(newUtilities);
    }
  ],
}
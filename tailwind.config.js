/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/**/*.{astro,html,js,jsx,ts,tsx}',
    './public/**/*.html'
  ],
  theme: {
    extend: {
      colors: {
        primary: 'var(--primary)',
        'primary-dark': 'var(--primary-dark)',
        secondary: 'var(--secondary)',
        light: 'var(--light)',
        'light-gray': 'var(--light-gray)',
        dark: 'var(--dark)',
        gray: 'var(--gray)'
      },
      borderRadius: {
        DEFAULT: 'var(--border-radius)'
      },
      boxShadow: {
        DEFAULT: 'var(--box-shadow)',
        md: 'var(--box-shadow)'
      }
    }
  },
  plugins: []
}
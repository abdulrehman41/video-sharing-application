// @type {import('tailwindcss').Config}

export default {
  content: [
    './index.html',
    './src/**/*.{js,jsx}'
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif']
      },
      colors: {
        brand: {
          50: '#eef7ff', 100: '#d9ecff', 500: '#3b82f6', 600: '#2563eb'
        }
      }
    }
  },
  plugins: []
}
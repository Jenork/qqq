import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        ink: '#0a0f1f',
        steel: '#263046',
        ember: '#ff6b3d',
        acid: '#c6ff6b',
        blood: '#ff4d6d',
        fog: '#dae3f3',
      },
      boxShadow: {
        panel: '0 16px 40px rgba(3, 7, 18, 0.35)',
      },
      backgroundImage: {
        'doom-grid':
          'radial-gradient(circle at center, rgba(53,215,255,0.16) 0, rgba(53,215,255,0) 44%), linear-gradient(180deg, rgba(3,10,22,0.9), rgba(2,7,15,0.98))',
      },
    },
  },
  plugins: [],
}

export default config

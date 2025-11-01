/** @type {import('tailwindcss').Config} */
import colors from "tailwindcss/colors";
module.exports = {
  darkMode: ["class"],
  content: [
    "./src/**/*.{js,ts,jsx,tsx}", // Simplified content path
  ],
  prefix: "",
  theme: {
  	container: {
  		center: true,
  		padding: '2rem',
  		screens: {
  			'2xl': '1400px'
  		}
  	},
  	extend: {
  		backgroundImage: {
  			'section-gradient': 'linear-gradient(135deg, rgba(0, 74, 124, 0.85) 0%, rgba(0, 121, 191, 0.85) 100%)',
  			'cta-gradient': 'linear-gradient(135deg, rgba(0, 98, 155, 0.9) 0%, rgba(0, 86, 145, 0.9) 100%)',
  			// 'hero-bg': 'linear-gradient(135deg, rgba(0, 74, 124, 0.85) 0%, rgba(0, 121, 191, 0.85) 100%), url('/imgs/vHub_background.png')',
  			// 'cta-bg': 'linear-gradient(135deg, rgba(0, 98, 155, 0.9) 0%, rgba(0, 86, 145, 0.9) 100%), url('/imgs/vHub_background.png')'
  		}, 
  		keyframes: {
  			'lift-up': {
  				'0%': {
  					transform: 'translateY(0)'
  				},
  				'100%': {
  					transform: 'translateY(-8px)'
  				}
  			}
  		},
  		animation: {
  			'lift-up': 'lift-up 0.3s ease-out forwards'
  		},
  		colors: {
  			border: 'hsl(var(--border))',
  			input: 'hsl(var(--input))',
  			ring: 'hsl(var(--ring))',
  			background: 'hsl(var(--background))',
  			foreground: 'hsl(var(--foreground))',
  			'bosch-black': '#000000',
  			'bosch-white': '#ffffff',
  			'bosch-red': '#ed0007',
  			'bosch-red-95': '#ffecec',
  			'bosch-red-50': '#ed0007',
  			'bosch-yellow-05': '#171000',
  			primary: {
  				'50': '#007bc0',
  				'950': '#003e64',
  				DEFAULT: 'hsl(var(--primary))',
  				foreground: 'hsl(var(--primary-foreground))'
  			},
  			secondary: {
  				DEFAULT: 'hsl(var(--secondary))',
  				foreground: 'hsl(var(--secondary-foreground))'
  			},
  			accent: {
  				DEFAULT: 'hsl(var(--accent))',
  				foreground: 'hsl(var(--accent-foreground))'
  			},
  			destructive: {
  				DEFAULT: 'hsl(var(--destructive))',
  				foreground: 'hsl(var(--destructive-foreground))'
  			},
  			card: {
  				DEFAULT: 'hsl(var(--card))',
  				foreground: 'hsl(var(--card-foreground))'
  			},
  			popover: {
  				DEFAULT: 'hsl(var(--popover))',
  				foreground: 'hsl(var(--popover-foreground))'
  			},
  			muted: {
  				DEFAULT: 'hsl(var(--muted))',
  				foreground: 'hsl(var(--muted-foreground))'
  			},
  			chart: {
  				'1': 'hsl(var(--chart-1))',
  				'2': 'hsl(var(--chart-2))',
  				'3': 'hsl(var(--chart-3))',
  				'4': 'hsl(var(--chart-4))',
  				'5': 'hsl(var(--chart-5))'
  			}
  		},
  		maxHeight: {
  			xs: '20rem',
  			sm: '24rem',
  			md: '28rem',
  			lg: '32rem',
  			xl: '36rem'
  		},
  		boxShadow: {
  			small: '0 0 1px rgba(54, 61, 73, 0.7)',
  			medium: '0 0 4px rgba(54, 61, 73, 0.333)',
  			large: '0 0 8px rgba(54, 61, 73, 0.2)'
  		},
  		borderRadius: {
  			lg: 'var(--radius)',
  			md: 'calc(var(--radius) - 2px)',
  			sm: 'calc(var(--radius) - 4px)'
  		}
  	}
  },
  plugins: [require("tailwindcss-animate")],
};
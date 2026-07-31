import type { Config } from 'tailwindcss';
import tailwindcssAnimate from 'tailwindcss-animate';

export default {
	darkMode: ['class'],
	content: ['./index.html', './src/**/*.{ts,tsx}'],
	prefix: '',
	theme: {
		container: {
			center: true,
			padding: '2rem',
			screens: {
				'2xl': '1440px',
			},
		},
		extend: {
			// `xs` was referenced across the codebase but never defined, so every
			// xs:* class silently did nothing. Defining it makes those work.
			screens: {
				xs: '480px',
				'3xl': '1920px',
			},
			fontFamily: {
				display: ['var(--font-display)'],
				sans: ['var(--font-sans)'],
				mono: ['var(--font-mono)'],
			},
			colors: {
				border: 'hsl(var(--border))',
				input: 'hsl(var(--input))',
				ring: 'hsl(var(--ring))',
				background: 'hsl(var(--background))',
				foreground: 'hsl(var(--foreground))',
				surface: 'hsl(var(--surface))',
				elevated: 'hsl(var(--elevated))',
				primary: {
					DEFAULT: 'hsl(var(--primary))',
					hi: 'hsl(var(--primary-hi))',
					foreground: 'hsl(var(--primary-foreground))',
				},
				secondary: {
					DEFAULT: 'hsl(var(--secondary))',
					foreground: 'hsl(var(--secondary-foreground))',
				},
				destructive: {
					DEFAULT: 'hsl(var(--destructive))',
					foreground: 'hsl(var(--destructive-foreground))',
				},
				muted: {
					DEFAULT: 'hsl(var(--muted))',
					foreground: 'hsl(var(--muted-foreground))',
				},
				// Quiet — shadcn/ui hover and selected-row background.
				accent: {
					DEFAULT: 'hsl(var(--accent))',
					foreground: 'hsl(var(--accent-foreground))',
				},
				// Vivid lime, decorative only. Named `signal` rather than `lime`
				// so it doesn't shadow Tailwind's built-in lime scale.
				signal: 'hsl(var(--signal))',
				popover: {
					DEFAULT: 'hsl(var(--popover))',
					foreground: 'hsl(var(--popover-foreground))',
				},
				card: {
					DEFAULT: 'hsl(var(--card))',
					foreground: 'hsl(var(--card-foreground))',
				},
			},
			borderRadius: {
				lg: 'var(--radius)',
				md: 'calc(var(--radius) - 2px)',
				sm: 'calc(var(--radius) - 4px)',
			},
			transitionTimingFunction: {
				'out-expo': 'cubic-bezier(0.16, 1, 0.3, 1)',
			},
			keyframes: {
				'accordion-down': {
					from: { height: '0' },
					to: { height: 'var(--radix-accordion-content-height)' },
				},
				'accordion-up': {
					from: { height: 'var(--radix-accordion-content-height)' },
					to: { height: '0' },
				},
				marquee: {
					from: { transform: 'translateX(0)' },
					to: { transform: 'translateX(-50%)' },
				},
				'marquee-reverse': {
					from: { transform: 'translateX(-50%)' },
					to: { transform: 'translateX(0)' },
				},
				shimmer: {
					'100%': { transform: 'translateX(100%)' },
				},
				aurora: {
					'0%, 100%': { transform: 'translate3d(0,0,0) scale(1)' },
					'33%': { transform: 'translate3d(4%,-6%,0) scale(1.08)' },
					'66%': { transform: 'translate3d(-4%,4%,0) scale(0.94)' },
				},
				'pulse-ring': {
					'0%': { transform: 'scale(0.9)', opacity: '0.7' },
					'100%': { transform: 'scale(1.8)', opacity: '0' },
				},
				'caret-blink': {
					'0%, 100%': { opacity: '1' },
					'50%': { opacity: '0' },
				},
			},
			animation: {
				'accordion-down': 'accordion-down 0.2s ease-out',
				'accordion-up': 'accordion-up 0.2s ease-out',
				marquee: 'marquee var(--marquee-duration, 40s) linear infinite',
				'marquee-reverse': 'marquee-reverse var(--marquee-duration, 40s) linear infinite',
				shimmer: 'shimmer 2.5s infinite',
				aurora: 'aurora 18s ease-in-out infinite',
				'pulse-ring': 'pulse-ring 2.4s ease-out infinite',
				'caret-blink': 'caret-blink 1.1s step-end infinite',
			},
		},
	},
	plugins: [tailwindcssAnimate],
} satisfies Config;

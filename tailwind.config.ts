
import type { Config } from "tailwindcss";

export default {
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        dilq: {
          blue: "#3c627c",
          dark: "#222222",
          accent: "#8B5CF6", /* Updated to more vibrant purple */
          purple: "#7e69ab",
          glow: "#8A2BE2",
          teal: "#20B2AA",
          darkblue: "#1A1F2C",
          darkpurple: "#221F26",
          lightpurple: "#E5DEFF",
          vibrant: "#8B5CF6",
          indigo: "#6366F1",
          pink: "#EC4899",
          darkgray: "#333333",
          charcoal: "#403E43",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "pulse-subtle": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.8" },
        },
        "float": {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-5px)" },
        },
        "shimmer": {
          "0%": { backgroundPosition: "-500px 0" },
          "100%": { backgroundPosition: "500px 0" },
        },
        "fade-in": {
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "scale-in": {
          "0%": { transform: "scale(0.95)", opacity: "0" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
        "slide-in-right": {
          "0%": { transform: "translateX(100%)" },
          "100%": { transform: "translateX(0)" },
        },
        "glow-pulse": {
          "0%, 100%": { boxShadow: "0 0 5px rgba(139, 92, 246, 0.5)" },
          "50%": { boxShadow: "0 0 20px rgba(139, 92, 246, 0.8)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "pulse-subtle": "pulse-subtle 3s ease-in-out infinite",
        "float": "float 3s ease-in-out infinite",
        "shimmer": "shimmer 2s infinite linear",
        "fade-in": "fade-in 0.3s ease-out",
        "scale-in": "scale-in 0.2s ease-out",
        "slide-in-right": "slide-in-right 0.3s ease-out",
        "glow-pulse": "glow-pulse 2s infinite",
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic": "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
        "glass-gradient": "linear-gradient(to right bottom, rgba(255, 255, 255, 0.05), rgba(255, 255, 255, 0.1))",
        "glass-shine": "linear-gradient(135deg, rgba(255, 255, 255, 0) 0%, rgba(255, 255, 255, 0.1) 100%)",
        "futuristic-gradient": "linear-gradient(90deg, hsla(277, 75%, 84%, 1) 0%, hsla(297, 50%, 51%, 1) 100%)",
        "purple-gradient": "linear-gradient(90deg, #6366F1 0%, #8B5CF6 100%)",
        "indigo-gradient": "linear-gradient(90deg, #4F46E5 0%, #6366F1 100%)",
        "blue-purple-gradient": "linear-gradient(90deg, #3B82F6 0%, #8B5CF6 100%)",
        "cyan-blue-gradient": "linear-gradient(90deg, #06B6D4 0%, #3B82F6 100%)",
        "teal-cyan-gradient": "linear-gradient(90deg, #14B8A6 0%, #06B6D4 100%)",
        "green-teal-gradient": "linear-gradient(90deg, #10B981 0%, #14B8A6 100%)",
        "lime-green-gradient": "linear-gradient(90deg, #84CC16 0%, #10B981 100%)",
        "amber-lime-gradient": "linear-gradient(90deg, #F59E0B 0%, #84CC16 100%)",
        "orange-amber-gradient": "linear-gradient(90deg, #F97316 0%, #F59E0B 100%)",
        "red-orange-gradient": "linear-gradient(90deg, #EF4444 0%, #F97316 100%)",
        "rose-red-gradient": "linear-gradient(90deg, #F43F5E 0%, #EF4444 100%)",
        "pink-rose-gradient": "linear-gradient(90deg, #EC4899 0%, #F43F5E 100%)",
        "fuchsia-pink-gradient": "linear-gradient(90deg, #D946EF 0%, #EC4899 100%)",
        "purple-fuchsia-gradient": "linear-gradient(90deg, #8B5CF6 0%, #D946EF 100%)",
      },
      boxShadow: {
        "neon": "0 0 5px theme('colors.dilq.glow'), 0 0 20px theme('colors.dilq.glow')",
        "glass": "0 4px 30px rgba(0, 0, 0, 0.1)",
        "inner-light": "inset 0 1px 1px 0 rgba(255, 255, 255, 0.1)",
        "inner-dark": "inset 0 1px 3px 0 rgba(0, 0, 0, 0.3)",
        "card-hover": "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)",
        "soft": "0 2px 10px rgba(0, 0, 0, 0.05)",
        "neo-dark": "0 4px 20px 0 rgba(0, 0, 0, 0.3)",
        "glassmorphism": "0 8px 32px 0 rgba(31, 38, 135, 0.37)",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;

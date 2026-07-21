import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      keyframes: {
        fadeInUp: {
          "0%": { opacity: "0", transform: "translateY(16px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        floatSlow: {
          "0%, 100%": { transform: "translateY(0) translateX(0)" },
          "50%": { transform: "translateY(-16px) translateX(8px)" },
        },
        glowPulse: {
          "0%, 100%": { opacity: "0.5" },
          "50%": { opacity: "0.9" },
        },
      },
      animation: {
        "fade-in-up": "fadeInUp 0.7s ease-out both",
        "float-slow": "floatSlow 8s ease-in-out infinite",
        "float-slower": "floatSlow 11s ease-in-out infinite",
        "glow-pulse": "glowPulse 6s ease-in-out infinite",
      },
    },
  },
  plugins: [],
} satisfies Config;

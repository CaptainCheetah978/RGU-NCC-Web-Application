import type { Config } from "tailwindcss";

const config: Config = {
    content: [
        "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
        extend: {
            colors: {
                primary: {
                    DEFAULT: "#1D2951", // Deep Blue
                    foreground: "#FFFFFF",
                },
                secondary: {
                    DEFAULT: "#E31837", // NCC Red
                    foreground: "#FFFFFF",
                },
                accent: {
                    gold: "#FFD700", // NCC Gold
                    orange: "#F05523", // RGU Orange
                },
                tertiary: "#4B92DB", // Light Blue
                background: "#F3F4F6", // Light Gray
                surface: "#FFFFFF",
            },
            fontFamily: {
                sans: ["var(--font-inter)", "sans-serif"],
            },
            backgroundImage: {
                "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
                "gradient-conic":
                    "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
            },
        },
    },
    plugins: [],
};
export default config;

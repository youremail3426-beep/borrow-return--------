/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                primary: '#0F5132', // Dark Green (SMO FTE)
                secondary: '#198754', // Green
            }
        },
    },
    plugins: [],
}

/** Jayakumar Bearings – Tailwind theme (brand colours from the original design) */
module.exports = {
  content: ["./*.html", "./js/**/*.js", "./_dev/*.py"],
  theme: {
    extend: {
      fontFamily: { sans: ["Inter", "ui-sans-serif", "system-ui", "-apple-system", "Segoe UI", "Roboto", "sans-serif"] },
      colors: {
        brand: { DEFAULT: "#FF6A00", dark: "#E25A00", ink: "#C24800", soft: "#FFE7D2", cream: "#FFF5EC", ember: "#FF4500" },
        ink: "#111111",
        gold: { DEFAULT: "#F5B942", light: "#FFD979", pale: "#FFF3C4" },
      },
      boxShadow: { card: "0 10px 30px -14px rgba(17,17,17,.22)", glow: "0 20px 50px -15px rgba(255,106,0,.5)" },
      maxWidth: { site: "1480px" },
    },
  },
  plugins: [],
};

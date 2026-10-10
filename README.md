# Jayakumar Bearings – Website

## திறப்பது எப்படி
`index.html` கோப்பை double-click செய்தால் போதும். இன்டர்நெட் இல்லாமலும் வேலை செய்யும் (Map மட்டும் இணையம் வேண்டும்).

## பக்கங்கள்
index.html (Home) · about.html · products.html · bearing-finder.html · brands.html · industries.html · contact.html · resources.html (தற்போது காலி) · 404.html

## Hosting செய்ய
இந்த folder-இல் உள்ள கோப்புகளை (`_dev`, `node_modules`, `package*.json`, `tailwind.config.js` தவிர) அப்படியே hosting-இல் upload செய்யுங்கள்.
Domain வந்ததும் social-share படம் சரியாக வர:  `SITE_URL=https://yourdomain.in python3 _dev/build.py`

## மாற்றம் செய்ய
- எழுத்து / தொலைபேசி எண் / products: `_dev/data.py` → `python3 _dev/build.py`
- பக்க அமைப்பு: `_dev/pages.py`, `_dev/common.py`
- Effects (tilt, golden ring, zoom): `css/effects.css`, `js/site.js` (நேரடியாக திருத்தலாம்)
- Tailwind class மாற்றினால்: `npm install` (ஒருமுறை) → `npm run build`

## செய்ய வேண்டியவை
- Footer social icons (`href="#"`) → உங்கள் Facebook / LinkedIn / X / Instagram முகவரி
- Privacy Policy / Terms / Warranty பக்கங்கள்
- Resources பக்கம் (நீங்கள் சொன்னதும்)
- resources.html-இல் உள்ள `noindex` நீக்க வேண்டும் (உள்ளடக்கம் வந்ததும்)

## Quick Order & Cart (order.html)
- Price list: `js/catalog.js` (compressed from the Bearing Finder data). To update prices, re-run the extraction against the new Finder file.
- Discount: `disc:35` in `_dev/pages.py` (`JKB_ORDER`) — change and run `python3 _dev/build.py`. GST (18%) is shown as "extra", not added.
- Orders open WhatsApp (96597 64000) with the cart text; customer's cart is saved in their browser only.

const fs = require('fs');
const path = require('path');

const targetDir = path.join(__dirname, '..', 'public', 'images');
if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
}

// Helper to write SVG
function saveSvg(fileName, content) {
  fs.writeFileSync(path.join(targetDir, fileName), content.trim(), 'utf-8');
  console.log(`Generated: ${fileName}`);
}

// 1. Logo SVG
saveSvg('logo.svg', `
<svg width="240" height="50" viewBox="0 0 240 50" fill="none" xmlns="http://www.w3.org/2000/svg">
  <!-- Glasses Icon -->
  <g transform="translate(4, 6)">
    <circle cx="16" cy="19" r="14" stroke="#000" stroke-width="3.5" fill="none"/>
    <circle cx="48" cy="19" r="14" stroke="#000" stroke-width="3.5" fill="none"/>
    <path d="M30 15 Q32 12 34 15" stroke="#000" stroke-width="3" fill="none" stroke-linecap="round"/>
    <path d="M2 19 H0 M62 19 H64" stroke="#000" stroke-width="3" stroke-linecap="round"/>
    <!-- Glare reflection -->
    <path d="M9 13 Q16 11 20 18" stroke="#D4AF37" stroke-width="2" stroke-linecap="round" fill="none"/>
    <path d="M41 13 Q48 11 52 18" stroke="#D4AF37" stroke-width="2" stroke-linecap="round" fill="none"/>
    <circle cx="32" cy="14" r="2" fill="#D4AF37"/>
  </g>
  <!-- Wordmark -->
  <text x="74" y="27" font-family="'Integral CF', 'Montserrat', 'Inter', sans-serif" font-weight="900" font-size="20" letter-spacing="1" fill="#000">OPTICS<tspan fill="#D4AF37">KHAN</tspan></text>
  <text x="75" y="39" font-family="'Inter', sans-serif" font-weight="600" font-size="8" letter-spacing="3" fill="#666">HAUTE OPTICAL ATELIER</text>
</svg>
`);

// 2. Aviator Gold SVG
saveSvg('aviator-gold.svg', `
<svg width="600" height="420" viewBox="0 0 600 420" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="goldRim" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FFF2A3"/>
      <stop offset="35%" stop-color="#D4AF37"/>
      <stop offset="70%" stop-color="#AA771C"/>
      <stop offset="100%" stop-color="#FFDF73"/>
    </linearGradient>
    <linearGradient id="amberLens" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#7B4A12" stop-opacity="0.85"/>
      <stop offset="60%" stop-color="#C68642" stop-opacity="0.65"/>
      <stop offset="100%" stop-color="#E5A65E" stop-opacity="0.4"/>
    </linearGradient>
    <linearGradient id="lensGlare" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="0.4"/>
      <stop offset="50%" stop-color="#ffffff" stop-opacity="0.05"/>
      <stop offset="100%" stop-color="#ffffff" stop-opacity="0"/>
    </linearGradient>
    <filter id="softShadow" x="-10%" y="-10%" width="120%" height="130%" filterUnits="userSpaceOnUse">
      <feDropShadow dx="0" dy="18" stdDeviation="22" flood-color="#000" flood-opacity="0.16"/>
    </filter>
  </defs>

  <!-- Background subtle vignette circle -->
  <circle cx="300" cy="210" r="180" fill="#f8f9fa"/>

  <g filter="url(#softShadow)">
    <!-- Left Aviator Lens -->
    <path d="M120 160 C120 135 170 130 235 135 C270 138 275 165 270 215 C265 265 220 285 180 285 C135 285 120 230 120 160 Z" fill="url(#amberLens)" stroke="url(#goldRim)" stroke-width="6"/>
    <path d="M140 155 C160 145 200 145 240 152 C210 200 170 240 145 260 C135 220 135 180 140 155 Z" fill="url(#lensGlare)"/>

    <!-- Right Aviator Lens -->
    <path d="M480 160 C480 135 430 130 365 135 C330 138 325 165 330 215 C335 265 380 285 420 285 C465 285 480 230 480 160 Z" fill="url(#amberLens)" stroke="url(#goldRim)" stroke-width="6"/>
    <path d="M460 155 C440 145 400 145 360 152 C390 200 430 240 455 260 C465 220 465 180 460 155 Z" fill="url(#lensGlare)"/>

    <!-- Top Brow Bar -->
    <path d="M225 133 C265 125 335 125 375 133" stroke="url(#goldRim)" stroke-width="5" stroke-linecap="round"/>

    <!-- Bridge Arch -->
    <path d="M260 165 C280 152 320 152 340 165" stroke="url(#goldRim)" stroke-width="4.5" stroke-linecap="round"/>

    <!-- Left Temple Joint & Arm -->
    <path d="M120 155 L55 170 C45 172 38 180 35 190" stroke="url(#goldRim)" stroke-width="4.5" stroke-linecap="round"/>
    <rect x="30" y="185" width="22" height="6" rx="3" fill="#222"/>

    <!-- Right Temple Joint & Arm -->
    <path d="M480 155 L545 170 C555 172 562 180 565 190" stroke="url(#goldRim)" stroke-width="4.5" stroke-linecap="round"/>
    <rect x="548" y="185" width="22" height="6" rx="3" fill="#222"/>

    <!-- Nose Pads -->
    <ellipse cx="272" cy="188" rx="4" ry="9" fill="#e0e0e0" stroke="#bbb" stroke-width="1.5"/>
    <ellipse cx="328" cy="188" rx="4" ry="9" fill="#e0e0e0" stroke="#bbb" stroke-width="1.5"/>
  </g>
</svg>
`);

// 3. Aviator Black SVG
saveSvg('aviator-black.svg', `
<svg width="600" height="420" viewBox="0 0 600 420" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="blackRim" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#444"/>
      <stop offset="50%" stop-color="#111"/>
      <stop offset="100%" stop-color="#2a2a2a"/>
    </linearGradient>
    <linearGradient id="darkSmokeLens" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#1a1a1a" stop-opacity="0.95"/>
      <stop offset="70%" stop-color="#2b2b2b" stop-opacity="0.85"/>
      <stop offset="100%" stop-color="#3d3d3d" stop-opacity="0.75"/>
    </linearGradient>
    <filter id="softShadow2" x="-10%" y="-10%" width="120%" height="130%" filterUnits="userSpaceOnUse">
      <feDropShadow dx="0" dy="18" stdDeviation="22" flood-color="#000" flood-opacity="0.18"/>
    </filter>
  </defs>

  <circle cx="300" cy="210" r="180" fill="#f8f9fa"/>

  <g filter="url(#softShadow2)">
    <path d="M120 160 C120 135 170 130 235 135 C270 138 275 165 270 215 C265 265 220 285 180 285 C135 285 120 230 120 160 Z" fill="url(#darkSmokeLens)" stroke="url(#blackRim)" stroke-width="6"/>
    <path d="M480 160 C480 135 430 130 365 135 C330 138 325 165 330 215 C335 265 380 285 420 285 C465 285 480 230 480 160 Z" fill="url(#darkSmokeLens)" stroke="url(#blackRim)" stroke-width="6"/>

    <path d="M225 133 C265 125 335 125 375 133" stroke="url(#blackRim)" stroke-width="5" stroke-linecap="round"/>
    <path d="M260 165 C280 152 320 152 340 165" stroke="url(#blackRim)" stroke-width="4.5" stroke-linecap="round"/>

    <path d="M120 155 L55 170 C45 172 38 180 35 190" stroke="url(#blackRim)" stroke-width="4.5" stroke-linecap="round"/>
    <path d="M480 155 L545 170 C555 172 562 180 565 190" stroke="url(#blackRim)" stroke-width="4.5" stroke-linecap="round"/>

    <!-- Polarized badge mark -->
    <text x="210" y="155" font-family="sans-serif" font-size="8" font-weight="bold" fill="#888" letter-spacing="1">POLARIZED</text>
  </g>
</svg>
`);

// 4. Wayfarer Havana Acetate SVG
saveSvg('wayfarer-havana.svg', `
<svg width="600" height="420" viewBox="0 0 600 420" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <radialGradient id="tortoiseShell" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#b25d19"/>
      <stop offset="35%" stop-color="#69330a"/>
      <stop offset="70%" stop-color="#3d1d05"/>
      <stop offset="100%" stop-color="#190b02"/>
    </radialGradient>
    <linearGradient id="clearOpticLens" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#e8f4f8" stop-opacity="0.85"/>
      <stop offset="50%" stop-color="#d4edf4" stop-opacity="0.6"/>
      <stop offset="100%" stop-color="#f0faff" stop-opacity="0.8"/>
    </linearGradient>
    <filter id="wayfarerShadow">
      <feDropShadow dx="0" dy="18" stdDeviation="20" flood-color="#000" flood-opacity="0.14"/>
    </filter>
  </defs>

  <circle cx="300" cy="210" r="180" fill="#fcf8f5"/>

  <g filter="url(#wayfarerShadow)">
    <!-- Thick Outer Wayfarer Frame Chassis -->
    <path d="M85 130 C125 125 250 135 270 148 C280 154 288 154 298 148 C318 135 443 125 483 130 C505 133 505 160 495 190 C485 220 475 270 435 285 C395 300 335 295 320 240 C315 225 310 205 290 205 C270 205 265 225 260 240 C245 295 185 300 145 285 C105 270 95 220 85 190 C75 160 75 133 85 130 Z" fill="url(#tortoiseShell)"/>

    <!-- Left Lens Cutout -->
    <path d="M115 152 C150 145 235 150 248 162 C255 170 252 210 242 245 C230 270 185 278 152 268 C125 258 110 220 110 180 C110 160 112 153 115 152 Z" fill="url(#clearOpticLens)"/>
    <!-- Glare line -->
    <path d="M135 160 Q170 175 210 230" stroke="#ffffff" stroke-width="4" stroke-linecap="round" opacity="0.6"/>

    <!-- Right Lens Cutout -->
    <path d="M453 152 C418 145 333 150 320 162 C313 170 316 210 326 245 C338 270 383 278 416 268 C443 258 458 220 458 180 C458 160 456 153 453 152 Z" fill="url(#clearOpticLens)"/>
    <path d="M360 160 Q395 175 435 230" stroke="#ffffff" stroke-width="4" stroke-linecap="round" opacity="0.6"/>

    <!-- Silver Corner Rivets -->
    <ellipse cx="98" cy="142" rx="4" ry="2" transform="rotate(-15 98 142)" fill="#ddd" stroke="#999" stroke-width="0.5"/>
    <ellipse cx="470" cy="142" rx="4" ry="2" transform="rotate(15 470 142)" fill="#ddd" stroke="#999" stroke-width="0.5"/>
  </g>
</svg>
`);

// 5. Wayfarer Black SVG
saveSvg('wayfarer-black.svg', `
<svg width="600" height="420" viewBox="0 0 600 420" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="glossBlack" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#333"/>
      <stop offset="50%" stop-color="#0a0a0a"/>
      <stop offset="100%" stop-color="#1f1f1f"/>
    </linearGradient>
    <linearGradient id="clearOpticLens2" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#eaf3f7" stop-opacity="0.85"/>
      <stop offset="100%" stop-color="#d6e8f2" stop-opacity="0.7"/>
    </linearGradient>
  </defs>
  <circle cx="300" cy="210" r="180" fill="#f8f9fa"/>
  <g>
    <path d="M85 130 C125 125 250 135 270 148 C280 154 288 154 298 148 C318 135 443 125 483 130 C505 133 505 160 495 190 C485 220 475 270 435 285 C395 300 335 295 320 240 C315 225 310 205 290 205 C270 205 265 225 260 240 C245 295 185 300 145 285 C105 270 95 220 85 190 C75 160 75 133 85 130 Z" fill="url(#glossBlack)"/>
    <path d="M115 152 C150 145 235 150 248 162 C255 170 252 210 242 245 C230 270 185 278 152 268 C125 258 110 220 110 180 C110 160 112 153 115 152 Z" fill="url(#clearOpticLens2)"/>
    <path d="M453 152 C418 145 333 150 320 162 C313 170 316 210 326 245 C338 270 383 278 416 268 C443 258 458 220 458 180 C458 160 456 153 453 152 Z" fill="url(#clearOpticLens2)"/>
    <ellipse cx="98" cy="142" rx="4" ry="2" transform="rotate(-15 98 142)" fill="#D4AF37"/>
    <ellipse cx="470" cy="142" rx="4" ry="2" transform="rotate(15 470 142)" fill="#D4AF37"/>
  </g>
</svg>
`);

// 6. BlueShield Pro Gamer SVG
saveSvg('blueshield-pro.svg', `
<svg width="600" height="420" viewBox="0 0 600 420" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="cyberFrame" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#1E293B"/>
      <stop offset="100%" stop-color="#0F172A"/>
    </linearGradient>
    <linearGradient id="blueGlowLens" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#38BDF8" stop-opacity="0.35"/>
      <stop offset="50%" stop-color="#818CF8" stop-opacity="0.2"/>
      <stop offset="100%" stop-color="#C084FC" stop-opacity="0.1"/>
    </linearGradient>
  </defs>
  <circle cx="300" cy="210" r="180" fill="#f0f7ff"/>
  <g>
    <!-- Modern rectangular frame -->
    <rect x="95" y="140" width="175" height="125" rx="20" fill="url(#blueGlowLens)" stroke="url(#cyberFrame)" stroke-width="9"/>
    <rect x="330" y="140" width="175" height="125" rx="20" fill="url(#blueGlowLens)" stroke="url(#cyberFrame)" stroke-width="9"/>
    <!-- Bridge -->
    <path d="M270 180 C290 172 310 172 330 180" stroke="url(#cyberFrame)" stroke-width="8" stroke-linecap="round"/>
    <!-- Temples -->
    <path d="M95 165 L35 175" stroke="url(#cyberFrame)" stroke-width="8" stroke-linecap="round"/>
    <path d="M505 165 L565 175" stroke="url(#cyberFrame)" stroke-width="8" stroke-linecap="round"/>
    <!-- Blue light reflection laser badge -->
    <path d="M125 165 L215 165" stroke="#38BDF8" stroke-width="2" stroke-dasharray="4 4" opacity="0.8"/>
    <circle cx="125" cy="165" r="4" fill="#38BDF8"/>
    <text x="135" y="240" font-family="'Inter', sans-serif" font-size="10" font-weight="bold" fill="#0284C7">420nm BLUE FILTER</text>
    <text x="365" y="240" font-family="'Inter', sans-serif" font-size="10" font-weight="bold" fill="#0284C7">ANTI-FATIGUE HD</text>
  </g>
</svg>
`);

// 7. Vogue Cat-Eye Rose Noir SVG
saveSvg('cateye-rose.svg', `
<svg width="600" height="420" viewBox="0 0 600 420" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="roseGold" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#F5D0C5"/>
      <stop offset="50%" stop-color="#C57D71"/>
      <stop offset="100%" stop-color="#8F4338"/>
    </linearGradient>
    <linearGradient id="noirGradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#2D1A22"/>
      <stop offset="100%" stop-color="#120A0E"/>
    </linearGradient>
  </defs>
  <circle cx="300" cy="210" r="180" fill="#fff5f5"/>
  <g>
    <!-- Uplifted Cat-Eye silhouette Left -->
    <path d="M80 120 C140 125 240 145 260 165 C270 210 240 270 185 275 C125 280 95 210 90 175 C85 140 70 125 80 120 Z" fill="#fff" stroke="url(#noirGradient)" stroke-width="8"/>
    <!-- Uplifted Cat-Eye silhouette Right -->
    <path d="M520 120 C460 125 360 145 340 165 C330 210 360 270 415 275 C475 280 505 210 510 175 C515 140 530 125 520 120 Z" fill="#fff" stroke="url(#noirGradient)" stroke-width="8"/>
    <!-- Rose gold corner sweep wings -->
    <path d="M72 120 Q120 120 140 125" stroke="url(#roseGold)" stroke-width="7" stroke-linecap="round"/>
    <path d="M528 120 Q480 120 460 125" stroke="url(#roseGold)" stroke-width="7" stroke-linecap="round"/>
    <!-- Delicate Rose Gold Bridge -->
    <path d="M260 175 C280 160 320 160 340 175" stroke="url(#roseGold)" stroke-width="4.5" stroke-linecap="round"/>
  </g>
</svg>
`);

// 8. Vintage Round Titan Flex SVG
saveSvg('round-vintage.svg', `
<svg width="600" height="420" viewBox="0 0 600 420" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bronzeTitan" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#E8C39E"/>
      <stop offset="50%" stop-color="#B87333"/>
      <stop offset="100%" stop-color="#6E3D15"/>
    </linearGradient>
  </defs>
  <circle cx="300" cy="210" r="180" fill="#faf7f2"/>
  <g>
    <!-- Perfectly circular left frame -->
    <circle cx="195" cy="210" r="72" fill="#f8fcff" stroke="url(#bronzeTitan)" stroke-width="5"/>
    <!-- Perfectly circular right frame -->
    <circle cx="405" cy="210" r="72" fill="#f8fcff" stroke="url(#bronzeTitan)" stroke-width="5"/>
    <!-- Keyhole Bridge Arch -->
    <path d="M267 210 C275 190 325 190 333 210" stroke="url(#bronzeTitan)" stroke-width="4.5" fill="none"/>
    <!-- Slender Beta-titanium Temples -->
    <path d="M123 210 L50 205" stroke="url(#bronzeTitan)" stroke-width="4" stroke-linecap="round"/>
    <path d="M477 210 L550 205" stroke="url(#bronzeTitan)" stroke-width="4" stroke-linecap="round"/>
  </g>
</svg>
`);

// 9. Executive Rimless Silhouette SVG
saveSvg('rimless-executive.svg', `
<svg width="600" height="420" viewBox="0 0 600 420" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="platinumSilver" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FFFFFF"/>
      <stop offset="50%" stop-color="#C0C0C0"/>
      <stop offset="100%" stop-color="#708090"/>
    </linearGradient>
  </defs>
  <circle cx="300" cy="210" r="180" fill="#f5f7fa"/>
  <g>
    <!-- Rimless Beveled Lenses (Edge only) -->
    <rect x="100" y="150" width="165" height="110" rx="14" fill="#eaf2f8" stroke="#a0c4e2" stroke-width="1.8" opacity="0.85"/>
    <rect x="335" y="150" width="165" height="110" rx="14" fill="#eaf2f8" stroke="#a0c4e2" stroke-width="1.8" opacity="0.85"/>
    <!-- Delicate Silver Mount Pins -->
    <circle cx="260" cy="200" r="3.5" fill="url(#platinumSilver)"/>
    <circle cx="340" cy="200" r="3.5" fill="url(#platinumSilver)"/>
    <!-- Sleek Bridge -->
    <path d="M260 200 C280 185 320 185 340 200" stroke="url(#platinumSilver)" stroke-width="3" stroke-linecap="round"/>
    <!-- Slim Hinge Brackets -->
    <path d="M100 200 L45 195" stroke="url(#platinumSilver)" stroke-width="3.5" stroke-linecap="round"/>
    <path d="M500 200 L555 195" stroke="url(#platinumSilver)" stroke-width="3.5" stroke-linecap="round"/>
    <text x="130" y="210" font-family="'Inter', sans-serif" font-size="9" font-weight="600" fill="#555" letter-spacing="1">TITANIUM RIMLESS</text>
  </g>
</svg>
`);

// 10. Clubmaster Retro SVG
saveSvg('clubmaster-retro.svg', `
<svg width="600" height="420" viewBox="0 0 600 420" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="goldWire" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FFDF73"/>
      <stop offset="100%" stop-color="#AA771C"/>
    </linearGradient>
  </defs>
  <circle cx="300" cy="210" r="180" fill="#fdfbf7"/>
  <g>
    <!-- Heavy Dark Browline Top Left -->
    <path d="M90 140 C140 135 240 140 260 160 L245 180 C230 170 140 165 105 170 Z" fill="#1a1a1a"/>
    <!-- Thin Golden Wire Lower Left -->
    <path d="M105 170 C110 240 160 270 205 270 C240 270 250 220 245 180" stroke="url(#goldWire)" stroke-width="3.5" fill="#f8fcff"/>

    <!-- Heavy Dark Browline Top Right -->
    <path d="M510 140 C460 135 360 140 340 160 L355 180 C370 170 460 165 495 170 Z" fill="#1a1a1a"/>
    <!-- Thin Golden Wire Lower Right -->
    <path d="M495 170 C490 240 440 270 395 270 C360 270 350 220 355 180" stroke="url(#goldWire)" stroke-width="3.5" fill="#f8fcff"/>

    <!-- Gold Bridge -->
    <path d="M260 165 C280 150 320 150 340 165" stroke="url(#goldWire)" stroke-width="5" stroke-linecap="round"/>
  </g>
</svg>
`);

// 11. Geometric Hexagon SVG
saveSvg('geometric-hexagon.svg', `
<svg width="600" height="420" viewBox="0 0 600 420" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="emeraldGold" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#059669"/>
      <stop offset="100%" stop-color="#047857"/>
    </linearGradient>
  </defs>
  <circle cx="300" cy="210" r="180" fill="#f0fdf4"/>
  <g>
    <!-- Hexagon left -->
    <polygon points="120,170 170,135 240,150 255,225 210,270 135,255" fill="url(#emeraldGold)" stroke="#D4AF37" stroke-width="4.5"/>
    <!-- Hexagon right -->
    <polygon points="480,170 430,135 360,150 345,225 390,270 465,255" fill="url(#emeraldGold)" stroke="#D4AF37" stroke-width="4.5"/>
    <path d="M245 175 C275 160 325 160 355 175" stroke="#D4AF37" stroke-width="4" stroke-linecap="round"/>
  </g>
</svg>
`);

// 12. Urban Minimalist Square SVG
saveSvg('urban-square.svg', `
<svg width="600" height="420" viewBox="0 0 600 420" fill="none" xmlns="http://www.w3.org/2000/svg">
  <circle cx="300" cy="210" r="180" fill="#f8fafc"/>
  <g>
    <rect x="100" y="145" width="165" height="120" rx="16" fill="#f1f5f9" stroke="#334155" stroke-width="7"/>
    <rect x="335" y="145" width="165" height="120" rx="16" fill="#f1f5f9" stroke="#334155" stroke-width="7"/>
    <path d="M265 185 C285 175 315 175 335 185" stroke="#334155" stroke-width="7" stroke-linecap="round"/>
    <path d="M100 175 L45 185" stroke="#334155" stroke-width="7" stroke-linecap="round"/>
    <path d="M500 175 L555 185" stroke="#334155" stroke-width="7" stroke-linecap="round"/>
  </g>
</svg>
`);

// 13. Aviation Driver Polarized SVG
saveSvg('aviation-driver.svg', `
<svg width="600" height="420" viewBox="0 0 600 420" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="driverAmber" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#B45309"/>
      <stop offset="100%" stop-color="#F59E0B"/>
    </linearGradient>
  </defs>
  <circle cx="300" cy="210" r="180" fill="#fffbeb"/>
  <g>
    <path d="M115 160 C115 135 165 130 230 135 C265 138 270 165 265 215 C260 265 215 285 175 285 C130 285 115 230 115 160 Z" fill="url(#driverAmber)" stroke="#374151" stroke-width="6"/>
    <path d="M485 160 C485 135 435 130 370 135 C335 138 330 165 335 215 C340 265 385 285 425 285 C470 285 485 230 485 160 Z" fill="url(#driverAmber)" stroke="#374151" stroke-width="6"/>
    <path d="M220 133 C260 125 340 125 380 133" stroke="#374151" stroke-width="5"/>
    <path d="M255 165 C275 152 325 152 345 165" stroke="#374151" stroke-width="4.5"/>
  </g>
</svg>
`);

// 14. Crystal Clear Round SVG
saveSvg('crystal-round.svg', `
<svg width="600" height="420" viewBox="0 0 600 420" fill="none" xmlns="http://www.w3.org/2000/svg">
  <circle cx="300" cy="210" r="180" fill="#fdf2f8"/>
  <g>
    <circle cx="200" cy="210" r="70" fill="rgba(255,255,255,0.7)" stroke="#FBCFE8" stroke-width="9"/>
    <circle cx="400" cy="210" r="70" fill="rgba(255,255,255,0.7)" stroke="#FBCFE8" stroke-width="9"/>
    <path d="M270 205 C290 190 310 190 330 205" stroke="#FBCFE8" stroke-width="8" stroke-linecap="round"/>
    <circle cx="200" cy="210" r="62" stroke="#D4AF37" stroke-width="1.5" stroke-dasharray="3 3"/>
    <circle cx="400" cy="210" r="62" stroke="#D4AF37" stroke-width="1.5" stroke-dasharray="3 3"/>
  </g>
</svg>
`);

// 15. Sport Wrap Polarized SVG
saveSvg('sport-wrap.svg', `
<svg width="600" height="420" viewBox="0 0 600 420" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="fireMirror" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#EF4444"/>
      <stop offset="50%" stop-color="#F59E0B"/>
      <stop offset="100%" stop-color="#DC2626"/>
    </linearGradient>
  </defs>
  <circle cx="300" cy="210" r="180" fill="#fef2f2"/>
  <g>
    <path d="M80 160 C140 140 240 150 265 170 C260 230 200 260 140 260 C90 260 70 210 80 160 Z" fill="url(#fireMirror)" stroke="#111827" stroke-width="8"/>
    <path d="M520 160 C460 140 360 150 335 170 C340 230 400 260 460 260 C510 260 530 210 520 160 Z" fill="url(#fireMirror)" stroke="#111827" stroke-width="8"/>
    <path d="M260 170 C280 160 320 160 340 170" stroke="#111827" stroke-width="9" stroke-linecap="round"/>
  </g>
</svg>
`);

// 16. Hero Eyewear Showcase SVG
saveSvg('hero-eyewear.svg', `
<svg width="800" height="600" viewBox="0 0 800 600" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="heroGold" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FFEAA7"/>
      <stop offset="40%" stop-color="#D4AF37"/>
      <stop offset="80%" stop-color="#996515"/>
      <stop offset="100%" stop-color="#FFD700"/>
    </linearGradient>
    <radialGradient id="heroBackGlow" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#F59E0B" stop-opacity="0.12"/>
      <stop offset="100%" stop-color="#F59E0B" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="heroLens" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#1E293B" stop-opacity="0.95"/>
      <stop offset="100%" stop-color="#0F172A" stop-opacity="0.75"/>
    </linearGradient>
  </defs>

  <rect width="800" height="600" fill="#0A0A0A"/>
  <circle cx="400" cy="300" r="300" fill="url(#heroBackGlow)"/>

  <!-- Showcase Pedestal ring -->
  <ellipse cx="400" cy="460" rx="260" ry="40" fill="#141414" stroke="#222" stroke-width="2"/>
  <ellipse cx="400" cy="455" rx="180" ry="25" fill="#1c1c1c" stroke="#D4AF37" stroke-width="1" stroke-dasharray="4 4"/>

  <!-- High-end Floating Eyewear -->
  <g transform="translate(0, -30)">
    <!-- Shadow beneath glasses -->
    <ellipse cx="400" cy="410" rx="180" ry="18" fill="#000" opacity="0.6"/>

    <!-- Left Teardrop Lens -->
    <path d="M190 230 C190 195 250 190 330 198 C375 202 380 238 375 295 C368 360 315 385 265 385 C210 385 190 315 190 230 Z" fill="url(#heroLens)" stroke="url(#heroGold)" stroke-width="8"/>
    <!-- Glare stripe -->
    <path d="M215 220 Q270 210 325 218 Q270 320 220 350 Z" fill="#ffffff" opacity="0.12"/>

    <!-- Right Teardrop Lens -->
    <path d="M610 230 C610 195 550 190 470 198 C425 202 420 238 425 295 C432 360 485 385 535 385 C590 385 610 315 610 230 Z" fill="url(#heroLens)" stroke="url(#heroGold)" stroke-width="8"/>
    <path d="M585 220 Q530 210 475 218 Q530 320 580 350 Z" fill="#ffffff" opacity="0.12"/>

    <!-- Brow bar -->
    <path d="M315 195 C365 185 435 185 485 195" stroke="url(#heroGold)" stroke-width="6.5" stroke-linecap="round"/>

    <!-- Bridge -->
    <path d="M360 235 C385 220 415 220 440 235" stroke="url(#heroGold)" stroke-width="6" stroke-linecap="round"/>

    <!-- Temple hinges -->
    <path d="M190 225 L105 240 C95 242 85 255 80 268" stroke="url(#heroGold)" stroke-width="6" stroke-linecap="round"/>
    <path d="M610 225 L695 240 C705 242 715 255 720 268" stroke="url(#heroGold)" stroke-width="6" stroke-linecap="round"/>

    <!-- Gold temple tips -->
    <rect x="70" y="260" width="30" height="9" rx="4.5" fill="#D4AF37"/>
    <rect x="700" y="260" width="30" height="9" rx="4.5" fill="#D4AF37"/>

    <!-- Luxury Seal Badge -->
    <circle cx="400" cy="140" r="28" fill="#111" stroke="#D4AF37" stroke-width="2"/>
    <text x="400" y="137" text-anchor="middle" font-family="'Integral CF', sans-serif" font-weight="900" font-size="10" fill="#D4AF37">ZEISS</text>
    <text x="400" y="149" text-anchor="middle" font-family="'Inter', sans-serif" font-weight="700" font-size="7" fill="#fff" letter-spacing="1">CERTIFIED</text>
  </g>
</svg>
`);

// 17. Magnetic Clip-On 2-in-1 Eyeglasses SVG
saveSvg('clipon-magnetic.svg', `
<svg width="600" height="420" viewBox="0 0 600 420" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="magneticClipLens" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#1c1917" stop-opacity="0.95"/>
      <stop offset="100%" stop-color="#44403c" stop-opacity="0.85"/>
    </linearGradient>
    <linearGradient id="clipChassis" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#222"/>
      <stop offset="100%" stop-color="#050505"/>
    </linearGradient>
  </defs>
  <circle cx="300" cy="210" r="180" fill="#f5f5f4"/>
  <g>
    <!-- Base Optical Frame -->
    <rect x="95" y="150" width="168" height="118" rx="16" fill="#eaf2f8" stroke="#333" stroke-width="7"/>
    <rect x="335" y="150" width="168" height="118" rx="16" fill="#eaf2f8" stroke="#333" stroke-width="7"/>
    <path d="M263 190 C285 180 315 180 335 190" stroke="#333" stroke-width="7" stroke-linecap="round"/>
    
    <!-- Magnetic Clip-on Polarized Shade (Slightly Offset with Snap Magnets) -->
    <g transform="translate(4, -8)">
      <rect x="95" y="150" width="168" height="118" rx="16" fill="url(#magneticClipLens)" stroke="#111" stroke-width="6"/>
      <rect x="335" y="150" width="168" height="118" rx="16" fill="url(#magneticClipLens)" stroke="#111" stroke-width="6"/>
      <path d="M263 190 C285 178 315 178 335 190" stroke="#111" stroke-width="6" stroke-linecap="round"/>
      <!-- Magnetic Snap Nodes (Gold contacts) -->
      <circle cx="95" cy="155" r="4.5" fill="#D4AF37"/>
      <circle cx="503" cy="155" r="4.5" fill="#D4AF37"/>
      <circle cx="263" cy="190" r="3.5" fill="#D4AF37"/>
      <circle cx="335" cy="190" r="3.5" fill="#D4AF37"/>
      <!-- Polarized Badge -->
      <rect x="180" y="240" width="75" height="18" rx="4" fill="#000" opacity="0.8"/>
      <text x="217" y="252" text-anchor="middle" font-family="'Inter', sans-serif" font-size="8" font-weight="800" fill="#D4AF37">POLARIZED</text>
    </g>
    <text x="300" y="320" text-anchor="middle" font-family="'Inter', sans-serif" font-size="11" font-weight="700" fill="#78716c">MAGNETIC 2-IN-1 SNAP SYSTEM</text>
  </g>
</svg>
`);

// 18. Contact Lens Pack SVG
saveSvg('contact-lens-box.svg', `
<svg width="600" height="420" viewBox="0 0 600 420" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="lensBoxGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0284c7"/>
      <stop offset="50%" stop-color="#0369a1"/>
      <stop offset="100%" stop-color="#0c4a6e"/>
    </linearGradient>
    <radialGradient id="hydroMoist" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#38bdf8" stop-opacity="0.9"/>
      <stop offset="60%" stop-color="#0284c7" stop-opacity="0.4"/>
      <stop offset="100%" stop-color="#bae6fd" stop-opacity="0.1"/>
    </radialGradient>
  </defs>
  <circle cx="300" cy="210" r="180" fill="#f0f9ff"/>
  <g>
    <!-- Contact lens box packaging -->
    <rect x="140" y="110" width="220" height="190" rx="16" fill="url(#lensBoxGrad)" stroke="#0369a1" stroke-width="2"/>
    <rect x="155" y="125" width="80" height="18" rx="4" fill="rgba(255,255,255,0.2)"/>
    <text x="160" y="138" font-family="'Inter', sans-serif" font-size="9" font-weight="800" fill="#fff">HYDRA-MOIST 58%</text>
    <text x="155" y="175" font-family="'Syne', sans-serif" font-size="22" font-weight="900" fill="#fff">AQUA<tspan fill="#38bdf8">LENS</tspan></text>
    <text x="155" y="195" font-family="'Inter', sans-serif" font-size="11" font-weight="600" fill="#bae6fd">UV Blocking • High Oxygen</text>
    <text x="155" y="240" font-family="'Inter', sans-serif" font-size="10" fill="#e0f2fe">Daily Disposable (30 Pack)</text>
    <circle cx="320" cy="260" r="18" fill="rgba(255,255,255,0.15)"/>
    <text x="320" y="264" text-anchor="middle" font-family="'Inter', sans-serif" font-size="11" font-weight="800" fill="#fff">30</text>

    <!-- Floating Contact Lens Drop with Refraction -->
    <ellipse cx="430" cy="200" rx="60" ry="40" fill="url(#hydroMoist)" stroke="#38bdf8" stroke-width="3"/>
    <ellipse cx="430" cy="195" rx="40" ry="24" fill="#ffffff" opacity="0.3"/>
    <circle cx="410" cy="188" r="8" fill="#ffffff" opacity="0.7"/>
    <text x="430" y="270" text-anchor="middle" font-family="'Inter', sans-serif" font-size="11" font-weight="700" fill="#0369a1">Soft Silicone Hydrogel</text>
  </g>
</svg>
`);

// 19. Optical Care Kit SVG
saveSvg('lens-care-kit.svg', `
<svg width="600" height="420" viewBox="0 0 600 420" fill="none" xmlns="http://www.w3.org/2000/svg">
  <circle cx="300" cy="210" r="180" fill="#fdf4ff"/>
  <g>
    <!-- Hard Leather Eyewear Case -->
    <rect x="120" y="160" width="230" height="120" rx="20" fill="#18181b" stroke="#3f3f46" stroke-width="2"/>
    <path d="M120 200 C200 215 270 215 350 200" stroke="#27272a" stroke-width="3"/>
    <circle cx="235" cy="205" r="7" fill="#D4AF37"/>
    <text x="235" y="250" text-anchor="middle" font-family="'Syne', sans-serif" font-size="12" font-weight="800" fill="#D4AF37" letter-spacing="1">OPTICSKHAN</text>

    <!-- Anti-Fog Spray Bottle -->
    <rect x="390" y="140" width="60" height="130" rx="10" fill="#0284c7"/>
    <rect x="405" y="115" width="30" height="25" rx="4" fill="#cbd5e1"/>
    <rect x="415" y="100" width="10" height="15" fill="#94a3b8"/>
    <path d="M410 100 H430" stroke="#64748b" stroke-width="3"/>
    <text x="420" y="200" text-anchor="middle" font-family="'Inter', sans-serif" font-size="9" font-weight="800" fill="#fff" transform="rotate(-90 420 200)">ANTI-FOG SPRAY</text>

    <!-- Microfiber cleaning cloth -->
    <polygon points="460,210 520,180 500,260 440,240" fill="#f472b6" opacity="0.85"/>
  </g>
</svg>
`);

console.log("All assets generated successfully!");

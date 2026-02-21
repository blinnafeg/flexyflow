// Curated list of popular Google Fonts
export const GOOGLE_FONTS: string[] = [
  // Sans-serif
  'Inter', 'Roboto', 'Open Sans', 'Lato', 'Montserrat', 'Poppins',
  'Nunito', 'Raleway', 'Oswald', 'Ubuntu', 'DM Sans', 'Space Grotesk',
  'Outfit', 'Exo 2', 'Josefin Sans', 'Comfortaa', 'Manrope', 'Rubik',
  'Quicksand', 'Mulish',
  // Serif
  'Playfair Display', 'Merriweather', 'PT Serif', 'Lora', 'Cormorant',
  'EB Garamond', 'Libre Baskerville', 'Source Serif 4',
  // Display / Decorative
  'Bebas Neue', 'Anton', 'Righteous', 'Alfa Slab One',
  'Lobster', 'Pacifico', 'Dancing Script', 'Caveat', 'Permanent Marker',
  // Monospace
  'Source Code Pro', 'Fira Code', 'JetBrains Mono', 'Space Mono',
]

const loaded = new Set<string>()

export function loadGoogleFont(family: string): void {
  if (!family || loaded.has(family)) return
  loaded.add(family)
  const id = `gf-${family.replace(/\s+/g, '-').toLowerCase()}`
  if (document.getElementById(id)) return
  const link = document.createElement('link')
  link.id = id
  link.rel = 'stylesheet'
  link.href = `https://fonts.googleapis.com/css2?family=${family.replace(/\s+/g, '+')}:wght@300;400;500;600;700&display=swap`
  document.head.appendChild(link)
}

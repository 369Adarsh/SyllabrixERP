# Fonts

Syllabrix uses three free Google Fonts, loaded via CDN inside `colors_and_type.css`. No font files are vendored.

| Role | Family | Weights used | Source |
|---|---|---|---|
| Display | Bricolage Grotesque | 400, 500, 600, 700, 800 (variable opsz 12–96) | https://fonts.google.com/specimen/Bricolage+Grotesque |
| Body | Plus Jakarta Sans | 300–800 (incl. italic) | https://fonts.google.com/specimen/Plus+Jakarta+Sans |
| Mono | JetBrains Mono | 400, 500, 600 | https://fonts.google.com/specimen/JetBrains+Mono |

## ⚠️ Substitution flag

If Syllabrix has licensed display or body fonts, **send them to me** and I'll swap. Bricolage Grotesque was chosen because its slightly modular geometry mirrors the brand's brick motif; Plus Jakarta Sans for friendly geometric body and good Devanagari pairing.

## To switch to local files
1. Drop `.woff2` into this folder.
2. Add `@font-face` blocks at the top of `colors_and_type.css`.
3. Remove the `@import` line at the top.

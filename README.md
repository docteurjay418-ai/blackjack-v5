# Blackjack v5 — Split Project

This restructures the previous single-file demo into a clean, static web project with separate HTML, CSS, and JS.

Files

- index.html: Markup for the table, seats, chips, controls.
- style.css: Styles, responsive layout, card/chip animations.
- script.js: Full Blackjack state machine and UI logic.

Run Locally

- Option 1: Double‑click index.html to open in your browser.
- Option 2: Serve locally for best results (prevents some browser security quirks):
  - Python: `python -m http.server` then open `http://localhost:8000`
  - Node: `npx serve .` then open the printed URL

Gameplay

- Place bets: Tap/click a chip, then tap a seat circle. Right‑click to subtract, double‑click to clear a seat.
- Deal: Click Deal. Action buttons (Hit, Stand, Double, Split, Surrender) appear only when valid.
- Keyboard: D=Deal, H=Hit, S=Stand, 2=Double, P=Split, U=Surrender, R=Rebet, C=Clear (when not in round).
- Balance: Click the Balance amount to set a custom balance.

Rules & Logic

- 6‑deck shoe with shuffle/re‑shoe penetration at ~75%.
- Dealer hits soft 17, hole card dealt and revealed at dealer turn.
- Payouts: Blackjack pays 3:2, Insurance UI omitted (logic prepared), pushes tracked.
- Split up to 4 hands; split aces receive one card only (auto‑stand).
- Double allowed on first two cards when sufficient balance.

Animations

- Dealing: Cards animate from the shoe and flip to reveal.
- Dealer reveal: Hole card flips when dealer plays.
- Chips: Win/Lose chip transfer animates along curved paths.

Responsive

- Layout scales for desktop and mobile; small-screen tweaks reduce card and chip sizes.

Notes

- Original single-file source remains as reference: `blackjack_table_v5_video_style.html`.
- No build tools are required; the project is static and self-contained.

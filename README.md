# Carino Hash

A client-side teaching tool for cryptographic hashing → **[hash.carino.systems](https://hash.carino.systems)**

Drop in a file or type text and watch a hash actually get computed — the padding,
the message schedule, and every one of **SHA-256's 64 rounds**, step by step.
Nothing is uploaded; everything runs in the browser.

## Features

- **No-scroll, single-view shell** — one grid of algorithm cards; the whole app
  fits one viewport and only the grid scrolls. Every card carries its era, output
  size, security badge, a plain-language note, and a ⚛ line on its quantum
  standing (e.g. *~128-bit vs Grover*, *broken classically*, *not cryptographic*).
- **Per-card "Steps" walkthrough** — every card has a ▶ Steps button that
  opens a modal overlay: a plain-language intro ("the padlock in your browser…"),
  a legend explaining each panel, and a play / step / back / reset stepper that
  animates the algorithm's real internals — byte-by-byte for the checksums;
  padding, schedule and rounds for the MD/SHA families; the θ·ρ·π·χ·ι sponge
  rounds with the live 5×5 lane state for Keccak/SHA-3.
- **Explained for everyone** — each step shows a friendly "what's happening"
  sentence for non-technical readers, plus an "In math terms" box (the actual
  recurrence / formula) for the mathematically inclined.
- **Large files are opt-in** — above 2 MB nothing is hashed automatically; each
  card shows a notice and a "Compute _X_ now" button so you digest one algorithm
  at a time instead of freezing the tab. (The Steps walkthrough still animates the
  first 64 KB.)
- **15 cards across the history of hashing** —
  *Checksum-8 (1950s), BSD sum (1970s), Fletcher-16 (1979), Adler-32, Pearson,
  CRC-32, MD2 (1989), MD4 (1990), MD5 (1992), SHA-1 (1995), SHA-256, SHA-512
  (2001), SHA3-256, SHA3-512 (2015)*, plus the **Lamport one-time signature** —
  each with era, output size, security badge and a plain-language note.
- **From-scratch, verified** — MD2, MD4, MD5, SHA-1, SHA-256, SHA-512,
  Keccak/SHA-3, CRC-32 and the checksums are implemented from scratch (no
  libraries), checked against known test vectors and **cross-checked against the
  browser's Web Crypto** where an equivalent exists.
- **Post-quantum, as its own card** — the **Lamport one-time signature**, built
  purely on SHA-256, is a card like any other: press ▶ Steps to walk keygen →
  sign → verify → *tamper* (watch verification correctly fail) on the current
  input. Its intro explains why hashing survives quantum attacks (Shor breaks
  RSA/ECC, but a hash only loses a square-root to Grover — so SHA-512/SHA3-512
  stay safe), the same reasoning surfaced on every card's ⚛ line.
- **Print the steps** — each Steps overlay has its own "🖨 Print steps" button
  that exports that algorithm's *complete* walkthrough as a clean branded PDF:
  intro, digest, and every numbered step with its plain explanation, "In math
  terms" formula, and values.

## Design

Single self-contained `index.html` (inline CSS/JS). Shares the Carino navbar
(`carino-navbar.js` + `carino-clock.js`) and branding with the rest of
carino.systems. No build step, no external runtime dependencies (Google Fonts
are progressive-enhancement only).

## Notes

- Pure-JS hashes (MD5 / SHA-3 / CRC32) are skipped above 8 MB to avoid freezing
  the tab; native Web Crypto SHA-1/256/384/512 run at any size.
- The visualizer animates the first few 512-bit blocks; the digest is always the
  full result.
- Educational only — not a security product. The Lamport demo is a teaching
  illustration of hash-based signatures, not a hardened implementation.

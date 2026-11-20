# Smart Calculator

A scientific calculator built with plain HTML, CSS and JavaScript (no libraries).

## Features
- Basic arithmetic: `+ − × ÷`, brackets, decimals
- Scientific mode: `sin cos tan log ln √ x² xʸ π e x! 1/x`, with DEG/RAD switch
- Percentage: `50%` = 0.5, and `200 + 10%` = 220 (10% *of 200*)
- Keyboard input (digits, operators, `Enter`, `Backspace`, `Esc`)
- Calculation history (saved in the browser, click an entry to reuse its result)
- Clear (`AC`) and delete (`⌫`)
- Dark / light theme (remembered)

## Run locally
Open `index.html` in a browser. No install needed.
Or run `python -m http.server` in this folder and visit http://localhost:8000.

## How it works (good for explaining in interviews)
- `script.js` has a small **recursive-descent parser**. It reads the expression in tokens and follows operator precedence (`^` > `* /` > `+ -`). It does **not** use `eval()`, which is unsafe.
- History and theme are stored with `localStorage`.
- Layout uses CSS Grid; the glass look uses `backdrop-filter`.

## Known limits
- No implicit multiplication (`2pi` must be written `2*pi`).
- Results are rounded to 12 significant digits.

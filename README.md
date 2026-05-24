# ♟ Grandmaster Chess

A fully-featured chess game playable in the browser. Supports **Player vs Player** and **Player vs Computer** (three difficulty levels), move notation, castling, en passant, pawn promotion, and timers.

## Files

```
chess-site/
├── index.html   ← game layout & markup
├── style.css    ← dark luxury styling
├── chess.js     ← full chess engine + minimax AI
└── README.md
```

## 🚀 Deploy to GitHub Pages (step-by-step)

### 1. Create a GitHub repository

1. Go to [github.com](https://github.com) and sign in.
2. Click **+** → **New repository**.
3. Name it anything, e.g. `chess-site`.
4. Leave it **Public**.
5. Click **Create repository**.

### 2. Upload the files

**Option A — via the GitHub website (easiest):**

1. Inside your new repo click **Add file → Upload files**.
2. Drag all three files (`index.html`, `style.css`, `chess.js`) into the upload area.
3. Click **Commit changes**.

**Option B — via Git CLI:**

```bash
cd chess-site
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/chess-site.git
git push -u origin main
```

### 3. Enable GitHub Pages

1. In your repo, go to **Settings → Pages** (left sidebar).
2. Under **Source**, select **Deploy from a branch**.
3. Choose branch **main** and folder **/ (root)**.
4. Click **Save**.

### 4. Visit your site

After 1–2 minutes your site will be live at:

```
https://YOUR_USERNAME.github.io/chess-site/
```

GitHub will show the URL in the Pages settings once it's ready.

---

## Features

| Feature | Details |
|---|---|
| **Full chess rules** | Castling, en passant, promotion, check/checkmate/stalemate |
| **vs Computer** | Minimax AI with alpha-beta pruning — 3 difficulty levels |
| **Move log** | Algebraic notation, scrollable |
| **Timers** | 10-minute clocks per player |
| **Undo** | Steps back one (or two in vs-computer mode) |
| **Board flip** | Rotate board for black's perspective |
| **Resign** | Concede the game |

## Customisation tips

- **Change time control**: edit `timers = { w: 600, b: 600 }` in `chess.js` (seconds).
- **Change board colours**: edit `--white-sq` and `--black-sq` in `style.css`.
- **Stronger AI**: increase `aiDepth` default — note: depth 4+ is slow in the browser.

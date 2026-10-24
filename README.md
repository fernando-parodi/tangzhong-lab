# Tangzhong Lab 🍞 🍕

**One dough. Two directions.** A small, polished, zero-build web app that scales a Tangzhong–Poolish formula for artisan bread or pizza and guides you through the steps.

Created as an introductory GitHub project by [@fernando-parodi](https://github.com/fernando-parodi).

## What it does

- **Bread mode** follows the original cold-bulk batard + Dutch oven process.
- **Pizza mode** adapts the same flour and water architecture for round or pan pizza, with same-day or overnight fermentation options.
- **Live scaling** calculates precise ingredient amounts from a quantity and dough weight per piece.
- **Step checklist and bench timer** keep the process organized. Checkmarks and settings are saved locally in the browser.
- **Copy or print** the complete, scaled recipe.
- **Responsive, static design.** No dependencies, build tools, server, user accounts, or API keys needed. Uses system-font fallbacks if the optional Google Fonts stylesheet is unavailable.

## Run locally

For an immediate offline-friendly preview, double-click **`preview.html`**. It is a single-file demo with the same app code and CSS bundled inline. The maintainable source lives in `index.html`, `styles.css`, `recipe.js`, and `app.js`.

To run the modular source (`index.html`) locally, serve the project directory:

```bash
python -m http.server 8000
```

Then visit <http://localhost:8000>.

## Put it on GitHub Pages

1. Create a public repository named **`tangzhong-lab`**.
2. Upload all the project files to the **root** of the `main` branch (not the containing directory).
3. In the repository, open **Settings → Pages → Build and deployment**.
4. Choose **Deploy from a branch**, select **`main`**, folder **`/(root)`**, and save.
5. Your site will be accessible at `https://fernando-parodi.github.io/tangzhong-lab/` after GitHub publishes it.

Official deployment instructions: <https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site>

If you prefer the command line:

```bash
git init
git add .
git commit -m "Launch Tangzhong Lab v1.0"
git branch -M main
git remote add origin https://github.com/fernando-parodi/tangzhong-lab.git
git push -u origin main
```

Create the GitHub repository first; don't initialize it with another README if using those commands.

## Original formula and recipe math

The input recipe is **400 g total flour**, **286 g water**, **4 g instant yeast**, and **7 g salt** → **697 g dough**.

The source writes **72% hydration** as a rounded value. Actual hydration is **286 / 400 = 71.5%**. Tangzhong and poolish flour/water are *included* in those totals, not extra.

| Ingredient | % of total flour | Bread baseline |
|---|---:|---:|
| Tangzhong flour | 15% | 60 g |
| Tangzhong boiling water | 30% | 120 g |
| Poolish flour | 20% | 80 g |
| Poolish water | 20% | 80 g |
| Poolish instant yeast | 0.2% | 0.8 g |
| Final dough flour | 65% | 260 g |
| Final dough cold water | 21.5% | 86 g |
| Final dough instant yeast | 0.8% | 3.2 g |
| Salt | 1.75% | 7 g |

The calculator solves for flour **F** from the requested dough weight **D**, so rounding never compounds across batches:

- Bread / same-day pizza: `F = D / (1 + 0.715 + 0.0175 + 0.01)` = `D / 1.7425`
- Overnight pizza: `F = D / (1 + 0.715 + 0.0175 + 0.002)` = `D / 1.7345`
- Individual ingredient amount = `F × baker's percentage`.

Displayed gram values are rounded; slight differences in summed display values can occur.

## Bread versus pizza: what is original and what is adapted?

The **bread mode** comes from the supplied method (poolish, tangzhong, ice-water mix, two-hour refrigerated bulk with folds, batard shaping, one-hour refrigerated proof, and covered/uncovered Dutch-oven bake).

**Pizza mode is an adaptation**, not a claim that the supplied bread recipe originally included pizza. It uses the same tangzhong, poolish, overall flour and hydration ratios, but changes shaping, final proof, and baking. It is designed as a soft, high-hydration pizza, and is particularly well suited to oiled pans.

For same-day pizza, the original 1% total yeast is retained. For overnight pizza, the 0.20% poolish yeast is retained while the 0.80% final-dough yeast is omitted, reducing the total to 0.20%. Dough still ferments at different speeds based on temperature, yeast activity, refrigerator performance, and flour. The oven and fermentation times are starting points, not guarantees. Practice food and hot cookware safety, and use any optional steam/ice technique only when suitable for the cookware.

## Files

```text
index.html           User interface, semantic markup
preview.html         Standalone double-clickable app (bundled build)
styles.css           Responsive design and print styling
recipe.js            Pure recipe calculations + method data
app.js               User interaction, timer, local persistence
favicon.svg          Original typographic mark
.nojekyll             GitHub Pages static-site hint
README.md            Documentation and publishing instructions
LICENSE              MIT license for this app's code
 tests/recipe.test.mjs  Formula/unit tests
```

## Testing

```bash
node --test tests/*.test.mjs
```

Requires Node.js 18+ for local tests; visiting the webpage requires no Node.js.

## Roadmap

Potential next releases: Celsius/Fahrenheit toggle, recipe presets, saved batches, guided step notifications, shopping lists, and ingredient cost estimates.

## License

Code is released under the [MIT License](LICENSE). Your personal adjustments to the recipe and the suggested pizza workflow may need to be validated for your flour, oven, and climate.
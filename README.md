# Core Pricing in Learned Assignment Markets

Mini-project for DSC-13 (LPP and Game Theory).

> When a ride-hailing platform matches riders to drivers using predicted (noisy) surplus values, how much do the optimal matching and the stable (core) prices change with prediction error, can riders or drivers gain by misreporting, and which stable price should the platform choose?

A table of predicted surplus (rider value minus driver cost) goes in. We find the optimal matching as an assignment LP and the core, the range of prices no rider-driver pair wants to leave, as the optimal solutions of the dual LP. Then we test the answer three ways: random error in the surplus values, one agent misreporting, and a small zero-sum game between the platform and a manipulator to pick the price.

Modelling assumption: we do not train a model. A machine-learned estimate is taken to be the true surplus plus Gaussian error, since any predictor is the truth plus some error.

## Run

Needs Node 20 or newer. There are no dependencies to install.

```
npm start
```

Then open http://localhost:8080. The page is plain HTML and ES modules in `web/`, and everything is computed in the browser.

## Test

```
npm test            # unit tests for every module in web/lib
npm run check       # re-runs every experiment and prints the tables used in the report
```

`npm run check` exits with an error if any number differs from the expected targets.

## TORA

The LP side of the project was done by hand in TORA: the primal and dual assignment LPs, the rider-optimal and driver-optimal LPs, the transportation form with three starting solutions, and the game as an LP. `tora/entry-sheets.md` lists exactly what to type. Values read from TORA go in `tora/results.json`, and

```
npm run tora-check
```

compares each one with the computed value. Screenshots are in `tora/screens/`.

## Layout

- `web/lib` matching, core prices, Hungarian steps, noise, misreporting and the game (no DOM)
- `web/ui` the page's tables and SVG charts
- `scripts` the target check and a small static server
- `report` the LaTeX report

## Publishing

The `pages` workflow publishes `web/` to GitHub Pages. In the repository settings, set Pages source to "GitHub Actions".

## Authors

Anirudh Jain, Ayush Pandey, Sourabh. MIT licence.

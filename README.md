# Core Pricing in Learned Assignment Markets

DSC-13 mini-project (Linear Programming and Game Theory).

**Live page:** https://anirudh2007.github.io/core-pricing/

> When a ride-hailing platform matches riders to drivers using predicted (noisy) surplus values, how much do the optimal matching and the stable (core) prices change with prediction error, can riders or drivers gain by misreporting, and which stable price should the platform choose?

## What it does

The input is a surplus table: one row per rider, one column per driver, each entry being what the rider would pay minus what the trip costs the driver.

- The assignment LP picks who rides with whom to make the total surplus as large as possible.
- Its dual LP gives each rider's and each driver's share of the surplus. The optimal dual solutions are the *core*: prices where no rider and driver could do better by leaving together. The core is a range, so we compare three points in it: rider-optimal (RO), driver-optimal (DO) and their midpoint (MID).
- To model prediction error, each surplus becomes the true value plus random normal error of spread σ, and the market is solved thousands of times to see how the matching and prices move.
- To test misreporting, one rider or driver reports their values 1 or 2 higher or lower, and we measure whether it pays.
- To choose a price, the platform plays RO, MID or DO against a manipulator who picks a side, a zero-sum game solved by the graphical method and as an LP.

On the page you can edit the table (up to 4 × 4) or load the two example markets, drag a slider through the core from RO to DO, set σ and the number of repeats, and click any misreport to see who gains.

## Results on the 3 × 3 example

- The matching tolerates small errors: at σ = 1 it changes in 30% of runs but loses only 2% of the surplus.
- Prices move seven to nine times more than the surplus lost, and MID moves least.
- RO protects riders from manipulation and DO protects drivers, but each leaves the other side able to gain 2. MID caps both sides at 1.
- The pricing game has value 1 with no saddle point, and MID is an optimal choice for the platform.

## Run it

Needs Node 20 or newer. There is nothing to install.

```
npm start
```

Then open http://localhost:8080.

## Tests and checks

```
npm test            # 37 unit tests for the solvers in web/lib
npm run check       # re-runs every experiment and compares it with the expected numbers
```

The same tests run on GitHub for every push, and the page is redeployed from `web/`.

## TORA

Every model small enough to enter by hand (the assignment LP, the rider-optimal and driver-optimal LPs, the transportation form and the game LP) was also solved in TORA, and every value matches the code. The TORA runs are shown in the project report.

## Layout

```
web/            the page: index.html, style.css, app.js
web/lib/        solvers: assignment, core prices, Hungarian method, noise, misreporting, game
web/ui/         tables and charts on the page
test/           unit tests (node:test)
scripts/        experiment check and a small local server
```

## Authors

Anirudh Jain, Ayush Pandey and Sourabh. Released under the MIT licence.

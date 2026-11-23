# TORA entry sheets

Instance A = [[10, 6], [7, 4]] and instance B = [[12, 10, 6], [11, 7, 4], [9, 11, 9]],
riders in rows, drivers in columns. Variable x_ij means rider i rides with driver j.
After each run, type the numbers you read into `results.json` and run `npm run tora-check`.
Save a screenshot of every final screen in `screens/` (for example `A-primal-final.png`).

## (a) Primal assignment LP

Main menu: Linear Programming. Enter the problem, then Solve Problem, Algebraic, Iterations, then Final solution.

Instance A: 4 variables, 4 constraints.

```
Maximize  z = 10 x11 + 6 x12 + 7 x21 + 4 x22
subject to
  x11 + x12        <= 1     (rider 1)
  x21 + x22        <= 1     (rider 2)
  x11 + x21        <= 1     (driver 1)
  x12 + x22        <= 1     (driver 2)
  all x >= 0
```

Instance B: 9 variables, 6 constraints.

```
Maximize  z = 12 x11 + 10 x12 + 6 x13 + 11 x21 + 7 x22 + 4 x23 + 9 x31 + 11 x32 + 9 x33
subject to
  x11 + x12 + x13 <= 1      (rider 1)
  x21 + x22 + x23 <= 1      (rider 2)
  x31 + x32 + x33 <= 1      (rider 3)
  x11 + x21 + x31 <= 1      (driver 1)
  x12 + x22 + x32 <= 1      (driver 2)
  x13 + x23 + x33 <= 1      (driver 3)
  all x >= 0
```

Expected: z = 14 for A (x11 = x22 = 1), z = 30 for B (x12 = x21 = x33 = 1).

What to read and note:

1. The number of simplex iterations.
2. The final tableau. The basis has as many variables as constraints (4 for A, 6 for B),
   but only 2 (A) or 3 (B) of the x's equal 1. The remaining basic variables sit at value 0.
   That is primal degeneracy, and it is why the dual has many optimal solutions (the core).
3. The dual values (shadow prices) of the constraints. The rider constraints give u, the
   driver constraints give v. Enter them as `u` and `v`. `npm run tora-check` tests that they are in the core.
4. The sensitivity table for the right-hand sides. For at least one constraint the allowable
   increase or decrease is 0. The core range of that agent is the gap between its left and
   right shadow price, so a zero allowable range is the same fact seen from the LP side.

## (b) Rider-optimal and driver-optimal LPs

Same menu. Variables u1.., v1.. (all >= 0). These have >= and = constraints, so TORA
needs artificial variables: choose the M-method or the two-phase method under Iterations.

Instance A, RO:

```
Maximize  z = u1 + u2
subject to
  u1 + v1 >= 10
  u1 + v2 >= 6
  u2 + v1 >= 7
  u2 + v2 >= 4
  u1 + u2 + v1 + v2 = 14
```

DO is the same with Minimize. Expected: RO z = 11, DO z = 2.

Instance B, RO:

```
Maximize  z = u1 + u2 + u3
subject to
  u1 + v1 >= 12    u1 + v2 >= 10    u1 + v3 >= 6
  u2 + v1 >= 11    u2 + v2 >= 7     u2 + v3 >= 4
  u3 + v1 >= 9     u3 + v2 >= 11    u3 + v3 >= 9
  u1 + u2 + u3 + v1 + v2 + v3 = 30
```

DO is the same with Minimize. Expected: RO z = 24, DO z = 3.

## (c) Assignment as a balanced transportation problem

Main menu: Transportation Model. Supplies and demands are all 1. TORA minimises cost, so use
cost = K minus a with K the largest entry (minimising K - a maximises a).

Instance A, K = 10:

```
        D1  D2  supply
R1       0   4   1
R2       3   6   1
demand   1   1
```

Instance B, K = 12:

```
        D1  D2  D3  supply
R1       0   2   6   1
R2       1   5   8   1
R3       3   1   3   1
demand   1   1   1
```

Solve three times, once per starting solution: northwest corner, least cost, Vogel. Note the
starting cost and the optimal cost each time. Expected optimal cost: 2 x 10 - 14 = 6 for A and
3 x 12 - 30 = 6 for B, with the same pairs as in (a). Every basic solution is degenerate:
it has 2n - 1 basic cells but only n of them carry a 1, so n - 1 basic cells sit at 0.
If your TORA version has an Assignment option, solve the same cost table there too.

## (d) The platform game as an LP

Payoff (best gain of the manipulator), rows RO, MID, DO, columns riders' side, drivers' side:
M = [[0, 2], [1, 1], [2, 0]]. TORA variables are non-negative, so add 1 to every entry first:
M' = [[1, 3], [2, 2], [3, 1]]. The platform mixes p1, p2, p3 and minimises the worst case w.

```
Minimize  z = w
subject to
  p1 + 2 p2 + 3 p3 - w <= 0
  3 p1 + 2 p2 + p3 - w <= 0
  p1 + p2 + p3 = 1
  p1, p2, p3, w >= 0
```

Expected: w = 2, so the value of the game is 2 - 1 = 1. One optimum is p = (0.5, 0, 0.5);
p = (0, 1, 0) is also optimal, so TORA may print either. If your TORA version has a Zero-sum
Games menu, enter M there as well.

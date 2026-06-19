//! Y — the connection game of Schensted & Titus (1953). A triangular board of
//! hexagonal cells; players alternately place a stone of their colour on an empty
//! cell, and a player wins by connecting all THREE sides of the triangle with one
//! connected group of their stones. Hex reduces to Y.
//!
//! Y is the friendliest possible target for retrograde analysis:
//!   * **Pure placement** — stones are never moved or removed, so the board fills
//!     monotonically and the position graph is acyclic. The loopy retrograde never
//!     has to resolve a repetition cycle.
//!   * **No draws** — by the Y theorem (a Hex-style topological argument) a full
//!     board always has exactly one player connecting all three sides, and the two
//!     players can never connect simultaneously. So every reachable position is a
//!     Win or a Loss. A `Draw` in the solved output is therefore a *bug* — wrong
//!     board topology or wrong win detection — and we assert it cannot happen.
//!
//! Prior art: GamesCrafters' GamesmanClassic carries an undocumented Y solver
//! (`mgameofy.c`, A. Esteban, 2023) that declares `kTieIsPossible = TRUE`, which is
//! incorrect for Y. This plugin instead treats the no-draw property as a hard
//! correctness invariant — see [`crate::reachable::ReachableSolution::count`] used
//! against [`Outcome::Draw`] in the tests and the `y_solve` binary.

use crate::reachable::RulesGame;
use crate::Outcome;

const P1: u8 = 1; // first player
const P2: u8 = 2; // second player

/// A Y board of side `n`: `n` rows, row `r` holding `r + 1` cells, `n(n+1)/2` total.
/// Cells are indexed row-major: `idx(r, c) = r*(r+1)/2 + c` for `0 <= c <= r`.
pub struct Y {
    pub n: usize,
    pub cells: usize,
    adj: Vec<u64>, // adj[i] = bitmask of the cells adjacent to cell i
    edge_a: u64,   // bottom row (r == n-1)
    edge_b: u64,   // left edge (c == 0)
    edge_c: u64,   // right edge (c == r)
}

/// A position: the cells each player occupies, as bitmasks over `0..cells`. The
/// side to move is derived from the stone counts (the first player moves first).
#[derive(Clone, Copy, PartialEq, Eq, Hash, Debug)]
pub struct Pos {
    pub p1: u64,
    pub p2: u64,
}

impl Y {
    /// Build the side-`n` board: precompute the 6-neighbour hex adjacency and the
    /// three edge masks. Limited to 64 cells (side 10) by the `u64` bitboard.
    pub fn new(n: usize) -> Self {
        let cells = n * (n + 1) / 2;
        assert!(cells <= 64, "Y::new: side {n} has {cells} cells, over the 64-bit board");
        let idx = |r: usize, c: usize| -> usize { r * (r + 1) / 2 + c };

        let mut adj = vec![0u64; cells];
        let (mut edge_a, mut edge_b, mut edge_c) = (0u64, 0u64, 0u64);
        // Triangular-grid hex adjacency: same-row left/right, and the two cells in
        // each adjacent row. This is the topology under which Hex reduces to Y.
        let offsets: [(isize, isize); 6] =
            [(0, -1), (0, 1), (-1, -1), (-1, 0), (1, 0), (1, 1)];
        for r in 0..n {
            for c in 0..=r {
                let i = idx(r, c);
                for (dr, dc) in offsets {
                    let nr = r as isize + dr;
                    let nc = c as isize + dc;
                    if nr >= 0 && (nr as usize) < n && nc >= 0 && nc <= nr {
                        adj[i] |= 1u64 << idx(nr as usize, nc as usize);
                    }
                }
                if r == n - 1 {
                    edge_a |= 1u64 << i;
                }
                if c == 0 {
                    edge_b |= 1u64 << i;
                }
                if c == r {
                    edge_c |= 1u64 << i;
                }
            }
        }
        Y { n, cells, adj, edge_a, edge_b, edge_c }
    }

    fn to_move(&self, p: &Pos) -> u8 {
        if p.p1.count_ones() == p.p2.count_ones() {
            P1
        } else {
            P2
        }
    }

    /// Does `mask` contain a connected group touching all three edges?
    fn connects(&self, mask: u64) -> bool {
        let mut remaining = mask;
        while remaining != 0 {
            // Flood-fill the component containing the lowest remaining cell.
            let mut comp = 0u64;
            let mut frontier = remaining & remaining.wrapping_neg();
            while frontier != 0 {
                comp |= frontier;
                let mut next = 0u64;
                let mut f = frontier;
                while f != 0 {
                    next |= self.adj[f.trailing_zeros() as usize];
                    f &= f - 1;
                }
                frontier = next & mask & !comp;
            }
            if comp & self.edge_a != 0 && comp & self.edge_b != 0 && comp & self.edge_c != 0 {
                return true;
            }
            remaining &= !comp;
        }
        false
    }
}

impl RulesGame for Y {
    type State = Pos;

    fn start(&self) -> Pos {
        Pos { p1: 0, p2: 0 }
    }

    fn successors(&self, p: &Pos) -> Vec<Pos> {
        // Only called on non-terminal positions, where the board is not full, so an
        // empty cell always exists. The mover places one stone.
        let board = if self.cells == 64 {
            u64::MAX
        } else {
            (1u64 << self.cells) - 1
        };
        let mut empties = board & !(p.p1 | p.p2);
        let mover = self.to_move(p);
        let mut out = Vec::with_capacity(empties.count_ones() as usize);
        while empties != 0 {
            let bit = empties & empties.wrapping_neg();
            let mut next = *p;
            if mover == P1 {
                next.p1 |= bit;
            } else {
                next.p2 |= bit;
            }
            out.push(next);
            empties &= empties - 1;
        }
        out
    }

    fn terminal(&self, p: &Pos) -> Option<Outcome> {
        // The player who just moved is the only one who can have completed a
        // connection; if either colour connects, the side to move has lost. Y has
        // no draw branch.
        if self.connects(p.p1) || self.connects(p.p2) {
            Some(Outcome::Loss)
        } else {
            None
        }
    }
}

//! Independent validation of the six men's morris solve.
//!
//! Re-implements the rules with a *different representation* — a `[u8; 16]` cell
//! array and a board derived programmatically from the two rings + spokes, rather
//! than the hand-written bitmasks of `games::morris`. If both implementations
//! report the identical reachable-state count, win/loss/draw split, and starting
//! value, a transcription or move-generation bug would have to occur identically
//! in two independent codebases — strong evidence the solve is correct.
//!
//! Also solves five men's morris (same board, 5 men) as a consistency data point.

use game_solver::games::morris::SixMensMorris;
use game_solver::{solve_reachable_capped, Outcome, RulesGame};

const E: u8 = 0;
const W: u8 = 1;
const B: u8 = 2;
const CAP: usize = 200_000_000;

// --- Independent board derivation (programmatic, from the ring/spoke geometry) ---

fn adjacency() -> Vec<Vec<usize>> {
    let mut adj = vec![Vec::new(); 16];
    let rings = [[0, 1, 2, 3, 4, 5, 6, 7], [8, 9, 10, 11, 12, 13, 14, 15]];
    for ring in rings {
        for i in 0..8 {
            let (a, b) = (ring[i], ring[(i + 1) % 8]);
            adj[a].push(b);
            adj[b].push(a);
        }
    }
    for (o, i) in [(1, 9), (3, 11), (5, 13), (7, 15)] {
        adj[o].push(i);
        adj[i].push(o);
    }
    adj
}

fn mills() -> Vec<[usize; 3]> {
    let rings = [[0, 1, 2, 3, 4, 5, 6, 7], [8, 9, 10, 11, 12, 13, 14, 15]];
    let mut m = Vec::new();
    for ring in rings {
        for s in 0..4 {
            m.push([ring[2 * s], ring[2 * s + 1], ring[(2 * s + 2) % 8]]); // corner-mid-corner side
        }
    }
    m
}

#[derive(Clone, PartialEq, Eq, Hash)]
struct ArrState {
    cells: [u8; 16],
    w_hand: u8,
    b_hand: u8,
    turn: u8,
}

struct ArrMorris {
    men: u8,
    adj: Vec<Vec<usize>>,
    mills: Vec<[usize; 3]>,
}

impl ArrMorris {
    fn new(men: u8) -> Self {
        Self { men, adj: adjacency(), mills: mills() }
    }
    fn in_mill(&self, cells: &[u8; 16], p: usize, player: u8) -> bool {
        self.mills
            .iter()
            .any(|m| m.contains(&p) && m.iter().all(|&q| cells[q] == player))
    }
    fn flipped(&self, s: &ArrState, cells: [u8; 16], mover_hand: u8) -> ArrState {
        let mut n = ArrState { cells, w_hand: s.w_hand, b_hand: s.b_hand, turn: if s.turn == W { B } else { W } };
        if s.turn == W {
            n.w_hand = mover_hand;
        } else {
            n.b_hand = mover_hand;
        }
        n
    }
}

impl RulesGame for ArrMorris {
    type State = ArrState;

    fn start(&self) -> ArrState {
        ArrState { cells: [E; 16], w_hand: self.men, b_hand: self.men, turn: W }
    }

    fn successors(&self, s: &ArrState) -> Vec<ArrState> {
        let stm = s.turn;
        let opp = if stm == W { B } else { W };
        let hand = if stm == W { s.w_hand } else { s.b_hand };
        let new_hand = if hand > 0 { hand - 1 } else { 0 };

        let mut moves: Vec<([u8; 16], usize)> = Vec::new();
        if hand > 0 {
            for p in 0..16 {
                if s.cells[p] == E {
                    let mut c = s.cells;
                    c[p] = stm;
                    moves.push((c, p));
                }
            }
        } else {
            for f in 0..16 {
                if s.cells[f] == stm {
                    for &t in &self.adj[f] {
                        if s.cells[t] == E {
                            let mut c = s.cells;
                            c[f] = E;
                            c[t] = stm;
                            moves.push((c, t));
                        }
                    }
                }
            }
        }

        let mut out = Vec::new();
        for (cells, dest) in moves {
            let formed = self.in_mill(&cells, dest, stm);
            let opp_on_board = cells.iter().filter(|&&x| x == opp).count();
            if formed && opp_on_board > 0 {
                let mut targets: Vec<usize> =
                    (0..16).filter(|&q| cells[q] == opp && !self.in_mill(&cells, q, opp)).collect();
                if targets.is_empty() {
                    targets = (0..16).filter(|&q| cells[q] == opp).collect();
                }
                for q in targets {
                    let mut c = cells;
                    c[q] = E;
                    out.push(self.flipped(s, c, new_hand));
                }
            } else {
                out.push(self.flipped(s, cells, new_hand));
            }
        }
        out
    }

    fn terminal(&self, s: &ArrState) -> Option<Outcome> {
        if s.w_hand == 0 && s.b_hand == 0 {
            let stm = s.turn;
            if s.cells.iter().filter(|&&x| x == stm).count() < 3 {
                return Some(Outcome::Loss);
            }
            let can_move = (0..16).any(|f| s.cells[f] == stm && self.adj[f].iter().any(|&t| s.cells[t] == E));
            if !can_move {
                return Some(Outcome::Loss);
            }
        }
        None
    }
}

fn stats<G: RulesGame>(game: &G) -> (usize, usize, usize, usize, Outcome) {
    let tb = solve_reachable_capped(game, CAP).expect("under cap");
    let start = tb.get(&game.start()).expect("start solved");
    (tb.len(), tb.count(Outcome::Win), tb.count(Outcome::Loss), tb.count(Outcome::Draw), start)
    // tb drops here, freeing memory before the next solve
}

fn main() {
    println!("== six men's morris: bitmask implementation ==");
    let (n1, w1, l1, d1, s1) = stats(&SixMensMorris);
    println!("  states {n1}  (win {w1}, loss {l1}, draw {d1})  start {s1:?}");

    println!("== six men's morris: independent array implementation ==");
    let (n2, w2, l2, d2, s2) = stats(&ArrMorris::new(6));
    println!("  states {n2}  (win {w2}, loss {l2}, draw {d2})  start {s2:?}");

    let agree = (n1, w1, l1, d1, s1) == (n2, w2, l2, d2, s2);
    println!("\n  AGREEMENT: {}", if agree { "YES — independent re-derivation matches" } else { "NO — MISMATCH" });
    assert!(agree, "independent implementations disagree");

    println!("\n== five men's morris (same board, 5 men) — consistency check ==");
    let (n5, w5, l5, d5, s5) = stats(&ArrMorris::new(5));
    println!("  states {n5}  (win {w5}, loss {l5}, draw {d5})  start {s5:?}");
}

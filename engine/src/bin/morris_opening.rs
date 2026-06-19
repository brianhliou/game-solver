//! Quick opening analysis for the writeup: after White's first placement, how do
//! Black's replies split into win/draw/loss (for Black)? Checks whether the
//! "inner ring is an early trap" pattern holds across opening types.

use game_solver::games::GenericMorris;
use game_solver::{solve_reachable, Outcome, RulesGame};

fn main() {
    let g = GenericMorris::six_mens();
    let sol = solve_reachable(&g);
    let start = RulesGame::start(&g);

    let kind = |p: u32| -> &'static str {
        match (p < 8, p % 2 == 0) {
            (true, true) => "outer corner",
            (true, false) => "outer mid",
            (false, true) => "inner corner",
            (false, false) => "inner mid",
        }
    };

    let mut seen: Vec<&str> = Vec::new();
    for s in RulesGame::successors(&g, &start) {
        let p = s.white.trailing_zeros();
        if seen.contains(&kind(p)) {
            continue; // one representative per symmetry class
        }
        seen.push(kind(p));
        // s: Black to move. Tally Black's replies by Black's outcome.
        let (mut bw, mut bd, mut bl) = (0, 0, 0);
        let (mut draw_pts, mut loss_pts) = (Vec::new(), Vec::new());
        for ns in RulesGame::successors(&g, &s) {
            let bp = ns.black.trailing_zeros(); // Black's placed point
            match sol.get(&ns).unwrap() {
                Outcome::Loss => { bw += 1; } // White lost -> Black wins
                Outcome::Win => { bl += 1; loss_pts.push(bp); }
                Outcome::Draw => { bd += 1; draw_pts.push(bp); }
            }
        }
        let allinner = |v: &Vec<u32>| v.iter().all(|&q| q >= 8);
        let allouter = |v: &Vec<u32>| v.iter().all(|&q| q < 8);
        println!(
            "White on {:>13} (pt {p:>2}) -> pos {:?}; Black: win {bw} draw {bd} loss {bl} | losing replies all-inner={} | drawing replies all-outer={}",
            kind(p),
            sol.get(&s).unwrap(),
            allinner(&loss_pts),
            allouter(&draw_pts),
        );
    }
}

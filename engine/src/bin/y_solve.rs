//! Strongly solve Y (the Schensted-Titus connection game) for one or more side
//! lengths and report each result: reachable positions, the win/loss split, the
//! value of the start, and the two Y-theorem invariants (no draws; the first
//! player wins every board). Usage: `y_solve [side ...]` (defaults to 1..=5).

use game_solver::games::y::Y;
use game_solver::reachable::RulesGame;
use game_solver::{solve_reachable, Outcome};

fn main() {
    let sides: Vec<usize> = std::env::args().skip(1).filter_map(|a| a.parse().ok()).collect();
    let sides = if sides.is_empty() { vec![1, 2, 3, 4, 5] } else { sides };

    for n in sides {
        let game = Y::new(n);
        let sol = solve_reachable(&game);
        let start_value = sol.get(&game.start()).expect("start must be solved");
        let draws = sol.count(Outcome::Draw);

        println!("Y side-{n} ({} cells):", game.cells);
        println!("  reachable positions: {}", sol.len());
        println!(
            "  win {}, loss {}, draw {}",
            sol.count(Outcome::Win),
            sol.count(Outcome::Loss),
            draws,
        );
        println!("  START value (first player to move): {start_value:?}");

        // The Y theorem: no draws, and the first player wins from the start.
        assert_eq!(draws, 0, "Y admits no draws — a draw means the board model is wrong");
        assert_eq!(start_value, Outcome::Win, "the first player should win every Y board");
        println!("  ✓ no draws; first player wins (consistent with the Y theorem)\n");
    }
}

//! Strongly solve three men's morris and report the result, including which
//! opening moves win — to settle the "first player wins by taking the centre"
//! question empirically.

use game_solver::games::ThreeMensMorris;
use game_solver::{solve, Game, Outcome};

fn main() {
    let game = ThreeMensMorris;
    let tb = solve(&game);

    let start = game.start();
    let start_value = tb.value(game.index(&start));
    println!("three men's morris (Tapatan: 3x3 with diagonals)");
    println!("  reachable indices: {}", tb.len());
    println!(
        "  win {}, loss {}, draw {}",
        tb.count(Outcome::Win),
        tb.count(Outcome::Loss),
        tb.count(Outcome::Draw),
    );
    println!("  START value (first player to move): {:?}", start_value);

    // White's nine opening placements. Each resulting position has Black to move,
    // so a Loss there means White's opening forces a win.
    println!("\n  opening analysis (value FOR WHITE after each first placement):");
    let labels = ["corner", "edge", "corner", "edge", "centre", "edge", "corner", "edge", "corner"];
    for i in 0..9 {
        let mut p = start;
        p.cells[i] = 1; // WHITE
        p.w_hand -= 1;
        p.turn = 2; // BLACK to move
        let black_value = tb.value(game.index(&p));
        let white_result = match black_value {
            Outcome::Loss => "WIN",
            Outcome::Win => "lose",
            Outcome::Draw => "draw",
        };
        println!("    point {i} ({:>6}): {}", labels[i], white_result);
    }

    // Sanity: the value of a position is well-defined and a Pos round-trips.
    let round = game.from_index(game.index(&start));
    assert_eq!(round, Some(start));
}

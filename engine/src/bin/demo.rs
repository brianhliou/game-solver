//! Solve tic-tac-toe and print the result — a quick demonstration of the engine.

use game_solver::games::TicTacToe;
use game_solver::{probe, solve, Game, Outcome};

fn main() {
    let game = TicTacToe;
    let tb = solve(&game);

    let value = probe(&game, &tb, &game.start());
    println!("tic-tac-toe: start position is a {:?}", value);
    println!(
        "  indexed positions: {}  (win {}, loss {}, draw {})",
        tb.len(),
        tb.count(Outcome::Win),
        tb.count(Outcome::Loss),
        tb.count(Outcome::Draw),
    );
}

//! Engine validation: the generic solver must reproduce tic-tac-toe's known value.

use game_solver::games::TicTacToe;
use game_solver::{probe, solve, Game, Outcome};

#[test]
fn start_is_a_draw() {
    let game = TicTacToe;
    let tb = solve(&game);
    // The textbook result: optimal play draws.
    assert_eq!(probe(&game, &tb, &game.start()), Outcome::Draw);
}

#[test]
fn solver_finds_wins_and_losses() {
    let game = TicTacToe;
    let tb = solve(&game);
    // A non-trivial solve: some positions are decided either way.
    assert!(tb.count(Outcome::Win) > 0, "expected some winning positions");
    assert!(tb.count(Outcome::Loss) > 0, "expected some losing positions");
}

#[test]
fn immediate_winning_move_is_a_win() {
    let game = TicTacToe;
    let tb = solve(&game);
    // X to move (two X, two O). Playing the top-right cell completes the top row,
    // so this position is a win for the side to move.
    let pos = TicTacToe::board("XX.OO....");
    assert_eq!(probe(&game, &tb, &pos), Outcome::Win);
}

#[test]
fn forced_block_then_draw() {
    let game = TicTacToe;
    let tb = solve(&game);
    // Empty board: with best play neither side can force a win.
    assert_eq!(probe(&game, &tb, &TicTacToe::board(".........")), Outcome::Draw);
}

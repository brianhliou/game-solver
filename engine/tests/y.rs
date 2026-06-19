//! Y (Schensted & Titus): the engine's connection-game check. Two invariants the
//! Y theorem guarantees — and that a wrong board model would violate — plus
//! regression anchors on the reachable counts.

use game_solver::games::y::Y;
use game_solver::reachable::RulesGame;
use game_solver::{solve_reachable, Outcome};

/// Strategy-stealing: the first player wins every Y board.
#[test]
fn first_player_wins_every_size() {
    for n in 1..=5 {
        let game = Y::new(n);
        let sol = solve_reachable(&game);
        assert_eq!(
            sol.get(&game.start()),
            Some(Outcome::Win),
            "Y side-{n}: first player should win"
        );
    }
}

/// The Y theorem: a full board always has exactly one winner, and the two players
/// can never connect at once — so no reachable position is a draw. A draw here
/// would mean the board topology or win detection is wrong.
#[test]
fn no_reachable_draws() {
    for n in 1..=5 {
        let game = Y::new(n);
        let sol = solve_reachable(&game);
        assert_eq!(sol.count(Outcome::Draw), 0, "Y side-{n}: Y admits no draws");
    }
}

/// Regression anchors: reachable positions and the win/loss split per side,
/// computed by this engine. A change here means the board model changed.
#[test]
fn reachable_counts_are_stable() {
    // (side, reachable, wins, losses)
    let expected = [
        (1usize, 2usize, 1usize, 1usize),
        (2, 13, 7, 6),
        (3, 257, 163, 94),
        (4, 16_505, 10_630, 5_875),
        (5, 3_337_584, 2_155_091, 1_182_493),
    ];
    for (n, reachable, wins, losses) in expected {
        let game = Y::new(n);
        let sol = solve_reachable(&game);
        assert_eq!(sol.len(), reachable, "Y side-{n}: reachable count");
        assert_eq!(sol.count(Outcome::Win), wins, "Y side-{n}: win count");
        assert_eq!(sol.count(Outcome::Loss), losses, "Y side-{n}: loss count");
        assert_eq!(wins + losses, reachable, "Y side-{n}: win+loss must cover all (no draws)");
    }
}

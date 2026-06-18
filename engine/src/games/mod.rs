//! Game plugins. Each is a thin implementation of [`crate::Game`] — the rules
//! only; the engine does the solving.

pub mod three_mens_morris;
pub mod tic_tac_toe;

pub use three_mens_morris::ThreeMensMorris;
pub use tic_tac_toe::TicTacToe;

//! Game plugins. Each is a thin implementation of [`crate::Game`] — the rules
//! only; the engine does the solving.

pub mod tic_tac_toe;

pub use tic_tac_toe::TicTacToe;

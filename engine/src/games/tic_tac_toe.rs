//! Tic-tac-toe (3x3). The engine's smoke test: a tiny game with an undisputed
//! value (a draw under optimal play). If the generic solver reproduces that, the
//! retrograde machinery is sound.

use crate::{Game, Outcome};

const EMPTY: u8 = 0;
const X: u8 = 1; // first player
const O: u8 = 2; // second player

const LINES: [[usize; 3]; 8] = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8], // rows
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8], // cols
    [0, 4, 8],
    [2, 4, 6], // diagonals
];

/// A board: nine cells, each `EMPTY`, `X`, or `O`.
#[derive(Clone, Copy, PartialEq, Eq, Debug)]
pub struct Board {
    pub cells: [u8; 9],
}

pub struct TicTacToe;

impl Board {
    fn counts(&self) -> (u32, u32) {
        let x = self.cells.iter().filter(|&&c| c == X).count() as u32;
        let o = self.cells.iter().filter(|&&c| c == O).count() as u32;
        (x, o)
    }

    /// Whose turn it is. X moves first, so even total = X to move.
    fn to_move(&self) -> u8 {
        let (x, o) = self.counts();
        if x == o {
            X
        } else {
            O
        }
    }

    fn has_line(&self, player: u8) -> bool {
        LINES
            .iter()
            .any(|l| l.iter().all(|&i| self.cells[i] == player))
    }

    fn is_full(&self) -> bool {
        self.cells.iter().all(|&c| c != EMPTY)
    }
}

impl Game for TicTacToe {
    type State = Board;

    fn num_states(&self) -> u64 {
        3u64.pow(9) // 19_683: every base-3 board, legal or not
    }

    fn index(&self, b: &Board) -> u64 {
        b.cells.iter().fold(0u64, |acc, &c| acc * 3 + c as u64)
    }

    fn from_index(&self, mut i: u64) -> Option<Board> {
        let mut cells = [EMPTY; 9];
        for slot in cells.iter_mut().rev() {
            *slot = (i % 3) as u8;
            i /= 3;
        }
        let b = Board { cells };
        // Reachable boards have #X == #O (X to move) or #X == #O + 1 (O to move).
        let (x, o) = b.counts();
        if x == o || x == o + 1 {
            Some(b)
        } else {
            None
        }
    }

    fn start(&self) -> Board {
        Board { cells: [EMPTY; 9] }
    }

    fn successors(&self, b: &Board) -> Vec<Board> {
        // `solve` only calls this on non-terminal boards, so a move always exists.
        let mark = b.to_move();
        let mut out = Vec::new();
        for i in 0..9 {
            if b.cells[i] == EMPTY {
                let mut next = *b;
                next.cells[i] = mark;
                out.push(next);
            }
        }
        out
    }

    fn terminal(&self, b: &Board) -> Option<Outcome> {
        let xline = b.has_line(X);
        let oline = b.has_line(O);
        match (xline, oline) {
            // Two completed lines is unreachable; keep it inert.
            (true, true) => Some(Outcome::Draw),
            // Exactly one player has a line: they just moved, so the side to move
            // is the loser.
            (true, false) | (false, true) => Some(Outcome::Loss),
            (false, false) => {
                if b.is_full() {
                    Some(Outcome::Draw)
                } else {
                    None
                }
            }
        }
    }
}

impl TicTacToe {
    /// Build a board from a 9-char string ('.', 'X', 'O'), row-major.
    pub fn board(s: &str) -> Board {
        let mut cells = [EMPTY; 9];
        for (i, ch) in s.chars().enumerate() {
            cells[i] = match ch {
                'X' => X,
                'O' => O,
                _ => EMPTY,
            };
        }
        Board { cells }
    }
}

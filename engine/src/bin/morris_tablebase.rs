//! Emit a morris tablebase as a packed 2-bit WLD file addressed by the dense
//! index, plus a JSON sidecar. Works for any men-per-side on the two-ring board
//! (4, 5, 6 men's), so the explorer can offer the family as a toggle.
//!
//! Encoding: 2 bits per dense index, little-endian within each byte.
//!   0 = not reachable   1 = win   2 = loss   3 = draw   (side to move)
//!
//! Run: `cargo run --release --bin morris_tablebase -- <men> <out-prefix>`
//!   e.g. `... -- 6 artifacts/morris6`  ->  artifacts/morris6.wld + .meta.json

use game_solver::games::generic_morris::Board;
use game_solver::games::GenericMorris;
use game_solver::{solve_reachable, Game, Outcome, RulesGame};
use std::io::Write;

fn main() {
    let mut args = std::env::args().skip(1);
    let men: u8 = args.next().and_then(|s| s.parse().ok()).unwrap_or(6);
    let out = args.next().unwrap_or_else(|| format!("artifacts/morris{men}"));

    let g = GenericMorris::new(Board::rings(2, men));
    let total = Game::num_states(&g);

    eprintln!("solving {men} men's morris (solve_reachable)…");
    let sol = solve_reachable(&g);
    let (win, loss, draw) = (
        sol.count(Outcome::Win),
        sol.count(Outcome::Loss),
        sol.count(Outcome::Draw),
    );
    let start = RulesGame::start(&g);
    let start_val = sol.get(&start).unwrap();
    eprintln!("  reachable {}  (win {win}, loss {loss}, draw {draw})  start {start_val:?}", sol.len());

    let mut packed = vec![0u8; (total as usize).div_ceil(4)];
    for (s, o) in sol.iter() {
        let code: u8 = match o {
            Outcome::Win => 1,
            Outcome::Loss => 2,
            Outcome::Draw => 3,
        };
        let idx = Game::index(&g, s) as usize;
        packed[idx >> 2] |= code << ((idx & 3) * 2);
    }

    let wld_path = format!("{out}.wld");
    let meta_path = format!("{out}.meta.json");
    if let Some(parent) = std::path::Path::new(&wld_path).parent() {
        std::fs::create_dir_all(parent).unwrap();
    }
    std::fs::File::create(&wld_path).unwrap().write_all(&packed).unwrap();
    let meta = format!(
        "{{\n  \"game\": \"{men}-mens-morris\",\n  \"board\": \"two-ring-16pt-no-flying\",\n  \"men\": {men},\n  \"encoding\": \"2bit-le; 0=unreachable 1=win 2=loss 3=draw; addressed by dense index\",\n  \"num_states\": {total},\n  \"reachable\": {},\n  \"win\": {win},\n  \"loss\": {loss},\n  \"draw\": {draw},\n  \"start_value\": \"{start_val:?}\",\n  \"bytes\": {}\n}}\n",
        sol.len(),
        packed.len()
    );
    std::fs::write(&meta_path, meta).unwrap();
    eprintln!("wrote {wld_path} ({:.1} MiB) and {meta_path}", packed.len() as f64 / (1u64 << 20) as f64);
}

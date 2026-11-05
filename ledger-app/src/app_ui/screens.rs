//! The screens of Tomoshibi, built directly on NBGL layouts.
//!
//! The standard review flow is three pages of a transaction. Here the flame is
//! the subject: it sleeps while nothing needs the person, wakes when a skill asks
//! for a key, and the whole range is read on one page while holding the button.
use alloc::ffi::CString;
use core::ffi::{c_char, c_int};
use core::mem::MaybeUninit;
use core::ptr::null_mut;
use ledger_device_sdk::include_gif;
use ledger_device_sdk::io::{Comm, DecodedEventType, Reply};
use ledger_device_sdk::nbgl::NbglGlyph;
use ledger_secure_sdk_sys::*;

const ASLEEP: NbglGlyph = NbglGlyph::from_include(include_gif!("glyphs/flame_asleep.png", NBGL));
const AWAKE_A: NbglGlyph = NbglGlyph::from_include(include_gif!("glyphs/flame_awake_a.png", NBGL));
const AWAKE_B: NbglGlyph = NbglGlyph::from_include(include_gif!("glyphs/flame_awake_b.png", NBGL));
const HAPPY: NbglGlyph = NbglGlyph::from_include(include_gif!("glyphs/flame_happy.png", NBGL));
const GUARD: NbglGlyph = NbglGlyph::from_include(include_gif!("glyphs/flame_guard.png", NBGL));
const GONE: NbglGlyph = NbglGlyph::from_include(include_gif!("glyphs/flame_gone.png", NBGL));

// Tokens passed back by NBGL when something on screen is touched.
const T_TAP: u8 = 1;
const T_LEFT: u8 = 2;
const T_RIGHT: u8 = 3;
const T_HOLD: u8 = 4;
const T_BACK: u8 = 5;
const T_NONE: u8 = 0xFE;

/// What the person did on a blocking screen.
#[derive(Clone, Copy, PartialEq)]
pub enum Choice {
    None,
    Left,
    Right,
    Held,
    Back,
    Tapped,
    TimedOut,
}

/// The APDU status sent to a host that talks while a screen is waiting for the person.
const SW_BUSY: u16 = 0x6FAA;
const TICK_MS: u32 = 300;

static mut LAYOUT: *mut nbgl_layout_t = null_mut();
static mut ICON: MaybeUninit<nbgl_icon_details_t> = MaybeUninit::uninit();
static mut CHOICE: Choice = Choice::None;
/// Ticks left before a self-closing screen closes. 0 means "does not close by itself".
static mut TICKS_LEFT: u16 = 0;
/// Frames left in the idle screen's wake-up animation.
static mut WIGGLE_LEFT: u8 = 0;
static mut WIGGLE_STEP: u8 = 0;
/// How many lights this device has lit since the app was opened.
static mut LIT: u8 = 0;
static mut LIT_TEXT: [u8; 12] = [0; 12];

fn tune() -> tune_index_e {
    NB_TUNES as tune_index_e
}

unsafe extern "C" fn on_action(token: c_int, _index: u8) {
    CHOICE = match token as u8 {
        T_LEFT => Choice::Left,
        T_RIGHT => Choice::Right,
        T_HOLD => Choice::Held,
        T_BACK => Choice::Back,
        T_TAP => Choice::Tapped,
        _ => CHOICE,
    };
}

unsafe extern "C" fn on_tick() {
    if TICKS_LEFT > 0 {
        TICKS_LEFT -= 1;
        if TICKS_LEFT == 0 {
            CHOICE = Choice::TimedOut;
        }
    }
}

/// Starts a fresh full-screen layout. `tappable` makes the whole body a button.
/// `tick` is called every `TICK_MS` while the screen is up.
unsafe fn begin(tappable: bool, tick: Option<unsafe extern "C" fn()>) {
    begin_with(tappable, tick, on_action)
}

unsafe fn begin_with(
    tappable: bool,
    tick: Option<unsafe extern "C" fn()>,
    action: unsafe extern "C" fn(c_int, u8),
) {
    if !LAYOUT.is_null() {
        nbgl_layoutRelease(LAYOUT);
    }
    let mut desc: nbgl_layoutDescription_t = core::mem::zeroed();
    desc.modal = false;
    desc.withLeftBorder = false;
    if tappable {
        // An empty text makes the body tappable without printing a hint.
        desc.tapActionText = c"".as_ptr();
        desc.tapActionToken = T_TAP;
    }
    desc.tapTuneId = tune();
    desc.onActionCallback = Some(action);
    if tick.is_some() {
        desc.ticker.tickerCallback = tick;
        desc.ticker.tickerValue = TICK_MS;
        desc.ticker.tickerIntervale = TICK_MS;
    }
    LAYOUT = nbgl_layoutGet(&desc);
}

/// The flame in the middle, with up to three lines of text under it.
unsafe fn center(glyph: &NbglGlyph, title: *const c_char, description: *const c_char) {
    (&raw mut ICON).cast::<nbgl_icon_details_t>().write(glyph.into());
    let mut c = nbgl_contentCenter_t::default();
    c.illustrType = ICON_ILLUSTRATION;
    c.icon = (&raw const ICON).cast::<nbgl_icon_details_t>();
    c.title = title;
    c.description = description;
    nbgl_layoutAddContentCenter(LAYOUT, &c);
}

unsafe fn finish(mode: nbgl_refresh_mode_t) {
    nbgl_layoutDraw(LAYOUT);
    nbgl_refreshSpecial(mode);
}

/// Runs the device's event loop until the person makes a choice. A host that
/// sends a command meanwhile is told the device is busy; it cannot answer for them.
fn wait(comm: &mut Comm) -> Choice {
    unsafe { CHOICE = Choice::None };
    loop {
        if let DecodedEventType::Apdu { .. } = comm.next_event().into_type() {
            let _ = comm.send(&[], Reply(SW_BUSY));
        }
        let choice = unsafe { CHOICE };
        if choice != Choice::None {
            return choice;
        }
    }
}

fn lit_text() -> *const c_char {
    unsafe {
        let n = LIT;
        let buf = &mut *(&raw mut LIT_TEXT);
        let mut i = 0;
        if n >= 100 {
            buf[i] = b'0' + n / 100;
            i += 1;
        }
        if n >= 10 {
            buf[i] = b'0' + (n / 10) % 10;
            i += 1;
        }
        buf[i] = b'0' + n % 10;
        i += 1;
        for &b in b" lit" {
            buf[i] = b;
            i += 1;
        }
        buf[i] = 0;
        buf.as_ptr() as *const c_char
    }
}

/// The idle screen: the flame sleeps, and nothing is asked of the person.
/// Does not block; the main loop keeps serving commands.
pub fn show_idle() {
    unsafe {
        WIGGLE_LEFT = 0;
        TICKS_LEFT = 0;
        CHOICE = Choice::None;
        draw_idle(&ASLEEP, c"All quiet.".as_ptr(), false, FULL_COLOR_CLEAN_REFRESH);
    }
}

unsafe fn draw_idle(glyph: &NbglGlyph, title: *const c_char, ticking: bool, mode: nbgl_refresh_mode_t) {
    begin_with(true, if ticking { Some(on_idle_tick) } else { None }, on_idle_action);
    center(glyph, title, c"Nothing needs you right now.".as_ptr());
    nbgl_layoutAddSplitFooter(LAYOUT, c"Quit".as_ptr(), T_LEFT, lit_text(), T_NONE, tune());
    finish(mode);
}

unsafe extern "C" fn on_idle_tick() {
    if WIGGLE_LEFT > 1 {
        WIGGLE_LEFT -= 1;
        WIGGLE_STEP = WIGGLE_STEP.wrapping_add(1);
        let glyph = if WIGGLE_STEP % 2 == 0 { AWAKE_A } else { AWAKE_B };
        draw_idle(&glyph, c"Hm? I'm here.".as_ptr(), true, BLACK_AND_WHITE_FAST_REFRESH);
    } else if WIGGLE_LEFT == 1 {
        WIGGLE_LEFT = 0;
        draw_idle(&ASLEEP, c"All quiet.".as_ptr(), false, FULL_COLOR_CLEAN_REFRESH);
    }
}

/// Touches on the idle screen are handled right here, because the main loop is
/// parked waiting for the next command and never sees them.
unsafe extern "C" fn on_idle_action(token: c_int, _index: u8) {
    match token as u8 {
        T_LEFT => ledger_device_sdk::exit_app(0),
        T_TAP => {
            WIGGLE_LEFT = 6;
            WIGGLE_STEP = 0;
            draw_idle(&AWAKE_A, c"Hm? I'm here.".as_ptr(), true, BLACK_AND_WHITE_FAST_REFRESH);
        }
        _ => {}
    }
}

/// "A skill is asking for a key". Returns true if the person wants to see it.
pub fn ask(comm: &mut Comm, key: &str) -> bool {
    let key_c = CString::new(key).unwrap_or_default();
    unsafe {
        begin(false, None);
        center(&AWAKE_A, c"A skill is asking\nfor a key".as_ptr(), key_c.as_ptr());
        nbgl_layoutAddSplitFooter(LAYOUT, c"Not now".as_ptr(), T_LEFT, c"See it".as_ptr(), T_RIGHT, tune());
        finish(FULL_COLOR_CLEAN_REFRESH);
    }
    wait(comm) == Choice::Right
}

/// One page with the whole range, and the hold button under it. Returns true
/// only if the person held the button to the end. The key's name is the title,
/// so the three rows under it fit above the button without scrolling.
pub fn review(comm: &mut Comm, title: &str, rows: &[(&core::ffi::CStr, &str)]) -> bool {
    let title_c = CString::new(title).unwrap_or_default();
    let values: alloc::vec::Vec<CString> = rows.iter().map(|(_, v)| CString::new(*v).unwrap_or_default()).collect();
    let mut pairs: alloc::vec::Vec<nbgl_contentTagValue_t> = alloc::vec::Vec::with_capacity(rows.len());
    for (i, (name, _)) in rows.iter().enumerate() {
        let mut pair: nbgl_contentTagValue_t = unsafe { core::mem::zeroed() };
        pair.item = name.as_ptr();
        pair.value = values[i].as_ptr();
        pairs.push(pair);
    }
    unsafe {
        begin(false, None);
        let mut header: nbgl_layoutHeader_t = core::mem::zeroed();
        header.type_ = HEADER_BACK_AND_TEXT;
        header.separationLine = true;
        header.__bindgen_anon_1.backAndText.text = title_c.as_ptr();
        header.__bindgen_anon_1.backAndText.token = T_BACK;
        header.__bindgen_anon_1.backAndText.tuneId = tune();
        nbgl_layoutAddHeader(LAYOUT, &header);

        let mut list: nbgl_layoutTagValueList_t = core::mem::zeroed();
        list.pairs = pairs.as_ptr();
        list.nbPairs = pairs.len() as u8;
        list.nbMaxLinesForValue = 2;
        list.smallCaseForValue = true;
        list.wrapping = true;
        nbgl_layoutAddTagValueList(LAYOUT, &list);

        nbgl_layoutAddLongPressButton(LAYOUT, c"Hold to light".as_ptr(), T_HOLD, tune());
        finish(FULL_COLOR_CLEAN_REFRESH);
    }
    wait(comm) == Choice::Held
}

/// Shows a screen that closes by itself after `ticks`, or when tapped.
fn show_for(comm: &mut Comm, ticks: u16) {
    unsafe { TICKS_LEFT = ticks };
    wait(comm);
    unsafe { TICKS_LEFT = 0 };
}

/// The person held the button: a light is lit.
pub fn lit(comm: &mut Comm, summary: &str) {
    let summary_c = CString::new(summary).unwrap_or_default();
    unsafe {
        LIT = LIT.saturating_add(1);
        begin(true, Some(on_tick));
        center(&HAPPY, c"A light is lit.".as_ptr(), summary_c.as_ptr());
        finish(FULL_COLOR_CLEAN_REFRESH);
    }
    show_for(comm, 10);
}

/// The person said no: nothing was signed.
pub fn not_lit(comm: &mut Comm) {
    unsafe {
        begin(true, Some(on_tick));
        center(&ASLEEP, c"Nothing was signed.".as_ptr(), c"The skill did not get the key.".as_ptr());
        finish(FULL_COLOR_CLEAN_REFRESH);
    }
    show_for(comm, 8);
}

/// A request outside the range was stopped. Black screen, so it cannot be
/// mistaken for anything else. The person does not have to do anything.
pub fn blocked(comm: &mut Comm, what: &str) {
    let what_c = CString::new(what).unwrap_or_default();
    unsafe {
        begin(true, None);
        nbgl_layoutInvertBackground(LAYOUT);
        // No footer here: a footer keeps its dark text and vanishes on the black screen.
        (&raw mut ICON).cast::<nbgl_icon_details_t>().write((&GUARD).into());
        let mut c = nbgl_contentCenter_t::default();
        c.illustrType = ICON_ILLUSTRATION;
        c.icon = (&raw const ICON).cast::<nbgl_icon_details_t>();
        c.title = c"BLOCKED".as_ptr();
        c.description = what_c.as_ptr();
        c.subText = c"Nothing was sent. Tap to close.".as_ptr();
        nbgl_layoutAddContentCenter(LAYOUT, &c);
        finish(FULL_COLOR_CLEAN_REFRESH);
    }
    wait(comm);
}

/// The skill changed after it was allowed, so its light went out.
/// Returns true if the person wants to look at it again.
pub fn went_out(comm: &mut Comm, what: &str) -> bool {
    let what_c = CString::new(what).unwrap_or_default();
    unsafe {
        LIT = LIT.saturating_sub(1);
        begin(false, None);
        center(&GONE, c"The light went out.".as_ptr(), what_c.as_ptr());
        nbgl_layoutAddSplitFooter(LAYOUT, c"Leave it off".as_ptr(), T_LEFT, c"Look again".as_ptr(), T_RIGHT, tune());
        finish(FULL_COLOR_CLEAN_REFRESH);
    }
    wait(comm) == Choice::Right
}

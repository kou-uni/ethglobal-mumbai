//! Asking for a key: the flame wakes, the person reads the range on one page,
//! and holds the button to light it.
use crate::app_ui::screens;
use crate::handlers::sign_permit::PermitRequest;
use crate::AppSW;

use alloc::format;
use alloc::string::String;
use ledger_device_sdk::io::Comm;

const MONTHS: [&str; 12] = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

/// Unix seconds to (day, month index, year, hour, minute) in UTC.
/// Civil-from-days (H. Hinnant).
fn civil(ts: u64) -> (i64, usize, i64, u64, u64) {
    let days = (ts / 86_400) as i64;
    let secs = ts % 86_400;
    let z = days + 719_468;
    let era = z.div_euclid(146_097);
    let doe = z.rem_euclid(146_097);
    let yoe = (doe - doe / 1_460 + doe / 36_524 - doe / 146_096) / 365;
    let doy = doe - (365 * yoe + yoe / 4 - yoe / 100);
    let mp = (5 * doy + 2) / 153;
    let day = doy - (153 * mp + 2) / 5 + 1;
    let month = if mp < 10 { mp + 3 } else { mp - 9 };
    let year = yoe + era * 400 + if month <= 2 { 1 } else { 0 };
    (day, (month - 1) as usize, year, secs / 3_600, (secs % 3_600) / 60)
}

/// `7 Nov 2026, 09:00 UTC`. The device has no clock and no time zone, so the
/// only honest thing it can show is the absolute time in UTC.
pub fn format_utc(ts: u64) -> String {
    let (day, month, year, hour, minute) = civil(ts);
    format!("{} {} {}, {:02}:{:02} UTC", day, MONTHS[month], year, hour, minute)
}

/// `7 Nov`, for the one-line summary after lighting.
pub fn format_day(ts: u64) -> String {
    let (day, month, _, _, _) = civil(ts);
    format!("{} {}", day, MONTHS[month])
}

/// Shows the request and returns true only if the person held the button.
pub fn ui_display_permit(comm: &mut Comm, req: &PermitRequest) -> Result<bool, AppSW> {
    if !screens::ask(comm, req.key) {
        return Ok(false);
    }
    let can = format!("{}, up to {}x", req.scope, req.max_calls);
    let ends = format_utc(req.expiry);
    let title = format!("Lend {}?", req.key);
    let rows = [
        (c"Goes to", req.target),
        (c"Can", can.as_str()),
        (c"Ends", ends.as_str()),
    ];
    Ok(screens::review(comm, title.as_str(), &rows))
}

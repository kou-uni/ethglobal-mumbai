//! The review screen: four lines a person can read, then hold to allow.
//! Derived from the boilerplate's sign UI (Ledger SAS, Apache-2.0).
use crate::handlers::sign_permit::PermitRequest;
use crate::settings::Settings;
use crate::AppSW;

use alloc::format;
use alloc::string::String;
use ledger_device_sdk::include_gif;
use ledger_device_sdk::io::Comm;
use ledger_device_sdk::nbgl::{Field, NbglGlyph, NbglReview};

/// Unix seconds to `YYYY-MM-DD HH:MM UTC`. The device has no clock and no time
/// zone, so the only honest thing it can show is the absolute time in UTC.
fn format_utc(ts: u64) -> String {
    let days = (ts / 86_400) as i64;
    let secs = ts % 86_400;
    // Civil-from-days (H. Hinnant), valid for the whole u64 range we accept.
    let z = days + 719_468;
    let era = z.div_euclid(146_097);
    let doe = z.rem_euclid(146_097);
    let yoe = (doe - doe / 1_460 + doe / 36_524 - doe / 146_096) / 365;
    let doy = doe - (365 * yoe + yoe / 4 - yoe / 100);
    let mp = (5 * doy + 2) / 153;
    let day = doy - (153 * mp + 2) / 5 + 1;
    let month = if mp < 10 { mp + 3 } else { mp - 9 };
    let year = yoe + era * 400 + if month <= 2 { 1 } else { 0 };
    format!(
        "{:04}-{:02}-{:02} {:02}:{:02} UTC",
        year,
        month,
        day,
        secs / 3_600,
        (secs % 3_600) / 60
    )
}

/// Shows the permit and returns true if the person held the button.
pub fn ui_display_permit(comm: &mut Comm, req: &PermitRequest) -> Result<bool, AppSW> {
    let can_do = format!("{} (up to {} times)", req.scope, req.max_calls);
    let until = format_utc(req.expiry);

    let fields = [
        Field {
            name: "Key",
            value: req.key,
        },
        Field {
            name: "Send to",
            value: req.target,
        },
        Field {
            name: "Can do",
            value: can_do.as_str(),
        },
        Field {
            name: "Until",
            value: until.as_str(),
        },
        Field {
            name: "Skill version",
            value: req.version,
        },
    ];

    #[cfg(any(target_os = "stax", target_os = "flex"))]
    const STAR: NbglGlyph = NbglGlyph::from_include(include_gif!("glyphs/crab_64x64.gif", NBGL));
    #[cfg(target_os = "apex_p")]
    const STAR: NbglGlyph = NbglGlyph::from_include(include_gif!("glyphs/crab_48x48.png", NBGL));
    #[cfg(any(target_os = "nanosplus", target_os = "nanox"))]
    const STAR: NbglGlyph = NbglGlyph::from_include(include_gif!("icons/crab_14x14.gif", NBGL));

    let review: NbglReview = NbglReview::new()
        .titles("Let this skill\nuse your key?", "", "Hold to allow")
        .glyph(&STAR);

    // The first setting switch adds the skill version as a fifth line.
    let settings: Settings = Default::default();
    if settings.get_element(0) == 0 {
        Ok(review.show(comm, &fields[0..4]))
    } else {
        Ok(review.show(comm, &fields))
    }
}

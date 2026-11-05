/*****************************************************************************
 *   Tomoshibi, derived from Ledger App Boilerplate Rust.
 *   (c) 2023 Ledger SAS.
 *
 *  Licensed under the Apache License, Version 2.0 (the "License");
 *  you may not use this file except in compliance with the License.
 *  You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 *  Unless required by applicable law or agreed to in writing, software
 *  distributed under the License is distributed on an "AS IS" BASIS,
 *  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *  See the License for the specific language governing permissions and
 *  limitations under the License.
 *****************************************************************************/

#![no_std]
#![no_main]

mod eip712;
mod utils;
mod app_ui {
    pub mod address;
    pub mod screens;
    pub mod sign;
}
mod handlers {
    pub mod get_public_key;
    pub mod get_version;
    pub mod sign_permit;
}

use alloc::string::String;
use app_ui::screens;
use handlers::{
    get_public_key::handler_get_public_key,
    get_version::handler_get_version,
    sign_permit::{handler_sign_permit, PermitContext},
};
use ledger_device_sdk::io::{self, init_comm, ApduHeader, Command, Reply, StatusWords};

ledger_device_sdk::set_panic!(ledger_device_sdk::exiting_panic);

// Required for using String, Vec, format!...
extern crate alloc;

ledger_device_sdk::define_comm!(COMM);

// P2 for last APDU to receive.
const P2_SIGN_LAST: u8 = 0x00;
// P2 for more APDU to receive.
const P2_SIGN_MORE: u8 = 0x80;
// P1 for first APDU number.
const P1_SIGN_START: u8 = 0x00;
// P1 for maximum APDU number.
const P1_SIGN_MAX: u8 = 0x03;

// Application status words.
#[repr(u16)]
#[derive(Clone, Copy, PartialEq)]
pub enum AppSW {
    Deny = 0x6985,
    WrongP1P2 = 0x6A86,
    InsNotSupported = 0x6D00,
    ClaNotSupported = 0x6E00,
    CommError = 0x6F00,
    TxDisplayFail = 0xB001,
    AddrDisplayFail = 0xB002,
    TxWrongLength = 0xB004,
    TxParsingFail = 0xB005,
    TxHashFail = 0xB006,
    TxSignFail = 0xB008,
    KeyDeriveFail = 0xB009,
    VersionParsingFail = 0xB00A,
    WrongApduLength = StatusWords::BadLen as u16,
    Ok = 0x9000,
}

impl From<AppSW> for Reply {
    fn from(sw: AppSW) -> Reply {
        Reply(sw as u16)
    }
}

impl From<io::CommError> for AppSW {
    fn from(_e: io::CommError) -> Self {
        AppSW::CommError
    }
}

/// What the host tells the device after the fact. These are notices, not
/// requests: nothing is signed, and the person does not have to do anything.
#[derive(Debug, Clone, Copy, PartialEq)]
pub enum Notice {
    /// A request outside the allowed range was stopped by the Broker.
    Blocked,
    /// The skill changed after it was allowed, so its light went out.
    WentOut,
}

/// Possible input commands received through APDUs.
#[derive(Debug)]
pub enum Instruction {
    GetVersion,
    GetAppName,
    GetPubkey { display: bool },
    SignPermit { chunk: u8, more: bool },
    Notify(Notice),
}

impl TryFrom<ApduHeader> for Instruction {
    type Error = AppSW;

    fn try_from(value: ApduHeader) -> Result<Self, Self::Error> {
        match (value.ins, value.p1, value.p2) {
            (3, 0, 0) => Ok(Instruction::GetVersion),
            (4, 0, 0) => Ok(Instruction::GetAppName),
            (5, 0 | 1, 0) => Ok(Instruction::GetPubkey {
                display: value.p1 != 0,
            }),
            (6, P1_SIGN_START, P2_SIGN_MORE)
            | (6, 1..=P1_SIGN_MAX, P2_SIGN_LAST | P2_SIGN_MORE) => Ok(Instruction::SignPermit {
                chunk: value.p1,
                more: value.p2 == P2_SIGN_MORE,
            }),
            (7, 1, 0) => Ok(Instruction::Notify(Notice::Blocked)),
            (7, 2, 0) => Ok(Instruction::Notify(Notice::WentOut)),
            (3..=7, _, _) => Err(AppSW::WrongP1P2),
            (_, _, _) => Err(AppSW::InsNotSupported),
        }
    }
}

/// The screen to show once the reply has gone back to the host.
enum After {
    Nothing,
    Lit,
    NotLit,
    Notice(Notice, String),
}

#[no_mangle]
extern "C" fn sample_main(_arg0: u32) {
    // Accept only APDUs from the 0xe0 class; anything else is answered with BadCla.
    let comm = init_comm(&COMM);
    comm.set_expected_cla(0xe0);

    let mut ctx = PermitContext::new();
    screens::show_idle();

    loop {
        // Touches and ticks on the idle screen are served inside this call.
        let command = comm.next_command();

        let ins = match command.decode::<Instruction>() {
            Ok(ins) => ins,
            Err(sw) => {
                let _ = command.reply(&[], sw);
                continue;
            }
        };

        let mut after = After::Nothing;
        let status = match handle_apdu(command, &ins, &mut ctx, &mut after) {
            Ok(reply) => {
                let _ = reply.send(AppSW::Ok);
                AppSW::Ok
            }
            Err(sw) => {
                let _ = comm.send(&[], sw);
                sw
            }
        };

        if let Instruction::SignPermit { .. } = ins {
            if ctx.finished() {
                after = if status == AppSW::Ok { After::Lit } else { After::NotLit };
            }
        }
        match after {
            After::Nothing => {
                // Chunks and read-only commands do not touch the screen.
                if !matches!(ins, Instruction::GetPubkey { display: true }) {
                    continue;
                }
            }
            After::Lit => screens::lit(comm, ctx.summary.as_str()),
            After::NotLit => screens::not_lit(comm),
            After::Notice(Notice::Blocked, what) => screens::blocked(comm, what.as_str()),
            After::Notice(Notice::WentOut, what) => {
                let _ = screens::went_out(comm, what.as_str());
            }
        }
        screens::show_idle();
    }
}

fn handle_apdu<'a>(
    command: Command<'a>,
    ins: &Instruction,
    ctx: &mut PermitContext,
    after: &mut After,
) -> Result<io::CommandResponse<'a>, AppSW> {
    match ins {
        Instruction::GetAppName => {
            let mut response = command.into_response();
            response.append(env!("CARGO_PKG_NAME").as_bytes())?;
            Ok(response)
        }
        Instruction::GetVersion => handler_get_version(command),
        Instruction::GetPubkey { display } => handler_get_public_key(command, *display),
        Instruction::SignPermit { chunk, more } => handler_sign_permit(command, *chunk, *more, ctx),
        Instruction::Notify(notice) => {
            // The text is shown as-is. It comes from the host, so it is a notice
            // and nothing more: the device does not verify it yet.
            let text = core::str::from_utf8(command.get_data()).map_err(|_| AppSW::TxParsingFail)?;
            *after = After::Notice(*notice, String::from(text));
            Ok(command.into_response())
        }
    }
}

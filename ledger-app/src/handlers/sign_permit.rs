//! SIGN_PERMIT: show the range a skill is asking for, and sign it only if the
//! person holds the button. Derived from the boilerplate's sign_tx handler
//! (Ledger SAS, Apache-2.0).
use crate::app_ui::sign::{format_day, ui_display_permit};
use crate::eip712::{self, Permit};
use crate::utils::{get_address_hash_from_pubkey, get_pubkey_from_path, Bip32Path};
use crate::AppSW;
use alloc::format;
use alloc::string::String;
use alloc::vec::Vec;
use ledger_device_sdk::ecc::{Secp256k1, SeedDerive};
use ledger_device_sdk::io::{Command, CommandResponse};

use serde::Deserialize;
use serde_json_core::from_slice;

const MAX_PERMIT_LEN: usize = 510;

/// What the host sends. There is no `holder` and no digest on purpose: the
/// holder is this device's own address, and the digest is computed here.
/// `key` is the human-readable label; the signed `bytes32 key` is its keccak256.
#[derive(Deserialize)]
pub struct PermitRequest<'a> {
    #[serde(with = "hex::serde")]
    pub skill: [u8; 32],
    pub version: &'a str,
    pub key: &'a str,
    pub target: &'a str,
    pub scope: &'a str,
    #[serde(rename = "maxCalls")]
    pub max_calls: u32,
    pub expiry: u64,
    pub nonce: u64,
}

/// State kept between APDU chunks.
pub struct PermitContext {
    raw: Vec<u8>,
    path: Bip32Path,
    review_finished: bool,
    /// One line for the "A light is lit." screen, set when a permit is signed.
    pub summary: String,
}

impl PermitContext {
    pub fn new() -> PermitContext {
        PermitContext {
            raw: Vec::new(),
            path: Default::default(),
            review_finished: false,
            summary: String::new(),
        }
    }

    pub fn finished(&self) -> bool {
        self.review_finished
    }

    fn reset(&mut self) {
        self.raw.clear();
        self.path = Default::default();
        self.review_finished = false;
    }
}

/// Chunk 0 carries the BIP32 path. Later chunks carry the permit as JSON.
pub fn handler_sign_permit<'a>(
    command: Command<'a>,
    chunk: u8,
    more: bool,
    ctx: &mut PermitContext,
) -> Result<CommandResponse<'a>, AppSW> {
    let data = command.get_data();
    if chunk == 0 {
        ctx.reset();
        ctx.path = data.try_into()?;
        return Ok(command.into_response());
    }

    if ctx.raw.len() + data.len() > MAX_PERMIT_LEN {
        return Err(AppSW::TxWrongLength);
    }
    ctx.raw.extend(data);
    if more {
        ctx.review_finished = false;
        return Ok(command.into_response());
    }

    let (req, _): (PermitRequest, usize) =
        from_slice(&ctx.raw).map_err(|_| AppSW::TxParsingFail)?;

    // The holder is whoever holds this device. The host cannot choose it.
    let pubkey = get_pubkey_from_path(&ctx.path)?;
    let address_hash = get_address_hash_from_pubkey(&pubkey);
    let mut holder = [0u8; 20];
    holder.copy_from_slice(&address_hash[12..]);

    let permit = Permit {
        holder,
        skill: req.skill,
        version: req.version,
        key: eip712::keccak(req.key.as_bytes()),
        target: req.target,
        scope: req.scope,
        max_calls: req.max_calls,
        expiry: req.expiry,
        nonce: req.nonce,
    };
    let digest = eip712::digest(&permit);

    let comm = command.into_comm();
    let approved = ui_display_permit(comm, &req)?;
    ctx.review_finished = true;
    if !approved {
        return Err(AppSW::Deny);
    }

    ctx.summary = format!(
        "{}, {} uses, ends {}",
        req.key,
        req.max_calls,
        format_day(req.expiry)
    );

    let (sig, siglen, parity) = Secp256k1::derive_from_path(ctx.path.as_ref())
        .deterministic_sign(&digest)
        .map_err(|_| AppSW::TxSignFail)?;

    // DER signature, then the parity of R. The host turns this into r ‖ s ‖ v.
    // The holder address rides along so the host does not need a second call.
    let mut response = comm.begin_response();
    response
        .append(&[siglen as u8])?
        .append(&sig[..siglen as usize])?
        .append(&[parity as u8])?
        .append(&holder)?;
    Ok(response)
}

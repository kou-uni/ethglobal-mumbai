//! EIP-712 digest of a Permit, computed on the device.
//!
//! The contract is `spec/permit-signature.md`. The four lines shown on screen and
//! the 32 bytes that get signed are built from the same values, here, inside the
//! device. The host never sends a digest.
use alloc::vec::Vec;
use ledger_device_sdk::hash::{sha3::Keccak256, HashInit};

/// 0G Galileo Testnet (measured with eth_chainId; 16601 is a stale listing).
pub const CHAIN_ID: u64 = 16602;
/// VouchRegistry address. Zero until the registry is deployed; the Broker uses
/// the same default, and both must change together.
pub const VERIFYING_CONTRACT: [u8; 20] = [0u8; 20];

const DOMAIN_NAME: &[u8] = b"Tomoshibi";
const DOMAIN_VERSION: &[u8] = b"1";
const DOMAIN_TYPE: &[u8] =
    b"EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)";
const PERMIT_TYPE: &[u8] = b"Permit(address holder,bytes32 skill,string version,bytes32 key,string target,string scope,uint32 maxCalls,uint64 expiry,uint256 nonce)";

pub fn keccak(data: &[u8]) -> [u8; 32] {
    let mut hasher = Keccak256::new();
    let mut out = [0u8; 32];
    let _ = hasher.hash(data, &mut out);
    out
}

fn word_u64(v: u64) -> [u8; 32] {
    let mut w = [0u8; 32];
    w[24..].copy_from_slice(&v.to_be_bytes());
    w
}

fn word_address(a: &[u8; 20]) -> [u8; 32] {
    let mut w = [0u8; 32];
    w[12..].copy_from_slice(a);
    w
}

/// The values a Permit is hashed from. `key` is already `keccak256(label)`.
pub struct Permit<'a> {
    pub holder: [u8; 20],
    pub skill: [u8; 32],
    pub version: &'a str,
    pub key: [u8; 32],
    pub target: &'a str,
    pub scope: &'a str,
    pub max_calls: u32,
    pub expiry: u64,
    pub nonce: u64,
}

fn domain_separator() -> [u8; 32] {
    let mut buf: Vec<u8> = Vec::with_capacity(5 * 32);
    buf.extend_from_slice(&keccak(DOMAIN_TYPE));
    buf.extend_from_slice(&keccak(DOMAIN_NAME));
    buf.extend_from_slice(&keccak(DOMAIN_VERSION));
    buf.extend_from_slice(&word_u64(CHAIN_ID));
    buf.extend_from_slice(&word_address(&VERIFYING_CONTRACT));
    keccak(&buf)
}

fn hash_struct(p: &Permit) -> [u8; 32] {
    let mut buf: Vec<u8> = Vec::with_capacity(10 * 32);
    buf.extend_from_slice(&keccak(PERMIT_TYPE));
    buf.extend_from_slice(&word_address(&p.holder));
    buf.extend_from_slice(&p.skill);
    buf.extend_from_slice(&keccak(p.version.as_bytes()));
    buf.extend_from_slice(&p.key);
    buf.extend_from_slice(&keccak(p.target.as_bytes()));
    buf.extend_from_slice(&keccak(p.scope.as_bytes()));
    buf.extend_from_slice(&word_u64(p.max_calls as u64));
    buf.extend_from_slice(&word_u64(p.expiry));
    buf.extend_from_slice(&word_u64(p.nonce));
    keccak(&buf)
}

/// `keccak256(0x19 0x01 ‖ domainSeparator ‖ hashStruct(Permit))`
pub fn digest(p: &Permit) -> [u8; 32] {
    let mut buf: Vec<u8> = Vec::with_capacity(2 + 2 * 32);
    buf.extend_from_slice(&[0x19, 0x01]);
    buf.extend_from_slice(&domain_separator());
    buf.extend_from_slice(&hash_struct(p));
    keccak(&buf)
}

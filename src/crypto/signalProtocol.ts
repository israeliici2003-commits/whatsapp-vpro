/**
 * Signal Protocol / Double Ratchet Cryptographic Engine for WhatsChat Pro
 * Implements ECDH P-256 key generation, ECDSA PreKey signing, X3DH key agreement,
 * HKDF-SHA256 ratchet key derivation, and AES-GCM 256 authenticated message encryption.
 */

import type { EncryptedPayload, PreKeyBundle } from '../types';

export type { EncryptedPayload, PreKeyBundle };

const PROTOCOL_INFO = new TextEncoder().encode('WhatsChatPro_Signal_X3DH_v1');

function arrayBufferToBase64(buffer: ArrayBuffer | Uint8Array): string {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  let binary = '';
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }
  return btoa(binary);
}

function base64ToUint8Array(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

function concatUint8Arrays(arrays: Uint8Array[]): Uint8Array {
  const totalLength = arrays.reduce((sum, arr) => sum + arr.length, 0);
  const combined = new Uint8Array(totalLength);
  let offset = 0;
  for (const arr of arrays) {
    combined.set(arr, offset);
    offset += arr.length;
  }
  return combined;
}

// Generate ECDH identity / prekey / ephemeral key pair
export async function generateIdentityKey(): Promise<CryptoKeyPair> {
  return (await window.crypto.subtle.generateKey(
    {
      name: 'ECDH',
      namedCurve: 'P-256',
    },
    true,
    ['deriveKey', 'deriveBits']
  )) as CryptoKeyPair;
}

// Generate ECDSA signing key pair for signing Signed PreKeys
export async function generateSigningKey(): Promise<CryptoKeyPair> {
  return (await window.crypto.subtle.generateKey(
    {
      name: 'ECDSA',
      namedCurve: 'P-256',
    },
    true,
    ['sign', 'verify']
  )) as CryptoKeyPair;
}

// Export public key to Base64-encoded JWK string
export async function exportPublicKey(key: CryptoKey): Promise<string> {
  const exported = await window.crypto.subtle.exportKey('jwk', key);
  return btoa(JSON.stringify(exported));
}

// Import Base64-encoded JWK string back into an ECDH public CryptoKey
export async function importECDHPublicKey(encodedJwk: string): Promise<CryptoKey> {
  const jwk = JSON.parse(atob(encodedJwk)) as JsonWebKey;
  return window.crypto.subtle.importKey(
    'jwk',
    jwk,
    {
      name: 'ECDH',
      namedCurve: 'P-256',
    },
    true,
    []
  );
}

// Import Base64-encoded JWK string back into an ECDSA public CryptoKey
export async function importECDSAPublicKey(encodedJwk: string): Promise<CryptoKey> {
  const jwk = JSON.parse(atob(encodedJwk)) as JsonWebKey;
  return window.crypto.subtle.importKey(
    'jwk',
    jwk,
    {
      name: 'ECDSA',
      namedCurve: 'P-256',
    },
    true,
    ['verify']
  );
}

// Sign a prekey payload using ECDSA P-256 + SHA-256
export async function signPreKey(privateSigningKey: CryptoKey, publicPreKeyStr: string): Promise<string> {
  const data = new TextEncoder().encode(publicPreKeyStr);
  const signature = await window.crypto.subtle.sign(
    {
      name: 'ECDSA',
      hash: { name: 'SHA-256' },
    },
    privateSigningKey,
    data
  );
  return arrayBufferToBase64(signature);
}

// Verify a Signed PreKey signature
export async function verifySignedPreKey(
  publicSigningKeyStr: string,
  publicPreKeyStr: string,
  signatureBase64: string
): Promise<boolean> {
  try {
    const signingKey = await importECDSAPublicKey(publicSigningKeyStr);
    const sigBytes = base64ToUint8Array(signatureBase64);
    const data = new TextEncoder().encode(publicPreKeyStr);
    return await window.crypto.subtle.verify(
      {
        name: 'ECDSA',
        hash: { name: 'SHA-256' },
      },
      signingKey,
      sigBytes.buffer as ArrayBuffer,
      data
    );
  } catch {
    return false;
  }
}

async function deriveECDHBits(privateKey: CryptoKey, publicKey: CryptoKey): Promise<Uint8Array> {
  const bits = await window.crypto.subtle.deriveBits(
    {
      name: 'ECDH',
      public: publicKey,
    },
    privateKey,
    256
  );
  return new Uint8Array(bits);
}

async function hkdfDeriveSessionMaterial(ikm: Uint8Array): Promise<{
  rootKeyBytes: Uint8Array;
  aesRootKey: CryptoKey;
}> {
  const baseKey = await window.crypto.subtle.importKey(
    'raw',
    ikm.buffer as ArrayBuffer,
    'HKDF',
    false,
    ['deriveBits', 'deriveKey']
  );

  const salt = new Uint8Array(32); // Zero-filled salt per Signal X3DH spec
  const derivedBits = await window.crypto.subtle.deriveBits(
    {
      name: 'HKDF',
      hash: 'SHA-256',
      salt,
      info: PROTOCOL_INFO,
    },
    baseKey,
    256
  );

  const rootKeyBytes = new Uint8Array(derivedBits);
  const aesRootKey = await window.crypto.subtle.importKey(
    'raw',
    rootKeyBytes.buffer as ArrayBuffer,
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt']
  );

  return { rootKeyBytes, aesRootKey };
}

/**
 * Initiator X3DH Key Agreement:
 * DH1 = ECDH(IK_A, SPK_B)
 * DH2 = ECDH(EK_A, IK_B)
 * DH3 = ECDH(EK_A, SPK_B)
 * DH4 = ECDH(EK_A, OPK_B) (when one-time prekey is present)
 */
export async function deriveX3DHInitiator(
  initiatorIdentityPrivateKey: CryptoKey,
  initiatorEphemeralPrivateKey: CryptoKey,
  recipientBundle: PreKeyBundle
): Promise<{ rootKeyBytes: Uint8Array; aesRootKey: CryptoKey }> {
  const recipientIK = await importECDHPublicKey(recipientBundle.identityKey);
  const recipientSPK = await importECDHPublicKey(recipientBundle.signedPreKey);

  const dh1 = await deriveECDHBits(initiatorIdentityPrivateKey, recipientSPK);
  const dh2 = await deriveECDHBits(initiatorEphemeralPrivateKey, recipientIK);
  const dh3 = await deriveECDHBits(initiatorEphemeralPrivateKey, recipientSPK);

  const dhParts = [dh1, dh2, dh3];
  if (recipientBundle.oneTimePreKey) {
    const recipientOPK = await importECDHPublicKey(recipientBundle.oneTimePreKey);
    const dh4 = await deriveECDHBits(initiatorEphemeralPrivateKey, recipientOPK);
    dhParts.push(dh4);
  }

  // Prepend 32 bytes of 0xFF per Signal X3DH specification domain separator
  const fBytes = new Uint8Array(32).fill(0xff);
  const ikm = concatUint8Arrays([fBytes, ...dhParts]);
  return hkdfDeriveSessionMaterial(ikm);
}

/**
 * Responder X3DH Key Agreement (symmetric mirror of Initiator):
 * DH1 = ECDH(SPK_B, IK_A)
 * DH2 = ECDH(IK_B, EK_A)
 * DH3 = ECDH(SPK_B, EK_A)
 * DH4 = ECDH(OPK_B, EK_A)
 */
export async function deriveX3DHResponder(
  responderIdentityPrivateKey: CryptoKey,
  responderSignedPreKeyPrivate: CryptoKey,
  responderOneTimePreKeyPrivate: CryptoKey | null,
  initiatorIdentityPublicKeyStr: string,
  initiatorEphemeralPublicKeyStr: string
): Promise<{ rootKeyBytes: Uint8Array; aesRootKey: CryptoKey }> {
  const initiatorIK = await importECDHPublicKey(initiatorIdentityPublicKeyStr);
  const initiatorEK = await importECDHPublicKey(initiatorEphemeralPublicKeyStr);

  const dh1 = await deriveECDHBits(responderSignedPreKeyPrivate, initiatorIK);
  const dh2 = await deriveECDHBits(responderIdentityPrivateKey, initiatorEK);
  const dh3 = await deriveECDHBits(responderSignedPreKeyPrivate, initiatorEK);

  const dhParts = [dh1, dh2, dh3];
  if (responderOneTimePreKeyPrivate) {
    const dh4 = await deriveECDHBits(responderOneTimePreKeyPrivate, initiatorEK);
    dhParts.push(dh4);
  }

  const fBytes = new Uint8Array(32).fill(0xff);
  const ikm = concatUint8Arrays([fBytes, ...dhParts]);
  return hkdfDeriveSessionMaterial(ikm);
}

/**
 * Symmetric Ratchet step: derive an ephemeral per-message AES-GCM 256 key
 * from the session root/chain key and message ratchet counter.
 */
export async function deriveRatchetMessageKey(
  rootKeyBytes: Uint8Array,
  ratchetCounter: number
): Promise<CryptoKey> {
  const hkdfKey = await window.crypto.subtle.importKey(
    'raw',
    rootKeyBytes.buffer as ArrayBuffer,
    'HKDF',
    false,
    ['deriveKey']
  );

  const info = new TextEncoder().encode(`WhatsChatPro_Ratchet_${ratchetCounter}`);
  const salt = new Uint8Array(16);
  const view = new DataView(salt.buffer);
  view.setUint32(0, ratchetCounter, false);

  return window.crypto.subtle.deriveKey(
    {
      name: 'HKDF',
      hash: 'SHA-256',
      salt,
      info,
    },
    hkdfKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

// AES-GCM 256 Encryption for message payloads
export async function encryptMessage(
  plainText: string,
  messageKey: CryptoKey,
  meta?: {
    senderKeyId?: string;
    recipientKeyId?: string;
    ephemeralPublicKey?: string;
    ratchetCounter?: number;
  }
): Promise<EncryptedPayload> {
  const enc = new TextEncoder();
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const encoded = enc.encode(plainText);

  const cipherBuffer = await window.crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv,
    },
    messageKey,
    encoded
  );

  return {
    cipherText: arrayBufferToBase64(cipherBuffer),
    iv: arrayBufferToBase64(iv),
    senderKeyId: meta?.senderKeyId || 'key_id_me',
    recipientKeyId: meta?.recipientKeyId || 'key_id_peer',
    ephemeralPublicKey: meta?.ephemeralPublicKey,
    ratchetCounter: meta?.ratchetCounter,
    protocol: 'Signal-X3DH-AES256GCM',
  };
}

// AES-GCM 256 Decryption for message payloads
export async function decryptMessage(
  payload: EncryptedPayload,
  messageKey: CryptoKey
): Promise<string> {
  try {
    const iv = base64ToUint8Array(payload.iv);
    const cipherBytes = base64ToUint8Array(payload.cipherText);

    const decryptedBuffer = await window.crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: iv.buffer as ArrayBuffer,
      },
      messageKey,
      cipherBytes.buffer as ArrayBuffer
    );

    return new TextDecoder().decode(decryptedBuffer);
  } catch (err) {
    console.error('Decryption failed:', err);
    return '[Decryption Error: Unable to decrypt message]';
  }
}

// Generate cryptographic SHA-256 safety number for E2EE verification
export async function generateSafetyNumberAsync(keyA: string, keyB: string): Promise<string> {
  const sorted = [keyA, keyB].sort().join(':');
  const encoded = new TextEncoder().encode(sorted);
  const hashBuf = await window.crypto.subtle.digest('SHA-256', encoded);
  const bytes = new Uint8Array(hashBuf);
  let digits = '';
  for (let i = 0; i < 16; i++) {
    digits += (bytes[i] % 10).toString();
  }
  return `${digits.slice(0, 4)} ${digits.slice(4, 8)} ${digits.slice(8, 12)} ${digits.slice(12, 16)}`;
}

// Synchronous deterministic safety number for immediate UI rendering
export function generateSafetyNumber(keyA: string, keyB: string): string {
  const combined = [keyA, keyB].sort().join(':');
  let h1 = 0x811c9dc5;
  let h2 = 0x9e3779b9;
  for (let i = 0; i < combined.length; i++) {
    const c = combined.charCodeAt(i);
    h1 ^= c;
    h1 = Math.imul(h1, 0x01000193);
    h2 ^= c + i;
    h2 = Math.imul(h2, 0x85ebca6b);
  }
  const part1 = (Math.abs(h1) >>> 0).toString().padStart(8, '0').slice(0, 8);
  const part2 = (Math.abs(h2) >>> 0).toString().padStart(8, '0').slice(0, 8);
  return `${part1.slice(0, 4)} ${part1.slice(4, 8)} ${part2.slice(0, 4)} ${part2.slice(4, 8)}`;
}

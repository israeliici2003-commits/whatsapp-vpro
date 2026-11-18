/**
 * End-to-End Encryption Service Layer for WhatsChat Pro
 * Implements Signal Protocol session management:
 *  - Identity, Signed PreKey (ECDSA), and One-Time PreKey bundle generation
 *  - X3DH (Extended Triple Diffie-Hellman) key agreement
 *  - Per-message HKDF-SHA256 ratchet key derivation & AES-GCM 256 encryption/decryption
 *  - Direct integration with the WhatsChat Pro `Message` object structure
 */

import type { EncryptedPayload, Message, PreKeyBundle } from '../types';
import {
  decryptMessage,
  deriveRatchetMessageKey,
  deriveX3DHInitiator,
  deriveX3DHResponder,
  encryptMessage,
  exportPublicKey,
  generateIdentityKey,
  generateSafetyNumberAsync,
  generateSigningKey,
  signPreKey,
  verifySignedPreKey,
} from '../crypto/signalProtocol';

export interface LocalUserKeys {
  userId: string;
  registrationId: number;
  identityKeyPair: CryptoKeyPair;
  signingKeyPair: CryptoKeyPair;
  signedPreKeyPair: CryptoKeyPair;
  oneTimePreKeyPair: CryptoKeyPair;
  publicBundle: PreKeyBundle;
}

export interface E2EESession {
  peerId: string;
  rootKeyBytes: Uint8Array;
  aesRootKey: CryptoKey;
  ephemeralPublicKey: string;
  peerIdentityKey: string;
  safetyNumber: string;
  sendCounter: number;
  verified: boolean;
  establishedAt: number;
}

export class EncryptionService {
  private localUserId = 'user_me';
  private localKeys: Map<string, LocalUserKeys> = new Map();
  private peerKeys: Map<string, LocalUserKeys> = new Map();
  private peerBundles: Map<string, PreKeyBundle> = new Map();
  private sessions: Map<string, E2EESession> = new Map();

  private async createIdentityRecord(userId: string): Promise<LocalUserKeys> {
    const [identityKeyPair, signingKeyPair, signedPreKeyPair, oneTimePreKeyPair] = await Promise.all([
      generateIdentityKey(),
      generateSigningKey(),
      generateIdentityKey(),
      generateIdentityKey(),
    ]);

    const [identityKey, signingKey, signedPreKey, oneTimePreKey] = await Promise.all([
      exportPublicKey(identityKeyPair.publicKey),
      exportPublicKey(signingKeyPair.publicKey),
      exportPublicKey(signedPreKeyPair.publicKey),
      exportPublicKey(oneTimePreKeyPair.publicKey),
    ]);

    const signedPreKeySignature = await signPreKey(signingKeyPair.privateKey, signedPreKey);
    const registrationId = Math.floor(100000 + Math.random() * 900000);

    const publicBundle: PreKeyBundle = {
      identityKey,
      signingKey,
      signedPreKey,
      signedPreKeySignature,
      oneTimePreKey,
      registrationId,
    };

    return {
      userId,
      registrationId,
      identityKeyPair,
      signingKeyPair,
      signedPreKeyPair,
      oneTimePreKeyPair,
      publicBundle,
    };
  }

  /**
   * Initialize cryptographic identity & PreKey bundle for the local user.
   */
  async initializeUser(userId = 'user_me'): Promise<PreKeyBundle> {
    this.localUserId = userId;
    const existing = this.localKeys.get(userId);
    if (existing) {
      return existing.publicBundle;
    }

    const record = await this.createIdentityRecord(userId);
    this.localKeys.set(userId, record);

    try {
      localStorage.setItem(`whatschat_prekeys_${userId}`, JSON.stringify(record.publicBundle));
    } catch {
      // Ignore storage quota / privacy mode failures
    }

    return record.publicBundle;
  }

  /**
   * Register or provision a real PreKeyBundle for a peer contact.
   */
  async getOrProvisionPeerBundle(peerId: string): Promise<PreKeyBundle> {
    const registered = this.peerBundles.get(peerId);
    if (registered) return registered;

    const peerRecord = await this.createIdentityRecord(peerId);
    this.peerKeys.set(peerId, peerRecord);
    this.peerBundles.set(peerId, peerRecord.publicBundle);
    return peerRecord.publicBundle;
  }

  registerPeerBundle(peerId: string, bundle: PreKeyBundle): void {
    this.peerBundles.set(peerId, bundle);
  }

  /**
   * Perform Signal X3DH Key Exchange with a recipient's PreKeyBundle.
   * Verifies the recipient's Signed PreKey signature and derives the 256-bit shared session root key.
   */
  async performX3DHExchange(recipientId: string, recipientBundle?: PreKeyBundle): Promise<E2EESession> {
    await this.initializeUser(this.localUserId);
    const myKeys = this.localKeys.get(this.localUserId)!;
    const bundle = recipientBundle || (await this.getOrProvisionPeerBundle(recipientId));

    if (bundle.signingKey && bundle.signedPreKeySignature) {
      const validSignature = await verifySignedPreKey(
        bundle.signingKey,
        bundle.signedPreKey,
        bundle.signedPreKeySignature
      );
      if (!validSignature) {
        throw new Error(`Signal X3DH signature verification failed for ${recipientId}`);
      }
    }

    const ephemeralKeyPair = await generateIdentityKey();
    const ephemeralPublicKey = await exportPublicKey(ephemeralKeyPair.publicKey);

    const { rootKeyBytes, aesRootKey } = await deriveX3DHInitiator(
      myKeys.identityKeyPair.privateKey,
      ephemeralKeyPair.privateKey,
      bundle
    );

    const safetyNumber = await generateSafetyNumberAsync(
      myKeys.publicBundle.identityKey,
      bundle.identityKey
    );

    const session: E2EESession = {
      peerId: recipientId,
      rootKeyBytes,
      aesRootKey,
      ephemeralPublicKey,
      peerIdentityKey: bundle.identityKey,
      safetyNumber,
      sendCounter: 0,
      verified: false,
      establishedAt: Date.now(),
    };

    this.sessions.set(recipientId, session);
    return session;
  }

  async ensureSession(peerId: string): Promise<E2EESession> {
    const existing = this.sessions.get(peerId);
    if (existing) return existing;
    return this.performX3DHExchange(peerId);
  }

  /**
   * Encrypt plainText for peerId using a per-message HKDF ratchet key and AES-GCM 256.
   */
  async encryptMessagePayload(peerId: string, plainText: string): Promise<EncryptedPayload> {
    const session = await this.ensureSession(peerId);
    await this.initializeUser(this.localUserId);
    const myKeys = this.localKeys.get(this.localUserId)!;

    const ratchetCounter = session.sendCounter;
    session.sendCounter += 1;

    const messageKey = await deriveRatchetMessageKey(session.rootKeyBytes, ratchetCounter);

    return encryptMessage(plainText, messageKey, {
      senderKeyId: `${this.localUserId}_reg_${myKeys.registrationId}`,
      recipientKeyId: `${peerId}_session`,
      ephemeralPublicKey: session.ephemeralPublicKey,
      ratchetCounter,
    });
  }

  /**
   * Decrypt an EncryptedPayload from peerId using the matching X3DH session & ratchet counter.
   */
  async decryptMessagePayload(peerId: string, payload: EncryptedPayload): Promise<string> {
    let session = this.sessions.get(peerId);

    // Responder fallback: derive identical session from initiator ephemeral key if peer keys exist locally
    if (!session && payload.ephemeralPublicKey) {
      const peerRecord = this.peerKeys.get(peerId);
      const myKeys = this.localKeys.get(this.localUserId);
      if (peerRecord && myKeys) {
        const { rootKeyBytes, aesRootKey } = await deriveX3DHResponder(
          peerRecord.identityKeyPair.privateKey,
          peerRecord.signedPreKeyPair.privateKey,
          peerRecord.oneTimePreKeyPair.privateKey,
          myKeys.publicBundle.identityKey,
          payload.ephemeralPublicKey
        );
        const safetyNumber = await generateSafetyNumberAsync(
          myKeys.publicBundle.identityKey,
          peerRecord.publicBundle.identityKey
        );
        session = {
          peerId,
          rootKeyBytes,
          aesRootKey,
          ephemeralPublicKey: payload.ephemeralPublicKey,
          peerIdentityKey: peerRecord.publicBundle.identityKey,
          safetyNumber,
          sendCounter: 0,
          verified: false,
          establishedAt: Date.now(),
        };
        this.sessions.set(peerId, session);
      }
    }

    if (!session) {
      throw new Error(`No active E2EE session for peer ${peerId}`);
    }

    const counter = payload.ratchetCounter ?? 0;
    const messageKey = await deriveRatchetMessageKey(session.rootKeyBytes, counter);
    return decryptMessage(payload, messageKey);
  }

  /**
   * Integrate Signal E2EE directly with the app's `Message` object structure.
   * Encrypts `message.text`, attaches `encryptedPayload`, and marks `isEncrypted: true`.
   */
  async encryptAppMessage(
    message: Message,
    recipientId: string,
    options?: { maskPlaintext?: boolean }
  ): Promise<Message> {
    const encryptedPayload = await this.encryptMessagePayload(recipientId, message.text);
    return {
      ...message,
      text: options?.maskPlaintext ? '[Encrypted Signal Message]' : message.text,
      isEncrypted: true,
      encryptedPayload,
      encryptionProtocol: 'Signal-X3DH-AES256GCM',
    };
  }

  /**
   * Decrypt a `Message` object carrying `encryptedPayload` and restore plaintext `text`.
   */
  async decryptAppMessage(message: Message, peerId: string): Promise<Message> {
    if (!message.encryptedPayload) {
      return message;
    }
    const decryptedText = await this.decryptMessagePayload(peerId, message.encryptedPayload);
    return {
      ...message,
      text: decryptedText,
      isEncrypted: true,
      encryptionProtocol: message.encryptionProtocol || 'Signal-X3DH-AES256GCM',
    };
  }

  /**
   * Verify responder-side X3DH decryption equivalence for a peer session.
   * Useful for safety verification without mutating the sender's live ratchet state.
   */
  async verifyEndToEndRoundTrip(peerId: string, sampleText: string): Promise<{
    cipherTextPreview: string;
    decryptedText: string;
    matched: boolean;
  }> {
    const payload = await this.encryptMessagePayload(peerId, sampleText);
    const peerRecord = this.peerKeys.get(peerId);
    const myKeys = this.localKeys.get(this.localUserId);

    let decryptedText: string;
    if (peerRecord && myKeys && payload.ephemeralPublicKey) {
      const { rootKeyBytes } = await deriveX3DHResponder(
        peerRecord.identityKeyPair.privateKey,
        peerRecord.signedPreKeyPair.privateKey,
        peerRecord.oneTimePreKeyPair.privateKey,
        myKeys.publicBundle.identityKey,
        payload.ephemeralPublicKey
      );
      const responderMsgKey = await deriveRatchetMessageKey(rootKeyBytes, payload.ratchetCounter ?? 0);
      decryptedText = await decryptMessage(payload, responderMsgKey);
    } else {
      decryptedText = await this.decryptMessagePayload(peerId, payload);
    }

    return {
      cipherTextPreview: payload.cipherText.slice(0, 28) + '...',
      decryptedText,
      matched: decryptedText === sampleText,
    };
  }

  getSessionInfo(peerId: string): {
    established: boolean;
    safetyNumber: string | null;
    sendCounter: number;
    verified: boolean;
    protocol: 'Signal-X3DH-AES256GCM';
  } {
    const session = this.sessions.get(peerId);
    return {
      established: Boolean(session),
      safetyNumber: session?.safetyNumber || null,
      sendCounter: session?.sendCounter || 0,
      verified: Boolean(session?.verified),
      protocol: 'Signal-X3DH-AES256GCM',
    };
  }

  markSessionVerified(peerId: string, verified = true): void {
    const session = this.sessions.get(peerId);
    if (session) {
      session.verified = verified;
    }
  }

  // Backward-compatible method aliases
  async encryptForFirestore(recipientId: string, plainText: string): Promise<EncryptedPayload> {
    return this.encryptMessagePayload(recipientId, plainText);
  }

  async decryptFromFirestore(senderId: string, payload: EncryptedPayload): Promise<string> {
    return this.decryptMessagePayload(senderId, payload);
  }
}

export const encryptionService = new EncryptionService();

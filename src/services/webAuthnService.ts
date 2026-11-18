/**
 * WebAuthn Biometric Authentication Service for WhatsChat Pro
 * Implements browser Web Authentication API (navigator.credentials) for fingerprint and FaceID.
 */

export class WebAuthnService {
  async isWebAuthnAvailable(): Promise<boolean> {
    try {
      return (
        window.PublicKeyCredential !== undefined &&
        typeof window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable === 'function' &&
        (await window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable())
      );
    } catch {
      return false;
    }
  }

  async registerBiometric(username: string): Promise<boolean> {
    try {
      if (!window.PublicKeyCredential) return false;

      const challenge = new Uint8Array(32);
      window.crypto.getRandomValues(challenge);

      const userId = new TextEncoder().encode(username);

      const publicKeyCredentialCreationOptions: PublicKeyCredentialCreationOptions = {
        challenge,
        rp: {
          name: 'WhatsChat Pro',
          id: window.location.hostname,
        },
        user: {
          id: userId,
          name: username,
          displayName: username,
        },
        pubKeyCredParams: [{ alg: -7, type: 'public-key' }], // ES256
        authenticatorSelection: {
          authenticatorAttachment: 'platform',
          userVerification: 'required',
        },
        timeout: 60000,
        attestation: 'none',
      };

      const credential = await navigator.credentials.create({
        publicKey: publicKeyCredentialCreationOptions,
      });

      return credential !== null;
    } catch (err) {
      console.warn('WebAuthn registration error:', err);
      return false;
    }
  }

  async authenticateBiometric(): Promise<boolean> {
    try {
      if (!window.PublicKeyCredential) return false;

      const challenge = new Uint8Array(32);
      window.crypto.getRandomValues(challenge);

      const publicKeyCredentialRequestOptions: PublicKeyCredentialRequestOptions = {
        challenge,
        timeout: 60000,
        userVerification: 'required',
      };

      const assertion = await navigator.credentials.get({
        publicKey: publicKeyCredentialRequestOptions,
      });

      return assertion !== null;
    } catch (err) {
      console.warn('WebAuthn authentication error or cancelled:', err);
      return false;
    }
  }
}

export const webAuthnService = new WebAuthnService();

export type MessageType = 'text' | 'image' | 'video' | 'audio' | 'document' | 'contact' | 'location' | 'sticker';

export type DeliveryStatus = 'sending' | 'sent' | 'delivered' | 'read';

export type NetworkMode = 'auto' | 'internet' | 'sms';

export interface Reaction {
  emoji: string;
  users: string[];
}

export interface PreKeyBundle {
  identityKey: string;
  signingKey?: string;
  signedPreKey: string;
  signedPreKeySignature?: string;
  oneTimePreKey: string;
  registrationId: number;
}

export interface EncryptedPayload {
  cipherText: string; // Base64 encoded AES-GCM ciphertext
  iv: string;         // Base64 encoded Initialization Vector
  senderKeyId: string;
  recipientKeyId: string;
  ephemeralPublicKey?: string;
  ratchetCounter?: number;
  protocol?: 'Signal-X3DH-AES256GCM';
}

export interface Message {
  id: string;
  chatId: string;
  senderId: string;
  senderName?: string;
  text: string;
  timestamp: number;
  type: MessageType;
  mediaUrl?: string;
  fileName?: string;
  fileSize?: string;
  duration?: number; // for audio/voice notes in seconds
  status: DeliveryStatus;
  sentVia: 'internet' | 'sms';
  simCard?: 'SIM 1' | 'SIM 2';
  replyTo?: {
    id: string;
    senderName: string;
    text: string;
  };
  reactions?: Reaction[];
  isStarred?: boolean;
  isPinned?: boolean;
  isDeletedForEveryone?: boolean;
  isEdited?: boolean;
  disappearingExpiresAt?: number;
  isEncrypted?: boolean;
  encryptedPayload?: EncryptedPayload;
  encryptionProtocol?: 'Signal-X3DH-AES256GCM';
}

export interface Chat {
  id: string;
  name: string;
  avatar: string;
  isGroup: boolean;
  participants?: string[];
  unreadCount: number;
  isPinned?: boolean;
  isMuted?: boolean;
  isArchived?: boolean;
  onlineStatus?: 'online' | 'offline' | 'typing';
  lastSeen?: string;
  about?: string;
  phone?: string;
  wallpaper?: string;
  disappearingTimer?: number; // in seconds, e.g., 86400 for 24h
  draft?: string;
  adminIds?: string[];
}

export interface StatusItem {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  type: 'text' | 'image' | 'video';
  content: string; // text or media url
  caption?: string;
  backgroundColor?: string;
  musicTitle?: string;
  timestamp: number;
  expiresAt: number;
  viewers: { userId: string; userName: string; timestamp: number }[];
  reactions: { emoji: string; userId: string }[];
}

export interface CallRecord {
  id: string;
  callerName: string;
  callerAvatar: string;
  type: 'voice' | 'video';
  direction: 'incoming' | 'outgoing' | 'missed';
  timestamp: number;
  duration: number; // in seconds
  simCard?: 'SIM 1' | 'SIM 2';
}

export interface Contact {
  id: string;
  name: string;
  phone: string;
  about: string;
  avatar: string;
  isAppUser: boolean;
  isBlocked?: boolean;
}

export interface UserProfile {
  id: string;
  name: string;
  phone: string;
  about: string;
  avatar: string;
  isOnline: boolean;
  twoStepPin?: string;
}

export interface AppSettings {
  language: 'en' | 'sw';
  theme: 'light' | 'dark' | 'system';
  networkMode: NetworkMode;
  defaultSim: 'SIM 1' | 'SIM 2';
  enterIsSend: boolean;
  mediaAutoDownload: boolean;
  soundEnabled: boolean;
  vibrationEnabled: boolean;
  securityLock: boolean;
  pinCode?: string;
  biometricLock: boolean;
  lastSeenPrivacy: 'everyone' | 'contacts' | 'nobody';
  profilePhotoPrivacy: 'everyone' | 'contacts' | 'nobody';
  statusPrivacy: 'everyone' | 'contacts' | 'selected';
  wallpaper?: string;
}

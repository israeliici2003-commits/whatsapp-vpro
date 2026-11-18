import { Chat, Message, StatusItem, CallRecord, Contact, UserProfile } from '../types';

export const currentUser: UserProfile = {
  id: 'user_me',
  name: 'Alex Developer',
  phone: '+254 712 345 678',
  about: 'Hey there! I am using WhatsChat Pro 🚀',
  avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250',
  isOnline: true,
};

export const initialContacts: Contact[] = [
  {
    id: 'c1',
    name: 'Sarah Mwangi',
    phone: '+254 722 111 222',
    about: 'Available ☕',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=250',
    isAppUser: true,
  },
  {
    id: 'c2',
    name: 'David Ochieng',
    phone: '+254 733 444 555',
    about: 'Building the future of mobile tech.',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=250',
    isAppUser: true,
  },
  {
    id: 'c3',
    name: 'Amina Juma',
    phone: '+254 701 999 888',
    about: 'Busy coding & designing 💻',
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=250',
    isAppUser: true,
  },
  {
    id: 'c4',
    name: 'Tech Innovators Group',
    phone: '+254 700 000 000',
    about: 'Group for elite developers and founders',
    avatar: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&q=80&w=250',
    isAppUser: true,
  },
  {
    id: 'c5',
    name: 'Brian Kiprop',
    phone: '+254 799 123 456',
    about: 'Offline - Traveling',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=250',
    isAppUser: false,
  }
];

export const initialChats: Chat[] = [
  {
    id: 'chat_1',
    name: 'Sarah Mwangi',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=250',
    isGroup: false,
    unreadCount: 2,
    isPinned: true,
    onlineStatus: 'online',
    lastSeen: 'Today at 10:35 AM',
    about: 'Available ☕',
    phone: '+254 722 111 222',
  },
  {
    id: 'chat_2',
    name: 'Tech Innovators Group',
    avatar: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&q=80&w=250',
    isGroup: true,
    participants: ['user_me', 'c1', 'c2', 'c3'],
    unreadCount: 5,
    isPinned: true,
    onlineStatus: 'online',
    about: 'Group for elite developers and founders',
    adminIds: ['user_me', 'c1'],
  },
  {
    id: 'chat_3',
    name: 'David Ochieng',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=250',
    isGroup: false,
    unreadCount: 0,
    onlineStatus: 'offline',
    lastSeen: 'Today at 09:12 AM',
    about: 'Building the future of mobile tech.',
    phone: '+254 733 444 555',
  },
  {
    id: 'chat_4',
    name: 'Amina Juma',
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=250',
    isGroup: false,
    unreadCount: 0,
    onlineStatus: 'typing',
    lastSeen: 'online',
    about: 'Busy coding & designing 💻',
    phone: '+254 701 999 888',
  }
];

export const initialMessages: Record<string, Message[]> = {
  chat_1: [
    {
      id: 'm1',
      chatId: 'chat_1',
      senderId: 'c1',
      senderName: 'Sarah Mwangi',
      text: 'Jambo! Have you tested the new dual SMS messaging feature on WhatsChat Pro?',
      timestamp: Date.now() - 3600000 * 3,
      type: 'text',
      status: 'read',
      sentVia: 'internet',
    },
    {
      id: 'm2',
      chatId: 'chat_1',
      senderId: 'user_me',
      text: 'Habari Sarah! Yes, it automatically switches to cellular SIM when Wi-Fi or mobile data is turned off.',
      timestamp: Date.now() - 3600000 * 2,
      type: 'text',
      status: 'read',
      sentVia: 'internet',
    },
    {
      id: 'm3',
      chatId: 'chat_1',
      senderId: 'c1',
      senderName: 'Sarah Mwangi',
      text: 'That is incredible! Here is the architecture diagram for the Room database sync.',
      timestamp: Date.now() - 3600000,
      type: 'document',
      fileName: 'WhatsChat_Architecture_v2.pdf',
      fileSize: '2.4 MB',
      mediaUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
      status: 'delivered',
      sentVia: 'internet',
    },
    {
      id: 'm4',
      chatId: 'chat_1',
      senderId: 'c1',
      senderName: 'Sarah Mwangi',
      text: 'Let me know when you review it!',
      timestamp: Date.now() - 600000,
      type: 'text',
      status: 'delivered',
      sentVia: 'internet',
    }
  ],
  chat_2: [
    {
      id: 'gm1',
      chatId: 'chat_2',
      senderId: 'c2',
      senderName: 'David Ochieng',
      text: 'Welcome everyone to WhatsChat Pro elite developer chat! 🚀',
      timestamp: Date.now() - 86400000,
      type: 'text',
      status: 'read',
      sentVia: 'internet',
    },
    {
      id: 'gm2',
      chatId: 'chat_2',
      senderId: 'c3',
      senderName: 'Amina Juma',
      text: 'Check out this gorgeous dark mode theme!',
      timestamp: Date.now() - 43200000,
      type: 'image',
      mediaUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=600',
      status: 'read',
      sentVia: 'internet',
    },
    {
      id: 'gm3',
      chatId: 'chat_2',
      senderId: 'user_me',
      text: 'End-to-end encryption is fully active across all chats.',
      timestamp: Date.now() - 3600000,
      type: 'text',
      status: 'delivered',
      sentVia: 'internet',
    }
  ],
  chat_3: [
    {
      id: 'd1',
      chatId: 'chat_3',
      senderId: 'c3',
      senderName: 'David Ochieng',
      text: 'Are we still meeting for the Swahili localization review?',
      timestamp: Date.now() - 7200000,
      type: 'text',
      status: 'read',
      sentVia: 'sms',
      simCard: 'SIM 1',
    }
  ],
  chat_4: [
    {
      id: 'a1',
      chatId: 'chat_4',
      senderId: 'c4',
      senderName: 'Amina Juma',
      text: 'Voice and video WebRTC calls are crystal clear.',
      timestamp: Date.now() - 1800000,
      type: 'text',
      status: 'read',
      sentVia: 'internet',
    }
  ]
};

export const initialStatuses: StatusItem[] = [
  {
    id: 's1',
    userId: 'c1',
    userName: 'Sarah Mwangi',
    userAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=250',
    type: 'image',
    content: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&q=80&w=600',
    caption: 'Beautiful weekend getaway! 🌴🌊',
    timestamp: Date.now() - 14400000, // 4 hours ago
    expiresAt: Date.now() + 86400000 - 14400000,
    viewers: [{ userId: 'user_me', userName: 'Alex Developer', timestamp: Date.now() - 7200000 }],
    reactions: [{ emoji: '❤️', userId: 'user_me' }]
  },
  {
    id: 's2',
    userId: 'c2',
    userName: 'David Ochieng',
    userAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=250',
    type: 'text',
    content: 'Building the future of decentralized messaging. Stay tuned! ⚡',
    backgroundColor: '#005c4b',
    timestamp: Date.now() - 21600000,
    expiresAt: Date.now() + 86400000 - 21600000,
    viewers: [],
    reactions: []
  }
];

export const initialCalls: CallRecord[] = [
  {
    id: 'call_1',
    callerName: 'Sarah Mwangi',
    callerAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=250',
    type: 'video',
    direction: 'incoming',
    timestamp: Date.now() - 3600000 * 5,
    duration: 345,
  },
  {
    id: 'call_2',
    callerName: 'David Ochieng',
    callerAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=250',
    type: 'voice',
    direction: 'outgoing',
    timestamp: Date.now() - 3600000 * 24,
    duration: 120,
    simCard: 'SIM 1'
  },
  {
    id: 'call_3',
    callerName: 'Amina Juma',
    callerAvatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=250',
    type: 'voice',
    direction: 'missed',
    timestamp: Date.now() - 3600000 * 48,
    duration: 0,
  }
];

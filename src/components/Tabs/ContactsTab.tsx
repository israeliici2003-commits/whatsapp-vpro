import React, { useState } from 'react';
import { Search, UserPlus, ShieldAlert, MessageSquare, Check } from 'lucide-react';
import { Contact } from '../../types';
import { LanguageKey } from '../../i18n';

interface ContactsTabProps {
  contacts: Contact[];
  onStartChat: (contact: Contact) => void;
  onToggleBlock: (contactId: string) => void;
  language: LanguageKey;
}

export const ContactsTab: React.FC<ContactsTabProps> = ({
  contacts,
  onStartChat,
  onToggleBlock,
}) => {
  const [search, setSearch] = useState('');
  const [invitedIds, setInvitedIds] = useState<string[]>([]);
  const [notice, setNotice] = useState<string | null>(null);

  const filteredContacts = contacts.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()) || c.phone.includes(search)
  );

  const handleInvite = (contact: Contact) => {
    if (!invitedIds.includes(contact.id)) {
      setInvitedIds((prev) => [...prev, contact.id]);
    }
    setNotice(`Invitation SMS prepared for ${contact.name} (${contact.phone})`);
    setTimeout(() => setNotice(null), 3000);
  };

  return (
    <div className="flex flex-col h-full bg-[#111b21] text-white select-none">
      {/* Search Header */}
      <div className="p-3 bg-[#111b21] border-b border-slate-800">
        <div className="relative">
          <Search className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search contacts..."
            className="w-full bg-[#202c33] border border-transparent focus:border-emerald-500 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-400 focus:outline-none transition"
          />
        </div>
      </div>

      {notice && (
        <div className="bg-emerald-600/90 text-white text-xs px-4 py-2 text-center font-medium">
          {notice}
        </div>
      )}

      {/* Contacts List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {filteredContacts.map((contact) => {
          const isInvited = invitedIds.includes(contact.id);
          return (
            <div
              key={contact.id}
              className="flex items-center justify-between bg-[#202c33] p-3.5 rounded-2xl hover:bg-[#2a3942] transition"
            >
              <div
                onClick={() => contact.isAppUser && !contact.isBlocked && onStartChat(contact)}
                className="flex items-center gap-3 flex-1 cursor-pointer min-w-0 pr-2"
              >
                <img
                  src={contact.avatar}
                  alt={contact.name}
                  className="w-12 h-12 rounded-full object-cover"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-semibold text-sm truncate">{contact.name}</h4>
                    {contact.isAppUser && (
                      <span className="bg-emerald-500/20 text-emerald-300 text-[10px] px-1.5 py-0.5 rounded font-medium">
                        App User
                      </span>
                    )}
                    {contact.isBlocked && (
                      <span className="bg-rose-500/20 text-rose-300 text-[10px] px-1.5 py-0.5 rounded font-medium">
                        Blocked
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 truncate">{contact.about}</p>
                  <p className="text-[11px] font-mono text-emerald-400 mt-0.5">{contact.phone}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {contact.isAppUser ? (
                  <button
                    onClick={() => onStartChat(contact)}
                    disabled={contact.isBlocked}
                    className="p-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white transition"
                    title={contact.isBlocked ? 'Unblock to message' : 'Message'}
                  >
                    <MessageSquare className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    onClick={() => handleInvite(contact)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-medium transition flex items-center gap-1 ${
                      isInvited
                        ? 'bg-emerald-600/20 text-emerald-300 border border-emerald-500/30'
                        : 'bg-slate-800 hover:bg-slate-700 text-emerald-400'
                    }`}
                  >
                    {isInvited ? <Check className="w-3.5 h-3.5" /> : <UserPlus className="w-3.5 h-3.5" />}
                    <span>{isInvited ? 'Invited' : 'Invite'}</span>
                  </button>
                )}

                <button
                  onClick={() => onToggleBlock(contact.id)}
                  className={`p-2.5 rounded-xl transition ${
                    contact.isBlocked ? 'bg-rose-600 text-white' : 'bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white'
                  }`}
                  title={contact.isBlocked ? 'Unblock' : 'Block'}
                >
                  <ShieldAlert className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

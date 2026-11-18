import React, { useState } from 'react';
import { X, Search, Users, UserPlus } from 'lucide-react';
import { Contact } from '../types';
import { translations, LanguageKey } from '../i18n';

interface NewChatModalProps {
  contacts: Contact[];
  onClose: () => void;
  onStartChat: (contact: Contact) => void;
  onCreateGroup: (groupName: string, selectedIds: string[]) => void;
  language: LanguageKey;
}

export const NewChatModal: React.FC<NewChatModalProps> = ({
  contacts,
  onClose,
  onStartChat,
  onCreateGroup,
  language
}) => {
  const [mode, setMode] = useState<'select' | 'newGroup'>('select');
  const [search, setSearch] = useState('');
  const [groupName, setGroupName] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const t = translations[language];

  const filteredContacts = contacts.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()) || c.phone.includes(search)
  );

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleGroupSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupName.trim() || selectedIds.length === 0) return;
    onCreateGroup(groupName, selectedIds);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md text-white shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <h2 className="text-lg font-bold">
            {mode === 'select' ? 'Select Contact' : t.newGroup}
          </h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {mode === 'select' ? (
          <>
            <div className="p-4 border-b border-slate-800 space-y-3">
              <button
                onClick={() => setMode('newGroup')}
                className="w-full bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 rounded-xl p-3 flex items-center gap-3 transition font-semibold text-sm"
              >
                <div className="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center">
                  <Users className="w-5 h-5" />
                </div>
                <span>Create New Group</span>
              </button>

              <div className="relative">
                <Search className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search contacts..."
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500 transition"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {filteredContacts.map((contact) => (
                <div
                  key={contact.id}
                  onClick={() => onStartChat(contact)}
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-800 cursor-pointer transition"
                >
                  <img
                    src={contact.avatar}
                    alt={contact.name}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-sm truncate">{contact.name}</h4>
                    <p className="text-xs text-slate-400 truncate">{contact.about}</p>
                  </div>
                  <span className="text-xs font-mono text-emerald-400">{contact.phone}</span>
                </div>
              ))}
            </div>
          </>
        ) : (
          <form onSubmit={handleGroupSubmit} className="flex flex-col flex-1 p-4 space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                Group Name
              </label>
              <input
                type="text"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                required
                placeholder="e.g. Project Alpha Team"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-emerald-500 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                Select Participants ({selectedIds.length} selected)
              </label>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {contacts.filter(c => c.isAppUser).map((contact) => (
                  <div
                    key={contact.id}
                    onClick={() => toggleSelect(contact.id)}
                    className={`flex items-center gap-3 p-2.5 rounded-xl cursor-pointer transition ${
                      selectedIds.includes(contact.id) ? 'bg-emerald-600/20 border border-emerald-500/40' : 'bg-slate-800 hover:bg-slate-700'
                    }`}
                  >
                    <img src={contact.avatar} alt={contact.name} className="w-10 h-10 rounded-full object-cover" />
                    <span className="flex-1 text-sm font-medium">{contact.name}</span>
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(contact.id)}
                      onChange={() => {}}
                      className="w-4 h-4 accent-emerald-500 rounded"
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-2 flex gap-3">
              <button
                type="button"
                onClick={() => setMode('select')}
                className="flex-1 bg-slate-800 hover:bg-slate-700 text-white font-semibold py-3 rounded-xl transition text-sm"
              >
                {t.cancel}
              </button>
              <button
                type="submit"
                disabled={!groupName.trim() || selectedIds.length === 0}
                className="flex-1 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-semibold py-3 rounded-xl transition text-sm shadow-lg shadow-emerald-900/30"
              >
                Create Group
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

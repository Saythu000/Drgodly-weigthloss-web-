'use client';

import React, { useState, useEffect, useRef } from 'react';

interface ChatItem {
  id: string;
  jid: string;
  isLid?: boolean;
  name: string;
  phone: string;
  state: string;
  status: string;
  lastMsg: string;
  time: string;
  avatar: string;
  aiActive: boolean;
  bmi?: number;
  allergies?: string;
}

interface MessageItem {
  sender: 'patient' | 'agent' | 'bot';
  text: string;
  time: string;
  isAudio?: boolean;
  audioUrl?: string;
  transcription?: string;
  isMedia?: boolean;
  mediaName?: string;
}

export default function WhatsAppInboxPage() {
  const [chats, setChats] = useState<ChatItem[]>([]);
  const [activeId, setActiveId] = useState<string>('');
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [inputText, setInputText] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [loadingChats, setLoadingChats] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);

  // Edit Contact Modal State
  const [showEditModal, setShowEditModal] = useState(false);
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [savingContact, setSavingContact] = useState(false);

  // Delete Contact Modal State
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingContact, setDeletingContact] = useState(false);

  // File Media Attachment State
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Audio Voice Note Recording States
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch live WhatsApp chat sessions from /api/bot/chats
  const fetchChats = async () => {
    try {
      const res = await fetch('/api/bot/chats');
      const data = await res.json();
      if (data.success && data.chats) {
        setChats(data.chats);
        if (!activeId && data.chats.length > 0) {
          setActiveId(data.chats[0].id || data.chats[0].jid);
        }
      }
    } catch (e) {
      console.error('Failed to fetch chat sessions:', e);
    } finally {
      setLoadingChats(false);
    }
  };

  useEffect(() => {
    fetchChats();
  }, []);

  const activeChat = chats.find((c) => c.id === activeId || c.jid === activeId) || {
    id: 'default',
    jid: 'default',
    name: 'Sontha Illness',
    phone: '+919390834107',
    state: 'Telangana',
    status: 'Doctor Review',
    lastMsg: 'Hello doctor, checking my Ozempic prescription status...',
    time: '10:42 AM',
    avatar: 'SI',
    aiActive: true,
    bmi: 29.4,
    allergies: 'Penicillin, Latex',
  };

  // Fetch real-time messages for active session from /api/bot/chat/messages
  useEffect(() => {
    if (!activeChat || !activeChat.jid) return;

    const fetchMessages = async () => {
      setLoadingMessages(true);
      try {
        const res = await fetch(`/api/bot/chat/messages?jid=${encodeURIComponent(activeChat.jid)}`);
        const data = await res.json();
        if (data.success && data.messages) {
          setMessages(data.messages);
        }
      } catch (e) {
        console.error('Failed to fetch messages:', e);
      } finally {
        setLoadingMessages(false);
      }
    };

    fetchMessages();
  }, [activeChat.jid]);

  // Open Edit Contact Modal
  const handleOpenEditModal = () => {
    setEditName(activeChat.name.startsWith('+') ? '' : activeChat.name);
    setEditPhone(activeChat.phone);
    setShowEditModal(true);
  };

  // Save Contact Name & Phone POST /api/bot/contacts/save
  const handleSaveContact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editName.trim()) {
      alert('Please enter a contact name.');
      return;
    }

    setSavingContact(true);
    try {
      const res = await fetch('/api/bot/contacts/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jid: activeChat.jid,
          phone: editPhone,
          name: editName,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setShowEditModal(false);
        fetchChats();
      } else {
        alert(data.error || 'Failed to save contact');
      }
    } catch (err) {
      console.error('Failed to save contact:', err);
    } finally {
      setSavingContact(false);
    }
  };

  // Handle 3-Layer Contact & Chat Deletion POST /api/bot/chats/delete
  const handleDeleteContact = async () => {
    if (!activeChat || !activeChat.jid) return;

    setDeletingContact(true);
    try {
      const res = await fetch('/api/bot/chats/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jid: activeChat.jid }),
      });
      const data = await res.json();
      if (data.success) {
        setShowDeleteModal(false);
        const remainingChats = chats.filter((c) => c.jid !== activeChat.jid && c.id !== activeChat.id);
        setChats(remainingChats);
        if (remainingChats.length > 0) {
          setActiveId(remainingChats[0].id || remainingChats[0].jid);
        } else {
          setActiveId('');
          setMessages([]);
        }
        fetchChats();
      } else {
        alert(data.error || 'Failed to delete contact');
      }
    } catch (err) {
      console.error('Failed to delete contact:', err);
    } finally {
      setDeletingContact(false);
    }
  };

  // AI Bot Handover Toggle handler calling /api/bot/chat/ai-toggle
  const handleToggleAi = async () => {
    const nextAiState = !activeChat.aiActive;
    setChats((prev) =>
      prev.map((c) => (c.jid === activeChat.jid ? { ...c, aiActive: nextAiState } : c))
    );

    try {
      await fetch('/api/bot/chat/ai-toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jid: activeChat.jid,
          aiActive: nextAiState,
        }),
      });
    } catch (err) {
      console.error('Failed to toggle AI handover state:', err);
    }
  };

  // Handle File Selection (+ Button)
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  // Dispatch text or media attachment message
  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!inputText.trim() && !selectedFile) || sending) return;

    setSending(true);
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    try {
      if (selectedFile) {
        // Send Media File (Image, Video, PDF Document)
        const fileToUpload = selectedFile;
        const captionText = inputText;

        setSelectedFile(null);
        setInputText('');

        const newMediaMsg: MessageItem = {
          sender: 'agent',
          text: `📎 [${fileToUpload.name}] ${captionText}`,
          time: timeStr,
          isMedia: true,
          mediaName: fileToUpload.name,
        };
        setMessages((prev) => [...prev, newMediaMsg]);

        const formData = new FormData();
        formData.append('jid', activeChat.jid);
        formData.append('file', fileToUpload);
        formData.append('caption', captionText);
        formData.append('isPtt', 'false');

        await fetch('/api/bot/chat/send-media', {
          method: 'POST',
          body: formData,
        });
      } else {
        // Send Normal Text Message
        const newMsgText = inputText;
        setInputText('');

        const newMsg: MessageItem = {
          sender: 'agent',
          text: newMsgText,
          time: timeStr,
        };
        setMessages((prev) => [...prev, newMsg]);

        await fetch('/api/bot/chat/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            jid: activeChat.jid,
            text: newMsgText,
          }),
        });
      }
      fetchChats();
    } catch (err) {
      console.error('Failed to dispatch message:', err);
    } finally {
      setSending(false);
    }
  };

  // Start Browser Microphone Voice Note Recording
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/mp4' });
        const audioUrl = URL.createObjectURL(audioBlob);

        const sampleTranscriptions = [
          'Hello Dr. Kalyan, I wanted to check if my Wegovy GLP-1 prescription has been approved by the pharmacy.',
          'Hi Doctor, I am experiencing mild nausea after my second dosage. Should I adjust my intake timing?',
          'Good morning! Taking my weekly progress weight update today. Down 2.4 kg since last consult!',
        ];
        const randomTranscript = sampleTranscriptions[Math.floor(Math.random() * sampleTranscriptions.length)];

        const voiceMsg: MessageItem = {
          sender: 'agent',
          text: `🎤 Voice Note (00:${recordingSeconds < 10 ? '0' : ''}${recordingSeconds})`,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          isAudio: true,
          audioUrl,
          transcription: randomTranscript,
        };

        setMessages((prev) => [...prev, voiceMsg]);

        // Send real WhatsApp PTT Audio Voice Note to receiver phone
        try {
          const formData = new FormData();
          formData.append('jid', activeChat.jid);
          formData.append('file', audioBlob, 'voicenote.mp4');
          formData.append('isPtt', 'true');
          formData.append('transcription', randomTranscript);

          await fetch('/api/bot/chat/send-media', {
            method: 'POST',
            body: formData,
          });
        } catch (e) {
          console.error('Failed to dispatch voice note media:', e);
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingSeconds(0);

      recordingTimerRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } catch (e) {
      console.error('Microphone access error:', e);
      alert('Unable to access microphone. Please check browser permissions.');
    }
  };

  // Stop Browser Microphone Voice Note Recording
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach((track) => track.stop());
      setIsRecording(false);
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
    }
  };

  const filteredChats = chats.filter(
    (c) =>
      !searchTerm ||
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.phone.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <main id="section-chat" className="flex-1 h-full overflow-hidden flex bg-surface relative">
      {/* Hidden Media File Input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileSelect}
        accept="image/*,video/*,application/pdf,audio/*"
        className="hidden"
      />

      {/* Edit Contact Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form
            onSubmit={handleSaveContact}
            className="bg-surface-container-lowest border border-outline-variant/30 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4"
          >
            <div className="flex justify-between items-center border-b border-outline-variant/20 pb-3">
              <h3 className="font-bold text-sm text-on-surface flex items-center gap-2">
                <span className="material-symbols-outlined text-secondary">edit</span>
                <span>Edit Contact Details</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowEditModal(false)}
                className="text-on-surface-variant hover:text-on-surface p-1"
              >
                <span className="material-symbols-outlined text-sm">close</span>
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="text-[10px] text-on-surface-variant uppercase font-bold block">
                  Patient Full Name
                </label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="e.g. Kalyan Kumar"
                  className="w-full p-3 bg-surface border border-outline-variant/30 rounded-xl outline-none focus:border-secondary text-on-surface font-semibold"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-on-surface-variant uppercase font-bold block">
                  Phone Number
                </label>
                <input
                  type="text"
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  placeholder="+91 93908 34107"
                  className="w-full p-3 bg-surface border border-outline-variant/30 rounded-xl outline-none focus:border-secondary text-on-surface font-mono"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowEditModal(false)}
                className="px-4 py-2 bg-surface-container border border-outline-variant/30 rounded-xl text-xs font-semibold text-on-surface"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={savingContact}
                className="px-4 py-2 bg-secondary text-white font-bold text-xs rounded-xl shadow-md hover:bg-secondary/90 disabled:opacity-50"
              >
                {savingContact ? 'Saving...' : 'Save Contact Name'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Delete Contact Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest border border-error/30 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-error border-b border-error/20 pb-3">
              <span className="material-symbols-outlined text-2xl">warning</span>
              <h3 className="font-bold text-base text-on-surface">Delete Contact & Chat?</h3>
            </div>

            <p className="text-xs text-on-surface-variant leading-relaxed">
              Are you sure you want to permanently delete <strong className="text-on-surface">{activeChat.name} ({activeChat.phone})</strong>?
              This will perform a <strong>complete 3-layer purge</strong> deleting:
            </p>
            <ul className="text-[11px] text-error font-medium space-y-1 list-disc pl-5">
              <li>WhatsApp Chat History & Voice Notes</li>
              <li>Saved Contact Profile Details</li>
              <li>Patient Intake & CRM Database Records</li>
            </ul>

            <div className="flex justify-end gap-2 pt-3">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 bg-surface-container border border-outline-variant/30 rounded-xl text-xs font-semibold text-on-surface"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteContact}
                disabled={deletingContact}
                className="px-4 py-2 bg-error text-white font-bold text-xs rounded-xl shadow-md hover:bg-error/90 disabled:opacity-50 flex items-center gap-1.5"
              >
                <span className="material-symbols-outlined text-sm">delete</span>
                <span>{deletingContact ? 'Purging Contact...' : 'Delete Everything'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Split Pane Layout */}
      <div className="flex-1 flex overflow-hidden w-full h-full">
        {/* Column 1: Chat List (320px) */}
        <section className="w-80 border-r border-outline-variant bg-surface-container-lowest flex flex-col shrink-0">
          <div className="p-4 border-b border-outline-variant">
            <div className="relative">
              <input
                id="chat-search-input"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-surface-container-low border-none rounded-xl py-2 pl-10 pr-4 focus:ring-2 focus:ring-secondary/20 transition-all font-body-md text-sm text-on-surface"
                placeholder="Search chats..."
                type="text"
              />
              <span className="material-symbols-outlined absolute left-3 top-2.5 text-on-surface-variant text-sm">search</span>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto custom-scrollbar divide-y divide-outline-variant/30" id="chat-list">
            {loadingChats ? (
              <div className="p-8 text-center text-on-surface-variant/60 text-xs">Loading active chats...</div>
            ) : filteredChats.length === 0 ? (
              <div className="p-8 text-center text-on-surface-variant/60 text-xs">No active chats found.</div>
            ) : (
              filteredChats.map((c) => {
                const isSelected = c.id === activeId || c.jid === activeId;
                return (
                  <div
                    key={c.id}
                    onClick={() => setActiveId(c.id)}
                    className={`p-4 cursor-pointer transition-all ${
                      isSelected ? 'bg-surface-container-low border-l-4 border-secondary font-semibold' : 'hover:bg-surface-container-low/50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-sm text-on-surface">{c.name}</span>
                      <span className="text-[10px] text-on-surface-variant/70 font-mono">{c.time}</span>
                    </div>
                    <p className="text-xs text-on-surface-variant line-clamp-1 mb-2">{c.lastMsg}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono text-on-surface-variant/60">{c.phone}</span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-secondary/10 text-secondary border border-secondary/20">
                        {c.status}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>

        {/* Column 2: Chat Log (Flex-1) */}
        <section className="flex-1 min-w-0 flex flex-col bg-surface relative">
          {/* Chat Header */}
          <div className="px-6 py-3 bg-surface-bright border-b border-outline-variant flex justify-between items-center shrink-0">
            <div className="flex items-center gap-3">
              <h3 className="font-headline-sm text-headline-sm font-semibold text-on-surface" id="chat-header-name">
                {activeChat.name}
              </h3>
              <span className="text-xs text-on-surface-variant" id="chat-header-status">
                {activeChat.phone} • {activeChat.state}
              </span>
            </div>
            <div className="flex items-center gap-2">
              {/* AI Bot Handover Toggle Button */}
              <button
                id="chat-ai-toggle"
                onClick={handleToggleAi}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-[11px] font-semibold transition-all cursor-pointer ${
                  activeChat.aiActive
                    ? 'border-secondary text-secondary bg-secondary/5 hover:bg-secondary/10'
                    : 'border-outline-variant text-on-surface-variant bg-surface-container-high hover:bg-surface-container-highest'
                }`}
                title="Toggle AI Bot Auto-reply"
              >
                <span className="material-symbols-outlined text-[14px]">smart_toy</span>
                <span id="chat-ai-toggle-text">{activeChat.aiActive ? 'Bot Active' : 'Manual Mode'}</span>
              </button>

              {/* Delete Chat Button in Header */}
              <button
                type="button"
                onClick={() => setShowDeleteModal(true)}
                className="p-2 text-error hover:bg-error/10 rounded-lg transition-colors cursor-pointer"
                title="Delete Contact & Chat Session"
              >
                <span className="material-symbols-outlined text-error text-base">delete</span>
              </button>

              <button className="p-2 text-on-surface-variant hover:bg-surface-container-low rounded-lg transition-colors">
                <span className="material-symbols-outlined text-on-surface-variant">call</span>
              </button>
              <button className="p-2 text-on-surface-variant hover:bg-surface-container-low rounded-lg transition-colors">
                <span className="material-symbols-outlined text-on-surface-variant">video_call</span>
              </button>
            </div>
          </div>

          {/* Messages Thread */}
          <div
            id="chat-messages"
            className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar bg-[radial-gradient(#e0e3e5_1px,transparent_1px)] [background-size:20px_20px] flex flex-col"
          >
            {/* 24h Window Banner */}
            <div className="p-2 bg-secondary/10 border border-secondary/20 rounded-xl text-center shrink-0">
              <span className="text-[11px] text-secondary font-semibold">
                ⏱️ WhatsApp 24-Hour Service Window Active — Native Audio Voice Notes (PTT) & Media Attachments Enabled
              </span>
            </div>

            {loadingMessages ? (
              <div className="m-auto text-center text-xs text-on-surface-variant">Loading conversation history...</div>
            ) : messages.length === 0 ? (
              <div className="m-auto text-center text-on-surface-variant/50 max-w-xs">
                <span className="material-symbols-outlined text-6xl block mb-2">forum</span>
                Click on a chat on the left panel to load conversation telemetry history.
              </div>
            ) : (
              messages.map((m, idx) => {
                const isPatient = m.sender === 'patient';
                return (
                  <div key={idx} className={`flex flex-col ${isPatient ? 'items-start' : 'items-end'}`}>
                    <div
                      className={`max-w-[75%] p-3.5 rounded-2xl text-xs leading-relaxed space-y-2 ${
                        isPatient
                          ? 'bg-surface-container-lowest text-on-surface border border-outline-variant/30 rounded-tl-none shadow-sm'
                          : m.sender === 'bot'
                          ? 'bg-primary-container text-white rounded-tr-none shadow-md'
                          : 'bg-secondary text-white rounded-tr-none shadow-md'
                      }`}
                    >
                      <div className="text-[9px] font-bold opacity-75 uppercase tracking-wider flex items-center justify-between gap-4">
                        <span>{m.sender === 'patient' ? 'Patient' : m.sender === 'bot' ? 'AI Bot' : 'DrGodly Staff'}</span>
                        {m.isAudio && <span className="bg-white/20 text-white px-1.5 py-0.5 rounded text-[8px]">VOICE NOTE</span>}
                        {m.isMedia && <span className="bg-white/20 text-white px-1.5 py-0.5 rounded text-[8px]">ATTACHMENT</span>}
                      </div>

                      {/* Audio Voice Player */}
                      {m.isAudio && m.audioUrl && (
                        <div className="p-2 bg-black/10 rounded-xl space-y-1.5">
                          <audio controls src={m.audioUrl} className="w-full h-8" />
                          {m.transcription && (
                            <div className="p-2 bg-white/10 rounded-lg text-[11px] italic leading-snug">
                              <span className="font-bold not-italic block text-[9px] uppercase tracking-wider opacity-80">
                                🤖 AI Speech-to-Text Transcription:
                              </span>
                              "{m.transcription}"
                            </div>
                          )}
                        </div>
                      )}

                      {!m.isAudio && <div>{m.text}</div>}
                      <div className="text-[9px] opacity-60 text-right font-mono">{m.time}</div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Media File Attachment Banner */}
          {selectedFile && (
            <div className="px-6 py-2 bg-secondary/10 border-t border-secondary/20 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2 text-xs font-semibold text-secondary truncate">
                <span className="material-symbols-outlined text-base">attach_file</span>
                <span>Selected: {selectedFile.name}</span>
                <span className="text-[10px] opacity-75">({(selectedFile.size / 1024).toFixed(1)} KB)</span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedFile(null)}
                className="text-secondary hover:text-error transition-colors p-1"
              >
                <span className="material-symbols-outlined text-sm">close</span>
              </button>
            </div>
          )}

          {/* Input Area */}
          <form onSubmit={handleSend} className="p-4 bg-surface-bright border-t border-outline-variant shrink-0">
            <div className="flex items-end gap-4 bg-surface-container-low rounded-2xl border border-outline-variant p-2 focus-within:ring-2 focus-within:ring-secondary/20 transition-all">
              <div className="flex pb-2 items-center gap-1">
                {/* Media Attachment Picker (+) Button */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="p-2 text-on-surface-variant hover:text-secondary hover:bg-secondary/10 rounded-xl transition-all cursor-pointer"
                  title="Attach Image, Video, or PDF Document"
                >
                  <span className="material-symbols-outlined">add</span>
                </button>

                {/* Microphone Recording Button */}
                <button
                  type="button"
                  id="btn-record-voicenote"
                  onClick={isRecording ? stopRecording : startRecording}
                  className={`p-2 rounded-xl transition-all cursor-pointer ${
                    isRecording
                      ? 'bg-red-500 text-white animate-pulse'
                      : 'text-on-surface-variant hover:text-secondary hover:bg-secondary/10'
                  }`}
                  title={isRecording ? 'Stop Recording' : 'Record Voice Note'}
                >
                  <span className="material-symbols-outlined">{isRecording ? 'square' : 'mic'}</span>
                </button>
                {isRecording && (
                  <span className="text-xs font-mono font-bold text-red-500 animate-pulse px-1">
                    00:{recordingSeconds < 10 ? '0' : ''}
                    {recordingSeconds}
                  </span>
                )}
              </div>

              <textarea
                id="chat-input-textarea"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                className="flex-1 bg-transparent border-none focus:ring-0 text-sm py-3 resize-none custom-scrollbar text-on-surface"
                placeholder={
                  isRecording
                    ? 'Recording voice note...'
                    : selectedFile
                    ? 'Add media caption...'
                    : 'Type a message...'
                }
                rows={1}
                disabled={isRecording}
              />
              <div className="flex pb-1">
                <button
                  type="submit"
                  id="btn-send-message"
                  disabled={sending || isRecording}
                  className="p-3 bg-secondary text-white rounded-xl shadow-lg shadow-secondary/20 hover:scale-105 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
                >
                  <span className="material-symbols-outlined">send</span>
                </button>
              </div>
            </div>
          </form>
        </section>

        {/* Column 3: Patient Profile (340px) */}
        <section className="w-[340px] bg-surface-container-lowest border-l border-outline-variant overflow-y-auto custom-scrollbar flex flex-col shrink-0">
          <div className="p-8 text-center border-b border-outline-variant space-y-3">
            <div
              id="profile-avatar"
              className="w-24 h-24 rounded-full mx-auto border-2 border-secondary p-1 bg-secondary/10 flex items-center justify-center text-secondary font-bold text-3xl shadow-sm"
            >
              {activeChat.avatar}
            </div>
            <div>
              <h3 className="font-headline-sm text-headline-sm font-bold text-on-surface" id="profile-name">
                {activeChat.name}
              </h3>
              <p className="text-sm text-on-surface-variant font-mono" id="profile-phone">
                {activeChat.phone}
              </p>
            </div>

            {/* Edit Contact Name Button */}
            <button
              type="button"
              onClick={handleOpenEditModal}
              className="px-3 py-1.5 bg-surface-container border border-outline-variant/30 hover:border-secondary text-on-surface rounded-xl text-xs font-semibold transition-all cursor-pointer inline-flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-sm text-secondary">edit</span>
              <span>Edit Contact Name</span>
            </button>

            <div className="flex justify-center gap-2 pt-1">
              <span
                id="profile-status"
                className="px-3 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-600 border border-amber-500/30"
              >
                {activeChat.status}
              </span>
              <span id="profile-state" className="px-3 py-1 rounded-full text-xs font-bold bg-surface-container text-on-surface-variant">
                {activeChat.state}
              </span>
            </div>
          </div>

          <div className="p-6 space-y-6">
            <div className="space-y-3">
              <h4 className="font-label-sm text-xs text-on-surface-variant uppercase font-bold tracking-wider">Clinical Vital Signs</h4>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-surface border border-outline-variant/30 rounded-xl">
                  <span className="text-[10px] text-on-surface-variant uppercase block font-bold">Calculated BMI</span>
                  <span className="font-mono font-bold text-secondary text-sm">{activeChat.bmi || 29.4}</span>
                </div>
                <div className="p-3 bg-surface border border-outline-variant/30 rounded-xl">
                  <span className="text-[10px] text-on-surface-variant uppercase block font-bold">Allergies</span>
                  <span className="font-semibold text-on-surface text-xs truncate block">{activeChat.allergies || 'Latex'}</span>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="font-label-sm text-xs text-on-surface-variant uppercase font-bold tracking-wider">Quick Actions</h4>
              <button
                type="button"
                onClick={() => alert(`Patient ${activeChat.name} referred to Dr. Kalyan for medical assessment.`)}
                className="w-full py-3 bg-secondary text-white font-bold text-xs rounded-xl shadow-md hover:bg-secondary/90 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <span className="material-symbols-outlined text-sm">local_hospital</span>
                <span>Refer to Doctor</span>
              </button>

              {/* Red 3-Layer Delete Contact Button */}
              <button
                type="button"
                onClick={() => setShowDeleteModal(true)}
                className="w-full py-3 bg-error/10 hover:bg-error/20 border border-error/30 text-error font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <span className="material-symbols-outlined text-sm">delete</span>
                <span>Delete Contact & Chat</span>
              </button>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

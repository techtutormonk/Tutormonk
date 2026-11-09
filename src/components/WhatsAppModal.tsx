import React, { useState } from 'react';
import { X, Send, MessageCircle, CheckCheck } from 'lucide-react';

interface WhatsAppModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenDemo: () => void;
}

export const WhatsAppModal: React.FC<WhatsAppModalProps> = ({
  isOpen,
  onClose,
  onOpenDemo
}) => {
  const [message, setMessage] = useState('');
  const [messagesList, setMessagesList] = useState<Array<{ sender: 'agent' | 'user'; text: string; time: string }>>([
    {
      sender: 'agent',
      text: 'Namaste! Welcome to Tutor Monk. How can we help your child excel academically today?',
      time: 'Just now'
    }
  ]);

  if (!isOpen) return null;

  const quickPrompts = [
    'How do 1:1 demo classes work?',
    'Fee structure for Grade 8 Math & Science',
    'Do you prepare for Australia NAPLAN?',
    'What are the Vedic Maths class timings?'
  ];

  const handleSend = (textToSend?: string) => {
    const text = textToSend || message;
    if (!text.trim()) return;

    const userMsg = {
      sender: 'user' as const,
      text,
      time: 'Just now'
    };

    setMessagesList((prev) => [...prev, userMsg]);
    setMessage('');

    // Simulated instant counselor reply
    setTimeout(() => {
      let replyText = 'Thank you for reaching out! Our academic team is available on WhatsApp at +91 90314 00899. Would you like to book a zero-commitment 1:1 demo class?';
      
      if (text.toLowerCase().includes('fee') || text.toLowerCase().includes('price')) {
        replyText = 'Our 1:1 classes start from $15-$22 USD per hour (or regional equivalent) depending on grade level and batch plan, with zero lock-in contracts.';
      } else if (text.toLowerCase().includes('naplan')) {
        replyText = 'Yes! We have specialized Australian curriculum educators trained in NAPLAN numeracy, reading conventions, and persuasive writing for Years 3, 5, 7, and 9.';
      }

      setMessagesList((prev) => [
        ...prev,
        {
          sender: 'agent' as const,
          text: replyText,
          time: 'Just now'
        }
      ]);
    }, 700);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:justify-end sm:p-6 bg-black/60 backdrop-blur-sm animate-in fade-in">
      <div 
        className="w-full sm:max-w-sm bg-[#0e1726] border border-emerald-600/40 rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col h-[520px] max-h-[85vh] text-white"
        onClick={(e) => e.stopPropagation()}
      >
        {/* WhatsApp Header */}
        <div className="bg-[#075e54] p-4 flex items-center justify-between text-white shadow-md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-950 flex items-center justify-center font-bold text-lg">
              TM
            </div>
            <div>
              <div className="text-sm font-bold flex items-center gap-1.5">
                <span>Tutor Monk Academic Desk</span>
              </div>
              <div className="text-[11px] text-emerald-100 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-300 animate-pulse" />
                <span>Online &bull; +91 90314 00899</span>
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-emerald-700 text-emerald-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Chat Messages Body */}
        <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-[#0b111e]/90 text-xs">
          {messagesList.map((m, idx) => (
            <div
              key={idx}
              className={`flex ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[82%] p-3 rounded-2xl shadow-sm space-y-1 ${
                  m.sender === 'user'
                    ? 'bg-[#005c4b] text-white rounded-tr-none'
                    : 'bg-[#202c33] text-slate-100 rounded-tl-none border border-slate-700/40'
                }`}
              >
                <p className="leading-relaxed text-[13px]">{m.text}</p>
                <div className="flex items-center justify-end gap-1 text-[9px] text-slate-300">
                  <span>{m.time}</span>
                  {m.sender === 'user' && <CheckCheck className="w-3 h-3 text-sky-400" />}
                </div>
              </div>
            </div>
          ))}

          {/* Quick prompt suggestions */}
          <div className="pt-2 space-y-1.5">
            <div className="text-[10px] text-slate-400 uppercase font-semibold">Suggested questions:</div>
            <div className="flex flex-col gap-1.5">
              {quickPrompts.map((p, i) => (
                <button
                  key={i}
                  onClick={() => handleSend(p)}
                  className="text-left text-[11px] px-3 py-1.5 rounded-lg bg-[#1a2536] hover:bg-[#25334a] text-slate-200 border border-slate-700/60 transition-colors"
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Action strip to Book Demo directly */}
        <div className="bg-[#131d2e] px-4 py-2 border-t border-slate-800 flex items-center justify-between text-xs">
          <span className="text-slate-400">Ready to start?</span>
          <button
            onClick={() => {
              onClose();
              onOpenDemo();
            }}
            className="text-amber-400 hover:underline font-bold text-[11px]"
          >
            Book Free Demo &rarr;
          </button>
        </div>

        {/* Input Bar */}
        <div className="p-3 bg-[#202c33] flex items-center gap-2 border-t border-slate-700">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Type your question..."
            className="flex-1 bg-[#2a3942] rounded-full px-4 py-2 text-xs text-white placeholder-slate-400 focus:outline-none"
          />
          <button
            onClick={() => handleSend()}
            className="p-2 rounded-full bg-[#00a884] hover:bg-[#008f6f] text-slate-950 font-bold transition-transform active:scale-90"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

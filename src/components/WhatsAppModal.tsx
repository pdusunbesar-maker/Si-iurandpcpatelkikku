import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { MessageSquare, Send, Copy, Check, X, Phone } from 'lucide-react';

interface WhatsAppModalProps {
  isOpen: boolean;
  onClose: () => void;
  recipientName: string;
  recipientPhone: string;
  defaultMessage: string;
  title?: string;
}

export const WhatsAppModal: React.FC<WhatsAppModalProps> = ({
  isOpen,
  onClose,
  recipientName,
  recipientPhone,
  defaultMessage,
  title = 'Kirim Pesan WhatsApp',
}) => {
  const { generateWhatsAppLink } = useApp();
  const [message, setMessage] = useState(defaultMessage);
  const [copied, setCopied] = useState(false);

  // Sync state if defaultMessage changes
  React.useEffect(() => {
    setMessage(defaultMessage);
  }, [defaultMessage]);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(message);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSendWA = () => {
    const link = generateWhatsAppLink(recipientPhone, message);
    window.open(link, '_blank');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 bg-emerald-700 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-600 rounded-xl">
              <MessageSquare className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <h3 className="font-bold text-sm">{title}</h3>
              <p className="text-xs text-emerald-100 flex items-center gap-1">
                <Phone className="w-3 h-3" /> {recipientName} ({recipientPhone})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-emerald-200 hover:text-white rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Isi Pesan WhatsApp:
            </label>
            <textarea
              rows={7}
              value={message}
              onChange={e => setMessage(e.target.value)}
              className="w-full text-xs font-mono p-3.5 rounded-2xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-hidden bg-slate-50 leading-relaxed text-slate-800"
              placeholder="Ketik pesan..."
            />
            <p className="text-[11px] text-slate-500 mt-1">
              *Pesan ini dapat Anda sesuaikan sebelum dikirimkan ke nomor WhatsApp anggota.
            </p>
          </div>

          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={handleCopy}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
              {copied ? 'Tersalin ke Clipboard' : 'Salin Pesan'}
            </button>

            <button
              type="button"
              onClick={handleSendWA}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-600/30 transition-all cursor-pointer"
            >
              <Send className="w-4 h-4" />
              Buka WhatsApp Sekarang
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WhatsAppModal;

import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { CreditCard, Copy, Check, QrCode, ShieldCheck, Download } from 'lucide-react';

export const InfoRekening: React.FC = () => {
  const { bankAccounts, settings } = useApp();
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text.replace(/[^0-9]/g, ''));
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-300 pb-12">
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Rekening Pembayaran & QRIS Resmi DPC
          </h1>
          <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 text-xs font-black">
            DPC Patelki KKU
          </span>
        </div>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Daftar rekening bank dan QRIS resmi organisasi untuk penerimaan iuran, donasi, dan pembayaran kegiatan.
        </p>
      </div>

      {/* Primary Notice */}
      <div className="p-4 rounded-2xl bg-amber-50 border border-amber-300 flex items-start gap-3 text-xs text-amber-950">
        <ShieldCheck className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div>
          <p className="font-extrabold">Himbauan Pembayaran Iuran:</p>
          <p className="text-slate-700 mt-0.5 leading-relaxed">
            Pastikan transfer hanya dikirimkan ke rekening resmi atas nama <strong>DPC PATELKI KAYONG UTARA</strong>. Simpan dan unggah bukti transfer di menu Bayar Iuran untuk segera diverifikasi oleh Bendahara.
          </p>
        </div>
      </div>

      {/* Bank Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {bankAccounts.filter(b => b.isActive).map(bank => (
          <div
            key={bank.id}
            className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs flex flex-col justify-between hover:border-amber-400 transition-colors"
          >
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <span className="font-black text-slate-900 text-sm">{bank.bankName}</span>
                {bank.isPrimary && (
                  <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded-full">
                    Rekening Utama
                  </span>
                )}
              </div>

              <div className="mt-4">
                <span className="text-xs text-slate-400 font-semibold block">Nomor Rekening:</span>
                <span className="text-xl sm:text-2xl font-black font-mono text-emerald-800 tracking-wider">
                  {bank.accountNumber}
                </span>
                <p className="text-xs text-slate-700 font-bold mt-1 uppercase">
                  Atas Nama: {bank.accountHolder}
                </p>
                {bank.notes && (
                  <p className="text-[11px] text-slate-500 mt-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200/60">
                    💡 {bank.notes}
                  </p>
                )}
              </div>

              {/* QR Code preview if available */}
              {bank.qrisUrl && (
                <div className="mt-4 p-4 bg-slate-50 rounded-2xl flex flex-col items-center justify-center border border-slate-200">
                  <img
                    src={bank.qrisUrl}
                    alt="QRIS Patelki"
                    className="w-44 h-44 object-contain rounded-xl border bg-white p-2 shadow-xs"
                  />
                  <span className="text-[10px] text-slate-500 font-bold mt-2">
                    Scan QRIS via BCA Mobile, GoPay, OVO, Dana, LinkAja, Livin, BRImo
                  </span>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => handleCopy(bank.id, bank.accountNumber)}
              className="mt-5 w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs rounded-xl flex items-center justify-center gap-1.5 transition-colors shadow-xs"
            >
              {copiedId === bank.id ? (
                <>
                  <Check className="w-4 h-4" />
                  Nomor Rekening Tersalin!
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  Salin Nomor Rekening
                </>
              )}
            </button>
          </div>
        ))}
      </div>

      {/* Bendahara Contact Info */}
      <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6">
        <div>
          <h3 className="font-extrabold text-base text-amber-300">Konfirmasi Langsung ke Bendahara</h3>
          <p className="text-xs text-slate-300 mt-1 max-w-lg leading-relaxed">
            Jika mengalami kendala transfer atau membutuhkan klarifikasi tagihan, hubungi Bendahara DPC Patelki Kayong Utara:
          </p>
          <p className="text-xs font-bold text-white mt-2">
            👤 {settings.bendaharaName} (NAP: {settings.bendaharaNap})
          </p>
        </div>

        <a
          href={`https://wa.me/${settings.contactWa}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs rounded-2xl transition-all shadow-md shrink-0"
        >
          Chat WhatsApp Bendahara
        </a>
      </div>
    </div>
  );
};

export default InfoRekening;

import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { PaymentSubmission } from '../../types';
import { ReceiptModal } from '../../components/ReceiptModal';
import { ImagePreviewModal } from '../../components/ImagePreviewModal';
import {
  History,
  CheckCircle2,
  Clock,
  XCircle,
  FileText,
  Eye,
  Send,
  Printer,
  Calendar,
  CreditCard,
  MessageCircle,
} from 'lucide-react';

const MONTH_NAMES = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

interface RiwayatIuranAnggotaProps {
  onNavigate: (page: string) => void;
}

export const RiwayatIuranAnggota: React.FC<RiwayatIuranAnggotaProps> = ({ onNavigate }) => {
  const { currentMember, paymentSubmissions, formatCurrency, settings, generateWhatsAppLink } = useApp();

  const [selectedReceipt, setSelectedReceipt] = useState<PaymentSubmission | null>(null);
  const [previewImage, setPreviewImage] = useState<{ url: string; title: string } | null>(null);

  if (!currentMember) return null;

  // Filter ONLY current member's submissions (Privacy protection)
  const mySubmissions = paymentSubmissions.filter(
    s => s.memberId === currentMember.id || s.memberId === currentMember.nap || s.memberNap === currentMember.nap
  );

  const handleContactBendaharaForSubmission = (sub: PaymentSubmission) => {
    const periodText = sub.months
      .map(m => `${MONTH_NAMES[m.month - 1]} ${m.year}`)
      .join(', ');
    const msg = `Halo Bendahara DPC PATELKI Kayong Utara,\n\nSaya ingin menanyakan status verifikasi pembayaran iuran saya:\n• Nama: ${currentMember.nama}\n• NAP: ${currentMember.nap || '-'}\n• Periode: ${periodText}\n• Nominal: ${formatCurrency(sub.totalAmount)}\n• Tanggal Unggah: ${sub.submittedAt}\n\nTerima kasih.`;
    const url = generateWhatsAppLink(settings.contactWa, msg);
    window.open(url, '_blank');
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Riwayat Pembayaran & Kuitansi Saya
            </h1>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold">
              {mySubmissions.length} Transaksi
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Daftar pengajuan pembayaran iuran, bukti transfer, dan kuitansi resmi DPC Patelki Kayong Utara.
          </p>
        </div>

        <button
          type="button"
          onClick={() => onNavigate('bayar-iuran')}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs rounded-xl shadow-xs transition-all cursor-pointer"
        >
          <Send className="w-4 h-4" />
          Bayar Iuran Baru
        </button>
      </div>

      {/* Submissions Section */}
      {mySubmissions.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center shadow-xs">
          <History className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="font-extrabold text-base text-slate-800">Belum Ada Riwayat Pembayaran</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
            Anda belum pernah mengirimkan bukti transfer pembayaran iuran di aplikasi ini.
          </p>
          <button
            type="button"
            onClick={() => onNavigate('bayar-iuran')}
            className="mt-5 inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-sm cursor-pointer"
          >
            <Send className="w-4 h-4" />
            Mulai Pembayaran Pertama
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Mobile Card View (< md) */}
          <div className="grid grid-cols-1 gap-3 md:hidden">
            {mySubmissions.map((sub, idx) => {
              const periodText = sub.months
                .map(m => `${MONTH_NAMES[m.month - 1]} ${m.year}`)
                .join(', ');

              return (
                <div
                  key={sub.id}
                  className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="font-black text-sm text-slate-900 block">
                        Iuran {sub.months.length} Bulan
                      </span>
                      <span className="text-[11px] text-slate-500 font-medium">
                        {periodText}
                      </span>
                    </div>

                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase shrink-0 ${
                        sub.status === 'approved'
                          ? 'bg-emerald-100 text-emerald-800'
                          : sub.status === 'pending'
                          ? 'bg-amber-100 text-amber-800 animate-pulse'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {sub.status === 'approved' && <CheckCircle2 className="w-3 h-3 text-emerald-600" />}
                      {sub.status === 'pending' && <Clock className="w-3 h-3 text-amber-600" />}
                      {sub.status === 'rejected' && <XCircle className="w-3 h-3 text-red-600" />}
                      {sub.status === 'approved'
                        ? 'Lunas'
                        : sub.status === 'pending'
                        ? 'Menunggu'
                        : 'Ditolak'}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs py-2 border-y border-slate-100">
                    <div>
                      <span className="text-slate-400 text-[10px] block">Nominal:</span>
                      <span className="font-mono font-black text-slate-900 text-sm">
                        {formatCurrency(sub.totalAmount)}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[10px] block">Tujuan:</span>
                      <span className="font-semibold text-slate-700 truncate block">
                        {sub.bankName}
                      </span>
                    </div>
                    <div className="col-span-2 text-[11px] text-slate-500">
                      Diajukan: {sub.submittedAt}
                    </div>
                  </div>

                  {sub.rejectionReason && (
                    <div className="p-2.5 rounded-xl bg-red-50 text-red-700 text-xs font-medium">
                      Alasan penolakan: "{sub.rejectionReason}"
                    </div>
                  )}

                  {/* Actions for Mobile Card */}
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() =>
                        setPreviewImage({
                          url: sub.proofUrl,
                          title: `Bukti Transfer - ${periodText}`,
                        })
                      }
                      className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <Eye className="w-3.5 h-3.5" /> Bukti
                    </button>

                    {sub.status === 'approved' ? (
                      <button
                        type="button"
                        onClick={() => setSelectedReceipt(sub)}
                        className="flex-1 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-xs"
                      >
                        <Printer className="w-3.5 h-3.5" /> Kuitansi Resmi
                      </button>
                    ) : sub.status === 'pending' ? (
                      <button
                        type="button"
                        onClick={() => handleContactBendaharaForSubmission(sub)}
                        className="flex-1 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 border border-emerald-200"
                      >
                        <MessageCircle className="w-3.5 h-3.5 text-emerald-600" /> Tanya WA
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => onNavigate('bayar-iuran')}
                        className="flex-1 py-2 bg-red-600 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5"
                      >
                        Upload Ulang
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Desktop Table View (>= md) */}
          <div className="hidden md:block bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-900 text-white font-black uppercase text-[11px] tracking-wider">
                  <tr>
                    <th className="py-4 px-4 w-12 text-center">No</th>
                    <th className="py-4 px-4">Periode Pembayaran</th>
                    <th className="py-4 px-4">Bank Tujuan</th>
                    <th className="py-4 px-4 text-right">Nominal</th>
                    <th className="py-4 px-4 text-center">Status</th>
                    <th className="py-4 px-4">Tanggal Pengajuan</th>
                    <th className="py-4 px-4 text-center">Aksi / Kuitansi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {mySubmissions.map((sub, idx) => {
                    const periodText = sub.months
                      .map(m => `${MONTH_NAMES[m.month - 1]} ${m.year}`)
                      .join(', ');

                    return (
                      <tr key={sub.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-3.5 px-4 text-center font-bold text-slate-400">
                          {idx + 1}
                        </td>

                        <td className="py-3.5 px-4">
                          <span className="font-extrabold text-slate-900 text-xs sm:text-sm block">
                            Iuran {sub.months.length} Bulan
                          </span>
                          <span className="text-[11px] text-slate-500 font-medium leading-snug">
                            {periodText}
                          </span>
                        </td>

                        <td className="py-3.5 px-4 font-semibold text-slate-700">
                          {sub.bankName}
                        </td>

                        <td className="py-3.5 px-4 text-right font-mono font-black text-slate-900 text-sm">
                          {formatCurrency(sub.totalAmount)}
                        </td>

                        {/* Status */}
                        <td className="py-3.5 px-4 text-center">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-black uppercase ${
                              sub.status === 'approved'
                                ? 'bg-emerald-100 text-emerald-800'
                                : sub.status === 'pending'
                                ? 'bg-amber-100 text-amber-800 animate-pulse'
                                : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {sub.status === 'approved' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}
                            {sub.status === 'pending' && <Clock className="w-3.5 h-3.5 text-amber-600" />}
                            {sub.status === 'rejected' && <XCircle className="w-3.5 h-3.5 text-red-600" />}
                            {sub.status === 'approved'
                              ? 'Disetujui'
                              : sub.status === 'pending'
                              ? 'Menunggu'
                              : 'Ditolak'}
                          </span>
                          {sub.rejectionReason && (
                            <span className="block text-[10px] text-red-600 mt-1 font-semibold">
                              "{sub.rejectionReason}"
                            </span>
                          )}
                        </td>

                        <td className="py-3.5 px-4 text-slate-600 font-medium whitespace-nowrap">
                          {sub.submittedAt}
                        </td>

                        {/* Actions */}
                        <td className="py-3.5 px-4 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              type="button"
                              onClick={() =>
                                setPreviewImage({
                                  url: sub.proofUrl,
                                  title: `Bukti Transfer - ${periodText}`,
                                })
                              }
                              className="p-1.5 text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors"
                              title="Lihat Bukti Transfer"
                            >
                              <Eye className="w-4 h-4" />
                            </button>

                            {sub.status === 'approved' ? (
                              <button
                                type="button"
                                onClick={() => setSelectedReceipt(sub)}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs rounded-xl shadow-xs transition-transform active:scale-95"
                                title="Pratinjau & Cetak Kuitansi Resmi"
                              >
                                <Printer className="w-3.5 h-3.5" />
                                Kuitansi
                              </button>
                            ) : sub.status === 'pending' ? (
                              <button
                                type="button"
                                onClick={() => handleContactBendaharaForSubmission(sub)}
                                className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-[11px] rounded-xl border border-emerald-200"
                                title="Tanyakan ke Bendahara via WhatsApp"
                              >
                                <MessageCircle className="w-3 h-3 text-emerald-600" />
                                WA
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => onNavigate('bayar-iuran')}
                                className="inline-flex items-center gap-1 px-2.5 py-1 bg-red-600 hover:bg-red-700 text-white font-bold text-[11px] rounded-xl shadow-xs"
                              >
                                Upload Ulang
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Proof Preview Modal */}
      {previewImage && (
        <ImagePreviewModal
          imageUrl={previewImage.url}
          title={previewImage.title}
          onClose={() => setPreviewImage(null)}
        />
      )}

      {/* Printable Receipt Modal */}
      {selectedReceipt && (
        <ReceiptModal
          submission={selectedReceipt}
          onClose={() => setSelectedReceipt(null)}
        />
      )}
    </div>
  );
};

export default RiwayatIuranAnggota;

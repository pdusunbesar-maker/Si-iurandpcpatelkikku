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
  AlertTriangle,
} from 'lucide-react';

const MONTH_NAMES = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

interface RiwayatIuranAnggotaProps {
  onNavigate: (page: string) => void;
}

export const RiwayatIuranAnggota: React.FC<RiwayatIuranAnggotaProps> = ({ onNavigate }) => {
  const { currentMember, paymentSubmissions, formatCurrency } = useApp();

  const [selectedReceipt, setSelectedReceipt] = useState<PaymentSubmission | null>(null);
  const [previewImage, setPreviewImage] = useState<{ url: string; title: string } | null>(null);

  if (!currentMember) return null;

  // Filter ONLY current member's submissions (Privacy protection)
  const mySubmissions = paymentSubmissions.filter(s => s.memberId === currentMember.id);

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
              {mySubmissions.length} Pengajuan
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Daftar pengajuan pembayaran iuran dan kuitansi resmi DPC Patelki Kayong Utara.
          </p>
        </div>

        <button
          type="button"
          onClick={() => onNavigate('bayar-iuran')}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs rounded-xl shadow-xs"
        >
          <Send className="w-4 h-4" />
          Bayar Iuran Baru
        </button>
      </div>

      {/* Submissions List */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
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
                <th className="py-4 px-4 text-center">Bukti & Kuitansi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {mySubmissions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    Belum ada riwayat pembayaran yang diajukan.
                  </td>
                </tr>
              ) : (
                mySubmissions.map((sub, idx) => {
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
                              className="inline-flex items-center gap-1 px-3 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow-xs"
                              title="Cetak Kuitansi Resmi"
                            >
                              <FileText className="w-3.5 h-3.5" />
                              Kuitansi
                            </button>
                          ) : sub.status === 'rejected' ? (
                            <button
                              type="button"
                              onClick={() => onNavigate('bayar-iuran')}
                              className="inline-flex items-center gap-1 px-2.5 py-1 bg-red-600 text-white font-bold text-[11px] rounded-xl shadow-xs"
                            >
                              Upload Ulang
                            </button>
                          ) : (
                            <span className="text-slate-400 text-[11px] italic">Diproses...</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

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

import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { PaymentSubmission } from '../../types';
import { ImagePreviewModal } from '../../components/ImagePreviewModal';
import { ReceiptModal } from '../../components/ReceiptModal';
import { WhatsAppModal } from '../../components/WhatsAppModal';
import {
  Clock,
  CheckCircle2,
  XCircle,
  Eye,
  FileText,
  MessageSquare,
  Building,
  CreditCard,
  Calendar,
  AlertCircle,
  Check,
  X,
  Search,
  Phone,
} from 'lucide-react';

const MONTH_NAMES = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

export const VerifikasiPembayaran: React.FC = () => {
  const {
    paymentSubmissions,
    approvePayment,
    rejectPayment,
    settings,
    formatCurrency,
    generateWhatsAppLink,
    formatPhoneDisplay,
    normalizePhoneNumber,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'pending' | 'all'>('pending');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals state
  const [previewImage, setPreviewImage] = useState<{ url: string; title: string } | null>(null);
  const [selectedReceipt, setSelectedReceipt] = useState<PaymentSubmission | null>(null);
  const [rejectingSub, setRejectingSub] = useState<PaymentSubmission | null>(null);
  const [rejectionReason, setRejectionReason] = useState('Nominal transfer tidak sesuai / Bukti tidak terbaca');
  const [waModalData, setWaModalData] = useState<{
    name: string;
    phone: string;
    message: string;
    title: string;
  } | null>(null);

  const pendingSubmissions = paymentSubmissions.filter(s => s.status === 'pending');
  const filteredSubmissions = paymentSubmissions.filter(s => {
    if (activeTab === 'pending' && s.status !== 'pending') return false;
    const q = searchQuery.toLowerCase();
    return (
      s.memberName.toLowerCase().includes(q) ||
      s.memberNap.toLowerCase().includes(q) ||
      s.bankName.toLowerCase().includes(q)
    );
  });

  const handleApprove = (sub: PaymentSubmission) => {
    approvePayment(sub.id);

    // Format WhatsApp message
    const periodText = sub.months.map(m => `${MONTH_NAMES[m.month - 1]} ${m.year}`).join(', ');
    const msg = settings.waTemplateApproved
      .replace(/\[NAMA\]/g, sub.memberName)
      .replace(/\[NAP\]/g, sub.memberNap)
      .replace(/\[PERIODE\]/g, periodText)
      .replace(/\[NOMINAL\]/g, formatCurrency(sub.totalAmount))
      .replace(/\[BENDAHARA\]/g, `${settings.bendaharaName} (${settings.bendaharaNap})`);

    setWaModalData({
      name: sub.memberName,
      phone: sub.memberWa,
      message: msg,
      title: 'Kirim Konfirmasi WhatsApp (Pembayaran Disetujui)',
    });
  };

  const handleConfirmReject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectingSub) return;

    rejectPayment(rejectingSub.id, rejectionReason);

    // Format WhatsApp rejection message
    const periodText = rejectingSub.months.map(m => `${MONTH_NAMES[m.month - 1]} ${m.year}`).join(', ');
    const msg = settings.waTemplateRejected
      .replace(/\[NAMA\]/g, rejectingSub.memberName)
      .replace(/\[NAP\]/g, rejectingSub.memberNap)
      .replace(/\[PERIODE\]/g, periodText)
      .replace(/\[NOMINAL\]/g, formatCurrency(rejectingSub.totalAmount))
      .replace(/\[ALASAN\]/g, rejectionReason);

    const subCopy = rejectingSub;
    setRejectingSub(null);

    setWaModalData({
      name: subCopy.memberName,
      phone: subCopy.memberWa,
      message: msg,
      title: 'Kirim Notifikasi Penolakan WhatsApp',
    });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Verifikasi Pembayaran Iuran
            </h1>
            {pendingSubmissions.length > 0 && (
              <span className="px-2.5 py-0.5 rounded-full bg-red-500 text-white text-xs font-black animate-pulse">
                {pendingSubmissions.length} Menunggu
              </span>
            )}
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Periksa bukti transfer anggota. Persetujuan otomatis memperbarui matrix iuran menjadi hijau dan mencatat kas masuk.
          </p>
        </div>

        {/* Tab Selector */}
        <div className="flex items-center bg-white p-1 rounded-2xl border border-slate-200 shadow-xs">
          <button
            type="button"
            onClick={() => setActiveTab('pending')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'pending'
                ? 'bg-amber-500 text-slate-950 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            Menunggu ({pendingSubmissions.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('all')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'all'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Semua Riwayat ({paymentSubmissions.length})
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div className="relative w-full sm:w-96">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Cari nama anggota, NAP, atau bank..."
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:border-amber-500 outline-hidden"
          />
        </div>
      </div>

      {/* Submissions Queue Cards */}
      {filteredSubmissions.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 shadow-xs">
          <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
          <h3 className="text-base font-extrabold text-slate-900">
            {activeTab === 'pending'
              ? 'Tidak ada antrean pembayaran yang menunggu verifikasi'
              : 'Tidak ada riwayat pembayaran'}
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Semua pengajuan pembayaran anggota telah selesai diproses.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filteredSubmissions.map(sub => {
            const periodNames = sub.months
              .map(m => `${MONTH_NAMES[m.month - 1]} ${m.year}`)
              .join(', ');

            return (
              <div
                key={sub.id}
                className={`bg-white rounded-3xl border p-5 sm:p-6 shadow-xs flex flex-col justify-between transition-all ${
                  sub.status === 'pending'
                    ? 'border-amber-400 ring-2 ring-amber-400/20'
                    : sub.status === 'approved'
                    ? 'border-emerald-200'
                    : 'border-red-200 bg-red-50/20'
                }`}
              >
                <div>
                  {/* Top Status & Date */}
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <span className="text-[11px] font-mono font-semibold text-slate-500">
                      ID: {sub.id} • {sub.submittedAt}
                    </span>
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-black uppercase tracking-wider ${
                        sub.status === 'pending'
                          ? 'bg-amber-100 text-amber-900 border border-amber-300'
                          : sub.status === 'approved'
                          ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                          : 'bg-red-100 text-red-900 border border-red-300'
                      }`}
                    >
                      {sub.status === 'pending' && <Clock className="w-3 h-3" />}
                      {sub.status === 'approved' && <CheckCircle2 className="w-3 h-3 text-emerald-600" />}
                      {sub.status === 'rejected' && <XCircle className="w-3 h-3 text-red-600" />}
                      {sub.status === 'pending'
                        ? 'Menunggu Verifikasi'
                        : sub.status === 'approved'
                        ? 'Disetujui'
                        : 'Ditolak'}
                    </span>
                  </div>

                  {/* Member Details */}
                  <div className="mt-4 flex items-start gap-4">
                    <div className="flex-1">
                      <h3 className="font-black text-slate-900 text-sm sm:text-base leading-tight">
                        {sub.memberName}
                      </h3>
                      <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 mt-1 text-xs">
                        <span className="text-emerald-800 font-mono font-bold">
                          NAP: {sub.memberNap}
                        </span>
                        {sub.memberWa && (
                          <a
                            href={generateWhatsAppLink(sub.memberWa, `Halo ${sub.memberName}, terkait pembayaran iuran DPC PATELKI KKU Anda...`)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-emerald-700 hover:text-emerald-900 font-bold bg-emerald-50 hover:bg-emerald-100 px-2 py-0.5 rounded-lg border border-emerald-200 transition-colors"
                            title="Chat WhatsApp Anggota"
                          >
                            <Phone className="w-3 h-3 text-emerald-600" />
                            {formatPhoneDisplay(sub.memberWa)}
                          </a>
                        )}
                      </div>
                      <p className="text-xs text-slate-600 mt-1 flex items-center gap-1">
                        <Building className="w-3.5 h-3.5 text-slate-400" /> {sub.memberInstansi}
                      </p>
                    </div>

                    {/* Nominal Pill */}
                    <div className="text-right">
                      <span className="text-[10px] font-bold text-slate-400 uppercase block">
                        Total Bayar ({sub.months.length} Bulan)
                      </span>
                      <span className="text-base sm:text-lg font-black text-slate-900 font-mono text-emerald-700">
                        {formatCurrency(sub.totalAmount)}
                      </span>
                    </div>
                  </div>

                  {/* Payment Breakdown */}
                  <div className="mt-4 p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2 text-xs">
                    <div className="flex items-start justify-between">
                      <span className="text-slate-500 font-semibold">Periode Bulan:</span>
                      <span className="font-bold text-slate-900 text-right max-w-[200px]">
                        {periodNames}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 font-semibold">Rekening Tujuan:</span>
                      <span className="font-medium text-slate-800">
                        {sub.bankName} ({sub.accountNumber})
                      </span>
                    </div>
                    {sub.notes && (
                      <div className="pt-1 border-t border-slate-200 text-slate-600 italic">
                        "{sub.notes}"
                      </div>
                    )}
                    {sub.rejectionReason && (
                      <div className="pt-1 border-t border-red-200 text-red-700 font-semibold">
                        Alasan Penolakan: "{sub.rejectionReason}"
                      </div>
                    )}
                  </div>

                  {/* Transfer Proof Thumbnail */}
                  <div className="mt-4 flex items-center justify-between p-3 rounded-2xl border border-slate-200 bg-white">
                    <div className="flex items-center gap-3">
                      <img
                        src={sub.proofUrl}
                        alt="Bukti Transfer"
                        onClick={() =>
                          setPreviewImage({
                            url: sub.proofUrl,
                            title: `Bukti Transfer - ${sub.memberName} (${formatCurrency(sub.totalAmount)})`,
                          })
                        }
                        className="w-14 h-14 object-cover rounded-xl border border-amber-300 cursor-pointer hover:opacity-90 transition-opacity"
                      />
                      <div>
                        <p className="text-xs font-bold text-slate-800">Bukti Transfer Anggota</p>
                        <p className="text-[11px] text-slate-500">{sub.proofName || 'struk_transfer.jpg'}</p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        setPreviewImage({
                          url: sub.proofUrl,
                          title: `Bukti Transfer - ${sub.memberName} (${formatCurrency(sub.totalAmount)})`,
                        })
                      }
                      className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5 text-emerald-600" />
                      Lihat Bukti
                    </button>
                  </div>
                </div>

                {/* Actions Bar */}
                <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between gap-2">
                  {sub.status === 'pending' ? (
                    <>
                      <button
                        type="button"
                        onClick={() => setRejectingSub(sub)}
                        className="flex-1 inline-flex items-center justify-center gap-1.5 py-2.5 bg-red-50 hover:bg-red-100 text-red-700 font-bold rounded-xl text-xs transition-colors cursor-pointer border border-red-200"
                      >
                        <X className="w-4 h-4" />
                        Tolak
                      </button>

                      <button
                        type="button"
                        onClick={() => handleApprove(sub)}
                        className="flex-2 inline-flex items-center justify-center gap-1.5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl text-xs transition-all shadow-md shadow-emerald-600/30 cursor-pointer"
                      >
                        <Check className="w-4 h-4" />
                        Setujui & Terverifikasi
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={() => setSelectedReceipt(sub)}
                        className="inline-flex items-center gap-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs transition-colors shadow-xs"
                      >
                        <FileText className="w-4 h-4" />
                        Cetak Kuitansi
                      </button>

                      <a
                        href={generateWhatsAppLink(sub.memberWa, `Halo ${sub.memberName}, saya Bendahara DPC PATELKI KKU ingin menghubungi terkait pembayaran iuran Anda.`)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-2 text-slate-600 hover:text-emerald-700 text-xs font-bold"
                      >
                        <MessageSquare className="w-4 h-4 text-emerald-600" />
                        Hubungi Anggota
                      </a>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Reject Modal with Reason Input */}
      {rejectingSub && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-150">
            <h3 className="font-extrabold text-base text-slate-900">Tolak Pembayaran Iuran</h3>
            <p className="text-xs text-slate-500 mt-1">
              Anggota: <span className="font-bold text-slate-800">{rejectingSub.memberName}</span> ({formatCurrency(rejectingSub.totalAmount)})
            </p>

            <form onSubmit={handleConfirmReject} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Alasan Penolakan:
                </label>
                <textarea
                  rows={3}
                  required
                  value={rejectionReason}
                  onChange={e => setRejectionReason(e.target.value)}
                  className="w-full text-xs p-3 rounded-xl border border-slate-300 focus:border-red-500 outline-hidden bg-slate-50"
                  placeholder="Ketik alasan penolakan..."
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setRejectingSub(null)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl shadow-xs"
                >
                  Konfirmasi Tolak
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Image Preview Zoom Modal */}
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

      {/* WhatsApp Modal Sender */}
      {waModalData && (
        <WhatsAppModal
          isOpen={true}
          onClose={() => setWaModalData(null)}
          recipientName={waModalData.name}
          recipientPhone={waModalData.phone}
          defaultMessage={waModalData.message}
          title={waModalData.title}
        />
      )}
    </div>
  );
};

export default VerifikasiPembayaran;

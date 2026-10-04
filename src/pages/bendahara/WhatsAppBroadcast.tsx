import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { WhatsAppModal } from '../../components/WhatsAppModal';
import {
  MessageSquare,
  Send,
  Users,
  Search,
  CheckCircle2,
  AlertCircle,
  Copy,
  Clock,
} from 'lucide-react';

const MONTH_NAMES = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

export const WhatsAppBroadcast: React.FC = () => {
  const {
    members,
    duesRecords,
    settings,
    formatCurrency,
    generateWhatsAppLink,
    formatPhoneDisplay,
    normalizePhoneNumber,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'reminder' | 'custom'>('reminder');
  const [searchQuery, setSearchQuery] = useState('');
  const [customMsg, setCustomMsg] = useState(
    `Yth. Rekan Sejawat Anggota DPC Patelki Kayong Utara,\n\nDiberitahukan bahwa Rapat Kerja Cabang & Pertemuan Ilmiah akan diselenggarakan pada akhir bulan ini. Mohon kehadiran seluruh rekan-rekan ATLM.\n\nSalam Hormat,\nPengurus DPC Patelki Kayong Utara`
  );

  const [selectedTarget, setSelectedTarget] = useState<{
    name: string;
    phone: string;
    message: string;
  } | null>(null);

  // Arrears targets
  const arrearsTargets = members
    .filter(m => m.status === 'aktif')
    .map(m => {
      const records = duesRecords.filter(d => d.memberId === m.id && d.year <= 2026 && d.status === 'unpaid');
      const arrearsAmount = records.length * settings.monthlyFee;
      return {
        member: m,
        unpaidCount: records.length,
        arrearsAmount,
      };
    })
    .filter(i => i.arrearsAmount > 0);

  const filteredArrears = arrearsTargets.filter(i => {
    const q = searchQuery.toLowerCase();
    return (
      i.member.nama.toLowerCase().includes(q) ||
      i.member.nap.toLowerCase().includes(q) ||
      i.member.instansi.toLowerCase().includes(q)
    );
  });

  const handleOpenReminder = (item: any) => {
    const msg = settings.waTemplateReminder
      .replace(/\[NAMA\]/g, `${item.member.nama}, ${item.member.gelar}`)
      .replace(/\[NAP\]/g, item.member.nap)
      .replace(/\[TANGGAL\]/g, new Date().toLocaleDateString('id-ID'))
      .replace(/\[NOMINAL\]/g, formatCurrency(item.arrearsAmount))
      .replace(/\[PERIODE\]/g, `${item.unpaidCount} Bulan`);

    setSelectedTarget({
      name: `${item.member.nama}, ${item.member.gelar}`,
      phone: normalizePhoneNumber(item.member.noWa),
      message: msg,
    });
  };

  const handleOpenCustom = (m: any) => {
    const personalized = customMsg.replace(/\[NAMA\]/g, `${m.nama}, ${m.gelar}`);
    setSelectedTarget({
      name: `${m.nama}, ${m.gelar}`,
      phone: normalizePhoneNumber(m.noWa),
      message: personalized,
    });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Pusat Pesan & Tagihan WhatsApp
            </h1>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-black">
              Direct WA API
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Kirimkan notifikasi tagihan iuran bulanan dan pengumuman DPC Patelki Kayong Utara langsung ke WhatsApp anggota.
          </p>
        </div>

        {/* Tab switch */}
        <div className="flex items-center bg-white p-1 rounded-2xl border border-slate-200 shadow-xs">
          <button
            type="button"
            onClick={() => setActiveTab('reminder')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'reminder'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <AlertCircle className="w-3.5 h-3.5" />
            Pengingat Tunggakan ({arrearsTargets.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('custom')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'custom'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            Pengumuman / Siaran DPC
          </button>
        </div>
      </div>

      {activeTab === 'reminder' ? (
        /* Reminder Tab */
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
            <div className="relative w-full sm:w-96">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Cari anggota yang menunggak..."
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:border-amber-500 outline-hidden"
              />
            </div>

            <span className="text-xs font-bold text-red-600 hidden sm:block">
              ⚠️ {arrearsTargets.length} Anggota Belum Lunas
            </span>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-900 text-white font-black uppercase text-[11px] tracking-wider">
                  <tr>
                    <th className="py-4 px-4 w-12 text-center">No</th>
                    <th className="py-4 px-4">Nama Anggota</th>
                    <th className="py-4 px-4">NAP & Instansi</th>
                    <th className="py-4 px-4 text-center">Tunggakan</th>
                    <th className="py-4 px-4 text-right">Nominal Tagihan</th>
                    <th className="py-4 px-4 text-center">Aksi Kirim</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredArrears.map((item, idx) => (
                    <tr key={item.member.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3.5 px-4 text-center font-bold text-slate-400">{idx + 1}</td>
                      <td className="py-3.5 px-4 font-extrabold text-slate-900">
                        {item.member.nama}, {item.member.gelar}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-mono font-bold text-emerald-800">{item.member.nap}</div>
                        <div className="text-[11px] text-slate-500">{item.member.instansi} • {formatPhoneDisplay(item.member.noWa)}</div>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className="px-2.5 py-1 rounded-full bg-red-100 text-red-800 font-bold text-[11px]">
                          {item.unpaidCount} Bulan
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-black text-red-600 text-sm">
                        {formatCurrency(item.arrearsAmount)}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <button
                          type="button"
                          onClick={() => handleOpenReminder(item)}
                          className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-transform active:scale-95"
                        >
                          <Send className="w-3.5 h-3.5" />
                          Tagih WhatsApp
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        /* Custom Broadcast Tab */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
            <h3 className="font-black text-sm text-slate-900">Format Pesan Siaran DPC</h3>
            <textarea
              rows={8}
              value={customMsg}
              onChange={e => setCustomMsg(e.target.value)}
              className="w-full text-xs font-mono p-3 rounded-2xl border border-slate-300 bg-slate-50 outline-hidden leading-relaxed"
              placeholder="Tulis pesan pengumuman..."
            />
            <p className="text-[11px] text-slate-500">
              *Pesan akan dipersonalisasi dengan nama anggota sebelum dikirimkan.
            </p>
          </div>

          <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
            <h3 className="font-black text-sm text-slate-900">
              Kirim ke Anggota ({members.filter(m => m.status === 'aktif').length} Aktif)
            </h3>
            <div className="max-h-96 overflow-y-auto divide-y divide-slate-100 border border-slate-100 rounded-2xl custom-scrollbar">
              {members
                .filter(m => m.status === 'aktif')
                .map(m => (
                  <div key={m.id} className="p-3.5 flex items-center justify-between hover:bg-slate-50">
                    <div>
                      <p className="font-bold text-xs text-slate-900">{m.nama}, {m.gelar}</p>
                      <p className="text-[11px] text-slate-500 font-mono">{m.nap} • {m.instansi} • {formatPhoneDisplay(m.noWa)}</p>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleOpenCustom(m)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors"
                    >
                      <Send className="w-3 h-3" /> Kirim
                    </button>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* WhatsApp Modal */}
      {selectedTarget && (
        <WhatsAppModal
          isOpen={true}
          onClose={() => setSelectedTarget(null)}
          recipientName={selectedTarget.name}
          recipientPhone={selectedTarget.phone}
          defaultMessage={selectedTarget.message}
          title="Kirim Pesan WhatsApp DPC Patelki"
        />
      )}
    </div>
  );
};

export default WhatsAppBroadcast;

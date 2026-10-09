import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import {
  MessageSquare,
  Send,
  Users,
  CheckCircle2,
  Clock,
  AlertCircle,
  Copy,
  Check,
  X,
  Phone,
  Sparkles,
  ExternalLink,
  SlidersHorizontal,
  Play,
  RotateCcw,
  ShieldCheck,
  ArrowRight,
  Filter,
  Search,
  CheckSquare,
  Square,
} from 'lucide-react';
import { Member, DuesRecord } from '../../types';

interface AutoWhatsAppReminderModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultPeriodYear?: number;
}

interface ArrearsMemberItem {
  member: Member;
  unpaidCount: number;
  unpaidMonthsStr: string;
  arrearsAmount: number;
  formattedMessage: string;
  cleanPhone: string;
  waLink: string;
  lastRemindedDate?: string | null;
}

const MONTH_NAMES = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

export const AutoWhatsAppReminderModal: React.FC<AutoWhatsAppReminderModalProps> = ({
  isOpen,
  onClose,
  defaultPeriodYear,
}) => {
  const {
    members,
    duesRecords,
    settings,
    bankAccounts,
    formatCurrency,
    formatPhoneDisplay,
    normalizePhoneNumber,
    generateWhatsAppLink,
    addActivityLog,
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [minMonthsFilter, setMinMonthsFilter] = useState<number>(1);
  const [selectedInstansi, setSelectedInstansi] = useState<string>('all');
  const [selectedMemberIds, setSelectedMemberIds] = useState<Set<string>>(new Set());

  // Queue runner state
  const [isQueueRunning, setIsQueueRunning] = useState(false);
  const [queueIndex, setQueueIndex] = useState(0);
  const [copiedAll, setCopiedAll] = useState(false);
  const [copiedCurrent, setCopiedCurrent] = useState(false);

  // Local storage history of reminded timestamps
  const [remindedHistory, setRemindedHistory] = useState<Record<string, string>>(() => {
    try {
      const saved = localStorage.getItem('patelki_wa_reminders_history');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;

  // Compute all members with arrears
  const arrearsData: ArrearsMemberItem[] = useMemo(() => {
    const activeMembers = members.filter(m => m.status === 'aktif');
    const primaryBank = bankAccounts.find(b => b.isPrimary) || bankAccounts[0];

    const bankInfoText = primaryBank
      ? `${primaryBank.bankName}: ${primaryBank.accountNumber} (a/n ${primaryBank.accountHolder})`
      : 'Bank Kalbar: 5021-0899-2311 & BRI: 0342-01-002891-53-4 (a/n DPC PATELKI Kayong Utara)';

    return activeMembers.map(member => {
      // Find unpaid records up to current month / year
      const unpaid: { year: number; month: number }[] = [];

      duesRecords.forEach(d => {
        if (d.memberId === member.id || (member.nap && d.memberId === member.nap)) {
          if (d.status === 'unpaid') {
            // Check if year is within target
            if (!defaultPeriodYear || d.year <= defaultPeriodYear) {
              unpaid.push({ year: d.year, month: d.month });
            }
          }
        }
      });

      // Sort by year, month
      unpaid.sort((a, b) => a.year - b.year || a.month - b.month);

      const unpaidCount = unpaid.length;
      const arrearsAmount = unpaidCount * settings.monthlyFee;

      let unpaidMonthsStr = '';
      if (unpaidCount > 0) {
        if (unpaidCount <= 3) {
          unpaidMonthsStr = unpaid.map(u => `${MONTH_NAMES[u.month - 1]} ${u.year}`).join(', ');
        } else {
          const first = unpaid[0];
          const last = unpaid[unpaid.length - 1];
          unpaidMonthsStr = `${MONTH_NAMES[first.month - 1]} ${first.year} s.d. ${MONTH_NAMES[last.month - 1]} ${last.year} (${unpaidCount} Bulan)`;
        }
      }

      // Generate personalized message using settings template
      const template = settings.waTemplateReminder || `Yth. Rekan Sejawat [NAMA] ([NAP]),

Berdasarkan data pembukuan DPC Patelki Kayong Utara per [TANGGAL], tercatat kewajiban iuran Anda yang belum terselesaikan sebesar [NOMINAL] untuk periode [PERIODE].

Mohon kesediaannya untuk melakukan pembayaran melalui transfer ke rekening resmi DPC:
- ${bankInfoText}

Setelah transfer, silakan unggah bukti di aplikasi iuran. Terima kasih atas kerja samanya.

Salam Hangat,
Bendahara DPC Patelki Kayong Utara
[BENDAHARA]`;

      const nowStr = new Date().toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });

      const memberFullname = `${member.nama}${member.gelar ? ', ' + member.gelar : ''}`;
      const bendaharaFullname = settings.bendaharaName || 'Bendahara DPC PATELKI Kayong Utara';

      const personalizedMessage = template
        .replace(/\[NAMA\]/g, memberFullname)
        .replace(/\[NAP\]/g, member.nap || '-')
        .replace(/\[PERIODE\]/g, unpaidMonthsStr || `${unpaidCount} Bulan`)
        .replace(/\[NOMINAL\]/g, formatCurrency(arrearsAmount))
        .replace(/\[TANGGAL\]/g, nowStr)
        .replace(/\[BENDAHARA\]/g, bendaharaFullname)
        .replace(/\[CABANG\]/g, settings.branchName || 'DPC PATELKI Kayong Utara')
        .replace(/\[BANK\]/g, bankInfoText);

      const cleanPhone = normalizePhoneNumber(member.noWa);
      const waLink = generateWhatsAppLink(cleanPhone, personalizedMessage);
      const lastRemindedDate = remindedHistory[member.id] || null;

      return {
        member,
        unpaidCount,
        unpaidMonthsStr,
        arrearsAmount,
        formattedMessage: personalizedMessage,
        cleanPhone,
        waLink,
        lastRemindedDate,
      };
    }).filter(item => item.unpaidCount > 0);
  }, [
    members,
    duesRecords,
    settings,
    bankAccounts,
    defaultPeriodYear,
    remindedHistory,
    formatCurrency,
    normalizePhoneNumber,
    generateWhatsAppLink,
  ]);

  // List of unique institutions for filter
  const instansiOptions = useMemo(() => {
    const set = new Set<string>();
    arrearsData.forEach(i => {
      if (i.member.instansi) set.add(i.member.instansi.trim());
    });
    return Array.from(set).sort();
  }, [arrearsData]);

  // Filtered members list
  const filteredList = useMemo(() => {
    return arrearsData.filter(item => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        q === '' ||
        item.member.nama.toLowerCase().includes(q) ||
        (item.member.nap && item.member.nap.toLowerCase().includes(q)) ||
        (item.member.instansi && item.member.instansi.toLowerCase().includes(q));

      const matchesMin = item.unpaidCount >= minMonthsFilter;
      const matchesInstansi =
        selectedInstansi === 'all' || item.member.instansi === selectedInstansi;

      return matchesSearch && matchesMin && matchesInstansi;
    });
  }, [arrearsData, searchQuery, minMonthsFilter, selectedInstansi]);

  // Initialize selected members to all filtered on first load
  useEffect(() => {
    if (filteredList.length > 0 && selectedMemberIds.size === 0) {
      setSelectedMemberIds(new Set(filteredList.map(i => i.member.id)));
    }
  }, [filteredList]);

  // The active targets for dispatch
  const targetQueue = useMemo(() => {
    return filteredList.filter(item => selectedMemberIds.has(item.member.id));
  }, [filteredList, selectedMemberIds]);

  const currentQueueItem = targetQueue[queueIndex] || null;

  // Toggle selection
  const handleToggleMember = (id: string) => {
    setSelectedMemberIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSelectAll = () => {
    setSelectedMemberIds(new Set(filteredList.map(i => i.member.id)));
  };

  const handleDeselectAll = () => {
    setSelectedMemberIds(new Set());
  };

  // Mark member as reminded
  const markAsReminded = (memberId: string) => {
    const updated = {
      ...remindedHistory,
      [memberId]: new Date().toISOString(),
    };
    setRemindedHistory(updated);
    try {
      localStorage.setItem('patelki_wa_reminders_history', JSON.stringify(updated));
    } catch (e) {
      console.error('Failed to save reminder history:', e);
    }
  };

  // Send single WhatsApp message
  const handleSendSingle = (item: ArrearsMemberItem) => {
    markAsReminded(item.member.id);
    window.open(item.waLink, '_blank');

    addActivityLog({
      actorName: settings.bendaharaName ? `Bendahara DPC (${settings.bendaharaName})` : 'Bendahara DPC',
      actorRole: 'bendahara',
      category: 'dues',
      action: 'update',
      title: `Pengingat WhatsApp Terkirim: ${item.member.nama}`,
      description: `Pesan tagihan otomatis ${item.unpaidCount} bulan (${formatCurrency(item.arrearsAmount)}) dikirimkan ke ${item.cleanPhone}.`,
      newValue: `Nomor: ${item.cleanPhone}, Periode: ${item.unpaidMonthsStr}`,
    });
  };

  // Start sequential queue runner
  const handleStartQueue = () => {
    if (targetQueue.length === 0) return;
    setQueueIndex(0);
    setIsQueueRunning(true);
  };

  // Dispatch current queue item & advance
  const handleSendAndNextQueue = () => {
    if (!currentQueueItem) return;
    handleSendSingle(currentQueueItem);

    if (queueIndex + 1 < targetQueue.length) {
      setQueueIndex(queueIndex + 1);
    } else {
      // Completed all
      setIsQueueRunning(false);
      addActivityLog({
        actorName: settings.bendaharaName ? `Bendahara DPC (${settings.bendaharaName})` : 'Bendahara DPC',
        actorRole: 'bendahara',
        category: 'dues',
        action: 'update',
        title: `Pemicu Pengingat Otomatis Massal Selesai (${targetQueue.length} Anggota)`,
        description: `Seluruh antrean pengingat WhatsApp tunggakan iuran telah diproses menggunakan konfigurasi template resmi.`,
      });
    }
  };

  // Copy all formatted messages
  const handleCopyAllMessages = () => {
    const textAll = targetQueue
      .map(
        (i, idx) =>
          `[TARGET ${idx + 1}] ${i.member.nama} (${i.cleanPhone}):\n${i.formattedMessage}\n---`
      )
      .join('\n\n');

    navigator.clipboard.writeText(textAll);
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 2500);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/65 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 bg-linear-to-r from-emerald-900 via-emerald-800 to-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center justify-center shrink-0">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-black text-sm sm:text-base">
                  Pemicu Pengingat WhatsApp Otomatis
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-emerald-400 text-slate-950 text-[10px] font-black uppercase">
                  Template Pengaturan
                </span>
              </div>
              <p className="text-[11px] text-emerald-200/90 mt-0.5">
                Pengingat tagihan iuran resmi DPC Patelki Kayong Utara menggunakan nomor WhatsApp Bendahara: <span className="font-mono font-bold text-amber-300">{formatPhoneDisplay(settings.contactWa) || 'Belum diatur'}</span>
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-emerald-800/80 hover:bg-emerald-700 text-emerald-100 flex items-center justify-center font-bold text-sm cursor-pointer transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5 custom-scrollbar">
          {/* Active Configuration Info Banner */}
          <div className="p-4 bg-emerald-50/80 border border-emerald-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-emerald-950">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Konfigurasi WhatsApp Modul Pengaturan DPC Aktif</span>
              </div>
              <p className="text-emerald-800 text-[11px] leading-relaxed">
                Pesan otomatis menggunakan template <code>waTemplateReminder</code> dan menyertakan nama pejabat ({settings.bendaharaName || 'Bendahara'}), nominal iuran ({formatCurrency(settings.monthlyFee)}/bln), serta rekening bank resmi DPC.
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={handleCopyAllMessages}
                className="px-3 py-1.5 bg-white hover:bg-emerald-100 border border-emerald-300 text-emerald-800 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Salin seluruh draf pesan tagihan anggota terpilih"
              >
                {copiedAll ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedAll ? 'Tersalin ✓' : 'Salin Semua Teks'}</span>
              </button>
            </div>
          </div>

          {/* QUEUE RUNNER ACTIVE VIEW */}
          {isQueueRunning && currentQueueItem ? (
            <div className="p-6 bg-slate-900 text-white rounded-3xl shadow-xl space-y-5 border border-slate-800 animate-in fade-in slide-in-from-top-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
                <div>
                  <span className="px-2.5 py-0.5 rounded-full bg-amber-400 text-slate-950 text-[10px] font-black uppercase">
                    Antrean Otomatis Aktif
                  </span>
                  <h4 className="text-base font-black text-white mt-1">
                    Mengirim Pengingat ke {queueIndex + 1} dari {targetQueue.length} Anggota
                  </h4>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsQueueRunning(false)}
                    className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                  >
                    Hentikan Antrean
                  </button>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs text-slate-400 font-mono">
                  <span>Kemajuan: {queueIndex + 1}/{targetQueue.length}</span>
                  <span>{Math.round(((queueIndex + 1) / targetQueue.length) * 100)}%</span>
                </div>
                <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
                  <div
                    style={{ width: `${((queueIndex + 1) / targetQueue.length) * 100}%` }}
                    className="bg-emerald-500 h-full rounded-full transition-all duration-300"
                  />
                </div>
              </div>

              {/* Target Card */}
              <div className="p-4 bg-slate-800/80 rounded-2xl border border-slate-700/80 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h5 className="font-black text-white text-sm">
                      {currentQueueItem.member.nama}, {currentQueueItem.member.gelar}
                    </h5>
                    <p className="text-xs text-slate-300 font-mono">
                      NAP: {currentQueueItem.member.nap} • {currentQueueItem.member.instansi} • WA: {formatPhoneDisplay(currentQueueItem.cleanPhone)}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="px-2 py-0.5 rounded-md bg-rose-500/20 text-rose-300 border border-rose-500/30 font-bold text-xs">
                      {currentQueueItem.unpaidCount} Bulan Tunggakan
                    </span>
                    <p className="text-sm font-black font-mono text-amber-300 mt-1">
                      {formatCurrency(currentQueueItem.arrearsAmount)}
                    </p>
                  </div>
                </div>

                {/* Message Preview */}
                <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 font-mono text-xs text-emerald-300 whitespace-pre-wrap leading-relaxed max-h-40 overflow-y-auto custom-scrollbar">
                  {currentQueueItem.formattedMessage}
                </div>
              </div>

              {/* Dispatch Action */}
              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(currentQueueItem.formattedMessage);
                    setCopiedCurrent(true);
                    setTimeout(() => setCopiedCurrent(false), 2000);
                  }}
                  className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  {copiedCurrent ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  <span>{copiedCurrent ? 'Tersalin' : 'Salin Pesan Ini'}</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      if (queueIndex + 1 < targetQueue.length) {
                        setQueueIndex(queueIndex + 1);
                      } else {
                        setIsQueueRunning(false);
                      }
                    }}
                    className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl transition-colors cursor-pointer"
                  >
                    Lewati (Next)
                  </button>

                  <button
                    type="button"
                    onClick={handleSendAndNextQueue}
                    className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs sm:text-sm rounded-xl shadow-lg shadow-emerald-500/20 transition-all cursor-pointer flex items-center gap-2 active:scale-95"
                  >
                    <Send className="w-4 h-4" />
                    <span>Buka WA & Lanjut ({queueIndex + 1}/{targetQueue.length})</span>
                  </button>
                </div>
              </div>
            </div>
          ) : null}

          {/* Filter Bar */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3 text-xs">
            <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
              {/* Search */}
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Cari anggota menunggak berdasarkan nama, NAP, instansi..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl font-medium focus:outline-hidden focus:border-emerald-600 transition-all text-xs"
                />
              </div>

              {/* Start Batch Queue Button */}
              <button
                type="button"
                onClick={handleStartQueue}
                disabled={targetQueue.length === 0 || isQueueRunning}
                className="px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-black rounded-xl shadow-md shadow-emerald-700/20 text-xs flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95 disabled:opacity-50"
              >
                <Play className="w-4 h-4" />
                <span>Picu Kirim Antrean ({targetQueue.length} Terpilih)</span>
              </button>
            </div>

            {/* Filter Dropdowns */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2 border-t border-slate-200 text-xs">
              <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-slate-200">
                <Filter className="w-3.5 h-3.5 text-slate-400" />
                <span className="font-bold text-slate-600 shrink-0">Minimal Tunggakan:</span>
                <select
                  value={minMonthsFilter}
                  onChange={e => setMinMonthsFilter(Number(e.target.value))}
                  className="w-full bg-transparent font-medium text-slate-800 outline-hidden cursor-pointer"
                >
                  <option value={1}>Semua Tunggakan (≥ 1 Bulan)</option>
                  <option value={2}>Menunggak ≥ 2 Bulan</option>
                  <option value={3}>Menunggak ≥ 3 Bulan</option>
                  <option value={6}>Menunggak ≥ 6 Bulan</option>
                  <option value={12}>Menunggak ≥ 1 Tahun (12 Bln)</option>
                </select>
              </div>

              <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-slate-200">
                <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400" />
                <span className="font-bold text-slate-600 shrink-0">Instansi:</span>
                <select
                  value={selectedInstansi}
                  onChange={e => setSelectedInstansi(e.target.value)}
                  className="w-full bg-transparent font-medium text-slate-800 outline-hidden cursor-pointer"
                >
                  <option value="all">Semua Instansi</option>
                  {instansiOptions.map(inst => (
                    <option key={inst} value={inst}>
                      {inst}
                    </option>
                  ))}
                </select>
              </div>

              {/* Select / Deselect All */}
              <div className="flex items-center justify-between sm:justify-end gap-2">
                <button
                  type="button"
                  onClick={handleSelectAll}
                  className="px-3 py-1.5 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 font-bold rounded-xl text-[11px] cursor-pointer"
                >
                  Pilih Semua ({filteredList.length})
                </button>
                <button
                  type="button"
                  onClick={handleDeselectAll}
                  className="px-3 py-1.5 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 font-bold rounded-xl text-[11px] cursor-pointer"
                >
                  Batalkan Pilihan
                </button>
              </div>
            </div>
          </div>

          {/* Members Arrears List Table */}
          {filteredList.length === 0 ? (
            <div className="p-10 text-center bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
              <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
              <h4 className="font-bold text-slate-800 text-sm">Tidak ada anggota menunggak</h4>
              <p className="text-xs text-slate-500">
                Seluruh anggota telah melunasi kewajiban iuran sesuai kriteria filter yang Anda pilih.
              </p>
            </div>
          ) : (
            <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
              <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 custom-scrollbar">
                {filteredList.map((item, idx) => {
                  const isSelected = selectedMemberIds.has(item.member.id);
                  const isReminded = !!item.lastRemindedDate;

                  return (
                    <div
                      key={item.member.id}
                      className={`p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors ${
                        isSelected ? 'bg-white hover:bg-emerald-50/40' : 'bg-slate-50/70 opacity-60'
                      }`}
                    >
                      <div className="flex items-start gap-3 flex-1">
                        <button
                          type="button"
                          onClick={() => handleToggleMember(item.member.id)}
                          className="mt-0.5 text-slate-400 hover:text-emerald-700 cursor-pointer shrink-0"
                        >
                          {isSelected ? (
                            <CheckSquare className="w-5 h-5 text-emerald-600" />
                          ) : (
                            <Square className="w-5 h-5" />
                          )}
                        </button>

                        <div className="space-y-1 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-black text-slate-900 text-xs sm:text-sm">
                              {item.member.nama}, {item.member.gelar}
                            </span>
                            <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 font-bold text-[10px]">
                              {item.unpaidCount} Bln Tunggakan
                            </span>
                            {isReminded && (
                              <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-semibold text-[10px] flex items-center gap-1">
                                <Clock className="w-3 h-3 text-slate-400" />
                                Pernah Diingatkan ({new Date(item.lastRemindedDate!).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })})
                              </span>
                            )}
                          </div>

                          <p className="text-[11px] text-slate-500 font-mono">
                            NAP: {item.member.nap || '-'} • {item.member.instansi || '-'} • WA: {formatPhoneDisplay(item.cleanPhone)}
                          </p>
                          <p className="text-[11px] text-slate-600">
                            Periode: <strong className="text-slate-800">{item.unpaidMonthsStr}</strong>
                          </p>
                        </div>
                      </div>

                      {/* Right side: Amount & Direct Action */}
                      <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                        <span className="text-sm font-black font-mono text-rose-600">
                          {formatCurrency(item.arrearsAmount)}
                        </span>

                        <button
                          type="button"
                          onClick={() => handleSendSingle(item)}
                          className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer active:scale-95"
                          title="Buka langsung tautan WhatsApp wa.me untuk anggota ini"
                        >
                          <Send className="w-3.5 h-3.5" />
                          <span>Kirim WA</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0 text-xs">
          <div className="text-slate-600">
            Terpilih: <strong>{targetQueue.length}</strong> dari <strong>{filteredList.length}</strong> anggota menunggak (Total Kewajiban: <span className="font-mono font-bold text-rose-700">{formatCurrency(targetQueue.reduce((s, i) => s + i.arrearsAmount, 0))}</span>)
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 font-bold rounded-xl text-xs cursor-pointer"
            >
              Tutup
            </button>

            <button
              type="button"
              onClick={handleStartQueue}
              disabled={targetQueue.length === 0 || isQueueRunning}
              className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl shadow-xs text-xs flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <Play className="w-3.5 h-3.5" />
              <span>Mulai Kirim WhatsApp ({targetQueue.length})</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AutoWhatsAppReminderModal;

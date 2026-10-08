import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { SocialService, SocialServiceExpense } from '../../types';
import * as XLSX from 'xlsx';
import { PatelkiLogo } from '../../components/PatelkiLogo';
import {
  HeartHandshake,
  PlusCircle,
  Search,
  FileSpreadsheet,
  Printer,
  Trash2,
  Calendar,
  MapPin,
  Users,
  Wallet,
  CheckCircle2,
  Image as ImageIcon,
  Plus,
  X,
  FileText,
  Receipt,
  UserCheck,
  Building,
  Info,
  ExternalLink,
  Award,
  Edit3,
  Upload,
  Check,
} from 'lucide-react';

export const BaktiSosial: React.FC = () => {
  const {
    socialServices,
    addSocialService,
    updateSocialService,
    deleteSocialService,
    settings,
    formatCurrency,
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingSoc, setEditingSoc] = useState<SocialService | null>(null);
  const [viewingLPJ, setViewingLPJ] = useState<SocialService | null>(null);
  const [viewingProofImage, setViewingProofImage] = useState<string | null>(null);
  const [socToDelete, setSocToDelete] = useState<SocialService | null>(null);
  const [isDeletingSoc, setIsDeletingSoc] = useState(false);

  // New social service state
  const [newSoc, setNewSoc] = useState<{
    title: string;
    date: string;
    location: string;
    picName: string;
    fundSource: string;
    totalBudget: number;
    beneficiaries: string;
    description: string;
    lpjNotes: string;
    documentationUrls: string[];
    expenses: SocialServiceExpense[];
  }>({
    title: '',
    date: new Date().toISOString().split('T')[0],
    location: '',
    picName: '',
    fundSource: 'Kas DPC & Donasi',
    totalBudget: 0,
    beneficiaries: '',
    description: '',
    lpjNotes: '',
    documentationUrls: [],
    expenses: [],
  });

  // State for dynamic item expense in modal form
  const [tempExpenseItem, setTempExpenseItem] = useState({ item: '', amount: 0, notes: '', proofUrl: '' });
  const [tempDocUrl, setTempDocUrl] = useState('');

  const totalSpentAll = socialServices.reduce((sum, s) => {
    // Math safety: sum of expenses or fallback to totalSpent
    const expSum = s.expenses && s.expenses.length > 0
      ? s.expenses.reduce((sub, item) => sub + Number(item.amount || 0), 0)
      : s.totalSpent;
    return sum + expSum;
  }, 0);

  const totalBeneficiariesApprox = socialServices.length * 150;

  const filteredList = socialServices.filter(s => {
    const q = searchQuery.toLowerCase();
    return (
      s.title.toLowerCase().includes(q) ||
      s.location.toLowerCase().includes(q) ||
      s.beneficiaries.toLowerCase().includes(q) ||
      (s.picName && s.picName.toLowerCase().includes(q))
    );
  });

  // Helper: Get real sum of expenses for a social service
  const getCalculatedSpent = (soc: SocialService | typeof newSoc) => {
    if (!soc.expenses || soc.expenses.length === 0) return (soc as SocialService).totalSpent || 0;
    return soc.expenses.reduce((sum, item) => sum + Number(item.amount || 0), 0);
  };

  const handleAddExpenseItem = (targetState: 'new' | 'edit') => {
    if (!tempExpenseItem.item || tempExpenseItem.amount <= 0) {
      alert('Nama item dan nominal pengeluaran wajib diisi!');
      return;
    }

    const newItem: SocialServiceExpense = {
      id: `exp-${Date.now()}`,
      item: tempExpenseItem.item,
      amount: Number(tempExpenseItem.amount),
      notes: tempExpenseItem.notes,
      proofUrl: tempExpenseItem.proofUrl,
    };

    if (targetState === 'new') {
      setNewSoc(prev => ({
        ...prev,
        expenses: [...prev.expenses, newItem],
      }));
    } else if (editingSoc) {
      const updatedExpenses = [...(editingSoc.expenses || []), newItem];
      const updatedSpent = updatedExpenses.reduce((sum, i) => sum + Number(i.amount || 0), 0);
      setEditingSoc({
        ...editingSoc,
        expenses: updatedExpenses,
        totalSpent: updatedSpent,
      });
    }

    setTempExpenseItem({ item: '', amount: 0, notes: '', proofUrl: '' });
  };

  const handleRemoveExpenseItem = (id: string, targetState: 'new' | 'edit') => {
    if (targetState === 'new') {
      setNewSoc(prev => ({
        ...prev,
        expenses: prev.expenses.filter(e => e.id !== id),
      }));
    } else if (editingSoc) {
      const updatedExpenses = (editingSoc.expenses || []).filter(e => e.id !== id);
      const updatedSpent = updatedExpenses.reduce((sum, i) => sum + Number(i.amount || 0), 0);
      setEditingSoc({
        ...editingSoc,
        expenses: updatedExpenses,
        totalSpent: updatedSpent,
      });
    }
  };

  const handleFileUploadReceipt = (e: React.ChangeEvent<HTMLInputElement>, targetExpenseId?: string, isEditModal: boolean = false) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const resultStr = reader.result as string;
      if (!resultStr) return;

      if (targetExpenseId && viewingLPJ) {
        // Direct receipt attachment from LPJ view
        const updatedExpenses = (viewingLPJ.expenses || []).map(exp =>
          exp.id === targetExpenseId ? { ...exp, proofUrl: resultStr } : exp
        );
        const updatedSoc = { ...viewingLPJ, expenses: updatedExpenses };
        updateSocialService(viewingLPJ.id, updatedSoc);
        setViewingLPJ(updatedSoc);
      } else if (targetExpenseId && editingSoc) {
        // Receipt attachment inside Edit Modal for specific item
        const updatedExpenses = (editingSoc.expenses || []).map(exp =>
          exp.id === targetExpenseId ? { ...exp, proofUrl: resultStr } : exp
        );
        setEditingSoc({ ...editingSoc, expenses: updatedExpenses });
      } else {
        // Temp receipt for newly forming item
        setTempExpenseItem(prev => ({ ...prev, proofUrl: resultStr }));
      }
    };
    reader.readAsDataURL(file);
  };

  const handleFileUploadDoc = (e: React.ChangeEvent<HTMLInputElement>, isEdit: boolean = false) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const resultStr = reader.result as string;
        if (!resultStr) return;

        if (isEdit && editingSoc) {
          setEditingSoc(prev => prev ? {
            ...prev,
            documentationUrls: [...(prev.documentationUrls || []), resultStr],
          } : null);
        } else {
          setNewSoc(prev => ({
            ...prev,
            documentationUrls: [...prev.documentationUrls, resultStr],
          }));
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const handleCreateSocial = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSoc.title || !newSoc.location) {
      alert('Judul kegiatan dan lokasi wajib diisi!');
      return;
    }

    const calculatedSpent = newSoc.expenses.reduce((sum, item) => sum + Number(item.amount || 0), 0);

    addSocialService({
      title: newSoc.title,
      date: newSoc.date,
      location: newSoc.location,
      picName: newSoc.picName,
      fundSource: newSoc.fundSource,
      totalBudget: Number(newSoc.totalBudget),
      totalSpent: calculatedSpent,
      beneficiaries: newSoc.beneficiaries,
      description: newSoc.description,
      lpjNotes: newSoc.lpjNotes,
      documentationUrls: newSoc.documentationUrls,
      expenses: newSoc.expenses,
    });

    setShowAddModal(false);
  };

  const handleSaveEditSocial = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSoc) return;

    const calculatedSpent = (editingSoc.expenses || []).reduce((sum, item) => sum + Number(item.amount || 0), 0);

    updateSocialService(editingSoc.id, {
      ...editingSoc,
      totalSpent: calculatedSpent,
    });

    if (viewingLPJ && viewingLPJ.id === editingSoc.id) {
      setViewingLPJ({
        ...editingSoc,
        totalSpent: calculatedSpent,
      });
    }

    setEditingSoc(null);
  };

  const handleExportExcel = () => {
    const exportData = socialServices.map((s, idx) => {
      const realSpent = getCalculatedSpent(s);
      return {
        No: idx + 1,
        'Nama Kegiatan Baksos': s.title,
        Tanggal: s.date,
        Lokasi: s.location,
        'Penanggung Jawab (PIC)': s.picName || '-',
        'Sumber Dana': s.fundSource,
        'Total Pagu Anggaran (Rp)': s.totalBudget,
        'Total Realisasi Pengeluaran (Rp)': realSpent,
        'Selisih Varian (Rp)': s.totalBudget - realSpent,
        'Penerima Manfaat': s.beneficiaries,
        'Deskripsi / Hasil': s.description,
        'Catatan LPJ': s.lpjNotes || '-',
        'Jumlah Item Pengeluaran': s.expenses?.length || 0,
        'Jumlah Dokumentasi Foto': s.documentationUrls?.length || 0,
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'LPJ_Bakti_Sosial');
    XLSX.writeFile(workbook, `Laporan_Baksos_Patelki_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Bakti Sosial & Pengabdian Masyarakat
            </h1>
            <span className="px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-800 text-xs font-black">
              {socialServices.length} Kegiatan Terdaftar
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Pencatatan resmi, rincian nota pengeluaran, bukti SPJ/kwitansi, foto dokumentasi, dan Laporan Pertanggungjawaban (LPJ).
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-extrabold transition-colors shadow-xs cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            Input LPJ Baksos Baru
          </button>

          <button
            type="button"
            onClick={handleExportExcel}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition-colors shadow-xs cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4" />
            Export Excel
          </button>

          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            Cetak
          </button>
        </div>
      </div>

      {/* KPI Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-indigo-600 text-white p-5 rounded-3xl shadow-xl shadow-indigo-600/15 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-indigo-100 uppercase tracking-wider">
              Total Dana Baksos Tersalurkan
            </p>
            <p className="text-2xl sm:text-3xl font-black font-mono mt-1">
              {formatCurrency(totalSpentAll)}
            </p>
          </div>
          <HeartHandshake className="w-8 h-8 text-indigo-200" />
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Program Pengabdian LPJ
            </p>
            <p className="text-2xl font-black text-slate-900 font-mono mt-1">
              {socialServices.length} <span className="text-xs font-semibold text-slate-500">Kegiatan Terlaksana</span>
            </p>
          </div>
          <CheckCircle2 className="w-8 h-8 text-emerald-600" />
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Penerima Manfaat
            </p>
            <p className="text-2xl font-black text-emerald-700 font-mono mt-1">
              {totalBeneficiariesApprox}+ <span className="text-xs font-semibold text-slate-500">Warga KKU</span>
            </p>
          </div>
          <Users className="w-8 h-8 text-amber-500" />
        </div>
      </div>

      {/* Search & Filter */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
        <div className="relative w-full sm:w-96">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Cari judul kegiatan, lokasi, penanggung jawab, atau penerima..."
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:border-indigo-500 outline-hidden"
          />
        </div>
      </div>

      {/* Social Service Program Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredList.length === 0 ? (
          <div className="col-span-full bg-white p-12 text-center rounded-3xl border border-slate-200 text-slate-400 space-y-3">
            <HeartHandshake className="w-12 h-12 text-slate-300 mx-auto" />
            <p className="text-sm font-bold text-slate-700">Belum Ada Catatan Kegiatan Bakti Sosial</p>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Klik tombol "Input LPJ Baksos Baru" untuk mencatat kegiatan baksos, rincian biaya, nota transaksi, dan foto dokumentasi.
            </p>
          </div>
        ) : (
          filteredList.map(soc => {
            const calculatedSpent = getCalculatedSpent(soc);

            return (
              <div
                key={soc.id}
                className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden flex flex-col justify-between hover:border-indigo-400 transition-all duration-200"
              >
                <div>
                  {/* Photo Banner if available */}
                  {soc.documentationUrls && soc.documentationUrls.length > 0 ? (
                    <div className="h-48 w-full relative overflow-hidden bg-slate-100 group">
                      <img
                        src={soc.documentationUrls[0]}
                        alt={soc.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute top-3 right-3 bg-slate-900/80 text-white text-[11px] font-bold px-3 py-1 rounded-full backdrop-blur-xs flex items-center gap-1 shadow-md">
                        <Calendar className="w-3.5 h-3.5 text-amber-400" /> {soc.date}
                      </div>

                      <div className="absolute bottom-3 left-3 bg-indigo-950/80 text-indigo-200 text-[11px] font-bold px-2.5 py-1 rounded-lg backdrop-blur-xs flex items-center gap-1">
                        <ImageIcon className="w-3.5 h-3.5 text-indigo-400" /> {soc.documentationUrls.length} Foto Dokumentasi
                      </div>
                    </div>
                  ) : (
                    <div className="h-28 w-full bg-gradient-to-r from-indigo-900 to-slate-900 p-5 flex items-center justify-between text-white">
                      <div>
                        <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider block">Bakti Sosial & Pengabdian</span>
                        <span className="text-xs font-bold text-slate-200 mt-1 block">📅 {soc.date}</span>
                      </div>
                      <HeartHandshake className="w-8 h-8 text-indigo-300 opacity-80" />
                    </div>
                  )}

                  <div className="p-5 sm:p-6 space-y-3.5">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-extrabold text-slate-900 text-base leading-snug">
                        {soc.title}
                      </h3>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs text-slate-600">
                      <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-xl border border-slate-100">
                        <MapPin className="w-4 h-4 text-red-500 shrink-0" />
                        <span className="truncate font-semibold text-slate-800">{soc.location}</span>
                      </div>

                      <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-xl border border-slate-100">
                        <Users className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span className="truncate font-semibold text-slate-800">{soc.beneficiaries}</span>
                      </div>
                    </div>

                    {soc.picName && (
                      <div className="flex items-center gap-2 text-xs text-slate-600">
                        <UserCheck className="w-4 h-4 text-indigo-600 shrink-0" />
                        <span>Penanggung Jawab: <strong className="text-slate-900">{soc.picName}</strong></span>
                      </div>
                    )}

                    <p className="text-xs text-slate-600 leading-relaxed line-clamp-2">
                      {soc.description}
                    </p>

                    {/* Financial Breakdown Pill */}
                    <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-2 text-xs">
                      <div className="flex justify-between font-bold text-slate-700">
                        <span>Sumber Dana:</span>
                        <span className="text-indigo-800 font-extrabold">{soc.fundSource}</span>
                      </div>
                      <div className="flex justify-between items-center font-bold text-slate-900 pt-1 border-t border-slate-200/80">
                        <span>Realisasi SPJ ({soc.expenses?.length || 0} Item):</span>
                        <span className="font-mono text-sm text-emerald-700 font-black">{formatCurrency(calculatedSpent)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Action Bar */}
                <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setViewingLPJ(soc)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-800 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                  >
                    <FileText className="w-4 h-4 text-indigo-600" />
                    Buka LPJ & Bukti Nota SPJ →
                  </button>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setEditingSoc(soc)}
                      className="p-2 text-slate-500 hover:text-indigo-600 rounded-xl hover:bg-indigo-50 transition-colors cursor-pointer"
                      title="Edit Data Baksos & Rincian SPJ"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>

                    <button
                      type="button"
                      onClick={() => setSocToDelete(soc)}
                      className="p-2 text-slate-400 hover:text-red-600 rounded-xl hover:bg-red-50 transition-colors cursor-pointer"
                      title="Hapus Data Baksos"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Official LPJ Document Modal */}
      {viewingLPJ && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-3xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-150 my-6 max-h-[90vh] overflow-y-auto custom-scrollbar">
            {/* Action Bar inside LPJ Modal */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 no-print">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-100 text-indigo-900 font-extrabold text-xs">
                <Award className="w-4 h-4 text-indigo-600" />
                Laporan Pertanggungjawaban (LPJ) Resmi
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setEditingSoc(viewingLPJ)}
                  className="inline-flex items-center gap-1 px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs cursor-pointer"
                >
                  <Edit3 className="w-3.5 h-3.5" /> Edit Data SPJ
                </button>

                <button
                  type="button"
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  Cetak LPJ PDF
                </button>

                <button
                  type="button"
                  onClick={() => setViewingLPJ(null)}
                  className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Print Envelope LPJ Header Letterhead */}
            <div className="mt-4 p-6 bg-white border border-slate-200 rounded-2xl space-y-6">
              <div className="flex items-center justify-between pb-4 border-b-2 border-slate-900 gap-4">
                <div className="flex items-center gap-3">
                  <PatelkiLogo className="w-14 h-14" />
                  <div>
                    <h3 className="font-black text-slate-900 text-sm sm:text-base tracking-tight uppercase">
                      {settings.organizationName || 'PERSATUAN AHLI TEKNOLOGI LABORATORIUM MEDIK INDONESIA'}
                    </h3>
                    <h4 className="font-bold text-emerald-800 text-xs sm:text-sm">
                      DPC PATELKI KABUPATEN KAYONG UTARA
                    </h4>
                    <p className="text-[10px] text-slate-500 mt-0.5 max-w-lg">
                      {settings.address} • Email: {settings.contactEmail}
                    </p>
                  </div>
                </div>
              </div>

              <div className="text-center space-y-1 py-2">
                <h2 className="text-base sm:text-lg font-black text-slate-900 uppercase tracking-tight">
                  LAPORAN PERTANGGUNGJAWABAN (LPJ)
                </h2>
                <p className="text-xs font-bold text-indigo-800 uppercase">
                  PROGRAM BAKTI SOSIAL & PENGABDIAN MASYARAKAT
                </p>
                <p className="text-[11px] text-slate-500">
                  Nomor LPJ: LPJ-BAKSOS/{viewingLPJ.date.replace(/-/g, '')}/{viewingLPJ.id.slice(-4).toUpperCase()}
                </p>
              </div>

              {/* General Metadata Table */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs p-4 bg-slate-50 rounded-xl border border-slate-200">
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Nama Program/Kegiatan</span>
                  <span className="font-extrabold text-slate-900 text-xs">{viewingLPJ.title}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Tanggal Pelaksanaan</span>
                  <span className="font-extrabold text-slate-900 text-xs">{viewingLPJ.date}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Lokasi Pelaksanaan</span>
                  <span className="font-semibold text-slate-800 text-xs">{viewingLPJ.location}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Penanggung Jawab (PIC)</span>
                  <span className="font-semibold text-slate-800 text-xs">{viewingLPJ.picName || settings.ketuaName}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Sumber Pendanaan</span>
                  <span className="font-semibold text-indigo-800 text-xs">{viewingLPJ.fundSource}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Penerima Manfaat</span>
                  <span className="font-semibold text-emerald-800 text-xs">{viewingLPJ.beneficiaries}</span>
                </div>
              </div>

              {/* Description */}
              <div className="space-y-1 text-xs">
                <h5 className="font-bold text-slate-900 uppercase tracking-wider text-[11px]">I. Latar Belakang & Deskripsi Pelaksanaan</h5>
                <p className="text-slate-700 leading-relaxed p-3 bg-white rounded-xl border border-slate-200">
                  {viewingLPJ.description}
                </p>
              </div>

              {/* Itemized Expenses & Proof Receipts Table */}
              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <h5 className="font-bold text-slate-900 uppercase tracking-wider text-[11px]">
                    II. Rincian Pengeluaran SPJ & Bukti Nota Transaksi
                  </h5>
                  <span className="text-[11px] font-bold text-slate-500">
                    Total: {viewingLPJ.expenses?.length || 0} Item SPJ
                  </span>
                </div>

                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-slate-900 text-white font-bold text-[11px] uppercase tracking-wider">
                      <tr>
                        <th className="p-2.5 w-10 text-center">No</th>
                        <th className="p-2.5">Item Rincian Kebutuhan SPJ</th>
                        <th className="p-2.5">Catatan / Toko Nota</th>
                        <th className="p-2.5 text-center no-print">Bukti Nota SPJ</th>
                        <th className="p-2.5 text-right">Nominal (Rp)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {(!viewingLPJ.expenses || viewingLPJ.expenses.length === 0) ? (
                        <tr>
                          <td colSpan={5} className="p-4 text-center text-slate-400">
                            Tidak ada rincian item pengeluaran khusus.
                          </td>
                        </tr>
                      ) : (
                        viewingLPJ.expenses.map((exp, idx) => (
                          <tr key={exp.id || idx} className="hover:bg-slate-50">
                            <td className="p-2.5 text-center font-bold text-slate-400">{idx + 1}</td>
                            <td className="p-2.5 font-bold text-slate-900">{exp.item}</td>
                            <td className="p-2.5 text-slate-600">{exp.notes || '-'}</td>
                            <td className="p-2.5 text-center no-print">
                              {exp.proofUrl ? (
                                <button
                                  type="button"
                                  onClick={() => setViewingProofImage(exp.proofUrl || null)}
                                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 font-bold text-[10px] cursor-pointer"
                                >
                                  <Receipt className="w-3.5 h-3.5 text-indigo-600" /> Lihat Nota SPJ
                                </button>
                              ) : (
                                <label className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-amber-50 text-amber-800 hover:bg-amber-100 font-bold text-[10px] cursor-pointer">
                                  <Upload className="w-3 h-3 text-amber-600" /> Unggah Nota
                                  <input
                                    type="file"
                                    accept="image/*"
                                    onChange={e => handleFileUploadReceipt(e, exp.id, false)}
                                    className="hidden"
                                  />
                                </label>
                              )}
                            </td>
                            <td className="p-2.5 text-right font-mono font-bold text-slate-900">
                              {formatCurrency(exp.amount)}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                    <tfoot className="bg-slate-100 font-black text-slate-900 border-t-2 border-slate-300">
                      <tr>
                        <td colSpan={3} className="p-2.5 text-right font-extrabold uppercase">Total Realisasi SPJ:</td>
                        <td colSpan={2} className="p-2.5 text-right font-mono text-emerald-800 text-sm font-black">
                          {formatCurrency(getCalculatedSpent(viewingLPJ))}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              {/* Budget vs Realization Variance Analysis */}
              {(() => {
                const realSpent = getCalculatedSpent(viewingLPJ);
                const variance = viewingLPJ.totalBudget - realSpent;

                return (
                  <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200 text-xs flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <span className="text-[10px] font-bold text-emerald-800 uppercase block">Anggaran vs Realisasi SPJ</span>
                      <span className="font-extrabold text-slate-900 text-xs">
                        Pagu Anggaran: {formatCurrency(viewingLPJ.totalBudget)} | Total Realisasi SPJ: {formatCurrency(realSpent)}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] font-bold text-emerald-800 uppercase block">Selisih Varian SPJ</span>
                      <span className={`font-mono font-black text-sm ${variance >= 0 ? 'text-emerald-800' : 'text-red-700'}`}>
                        {formatCurrency(Math.abs(variance))} ({variance >= 0 ? 'Efisiensi Sisa Kas' : 'Defisit Tercover'})
                      </span>
                    </div>
                  </div>
                );
              })()}

              {/* Documentation Photos Grid */}
              {viewingLPJ.documentationUrls && viewingLPJ.documentationUrls.length > 0 && (
                <div className="space-y-2 text-xs">
                  <h5 className="font-bold text-slate-900 uppercase tracking-wider text-[11px]">
                    III. Lampiran Dokumentasi Foto Pelaksanaan Baksos
                  </h5>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {viewingLPJ.documentationUrls.map((url, idx) => (
                      <div key={idx} className="relative rounded-xl overflow-hidden border border-slate-200 group h-32 bg-slate-100">
                        <img
                          src={url}
                          alt={`Dokumentasi ${idx + 1}`}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute bottom-1 right-1 bg-slate-900/80 text-white text-[9px] px-2 py-0.5 rounded-md font-bold">
                          Dokumentasi #{idx + 1}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* LPJ Notes */}
              {viewingLPJ.lpjNotes && (
                <div className="space-y-1 text-xs">
                  <h5 className="font-bold text-slate-900 uppercase tracking-wider text-[11px]">IV. Catatan Pertanggungjawaban</h5>
                  <p className="text-slate-700 leading-relaxed p-3 bg-amber-50/60 rounded-xl border border-amber-200">
                    {viewingLPJ.lpjNotes}
                  </p>
                </div>
              )}

              {/* Official Signatures Block for LPJ */}
              <div className="pt-6 border-t border-slate-300 grid grid-cols-3 gap-4 text-center text-xs">
                <div>
                  <p className="text-[11px] text-slate-500">Penanggung Jawab Kegiatan,</p>
                  <div className="h-16 flex items-center justify-center font-bold text-slate-400 italic">
                    ( Tanda Tangan Resmi )
                  </div>
                  <p className="font-bold text-slate-900 underline">{viewingLPJ.picName || settings.ketuaName}</p>
                  <p className="text-[10px] text-slate-500">Ketua Panitia / PIC Baksos</p>
                </div>

                <div>
                  <p className="text-[11px] text-slate-500">Mengetahui & Memverifikasi,</p>
                  <div className="h-16 flex items-center justify-center font-bold text-slate-400 italic">
                    ( Tanda Tangan Resmi )
                  </div>
                  <p className="font-bold text-slate-900 underline">{settings.bendaharaName}</p>
                  <p className="text-[10px] text-slate-500">Bendahara DPC PATELKI KKU</p>
                </div>

                <div>
                  <p className="text-[11px] text-slate-500">Mengesahkan LPJ,</p>
                  <div className="h-16 flex items-center justify-center font-bold text-slate-400 italic">
                    ( Tanda Tangan Resmi )
                  </div>
                  <p className="font-bold text-slate-900 underline">{settings.ketuaName}</p>
                  <p className="text-[10px] text-slate-500">Ketua DPC PATELKI KKU</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Proof Receipt Image Preview Modal */}
      {viewingProofImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Receipt className="w-4 h-4 text-indigo-600" />
                Foto Nota Bukti SPJ Pengeluaran
              </h4>
              <button
                type="button"
                onClick={() => setViewingProofImage(null)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="rounded-2xl overflow-hidden bg-slate-100 border border-slate-200 max-h-96 flex items-center justify-center">
              <img
                src={viewingProofImage}
                alt="Bukti Kwitansi / Nota SPJ"
                className="max-h-96 w-auto object-contain"
              />
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setViewingProofImage(null)}
                className="px-4 py-2 bg-slate-900 text-white text-xs font-bold rounded-xl cursor-pointer"
              >
                Tutup Preview
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add New Bakti Sosial Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-2xl w-full shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-150 my-8 max-h-[90vh] overflow-y-auto custom-scrollbar">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-black text-base text-slate-900">Catat Program Bakti Sosial & LPJ Baru</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Lengkapi data kegiatan, rincian nota pengeluaran, dan foto dokumentasi.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSocial} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nama Kegiatan / Program Baksos *
                </label>
                <input
                  type="text"
                  required
                  value={newSoc.title}
                  onChange={e => setNewSoc({ ...newSoc, title: e.target.value })}
                  placeholder="Contoh: Pemeriksaan Darah & Skrining Diabetes Gratis di Desa Teluk Batang"
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-300 focus:border-indigo-500 outline-hidden font-semibold"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Tanggal Pelaksanaan *</label>
                  <input
                    type="date"
                    required
                    value={newSoc.date}
                    onChange={e => setNewSoc({ ...newSoc, date: e.target.value })}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300 outline-hidden font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Lokasi Kegiatan *</label>
                  <input
                    type="text"
                    required
                    value={newSoc.location}
                    onChange={e => setNewSoc({ ...newSoc, location: e.target.value })}
                    placeholder="Contoh: Balai Desa Sukadana / Puskesmas..."
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300 outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Penanggung Jawab (PIC / Panitia)</label>
                  <input
                    type="text"
                    value={newSoc.picName}
                    onChange={e => setNewSoc({ ...newSoc, picName: e.target.value })}
                    placeholder="Nama Ketua Panitia Baksos"
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300 outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Sumber Pendanaan</label>
                  <input
                    type="text"
                    value={newSoc.fundSource}
                    onChange={e => setNewSoc({ ...newSoc, fundSource: e.target.value })}
                    placeholder="Kas DPC / Donasi Sponsor"
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300 outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Target Penerima Manfaat</label>
                  <input
                    type="text"
                    value={newSoc.beneficiaries}
                    onChange={e => setNewSoc({ ...newSoc, beneficiaries: e.target.value })}
                    placeholder="Contoh: 200 Warga Lansia & Nelayan"
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300 outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Total Pagu Anggaran (Rp)</label>
                  <input
                    type="number"
                    value={newSoc.totalBudget}
                    onChange={e => setNewSoc({ ...newSoc, totalBudget: Number(e.target.value) })}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300 font-mono font-bold outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Deskripsi & Tujuan Kegiatan</label>
                <textarea
                  rows={2}
                  value={newSoc.description}
                  onChange={e => setNewSoc({ ...newSoc, description: e.target.value })}
                  placeholder="Penjelasan singkat teknis baksos..."
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-300 outline-hidden"
                />
              </div>

              {/* Dynamic Expenses Breakdown Input */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <Receipt className="w-4 h-4 text-indigo-600" />
                    Rincian Item Pengeluaran SPJ & Nota
                  </span>
                  <span className="text-xs font-mono font-bold text-emerald-700">
                    Total Realisasi: {formatCurrency(getCalculatedSpent(newSoc))}
                  </span>
                </div>

                {/* Added expense items list */}
                <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                  {newSoc.expenses.map((exp) => (
                    <div key={exp.id} className="flex items-center justify-between text-xs p-2.5 bg-white rounded-xl border border-slate-200 gap-2">
                      <div className="truncate flex-1">
                        <span className="font-bold text-slate-900 block">{exp.item}</span>
                        <span className="text-[10px] text-slate-500">{exp.notes || 'Tanpa catatan'}</span>
                      </div>
                      <span className="font-mono font-bold text-slate-800 shrink-0">{formatCurrency(exp.amount)}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveExpenseItem(exp.id, 'new')}
                        className="text-red-500 hover:text-red-700 p-1 cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>

                {/* Subform to add an expense item */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2 border-t border-slate-200">
                  <input
                    type="text"
                    value={tempExpenseItem.item}
                    onChange={e => setTempExpenseItem({ ...tempExpenseItem, item: e.target.value })}
                    placeholder="Nama item / kebutuhan..."
                    className="text-xs p-2 bg-white rounded-lg border border-slate-300 outline-hidden"
                  />
                  <input
                    type="number"
                    value={tempExpenseItem.amount || ''}
                    onChange={e => setTempExpenseItem({ ...tempExpenseItem, amount: Number(e.target.value) })}
                    placeholder="Nominal (Rp)..."
                    className="text-xs p-2 bg-white rounded-lg border border-slate-300 font-mono font-bold outline-hidden"
                  />
                  <input
                    type="text"
                    value={tempExpenseItem.notes}
                    onChange={e => setTempExpenseItem({ ...tempExpenseItem, notes: e.target.value })}
                    placeholder="Nomor nota / keterangan toko..."
                    className="text-xs p-2 bg-white rounded-lg border border-slate-300 outline-hidden"
                  />
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                  <div className="flex items-center gap-2 text-xs">
                    <label className="cursor-pointer px-2.5 py-1 bg-white border border-slate-300 rounded-lg font-bold text-slate-700 hover:bg-slate-100 transition-colors flex items-center gap-1 text-[11px]">
                      <Receipt className="w-3.5 h-3.5 text-indigo-600" />
                      {tempExpenseItem.proofUrl ? '✓ Foto Nota Terlampir' : 'Unggah Foto Nota SPJ'}
                      <input
                        type="file"
                        accept="image/*"
                        onChange={e => handleFileUploadReceipt(e)}
                        className="hidden"
                      />
                    </label>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleAddExpenseItem('new')}
                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" /> Tambah Item SPJ
                  </button>
                </div>
              </div>

              {/* Photo Documentation Input */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <ImageIcon className="w-4 h-4 text-emerald-600" />
                  Dokumentasi Foto Lapangan ({newSoc.documentationUrls.length} Foto)
                </span>

                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {newSoc.documentationUrls.map((url, idx) => (
                    <div key={idx} className="relative h-20 rounded-xl overflow-hidden border border-slate-200 group bg-slate-200">
                      <img src={url} alt="Dokumentasi" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => setNewSoc(prev => ({ ...prev, documentationUrls: prev.documentationUrls.filter((_, i) => i !== idx) }))}
                        className="absolute top-1 right-1 bg-red-600 text-white p-1 rounded-full shadow-md hover:bg-red-700"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}

                  <label className="h-20 rounded-xl border-2 border-dashed border-slate-300 hover:border-indigo-500 bg-white flex flex-col items-center justify-center cursor-pointer text-slate-400 hover:text-indigo-600 transition-colors p-2 text-center">
                    <Plus className="w-5 h-5 mb-0.5" />
                    <span className="text-[10px] font-bold">Unggah Foto</span>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={e => handleFileUploadDoc(e, false)}
                      className="hidden"
                    />
                  </label>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="url"
                    value={tempDocUrl}
                    onChange={e => setTempDocUrl(e.target.value)}
                    placeholder="Atau tempel URL gambar foto (http://...)"
                    className="flex-1 text-xs p-2 bg-white rounded-lg border border-slate-300 outline-hidden"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (tempDocUrl.trim()) {
                        setNewSoc(prev => ({ ...prev, documentationUrls: [...prev.documentationUrls, tempDocUrl.trim()] }));
                        setTempDocUrl('');
                      }
                    }}
                    className="px-3 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-bold cursor-pointer"
                  >
                    Tambah URL
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Catatan Hasil & Evaluasi LPJ</label>
                <textarea
                  rows={2}
                  value={newSoc.lpjNotes}
                  onChange={e => setNewSoc({ ...newSoc, lpjNotes: e.target.value })}
                  placeholder="Catatan evaluasi baksos, kesimpulan, atau ucapan terima kasih..."
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-300 outline-hidden"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-extrabold rounded-xl shadow-xs cursor-pointer"
                >
                  Simpan Laporan Baksos & LPJ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Bakti Sosial & SPJ Modal */}
      {editingSoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-2xl w-full shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-150 my-8 max-h-[90vh] overflow-y-auto custom-scrollbar">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-black text-base text-slate-900">Edit Data Baksos & Rincian SPJ</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Sesuaikan rincian pengeluaran, nota bukti transaksi, dan foto dokumentasi.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditingSoc(null)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditSocial} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nama Kegiatan *</label>
                <input
                  type="text"
                  required
                  value={editingSoc.title}
                  onChange={e => setEditingSoc({ ...editingSoc, title: e.target.value })}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-300 font-bold outline-hidden"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Tanggal *</label>
                  <input
                    type="date"
                    required
                    value={editingSoc.date}
                    onChange={e => setEditingSoc({ ...editingSoc, date: e.target.value })}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300 font-semibold outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Lokasi *</label>
                  <input
                    type="text"
                    required
                    value={editingSoc.location}
                    onChange={e => setEditingSoc({ ...editingSoc, location: e.target.value })}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300 outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Penanggung Jawab (PIC)</label>
                  <input
                    type="text"
                    value={editingSoc.picName || ''}
                    onChange={e => setEditingSoc({ ...editingSoc, picName: e.target.value })}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300 outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Sumber Pendanaan</label>
                  <input
                    type="text"
                    value={editingSoc.fundSource}
                    onChange={e => setEditingSoc({ ...editingSoc, fundSource: e.target.value })}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300 outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Penerima Manfaat</label>
                  <input
                    type="text"
                    value={editingSoc.beneficiaries}
                    onChange={e => setEditingSoc({ ...editingSoc, beneficiaries: e.target.value })}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300 outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Total Pagu Anggaran (Rp)</label>
                  <input
                    type="number"
                    value={editingSoc.totalBudget}
                    onChange={e => setEditingSoc({ ...editingSoc, totalBudget: Number(e.target.value) })}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300 font-mono font-bold outline-hidden"
                  />
                </div>
              </div>

              {/* Dynamic Expenses Breakdown Input inside Edit Modal */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <Receipt className="w-4 h-4 text-indigo-600" />
                    Rincian Item SPJ ({editingSoc.expenses?.length || 0} Item)
                  </span>
                  <span className="text-xs font-mono font-bold text-emerald-700">
                    Total Realisasi: {formatCurrency(getCalculatedSpent(editingSoc))}
                  </span>
                </div>

                <div className="space-y-2 max-h-48 overflow-y-auto pr-1 custom-scrollbar">
                  {editingSoc.expenses?.map((exp) => (
                    <div key={exp.id} className="p-3 bg-white rounded-xl border border-slate-200 text-xs space-y-1.5">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-bold text-slate-900">{exp.item}</span>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-emerald-800">{formatCurrency(exp.amount)}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveExpenseItem(exp.id, 'edit')}
                            className="text-red-500 hover:text-red-700 p-1 cursor-pointer"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <div className="flex items-center justify-between gap-2 text-[11px] text-slate-500 pt-1 border-t border-slate-100">
                        <span>{exp.notes || 'Tanpa catatan nota'}</span>
                        <label className="cursor-pointer font-bold text-indigo-600 hover:underline flex items-center gap-1">
                          {exp.proofUrl ? '✓ Terlampir Foto Nota (Ubah)' : '📷 Unggah Nota SPJ'}
                          <input
                            type="file"
                            accept="image/*"
                            onChange={e => handleFileUploadReceipt(e, exp.id, true)}
                            className="hidden"
                          />
                        </label>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Subform to add an expense item */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2 border-t border-slate-200">
                  <input
                    type="text"
                    value={tempExpenseItem.item}
                    onChange={e => setTempExpenseItem({ ...tempExpenseItem, item: e.target.value })}
                    placeholder="Tambah item baru..."
                    className="text-xs p-2 bg-white rounded-lg border border-slate-300 outline-hidden"
                  />
                  <input
                    type="number"
                    value={tempExpenseItem.amount || ''}
                    onChange={e => setTempExpenseItem({ ...tempExpenseItem, amount: Number(e.target.value) })}
                    placeholder="Nominal (Rp)..."
                    className="text-xs p-2 bg-white rounded-lg border border-slate-300 font-mono font-bold outline-hidden"
                  />
                  <input
                    type="text"
                    value={tempExpenseItem.notes}
                    onChange={e => setTempExpenseItem({ ...tempExpenseItem, notes: e.target.value })}
                    placeholder="Catatan toko/nota..."
                    className="text-xs p-2 bg-white rounded-lg border border-slate-300 outline-hidden"
                  />
                </div>

                <div className="flex items-center justify-between pt-1">
                  <label className="cursor-pointer text-xs font-bold text-indigo-700 hover:underline flex items-center gap-1">
                    <Receipt className="w-3.5 h-3.5" />
                    {tempExpenseItem.proofUrl ? '✓ Foto Nota Baru Terlampir' : 'Unggah Nota untuk Item Baru'}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={e => handleFileUploadReceipt(e)}
                      className="hidden"
                    />
                  </label>

                  <button
                    type="button"
                    onClick={() => handleAddExpenseItem('edit')}
                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" /> Tambah Item
                  </button>
                </div>
              </div>

              {/* Photo Documentation Input inside Edit Modal */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <ImageIcon className="w-4 h-4 text-emerald-600" />
                  Foto Dokumentasi Lapangan ({editingSoc.documentationUrls?.length || 0} Foto)
                </span>

                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {editingSoc.documentationUrls?.map((url, idx) => (
                    <div key={idx} className="relative h-20 rounded-xl overflow-hidden border border-slate-200 group bg-slate-200">
                      <img src={url} alt="Dokumentasi" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => setEditingSoc({ ...editingSoc, documentationUrls: editingSoc.documentationUrls.filter((_, i) => i !== idx) })}
                        className="absolute top-1 right-1 bg-red-600 text-white p-1 rounded-full shadow-md hover:bg-red-700"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}

                  <label className="h-20 rounded-xl border-2 border-dashed border-slate-300 hover:border-indigo-500 bg-white flex flex-col items-center justify-center cursor-pointer text-slate-400 hover:text-indigo-600 transition-colors p-2 text-center">
                    <Plus className="w-5 h-5 mb-0.5" />
                    <span className="text-[10px] font-bold">Unggah Foto</span>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={e => handleFileUploadDoc(e, true)}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Catatan LPJ & Evaluasi</label>
                <textarea
                  rows={2}
                  value={editingSoc.lpjNotes || ''}
                  onChange={e => setEditingSoc({ ...editingSoc, lpjNotes: e.target.value })}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-300 outline-hidden"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingSoc(null)}
                  className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-extrabold rounded-xl shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" /> Simpan Perubahan SPJ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* In-App Delete Confirmation Modal */}
      {socToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-red-200 animate-in zoom-in-95 duration-150 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-lg font-black text-slate-900">
                Hapus Kegiatan Bakti Sosial?
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Hapus kegiatan <span className="font-bold text-slate-800">"{socToDelete.title}"</span> ({socToDelete.location}) beserta seluruh nota dan pengeluaran terkait secara permanen dari database Supabase?
              </p>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                disabled={isDeletingSoc}
                onClick={() => setSocToDelete(null)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={isDeletingSoc}
                onClick={async () => {
                  setIsDeletingSoc(true);
                  try {
                    await deleteSocialService(socToDelete.id);
                    setSocToDelete(null);
                  } finally {
                    setIsDeletingSoc(false);
                  }
                }}
                className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white text-xs font-black rounded-xl shadow-md transition-colors cursor-pointer flex items-center justify-center gap-1.5"
              >
                {isDeletingSoc ? 'Menghapus...' : 'Ya, Hapus Sekarang'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BaktiSosial;

import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Member } from '../../types';
import * as XLSX from 'xlsx';
import {
  Users,
  Search,
  UserPlus,
  FileSpreadsheet,
  Printer,
  Upload,
  Phone,
  Building,
  Edit2,
  Trash2,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Clock,
  Eye,
  Filter,
  X,
  Check,
  Download,
  KeyRound,
  Lock,
  Settings2,
  FileText,
} from 'lucide-react';
import { PatelkiLogo } from '../../components/PatelkiLogo';
import { PhotoUploader } from '../../components/PhotoUploader';
import { ManageArrearsModal } from '../../components/ManageArrearsModal';

export const DataAnggota: React.FC = () => {
  const {
    members,
    addMember,
    updateMember,
    deleteMember,
    toggleMemberStatus,
    importMembers,
    getMemberDuesSummary,
    formatCurrency,
    changeMemberPassword,
    generateWhatsAppLink,
    formatPhoneDisplay,
    normalizePhoneNumber,
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'semua' | 'aktif' | 'menunggak' | 'expired'>('semua');
  const [filterInstansi, setFilterInstansi] = useState('semua');

  // Modals state
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [viewingMember, setViewingMember] = useState<Member | null>(null);
  const [arrearsModalMember, setArrearsModalMember] = useState<Member | null>(null);
  const [memberToDelete, setMemberToDelete] = useState<Member | null>(null);
  const [isDeletingMember, setIsDeletingMember] = useState(false);
  const [passwordModalMember, setPasswordModalMember] = useState<Member | null>(null);
  const [targetMemberPassword, setTargetMemberPassword] = useState('');
  const [passwordSavedToast, setPasswordSavedToast] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importPreview, setImportPreview] = useState<Omit<Member, 'id'>[]>([]);
  const [exportToast, setExportToast] = useState<string | null>(null);

  // New/Edit form state
  const [formData, setFormData] = useState<Omit<Member, 'id'>>({
    nama: '',
    gelar: 'A.Md.Kes',
    nap: '',
    noWa: '',
    instansi: '',
    jabatan: '',
    status: 'aktif',
    foto: '',
    tanggalBergabung: new Date().toISOString().split('T')[0],
    email: '',
    alamat: '',
  });

  // Extract unique instansi for filtering
  const instansiList = Array.from(new Set(members.map(m => m.instansi).filter(Boolean)));

  // Filtered members
  const filteredMembers = members.filter(m => {
    const query = searchQuery.toLowerCase();
    const matchSearch =
      m.nama.toLowerCase().includes(query) ||
      m.nap.toLowerCase().includes(query) ||
      m.noWa.toLowerCase().includes(query) ||
      m.instansi.toLowerCase().includes(query) ||
      m.gelar.toLowerCase().includes(query);

    const summary = getMemberDuesSummary(m.id);
    const isArrears = summary.arrearsAmount > 0;

    let matchStatus = true;
    if (filterStatus === 'aktif') {
      matchStatus = m.status === 'aktif' && !isArrears;
    } else if (filterStatus === 'menunggak') {
      matchStatus = m.status === 'aktif' && isArrears;
    } else if (filterStatus === 'expired') {
      matchStatus = m.status === 'nonaktif';
    }

    const matchInstansi = filterInstansi === 'semua' || m.instansi === filterInstansi;

    return matchSearch && matchStatus && matchInstansi;
  });

  // Open Add modal
  const handleOpenAdd = () => {
    setFormData({
      nama: '',
      gelar: 'A.Md.Kes',
      nap: `61.11.${(members.length + 1).toString().padStart(3, '0')}`,
      noWa: '628',
      instansi: 'RSUD Sultan Muhammad Jamaludin I',
      jabatan: 'Analis Medis Pelaksana',
      status: 'aktif',
      foto: '',
      tanggalBergabung: new Date().toISOString().split('T')[0],
      email: '',
      alamat: 'Kabupaten Kayong Utara',
    });
    setShowAddModal(true);
  };

  // Open Edit modal
  const handleOpenEdit = (m: Member) => {
    setEditingMember(m);
    setFormData({
      nama: m.nama,
      gelar: m.gelar,
      nap: m.nap,
      noWa: m.noWa,
      instansi: m.instansi,
      jabatan: m.jabatan || '',
      status: m.status,
      foto: m.foto || '',
      tanggalBergabung: m.tanggalBergabung,
      email: m.email || '',
      alamat: m.alamat || '',
    });
  };

  // Submit form
  const handleSaveMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nama || !formData.nap) {
      alert('Nama dan NAP wajib diisi!');
      return;
    }

    const payload = {
      ...formData,
      noWa: normalizePhoneNumber(formData.noWa),
    };

    if (editingMember) {
      updateMember(editingMember.id, payload);
      setEditingMember(null);
    } else {
      addMember(payload);
      setShowAddModal(false);
    }
  };

  // Export to Excel (.xlsx)
  const handleExportExcel = () => {
    const targetMembers =
      searchQuery.trim() || filterStatus !== 'semua' || filterInstansi !== 'semua'
        ? filteredMembers
        : members;

    const exportData = targetMembers.map((m, index) => {
      const summary = getMemberDuesSummary(m.id);
      return {
        No: index + 1,
        'Nama Lengkap': m.nama,
        Gelar: m.gelar,
        'Nomor Anggota (NAP)': m.nap,
        'No WhatsApp': m.noWa,
        'Instansi / Unit Kerja': m.instansi,
        Jabatan: m.jabatan || '-',
        Status: m.status.toUpperCase(),
        'Tanggal Bergabung': m.tanggalBergabung,
        'Total Iuran Terbayar': summary.totalPaid,
        'Sisa Tunggakan (Rp)': summary.arrearsAmount,
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Data Anggota Patelki');
    XLSX.writeFile(workbook, `Daftar_Anggota_Patelki_Kayong_Utara_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  // Export to CSV (.csv) for Microsoft Excel & Google Sheets
  const handleExportCSV = () => {
    const targetMembers =
      searchQuery.trim() || filterStatus !== 'semua' || filterInstansi !== 'semua'
        ? filteredMembers
        : members;

    if (targetMembers.length === 0) {
      alert('Tidak ada data anggota untuk diekspor.');
      return;
    }

    const exportData = targetMembers.map((m, index) => {
      const summary = getMemberDuesSummary(m.id);
      return {
        'No': index + 1,
        'Nama Lengkap': m.nama,
        'Gelar': m.gelar || '-',
        'Nomor Anggota (NAP)': m.nap,
        'No WhatsApp': m.noWa,
        'Instansi / Unit Kerja': m.instansi || '-',
        'Jabatan': m.jabatan || '-',
        'Status Keanggotaan': m.status === 'aktif' ? 'AKTIF' : 'NONAKTIF',
        'Tanggal Bergabung': m.tanggalBergabung || '-',
        'Email': m.email || '-',
        'Alamat': m.alamat || '-',
        'Total Iuran Terbayar (Rp)': summary.totalPaid,
        'Sisa Tunggakan (Rp)': summary.arrearsAmount,
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    // Include UTF-8 BOM (\uFEFF) for seamless opening in Excel and Google Sheets without encoding glitches
    const csvContent = '\uFEFF' + XLSX.utils.sheet_to_csv(worksheet);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const dateStr = new Date().toISOString().split('T')[0];
    const fileName = `Daftar_Anggota_Patelki_Kayong_Utara_${dateStr}.csv`;
    link.setAttribute('href', url);
    link.setAttribute('download', fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setExportToast(`Berhasil mengekspor ${targetMembers.length} data anggota ke ${fileName} (.csv)`);
    setTimeout(() => {
      setExportToast(null);
    }, 4000);
  };

  // Download template CSV for import
  const handleDownloadCsvTemplate = () => {
    const templateData = [
      {
        'Nama': 'Siti Rahmawati',
        'Gelar': 'A.Md.Kes',
        'NAP': '61.11.025',
        'No WhatsApp': '081234567890',
        'Instansi': 'RSUD Sultan Muhammad Jamaludin I',
        'Jabatan': 'ATLM Pelaksana',
        'Status': 'aktif',
        'Tanggal Bergabung': new Date().toISOString().split('T')[0],
        'Email': 'siti.rahmawati@example.com',
        'Alamat': 'Sukadana, Kab. Kayong Utara',
      },
    ];
    const worksheet = XLSX.utils.json_to_sheet(templateData);
    const csvContent = '\uFEFF' + XLSX.utils.sheet_to_csv(worksheet);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'Template_Import_Anggota_Patelki.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Excel File Upload Parser
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json<any>(ws);

        const parsed: Omit<Member, 'id'>[] = data.map((row, idx) => ({
          nama: row['Nama'] || row['Nama Lengkap'] || `Anggota Baru ${idx + 1}`,
          gelar: row['Gelar'] || 'A.Md.Kes',
          nap: row['NAP'] || row['Nomor Anggota'] || `61.11.${(members.length + idx + 1).toString().padStart(3, '0')}`,
          noWa: normalizePhoneNumber(String(row['No WhatsApp'] || row['WhatsApp'] || row['No. HP'] || '6281200000000')),
          instansi: row['Instansi'] || row['Unit Kerja'] || 'Puskesmas di Kayong Utara',
          jabatan: row['Jabatan'] || 'ATLM Pelaksana',
          status: (row['Status']?.toString().toLowerCase().includes('non') ? 'nonaktif' : 'aktif') as 'aktif' | 'nonaktif',
          foto: '',
          tanggalBergabung: row['Tanggal Bergabung'] || new Date().toISOString().split('T')[0],
          email: row['Email'] || '',
          alamat: row['Alamat'] || 'Kabupaten Kayong Utara',
        }));

        setImportPreview(parsed);
      } catch (err) {
        alert('Gagal membaca file Excel. Pastikan format file .xlsx atau .csv valid.');
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleConfirmImport = () => {
    if (importPreview.length === 0) return;
    importMembers(importPreview);
    setShowImportModal(false);
    setImportPreview([]);
    alert(`Berhasil mengimpor ${importPreview.length} anggota baru!`);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Data Anggota Patelki
            </h1>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-black">
              {members.length} Total
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            DPC Persatuan Ahli Teknologi Laboratorium Medik Indonesia Kab. Kayong Utara
          </p>
        </div>

        {/* Actions Bar */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={handleOpenAdd}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-extrabold transition-colors shadow-xs cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            Tambah Anggota
          </button>

          <button
            type="button"
            onClick={() => setShowImportModal(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
          >
            <Upload className="w-4 h-4 text-emerald-600" />
            Import Excel
          </button>

          <button
            type="button"
            onClick={handleExportExcel}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs active:scale-95"
            title="Download data anggota ke format Excel (.xlsx)"
          >
            <FileSpreadsheet className="w-4 h-4" />
            Export Excel
          </button>

          <button
            type="button"
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 bg-teal-700 hover:bg-teal-800 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs active:scale-95"
            title="Download data anggota format CSV (.csv) untuk diolah di Excel atau Google Sheets"
          >
            <FileText className="w-4 h-4" />
            Export CSV
          </button>

          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            Cetak
          </button>
        </div>
      </div>

      {/* Search & Filter Strip */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row gap-3 items-center justify-between">
        {/* Search Bar */}
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Cari nama, NAP, No WA, instansi (contoh: Siti)..."
            className="w-full pl-10 pr-4 py-2.5 text-xs rounded-xl border border-slate-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-hidden bg-slate-50 text-slate-900"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          <div className="flex items-center gap-1 text-xs font-bold text-slate-500">
            <Filter className="w-3.5 h-3.5" /> Filter:
          </div>

          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value as any)}
            className="text-xs px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-700 focus:border-amber-500 outline-hidden font-medium"
          >
            <option value="semua">Semua Status</option>
            <option value="aktif">🟢 Aktif (Lunas)</option>
            <option value="menunggak">⚠️ Menunggak</option>
            <option value="expired">🔴 Expired / Nonaktif</option>
          </select>

          <select
            value={filterInstansi}
            onChange={e => setFilterInstansi(e.target.value)}
            className="text-xs px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-700 focus:border-amber-500 outline-hidden font-medium max-w-[200px]"
          >
            <option value="semua">Semua Instansi</option>
            {instansiList.map(inst => (
              <option key={inst} value={inst}>
                {inst}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Members Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left text-xs text-slate-700 border-collapse">
            <thead className="bg-slate-100/80 text-slate-900 uppercase font-black tracking-wider text-[11px] border-b border-slate-200">
              <tr>
                <th className="py-3.5 px-4 w-12 text-center">No</th>
                <th className="py-3.5 px-4">Nama & Gelar</th>
                <th className="py-3.5 px-4">NAP</th>
                <th className="py-3.5 px-4">Instansi & Jabatan</th>
                <th className="py-3.5 px-4">WhatsApp</th>
                <th className="py-3.5 px-4 text-center">Status</th>
                <th className="py-3.5 px-4 text-right">Tunggakan</th>
                <th className="py-3.5 px-4 text-center no-print">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredMembers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    Tidak ditemukan data anggota yang sesuai dengan pencarian.
                  </td>
                </tr>
              ) : (
                filteredMembers.map((m, idx) => {
                  const summary = getMemberDuesSummary(m.id);
                  const isArrears = summary.arrearsAmount > 0;

                  return (
                    <tr
                      key={m.id}
                      className="hover:bg-amber-50/30 transition-colors group"
                    >
                      <td className="py-3.5 px-4 text-center font-bold text-slate-400">
                        {idx + 1}
                      </td>

                      {/* Name & Photo */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={
                              m.foto ||
                              `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(
                                m.nama
                              )}`
                            }
                            alt={m.nama}
                            className="w-9 h-9 rounded-xl object-cover border border-amber-200 shrink-0"
                          />
                          <div>
                            <div className="font-extrabold text-slate-900 text-xs sm:text-sm">
                              {m.nama}, {m.gelar}
                            </div>
                            <div className="text-[11px] text-slate-500">{m.email || 'Email belum diisi'}</div>
                          </div>
                        </div>
                      </td>

                      {/* NAP */}
                      <td className="py-3.5 px-4 font-mono font-bold text-emerald-800">
                        {m.nap}
                      </td>

                      {/* Instansi */}
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-800">{m.instansi}</div>
                        <div className="text-[11px] text-slate-500">{m.jabatan || 'ATLM'}</div>
                      </td>

                      {/* WhatsApp */}
                      <td className="py-3.5 px-4">
                        <a
                          href={generateWhatsAppLink(m.noWa, `Halo ${m.nama}, saya Bendahara DPC PATELKI Kayong Utara ingin menghubungi Anda terkait iuran organisasi.`)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-emerald-700 hover:text-emerald-900 font-bold bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1 rounded-lg transition-colors font-mono text-xs border border-emerald-200"
                          title="Hubungi via WhatsApp"
                        >
                          <Phone className="w-3.5 h-3.5 text-emerald-600" />
                          {formatPhoneDisplay(m.noWa)}
                        </a>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4 text-center">
                        <button
                          type="button"
                          onClick={() => toggleMemberStatus(m.id)}
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-extrabold transition-all active:scale-95 cursor-pointer shadow-2xs ${
                            m.status === 'nonaktif'
                              ? 'bg-slate-100 text-slate-700 border border-slate-300 hover:bg-slate-200'
                              : isArrears
                              ? 'bg-red-100 text-red-800 border border-red-200 hover:bg-red-200'
                              : 'bg-emerald-100 text-emerald-800 border border-emerald-200 hover:bg-emerald-200'
                          }`}
                          title="Klik untuk ubah status keaktifan keanggotaan"
                        >
                          {m.status === 'nonaktif' ? (
                            <>
                              <XCircle className="w-3.5 h-3.5 text-slate-500" />
                              Expired / Nonaktif
                            </>
                          ) : isArrears ? (
                            <>
                              <AlertCircle className="w-3.5 h-3.5 text-red-600 animate-pulse" />
                              Menunggak
                            </>
                          ) : (
                            <>
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              Aktif Lunas
                            </>
                          )}
                        </button>
                      </td>

                      {/* Tunggakan */}
                      <td className="py-3.5 px-4 text-right font-mono font-bold">
                        {isArrears ? (
                          <span className="text-red-600 bg-red-50 px-2 py-0.5 rounded-md">
                            {formatCurrency(summary.arrearsAmount)}
                          </span>
                        ) : (
                          <span className="text-emerald-600">Lunas ✅</span>
                        )}
                      </td>

                      {/* Action Buttons */}
                      <td className="py-3.5 px-4 text-center no-print">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => setArrearsModalMember(m)}
                            className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors cursor-pointer"
                            title="Kelola / Atur Tunggakan Iuran Anggota"
                          >
                            <Settings2 className="w-4 h-4" />
                          </button>

                          <button
                            type="button"
                            onClick={() => setViewingMember(m)}
                            className="p-1.5 text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors"
                            title="Lihat Detail & Riwayat Iuran"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setPasswordModalMember(m);
                              setTargetMemberPassword(m.password || '123456');
                            }}
                            className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                            title="Ubah / Reset Kata Sandi Login"
                          >
                            <KeyRound className="w-4 h-4" />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleOpenEdit(m)}
                            className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                            title="Edit Anggota"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>

                          <button
                            type="button"
                            onClick={() => setMemberToDelete(m)}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                            title="Hapus Anggota"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
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

      {/* Add / Edit Member Modal */}
      {(showAddModal || editingMember) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs overflow-y-auto">
          <div className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-200 my-8">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-sm">
                  {editingMember ? 'Edit Data Anggota Patelki' : 'Tambah Anggota Baru'}
                </h3>
              </div>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setEditingMember(null);
                }}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveMember} className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Nama Lengkap *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.nama}
                    onChange={e => setFormData({ ...formData, nama: e.target.value })}
                    placeholder="Contoh: Siti Nurhaliza"
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300 focus:border-amber-500 outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Gelar Profesi / Akademik
                  </label>
                  <input
                    type="text"
                    value={formData.gelar}
                    onChange={e => setFormData({ ...formData, gelar: e.target.value })}
                    placeholder="A.Md.Kes / S.Tr.Kes / S.Si"
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300 focus:border-amber-500 outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Nomor Anggota Patelki (NAP) *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.nap}
                    onChange={e => setFormData({ ...formData, nap: e.target.value })}
                    placeholder="61.11.001"
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300 focus:border-amber-500 outline-hidden font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    No. WhatsApp Aktif (Format: 08... atau 628...) *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.noWa}
                    onChange={e => setFormData({ ...formData, noWa: e.target.value })}
                    placeholder="Contoh: 081234567890 atau 6281234567890"
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300 focus:border-amber-500 outline-hidden font-mono"
                  />
                  {formData.noWa && (
                    <p className="text-[11px] text-emerald-700 font-semibold mt-1">
                      ✓ Format WhatsApp: <code>{normalizePhoneNumber(formData.noWa)}</code> ({formatPhoneDisplay(formData.noWa)})
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Instansi / Unit Kerja *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.instansi}
                    onChange={e => setFormData({ ...formData, instansi: e.target.value })}
                    placeholder="RSUD SMJ / Puskesmas..."
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300 focus:border-amber-500 outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Jabatan (Opsional)
                  </label>
                  <input
                    type="text"
                    value={formData.jabatan}
                    onChange={e => setFormData({ ...formData, jabatan: e.target.value })}
                    placeholder="Pranata Labkes / Koordinator"
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300 focus:border-amber-500 outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                    placeholder="nama@email.com"
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300 focus:border-amber-500 outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Status Keanggotaan
                  </label>
                  <select
                    value={formData.status}
                    onChange={e => setFormData({ ...formData, status: e.target.value as any })}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300 focus:border-amber-500 outline-hidden bg-white"
                  >
                    <option value="aktif">Aktif</option>
                    <option value="nonaktif">Nonaktif</option>
                  </select>
                </div>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
                <PhotoUploader
                  currentPhoto={formData.foto}
                  name={formData.nama}
                  onChange={(newPhoto) => setFormData({ ...formData, foto: newPhoto })}
                  label="Unggah Foto Profil Anggota (Opsional)"
                  helperText="Format JPG/PNG/WebP. Foto otomatis dikompresi & disimpan ke sistem."
                  size="md"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setEditingMember(null);
                  }}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Batal
                </button>

                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-extrabold rounded-xl shadow-xs"
                >
                  {editingMember ? 'Simpan Perubahan' : 'Tambah Anggota'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Member Details Drawer Modal */}
      {viewingMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img
                  src={
                    viewingMember.foto ||
                    `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(
                      viewingMember.nama
                    )}`
                  }
                  alt={viewingMember.nama}
                  className="w-12 h-12 rounded-2xl object-cover border-2 border-amber-400"
                />
                <div>
                  <h3 className="font-extrabold text-base">
                    {viewingMember.nama}, {viewingMember.gelar}
                  </h3>
                  <p className="text-xs text-amber-300 font-mono">NAP: {viewingMember.nap}</p>
                </div>
              </div>
              <button
                onClick={() => setViewingMember(null)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-slate-50 rounded-xl">
                  <span className="text-slate-500 font-semibold block">Instansi</span>
                  <span className="font-bold text-slate-900">{viewingMember.instansi}</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl">
                  <span className="text-slate-500 font-semibold block">Jabatan</span>
                  <span className="font-bold text-slate-900">{viewingMember.jabatan || '-'}</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl">
                  <span className="text-slate-500 font-semibold block">WhatsApp</span>
                  <span className="font-bold text-emerald-700">{viewingMember.noWa}</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl">
                  <span className="text-slate-500 font-semibold block">Tanggal Gabung</span>
                  <span className="font-bold text-slate-900">{viewingMember.tanggalBergabung}</span>
                </div>
              </div>

              {/* Dues Summary Box */}
              {(() => {
                const sum = getMemberDuesSummary(viewingMember.id);
                return (
                  <div className="p-4 bg-amber-50 rounded-2xl border border-amber-300 space-y-2">
                    <div className="flex items-center justify-between text-xs font-bold text-amber-950">
                      <span>Total Iuran Terverifikasi:</span>
                      <span className="text-emerald-700 font-mono">{formatCurrency(sum.totalPaid)}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs font-bold text-amber-950">
                      <span>Sisa Tunggakan (2025–2026):</span>
                      <span className="text-red-700 font-mono">{formatCurrency(sum.arrearsAmount)}</span>
                    </div>
                  </div>
                );
              })()}

              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={() => setViewingMember(null)}
                  className="px-5 py-2 bg-slate-900 text-white text-xs font-bold rounded-xl"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Import Excel Modal */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Upload className="w-5 h-5 text-emerald-400" />
                <h3 className="font-bold text-sm">Import Data Anggota dari Excel / CSV</h3>
              </div>
              <button
                onClick={() => {
                  setShowImportModal(false);
                  setImportPreview([]);
                }}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="border-2 border-dashed border-slate-300 hover:border-emerald-500 rounded-2xl p-6 text-center bg-slate-50 transition-colors">
                <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                <p className="text-xs font-bold text-slate-700">Pilih file Excel (.xlsx / .csv)</p>
                <p className="text-[11px] text-slate-500 mt-1">
                  Format kolom: Nama, Gelar, NAP, WhatsApp, Instansi, Jabatan
                </p>
                <div className="flex items-center justify-center gap-2 mt-2">
                  <button
                    type="button"
                    onClick={handleDownloadCsvTemplate}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold text-teal-700 bg-teal-50 hover:bg-teal-100 border border-teal-200 rounded-lg transition-colors cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Unduh Format Template CSV
                  </button>
                </div>
                <input
                  type="file"
                  accept=".xlsx, .xls, .csv"
                  onChange={handleFileUpload}
                  className="mt-3 text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-emerald-600 file:text-white hover:file:bg-emerald-700 cursor-pointer"
                />
              </div>

              {importPreview.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-extrabold text-slate-800">
                    Pratinjau Data yang Akan Diimpor ({importPreview.length} Anggota):
                  </p>
                  <div className="max-h-48 overflow-y-auto border border-slate-200 rounded-xl text-xs custom-scrollbar">
                    <table className="w-full text-left">
                      <thead className="bg-slate-100 text-slate-700 text-[10px] font-bold">
                        <tr>
                          <th className="p-2">Nama</th>
                          <th className="p-2">NAP</th>
                          <th className="p-2">Instansi</th>
                          <th className="p-2">WhatsApp</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-[11px]">
                        {importPreview.map((item, i) => (
                          <tr key={i}>
                            <td className="p-2 font-bold">{item.nama}, {item.gelar}</td>
                            <td className="p-2 font-mono">{item.nap}</td>
                            <td className="p-2">{item.instansi}</td>
                            <td className="p-2">{item.noWa}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setShowImportModal(false);
                    setImportPreview([]);
                  }}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Batal
                </button>

                <button
                  type="button"
                  disabled={importPreview.length === 0}
                  onClick={handleConfirmImport}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-xs"
                >
                  Import {importPreview.length} Anggota
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Member Password Reset Modal */}
      {passwordModalMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
                  <KeyRound className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-slate-900">
                    Atur Kata Sandi Anggota
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    {passwordModalMember.nama}, {passwordModalMember.gelar}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setPasswordModalMember(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-4 space-y-4 text-xs">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                <p className="text-[11px] text-slate-500 font-medium">Username Login Anggota:</p>
                <p className="text-sm font-black font-mono text-slate-900">
                  {passwordModalMember.nap}
                </p>
                <p className="text-[10px] text-slate-400">
                  Anggota login menggunakan Nomor Anggota (NAP) di atas.
                </p>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Kata Sandi Baru *
                </label>
                <input
                  type="text"
                  required
                  value={targetMemberPassword}
                  onChange={e => setTargetMemberPassword(e.target.value)}
                  placeholder="Masukkan kata sandi baru..."
                  className="w-full p-2.5 rounded-xl border border-slate-300 font-mono font-bold text-slate-900 outline-hidden focus:border-amber-500"
                />
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setTargetMemberPassword('123456')}
                  className="text-[11px] font-bold text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
                >
                  Reset ke Default "123456"
                </button>
              </div>

              {passwordSavedToast && (
                <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-bold flex items-center gap-1.5">
                  <Check className="w-4 h-4 text-emerald-600" />
                  Kata sandi berhasil disimpan dan langsung aktif!
                </div>
              )}

              <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setPasswordModalMember(null)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  Tutup
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (!targetMemberPassword.trim()) {
                      alert('Kata sandi tidak boleh kosong!');
                      return;
                    }
                    changeMemberPassword(passwordModalMember.id, targetMemberPassword.trim());
                    setPasswordSavedToast(true);
                    setTimeout(() => {
                      setPasswordSavedToast(false);
                      setPasswordModalMember(null);
                    }, 1200);
                  }}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-md transition-all cursor-pointer"
                >
                  Simpan Kata Sandi
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Manage Arrears Modal */}
      {arrearsModalMember && (
        <ManageArrearsModal
          member={arrearsModalMember}
          isOpen={true}
          onClose={() => setArrearsModalMember(null)}
        />
      )}

      {/* In-App Delete Confirmation Modal */}
      {memberToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-red-200 animate-in zoom-in-95 duration-150 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-lg font-black text-slate-900">
                Hapus Anggota Organisasi?
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Hapus anggota <span className="font-bold text-slate-800">"{memberToDelete.nama}"</span> ({memberToDelete.nap}) beserta seluruh catatan iuran terkait secara permanen dari database Supabase?
              </p>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                disabled={isDeletingMember}
                onClick={() => setMemberToDelete(null)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={isDeletingMember}
                onClick={async () => {
                  setIsDeletingMember(true);
                  try {
                    await deleteMember(memberToDelete.id);
                    setMemberToDelete(null);
                  } finally {
                    setIsDeletingMember(false);
                  }
                }}
                className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white text-xs font-black rounded-xl shadow-md transition-colors cursor-pointer flex items-center justify-center gap-1.5"
              >
                {isDeletingMember ? 'Menghapus...' : 'Ya, Hapus Sekarang'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Export Toast Notification */}
      {exportToast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 bg-slate-900 text-white text-xs font-bold rounded-2xl shadow-xl border border-teal-500/30 animate-in fade-in slide-in-from-bottom-3 duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{exportToast}</span>
          <button
            type="button"
            onClick={() => setExportToast(null)}
            className="ml-2 text-slate-400 hover:text-white p-0.5 rounded-md transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
};

export default DataAnggota;

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { AppSettings, Member, DuesRecord, ActivityLog } from '../types';

export interface ArrearsExportItem {
  no: number;
  nama: string;
  gelar?: string;
  nap: string;
  noWa: string;
  instansi: string;
  unpaidMonthsStr: string;
  unpaidCount: number;
  totalArrears: number;
}

export interface MonthlyRecapExportItem {
  monthNum: number;
  name: string;
  paidCount: number;
  unpaidCount: number;
  pendingCount: number;
  potential: number;
  collected: number;
  arrears: number;
  compliance: number;
}

/**
 * Format currency to IDR
 */
const formatRupiah = (amount: number): string => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(amount);
};

/**
 * Format date in Indonesian standard
 */
const formatIndonesianDate = (date: Date = new Date()): string => {
  return date.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
};

/**
 * Export Daftar Tunggakan to Excel
 */
export const exportDaftarTunggakanExcel = (
  items: ArrearsExportItem[],
  periodLabel: string,
  settings: AppSettings,
  totalArrears: number
) => {
  const now = new Date();
  const dateStr = formatIndonesianDate(now);

  // Sheet 1: Detail Tunggakan
  const detailData = items.map((item, idx) => ({
    No: idx + 1,
    'Nama Anggota': `${item.nama}${item.gelar ? ', ' + item.gelar : ''}`.trim(),
    NAP: item.nap,
    'No. WhatsApp': item.noWa || '-',
    'Instansi / Unit Kerja': item.instansi || '-',
    'Rincian Bulan Menunggak': item.unpaidMonthsStr,
    'Jumlah Bulan': item.unpaidCount,
    'Total Tunggakan (Rp)': item.totalArrears,
  }));

  // Add total row at bottom
  detailData.push({
    No: '' as any,
    'Nama Anggota': 'TOTAL KESELURUHAN' as any,
    NAP: '',
    'No. WhatsApp': '',
    'Instansi / Unit Kerja': `${items.length} Anggota Menunggak`,
    'Rincian Bulan Menunggak': '',
    'Jumlah Bulan': items.reduce((sum, i) => sum + i.unpaidCount, 0),
    'Total Tunggakan (Rp)': totalArrears,
  });

  // Sheet 2: Ringkasan & Profil Laporan
  const summaryData = [
    { Parameter: 'Nama Organisasi', Nilai: settings.organizationName },
    { Parameter: 'Cabang / DPC', Nilai: settings.branchName },
    { Parameter: 'Judul Laporan', Nilai: 'Laporan Pengawasan Tunggakan Iuran Anggota' },
    { Parameter: 'Periode Tunggakan', Nilai: periodLabel },
    { Parameter: 'Tanggal Unduh', Nilai: dateStr },
    { Parameter: 'Tarif Iuran Wajib', Nilai: `${formatRupiah(settings.monthlyFee)} / bulan` },
    { Parameter: 'Jumlah Anggota Menunggak', Nilai: `${items.length} Anggota` },
    { Parameter: 'Total Nominal Tunggakan', Nilai: formatRupiah(totalArrears) },
    { Parameter: 'Ketua DPC', Nilai: `${settings.ketuaName || '-'} (NAP: ${settings.ketuaNap || '-'})` },
    { Parameter: 'Bendahara DPC', Nilai: `${settings.bendaharaName || '-'} (NAP: ${settings.bendaharaNap || '-'})` },
    { Parameter: 'Alamat Sekretariat', Nilai: settings.address || '-' },
    { Parameter: 'Kontak WhatsApp Resmi', Nilai: settings.contactWa || '-' },
  ];

  const wb = XLSX.utils.book_new();
  const wsDetail = XLSX.utils.json_to_sheet(detailData);
  const wsSummary = XLSX.utils.json_to_sheet(summaryData);

  // Set column widths for clean readability
  wsDetail['!cols'] = [
    { wch: 6 },  // No
    { wch: 30 }, // Nama
    { wch: 18 }, // NAP
    { wch: 16 }, // WA
    { wch: 32 }, // Instansi
    { wch: 40 }, // Rincian
    { wch: 14 }, // Jml Bulan
    { wch: 22 }, // Total Tunggakan
  ];

  wsSummary['!cols'] = [
    { wch: 28 },
    { wch: 55 },
  ];

  XLSX.utils.book_append_sheet(wb, wsDetail, 'Daftar_Tunggakan');
  XLSX.utils.book_append_sheet(wb, wsSummary, 'Informasi_Laporan');

  const safePeriod = periodLabel.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 30);
  const fileName = `Daftar_Tunggakan_Patelki_${safePeriod}_${now.toISOString().split('T')[0]}.xlsx`;
  XLSX.writeFile(wb, fileName);
};

/**
 * Export Daftar Tunggakan to PDF
 */
export const exportDaftarTunggakanPDF = (
  items: ArrearsExportItem[],
  periodLabel: string,
  settings: AppSettings,
  totalArrears: number
) => {
  const doc = new jsPDF('landscape', 'mm', 'a4');
  const now = new Date();
  const dateStr = formatIndonesianDate(now);
  const yearNow = now.getFullYear();

  // Primary Palette
  const darkGreen = [0, 102, 79]; // #00664F
  const goldAmber = [255, 159, 0]; // #FF9F00

  // 1. Top Decorative Bar
  doc.setFillColor(darkGreen[0], darkGreen[1], darkGreen[2]);
  doc.rect(0, 0, 297, 6, 'F');
  doc.setFillColor(goldAmber[0], goldAmber[1], goldAmber[2]);
  doc.rect(0, 6, 297, 1.5, 'F');

  // 2. Kop Surat Organisasi
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(0, 102, 79);
  doc.text('PERSATUAN AHLI TEKNOLOGI LABORATORIUM MEDIK INDONESIA (PATELKI)', 14, 16);

  doc.setFontSize(16);
  doc.setTextColor(20, 36, 58); // #14243A
  doc.text('DEWAN PENGURUS CABANG KABUPATEN KAYONG UTARA', 14, 23);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(90, 105, 120);
  const addressText = `Sekretariat: ${settings.address || 'Kabupaten Kayong Utara, Kalimantan Barat'} | WA: ${settings.contactWa || '-'} | Email: ${settings.contactEmail || '-'}`;
  doc.text(addressText, 14, 28);

  // Divider Line
  doc.setDrawColor(20, 36, 58);
  doc.setLineWidth(0.8);
  doc.line(14, 31, 283, 31);
  doc.setLineWidth(0.2);
  doc.line(14, 32, 283, 32);

  // 3. Document Title & Period
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(0, 102, 79);
  doc.text('LAPORAN PENGAWASAN TUNGGAKAN IURAN ANGGOTA', 148.5, 40, { align: 'center' });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(180, 83, 9); // Amber 700
  doc.text(`PERIODE: ${periodLabel.toUpperCase()}`, 148.5, 45, { align: 'center' });

  // 4. KPI Summary Box
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(213, 222, 232);
  doc.roundedRect(14, 48, 269, 14, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105);

  doc.text(`Total Anggota Menunggak: ${items.length} Orang`, 20, 56.5);
  doc.text(`Tarif Iuran: ${formatRupiah(settings.monthlyFee)} / bln`, 105, 56.5);

  doc.setTextColor(185, 28, 28); // Red
  doc.text(`Total Tunggakan: ${formatRupiah(totalArrears)}`, 195, 56.5);

  // 5. Table using jspdf-autotable
  const tableData = items.map((item, idx) => [
    (idx + 1).toString(),
    `${item.nama}${item.gelar ? ', ' + item.gelar : ''}`.trim(),
    item.nap || '-',
    item.instansi || '-',
    item.noWa || '-',
    item.unpaidMonthsStr || '-',
    `${item.unpaidCount} Bln`,
    formatRupiah(item.totalArrears),
  ]);

  autoTable(doc, {
    startY: 66,
    head: [[
      'NO',
      'NAMA ANGGOTA',
      'NAP',
      'INSTANSI / UNIT KERJA',
      'NO. WHATSAPP',
      'RINCIAN BULAN MENUNGGAK',
      'JML',
      'TOTAL TUNGGAKAN',
    ]],
    body: tableData,
    foot: [[
      '',
      'TOTAL KESELURUHAN',
      '',
      `${items.length} Anggota`,
      '',
      '',
      `${items.reduce((sum, i) => sum + i.unpaidCount, 0)} Bln`,
      formatRupiah(totalArrears),
    ]],
    theme: 'grid',
    headStyles: {
      fillColor: [0, 102, 79],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8,
      halign: 'center',
    },
    footStyles: {
      fillColor: [241, 245, 249],
      textColor: [185, 28, 28],
      fontStyle: 'bold',
      fontSize: 8.5,
    },
    bodyStyles: {
      fontSize: 7.5,
      textColor: [30, 41, 59],
      cellPadding: 2,
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 10 },
      1: { cellWidth: 48, fontStyle: 'bold' },
      2: { halign: 'center', cellWidth: 26 },
      3: { cellWidth: 48 },
      4: { halign: 'center', cellWidth: 28 },
      5: { cellWidth: 64 },
      6: { halign: 'center', cellWidth: 16 },
      7: { halign: 'right', cellWidth: 29, fontStyle: 'bold', textColor: [185, 28, 28] },
    },
    styles: {
      overflow: 'linebreak',
      lineColor: [226, 232, 240],
      lineWidth: 0.1,
    },
    margin: { left: 14, right: 14 },
    didDrawPage: (data) => {
      // Footer page numbering on each page
      const pageCount = (doc as any).internal.getNumberOfPages();
      doc.setFontSize(7.5);
      doc.setTextColor(148, 163, 184);
      doc.text(
        `SI-IURAN PATELKI Kayong Utara | Dicetak pada: ${dateStr} | Halaman ${data.pageNumber} dari ${pageCount}`,
        14,
        202
      );
    },
  });

  // 6. Signatures Section at the end of table
  const finalY = (doc as any).lastAutoTable ? (doc as any).lastAutoTable.finalY + 10 : 150;
  
  // If not enough space on current page for signatures, add a page
  if (finalY > 165) {
    doc.addPage();
  }

  const signY = finalY > 165 ? 20 : finalY;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(51, 65, 85);

  const cityDate = `Sukadana, ${dateStr}`;
  doc.text(cityDate, 220, signY);

  // Position titles
  doc.text('Mengetahui,', 30, signY + 6);
  doc.text('Ketua DPC PATELKI Kayong Utara', 30, signY + 11);

  doc.text('Dibuat Oleh,', 220, signY + 6);
  doc.text('Bendahara DPC PATELKI Kayong Utara', 220, signY + 11);

  // Signer names (bold)
  doc.setFont('helvetica', 'bold');
  const ketuaName = settings.ketuaName || '( ..................................................... )';
  const bendaharaName = settings.bendaharaName || '( ..................................................... )';
  
  doc.text(ketuaName, 30, signY + 34);
  doc.text(bendaharaName, 220, signY + 34);

  // Signer NAPs
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text(`NAP: ${settings.ketuaNap || '-'}`, 30, signY + 38);
  doc.text(`NAP: ${settings.bendaharaNap || '-'}`, 220, signY + 38);

  const safePeriod = periodLabel.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 30);
  const fileName = `Daftar_Tunggakan_Patelki_${safePeriod}_${yearNow}.pdf`;
  doc.save(fileName);
};

/**
 * Export Rekapitulasi Iuran to Excel
 */
export const exportRekapitulasiIuranExcel = (
  breakdown: MonthlyRecapExportItem[],
  selectedYear: number,
  activeCount: number,
  settings: AppSettings,
  members: Member[],
  duesRecords: DuesRecord[]
) => {
  const now = new Date();
  const dateStr = formatIndonesianDate(now);

  const yearTotalPotential = breakdown.reduce((sum, m) => sum + m.potential, 0);
  const yearTotalCollected = breakdown.reduce((sum, m) => sum + m.collected, 0);
  const yearTotalArrears = breakdown.reduce((sum, m) => sum + m.arrears, 0);
  const yearAvgCompliance = Math.round(breakdown.reduce((sum, m) => sum + m.compliance, 0) / (breakdown.length || 1));

  // Sheet 1: Rekap Bulanan
  const monthlyData = breakdown.map(m => ({
    'Bulan': `${m.name} ${selectedYear}`,
    'Anggota Aktif': activeCount,
    'Sudah Lunas (Org)': m.paidCount,
    'Belum Bayar (Org)': m.unpaidCount,
    'Menunggu Verifikasi': m.pendingCount,
    'Potensi Tagihan (Rp)': m.potential,
    'Iuran Masuk (Rp)': m.collected,
    'Tunggakan (Rp)': m.arrears,
    'Kepatuhan (%)': `${m.compliance}%`,
  }));

  monthlyData.push({
    'Bulan': `TOTAL TAHUN ${selectedYear}`,
    'Anggota Aktif': activeCount,
    'Sudah Lunas (Org)': breakdown.reduce((sum, m) => sum + m.paidCount, 0),
    'Belum Bayar (Org)': breakdown.reduce((sum, m) => sum + m.unpaidCount, 0),
    'Menunggu Verifikasi': breakdown.reduce((sum, m) => sum + m.pendingCount, 0),
    'Potensi Tagihan (Rp)': yearTotalPotential,
    'Iuran Masuk (Rp)': yearTotalCollected,
    'Tunggakan (Rp)': yearTotalArrears,
    'Kepatuhan (%)': `${yearAvgCompliance}%`,
  });

  // Sheet 2: Status Per Anggota Tahun Terpilih
  const memberMatrixData = members
    .filter(m => m.status === 'aktif')
    .map((member, idx) => {
      const memberRecords = duesRecords.filter(d => 
        (d.memberId === member.id || (member.nap && d.memberId === member.nap)) &&
        d.year === selectedYear
      );

      const paidMonths = memberRecords.filter(d => d.status === 'paid').length;
      const unpaidMonths = 12 - paidMonths;
      const totalPaid = paidMonths * (settings.monthlyFee || 30000);
      const totalUnpaid = unpaidMonths * (settings.monthlyFee || 30000);

      const row: any = {
        No: idx + 1,
        'Nama Lengkap': `${member.nama}${member.gelar ? ', ' + member.gelar : ''}`.trim(),
        NAP: member.nap,
        'Instansi / Unit Kerja': member.instansi,
        'Bulan Lunas': paidMonths,
        'Bulan Belum Lunas': unpaidMonths,
        'Total Terbayar (Rp)': totalPaid,
        'Sisa Tunggakan (Rp)': totalUnpaid,
        'Status Tahunan': paidMonths === 12 ? 'LUNAS PENUH' : paidMonths > 0 ? 'SEBAGIAN' : 'BELUM BAYAR',
      };

      return row;
    });

  // Sheet 3: Profil Laporan Eksekutif
  const summaryInfo = [
    { Parameter: 'Nama Organisasi', Nilai: settings.organizationName },
    { Parameter: 'Cabang / DPC', Nilai: settings.branchName },
    { Parameter: 'Judul Laporan', Nilai: `Rekapitulasi Iuran & Kolektibilitas Kas Tahun ${selectedYear}` },
    { Parameter: 'Tahun Anggaran', Nilai: selectedYear.toString() },
    { Parameter: 'Tanggal Unduh', Nilai: dateStr },
    { Parameter: 'Total Anggota Terdaftar', Nilai: `${members.length} Orang (${activeCount} Aktif)` },
    { Parameter: 'Tarif Iuran Wajib', Nilai: `${formatRupiah(settings.monthlyFee)} / bulan` },
    { Parameter: 'Total Potensi Kas Tahunan', Nilai: formatRupiah(yearTotalPotential) },
    { Parameter: 'Total Iuran Terkumpul Real', Nilai: formatRupiah(yearTotalCollected) },
    { Parameter: 'Total Tunggakan Sisa', Nilai: formatRupiah(yearTotalArrears) },
    { Parameter: 'Rata-rata Kepatuhan', Nilai: `${yearAvgCompliance}%` },
    { Parameter: 'Ketua DPC', Nilai: `${settings.ketuaName || '-'} (NAP: ${settings.ketuaNap || '-'})` },
    { Parameter: 'Bendahara DPC', Nilai: `${settings.bendaharaName || '-'} (NAP: ${settings.bendaharaNap || '-'})` },
  ];

  const wb = XLSX.utils.book_new();
  const wsMonthly = XLSX.utils.json_to_sheet(monthlyData);
  const wsMembers = XLSX.utils.json_to_sheet(memberMatrixData);
  const wsSummary = XLSX.utils.json_to_sheet(summaryInfo);

  wsMonthly['!cols'] = [
    { wch: 22 }, // Bulan
    { wch: 14 }, // Anggota
    { wch: 18 }, // Lunas
    { wch: 18 }, // Belum
    { wch: 20 }, // Pending
    { wch: 22 }, // Potensi
    { wch: 22 }, // Masuk
    { wch: 20 }, // Tunggakan
    { wch: 16 }, // Kepatuhan
  ];

  wsMembers['!cols'] = [
    { wch: 6 },
    { wch: 32 },
    { wch: 18 },
    { wch: 32 },
    { wch: 14 },
    { wch: 18 },
    { wch: 20 },
    { wch: 20 },
    { wch: 16 },
  ];

  wsSummary['!cols'] = [
    { wch: 28 },
    { wch: 55 },
  ];

  XLSX.utils.book_append_sheet(wb, wsMonthly, `Rekap_Bulanan_${selectedYear}`);
  XLSX.utils.book_append_sheet(wb, wsMembers, `Status_Anggota_${selectedYear}`);
  XLSX.utils.book_append_sheet(wb, wsSummary, 'Ringkasan_Eksekutif');

  const fileName = `Rekapitulasi_Iuran_Patelki_${selectedYear}_${now.toISOString().split('T')[0]}.xlsx`;
  XLSX.writeFile(wb, fileName);
};

/**
 * Export Rekapitulasi Iuran to PDF
 */
export const exportRekapitulasiIuranPDF = (
  breakdown: MonthlyRecapExportItem[],
  selectedYear: number,
  activeCount: number,
  settings: AppSettings
) => {
  const doc = new jsPDF('landscape', 'mm', 'a4');
  const now = new Date();
  const dateStr = formatIndonesianDate(now);

  const yearTotalPotential = breakdown.reduce((sum, m) => sum + m.potential, 0);
  const yearTotalCollected = breakdown.reduce((sum, m) => sum + m.collected, 0);
  const yearTotalArrears = breakdown.reduce((sum, m) => sum + m.arrears, 0);
  const yearAvgCompliance = Math.round(breakdown.reduce((sum, m) => sum + m.compliance, 0) / (breakdown.length || 1));

  // Colors
  const darkGreen = [0, 102, 79];
  const goldAmber = [255, 159, 0];

  // 1. Top Decorative Bar
  doc.setFillColor(darkGreen[0], darkGreen[1], darkGreen[2]);
  doc.rect(0, 0, 297, 6, 'F');
  doc.setFillColor(goldAmber[0], goldAmber[1], goldAmber[2]);
  doc.rect(0, 6, 297, 1.5, 'F');

  // 2. Kop Surat Organisasi
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(0, 102, 79);
  doc.text('PERSATUAN AHLI TEKNOLOGI LABORATORIUM MEDIK INDONESIA (PATELKI)', 14, 16);

  doc.setFontSize(16);
  doc.setTextColor(20, 36, 58);
  doc.text('DEWAN PENGURUS CABANG KABUPATEN KAYONG UTARA', 14, 23);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(90, 105, 120);
  const addressText = `Sekretariat: ${settings.address || 'Kabupaten Kayong Utara, Kalimantan Barat'} | WA: ${settings.contactWa || '-'} | Email: ${settings.contactEmail || '-'}`;
  doc.text(addressText, 14, 28);

  // Line
  doc.setDrawColor(20, 36, 58);
  doc.setLineWidth(0.8);
  doc.line(14, 31, 283, 31);
  doc.setLineWidth(0.2);
  doc.line(14, 32, 283, 32);

  // 3. Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(0, 102, 79);
  doc.text(`LAPORAN REKAPITULASI & KOLEKTIBILITAS IURAN ANGGOTA`, 148.5, 40, { align: 'center' });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(180, 83, 9);
  doc.text(`TAHUN ANGGARAN ${selectedYear} (12 BULAN)`, 148.5, 45, { align: 'center' });

  // 4. KPI Summary Strip (4 cards)
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(213, 222, 232);
  doc.roundedRect(14, 48, 269, 14, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105);

  doc.text(`Anggota Aktif: ${activeCount} ATLM`, 20, 56.5);
  doc.text(`Potensi: ${formatRupiah(yearTotalPotential)}`, 85, 56.5);

  doc.setTextColor(0, 102, 79);
  doc.text(`Terkumpul: ${formatRupiah(yearTotalCollected)}`, 150, 56.5);

  doc.setTextColor(185, 28, 28);
  doc.text(`Tunggakan: ${formatRupiah(yearTotalArrears)} (${yearAvgCompliance}% Kepatuhan)`, 215, 56.5);

  // 5. Table Data
  const tableData = breakdown.map((m, idx) => [
    (idx + 1).toString(),
    m.name,
    m.paidCount.toString(),
    m.unpaidCount.toString(),
    m.pendingCount > 0 ? m.pendingCount.toString() : '-',
    formatRupiah(m.potential),
    formatRupiah(m.collected),
    formatRupiah(m.arrears),
    `${m.compliance}%`,
  ]);

  autoTable(doc, {
    startY: 66,
    head: [[
      'NO',
      'BULAN',
      'SUDAH BAYAR',
      'BELUM BAYAR',
      'VERIFIKASI',
      'POTENSI TAGIHAN',
      'PEMASUKAN IURAN',
      'TUNGGAKAN',
      'KEPATUHAN',
    ]],
    body: tableData,
    foot: [[
      '',
      `TOTAL TAHUN ${selectedYear}`,
      breakdown.reduce((sum, m) => sum + m.paidCount, 0).toString(),
      breakdown.reduce((sum, m) => sum + m.unpaidCount, 0).toString(),
      breakdown.reduce((sum, m) => sum + m.pendingCount, 0).toString(),
      formatRupiah(yearTotalPotential),
      formatRupiah(yearTotalCollected),
      formatRupiah(yearTotalArrears),
      `${yearAvgCompliance}%`,
    ]],
    theme: 'grid',
    headStyles: {
      fillColor: [0, 102, 79],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8,
      halign: 'center',
    },
    footStyles: {
      fillColor: [241, 245, 249],
      textColor: [0, 102, 79],
      fontStyle: 'bold',
      fontSize: 8.5,
    },
    bodyStyles: {
      fontSize: 7.5,
      textColor: [30, 41, 59],
      cellPadding: 2,
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 10 },
      1: { cellWidth: 36, fontStyle: 'bold' },
      2: { halign: 'center', cellWidth: 26, textColor: [0, 102, 79], fontStyle: 'bold' },
      3: { halign: 'center', cellWidth: 26, textColor: [185, 28, 28] },
      4: { halign: 'center', cellWidth: 24, textColor: [180, 83, 9] },
      5: { halign: 'right', cellWidth: 38 },
      6: { halign: 'right', cellWidth: 38, fontStyle: 'bold', textColor: [0, 102, 79] },
      7: { halign: 'right', cellWidth: 38, fontStyle: 'bold', textColor: [185, 28, 28] },
      8: { halign: 'center', cellWidth: 33, fontStyle: 'bold' },
    },
    styles: {
      overflow: 'linebreak',
      lineColor: [226, 232, 240],
      lineWidth: 0.1,
    },
    margin: { left: 14, right: 14 },
    didDrawPage: (data) => {
      const pageCount = (doc as any).internal.getNumberOfPages();
      doc.setFontSize(7.5);
      doc.setTextColor(148, 163, 184);
      doc.text(
        `SI-IURAN PATELKI Kayong Utara | Rekapitulasi Iuran Tahun ${selectedYear} | Dicetak: ${dateStr} | Halaman ${data.pageNumber} dari ${pageCount}`,
        14,
        202
      );
    },
  });

  // Signatures Section
  const finalY = (doc as any).lastAutoTable ? (doc as any).lastAutoTable.finalY + 10 : 155;
  if (finalY > 165) {
    doc.addPage();
  }

  const signY = finalY > 165 ? 20 : finalY;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(51, 65, 85);

  const cityDate = `Sukadana, ${dateStr}`;
  doc.text(cityDate, 220, signY);

  doc.text('Mengetahui,', 30, signY + 6);
  doc.text('Ketua DPC PATELKI Kayong Utara', 30, signY + 11);

  doc.text('Dibuat Oleh,', 220, signY + 6);
  doc.text('Bendahara DPC PATELKI Kayong Utara', 220, signY + 11);

  doc.setFont('helvetica', 'bold');
  const ketuaName = settings.ketuaName || '( ..................................................... )';
  const bendaharaName = settings.bendaharaName || '( ..................................................... )';

  doc.text(ketuaName, 30, signY + 34);
  doc.text(bendaharaName, 220, signY + 34);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text(`NAP: ${settings.ketuaNap || '-'}`, 30, signY + 38);
  doc.text(`NAP: ${settings.bendaharaNap || '-'}`, 220, signY + 38);

  const fileName = `Rekapitulasi_Iuran_Patelki_${selectedYear}_${now.getFullYear()}.pdf`;
  doc.save(fileName);
};

/**
 * Export Activity Logs to Excel
 */
export const exportActivityLogsExcel = (
  logs: ActivityLog[],
  settings: AppSettings,
  filterDescription?: string
) => {
  const now = new Date();
  const dateStr = formatIndonesianDate(now);

  const detailData = logs.map((log, idx) => ({
    No: idx + 1,
    'Waktu': new Date(log.timestamp).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'medium' }),
    'Aktor': log.actorName,
    'Peran': log.actorRole.toUpperCase(),
    'Kategori': log.category.toUpperCase(),
    'Tipe Aksi': log.action.toUpperCase(),
    'Ringkasan Aktivitas': log.title,
    'Detail Perubahan': log.description,
    'Nilai Sebelumnya': log.oldValue || '-',
    'Nilai Baru': log.newValue || '-',
    'IP / Sesi': log.ipAddress || '-',
  }));

  const summaryData = [
    { Parameter: 'Nama Organisasi', Nilai: settings.organizationName },
    { Parameter: 'Cabang / DPC', Nilai: settings.branchName },
    { Parameter: 'Judul Laporan', Nilai: 'Log Aktivitas & Jejak Audit (Audit Trails)' },
    { Parameter: 'Filter Laporan', Nilai: filterDescription || 'Semua Log Aktivitas' },
    { Parameter: 'Tanggal Unduh', Nilai: dateStr },
    { Parameter: 'Total Log Diekspor', Nilai: `${logs.length} Catatan` },
    { Parameter: 'Ketua DPC', Nilai: `${settings.ketuaName || '-'} (NAP: ${settings.ketuaNap || '-'})` },
    { Parameter: 'Bendahara DPC', Nilai: `${settings.bendaharaName || '-'} (NAP: ${settings.bendaharaNap || '-'})` },
  ];

  const wb = XLSX.utils.book_new();
  const wsDetail = XLSX.utils.json_to_sheet(detailData);
  const wsSummary = XLSX.utils.json_to_sheet(summaryData);

  wsDetail['!cols'] = [
    { wch: 6 },
    { wch: 22 },
    { wch: 25 },
    { wch: 14 },
    { wch: 16 },
    { wch: 14 },
    { wch: 35 },
    { wch: 45 },
    { wch: 25 },
    { wch: 25 },
    { wch: 16 },
  ];

  wsSummary['!cols'] = [{ wch: 28 }, { wch: 55 }];

  XLSX.utils.book_append_sheet(wb, wsDetail, 'Jejak_Audit');
  XLSX.utils.book_append_sheet(wb, wsSummary, 'Informasi_Audit');

  XLSX.writeFile(wb, `Log_Aktivitas_Audit_Patelki_${now.toISOString().split('T')[0]}.xlsx`);
};

/**
 * Export Activity Logs to PDF
 */
export const exportActivityLogsPDF = (
  logs: ActivityLog[],
  settings: AppSettings,
  filterDescription?: string
) => {
  const doc = new jsPDF('landscape', 'mm', 'a4');
  const now = new Date();
  const dateStr = formatIndonesianDate(now);

  const darkGreen = [0, 102, 79];
  const goldAmber = [255, 159, 0];

  // 1. Top Decorative Bar
  doc.setFillColor(darkGreen[0], darkGreen[1], darkGreen[2]);
  doc.rect(0, 0, 297, 6, 'F');
  doc.setFillColor(goldAmber[0], goldAmber[1], goldAmber[2]);
  doc.rect(0, 6, 297, 1.5, 'F');

  // 2. Kop Surat Organisasi
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(0, 102, 79);
  doc.text('PERSATUAN AHLI TEKNOLOGI LABORATORIUM MEDIK INDONESIA (PATELKI)', 14, 16);

  doc.setFontSize(16);
  doc.setTextColor(20, 36, 58);
  doc.text('DEWAN PENGURUS CABANG KABUPATEN KAYONG UTARA', 14, 23);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(90, 105, 120);
  const addressText = `Sekretariat: ${settings.address || 'Kabupaten Kayong Utara, Kalimantan Barat'} | WA: ${settings.contactWa || '-'} | Email: ${settings.contactEmail || '-'}`;
  doc.text(addressText, 14, 28);

  // Line
  doc.setDrawColor(20, 36, 58);
  doc.setLineWidth(0.8);
  doc.line(14, 31, 283, 31);
  doc.setLineWidth(0.2);
  doc.line(14, 32, 283, 32);

  // 3. Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(0, 102, 79);
  doc.text('LAPORAN LOG AKTIVITAS & JEJAK AUDIT (AUDIT TRAILS)', 148.5, 40, { align: 'center' });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(180, 83, 9);
  doc.text(`STATUS PENGAWASAN: ${filterDescription ? filterDescription.toUpperCase() : 'SEMUA RIWAYAT SISTEM'}`, 148.5, 45, { align: 'center' });

  // 4. KPI Box
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(213, 222, 232);
  doc.roundedRect(14, 48, 269, 12, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105);

  doc.text(`Total Entri Audit: ${logs.length} Tindakan`, 20, 55.5);
  doc.text(`Dicetak Pada: ${dateStr}`, 110, 55.5);
  doc.setTextColor(0, 102, 79);
  doc.text(`Integritas Audit: 100% Terverifikasi Akun DPC`, 190, 55.5);

  // 5. Table Data
  const tableData = logs.map((l, idx) => [
    (idx + 1).toString(),
    new Date(l.timestamp).toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' }),
    l.actorName,
    l.category.toUpperCase(),
    l.action.toUpperCase(),
    l.title,
    l.description,
  ]);

  autoTable(doc, {
    startY: 64,
    head: [[
      'NO',
      'WAKTU',
      'AKTOR',
      'KATEGORI',
      'AKSI',
      'RINGKASAN AKTIVITAS',
      'RINCIAN / PERUBAHAN',
    ]],
    body: tableData,
    theme: 'grid',
    headStyles: {
      fillColor: [0, 102, 79],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8,
      halign: 'center',
    },
    bodyStyles: {
      fontSize: 7.5,
      textColor: [30, 41, 59],
      cellPadding: 2,
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 10 },
      1: { halign: 'center', cellWidth: 26 },
      2: { cellWidth: 42, fontStyle: 'bold' },
      3: { halign: 'center', cellWidth: 26 },
      4: { halign: 'center', cellWidth: 22 },
      5: { cellWidth: 55, fontStyle: 'bold' },
      6: { cellWidth: 88 },
    },
    styles: {
      overflow: 'linebreak',
      lineColor: [226, 232, 240],
      lineWidth: 0.1,
    },
    margin: { left: 14, right: 14 },
    didDrawPage: (data) => {
      const pageCount = (doc as any).internal.getNumberOfPages();
      doc.setFontSize(7.5);
      doc.setTextColor(148, 163, 184);
      doc.text(
        `SI-IURAN PATELKI Kayong Utara | Jejak Audit Akun | Halaman ${data.pageNumber} dari ${pageCount}`,
        14,
        202
      );
    },
  });

  // Signatures
  const finalY = (doc as any).lastAutoTable ? (doc as any).lastAutoTable.finalY + 10 : 155;
  if (finalY > 165) {
    doc.addPage();
  }

  const signY = finalY > 165 ? 20 : finalY;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(51, 65, 85);

  const cityDate = `Sukadana, ${dateStr}`;
  doc.text(cityDate, 220, signY);

  doc.text('Mengetahui,', 30, signY + 6);
  doc.text('Ketua DPC PATELKI Kayong Utara', 30, signY + 11);

  doc.text('Dibuat Oleh,', 220, signY + 6);
  doc.text('Bendahara DPC PATELKI Kayong Utara', 220, signY + 11);

  doc.setFont('helvetica', 'bold');
  const ketuaName = settings.ketuaName || '( ..................................................... )';
  const bendaharaName = settings.bendaharaName || '( ..................................................... )';

  doc.text(ketuaName, 30, signY + 34);
  doc.text(bendaharaName, 220, signY + 34);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text(`NAP: ${settings.ketuaNap || '-'}`, 30, signY + 38);
  doc.text(`NAP: ${settings.bendaharaNap || '-'}`, 220, signY + 38);

  doc.save(`Log_Aktivitas_Audit_Patelki_${now.getFullYear()}.pdf`);
};

export interface BudgetItemExport {
  no: number;
  type: 'income' | 'expense';
  category: string;
  budgetAmount: number;
  actualAmount: number;
  varianceAmount: number;
  percentage: number;
  status: string;
}

/**
 * Export Annual Budget Report to Excel
 */
export const exportBudgetReportExcel = (
  items: BudgetItemExport[],
  year: number,
  settings: AppSettings,
  totalIncomeBudget: number,
  totalIncomeActual: number,
  totalExpenseBudget: number,
  totalExpenseActual: number
) => {
  const now = new Date();
  const dateStr = formatIndonesianDate(now);

  const detailData = items.map((item, idx) => ({
    No: idx + 1,
    'Tipe Anggaran': item.type === 'income' ? 'Pendapatan Kas' : 'Belanja / Beban Kas',
    'Pos / Kategori Anggaran': item.category,
    'Pagu Rencana (Rp)': item.budgetAmount,
    'Realisasi Aktual (Rp)': item.actualAmount,
    'Selisih / Deviasi (Rp)': item.varianceAmount,
    'Capaian / Serapan (%)': `${item.percentage.toFixed(1)}%`,
    'Status Evaluasi': item.status,
  }));

  const netBudgetSurplus = totalIncomeBudget - totalExpenseBudget;
  const netActualSurplus = totalIncomeActual - totalExpenseActual;
  const netVariance = netActualSurplus - netBudgetSurplus;

  const summaryData = [
    { Parameter: 'Organisasi', Nilai: settings.organizationName },
    { Parameter: 'DPC Cabang', Nilai: settings.branchName },
    { Parameter: 'Tahun Anggaran Fiskal', Nilai: `Tahun ${year}` },
    { Parameter: 'Tanggal Cetak', Nilai: dateStr },
    { Parameter: 'Total Pagu Target Pendapatan (Rp)', Nilai: totalIncomeBudget },
    { Parameter: 'Total Realisasi Pendapatan (Rp)', Nilai: totalIncomeActual },
    { Parameter: 'Capaian Pendapatan (%)', Nilai: totalIncomeBudget > 0 ? `${((totalIncomeActual / totalIncomeBudget) * 100).toFixed(1)}%` : '0%' },
    { Parameter: 'Total Pagu Anggaran Belanja (Rp)', Nilai: totalExpenseBudget },
    { Parameter: 'Total Realisasi Belanja (Rp)', Nilai: totalExpenseActual },
    { Parameter: 'Serapan Anggaran Belanja (%)', Nilai: totalExpenseBudget > 0 ? `${((totalExpenseActual / totalExpenseBudget) * 100).toFixed(1)}%` : '0%' },
    { Parameter: 'Rencana Surplus/(Defisit) (Rp)', Nilai: netBudgetSurplus },
    { Parameter: 'Realisasi Kas Bersih (Rp)', Nilai: netActualSurplus },
    { Parameter: 'Deviasi Fiskal (Rp)', Nilai: netVariance },
  ];

  const wb = XLSX.utils.book_new();
  const wsDetail = XLSX.utils.json_to_sheet(detailData);
  const wsSummary = XLSX.utils.json_to_sheet(summaryData);

  wsDetail['!cols'] = [
    { wch: 6 },
    { wch: 22 },
    { wch: 35 },
    { wch: 20 },
    { wch: 22 },
    { wch: 22 },
    { wch: 22 },
    { wch: 22 },
  ];
  wsSummary['!cols'] = [{ wch: 32 }, { wch: 45 }];

  XLSX.utils.book_append_sheet(wb, wsDetail, 'Rincian_Anggaran');
  XLSX.utils.book_append_sheet(wb, wsSummary, 'Ringkasan_Fiskal');

  XLSX.writeFile(wb, `Laporan_Anggaran_Tahunan_Patelki_${year}.xlsx`);
};

/**
 * Export Annual Budget Report to PDF
 */
export const exportBudgetReportPDF = (
  items: BudgetItemExport[],
  year: number,
  settings: AppSettings,
  totalIncomeBudget: number,
  totalIncomeActual: number,
  totalExpenseBudget: number,
  totalExpenseActual: number
) => {
  const doc = new jsPDF('portrait', 'mm', 'a4');
  const now = new Date();
  const dateStr = formatIndonesianDate(now);

  const darkGreen = [0, 102, 79];
  const goldAmber = [255, 159, 0];

  // 1. Top Decorative Bar
  doc.setFillColor(darkGreen[0], darkGreen[1], darkGreen[2]);
  doc.rect(0, 0, 210, 5, 'F');
  doc.setFillColor(goldAmber[0], goldAmber[1], goldAmber[2]);
  doc.rect(0, 5, 210, 1.5, 'F');

  // 2. Kop Surat Organisasi
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(30, 41, 59);
  doc.text('PERSATUAN AHLI TEKNOLOGI LABORATORIUM MEDIK INDONESIA (PATELKI)', 105, 14, { align: 'center' });

  doc.setFontSize(13);
  doc.setTextColor(darkGreen[0], darkGreen[1], darkGreen[2]);
  doc.text('DEWAN PENGURUS CABANG KABUPATEN KAYONG UTARA', 105, 20, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  const alamat = `Sekretariat: ${settings.address || 'Kabupaten Kayong Utara, Kalimantan Barat'} | Kontak: ${settings.contactWa || '-'}`;
  doc.text(alamat, 105, 25, { align: 'center' });

  doc.setDrawColor(30, 41, 59);
  doc.setLineWidth(0.8);
  doc.line(14, 28, 196, 28);
  doc.setLineWidth(0.2);
  doc.line(14, 29, 196, 29);

  // 3. Document Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(15, 23, 42);
  doc.text('LAPORAN ANGGARAN & REALISASI KEUANGAN TAHUNAN (RAPB)', 105, 37, { align: 'center' });

  doc.setFontSize(9);
  doc.setTextColor(goldAmber[0], goldAmber[1], goldAmber[2]);
  doc.text(`TAHUN ANGGARAN FISKAL ${year}`, 105, 42, { align: 'center' });

  // 4. Summary KPI Box
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(14, 46, 182, 18, 2, 2, 'FD');

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  doc.text(`Pagu Target Pendapatan: Rp ${totalIncomeBudget.toLocaleString('id-ID')}`, 18, 52);
  doc.text(`Realisasi Pendapatan: Rp ${totalIncomeActual.toLocaleString('id-ID')} (${totalIncomeBudget > 0 ? ((totalIncomeActual / totalIncomeBudget) * 100).toFixed(1) : 0}%)`, 18, 58);

  doc.text(`Pagu Rencana Belanja: Rp ${totalExpenseBudget.toLocaleString('id-ID')}`, 105, 52);
  doc.text(`Realisasi Pengeluaran: Rp ${totalExpenseActual.toLocaleString('id-ID')} (${totalExpenseBudget > 0 ? ((totalExpenseActual / totalExpenseBudget) * 100).toFixed(1) : 0}%)`, 105, 58);

  // 5. Table
  const tableData = items.map((item, idx) => [
    idx + 1,
    item.type === 'income' ? 'Pendapatan' : 'Belanja',
    item.category,
    `Rp ${item.budgetAmount.toLocaleString('id-ID')}`,
    `Rp ${item.actualAmount.toLocaleString('id-ID')}`,
    `Rp ${Math.abs(item.varianceAmount).toLocaleString('id-ID')}`,
    `${item.percentage.toFixed(0)}%`,
    item.status,
  ]);

  autoTable(doc, {
    startY: 68,
    head: [['No', 'Tipe', 'Pos Kategori Anggaran', 'Pagu Rencana', 'Realisasi Riil', 'Selisih (Deviasi)', '%', 'Status']],
    body: tableData,
    theme: 'striped',
    headStyles: {
      fillColor: [0, 102, 79],
      textColor: 255,
      fontStyle: 'bold',
      fontSize: 8,
      halign: 'center',
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 8 },
      1: { halign: 'center', cellWidth: 20 },
      2: { cellWidth: 48, fontStyle: 'bold' },
      3: { halign: 'right', cellWidth: 26 },
      4: { halign: 'right', cellWidth: 26 },
      5: { halign: 'right', cellWidth: 24 },
      6: { halign: 'center', cellWidth: 12 },
      7: { halign: 'center', cellWidth: 18 },
    },
    styles: {
      fontSize: 7.5,
      cellPadding: 2,
    },
    margin: { left: 14, right: 14 },
    didDrawPage: (data) => {
      const pageCount = (doc as any).internal.getNumberOfPages();
      doc.setFontSize(7);
      doc.setTextColor(148, 163, 184);
      doc.text(
        `SI-IURAN PATELKI Kayong Utara | Laporan Anggaran ${year} | Halaman ${data.pageNumber} dari ${pageCount}`,
        14,
        287
      );
    },
  });

  // Signatures
  const finalY = (doc as any).lastAutoTable ? (doc as any).lastAutoTable.finalY + 8 : 220;
  const signY = finalY > 240 ? 240 : finalY;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(51, 65, 85);

  const cityDate = `Sukadana, ${dateStr}`;
  doc.text(cityDate, 140, signY);

  doc.text('Mengetahui,', 25, signY + 5);
  doc.text('Ketua DPC PATELKI Kayong Utara', 25, signY + 9);

  doc.text('Dibuat Oleh,', 140, signY + 5);
  doc.text('Bendahara DPC PATELKI Kayong Utara', 140, signY + 9);

  doc.setFont('helvetica', 'bold');
  const ketuaName = settings.ketuaName || '( ..................................................... )';
  const bendaharaName = settings.bendaharaName || '( ..................................................... )';

  doc.text(ketuaName, 25, signY + 28);
  doc.text(bendaharaName, 140, signY + 28);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text(`NAP: ${settings.ketuaNap || '-'}`, 25, signY + 32);
  doc.text(`NAP: ${settings.bendaharaNap || '-'}`, 140, signY + 32);

  doc.save(`Laporan_Anggaran_Tahunan_Patelki_${year}.pdf`);
};


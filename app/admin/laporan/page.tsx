
"use client";

import { useCallback, useEffect, useState } from "react";
import AdminSidebar from "../AdminSidebar";
import "../admin.css"
import "./unduh-laporan.css";

type Dokumen = {
  id: number;
  user_id: number;
  nama_calon_siswa: string | null;
  jenis_berkas: string;
  nama_file: string | null;
  status_verifikasi: string;
  catatan_admin: string | null;
  tanggal_upload: string | null;
  tanggal_verifikasi: string | null;
};

type Summary = {
  total: number;
  terverifikasi: number;
  belum_verifikasi: number;
  perlu_revisi: number;
};

const initialSummary: Summary = {
  total: 0,
  terverifikasi: 0,
  belum_verifikasi: 0,
  perlu_revisi: 0,
};

function csvCell(value: unknown) {
  const text = String(value ?? "");
  return `"${text.replace(/"/g, '""')}"`;
}

function formatTanggal(value: string | null) {
  if (!value) return "-";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";

  return date.toLocaleDateString("id-ID");
}

export default function UnduhLaporanPage() {
  const [data, setData] = useState<Dokumen[]>([]);
  const [summary, setSummary] = useState<Summary>(initialSummary);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/admin/laporan-dokumen", {
        cache: "no-store",
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Gagal mengambil data.");
      }

      setData(result.data || []);
      setSummary(result.summary || initialSummary);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Terjadi kesalahan."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  function downloadCSV() {
    const headers = [
      "ID Dokumen",
      "ID User",
      "Nama Calon Siswa",
      "Jenis Berkas",
      "Nama File",
      "Tanggal Upload",
      "Status Verifikasi",
      "Catatan Admin",
      "Tanggal Verifikasi",
    ];

    const rows = data.map((item) => [
      item.id,
      item.user_id,
      item.nama_calon_siswa || "",
      item.jenis_berkas,
      item.nama_file || "",
      formatTanggal(item.tanggal_upload),
      item.status_verifikasi,
      item.catatan_admin || "",
      formatTanggal(item.tanggal_verifikasi),
    ]);

    const csv = [
      headers,
      ...rows,
    ]
      .map((row) => row.map(csvCell).join(";"))
      .join("\r\n");

    // BOM membantu Excel mengenali karakter Bahasa Indonesia.
    const blob = new Blob(["\uFEFF", csv], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "laporan-dokumen-spmb.csv";
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="unduh-layout">
      <AdminSidebar />

      <main className="unduh-content">
        <header className="unduh-header">
          <div>
            <p className="unduh-eyebrow">LAPORAN DOKUMEN</p>
            <h1>Unduh Laporan</h1>
            <p>Ringkasan dan ekspor data berkas calon siswa.</p>
          </div>

          <button
            className="unduh-refresh"
            onClick={() => void loadData()}
            disabled={loading}
          >
            ↻ Refresh
          </button>
        </header>

        {error && <div className="unduh-error">{error}</div>}

        <section className="unduh-summary">
          <article className="unduh-card">
            <span>Total Dokumen</span>
            <strong>{summary.total}</strong>
            <small>Semua berkas tercatat</small>
          </article>

          <article className="unduh-card">
            <span>Terverifikasi</span>
            <strong>{summary.terverifikasi}</strong>
            <small>Sudah diperiksa admin</small>
          </article>

          <article className="unduh-card">
            <span>Belum Diverifikasi</span>
            <strong>{summary.belum_verifikasi}</strong>
            <small>Menunggu pemeriksaan</small>
          </article>

          <article className="unduh-card">
            <span>Perlu Revisi</span>
            <strong>{summary.perlu_revisi}</strong>
            <small>Perlu perbaikan berkas</small>
          </article>
        </section>

        <section className="unduh-panel">
          <div className="unduh-icon">↓</div>
          <div className="unduh-panel-copy">
            <h2>Laporan Data Dokumen</h2>
            <p>
              Unduh seluruh data dokumen yang tercatat di database,
              termasuk status verifikasi dan catatan admin.
            </p>
            <p className="unduh-count">
              {loading
                ? "Sedang memuat data..."
                : `${data.length} dokumen tersedia untuk diekspor`}
            </p>
          </div>

          <button
            className="unduh-button"
            onClick={downloadCSV}
            disabled={loading || Boolean(error)}
          >
            Unduh CSV
          </button>
        </section>

        <p className="unduh-note">
          File CSV dapat dibuka dengan Microsoft Excel. Jika belum ada
          berkas yang diunggah, file laporan tetap dapat diunduh dengan
          judul kolom dan tanpa baris data.
        </p>
      </main>
    </div>
  );
}

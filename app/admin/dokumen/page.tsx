
"use client";

import { useCallback, useEffect, useState } from "react";
import AdminSidebar from "../AdminSidebar";
import "../admin.css";
import "./data-dokumen.css";

type Dokumen = {
  id: number;
  user_id: number;
  nama_calon_siswa: string | null;
  jenis_berkas: string;
  nama_file: string | null;
  path_file: string | null;
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

const emptySummary: Summary = {
  total: 0,
  terverifikasi: 0,
  belum_verifikasi: 0,
  perlu_revisi: 0,
};

function formatTanggal(value: string | null) {
  if (!value) return "-";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";

  return date.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default function DataDokumenPage() {
  const [data, setData] = useState<Dokumen[]>([]);
  const [summary, setSummary] = useState<Summary>(emptySummary);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("Semua");
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
      setSummary(result.summary || emptySummary);
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

  const filteredData = data.filter((item) => {
    const keyword = search.toLowerCase();

    const cocokSearch = [
      item.nama_calon_siswa,
      item.jenis_berkas,
      item.nama_file,
    ].some((value) => (value || "").toLowerCase().includes(keyword));

    const cocokStatus =
      filter === "Semua" || item.status_verifikasi === filter;

    return cocokSearch && cocokStatus;
  });

  return (
    <div className="dokumen-layout">
      <AdminSidebar />

      <main className="dokumen-content">
        <header className="dokumen-header">
          <div>
            <p className="dokumen-eyebrow">LAPORAN DOKUMEN</p>
            <h1>Data Dokumen</h1>
            <p>Kelola dan pantau berkas calon siswa.</p>
          </div>

          <button
            className="dokumen-refresh"
            onClick={() => void loadData()}
            disabled={loading}
          >
            {loading ? "Memuat..." : "↻ Refresh"}
          </button>
        </header>

        <section className="dokumen-stats">
          <article className="dokumen-stat">
            <span>Total Dokumen</span>
            <strong>{summary.total}</strong>
          </article>
          <article className="dokumen-stat">
            <span>Terverifikasi</span>
            <strong>{summary.terverifikasi}</strong>
          </article>
          <article className="dokumen-stat">
            <span>Belum Diverifikasi</span>
            <strong>{summary.belum_verifikasi}</strong>
          </article>
          <article className="dokumen-stat">
            <span>Perlu Revisi</span>
            <strong>{summary.perlu_revisi}</strong>
          </article>
        </section>

        <section className="dokumen-panel">
          <div className="dokumen-panel-heading">
            <div>
              <h2>Daftar Berkas</h2>
              <p>Data diambil langsung dari database SPMB.</p>
            </div>
          </div>

          <div className="dokumen-toolbar">
            <input
              type="search"
              placeholder="Cari nama, jenis, atau nama file..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              aria-label="Cari dokumen"
            />

            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              aria-label="Filter status dokumen"
            >
              <option>Semua</option>
              <option>Belum Diverifikasi</option>
              <option>Terverifikasi</option>
              <option>Perlu Revisi</option>
            </select>
          </div>

          {error && <div className="dokumen-error">{error}</div>}

          <div className="dokumen-table-wrap">
            <table className="dokumen-table">
              <thead>
                <tr>
                  <th>No.</th>
                  <th>Calon Siswa</th>
                  <th>Jenis Berkas</th>
                  <th>Nama File</th>
                  <th>Tanggal Upload</th>
                  <th>Status</th>
                  <th>Catatan Admin</th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={7} className="dokumen-empty">
                      Memuat data dokumen...
                    </td>
                  </tr>
                ) : filteredData.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="dokumen-empty">
                      {data.length === 0
                        ? "Belum ada dokumen. Data akan muncul setelah calon siswa mengunggah berkas."
                        : "Tidak ada dokumen yang sesuai dengan pencarian."}
                    </td>
                  </tr>
                ) : (
                  filteredData.map((item, index) => (
                    <tr key={item.id}>
                      <td>{index + 1}</td>
                      <td>
                        <strong>
                          {item.nama_calon_siswa || `User #${item.user_id}`}
                        </strong>
                      </td>
                      <td>{item.jenis_berkas}</td>
                      <td>{item.nama_file || "-"}</td>
                      <td>{formatTanggal(item.tanggal_upload)}</td>
                      <td>
                        <span
                          className={`dokumen-status ${
                            item.status_verifikasi === "Terverifikasi"
                              ? "status-verified"
                              : item.status_verifikasi === "Perlu Revisi"
                                ? "status-revisi"
                                : "status-pending"
                          }`}
                        >
                          {item.status_verifikasi}
                        </span>
                      </td>
                      <td>{item.catatan_admin || "-"}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <p className="dokumen-footnote">
            Menampilkan {filteredData.length} dari {data.length} dokumen.
          </p>
        </section>
      </main>
    </div>
  );
}

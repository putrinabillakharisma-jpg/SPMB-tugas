
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import AdminSidebar from "../../AdminSidebar";
import "../../admin.css";
import "../../tpa.css";

type HasilTPA = {
  id: number;
  nama: string;
  nisn: string;
  tes: string;
  tanggal: string | null;
  nilai: number | string | null;
  status: string;
};

export default function HasilTesTPAPage() {
  const [hasil, setHasil] = useState<HasilTPA[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [pencarian, setPencarian] = useState("");
  const [filterStatus, setFilterStatus] = useState("Semua");

  async function muatHasil() {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/admin/tes-tpa/hasil", {
        method: "GET",
        cache: "no-store",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Gagal mengambil data hasil tes TPA."
        );
      }

      const daftar: HasilTPA[] = Array.isArray(data)
        ? data
        : Array.isArray(data.data)
          ? data.data
          : [];

      setHasil(daftar);
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : "Terjadi kesalahan saat mengambil data."
      );
      setHasil([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void muatHasil();
  }, []);

  const hasilFilter = hasil.filter((item) => {
    const kata = pencarian.toLowerCase().trim();

    const cocokPencarian =
      String(item.nama ?? "").toLowerCase().includes(kata) ||
      String(item.nisn ?? "").toLowerCase().includes(kata) ||
      String(item.tes ?? "").toLowerCase().includes(kata);

    const cocokStatus =
      filterStatus === "Semua" || item.status === filterStatus;

    return cocokPencarian && cocokStatus;
  });

  const totalSelesai = hasil.filter(
    (item) => item.status === "Selesai"
  ).length;

  const totalSedang = hasil.filter(
    (item) => item.status === "Sedang Mengerjakan"
  ).length;

  const totalBelum = hasil.filter(
    (item) => item.status === "Belum Mengerjakan"
  ).length;

  function formatTanggal(tanggal: string | null) {
    if (!tanggal) return "-";

    const date = new Date(tanggal);

    if (Number.isNaN(date.getTime())) return tanggal;

    return date.toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  }

  function formatNilai(nilai: HasilTPA["nilai"]) {
    if (nilai === null || nilai === undefined || nilai === "") {
      return "-";
    }

    const angka = Number(nilai);

    return Number.isFinite(angka)
      ? angka.toLocaleString("id-ID", {
          maximumFractionDigits: 2,
        })
      : "-";
  }

  function eksporCSV() {
    if (hasilFilter.length === 0) {
      window.alert("Tidak ada data hasil tes untuk diekspor.");
      return;
    }

    const kolom = [
      "Nama Calon Siswa",
      "NISN",
      "Nama Tes",
      "Tanggal",
      "Nilai",
      "Status",
    ];

    const baris = hasilFilter.map((item) => [
      item.nama,
      item.nisn,
      item.tes,
      formatTanggal(item.tanggal),
      formatNilai(item.nilai),
      item.status,
    ]);

    const csv = [kolom, ...baris]
      .map((row) =>
        row
          .map((value) => {
            const text = String(value ?? "");
            return '"' + text.replace(/"/g, '""') + '"';
          })
          .join(";")
      )
      .join("\r\n");

    const blob = new Blob(["\uFEFF" + csv], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "hasil-tes-tpa.csv";
    document.body.appendChild(link);
    link.click();
    link.remove();

    URL.revokeObjectURL(url);
  }

  return (
    <div className="tpa-layout">
      <AdminSidebar />

      <main className="tpa-main">
        <header className="tpa-header">
          <div>
            <h1>Hasil Tes TPA</h1>
            <p>
              Lihat dan pantau hasil Tes Potensi Akademik calon siswa.
            </p>
          </div>

          <div className="tpa-header-actions">
            <button
              type="button"
              className="tpa-btn tpa-btn-secondary"
              onClick={() => void muatHasil()}
              disabled={loading}
            >
              {loading ? "Memuat..." : "↻ Refresh"}
            </button>

            <button
              type="button"
              className="tpa-btn tpa-btn-primary"
              onClick={eksporCSV}
              disabled={loading}
            >
              ↓ Ekspor CSV
            </button>
          </div>
        </header>

        {error && (
          <div className="tpa-alert tpa-alert-error" role="alert">
            <span>{error}</span>
            <button
              type="button"
              onClick={() => void muatHasil()}
            >
              Coba lagi
            </button>
          </div>
        )}

        <section className="tpa-stats">
          <article className="tpa-stat-card">
            <div className="tpa-stat-icon blue">📋</div>
            <div>
              <p>Total Peserta Tes</p>
              <h2>{hasil.length}</h2>
            </div>
          </article>

          <article className="tpa-stat-card">
            <div className="tpa-stat-icon green">✓</div>
            <div>
              <p>Selesai Mengerjakan</p>
              <h2>{totalSelesai}</h2>
            </div>
          </article>

          <article className="tpa-stat-card">
            <div className="tpa-stat-icon purple">◷</div>
            <div>
              <p>Sedang Mengerjakan</p>
              <h2>{totalSedang}</h2>
            </div>
          </article>

          <article className="tpa-stat-card">
            <div className="tpa-stat-icon orange">○</div>
            <div>
              <p>Belum Mengerjakan</p>
              <h2>{totalBelum}</h2>
            </div>
          </article>
        </section>

        <section className="tpa-content-card">
          <div className="tpa-content-heading">
            <div>
              <h2>Data Hasil Tes</h2>
              <p>Data hasil tes yang tersimpan di database.</p>
            </div>
          </div>

          <div className="tpa-toolbar">
            <div className="tpa-search">
              <span>⌕</span>
              <input
                type="search"
                placeholder="Cari nama, NISN, atau nama tes..."
                value={pencarian}
                onChange={(event) => setPencarian(event.target.value)}
              />
            </div>

            <select
              className="tpa-filter-select"
              value={filterStatus}
              onChange={(event) => setFilterStatus(event.target.value)}
              aria-label="Filter status hasil tes"
            >
              <option value="Semua">Semua Status</option>
              <option value="Belum Mengerjakan">
                Belum Mengerjakan
              </option>
              <option value="Sedang Mengerjakan">
                Sedang Mengerjakan
              </option>
              <option value="Selesai">Selesai</option>
            </select>
          </div>

          <div className="tpa-table-wrapper">
            <table className="tpa-table">
              <thead>
                <tr>
                  <th>No.</th>
                  <th>Nama Calon Siswa</th>
                  <th>NISN</th>
                  <th>Nama Tes</th>
                  <th>Tanggal</th>
                  <th>Nilai</th>
                  <th>Status</th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={7} className="tpa-empty">
                      Memuat data hasil tes...
                    </td>
                  </tr>
                ) : hasilFilter.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="tpa-empty">
                      {error
                        ? "Data belum dapat ditampilkan."
                        : "Data hasil tes tidak ditemukan."}
                    </td>
                  </tr>
                ) : (
                  hasilFilter.map((item, index) => (
                    <tr key={item.id}>
                      <td>{index + 1}</td>
                      <td>
                        <strong>{item.nama || "-"}</strong>
                      </td>
                      <td>{item.nisn || "-"}</td>
                      <td>{item.tes || "-"}</td>
                      <td>{formatTanggal(item.tanggal)}</td>
                      <td>
                        <strong>{formatNilai(item.nilai)}</strong>
                      </td>
                      <td>
                        <span
                          className={
                            "tpa-status " +
                            (item.status === "Selesai"
                              ? "status-selesai"
                              : item.status === "Sedang Mengerjakan"
                                ? "status-aktif"
                                : "status-draft")
                          }
                        >
                          {item.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="tpa-table-footer">
            Menampilkan {loading ? 0 : hasilFilter.length} dari{" "}
            {hasil.length} data
          </div>
        </section>
      </main>
    </div>
  );
}

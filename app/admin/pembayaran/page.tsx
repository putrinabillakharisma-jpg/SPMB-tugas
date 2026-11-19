
"use client";

import { useCallback, useEffect, useState } from "react";
import AdminSidebar from "../AdminSidebar";
import "../admin.css"
import "./pembayaran.css";

type Pembayaran = {
  id: number;
  calon_siswa_id: number;
  nama: string;
  nisn: string;
  nominal: number;
  tanggal_bayar: string;
  metode_pembayaran: string;
  bukti_pembayaran: string;
  status: "Menunggu Verifikasi" | "Diterima" | "Ditolak";
  catatan_admin: string | null;
  tanggal_verifikasi: string | null;
};

export default function PembayaranPage() {
  const [data, setData] = useState<Pembayaran[]>([]);
  const [loading, setLoading] = useState(true);
  const [pesan, setPesan] = useState("");
  const [catatan, setCatatan] = useState("");
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [filter, setFilter] = useState("Semua");
  const [saving, setSaving] = useState(false);

  const ambilData = useCallback(async () => {
    try {
      setLoading(true);

      const response = await fetch("/api/admin/pembayaran", {
        cache: "no-store",
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Gagal mengambil data.");
      }

      setData(result.data || []);
    } catch (error) {
      setPesan(
        error instanceof Error
          ? error.message
          : "Terjadi kesalahan."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    ambilData();
  }, [ambilData]);

  async function ubahStatus(
    id: number,
    status: "Diterima" | "Ditolak"
  ) {
    const konfirmasi = window.confirm(
      `Apakah kamu yakin ingin ${status.toLowerCase()} pembayaran ini?`
    );

    if (!konfirmasi) return;

    try {
      setSaving(true);
      setPesan("");

      const response = await fetch("/api/admin/pembayaran", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id,
          status,
          catatan_admin: catatan,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Gagal memperbarui status.");
      }

      setPesan(result.message);
      setSelectedId(null);
      setCatatan("");

      await ambilData();
    } catch (error) {
      setPesan(
        error instanceof Error
          ? error.message
          : "Terjadi kesalahan."
      );
    } finally {
      setSaving(false);
    }
  }

  function formatRupiah(nominal: number) {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(Number(nominal));
  }

  function formatTanggal(tanggal: string) {
    if (!tanggal) return "-";

    return new Date(tanggal).toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  }

  function linkBukti(path: string) {
    if (!path) return "#";
    if (path.startsWith("http://") || path.startsWith("https://")) {
      return path;
    }

    return path.startsWith("/") ? path : `/${path}`;
  }

  const menunggu = data.filter(
    (item) => item.status === "Menunggu Verifikasi"
  ).length;

  const diterima = data.filter(
    (item) => item.status === "Diterima"
  ).length;

  const ditolak = data.filter(
    (item) => item.status === "Ditolak"
  ).length;

  const dataFilter = data.filter((item) => {
    if (filter === "Semua") return true;
    return item.status === filter;
  });

  return (
    <div className="pembayaran-layout">
      <AdminSidebar />

      <main className="pembayaran-main">
        <header className="pembayaran-header">
          <div>
            <p className="pembayaran-breadcrumb">
              Dashboard / Pembayaran
            </p>
            <h1>Verifikasi Pembayaran</h1>
            <p>
              Kelola dan verifikasi pembayaran calon siswa baru.
            </p>
          </div>

          <button
            className="pembayaran-refresh"
            onClick={ambilData}
            disabled={loading}
          >
            ↻ Perbarui Data
          </button>
        </header>

        {pesan && (
          <div className="pembayaran-message">
            {pesan}
            <button onClick={() => setPesan("")}>×</button>
          </div>
        )}

        <section className="pembayaran-stats">
          <div className="pembayaran-stat">
            <span className="stat-icon purple">▤</span>
            <div>
              <p>Total Pembayaran</p>
              <h2>{data.length}</h2>
            </div>
          </div>

          <div className="pembayaran-stat">
            <span className="stat-icon orange">◷</span>
            <div>
              <p>Menunggu Verifikasi</p>
              <h2>{menunggu}</h2>
            </div>
          </div>

          <div className="pembayaran-stat">
            <span className="stat-icon green">✓</span>
            <div>
              <p>Pembayaran Diterima</p>
              <h2>{diterima}</h2>
            </div>
          </div>

          <div className="pembayaran-stat">
            <span className="stat-icon red">×</span>
            <div>
              <p>Pembayaran Ditolak</p>
              <h2>{ditolak}</h2>
            </div>
          </div>
        </section>

        <section className="pembayaran-card">
          <div className="pembayaran-card-header">
            <div>
              <h2>Data Pembayaran Calon Siswa</h2>
              <p>
                Periksa bukti pembayaran sebelum memberikan keputusan.
              </p>
            </div>

            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="pembayaran-filter"
            >
              <option value="Semua">Semua Status</option>
              <option value="Menunggu Verifikasi">
                Menunggu Verifikasi
              </option>
              <option value="Diterima">Diterima</option>
              <option value="Ditolak">Ditolak</option>
            </select>
          </div>

          <div className="pembayaran-table-wrapper">
            <table className="pembayaran-table">
              <thead>
                <tr>
                  <th>No.</th>
                  <th>Calon Siswa</th>
                  <th>Nominal</th>
                  <th>Tanggal Bayar</th>
                  <th>Metode</th>
                  <th>Bukti</th>
                  <th>Status</th>
                  <th>Aksi</th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={8} className="pembayaran-empty">
                      Memuat data pembayaran...
                    </td>
                  </tr>
                ) : dataFilter.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="pembayaran-empty">
                      Belum ada data pembayaran.
                    </td>
                  </tr>
                ) : (
                  dataFilter.map((item, index) => (
                    <tr key={item.id}>
                      <td>{index + 1}</td>

                      <td>
                        <div className="pembayaran-identitas">
                          <strong>{item.nama}</strong>
                          <span>NISN: {item.nisn}</span>
                        </div>
                      </td>

                      <td>{formatRupiah(item.nominal)}</td>
                      <td>{formatTanggal(item.tanggal_bayar)}</td>
                      <td>{item.metode_pembayaran}</td>

                      <td>
                        {item.bukti_pembayaran ? (
                          <a
                            href={linkBukti(item.bukti_pembayaran)}
                            target="_blank"
                            rel="noreferrer"
                            className="bukti-link"
                          >
                            Lihat Bukti
                          </a>
                        ) : (
                          "-"
                        )}
                      </td>

                      <td>
                        <span
                          className={`status-pembayaran ${
                            item.status === "Diterima"
                              ? "diterima"
                              : item.status === "Ditolak"
                              ? "ditolak"
                              : "menunggu"
                          }`}
                        >
                          {item.status}
                        </span>
                      </td>

                      <td>
                        {item.status === "Menunggu Verifikasi" ? (
                          <div className="pembayaran-actions">
                            <button
                              className="btn-terima"
                              onClick={() => {
                                setSelectedId(item.id);
                                setCatatan("");
                              }}
                            >
                              Periksa
                            </button>
                          </div>
                        ) : (
                          <span className="sudah-diverifikasi">
                            Selesai
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        {selectedId !== null && (
          <div className="pembayaran-modal-overlay">
            <div className="pembayaran-modal">
              <button
                className="modal-close"
                onClick={() => setSelectedId(null)}
              >
                ×
              </button>

              <h2>Verifikasi Pembayaran</h2>
              <p>
                Tambahkan catatan admin jika diperlukan, kemudian pilih
                keputusan pembayaran.
              </p>

              <label htmlFor="catatan-admin">
                Catatan Admin
              </label>

              <textarea
                id="catatan-admin"
                value={catatan}
                onChange={(e) => setCatatan(e.target.value)}
                placeholder="Contoh: Bukti pembayaran sudah sesuai."
                rows={4}
              />

              <div className="modal-actions">
                <button
                  className="btn-tolak"
                  onClick={() => ubahStatus(selectedId, "Ditolak")}
                  disabled={saving}
                >
                  Tolak Pembayaran
                </button>

                <button
                  className="btn-terima"
                  onClick={() => ubahStatus(selectedId, "Diterima")}
                  disabled={saving}
                >
                  {saving ? "Menyimpan..." : "Terima Pembayaran"}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

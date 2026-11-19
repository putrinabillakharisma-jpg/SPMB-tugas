
"use client";

import { useCallback, useEffect, useState } from "react";
import AdminSidebar from "../AdminSidebar";
import "../admin.css";
import "./verifikasi-berkas.css";

type StatusBerkas =
  | "Belum Diverifikasi"
  | "Terverifikasi"
  | "Perlu Revisi";

type Berkas = {
  id: number;
  user_id: number;
  nama: string | null;
  nisn: string | null;
  jenis_berkas: string;
  nama_file: string;
  path_file: string;
  status_verifikasi: StatusBerkas;
  catatan_admin: string | null;
  tanggal_upload: string | null;
  tanggal_verifikasi: string | null;
};

type DraftBerkas = {
  status: StatusBerkas;
  catatan: string;
};

const statusOptions: StatusBerkas[] = [
  "Belum Diverifikasi",
  "Terverifikasi",
  "Perlu Revisi",
];

export default function VerifikasiBerkasPage() {
  const [data, setData] = useState<Berkas[]>([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("Semua");

  const [drafts, setDrafts] = useState<
    Record<number, DraftBerkas>
  >({});

  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<number | null>(null);

  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  // Mengambil data berkas dari database
  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const params = new URLSearchParams();

      if (search.trim()) {
        params.set("cari", search.trim());
      }

      if (filter !== "Semua") {
        params.set("status", filter);
      }

      const response = await fetch(
        `/api/admin/seleksi/berkas?${params.toString()}`,
        {
          method: "GET",
          cache: "no-store",
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.message || "Gagal mengambil data berkas."
        );
      }

      const rows: Berkas[] = result.data || [];

      setData(rows);

      // Sinkronkan draft dengan data terbaru dari database.
      setDrafts(
        Object.fromEntries(
          rows.map((item) => [
            item.id,
            {
              status: item.status_verifikasi,
              catatan: item.catatan_admin || "",
            },
          ])
        )
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Terjadi kesalahan."
      );
    } finally {
      setLoading(false);
    }
  }, [search, filter]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  // Mengubah draft keputusan admin
  function updateDraft(
    id: number,
    field: "status" | "catatan",
    value: string
  ) {
    setDrafts((previous) => {
      const current = previous[id];

      return {
        ...previous,
        [id]: {
          status:
            field === "status"
              ? (value as StatusBerkas)
              : current?.status || "Belum Diverifikasi",

          catatan:
            field === "catatan"
              ? value
              : current?.catatan || "",
        },
      };
    });
  }

  // Menyimpan keputusan verifikasi
  async function saveVerification(id: number) {
    const draft = drafts[id];

    if (!draft) return;

    if (
      draft.status === "Perlu Revisi" &&
      !draft.catatan.trim()
    ) {
      setError(
        "Isi catatan admin sebelum meminta revisi."
      );
      setNotice("");
      return;
    }

    setSavingId(id);
    setError("");
    setNotice("");

    try {
      const response = await fetch(
        "/api/admin/seleksi/berkas",
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            id,
            status_verifikasi: draft.status,
            catatan_admin: draft.catatan,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.message || "Gagal menyimpan perubahan."
        );
      }

      setNotice(
        result.message ||
          "Verifikasi berkas berhasil disimpan."
      );

      await loadData();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Terjadi kesalahan."
      );
    } finally {
      setSavingId(null);
    }
  }

  // Statistik berdasarkan data yang sedang ditampilkan
  const total = data.length;

  const terverifikasi = data.filter(
    (item) =>
      item.status_verifikasi === "Terverifikasi"
  ).length;

  const revisi = data.filter(
    (item) =>
      item.status_verifikasi === "Perlu Revisi"
  ).length;

  const belum = data.filter(
    (item) =>
      item.status_verifikasi === "Belum Diverifikasi"
  ).length;

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

  return (
    <div className="seleksi-layout">
      <AdminSidebar />

      <main className="verifikasi-content">
        {/* HEADER */}
        <header className="verifikasi-header">
          <div>
            <span className="verifikasi-eyebrow">
              ADMIN / SELEKSI CALON SISWA
            </span>

            <h1>Verifikasi Berkas</h1>

            <p>
              Periksa dokumen pendaftaran dan perbarui
              status verifikasi calon siswa.
            </p>
          </div>

          <button
            type="button"
            className="verifikasi-refresh"
            onClick={() => void loadData()}
            disabled={loading}
          >
            ↻ {loading ? "Memuat..." : "Muat Ulang"}
          </button>
        </header>

        {/* STATISTIK */}
        <section className="verifikasi-stats">
          <article className="verifikasi-stat">
            <div className="verifikasi-stat-icon blue">
              ▤
            </div>
            <span>Total dokumen</span>
            <strong>{total}</strong>
            <small>Dokumen ditampilkan</small>
          </article>

          <article className="verifikasi-stat">
            <div className="verifikasi-stat-icon orange">
              ◷
            </div>
            <span>Belum diverifikasi</span>
            <strong>{belum}</strong>
            <small>Menunggu pemeriksaan</small>
          </article>

          <article className="verifikasi-stat">
            <div className="verifikasi-stat-icon green">
              ✓
            </div>
            <span>Terverifikasi</span>
            <strong>{terverifikasi}</strong>
            <small>Dokumen disetujui</small>
          </article>

          <article className="verifikasi-stat">
            <div className="verifikasi-stat-icon red">
              !
            </div>
            <span>Perlu revisi</span>
            <strong>{revisi}</strong>
            <small>Perlu diperbaiki</small>
          </article>
        </section>

        {/* DATA BERKAS */}
        <section className="verifikasi-panel">
          <div className="verifikasi-panel-heading">
            <div>
              <h2>Data Berkas Calon Siswa</h2>
              <p>
                Periksa dokumen satu per satu sebelum
                memberikan keputusan.
              </p>
            </div>
          </div>

          {/* PENCARIAN DAN FILTER */}
          <div className="verifikasi-toolbar">
            <div className="verifikasi-search">
              <span>⌕</span>

              <input
                type="search"
                placeholder="Cari nama, NISN, atau jenis berkas..."
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
              />
            </div>

            <select
              value={filter}
              onChange={(event) =>
                setFilter(event.target.value)
              }
              aria-label="Filter status verifikasi"
            >
              <option value="Semua">Semua status</option>

              {statusOptions.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </div>

          {/* PESAN */}
          {error && (
            <div
              className="verifikasi-alert error"
              role="alert"
            >
              {error}
            </div>
          )}

          {notice && (
            <div
              className="verifikasi-alert success"
              role="status"
            >
              {notice}
            </div>
          )}

          {/* LOADING */}
          {loading ? (
            <div className="verifikasi-empty">
              <div className="verifikasi-loader" />
              <p>Memuat data berkas...</p>
            </div>
          ) : data.length === 0 ? (
            <div className="verifikasi-empty">
              <span className="verifikasi-empty-icon">
                ▤
              </span>

              <h3>Belum ada data berkas</h3>

              <p>
                Data akan muncul setelah calon siswa
                mengunggah dokumen ke sistem.
              </p>
            </div>
          ) : (
            <div className="verifikasi-table-wrap">
              <table className="verifikasi-table">
                <thead>
                  <tr>
                    <th>NO</th>
                    <th>CALON SISWA</th>
                    <th>JENIS BERKAS</th>
                    <th>DOKUMEN</th>
                    <th>TANGGAL UPLOAD</th>
                    <th>STATUS SAAT INI</th>
                    <th>KEPUTUSAN ADMIN</th>
                    <th>CATATAN ADMIN</th>
                    <th>AKSI</th>
                  </tr>
                </thead>

                <tbody>
                  {data.map((item, index) => {
                    const draft = drafts[item.id] || {
                      status: item.status_verifikasi,
                      catatan: item.catatan_admin || "",
                    };

                    return (
                      <tr key={item.id}>
                        <td>{index + 1}</td>

                        <td>
                          <strong>
                            {item.nama ||
                              "Data tidak ditemukan"}
                          </strong>

                          <small>
                            NISN: {item.nisn || "-"}
                          </small>
                        </td>

                        <td>
                          <span className="verifikasi-jenis">
                            {item.jenis_berkas}
                          </span>
                        </td>

                        <td>
                          {item.path_file ? (
                            <a
                              className="verifikasi-file-link"
                              href={item.path_file}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              ↗ {item.nama_file}
                            </a>
                          ) : (
                            <span className="verifikasi-no-file">
                              File tidak tersedia
                            </span>
                          )}
                        </td>

                        <td>
                          {formatTanggal(item.tanggal_upload)}
                        </td>

                        <td>
                          <span
                            className={`verifikasi-badge ${
                              item.status_verifikasi ===
                              "Terverifikasi"
                                ? "approved"
                                : item.status_verifikasi ===
                                    "Perlu Revisi"
                                  ? "revision"
                                  : "pending"
                            }`}
                          >
                            {item.status_verifikasi}
                          </span>
                        </td>

                        <td>
                          <select
                            className="verifikasi-select"
                            value={draft.status}
                            onChange={(event) =>
                              updateDraft(
                                item.id,
                                "status",
                                event.target.value
                              )
                            }
                            aria-label={`Keputusan untuk ${
                              item.nama || item.id
                            }`}
                          >
                            {statusOptions.map((status) => (
                              <option
                                key={status}
                                value={status}
                              >
                                {status}
                              </option>
                            ))}
                          </select>
                        </td>

                        <td>
                          <textarea
                            className="verifikasi-note"
                            rows={2}
                            placeholder="Catatan revisi (jika ada)"
                            value={draft.catatan}
                            onChange={(event) =>
                              updateDraft(
                                item.id,
                                "catatan",
                                event.target.value
                              )
                            }
                          />
                        </td>

                        <td>
                          <button
                            type="button"
                            className="verifikasi-save"
                            onClick={() =>
                              void saveVerification(item.id)
                            }
                            disabled={savingId === item.id}
                          >
                            {savingId === item.id
                              ? "Menyimpan..."
                              : "Simpan"}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* INFORMASI */}
          {!loading && data.length > 0 && (
            <div className="verifikasi-footer">
              Menampilkan {total} dokumen berdasarkan
              pencarian dan filter yang dipilih.
            </div>
          )}
        </section>
      </main>
    </div>
  );
}


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
    Record<number, { status: StatusBerkas; catatan: string }>
  >({});
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const params = new URLSearchParams();

      if (search.trim()) params.set("cari", search.trim());
      if (filter !== "Semua") params.set("status", filter);

      const response = await fetch(
        `/api/admin/seleksi/berkas?${params.toString()}`,
        { cache: "no-store" }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Gagal mengambil data.");
      }

      setData(result.data || []);

      setDrafts((previous) => {
        const next = { ...previous };

        for (const item of result.data || []) {
          if (!next[item.id]) {
            next[item.id] = {
              status: item.status_verifikasi,
              catatan: item.catatan_admin || "",
            };
          }
        }

        return next;
      });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Terjadi kesalahan."
      );
    } finally {
      setLoading(false);
    }
  }, [search, filter]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  function updateDraft(
    id: number,
    field: "status" | "catatan",
    value: string
  ) {
    setDrafts((previous) => {
      const item = data.find((row) => row.id === id);

      return {
        ...previous,
        [id]: {
          status:
            field === "status"
              ? (value as StatusBerkas)
              : previous[id]?.status ||
                item?.status_verifikasi ||
                "Belum Diverifikasi",
          catatan:
            field === "catatan"
              ? value
              : previous[id]?.catatan || "",
        },
      };
    });
  }

  async function saveVerification(id: number) {
    const draft = drafts[id];
    if (!draft) return;

    if (
      draft.status === "Perlu Revisi" &&
      !draft.catatan.trim()
    ) {
      setError("Isi catatan admin sebelum meminta revisi.");
      return;
    }

    setSavingId(id);
    setError("");
    setNotice("");

    try {
      const response = await fetch("/api/admin/seleksi/berkas", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id,
          status_verifikasi: draft.status,
          catatan_admin: draft.catatan,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Gagal menyimpan perubahan.");
      }

      setNotice(result.message);
      await loadData();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Terjadi kesalahan."
      );
    } finally {
      setSavingId(null);
    }
  }

  const total = data.length;
  const terverifikasi = data.filter(
    (item) => item.status_verifikasi === "Terverifikasi"
  ).length;
  const revisi = data.filter(
    (item) => item.status_verifikasi === "Perlu Revisi"
  ).length;
  const belum = data.filter(
    (item) => item.status_verifikasi === "Belum Diverifikasi"
  ).length;

  return (
    <div className="seleksi-layout">
      <AdminSidebar />

      <main className="verifikasi-content">
        <header className="verifikasi-header">
          <div>
            <span className="verifikasi-eyebrow">
              ADMIN / SELEKSI CALON SISWA
            </span>
            <h1>Verifikasi Berkas</h1>
            <p>
              Periksa dokumen pendaftaran dan perbarui status
              verifikasi calon siswa.
            </p>
          </div>

          <button
            className="verifikasi-refresh"
            onClick={() => void loadData()}
            disabled={loading}
          >
            ↻ Muat Ulang
          </button>
        </header>

        <section className="verifikasi-stats">
          <article className="verifikasi-stat">
            <span>Total hasil pencarian</span>
            <strong>{total}</strong>
            <small>Dokumen ditampilkan</small>
          </article>

          <article className="verifikasi-stat">
            <span>Belum diverifikasi</span>
            <strong>{belum}</strong>
            <small>Menunggu pemeriksaan</small>
          </article>

          <article className="verifikasi-stat">
            <span>Terverifikasi</span>
            <strong>{terverifikasi}</strong>
            <small>Dokumen disetujui</small>
          </article>

          <article className="verifikasi-stat">
            <span>Perlu revisi</span>
            <strong>{revisi}</strong>
            <small>Perlu diperbaiki</small>
          </article>
        </section>

        <section className="verifikasi-panel">
          <div className="verifikasi-panel-heading">
            <div>
              <h2>Data Berkas Calon Siswa</h2>
              <p>Periksa dokumen satu per satu sebelum menyetujui.</p>
            </div>
          </div>

          <div className="verifikasi-toolbar">
            <input
              type="search"
              placeholder="Cari nama, NISN, atau jenis berkas..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />

            <select
              value={filter}
              onChange={(event) => setFilter(event.target.value)}
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

          {error && (
            <div className="verifikasi-alert error" role="alert">
              {error}
            </div>
          )}

          {notice && (
            <div className="verifikasi-alert success" role="status">
              {notice}
            </div>
          )}

          {loading ? (
            <div className="verifikasi-empty">Memuat data berkas...</div>
          ) : data.length === 0 ? (
            <div className="verifikasi-empty">
              <span className="verifikasi-empty-icon">▤</span>
              <h3>Belum ada data berkas</h3>
              <p>
                Data akan muncul setelah calon siswa mengunggah dokumen
                ke sistem.
              </p>
            </div>
          ) : (
            <div className="verifikasi-table-wrap">
              <table className="verifikasi-table">
                <thead>
                  <tr>
                    <th>Calon Siswa</th>
                    <th>Jenis Berkas</th>
                    <th>Dokumen</th>
                    <th>Status Saat Ini</th>
                    <th>Keputusan Admin</th>
                    <th>Catatan Admin</th>
                    <th>Aksi</th>
                  </tr>
                </thead>

                <tbody>
                  {data.map((item) => {
                    const draft = drafts[item.id] || {
                      status: item.status_verifikasi,
                      catatan: item.catatan_admin || "",
                    };

                    return (
                      <tr key={item.id}>
                        <td>
                          <strong>{item.nama || "Data tidak ditemukan"}</strong>
                          <small>NISN: {item.nisn || "-"}</small>
                        </td>

                        <td>{item.jenis_berkas}</td>

                        <td>
                          <a
                            className="verifikasi-file-link"
                            href={item.path_file}
                            target="_blank"
                            rel="noreferrer"
                          >
                            ↗ {item.nama_file}
                          </a>
                        </td>

                        <td>
                          <span
                            className={`verifikasi-badge ${
                              item.status_verifikasi === "Terverifikasi"
                                ? "approved"
                                : item.status_verifikasi === "Perlu Revisi"
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
                            aria-label={`Keputusan untuk ${item.nama || item.id}`}
                          >
                            {statusOptions.map((status) => (
                              <option key={status} value={status}>
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
                            className="verifikasi-save"
                            onClick={() => void saveVerification(item.id)}
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
        </section>
      </main>
    </div>
  );
}


"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import AdminSidebar from "../AdminSidebar";
import "../admin.css"
import "./hasil-seleksi.css";

type StatusSeleksi = "Menunggu Hasil" | "Lulus" | "Tidak Lulus";

type HasilSeleksi = {
  calon_siswa_id: number;
  nama: string;
  nisn: string;
  nilai_tpa: number | null;
  status_tpa: string | null;
  hasil_seleksi_id: number | null;
  status_seleksi: StatusSeleksi;
  catatan_admin: string | null;
  ditetapkan_at: string | null;
};

type Draft = {
  status: StatusSeleksi;
  catatan: string;
};

const statusOptions: StatusSeleksi[] = [
  "Menunggu Hasil",
  "Lulus",
  "Tidak Lulus",
];

export default function HasilSeleksiPage() {
  const [data, setData] = useState<HasilSeleksi[]>([]);
  const [drafts, setDrafts] = useState<Record<number, Draft>>({});
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("Semua");
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(
        "/api/admin/seleksi/hasil-seleksi",
        { cache: "no-store" }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Gagal mengambil data.");
      }

      const rows: HasilSeleksi[] = result.data || [];
      setData(rows);

      setDrafts((previous) => {
        const next: Record<number, Draft> = {};

        for (const row of rows) {
          next[row.calon_siswa_id] = previous[row.calon_siswa_id] || {
            status: row.status_seleksi,
            catatan: row.catatan_admin || "",
          };
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
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const filteredData = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    return data.filter((row) => {
      const matchesSearch =
        !keyword ||
        row.nama.toLowerCase().includes(keyword) ||
        row.nisn.includes(keyword);

      const matchesFilter =
        filter === "Semua" || row.status_seleksi === filter;

      return matchesSearch && matchesFilter;
    });
  }, [data, search, filter]);

  const totalLulus = data.filter(
    (row) => row.status_seleksi === "Lulus"
  ).length;

  const totalTidakLulus = data.filter(
    (row) => row.status_seleksi === "Tidak Lulus"
  ).length;

  const totalMenunggu = data.filter(
    (row) => row.status_seleksi === "Menunggu Hasil"
  ).length;

  function updateDraft(
    id: number,
    field: "status" | "catatan",
    value: string
  ) {
    setDrafts((previous) => ({
      ...previous,
      [id]: {
        status:
          field === "status"
            ? (value as StatusSeleksi)
            : previous[id]?.status || "Menunggu Hasil",
        catatan:
          field === "catatan"
            ? value
            : previous[id]?.catatan || "",
      },
    }));
  }

  async function saveResult(id: number) {
    const draft = drafts[id];

    if (!draft) return;

    const student = data.find((row) => row.calon_siswa_id === id);

    if (!student) return;

    if (
      draft.status !== "Menunggu Hasil" &&
      student.status_tpa !== "Selesai"
    ) {
      setError(
        `Hasil TPA ${student.nama} belum berstatus Selesai. Keputusan akhir belum dapat ditetapkan.`
      );
      setNotice("");
      return;
    }

    setSavingId(id);
    setError("");
    setNotice("");

    try {
      const response = await fetch(
        "/api/admin/seleksi/hasil-seleksi",
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            calon_siswa_id: id,
            status_seleksi: draft.status,
            catatan_admin: draft.catatan,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Gagal menyimpan hasil.");
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

  return (
    <div className="seleksi-layout">
      <AdminSidebar />

      <main className="hasil-seleksi-content">
        <header className="hasil-seleksi-header">
          <div>
            <span className="hasil-seleksi-eyebrow">
              ADMIN / SELEKSI CALON SISWA
            </span>
            <h1>Hasil Seleksi</h1>
            <p>
              Pantau nilai TPA dan tetapkan keputusan penerimaan
              calon siswa SMK Citra Negara.
            </p>
          </div>

          <button
            className="hasil-refresh"
            onClick={() => void loadData()}
            disabled={loading}
          >
            ↻ Muat Ulang
          </button>
        </header>

        <section className="hasil-stats">
          <article className="hasil-stat">
            <span>Total Calon Siswa</span>
            <strong>{data.length}</strong>
            <small>Terdaftar di sistem</small>
          </article>

          <article className="hasil-stat">
            <span>Lulus</span>
            <strong>{totalLulus}</strong>
            <small>Keputusan ditetapkan</small>
          </article>

          <article className="hasil-stat">
            <span>Tidak Lulus</span>
            <strong>{totalTidakLulus}</strong>
            <small>Keputusan ditetapkan</small>
          </article>

          <article className="hasil-stat">
            <span>Menunggu Hasil</span>
            <strong>{totalMenunggu}</strong>
            <small>Belum ada keputusan akhir</small>
          </article>
        </section>

        <section className="hasil-panel">
          <div className="hasil-panel-heading">
            <div>
              <h2>Daftar Hasil Seleksi</h2>
              <p>
                Nilai TPA ditampilkan sebagai bahan pertimbangan
                admin, bukan keputusan otomatis.
              </p>
            </div>
          </div>

          <div className="hasil-toolbar">
            <input
              type="search"
              placeholder="Cari nama atau NISN..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />

            <select
              value={filter}
              onChange={(event) => setFilter(event.target.value)}
              aria-label="Filter hasil seleksi"
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
            <div className="hasil-alert error" role="alert">
              {error}
            </div>
          )}

          {notice && (
            <div className="hasil-alert success" role="status">
              {notice}
            </div>
          )}

          {loading ? (
            <div className="hasil-empty">Memuat data seleksi...</div>
          ) : filteredData.length === 0 ? (
            <div className="hasil-empty">
              <span className="hasil-empty-icon">▤</span>
              <h3>Data tidak ditemukan</h3>
              <p>
                Belum ada calon siswa yang cocok dengan pencarian
                atau filter ini.
              </p>
            </div>
          ) : (
            <div className="hasil-table-wrap">
              <table className="hasil-table">
                <thead>
                  <tr>
                    <th>Calon Siswa</th>
                    <th>Nilai TPA</th>
                    <th>Status TPA</th>
                    <th>Hasil Seleksi</th>
                    <th>Catatan Admin</th>
                    <th>Aksi</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredData.map((row) => {
                    const draft = drafts[row.calon_siswa_id] || {
                      status: row.status_seleksi,
                      catatan: row.catatan_admin || "",
                    };

                    return (
                      <tr key={row.calon_siswa_id}>
                        <td>
                          <strong>{row.nama}</strong>
                          <small>NISN: {row.nisn}</small>
                        </td>

                        <td>
                          <strong className="hasil-nilai">
                            {row.nilai_tpa == null
                              ? "—"
                              : Number(row.nilai_tpa).toLocaleString(
                                  "id-ID"
                                )}
                          </strong>
                        </td>

                        <td>
                          <span
                            className={`hasil-badge ${
                              row.status_tpa === "Selesai"
                                ? "selesai"
                                : "belum"
                            }`}
                          >
                            {row.status_tpa || "Belum Mengerjakan"}
                          </span>
                        </td>

                        <td>
                          <select
                            className="hasil-select"
                            value={draft.status}
                            onChange={(event) =>
                              updateDraft(
                                row.calon_siswa_id,
                                "status",
                                event.target.value
                              )
                            }
                            aria-label={`Hasil seleksi ${row.nama}`}
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
                            className="hasil-catatan"
                            rows={2}
                            placeholder="Catatan (opsional)"
                            value={draft.catatan}
                            onChange={(event) =>
                              updateDraft(
                                row.calon_siswa_id,
                                "catatan",
                                event.target.value
                              )
                            }
                          />
                        </td>

                        <td>
                          <button
                            className="hasil-save"
                            onClick={() =>
                              void saveResult(row.calon_siswa_id)
                            }
                            disabled={
                              savingId === row.calon_siswa_id
                            }
                          >
                            {savingId === row.calon_siswa_id
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

          <footer className="hasil-footer">
            Menampilkan {filteredData.length} dari {data.length} calon siswa
          </footer>
        </section>
      </main>
    </div>
  );
}

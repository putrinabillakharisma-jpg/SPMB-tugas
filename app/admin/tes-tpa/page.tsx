
"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import Link from "next/link";
import AdminSidebar from "../AdminSidebar";
import "../admin.css";
import "../tpa.css";

type StatusTes = "Draft" | "Aktif" | "Selesai";

type TesTPA = {
  id: number;
  nama: string;
  deskripsi: string;
  durasi: number;
  jumlahSoal: number;
  jadwal: string;
  status: StatusTes;
};

const STATUS_TES: StatusTes[] = ["Draft", "Aktif", "Selesai"];

function formatJadwal(value: string) {
  if (!value) return "Belum dijadwalkan";

  const tanggal = new Date(value);

  if (Number.isNaN(tanggal.getTime())) return value;

  return tanggal.toLocaleString("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export default function KelolaTesTPAPage() {
  const [tes, setTes] = useState<TesTPA[]>([]);
  const [loading, setLoading] = useState(true);
  const [sedangSimpan, setSedangSimpan] = useState(false);

  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("Semua Status");

  const [modal, setModal] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);

  const [pesan, setPesan] = useState("");
  const [error, setError] = useState("");

  const [nama, setNama] = useState("");
  const [deskripsi, setDeskripsi] = useState("");
  const [durasi, setDurasi] = useState("60");
  const [jumlahSoal, setJumlahSoal] = useState("50");
  const [jadwal, setJadwal] = useState("");
  const [status, setStatus] = useState<StatusTes>("Draft");

  // Mengambil data tes dari database melalui API
  async function muatTes() {
    try {
      setLoading(true);

      const response = await fetch("/api/admin/tes-tpa", {
        method: "GET",
        cache: "no-store",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Gagal mengambil data tes.");
      }

      setTes(Array.isArray(data.data) ? data.data : []);
    } catch (err) {
      setPesan(
        err instanceof Error
          ? err.message
          : "Terjadi kesalahan saat mengambil data tes."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void muatTes();
  }, []);

  const daftarTes = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    return tes.filter((item) => {
      const cocokNama =
        !keyword ||
        item.nama.toLowerCase().includes(keyword) ||
        item.deskripsi.toLowerCase().includes(keyword);

      const cocokStatus =
        filterStatus === "Semua Status" ||
        item.status === filterStatus;

      return cocokNama && cocokStatus;
    });
  }, [tes, search, filterStatus]);

  const jumlahAktif = tes.filter(
    (item) => item.status === "Aktif"
  ).length;

  const jumlahDraft = tes.filter(
    (item) => item.status === "Draft"
  ).length;

  const jumlahSelesai = tes.filter(
    (item) => item.status === "Selesai"
  ).length;

  function resetForm() {
    setEditId(null);
    setNama("");
    setDeskripsi("");
    setDurasi("60");
    setJumlahSoal("50");
    setJadwal("");
    setStatus("Draft");
    setError("");
  }

  function bukaTambah() {
    resetForm();
    setPesan("");
    setModal(true);
  }

  function bukaEdit(item: TesTPA) {
    setEditId(item.id);
    setNama(item.nama);
    setDeskripsi(item.deskripsi);
    setDurasi(String(item.durasi));
    setJumlahSoal(String(item.jumlahSoal));
    setJadwal(item.jadwal || "");
    setStatus(item.status);
    setError("");
    setPesan("");
    setModal(true);
  }

  // Menambahkan atau memperbarui data di database
  async function simpanTes(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setPesan("");

    if (!nama.trim()) {
      setError("Nama tes wajib diisi.");
      return;
    }

    if (
      !Number.isInteger(Number(durasi)) ||
      Number(durasi) < 1 ||
      !Number.isInteger(Number(jumlahSoal)) ||
      Number(jumlahSoal) < 1
    ) {
      setError("Durasi dan jumlah soal harus bilangan bulat lebih dari 0.");
      return;
    }

    if (!STATUS_TES.includes(status)) {
      setError("Pilih status tes yang valid.");
      return;
    }

    setSedangSimpan(true);

    try {
      const url =
        editId === null
          ? "/api/admin/tes-tpa"
          : `/api/admin/tes-tpa?id=${editId}`;

      const response = await fetch(url, {
        method: editId === null ? "POST" : "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          nama: nama.trim(),
          deskripsi: deskripsi.trim(),
          durasi: Number(durasi),
          jumlahSoal: Number(jumlahSoal),
          jadwal: jadwal || null,
          status,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Gagal menyimpan tes.");
      }

      setModal(false);
      resetForm();
      setPesan(data.message || "Data tes berhasil disimpan.");

      await muatTes();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Gagal menyimpan tes."
      );
    } finally {
      setSedangSimpan(false);
    }
  }

  // Menghapus data tes dari database
  async function hapusTes(item: TesTPA) {
    const yakin = window.confirm(
      `Hapus "${item.nama}" dari daftar tes? Data hasil peserta untuk tes ini juga dapat terhapus.`
    );

    if (!yakin) return;

    setPesan("");
    setError("");
    setSedangSimpan(true);

    try {
      const response = await fetch(
        `/api/admin/tes-tpa?id=${item.id}`,
        { method: "DELETE" }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Gagal menghapus tes.");
      }

      setPesan(data.message || "Tes berhasil dihapus.");
      await muatTes();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Gagal menghapus tes."
      );
    } finally {
      setSedangSimpan(false);
    }
  }

  // Mengubah status tes di database
  async function ubahStatus(item: TesTPA) {
    const statusBerikutnya: StatusTes =
      item.status === "Draft"
        ? "Aktif"
        : item.status === "Aktif"
          ? "Selesai"
          : "Draft";

    setPesan("");
    setError("");

    try {
      const response = await fetch(
        `/api/admin/tes-tpa?id=${item.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            statusOnly: true,
            status: statusBerikutnya,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Gagal mengubah status tes.");
      }

      setPesan(data.message || "Status tes berhasil diperbarui.");
      await muatTes();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Gagal mengubah status tes."
      );
    }
  }

  return (
    <div className="admin tpa-layout">
      <AdminSidebar />

      <main className="main tpa-main">
        <div className="tpa-breadcrumb">
          <Link href="/admin">Dashboard</Link>
          <span>›</span>
          <strong>Tes TPA</strong>
        </div>

        <header className="tpa-header">
          <div>
            <h1>Kelola Tes TPA</h1>
            <p>
              Buat dan kelola jadwal Tes Potensi Akademik calon siswa
              SMK Citra Negara.
            </p>
          </div>

          <button
            type="button"
            className="tpa-primary-btn"
            onClick={bukaTambah}
          >
            ＋ Tambah Tes TPA
          </button>
        </header>

        {pesan && (
          <div className="tpa-alert" role="status">
            {pesan}
          </div>
        )}

        {error && (
          <div className="tpa-alert tpa-alert-error" role="alert">
            {error}
          </div>
        )}

        <section className="tpa-stats">
          <article className="tpa-stat-card">
            <div className="tpa-stat-icon blue">▤</div>
            <div>
              <p>Total Tes</p>
              <h2>{tes.length}</h2>
              <span>Semua tes TPA</span>
            </div>
          </article>

          <article className="tpa-stat-card">
            <div className="tpa-stat-icon green">✓</div>
            <div>
              <p>Tes Aktif</p>
              <h2>{jumlahAktif}</h2>
              <span>Tes yang sedang dibuka</span>
            </div>
          </article>

          <article className="tpa-stat-card">
            <div className="tpa-stat-icon orange">◷</div>
            <div>
              <p>Draft</p>
              <h2>{jumlahDraft}</h2>
              <span>Belum siap dilaksanakan</span>
            </div>
          </article>

          <article className="tpa-stat-card">
            <div className="tpa-stat-icon purple">▣</div>
            <div>
              <p>Tes Selesai</p>
              <h2>{jumlahSelesai}</h2>
              <span>Pelaksanaan selesai</span>
            </div>
          </article>
        </section>

        <section className="tpa-panel">
          <div className="tpa-panel-heading">
            <div>
              <h2>Daftar Tes TPA</h2>
              <p>Atur tes dan jadwal pelaksanaan.</p>
            </div>

            <Link
              className="tpa-outline-btn"
              href="/admin/tes-tpa/hasil"
            >
              Lihat Hasil →
            </Link>
          </div>

          <div className="tpa-toolbar">
            <label className="tpa-search">
              <span>⌕</span>
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Cari nama tes..."
                aria-label="Cari nama tes"
              />
            </label>

            <select
              value={filterStatus}
              onChange={(event) => setFilterStatus(event.target.value)}
              aria-label="Filter status tes"
            >
              <option>Semua Status</option>
              <option>Draft</option>
              <option>Aktif</option>
              <option>Selesai</option>
            </select>
          </div>

          <div className="tpa-table-wrap">
            <table className="tpa-table">
              <thead>
                <tr>
                  <th>No</th>
                  <th>Nama Tes</th>
                  <th>Durasi</th>
                  <th>Jumlah Soal</th>
                  <th>Jadwal</th>
                  <th>Status</th>
                  <th>Aksi</th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={7} className="tpa-empty">
                      Memuat data tes...
                    </td>
                  </tr>
                ) : daftarTes.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="tpa-empty">
                      {tes.length === 0
                        ? "Belum ada data tes. Klik Tambah Tes TPA untuk membuat tes."
                        : "Tidak ada tes yang sesuai."}
                    </td>
                  </tr>
                ) : (
                  daftarTes.map((item, index) => (
                    <tr key={item.id}>
                      <td>{index + 1}</td>

                      <td>
                        <div className="tpa-test-name">
                          <span className="tpa-test-symbol">TPA</span>
                          <div>
                            <strong>{item.nama}</strong>
                            <small>
                              {item.deskripsi || "Tidak ada deskripsi"}
                            </small>
                          </div>
                        </div>
                      </td>

                      <td>{item.durasi} menit</td>
                      <td>{item.jumlahSoal} soal</td>
                      <td>{formatJadwal(item.jadwal)}</td>

                      <td>
                        <span
                          className={`tpa-status ${item.status.toLowerCase()}`}
                        >
                          {item.status}
                        </span>
                      </td>

                      <td>
                        <div className="tpa-actions">
                          {/* Tombol tambahan untuk mengelola soal */}
                          <Link
                            href={`/admin/tes-tpa/soal/${item.id}`}
                            className="tpa-soal-btn"
                            title={`Kelola soal ${item.nama}`}
                          >
                            Kelola Soal
                          </Link>

                          <button
                            type="button"
                            className="tpa-icon-btn edit"
                            title="Edit tes"
                            aria-label={`Edit ${item.nama}`}
                            disabled={sedangSimpan}
                            onClick={() => bukaEdit(item)}
                          >
                            ✎
                          </button>

                          <button
                            type="button"
                            className="tpa-icon-btn status"
                            title="Ubah status tes"
                            aria-label={`Ubah status ${item.nama}`}
                            disabled={sedangSimpan}
                            onClick={() => void ubahStatus(item)}
                          >
                            ↻
                          </button>

                          <button
                            type="button"
                            className="tpa-icon-btn delete"
                            title="Hapus tes"
                            aria-label={`Hapus ${item.nama}`}
                            disabled={sedangSimpan}
                            onClick={() => void hapusTes(item)}
                          >
                            ×
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <footer className="tpa-footer">
            Menampilkan {daftarTes.length} dari {tes.length} tes
          </footer>
        </section>

        {modal && (
          <div
            className="tpa-modal-overlay"
            onMouseDown={(event) => {
              if (
                event.target === event.currentTarget &&
                !sedangSimpan
              ) {
                setModal(false);
              }
            }}
          >
            <section
              className="tpa-modal"
              role="dialog"
              aria-modal="true"
              aria-labelledby="tpa-modal-title"
            >
              <div className="tpa-modal-heading">
                <div>
                  <p>ADMIN SPMB</p>
                  <h2 id="tpa-modal-title">
                    {editId === null ? "Tambah Tes TPA" : "Edit Tes TPA"}
                  </h2>
                </div>

                <button
                  type="button"
                  className="tpa-close"
                  onClick={() => setModal(false)}
                  aria-label="Tutup"
                  disabled={sedangSimpan}
                >
                  ×
                </button>
              </div>

              <form className="tpa-form" onSubmit={simpanTes}>
                <label>
                  Nama tes
                  <input
                    required
                    maxLength={150}
                    value={nama}
                    onChange={(event) => setNama(event.target.value)}
                    placeholder="Contoh: Tes TPA Gelombang 1"
                  />
                </label>

                <label>
                  Deskripsi
                  <textarea
                    value={deskripsi}
                    onChange={(event) => setDeskripsi(event.target.value)}
                    placeholder="Deskripsi singkat tes"
                    rows={3}
                  />
                </label>

                <div className="tpa-form-row">
                  <label>
                    Durasi (menit)
                    <input
                      type="number"
                      min="1"
                      step="1"
                      required
                      value={durasi}
                      onChange={(event) => setDurasi(event.target.value)}
                    />
                  </label>

                  <label>
                    Jumlah soal
                    <input
                      type="number"
                      min="1"
                      step="1"
                      required
                      value={jumlahSoal}
                      onChange={(event) =>
                        setJumlahSoal(event.target.value)
                      }
                    />
                  </label>
                </div>

                <label>
                  Jadwal mulai
                  <input
                    type="datetime-local"
                    value={jadwal}
                    onChange={(event) => setJadwal(event.target.value)}
                  />
                </label>

                <label>
                  Status tes
                  <select
                    value={status}
                    onChange={(event) =>
                      setStatus(event.target.value as StatusTes)
                    }
                  >
                    <option value="Draft">Draft</option>
                    <option value="Aktif">Aktif</option>
                    <option value="Selesai">Selesai</option>
                  </select>
                </label>

                {error && (
                  <div className="tpa-alert tpa-alert-error" role="alert">
                    {error}
                  </div>
                )}

                <div className="tpa-form-actions">
                  <button
                    type="button"
                    className="tpa-cancel-btn"
                    onClick={() => setModal(false)}
                    disabled={sedangSimpan}
                  >
                    Batal
                  </button>

                  <button
                    type="submit"
                    className="tpa-primary-btn"
                    disabled={sedangSimpan}
                  >
                    {sedangSimpan ? "Menyimpan..." : "Simpan Tes"}
                  </button>
                </div>
              </form>
            </section>
          </div>
        )}
      </main>
    </div>
  );
}

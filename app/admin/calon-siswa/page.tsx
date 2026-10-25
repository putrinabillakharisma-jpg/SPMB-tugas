
"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type FormEvent,
} from "react";
import { useRouter, useSearchParams } from "next/navigation";
import AdminSidebar from "../AdminSidebar";
import "../admin.css";
import "./calon-siswa.css";

type Siswa = {
  id: number;
  nama: string;
  nisn: string;
  whatsapp: string;
  role: string;
  created_at: string;
  asal_sekolah?: string;
  asal?: string;
  jurusan?: string;
  jalur?: string;
  berkas?: string;
  status_berkas?: string;
  skor_tpa?: number | string | null;
  skor?: number | string | null;
  seleksi?: string;
  status_seleksi?: string;
};

type FormSiswa = {
  nama: string;
  nisn: string;
  whatsapp: string;
  password: string;
};

const FORM_AWAL: FormSiswa = {
  nama: "",
  nisn: "",
  whatsapp: "",
  password: "",
};

const JUMLAH_PER_HALAMAN = 8;

function tanggalIndonesia(value?: string) {
  if (!value) return "—";

  const tanggal = new Date(value);

  if (Number.isNaN(tanggal.getTime())) return "—";

  return tanggal.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function inisial(nama?: string) {
  return (nama || "S")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((bagian) => bagian[0]?.toUpperCase() || "")
    .join("");
}

function nilaiBerkas(siswa: Siswa) {
  return siswa.status_berkas || siswa.berkas || "";
}

function nilaiSeleksi(siswa: Siswa) {
  return siswa.status_seleksi || siswa.seleksi || "";
}

function kelasStatus(status: string) {
  const value = status.toLowerCase();

  if (
    value.includes("verifikasi") ||
    value.includes("lengkap") ||
    value.includes("lolos")
  ) {
    return "status-green";
  }

  if (
    value.includes("revisi") ||
    value.includes("belum") ||
    value.includes("gagal")
  ) {
    return "status-red";
  }

  if (
    value.includes("proses") ||
    value.includes("menunggu")
  ) {
    return "status-orange";
  }

  return "status-neutral";
}

export default function CalonSiswaPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [data, setData] = useState<Siswa[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [tabAktif, setTabAktif] = useState("Semua");
  const [filterJurusan, setFilterJurusan] = useState("Semua Jurusan");
  const [filterJalur, setFilterJalur] = useState("Semua Jalur");
  const [filterBerkas, setFilterBerkas] = useState("Semua Status");
  const [filterSeleksi, setFilterSeleksi] = useState("Semua Status");
  const [halaman, setHalaman] = useState(1);
  const [terpilih, setTerpilih] = useState<number[]>([]);
  const [modal, setModal] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState<FormSiswa>(FORM_AWAL);
  const [pesan, setPesan] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const ambilData = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/admin/calon-siswa", {
        method: "GET",
        cache: "no-store",
      });

      const result = await response.json();

      if (response.status === 401) {
        router.replace("/login");
        return;
      }

      if (!response.ok) {
        throw new Error(
          result.message || "Gagal mengambil data calon siswa."
        );
      }

      setData(Array.isArray(result.data) ? result.data : []);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Terjadi kesalahan saat mengambil data."
      );
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    void ambilData();
  }, [ambilData]);

  const daftarJurusan = useMemo(() => {
    const nilai = data
      .map((siswa) => siswa.jurusan)
      .filter((item): item is string => Boolean(item));

    return [...new Set(nilai)].sort();
  }, [data]);

  const daftarJalur = useMemo(() => {
    const nilai = data
      .map((siswa) => siswa.jalur)
      .filter((item): item is string => Boolean(item));

    return [...new Set(nilai)].sort();
  }, [data]);

  const hasilFilter = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    return data.filter((siswa) => {
      const cocokPencarian =
        !keyword ||
        (siswa.nama || "").toLowerCase().includes(keyword) ||
        (siswa.nisn || "").toLowerCase().includes(keyword) ||
        (siswa.whatsapp || "").toLowerCase().includes(keyword) ||
        (siswa.asal_sekolah || siswa.asal || "")
          .toLowerCase()
          .includes(keyword);

      const cocokJurusan =
        filterJurusan === "Semua Jurusan" ||
        (siswa.jurusan || "") === filterJurusan;

      const cocokJalur =
        filterJalur === "Semua Jalur" ||
        (siswa.jalur || "") === filterJalur;

      const berkas = nilaiBerkas(siswa);
      const seleksi = nilaiSeleksi(siswa);

      const cocokBerkas =
        filterBerkas === "Semua Status" ||
        berkas === filterBerkas;

      const cocokSeleksi =
        filterSeleksi === "Semua Status" ||
        seleksi === filterSeleksi;

      let cocokTab = true;

      if (tabAktif === "Belum Verifikasi") {
        cocokTab =
          !berkas ||
          /menunggu|belum/i.test(berkas);
      } else if (tabAktif === "Terverifikasi") {
        cocokTab = /verifikasi|lengkap/i.test(berkas);
      } else if (tabAktif === "Perlu Revisi") {
        cocokTab = /revisi/i.test(berkas);
      }

      return (
        cocokPencarian &&
        cocokJurusan &&
        cocokJalur &&
        cocokBerkas &&
        cocokSeleksi &&
        cocokTab
      );
    });
  }, [
    data,
    search,
    tabAktif,
    filterJurusan,
    filterJalur,
    filterBerkas,
    filterSeleksi,
  ]);

  useEffect(() => {
    setHalaman(1);
  }, [
    search,
    tabAktif,
    filterJurusan,
    filterJalur,
    filterBerkas,
    filterSeleksi,
  ]);

  const totalHalaman = Math.max(
    1,
    Math.ceil(hasilFilter.length / JUMLAH_PER_HALAMAN)
  );

  const dataHalaman = hasilFilter.slice(
    (halaman - 1) * JUMLAH_PER_HALAMAN,
    halaman * JUMLAH_PER_HALAMAN
  );

  const semuaDiHalamanTerpilih =
    dataHalaman.length > 0 &&
    dataHalaman.every((siswa) => terpilih.includes(siswa.id));

  const jumlahBelumVerifikasi = data.filter((siswa) => {
    const status = nilaiBerkas(siswa);
    return !status || /menunggu|belum/i.test(status);
  }).length;

  const jumlahTerverifikasi = data.filter((siswa) =>
    /verifikasi|lengkap/i.test(nilaiBerkas(siswa))
  ).length;

  const jumlahPerluRevisi = data.filter((siswa) =>
    /revisi/i.test(nilaiBerkas(siswa))
  ).length;

  const jumlahLolos = data.filter((siswa) =>
    /^lolos$/i.test(nilaiSeleksi(siswa).trim())
  ).length;

  function bukaTambah() {
    setEditId(null);
    setForm(FORM_AWAL);
    setError("");
    setPesan("");
    setModal(true);
  }
  useEffect(() => {
  if (searchParams.get("tambah") === "1") {
    bukaTambah();
    router.replace("/admin/calon-siswa");
  }
}, [searchParams, router]);

  function bukaEdit(siswa: Siswa) {
    setEditId(siswa.id);
    setForm({
      nama: siswa.nama || "",
      nisn: siswa.nisn || "",
      whatsapp: siswa.whatsapp || "",
      password: "",
    });
    setError("");
    setPesan("");
    setModal(true);
  }

  async function simpanData(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setPesan("");

    try {
      const response = await fetch("/api/admin/calon-siswa", {
        method: editId === null ? "POST" : "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          id: editId,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.message || "Gagal menyimpan data siswa."
        );
      }

      setModal(false);
      setForm(FORM_AWAL);
      setEditId(null);
      setPesan(result.message || "Data berhasil disimpan.");
      await ambilData();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Gagal menyimpan data."
      );
    } finally {
      setSaving(false);
    }
  }

  async function hapusData(siswa: Siswa) {
    const yakin = window.confirm(
      `Hapus data calon siswa "${siswa.nama}"?`
    );

    if (!yakin) return;

    setError("");
    setPesan("");

    try {
      const response = await fetch(
        `/api/admin/calon-siswa?id=${siswa.id}`,
        { method: "DELETE" }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.message || "Gagal menghapus data siswa."
        );
      }

      setTerpilih((sebelumnya) =>
        sebelumnya.filter((id) => id !== siswa.id)
      );
      setPesan(result.message || "Data berhasil dihapus.");
      await ambilData();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Gagal menghapus data."
      );
    }
  }

  function pilihSemua() {
    if (semuaDiHalamanTerpilih) {
      setTerpilih((sebelumnya) =>
        sebelumnya.filter(
          (id) => !dataHalaman.some((siswa) => siswa.id === id)
        )
      );
      return;
    }

    setTerpilih((sebelumnya) =>
      Array.from(
        new Set([
          ...sebelumnya,
          ...dataHalaman.map((siswa) => siswa.id),
        ])
      )
    );
  }

  function pilihSatu(id: number) {
    setTerpilih((sebelumnya) =>
      sebelumnya.includes(id)
        ? sebelumnya.filter((item) => item !== id)
        : [...sebelumnya, id]
    );
  }

  function resetFilter() {
    setSearch("");
    setTabAktif("Semua");
    setFilterJurusan("Semua Jurusan");
    setFilterJalur("Semua Jalur");
    setFilterBerkas("Semua Status");
    setFilterSeleksi("Semua Status");
    setHalaman(1);
  }

  function eksporCSV() {
    const kolom = [
      "Nama",
      "NISN",
      "WhatsApp",
      "Asal Sekolah",
      "Jurusan",
      "Jalur",
      "Tanggal Daftar",
      "Status Berkas",
      "Skor TPA",
      "Status Seleksi",
    ];

    const baris = hasilFilter.map((siswa) => [
      siswa.nama,
      siswa.nisn,
      siswa.whatsapp,
      siswa.asal_sekolah || siswa.asal || "",
      siswa.jurusan || "",
      siswa.jalur || "",
      tanggalIndonesia(siswa.created_at),
      nilaiBerkas(siswa),
      siswa.skor_tpa ?? siswa.skor ?? "",
      nilaiSeleksi(siswa),
    ]);

    const aman = (nilai: unknown) =>
      `"${String(nilai ?? "").replace(/"/g, '""')}"`;

    const isi = [kolom, ...baris]
      .map((barisCSV) => barisCSV.map(aman).join(","))
      .join("\r\n");

    const blob = new Blob(["\uFEFF" + isi], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "data-calon-siswa.csv";
    link.click();

    URL.revokeObjectURL(url);
  }

  async function logout() {
    if (!window.confirm("Yakin ingin keluar dari akun admin?")) {
      return;
    }

    try {
      const response = await fetch("/api/logout", {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("Logout gagal. Silakan coba lagi.");
      }

      router.replace("/login");
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Logout gagal."
      );
    }
  }

  return (
    <div className="admin cs-layout">
      <AdminSidebar />

      <main className="main cs-main">
        <header className="cs-topbar">
          <div className="cs-heading">
            <p className="cs-breadcrumb">
              Dashboard <span>›</span> Calon Siswa
            </p>
            <h1>Data Calon Siswa</h1>
            <p className="cs-subtitle">
              Pantau dan kelola calon siswa baru SPMB SMK Citra Negara.
            </p>
          </div>

          <div className="cs-header-actions">
            <span className="cs-year">
              ▦ <span>Tahun Ajaran 2026/2027</span>
            </span>
            <button
              type="button"
              className="cs-export-btn"
              onClick={eksporCSV}
            >
              ↓ <span>Ekspor</span>
            </button>
            <button
              type="button"
              className="cs-primary-btn"
              onClick={bukaTambah}
            >
              <span>＋</span> Tambah Calon Siswa
            </button>
          </div>
        </header>

        {pesan && (
          <div className="cs-alert success" role="status">
            {pesan}
          </div>
        )}

        {error && (
          <div className="cs-alert danger" role="alert">
            {error}
          </div>
        )}

        <section className="cs-stats">
          <article className="cs-stat-card">
            <div className="cs-stat-icon blue">♟</div>
            <div className="cs-stat-info">
              <p>Total Calon Siswa</p>
              <h2>{loading ? "…" : data.length}</h2>
              <span className="cs-stat-note">
                Total data tersimpan
              </span>
            </div>
          </article>

          <article className="cs-stat-card">
            <div className="cs-stat-icon orange">◷</div>
            <div className="cs-stat-info">
              <p>Menunggu Verifikasi</p>
              <h2>{loading ? "…" : jumlahBelumVerifikasi}</h2>
              <span className="cs-stat-note orange-text">
                Perlu ditindaklanjuti
              </span>
            </div>
          </article>

          <article className="cs-stat-card">
            <div className="cs-stat-icon yellow">▤</div>
            <div className="cs-stat-info">
              <p>Dokumen Lengkap</p>
              <h2>{loading ? "…" : jumlahTerverifikasi}</h2>
              <span className="cs-stat-note">
                Status dari data yang tersedia
              </span>
            </div>
          </article>

          <article className="cs-stat-card">
            <div className="cs-stat-icon green">✓</div>
            <div className="cs-stat-info">
              <p>Lolos Seleksi</p>
              <h2>{loading ? "…" : jumlahLolos}</h2>
              <span className="cs-stat-note">
                Berdasarkan status seleksi
              </span>
            </div>
          </article>
        </section>

        <section className="cs-content-card">
          <div className="cs-tabs" role="tablist" aria-label="Filter status">
            {[
              { label: "Semua", count: data.length },
              { label: "Belum Verifikasi", count: jumlahBelumVerifikasi },
              { label: "Terverifikasi", count: jumlahTerverifikasi },
              { label: "Perlu Revisi", count: jumlahPerluRevisi },
            ].map((tab) => (
              <button
                type="button"
                role="tab"
                aria-selected={tabAktif === tab.label}
                key={tab.label}
                className={`cs-tab ${
                  tabAktif === tab.label ? "active" : ""
                }`}
                onClick={() => setTabAktif(tab.label)}
              >
                {tab.label}
                <span
                  className={`cs-tab-count ${
                    tab.label === "Belum Verifikasi"
                      ? "count-orange"
                      : tab.label === "Terverifikasi"
                        ? "count-green"
                        : tab.label === "Perlu Revisi"
                          ? "count-red"
                          : ""
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          <div className="cs-filters">
            <label className="cs-search">
              <span>⌕</span>
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Cari nama, NISN, atau asal sekolah..."
                aria-label="Cari calon siswa"
              />
            </label>

            <select
              value={filterJurusan}
              onChange={(event) => setFilterJurusan(event.target.value)}
              aria-label="Filter jurusan"
            >
              <option>Semua Jurusan</option>
              {daftarJurusan.map((jurusan) => (
                <option key={jurusan}>{jurusan}</option>
              ))}
            </select>

            <select
              value={filterJalur}
              onChange={(event) => setFilterJalur(event.target.value)}
              aria-label="Filter jalur"
            >
              <option>Semua Jalur</option>
              {daftarJalur.map((jalur) => (
                <option key={jalur}>{jalur}</option>
              ))}
            </select>

            <select
              value={filterBerkas}
              onChange={(event) => setFilterBerkas(event.target.value)}
              aria-label="Filter status berkas"
            >
              <option>Semua Status</option>
              <option>Menunggu</option>
              <option>Terverifikasi</option>
              <option>Perlu Revisi</option>
            </select>

            <select
              value={filterSeleksi}
              onChange={(event) => setFilterSeleksi(event.target.value)}
              aria-label="Filter status seleksi"
            >
              <option>Semua Status</option>
              <option>Lolos</option>
              <option>Menunggu</option>
              <option>Diproses</option>
              <option>Belum Lolos</option>
            </select>

            <button
              type="button"
              className="cs-reset-btn"
              onClick={resetFilter}
            >
              ↻ Reset Filter
            </button>
          </div>

          {terpilih.length > 0 && (
            <div className="cs-selection-bar">
              <strong>{terpilih.length} siswa dipilih</strong>
              <button
                type="button"
                onClick={() => setTerpilih([])}
              >
                Batalkan pilihan
              </button>
              <span>
                Untuk mengubah status atau mengirim notifikasi massal,
                endpoint khusus perlu disiapkan terlebih dahulu.
              </span>
            </div>
          )}

          <div className="cs-table-wrap">
            <table className="cs-table">
              <thead>
                <tr>
                  <th className="cs-check-col">
                    <input
                      type="checkbox"
                      checked={semuaDiHalamanTerpilih}
                      onChange={pilihSemua}
                      aria-label="Pilih semua siswa di halaman ini"
                    />
                  </th>
                  <th>No</th>
                  <th>Nama Calon Siswa</th>
                  <th>Asal Sekolah</th>
                  <th>Jurusan</th>
                  <th>Jalur</th>
                  <th>Tgl Daftar</th>
                  <th>Berkas</th>
                  <th>Skor TPA</th>
                  <th>Seleksi</th>
                  <th>Aksi</th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={11} className="cs-empty">
                      Memuat data calon siswa...
                    </td>
                  </tr>
                ) : dataHalaman.length === 0 ? (
                  <tr>
                    <td colSpan={11} className="cs-empty">
                      Tidak ada data yang sesuai dengan filter.
                    </td>
                  </tr>
                ) : (
                  dataHalaman.map((siswa, index) => {
                    const berkas = nilaiBerkas(siswa);
                    const seleksi = nilaiSeleksi(siswa);
                    const skor = siswa.skor_tpa ?? siswa.skor;

                    return (
                      <tr
                        key={siswa.id}
                        className={
                          terpilih.includes(siswa.id) ? "row-selected" : ""
                        }
                      >
                        <td className="cs-check-col">
                          <input
                            type="checkbox"
                            checked={terpilih.includes(siswa.id)}
                            onChange={() => pilihSatu(siswa.id)}
                            aria-label={`Pilih ${siswa.nama}`}
                          />
                        </td>

                        <td>
                          {(halaman - 1) * JUMLAH_PER_HALAMAN +
                            index +
                            1}
                        </td>

                        <td>
                          <div className="cs-student">
                            <div className="cs-avatar">
                              {inisial(siswa.nama)}
                            </div>
                            <div className="cs-student-info">
                              <strong>{siswa.nama}</strong>
                              <span>NISN {siswa.nisn || "—"}</span>
                            </div>
                          </div>
                        </td>

                        <td>{siswa.asal_sekolah || siswa.asal || "—"}</td>

                        <td>
                          {siswa.jurusan ? (
                            <span className="cs-major">
                              <i />
                              {siswa.jurusan}
                            </span>
                          ) : (
                            "—"
                          )}
                        </td>

                        <td>{siswa.jalur || "—"}</td>
                        <td>{tanggalIndonesia(siswa.created_at)}</td>

                        <td>
                          {berkas ? (
                            <span
                              className={`cs-status ${kelasStatus(berkas)}`}
                            >
                              {berkas}
                            </span>
                          ) : (
                            <span className="cs-status status-neutral">
                              Belum tersedia
                            </span>
                          )}
                        </td>

                        <td>
                          {skor !== undefined && skor !== null && skor !== "" ? (
                            <strong className="cs-score">{skor}</strong>
                          ) : (
                            <span className="cs-score-empty">Belum tersedia</span>
                          )}
                        </td>

                        <td>
                          {seleksi ? (
                            <span
                              className={`cs-status ${kelasStatus(seleksi)}`}
                            >
                              {seleksi}
                            </span>
                          ) : (
                            <span className="cs-status status-neutral">
                              Belum tersedia
                            </span>
                          )}
                        </td>

                        <td>
                          <div className="cs-actions">
                            <button
                              type="button"
                              className="cs-action-btn view"
                              title={`Lihat data ${siswa.nama}`}
                              aria-label={`Lihat data ${siswa.nama}`}
                              onClick={() =>
                                window.alert(
                                  `Nama: ${siswa.nama}\nNISN: ${siswa.nisn}\nWhatsApp: ${siswa.whatsapp}`
                                )
                              }
                            >
                              ◉
                            </button>

                            <button
                              type="button"
                              className="cs-action-btn edit"
                              title="Edit data"
                              aria-label={`Edit ${siswa.nama}`}
                              onClick={() => bukaEdit(siswa)}
                            >
                              ✎
                            </button>

                            <button
                              type="button"
                              className="cs-action-btn delete"
                              title="Hapus data"
                              aria-label={`Hapus ${siswa.nama}`}
                              onClick={() => void hapusData(siswa)}
                            >
                              ▣
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

          <footer className="cs-pagination">
            <span>
              Menampilkan{" "}
              {hasilFilter.length === 0
                ? 0
                : (halaman - 1) * JUMLAH_PER_HALAMAN + 1}
              {"–"}
              {Math.min(
                halaman * JUMLAH_PER_HALAMAN,
                hasilFilter.length
              )}{" "}
              dari {hasilFilter.length} calon siswa
            </span>

            <div className="cs-page-controls">
              <label>
                Tampilkan
                <select
                  value={JUMLAH_PER_HALAMAN}
                  disabled
                  aria-label="Jumlah baris per halaman"
                >
                  <option value={8}>8</option>
                </select>
                per halaman
              </label>

              <button
                type="button"
                disabled={halaman <= 1}
                onClick={() => setHalaman((page) => page - 1)}
                aria-label="Halaman sebelumnya"
              >
                ‹
              </button>

              <button
                type="button"
                className="current"
                aria-current="page"
                disabled
              >
                {halaman}
              </button>

              <button
                type="button"
                disabled={halaman >= totalHalaman}
                onClick={() => setHalaman((page) => page + 1)}
                aria-label="Halaman berikutnya"
              >
                ›
              </button>
            </div>
          </footer>
        </section>
      </main>

      {modal && (
        <div
          className="cs-modal-overlay"
          onMouseDown={(event) => {
            if (
              event.target === event.currentTarget &&
              !saving
            ) {
              setModal(false);
            }
          }}
        >
          <section
            className="cs-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="cs-modal-title"
          >
            <div className="cs-modal-heading">
              <div>
                <p>FORMULIR SPMB</p>
                <h2 id="cs-modal-title">
                  {editId === null
                    ? "Tambah Calon Siswa"
                    : "Edit Data Calon Siswa"}
                </h2>
              </div>

              <button
                type="button"
                className="cs-close-btn"
                onClick={() => setModal(false)}
                disabled={saving}
                aria-label="Tutup"
              >
                ×
              </button>
            </div>

            <form onSubmit={simpanData}>
              <label>
                Nama lengkap
                <input
                  required
                  value={form.nama}
                  onChange={(event) =>
                    setForm({ ...form, nama: event.target.value })
                  }
                  placeholder="Masukkan nama lengkap"
                />
              </label>

              <label>
                NISN (10 angka)
                <input
                  required
                  inputMode="numeric"
                  pattern="[0-9]{10}"
                  maxLength={10}
                  value={form.nisn}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      nisn: event.target.value
                        .replace(/\D/g, "")
                        .slice(0, 10),
                    })
                  }
                  placeholder="Masukkan 10 angka NISN"
                />
              </label>

              <label>
                Nomor WhatsApp
                <input
                  type="tel"
                  required
                  value={form.whatsapp}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      whatsapp: event.target.value,
                    })
                  }
                  placeholder="Contoh: 08xxxxxxxxxx"
                />
              </label>

              {editId === null && (
                <label>
                  Password awal
                  <input
                    type="password"
                    required
                    minLength={8}
                    autoComplete="new-password"
                    value={form.password}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        password: event.target.value,
                      })
                    }
                    placeholder="Minimal 8 karakter"
                  />
                </label>
              )}

              <p className="cs-form-note">
                {editId === null
                  ? "Akun akan dibuat dengan role calon_siswa."
                  : "Password tidak diubah melalui formulir edit ini."}
              </p>

              {error && (
                <div className="cs-alert danger" role="alert">
                  {error}
                </div>
              )}

              <div className="cs-modal-actions">
                <button
                  type="button"
                  className="cs-cancel-btn"
                  onClick={() => setModal(false)}
                  disabled={saving}
                >
                  Batal
                </button>

                <button
                  type="submit"
                  className="cs-primary-btn"
                  disabled={saving}
                >
                  {saving
                    ? "Menyimpan..."
                    : editId === null
                      ? "Simpan Siswa"
                      : "Simpan Perubahan"}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </div>
  );
}

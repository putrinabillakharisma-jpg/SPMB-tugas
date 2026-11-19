
"use client";

import { useState } from "react";
import CalonSidebar from "../CalonSidebar";
import "./pilihan-jurusan.css";

type Jurusan = {
  id: string;
  nama: string;
  singkatan: string;
  deskripsi: string;
  gambar: string;
};

const DAFTAR_JURUSAN: Jurusan[] = [
  {
    id: "PPLG",
    nama: "Pengembangan Perangkat Lunak dan Gim",
    singkatan: "PPLG",
    deskripsi: "Belajar pemrograman, website, aplikasi, dan gim.",
    gambar: "/asset/pplg.png",
  },
  {
    id: "TJKT",
    nama: "Teknik Jaringan Komputer dan Telekomunikasi",
    singkatan: "TJKT",
    deskripsi: "Belajar jaringan komputer dan teknologi telekomunikasi.",
    gambar: "/assets/tjkt.png",
  },
  {
    id: "DKV",
    nama: "Desain Komunikasi Visual",
    singkatan: "DKV",
    deskripsi: "Belajar desain grafis, ilustrasi, dan komunikasi visual.",
    gambar: "/assets/dkv.png",
  },
  {
    id: "MPLB",
    nama: "Manajemen Perkantoran dan Layanan Bisnis",
    singkatan: "MPLB",
    deskripsi: "Belajar administrasi dan pengelolaan perkantoran.",
    gambar: "/assets/mplb.png",
  },
  {
    id: "PEMASARAN",
    nama: "Pemasaran",
    singkatan: "Pemasaran",
    deskripsi: "Belajar strategi pemasaran dan bisnis.",
    gambar: "/assets/pemasaran.png",
  },
  {
    id: "PERHOTELAN",
    nama: "Perhotelan",
    singkatan: "Perhotelan",
    deskripsi: "Belajar pelayanan dan pengelolaan perhotelan.",
    gambar: "/assets/perhotelan.png",
  },
];

type Tahap = 1 | 2;

export default function PilihanJurusanPage() {
  const [jurusanUtama, setJurusanUtama] = useState("");
  const [jurusanCadangan, setJurusanCadangan] = useState("");
  const [tahap, setTahap] = useState<Tahap>(1);
  const [loading, setLoading] = useState(false);
  const [pesan, setPesan] = useState("");

  function pilihJurusan(id: string) {
    setPesan("");

    if (jurusanUtama === id) {
      setJurusanUtama("");
      return;
    }

    if (jurusanCadangan === id) {
      setJurusanCadangan("");
      return;
    }

    if (!jurusanUtama) {
      setJurusanUtama(id);
      return;
    }

    if (!jurusanCadangan) {
      setJurusanCadangan(id);
      return;
    }

    setPesan(
      "Kamu sudah memilih dua jurusan. Batalkan salah satu pilihan terlebih dahulu."
    );
  }

  function lanjutkan() {
    setPesan("");

    if (!jurusanUtama) {
      setPesan("Silakan pilih jurusan utama terlebih dahulu.");
      return;
    }

    setTahap(2);
  }

  function namaJurusan(id: string) {
    return (
      DAFTAR_JURUSAN.find((item) => item.id === id)?.nama || id
    );
  }

  async function simpanPilihan() {
    try {
      setLoading(true);
      setPesan("");

      const response = await fetch(
        "/api/calon-siswa/pilihan-jurusan",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            jurusan_1: jurusanUtama,
            jurusan_2: jurusanCadangan || null,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.message || "Gagal menyimpan pilihan jurusan."
        );
      }

      // Jika berhasil disimpan, lanjut ke halaman pembayaran.
      window.location.href = "/calon-siswa/pembayaran";
    } catch (error) {
      setPesan(
        error instanceof Error
          ? error.message
          : "Terjadi kesalahan saat menyimpan pilihan."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="calon-layout">
      <CalonSidebar />

      <main className="jurusan-main">
        {/* TOPBAR */}
        <header className="jurusan-topbar">
          <div className="jurusan-user">
            <div className="jurusan-avatar">♙</div>
            <span>Calon Siswa</span>
            <span className="jurusan-chevron">⌄</span>
          </div>
        </header>

        {/* KONTEN */}
        <section className="jurusan-content">
          <h1>Pilihan Jurusan</h1>

          {/* STEPPER */}
          <div className="jurusan-stepper">
            <div className={`step-item ${tahap >= 1 ? "active" : ""}`}>
              <div className="step-number">1</div>
              <span>Pilih Jurusan</span>
            </div>

            <div className="step-line" />

            <div className={`step-item ${tahap >= 2 ? "active" : ""}`}>
              <div className="step-number">2</div>
              <span>Konfirmasi</span>
            </div>
          </div>

          {/* TAHAP 1 */}
          {tahap === 1 && (
            <div className="jurusan-section">
              <h2>Pilih Jurusan yang Kamu Minati</h2>

              <p className="jurusan-subtitle">
                Pilih satu jurusan utama dan satu jurusan cadangan (opsional).
              </p>

              <div className="jurusan-keterangan">
                <span className="pilihan-badge utama">1</span>
                <span>Jurusan Utama</span>

                <span className="pilihan-badge cadangan">2</span>
                <span>Jurusan Cadangan</span>
              </div>

              <div className="jurusan-grid">
                {DAFTAR_JURUSAN.map((jurusan) => {
                  const utama = jurusanUtama === jurusan.id;
                  const cadangan = jurusanCadangan === jurusan.id;

                  return (
                    <button
                      type="button"
                      key={jurusan.id}
                      className={`jurusan-card ${
                        utama ? "selected-utama" : ""
                      } ${cadangan ? "selected-cadangan" : ""}`}
                      onClick={() => pilihJurusan(jurusan.id)}
                    >
                      <div className="jurusan-card-icon">
                        <img
                          src={jurusan.gambar}
                          alt={`Icon ${jurusan.singkatan}`}
                        />
                      </div>

                      <span className="jurusan-card-nama">
                        {jurusan.singkatan}
                      </span>

                      <span className="jurusan-card-deskripsi">
                        {jurusan.deskripsi}
                      </span>

                      {utama && (
                        <span className="jurusan-card-label">
                          ✓ Jurusan Utama
                        </span>
                      )}

                      {cadangan && (
                        <span className="jurusan-card-label cadangan-label">
                          ✓ Jurusan Cadangan
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {pesan && (
                <p className="jurusan-error">{pesan}</p>
              )}

              <div className="jurusan-action">
                <button
                  type="button"
                  className="jurusan-next"
                  onClick={lanjutkan}
                >
                  Lanjutkan <span>→</span>
                </button>
              </div>
            </div>
          )}

          {/* TAHAP 2 */}
          {tahap === 2 && (
            <div className="jurusan-konfirmasi">
              <h2>Konfirmasi Pilihan Jurusan</h2>

              <p>
                Pastikan pilihan jurusanmu sudah benar sebelum melanjutkan
                ke pembayaran formulir.
              </p>

              <div className="konfirmasi-card">
                <span className="konfirmasi-nomor utama">1</span>
                <div>
                  <small>Jurusan Utama</small>
                  <h3>{namaJurusan(jurusanUtama)}</h3>
                </div>
              </div>

              <div className="konfirmasi-card">
                <span className="konfirmasi-nomor cadangan">2</span>
                <div>
                  <small>Jurusan Cadangan</small>
                  <h3>
                    {jurusanCadangan
                      ? namaJurusan(jurusanCadangan)
                      : "Tidak memilih jurusan cadangan"}
                  </h3>
                </div>
              </div>

              <div className="jurusan-info-pembayaran">
                <strong>Langkah Selanjutnya</strong>
                <p>
                  Setelah pilihan jurusan tersimpan, kamu akan diarahkan
                  ke halaman pembayaran biaya formulir SPMB.
                </p>
              </div>

              {pesan && (
                <p className="jurusan-error">{pesan}</p>
              )}

              <div className="jurusan-action konfirmasi-action">
                <button
                  type="button"
                  className="jurusan-back"
                  onClick={() => setTahap(1)}
                  disabled={loading}
                >
                  ← Kembali
                </button>

                <button
                  type="button"
                  className="jurusan-next"
                  onClick={simpanPilihan}
                  disabled={loading}
                >
                  {loading ? "Menyimpan..." : "Konfirmasi & Lanjutkan"}
                  <span>→</span>
                </button>
              </div>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

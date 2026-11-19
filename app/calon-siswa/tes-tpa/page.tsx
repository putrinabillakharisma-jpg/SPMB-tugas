
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import CalonSidebar from "../CalonSidebar";
import "./tes-tpa.css";

type Soal = {
  id: number;
  pertanyaan: string;
  opsi_a: string;
  opsi_b: string;
  opsi_c: string;
  opsi_d: string;
  urutan: number;
};

type Tes = {
  id: number;
  judul: string;
  deskripsi: string | null;
  tanggal_mulai: string | null;
  tanggal_selesai: string | null;
  durasi_menit: number;
  jumlah_soal: number;
  status: string;
};

type Hasil = {
  id: number;
  tes_id: number;
  nilai: number | null;
  status: string;
  mulai_at: string | null;
  selesai_at: string | null;
};

type DataTes = {
  terkunci: boolean;
  tersedia?: boolean;
  selesai?: boolean;
  sudahMulai?: boolean;
  message?: string;
  tes: Tes | null;
  hasil: Hasil | null;
  soal: Soal[];
};

type Jawaban = Record<number, string>;

export default function TesTPACalonSiswaPage() {
  const [data, setData] = useState<DataTes | null>(null);
  const [loading, setLoading] = useState(true);
  const [mulaiLoading, setMulaiLoading] = useState(false);
  const [selesaiLoading, setSelesaiLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [jawaban, setJawaban] = useState<Jawaban>({});
  const [nomorAktif, setNomorAktif] = useState(0);
  const [sisaDetik, setSisaDetik] = useState(0);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const formatWaktu = (detik: number) => {
    const jam = Math.floor(detik / 3600);
    const menit = Math.floor((detik % 3600) / 60);
    const sisa = detik % 60;

    return [jam, menit, sisa]
      .map((angka) => String(angka).padStart(2, "0"))
      .join(":");
  };

  const ambilData = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch("/api/calon-siswa/tes-tpa", {
        method: "GET",
        cache: "no-store",
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Gagal mengambil data tes.");
      }

      setData(result);

      if (
        result.sudahMulai &&
        result.hasil?.mulai_at &&
        result.tes
      ) {
        const mulai = new Date(result.hasil.mulai_at).getTime();
        const batas =
          mulai + Number(result.tes.durasi_menit) * 60 * 1000;
        const sisa = Math.max(
          0,
          Math.floor((batas - Date.now()) / 1000)
        );

        setSisaDetik(sisa);
      }

      if (result.selesai) {
        setSuccess("Kamu sudah menyelesaikan tes ini.");
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Terjadi kesalahan."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    ambilData();
  }, [ambilData]);

  // Timer berjalan setelah tes dimulai.
  useEffect(() => {
    if (!data?.sudahMulai || data.selesai) return;

    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    timerRef.current = setInterval(() => {
      setSisaDetik((sebelumnya) => {
        if (sebelumnya <= 1) {
          if (timerRef.current) {
            clearInterval(timerRef.current);
          }
          return 0;
        }

        return sebelumnya - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [data?.sudahMulai, data?.selesai]);

  // Saat waktu habis, kirim jawaban yang sudah dipilih.
  useEffect(() => {
    if (
      data?.sudahMulai &&
      !data.selesai &&
      sisaDetik === 0 &&
      data.soal.length > 0
    ) {
      selesaikanTes();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sisaDetik]);

  async function mulaiTes() {
    if (!data?.tes) return;

    const yakin = window.confirm(
      "Apakah kamu yakin ingin memulai Tes TPA? Waktu akan mulai berjalan setelah kamu menekan OK."
    );

    if (!yakin) return;

    try {
      setMulaiLoading(true);
      setError("");

      const response = await fetch("/api/calon-siswa/tes-tpa", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "start",
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Gagal memulai tes.");
      }

      await ambilData();
      setSuccess("Tes berhasil dimulai. Selamat mengerjakan!");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Gagal memulai tes."
      );
    } finally {
      setMulaiLoading(false);
    }
  }

  function pilihJawaban(soalId: number, pilihan: string) {
    setJawaban((sebelumnya) => ({
      ...sebelumnya,
      [soalId]: pilihan,
    }));
  }

  async function selesaikanTes() {
    if (!data?.tes || selesaiLoading || data.selesai) return;

    const konfirmasi =
      sisaDetik <= 0 ||
      window.confirm(
        "Apakah kamu yakin ingin menyelesaikan Tes TPA? Jawaban tidak dapat diubah setelah dikirim."
      );

    if (!konfirmasi) return;

    try {
      setSelesaiLoading(true);
      setError("");

      const response = await fetch("/api/calon-siswa/tes-tpa", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "finish",
          tes_id: data.tes.id,
          jawaban,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.message || "Gagal menyelesaikan tes."
        );
      }

      if (timerRef.current) {
        clearInterval(timerRef.current);
      }

      setSuccess("Tes TPA berhasil diselesaikan!");
      await ambilData();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Gagal menyelesaikan tes."
      );
    } finally {
      setSelesaiLoading(false);
    }
  }

  const daftarSoal = data?.soal || [];
  const soalSekarang = daftarSoal[nomorAktif];
  const jumlahTerjawab = Object.keys(jawaban).length;
  const progress =
    daftarSoal.length > 0
      ? (jumlahTerjawab / daftarSoal.length) * 100
      : 0;

  if (loading) {
    return (
      <div className="tpa-loading">
        <div className="tpa-spinner" />
        <p>Memuat halaman Tes TPA...</p>
      </div>
    );
  }

  return (
    <div className="tpa-layout">
      <CalonSidebar />

      <main className="tpa-main">
        <header className="tpa-header">
          <div>
            <p className="tpa-header-subtitle">
              SISTEM PENERIMAAN MURID BARU
            </p>
            <h1>Tes Potensi Akademik</h1>
          </div>

          <div className="tpa-profile">
            <div className="tpa-avatar">
              <span>CS</span>
            </div>
            <div>
              <strong>Calon Siswa</strong>
              <small>Peserta SPMB</small>
            </div>
          </div>
        </header>

        <section className="tpa-content">
          <div className="tpa-page-heading">
            <div>
              <span className="tpa-breadcrumb">
                Beranda / Tes TPA
              </span>
              <h2>Tes Potensi Akademik</h2>
              <p>
                Kerjakan tes sesuai waktu yang telah ditentukan.
              </p>
            </div>

            <div className="tpa-heading-icon">
              <span>✎</span>
            </div>
          </div>

          {error && (
            <div className="tpa-alert tpa-alert-error">
              <span>!</span>
              {error}
            </div>
          )}

          {success && (
            <div className="tpa-alert tpa-alert-success">
              <span>✓</span>
              {success}
            </div>
          )}

          {/* PEMBAYARAN BELUM DITERIMA */}
          {data?.terkunci && (
            <div className="tpa-lock-card">
              <div className="tpa-lock-icon">🔒</div>
              <span className="tpa-status tpa-status-locked">
                AKSES TERKUNCI
              </span>
              <h3>Tes TPA Belum Dapat Diakses</h3>
              <p>
                Kamu perlu menyelesaikan pembayaran formulir
                pendaftaran dan menunggu verifikasi dari admin
                sebelum dapat mengikuti Tes Potensi Akademik.
              </p>

              <div className="tpa-lock-info">
                <div>
                  <span className="tpa-info-icon">ⓘ</span>
                  <span>
                    Status pembayaran formulir belum diterima.
                  </span>
                </div>
                <div>
                  <span className="tpa-info-icon">✓</span>
                  <span>
                    Setelah pembayaran diterima, akses tes akan
                    terbuka secara otomatis.
                  </span>
                </div>
              </div>

              <Link
                href="/calon-siswa/pembayaran"
                className="tpa-primary-button"
              >
                Lihat Pembayaran
                <span>→</span>
              </Link>
            </div>
          )}

          {/* TES BELUM TERSEDIA */}
          {!data?.terkunci && data?.tersedia === false && (
            <div className="tpa-empty-card">
              <div className="tpa-empty-icon">📋</div>
              <h3>Tes Belum Tersedia</h3>
              <p>
                {data.message ||
                  "Belum ada jadwal Tes TPA yang aktif. Silakan periksa kembali nanti."}
              </p>
              <button
                className="tpa-secondary-button"
                onClick={ambilData}
              >
                ↻ Periksa Kembali
              </button>
            </div>
          )}

          {/* TES SUDAH SELESAI */}
          {!data?.terkunci && data?.selesai && (
            <div className="tpa-result-card">
              <div className="tpa-result-icon">✓</div>
              <span className="tpa-status tpa-status-done">
                TES SELESAI
              </span>
              <h3>Terima Kasih, Tes Berhasil Diselesaikan!</h3>
              <p>
                Jawaban kamu telah berhasil disimpan ke sistem.
              </p>

              <div className="tpa-score-box">
                <span>Nilai Tes TPA</span>
                <strong>
                  {Number(data.hasil?.nilai || 0).toFixed(2)}
                </strong>
                <small>Skala nilai 0–100</small>
              </div>

              <div className="tpa-result-detail">
                <div>
                  <span>Nama Tes</span>
                  <strong>{data.tes?.judul}</strong>
                </div>
                <div>
                  <span>Status</span>
                  <strong>Selesai</strong>
                </div>
              </div>

              <Link
                href="/calon-siswa"
                className="tpa-primary-button"
              >
                Kembali ke Beranda
                <span>→</span>
              </Link>
            </div>
          )}

          {/* TES SIAP DIMULAI */}
          {!data?.terkunci &&
            data?.tersedia !== false &&
            !data?.selesai &&
            !data?.sudahMulai &&
            data?.tes && (
              <>
                <div className="tpa-intro-card">
                  <div className="tpa-intro-top">
                    <div className="tpa-intro-icon">📝</div>
                    <span className="tpa-status tpa-status-ready">
                      TES TERSEDIA
                    </span>
                  </div>

                  <h3>{data.tes.judul}</h3>
                  <p>
                    {data.tes.deskripsi ||
                      "Tes Potensi Akademik calon siswa SMK Citra Negara."}
                  </p>

                  <div className="tpa-stats">
                    <div className="tpa-stat-item">
                      <span className="tpa-stat-icon">☷</span>
                      <div>
                        <strong>
                          {data.tes.jumlah_soal || 0}
                        </strong>
                        <small>Jumlah Soal</small>
                      </div>
                    </div>
                    <div className="tpa-stat-item">
                      <span className="tpa-stat-icon">◷</span>
                      <div>
                        <strong>
                          {data.tes.durasi_menit} Menit
                        </strong>
                        <small>Durasi Tes</small>
                      </div>
                    </div>
                    <div className="tpa-stat-item">
                      <span className="tpa-stat-icon">✓</span>
                      <div>
                        <strong>Online</strong>
                        <small>Metode Tes</small>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="tpa-instruction-card">
                  <h3>Petunjuk Pengerjaan</h3>
                  <ul>
                    <li>
                      Pastikan koneksi internet stabil sebelum
                      memulai tes.
                    </li>
                    <li>
                      Baca setiap pertanyaan dengan teliti.
                    </li>
                    <li>
                      Pilih satu jawaban yang menurut kamu paling
                      tepat.
                    </li>
                    <li>
                      Waktu akan berjalan setelah tombol mulai
                      ditekan.
                    </li>
                    <li>
                      Jawaban akan dikirim ketika kamu menekan
                      tombol selesai atau waktu habis.
                    </li>
                    <li>
                      Tes yang sudah selesai tidak dapat diulang.
                    </li>
                  </ul>

                  <button
                    className="tpa-primary-button tpa-start-button"
                    onClick={mulaiTes}
                    disabled={mulaiLoading}
                  >
                    {mulaiLoading
                      ? "Memulai Tes..."
                      : "Mulai Tes Sekarang"}
                    {!mulaiLoading && <span>→</span>}
                  </button>
                </div>
              </>
            )}

          {/* TES SEDANG DIKERJAKAN */}
          {!data?.terkunci &&
            data?.sudahMulai &&
            !data?.selesai &&
            data?.tes && (
              <div className="tpa-exam">
                <div className="tpa-exam-top">
                  <div>
                    <span className="tpa-status tpa-status-ready">
                      SEDANG DIKERJAKAN
                    </span>
                    <h3>{data.tes.judul}</h3>
                  </div>

                  <div
                    className={`tpa-timer ${
                      sisaDetik <= 300 ? "tpa-timer-warning" : ""
                    }`}
                  >
                    <span>◷</span>
                    <div>
                      <small>Sisa Waktu</small>
                      <strong>{formatWaktu(sisaDetik)}</strong>
                    </div>
                  </div>
                </div>

                <div className="tpa-progress-section">
                  <div className="tpa-progress-label">
                    <span>Progress Pengerjaan</span>
                    <strong>
                      {jumlahTerjawab}/{daftarSoal.length} Terjawab
                    </strong>
                  </div>
                  <div className="tpa-progress-track">
                    <div
                      className="tpa-progress-fill"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>

                {soalSekarang ? (
                  <div className="tpa-question-card">
                    <div className="tpa-question-heading">
                      <span>
                        Pertanyaan {nomorAktif + 1} dari{" "}
                        {daftarSoal.length}
                      </span>
                      <span className="tpa-question-number">
                        {String(nomorAktif + 1).padStart(2, "0")}
                      </span>
                    </div>

                    <h4>{soalSekarang.pertanyaan}</h4>

                    <div className="tpa-options">
                      {(
                        [
                          ["A", soalSekarang.opsi_a],
                          ["B", soalSekarang.opsi_b],
                          ["C", soalSekarang.opsi_c],
                          ["D", soalSekarang.opsi_d],
                        ] as [string, string][]
                      ).map(([huruf, isi]) => (
                        <label
                          key={huruf}
                          className={`tpa-option ${
                            jawaban[soalSekarang.id] === huruf
                              ? "selected"
                              : ""
                          }`}
                        >
                          <input
                            type="radio"
                            name={`soal-${soalSekarang.id}`}
                            value={huruf}
                            checked={
                              jawaban[soalSekarang.id] === huruf
                            }
                            onChange={() =>
                              pilihJawaban(soalSekarang.id, huruf)
                            }
                          />
                          <span className="tpa-option-letter">
                            {huruf}
                          </span>
                          <span className="tpa-option-text">
                            {isi}
                          </span>
                        </label>
                      ))}
                    </div>

                    <div className="tpa-question-navigation">
                      <button
                        className="tpa-secondary-button"
                        disabled={nomorAktif === 0}
                        onClick={() =>
                          setNomorAktif((nomor) =>
                            Math.max(0, nomor - 1)
                          )
                        }
                      >
                        ← Sebelumnya
                      </button>

                      {nomorAktif < daftarSoal.length - 1 ? (
                        <button
                          className="tpa-primary-button"
                          onClick={() =>
                            setNomorAktif((nomor) =>
                              Math.min(
                                daftarSoal.length - 1,
                                nomor + 1
                              )
                            )
                          }
                        >
                          Selanjutnya →
                        </button>
                      ) : (
                        <button
                          className="tpa-primary-button"
                          onClick={selesaikanTes}
                          disabled={selesaiLoading}
                        >
                          {selesaiLoading
                            ? "Mengirim Jawaban..."
                            : "Selesaikan Tes ✓"}
                        </button>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="tpa-empty-card">
                    <h3>Soal belum tersedia</h3>
                    <p>
                      Belum ada soal yang dapat ditampilkan untuk
                      tes ini.
                    </p>
                  </div>
                )}

                <div className="tpa-number-card">
                  <h4>Navigasi Soal</h4>
                  <div className="tpa-number-grid">
                    {daftarSoal.map((soal, index) => (
                      <button
                        key={soal.id}
                        className={[
                          nomorAktif === index ? "active" : "",
                          jawaban[soal.id] ? "answered" : "",
                        ]
                          .filter(Boolean)
                          .join(" ")}
                        onClick={() => setNomorAktif(index)}
                      >
                        {index + 1}
                      </button>
                    ))}
                  </div>

                  <div className="tpa-number-legend">
                    <span>
                      <i className="legend-active" /> Soal aktif
                    </span>
                    <span>
                      <i className="legend-answered" /> Terjawab
                    </span>
                    <span>
                      <i className="legend-empty" /> Belum dijawab
                    </span>
                  </div>
                </div>
              </div>
            )}
        </section>
      </main>
    </div>
  );
}

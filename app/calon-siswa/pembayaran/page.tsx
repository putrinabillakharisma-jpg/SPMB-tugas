
"use client";

import {
  useCallback,
  useEffect,
  useState,
  type ChangeEvent,
  type FormEvent,
} from "react";
import Link from "next/link";
import CalonSidebar from "../CalonSidebar";
import "./pembayaran.css";

type MetodePembayaran = "QRIS" | "VA" | "TRANSFER";

type Pembayaran = {
  id: number;
  calon_siswa_id?: number;
  nominal: number;
  status: string;
  metode_pembayaran?: string | null;
  bukti_pembayaran?: string | null;
  catatan_admin?: string | null;
  tanggal_bayar?: string | null;
  tanggal_verifikasi?: string | null;
  jenis_pembayaran: string;
  payment_reference?: string | null;
  payment_url?: string | null;
  qr_url?: string | null;
  va_number?: string | null;
  created_at?: string;
};

const FORMAT_RUPIAH = (nominal: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(nominal);

const METODE_DATABASE: Record<MetodePembayaran, string> = {
  QRIS: "QRIS Simulasi",
  VA: "Virtual Account Simulasi",
  TRANSFER: "Transfer Bank Manual",
};

function ubahMetodeDatabase(
  metode?: string | null
): MetodePembayaran | null {
  if (metode === "QRIS Simulasi") return "QRIS";
  if (metode === "Virtual Account Simulasi") return "VA";
  if (metode === "Transfer Bank Manual") return "TRANSFER";

  return null;
}

export default function PembayaranPage() {
  const [metode, setMetode] =
    useState<MetodePembayaran>("TRANSFER");

  const [pembayaran, setPembayaran] =
    useState<Pembayaran | null>(null);

  const [loading, setLoading] = useState(true);
  const [prosesBayar, setProsesBayar] = useState(false);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [simulasiLoading, setSimulasiLoading] = useState(false);

  const [fileBukti, setFileBukti] = useState<File | null>(null);
  const [pesan, setPesan] = useState("");
  const [error, setError] = useState("");

  const [nama] = useState("Calon Siswa");

  const biayaPendaftaran = 150000;

  // ========================================
  // STATUS PEMBAYARAN
  // ========================================

  const status = pembayaran?.status?.toLowerCase() || "";

  const sudahDibayar =
    status === "diterima" || status === "lunas";

  const statusMenungguVerifikasi =
    status === "menunggu verifikasi";

  const statusMenunggu =
    status === "menunggu pembayaran";

  const statusDitolak = status === "ditolak";
  const statusGagal = status === "gagal";

  const perluTagihanBaru =
    !pembayaran || statusDitolak || statusGagal;

  const metodeTersimpan = ubahMetodeDatabase(
    pembayaran?.metode_pembayaran
  );

  const metodeAktif = metodeTersimpan || metode;

  const bolehPilihMetode =
    !sudahDibayar &&
    (!pembayaran || statusDitolak || statusGagal);

  const bolehUpload =
    !!pembayaran &&
    metodeTersimpan === "TRANSFER" &&
    !sudahDibayar &&
    !statusMenungguVerifikasi &&
    (statusMenunggu || statusDitolak || statusGagal);

  const bolehSimulasi =
    !!pembayaran &&
    !sudahDibayar &&
    statusMenunggu &&
    (metodeTersimpan === "QRIS" ||
      metodeTersimpan === "VA");

  const nomorPendaftaran = pembayaran
    ? `SPMB-${pembayaran.calon_siswa_id || pembayaran.id}`
    : "-";

  const statusTampilan = sudahDibayar
    ? "Lunas"
    : pembayaran?.status || "Belum Dibayar";

  // Nomor ini hanya identitas demo, bukan nomor rekening sungguhan.
  const nomorVirtualAccount = pembayaran
    ? `DEMO-VA-SPMB-${String(pembayaran.id).padStart(6, "0")}`
    : "";

  // ========================================
  // AMBIL DATA PEMBAYARAN
  // ========================================

  const ambilPembayaran = useCallback(async () => {
    try {
      setError("");

      const response = await fetch(
        "/api/calon-siswa/pembayaran",
        {
          method: "GET",
          cache: "no-store",
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.message || "Gagal mengambil data pembayaran."
        );
      }

      const data: Pembayaran | null =
        result.pembayaran || null;

      setPembayaran(data);

      const metodeData = ubahMetodeDatabase(
        data?.metode_pembayaran
      );

      if (metodeData) {
        setMetode(metodeData);
      }

      return data;
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Terjadi kesalahan saat mengambil pembayaran."
      );

      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    ambilPembayaran();
  }, [ambilPembayaran]);

  // ========================================
  // MEMILIH METODE PEMBAYARAN
  // ========================================

  function pilihMetode(value: MetodePembayaran) {
    if (!bolehPilihMetode) return;

    setMetode(value);
    setError("");
    setPesan("");
  }

  // ========================================
  // MEMBUAT TAGIHAN PEMBAYARAN
  // ========================================

  async function bayarSekarang() {
    try {
      setProsesBayar(true);
      setError("");
      setPesan("");

      const response = await fetch(
        "/api/calon-siswa/pembayaran",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            jenis_pembayaran: "Pendaftaran",
            metode: metode,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.message || "Gagal membuat tagihan pembayaran."
        );
      }

      setPembayaran(result.pembayaran || null);

      const metodeData = ubahMetodeDatabase(
        result.pembayaran?.metode_pembayaran
      );

      if (metodeData) {
        setMetode(metodeData);
      }

      setPesan(
        result.message ||
          "Tagihan berhasil dibuat. Silakan lanjutkan pembayaran."
      );

      await ambilPembayaran();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Terjadi kesalahan saat membuat tagihan."
      );
    } finally {
      setProsesBayar(false);
    }
  }

  // ========================================
  // SIMULASI QRIS / VIRTUAL ACCOUNT
  // ========================================

  async function simulasikanPembayaran() {
    if (!pembayaran) {
      setError("Tagihan pembayaran belum tersedia.");
      return;
    }

    if (!bolehSimulasi) {
      setError("Simulasi pembayaran tidak dapat dilakukan.");
      return;
    }

    try {
      setSimulasiLoading(true);
      setError("");
      setPesan("");

      const response = await fetch(
        "/api/calon-siswa/pembayaran/simulasi",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            pembayaran_id: pembayaran.id,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.message || "Simulasi pembayaran gagal."
        );
      }

      setPesan(
        result.message ||
          "Simulasi berhasil. Pembayaran telah diterima."
      );

      await ambilPembayaran();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Terjadi kesalahan saat simulasi pembayaran."
      );
    } finally {
      setSimulasiLoading(false);
    }
  }

  // ========================================
  // CEK STATUS PEMBAYARAN
  // ========================================

  async function cekStatusPembayaran() {
    setLoading(true);
    setPesan("");

    const data = await ambilPembayaran();

    if (data) {
      setPesan("Status pembayaran berhasil diperbarui.");
    }

    setLoading(false);
  }

  // ========================================
  // PILIH FILE BUKTI PEMBAYARAN
  // ========================================

  function pilihFile(event: ChangeEvent<HTMLInputElement>) {
    const selectedFile = event.target.files?.[0];

    setError("");
    setPesan("");

    if (!selectedFile) {
      setFileBukti(null);
      return;
    }

    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "application/pdf",
    ];

    if (!allowedTypes.includes(selectedFile.type)) {
      setFileBukti(null);
      setError("Format file harus JPG, PNG, atau PDF.");
      event.target.value = "";
      return;
    }

    if (selectedFile.size === 0) {
      setFileBukti(null);
      setError("File yang dipilih kosong.");
      event.target.value = "";
      return;
    }

    if (selectedFile.size > 5 * 1024 * 1024) {
      setFileBukti(null);
      setError("Ukuran file maksimal 5 MB.");
      event.target.value = "";
      return;
    }

    setFileBukti(selectedFile);
  }

  // ========================================
  // UPLOAD BUKTI PEMBAYARAN
  // ========================================

  async function uploadBukti(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (!pembayaran) {
      setError("Tagihan pembayaran belum tersedia.");
      return;
    }

    if (!fileBukti) {
      setError(
        "Silakan pilih file bukti pembayaran terlebih dahulu."
      );
      return;
    }

    try {
      setUploadLoading(true);
      setError("");
      setPesan("");

      const formData = new FormData();

      formData.append(
        "pembayaran_id",
        String(pembayaran.id)
      );

      formData.append("bukti", fileBukti);

      const response = await fetch(
        "/api/calon-siswa/pembayaran/upload",
        {
          method: "POST",
          body: formData,
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.message || "Gagal mengunggah bukti pembayaran."
        );
      }

      setFileBukti(null);

      const inputFile = document.getElementById(
        "bukti-pembayaran"
      ) as HTMLInputElement | null;

      if (inputFile) {
        inputFile.value = "";
      }

      setPesan(
        result.message ||
          "Bukti pembayaran berhasil dikirim dan menunggu verifikasi admin."
      );

      await ambilPembayaran();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Terjadi kesalahan saat mengunggah bukti."
      );
    } finally {
      setUploadLoading(false);
    }
  }

  // ========================================
  // TAMPILAN
  // ========================================

  return (
    <div className="calon-layout">
      <CalonSidebar />

      <main className="pembayaran-main">
        {/* TOPBAR */}
        <header className="pembayaran-topbar">
          <div className="pembayaran-user">
            <div className="user-avatar">♙</div>
            <span>{nama}</span>
            <span className="user-chevron">⌄</span>
          </div>
        </header>

        {/* CONTENT */}
        <section className="pembayaran-content">
          <h1>Pembayaran</h1>

          {loading && !pembayaran ? (
            <div className="pembayaran-loading">
              Memuat informasi pembayaran...
            </div>
          ) : (
            <div className="pembayaran-container">
              {/* INFORMASI PEMBAYARAN */}
              <div className="pembayaran-top-grid">
                <div className="rincian-card">
                  <h2>Rincian Pembayaran</h2>

                  <div className="rincian-list">
                    <div>
                      <strong>No Pendaftaran</strong>
                      <span>{nomorPendaftaran}</span>
                    </div>

                    <div>
                      <strong>Nama</strong>
                      <span>{nama}</span>
                    </div>

                    <div>
                      <strong>Jenis Pembayaran</strong>
                      <span>Biaya Pendaftaran</span>
                    </div>

                    <div>
                      <strong>Jumlah</strong>
                      <span className="nominal">
                        {FORMAT_RUPIAH(
                          pembayaran?.nominal || biayaPendaftaran
                        )}
                      </span>
                    </div>

                    <div>
                      <strong>Status</strong>

                      <span
                        className={`status-pembayaran ${
                          sudahDibayar
                            ? "status-lunas"
                            : statusMenunggu ||
                                statusMenungguVerifikasi
                              ? "status-menunggu"
                              : statusDitolak
                                ? "status-ditolak"
                                : "status-belum"
                        }`}
                      >
                        {statusTampilan}
                      </span>
                    </div>
                  </div>
                </div>

                {/* METODE PEMBAYARAN */}
                <div className="metode-card">
                  <h2>Metode Pembayaran</h2>

                  <button
                    type="button"
                    className={`metode-item ${
                      metodeAktif === "QRIS" ? "metode-active" : ""
                    }`}
                    onClick={() => pilihMetode("QRIS")}
                    disabled={!bolehPilihMetode}
                  >
                    <div className="metode-icon qris-icon">▦</div>

                    <div className="metode-info">
                      <strong>QRIS</strong>
                      <span>Simulasi pembayaran QRIS</span>
                    </div>

                    <span className="metode-demo-label">
                      DEMO
                    </span>

                    {metodeAktif === "QRIS" && (
                      <span className="metode-check">✓</span>
                    )}
                  </button>

                  <button
                    type="button"
                    className={`metode-item ${
                      metodeAktif === "VA" ? "metode-active" : ""
                    }`}
                    onClick={() => pilihMetode("VA")}
                    disabled={!bolehPilihMetode}
                  >
                    <div className="metode-icon va-icon">▤</div>

                    <div className="metode-info">
                      <strong>Virtual Account</strong>
                      <span>Nomor VA simulasi</span>
                    </div>

                    <span className="metode-demo-label">
                      DEMO
                    </span>

                    {metodeAktif === "VA" && (
                      <span className="metode-check">✓</span>
                    )}
                  </button>

                  <button
                    type="button"
                    className={`metode-item ${
                      metodeAktif === "TRANSFER"
                        ? "metode-active"
                        : ""
                    }`}
                    onClick={() => pilihMetode("TRANSFER")}
                    disabled={!bolehPilihMetode}
                  >
                    <div className="metode-icon transfer-icon">
                      ⇄
                    </div>

                    <div className="metode-info">
                      <strong>Transfer Bank</strong>
                      <span>
                        Transfer manual dan upload bukti
                      </span>
                    </div>

                    {metodeAktif === "TRANSFER" && (
                      <span className="metode-check">✓</span>
                    )}
                  </button>

                  {!bolehPilihMetode && pembayaran && (
                    <p className="metode-terkunci">
                      Metode pembayaran sudah dipilih untuk
                      tagihan ini.
                    </p>
                  )}
                </div>
              </div>

              {/* DETAIL TRANSAKSI */}
              {pembayaran && !sudahDibayar && (
                <div className="detail-transaksi">
                  <div className="detail-header">
                    <div>
                      <h2>Detail Transaksi</h2>
                      <p>
                        Nomor tagihan dan status pembayaran kamu.
                      </p>
                    </div>

                    <span className="status-menunggu">
                      {pembayaran.status}
                    </span>
                  </div>

                  <div className="detail-reference">
                    <span>Nomor Tagihan</span>
                    <strong>SPMB-{pembayaran.id}</strong>
                  </div>

                  <div className="detail-reference">
                    <span>Metode Pembayaran</span>
                    <strong>
                      {pembayaran.metode_pembayaran || "-"}
                    </strong>
                  </div>

                  {metodeTersimpan === "QRIS" && (
                    <div className="simulasi-card">
                      <div className="simulasi-heading">
                        <span className="simulasi-icon">▦</span>
                        <div>
                          <h3>QRIS Simulasi</h3>
                          <p>
                            Tampilan QR untuk demonstrasi proyek.
                          </p>
                        </div>
                      </div>

                      <div className="qr-demo">
                        <div className="qr-demo-pattern">
                          <span className="qr-corner qr-corner-one" />
                          <span className="qr-corner qr-corner-two" />
                          <span className="qr-corner qr-corner-three" />
                          <span className="qr-demo-center">DEMO</span>
                        </div>

                        <strong>QRIS SIMULASI</strong>
                        <small>
                          Bukan kode pembayaran sungguhan
                        </small>
                      </div>

                      <div className="simulasi-warning">
                        <strong>Perhatian:</strong> QR ini hanya
                        ilustrasi dan tidak dapat dipindai untuk
                        melakukan pembayaran.
                      </div>
                    </div>
                  )}

                  {metodeTersimpan === "VA" && (
                    <div className="simulasi-card">
                      <div className="simulasi-heading">
                        <span className="simulasi-icon">▤</span>
                        <div>
                          <h3>Virtual Account Simulasi</h3>
                          <p>
                            Nomor virtual account khusus demonstrasi.
                          </p>
                        </div>
                      </div>

                      <div className="va-demo">
                        <span>Nomor VA Demo</span>
                        <strong>{nomorVirtualAccount}</strong>
                        <small>
                          Nomor ini bukan rekening bank aktif.
                        </small>
                      </div>

                      <div className="simulasi-warning">
                        Nomor VA ini hanya untuk demonstrasi dan
                        tidak dapat digunakan untuk transfer.
                      </div>
                    </div>
                  )}

                  {pembayaran.payment_reference && (
                    <div className="detail-reference">
                      <span>Nomor Referensi</span>
                      <strong>
                        {pembayaran.payment_reference}
                      </strong>
                    </div>
                  )}

                  {pembayaran.va_number &&
                    metodeTersimpan !== "VA" && (
                      <div className="detail-reference">
                        <span>Nomor Virtual Account</span>
                        <strong>{pembayaran.va_number}</strong>
                      </div>
                    )}

                  {pembayaran.qr_url &&
                    metodeTersimpan !== "QRIS" && (
                      <div className="qr-section">
                        <p>Informasi QR pembayaran</p>
                        <img
                          src={pembayaran.qr_url}
                          alt="Informasi QR pembayaran"
                        />
                      </div>
                    )}

                  {pembayaran.payment_url && (
                    <a
                      href={pembayaran.payment_url}
                      className="link-gateway"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Buka Halaman Pembayaran
                    </a>
                  )}

                  {statusMenungguVerifikasi && (
                    <p className="masa-berlaku">
                      Bukti pembayaran telah dikirim dan sedang
                      diperiksa oleh admin.
                    </p>
                  )}

                  {bolehSimulasi && (
                    <div className="simulasi-action">
                      <p>
                        Tekan tombol di bawah untuk menyelesaikan
                        simulasi pembayaran.
                      </p>

                      <button
                        type="button"
                        className="simulasi-button"
                        onClick={simulasikanPembayaran}
                        disabled={simulasiLoading}
                      >
                        {simulasiLoading
                          ? "Memproses Simulasi..."
                          : "✓ Simulasikan Pembayaran"}
                      </button>

                      <small>
                        Status akan berubah menjadi Diterima untuk
                        keperluan demonstrasi.
                      </small>
                    </div>
                  )}

                  {metodeTersimpan === "TRANSFER" &&
                    statusMenunggu && (
                      <p className="masa-berlaku">
                        Silakan lakukan transfer ke rekening resmi
                        sekolah, kemudian unggah bukti pembayaran.
                      </p>
                    )}

                  <button
                    type="button"
                    className="cek-status-button"
                    onClick={cekStatusPembayaran}
                    disabled={loading}
                  >
                    {loading
                      ? "Memeriksa..."
                      : "↻ Cek Status Pembayaran"}
                  </button>
                </div>
              )}

              {/* PESAN */}
              {pesan && (
                <div className="pembayaran-success">
                  ✓ {pesan}
                </div>
              )}

              {error && (
                <div className="pembayaran-error">
                  {error}
                </div>
              )}

              {/* UPLOAD BUKTI TRANSFER */}
              {bolehUpload && (
                <div className="upload-bukti-card">
                  <div>
                    <h2>Upload Bukti Pembayaran</h2>

                    <p>
                      Setelah melakukan transfer ke rekening resmi
                      sekolah, unggah bukti pembayaran untuk
                      diperiksa oleh admin.
                    </p>
                  </div>

                  <form
                    className="upload-area"
                    onSubmit={uploadBukti}
                  >
                    <label
                      htmlFor="bukti-pembayaran"
                      className="upload-label"
                    >
                      <span className="upload-icon">⇧</span>

                      <strong>
                        {fileBukti
                          ? fileBukti.name
                          : "Pilih Bukti Pembayaran"}
                      </strong>

                      <small>
                        Format JPG, PNG, atau PDF. Maksimal 5 MB.
                      </small>
                    </label>

                    <input
                      id="bukti-pembayaran"
                      type="file"
                      accept="image/png,image/jpeg,application/pdf"
                      onChange={pilihFile}
                    />

                    <button
                      type="submit"
                      className="upload-button"
                      disabled={uploadLoading || !fileBukti}
                    >
                      {uploadLoading
                        ? "Mengunggah..."
                        : "Kirim Bukti"}
                    </button>
                  </form>
                </div>
              )}

              {/* INFORMASI REKENING */}
              {bolehUpload && (
                <div className="rekening-pembayaran">
                  <strong>Informasi Transfer Bank</strong>
                  <p>
                    Hubungi admin SPMB SMK Citra Negara untuk
                    memperoleh nomor rekening resmi sekolah.
                    Pastikan rekening tujuan sudah benar sebelum
                    melakukan transfer.
                  </p>
                </div>
              )}

              {/* TOTAL PEMBAYARAN */}
              <div className="pembayaran-bottom">
                <div className="total-info">
                  <span>Total Pembayaran</span>

                  <strong>
                    {FORMAT_RUPIAH(
                      pembayaran?.nominal || biayaPendaftaran
                    )}
                  </strong>
                </div>

                {perluTagihanBaru ? (
                  <button
                    type="button"
                    className="bayar-button"
                    onClick={bayarSekarang}
                    disabled={prosesBayar}
                  >
                    {prosesBayar
                      ? "Memproses..."
                      : pembayaran
                        ? "Buat Tagihan Baru"
                        : "Buat Tagihan"}
                  </button>
                ) : sudahDibayar ? (
                  <div className="lunas-message">
                    <span>✓</span>
                    Pembayaran Berhasil
                  </div>
                ) : statusMenungguVerifikasi ? (
                  <div className="lunas-message menunggu-message">
                    Menunggu Verifikasi Admin
                  </div>
                ) : (
                  <button
                    type="button"
                    className="bayar-button"
                    onClick={cekStatusPembayaran}
                    disabled={loading}
                  >
                    {loading
                      ? "Memeriksa..."
                      : "↻ Periksa Status"}
                  </button>
                )}
              </div>
            </div>
          )}

          {/* TAHAP SELANJUTNYA */}
          <div className="tahap-selanjutnya">
            <div className="tahap-icon">📝</div>

            <div className="tahap-info">
              <h3>Tes Potensi Akademik (TPA)</h3>

              <p>
                Tes TPA dapat diakses setelah pembayaran
                formulir sebesar Rp150.000 terverifikasi.
              </p>
            </div>

            {sudahDibayar ? (
              <Link
                href="/calon-siswa/tes-tpa"
                className="tahap-button"
              >
                Mulai Tes TPA →
              </Link>
            ) : (
              <span className="tahap-button tahap-disabled">
                Terkunci 🔒
              </span>
            )}
          </div>

          {/* TAGIHAN PPDB */}
          <div className="tagihan-ppdb">
            <div className="tagihan-icon">▤</div>

            <div>
              <h3>Pembayaran PPDB</h3>

              <p>
                Tagihan PPDB merupakan pembayaran terpisah
                yang akan tersedia pada tahap berikutnya.
              </p>

              <span>Belum tersedia</span>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

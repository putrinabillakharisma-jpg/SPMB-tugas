
"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import "./calon.css";

/* ---------- Icons ---------- */
type IconName =
  | "home"
  | "user"
  | "clipboard"
  | "search"
  | "folder"
  | "report"
  | "wallet"
  | "logout"
  | "check"
  | "chevron"
  | "info"
  | "doc"
  | "card"
  | "pen";

const ICONS: Record<IconName, string> = {
  home: "M3 11l9-8 9 8v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1z",
  user: "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zm-8 9a8 8 0 0 1 16 0z",
  clipboard:
    "M9 4h6v3H9zM7 5H5a1 1 0 0 0-1 1v14a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1V6a1 1 0 0 0-1-1h-2m-9 8l2 2 4-4",
  search: "M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16zm10 2l-5-5",
  folder:
    "M3 6a1 1 0 0 1 1-1h5l2 2h9a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1z",
  report:
    "M9 4h6v3H9zM7 5H5a1 1 0 0 0-1 1v14a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1V6a1 1 0 0 0-1-1h-2m-9 7h6m-6 4h6",
  wallet:
    "M4 7h14a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2zm0 0l11-3v3m3 6h2",
  logout:
    "M10 4H5a1 1 0 0 0-1 1v14a1 1 0 0 0 1 1h5m5-4l4-4-4-4m4 4H9",
  check: "M5 12l5 5 9-10",
  chevron: "M6 9l6 6 6-6",
  info: "M12 11v6m0-10v.01M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z",
  doc: "M7 3h7l5 5v13H7zM14 3v5h5m-9 6l2 2 4-4",
  card: "M3 6h18v12H3zm0 4h18m-14 5h4",
  pen: "M4 20h4L19 9l-4-4L4 16zm10-14l4 4",
};

function Icon({
  name,
  size = 20,
  stroke = 2,
}: {
  name: IconName;
  size?: number;
  stroke?: number;
}) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={stroke}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={ICONS[name]} />
    </svg>
  );
}

/* ---------- Menu ---------- */
const MENU: {
  label: string;
  href: string;
  icon: IconName;
  active?: boolean;
}[] = [
  { label: "Beranda", href: "/calon-siswa", icon: "home", active: true },
  { label: "Data Diri", href: "/calon-siswa/data-diri", icon: "user" },
  {
    label: "Pilihan Jurusan",
    href: "/calon-siswa/pilihan-jurusan",
    icon: "search",
  },
  { label: "Pembayaran", href: "/calon-siswa/pembayaran", icon: "wallet" },
  { label: "Tes TPA", href: "/calon-siswa/tes-tpa", icon: "clipboard" },
  {
    label: "Upload Dokumen",
    href: "/calon-siswa/upload-dokumen",
    icon: "folder",
  },
  { label: "Laporan", href: "/calon-siswa/laporan", icon: "report" },
];

/* ---------- Types ---------- */
type CalonSiswa = {
  id: number;
  nama: string;
  email: string;
  nisn: string;
  whatsapp: string;
  created_at: string;
};

type StepStatus = "done" | "progress" | "todo";

type ProgressData = {
  dataDiri: StepStatus;
  pilihanJurusan: StepStatus;
  pembayaran: StepStatus;
  tesTPA: StepStatus;
  laporanDokumen: StepStatus;
};

type Step = {
  label: string;
  status: StepStatus;
  icon: IconName;
  href: string;
};

const STATUS_TEXT: Record<StepStatus, string> = {
  done: "Selesai",
  progress: "Dalam Proses",
  todo: "Belum Mulai",
};

const DEFAULT_PROGRESS: ProgressData = {
  dataDiri: "todo",
  pilihanJurusan: "todo",
  pembayaran: "todo",
  tesTPA: "todo",
  laporanDokumen: "todo",
};

/* ---------- Page ---------- */
export default function CalonSiswaBerandaPage() {
  const router = useRouter();

  const [siswa, setSiswa] = useState<CalonSiswa | null>(null);
  const [progress, setProgress] =
    useState<ProgressData>(DEFAULT_PROGRESS);

  const [loading, setLoading] = useState(true);
  const [progressLoading, setProgressLoading] = useState(true);
  const [logoutLoading, setLogoutLoading] = useState(false);

  /* ---------- Mengambil Profil ---------- */
  useEffect(() => {
    let aktif = true;

    async function getProfil() {
      try {
        const response = await fetch("/api/calon-siswa/profil", {
          method: "GET",
          cache: "no-store",
        });

        const result = await response.json();

        if (!aktif) return;

        if (!response.ok || !result.success) {
          router.replace("/login");
          return;
        }

        setSiswa(result.data);
      } catch (error) {
        console.error("Gagal mengambil profil:", error);

        if (aktif) {
          alert("Tidak dapat mengambil data profil. Silakan coba lagi.");
        }
      } finally {
        if (aktif) {
          setLoading(false);
        }
      }
    }

    getProfil();

    return () => {
      aktif = false;
    };
  }, [router]);

  /* ---------- Mengambil Progress ---------- */
  useEffect(() => {
    let aktif = true;

    async function getProgress() {
      try {
        const response = await fetch("/api/calon-siswa/progress", {
          method: "GET",
          cache: "no-store",
        });

        const result = await response.json();

        if (!aktif) return;

        if (!response.ok || !result.success) {
          console.error(
            "Gagal mengambil progress:",
            result.message
          );
          return;
        }

        const data = result.data;

        const validStatus = (value: unknown): StepStatus => {
          if (
            value === "done" ||
            value === "progress" ||
            value === "todo"
          ) {
            return value;
          }

          return "todo";
        };

        setProgress({
          dataDiri: validStatus(data.dataDiri),
          pilihanJurusan: validStatus(data.pilihanJurusan),
          pembayaran: validStatus(data.pembayaran),
          tesTPA: validStatus(data.tesTPA),
          laporanDokumen: validStatus(data.laporanDokumen),
        });
      } catch (error) {
        console.error("Gagal mengambil progress:", error);
      } finally {
        if (aktif) {
          setProgressLoading(false);
        }
      }
    }

    getProgress();

    return () => {
      aktif = false;
    };
  }, []);

  /* ---------- Logout ---------- */
  async function handleLogout() {
    const yakin = window.confirm("Apakah kamu yakin ingin logout?");

    if (!yakin) return;

    try {
      setLogoutLoading(true);

      const response = await fetch("/api/logout", {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("Logout gagal");
      }

      router.replace("/login");
      router.refresh();
    } catch (error) {
      console.error("Logout error:", error);
      alert("Logout gagal. Silakan coba kembali.");
      setLogoutLoading(false);
    }
  }

  /* ---------- Stepper ---------- */
  const STEPS: Step[] = [
    {
      label: "Data Diri",
      status: progress.dataDiri,
      icon: "user",
      href: "/calon-siswa/data-diri",
    },
    {
      label: "Pilihan Jurusan",
      status: progress.pilihanJurusan,
      icon: "search",
      href: "/calon-siswa/pilihan-jurusan",
    },
    {
      label: "Pembayaran",
      status: progress.pembayaran,
      icon: "card",
      href: "/calon-siswa/pembayaran",
    },
    {
      label: "Tes TPA",
      status: progress.tesTPA,
      icon: "clipboard",
      href: "/calon-siswa/tes-tpa",
    },
    {
      label: "Laporan",
      status: progress.laporanDokumen,
      icon: "report",
      href: "/calon-siswa/laporan",
    },
  ];

  const namaSiswa = siswa?.nama || "Calon Siswa";

  return (
    <div className="calon-layout">
      {/* Sidebar */}
      <aside className="calon-sidebar">
        <div className="calon-brand">
          <div className="calon-brand__logo">SMK</div>

          <div>
            <div className="calon-brand__title">SPMB</div>
            <div className="calon-brand__sub">SMK Citra Negara</div>
          </div>
        </div>

        <nav className="calon-nav">
          {MENU.map((m) => (
            <Link
              key={m.label}
              href={m.href}
              className={`calon-nav__item ${m.active ? "is-active" : ""}`}
            >
              <Icon name={m.icon} size={22} />
              <span>{m.label}</span>
            </Link>
          ))}
        </nav>

        <button
          className="calon-logout"
          onClick={handleLogout}
          disabled={logoutLoading}
        >
          <Icon name="logout" size={22} />
          <span>
            {logoutLoading ? "Sedang Logout..." : "Logout"}
          </span>
        </button>
      </aside>

      {/* Main */}
      <div className="calon-main">
        <header className="calon-topbar">
          <div className="calon-profile">
            <span className="calon-profile__avatar">
              <Icon name="user" size={22} />
            </span>

            <span className="calon-profile__name">
              {loading ? "Memuat profil..." : namaSiswa}
            </span>

            <Icon name="chevron" size={18} />
          </div>
        </header>

        <main className="calon-content">
          {/* Hero */}
          <section className="calon-hero">
            <div className="calon-hero__text">
              <h1 className="calon-hero__greet">
                Hallo, <span>{loading ? "..." : namaSiswa}</span>{" "}
                <span className="calon-wave">👋</span>
              </h1>

              <p className="calon-hero__desc">
                Selamat datang di portal pendaftaran SPMB
                <br />
                SMK Citra Negara, Lengkapi semua Tahapan
                <br />
                Untuk melanjutkan proses pendaftaran
              </p>

              {!loading && siswa && (
                <p style={{ marginTop: "12px" }}>
                  NISN: <strong>{siswa.nisn}</strong>
                </p>
              )}
            </div>

            <div className="calon-hero__img">
              <Image
                src="/images/siswa-hero.png"
                alt="Ilustrasi siswa"
                width={150}
                height={150}
                priority
              />
            </div>
          </section>

          {/* Stepper */}
          <section
            className="calon-steps"
            aria-label="Tahapan pendaftaran"
          >
            {progressLoading ? (
              <p>Memuat tahapan pendaftaran...</p>
            ) : (
              STEPS.map((step, index) => (
                <div key={step.label} className="calon-step">
                  <Link
                    href={step.href}
                    className={`calon-step__circle is-${step.status}`}
                    aria-label={`Buka ${step.label}`}
                    title={`Buka ${step.label}`}
                  >
                    {step.status === "done" ? (
                      <Icon name="check" size={38} stroke={1.6} />
                    ) : (
                      <Icon name={step.icon} size={30} stroke={1.8} />
                    )}
                  </Link>

                  <div className="calon-step__label">
                    {step.label}
                  </div>

                  <div className={`calon-step__status is-${step.status}`}>
                    {STATUS_TEXT[step.status]}
                  </div>

                  {index < STEPS.length - 1 && (
                    <span
                      className="calon-step__dot"
                      aria-hidden="true"
                    />
                  )}
                </div>
              ))
            )}
          </section>

          {/* Info Banner */}
          <section className="calon-banner" role="note">
            <div className="calon-banner__left">
              <span className="calon-banner__icon">
                <Icon name="info" size={38} stroke={2.4} />
              </span>

              <p>
                Jangan lupa untuk selalu memeriksa informasi terbaru
                <br />
                melalui menu laporan
              </p>
            </div>

            <Link
              href="/calon-siswa/laporan"
              className="calon-banner__btn"
            >
              Lihat Laporan
            </Link>
          </section>
        </main>
      </div>
    </div>
  );
}

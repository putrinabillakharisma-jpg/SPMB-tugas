import Image from "next/image";
import Link from "next/link";
import "./calon.css";

/* ---------- Icons ---------- */
type IconName =
  | "home" | "user" | "clipboard" | "search" | "folder" | "report" | "wallet"
  | "logout" | "check" | "chevron" | "info" | "doc" | "card" | "pen";

const ICONS: Record<IconName, string> = {
  home: "M3 11l9-8 9 8v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1z",
  user: "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zm-8 9a8 8 0 0 1 16 0z",
  clipboard: "M9 4h6v3H9zM7 5H5a1 1 0 0 0-1 1v14a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1V6a1 1 0 0 0-1-1h-2m-9 8l2 2 4-4",
  search: "M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16zm10 2l-5-5",
  folder: "M3 6a1 1 0 0 1 1-1h5l2 2h9a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1z",
  report: "M9 4h6v3H9zM7 5H5a1 1 0 0 0-1 1v14a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1V6a1 1 0 0 0-1-1h-2m-9 7h6m-6 4h6",
  wallet: "M4 7h14a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2zm0 0l11-3v3m3 6h2",
  logout: "M10 4H5a1 1 0 0 0-1 1v14a1 1 0 0 0 1 1h5m5-4l4-4-4-4m4 4H9",
  check: "M5 12l5 5 9-10",
  chevron: "M6 9l6 6 6-6",
  info: "M12 11v6m0-10v.01M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z",
  doc: "M7 3h7l5 5v13H7zM14 3v5h5m-9 6l2 2 4-4",
  card: "M3 6h18v12H3zm0 4h18m-14 5h4",
  pen: "M4 20h4L19 9l-4-4L4 16zm10-14l4 4",
};

function Icon({ name, size = 20, stroke = 2 }: { name: IconName; size?: number; stroke?: number }) {
  return (
    <svg
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

/* ---------- Data ---------- */
const MENU: { label: string; href: string; icon: IconName; active?: boolean }[] = [
  { label: "Beranda", href: "/calon-siswa", icon: "home", active: true },
  { label: "Data Diri", href: "/calon-siswa/data-diri", icon: "user" },
  { label: "Tes TPA", href: "/calon-siswa/tes-tpa", icon: "clipboard" },
  { label: "Pilihan Jurusan", href: "/calon-siswa/pilihan-jurusan", icon: "search" },
  { label: "Upload Dokumen", href: "/calon-siswa/upload-dokumen", icon: "folder" },
  { label: "Laporan", href: "/calon-siswa/laporan", icon: "report" },
  { label: "Pembayaran", href: "/calon-siswa/pembayaran", icon: "wallet" },
];

type StepStatus = "done" | "progress" | "todo";

const STEPS: { label: string; status: StepStatus; icon: IconName }[] = [
  { label: "Data Diri", status: "done", icon: "check" },
  { label: "Tes TPA", status: "done", icon: "check" },
  { label: "Pilihan Jurusan", status: "progress", icon: "pen" },
  { label: "Laporan Dokumen", status: "todo", icon: "doc" },
  { label: "Pembayaran", status: "todo", icon: "card" },
];

const STATUS_TEXT: Record<StepStatus, string> = {
  done: "Selesai",
  progress: "Dalam Proses",
  todo: "Belum Mulai",
};

/* ---------- Page ---------- */
export default function CalonSiswaBerandaPage() {
  const namaSiswa = "Alya Putri"; // ganti dengan data sesi / API

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

        <button className="calon-logout">
          <Icon name="logout" size={22} />
          <span>Logout</span>
        </button>
      </aside>

      {/* Main */}
      <div className="calon-main">
        <header className="calon-topbar">
          <div className="calon-profile">
            <span className="calon-profile__avatar">
              <Icon name="user" size={22} />
            </span>
            <span className="calon-profile__name">{namaSiswa.toLowerCase().replace(/^./, (c) => c.toUpperCase())}</span>
            <Icon name="chevron" size={18} />
          </div>
        </header>

        <main className="calon-content">
          {/* Hero */}
          <section className="calon-hero">
            <div className="calon-hero__text">
              <h1 className="calon-hero__greet">
                Hallo, <span>{namaSiswa}</span> <span className="calon-wave">👋</span>
              </h1>
              <p className="calon-hero__desc">
                Selamat datang di portal pendaftaran SPMB
                <br />
                SMK Citra Negara, Lengkapi semua Tahapan
                <br />
                Untuk melanjutkan proses pendaftaran
              </p>
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
          <section className="calon-steps" aria-label="Tahapan pendaftaran">
            {STEPS.map((s, i) => (
              <div key={s.label} className="calon-step">
                <div className={`calon-step__circle is-${s.status}`}>
                  <Icon name={s.icon} size={s.status === "done" ? 38 : 30} stroke={s.status === "done" ? 1.6 : 1.8} />
                </div>
                <div className="calon-step__label">{s.label}</div>
                <div className={`calon-step__status is-${s.status}`}>{STATUS_TEXT[s.status]}</div>
                {i < STEPS.length - 1 && <span className="calon-step__dot" aria-hidden="true" />}
              </div>
            ))}
          </section>

          {/* Info banner */}
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
            <Link href="/calon-siswa/laporan" className="calon-banner__btn">
              Lihat Laporan
            </Link>
          </section>
        </main>
      </div>
    </div>
  );
}

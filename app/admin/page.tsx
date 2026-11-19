
"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import "./admin.css";

type DashboardData = {
  success: boolean;
  stats: {
    totalCalonSiswa: number;
  };
  recent: {
    id: number;
    nama: string;
    email: string;
    tanggal: string | null;
  }[];
  monthly: {
    periode: string;
    total: number;
  }[];
};

type MenuItem = {
  key: string;
  label: string;
  icon: string;
  children: {
    label: string;
    href: string;
  }[];
};

const menu: MenuItem[] = [
  {
    key: "siswa",
    label: "Calon Siswa",
    icon: "user",
    children: [
      {
        label: "Kelola Data Calon Siswa",
        href: "/admin/calon-siswa",
      },
      {
        label: "Tambah Calon Siswa",
        href: "/register",
      },
    ],
  },
  {
  key: "pembayaran",
  label: "Pembayaran",
  icon: "doc",
  children: [
    {
      label: "Verifikasi Pembayaran",
      href: "/admin/pembayaran",
    },
  ],
},
  {
    key: "tpa",
    label: "Tes TPA",
    icon: "tpa",
    children: [
      {
        label: "Kelola Tes TPA",
        href: "/admin/tes-tpa",
      },
      {
        label: "Lihat Hasil",
        href: "/admin/tes-tpa/hasil",
      },
    ],
  },
  {
    key: "seleksi",
    label: "Seleksi Calon Siswa",
    icon: "group",
    children: [
      {
        label: "Verifikasi Berkas",
        href: "/admin/verifikasi-berkas",
      },
      {
        label: "Hasil Seleksi",
        href: "/admin/hasil-seleksi",
      },
    ],
  },
  {
    key: "laporan",
    label: "Laporan Dokumen",
    icon: "doc",
    children: [
      {
        label: "Data Dokumen",
        href: "/admin/dokumen",
      },
      {
        label: "Unduh Laporan",
        href: "/admin/laporan",
      },
    ],
  },
];

const bulanNama = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "Mei",
  "Jun",
  "Jul",
  "Agu",
  "Sep",
  "Okt",
  "Nov",
  "Des",
];

function Icon({ name }: { name: string }) {
  const props = {
    width: 22,
    height: 22,
    viewBox: "0 0 24 24",
    fill: "currentColor",
    "aria-hidden": true as const,
  };

  switch (name) {
    case "home":
      return (
        <svg {...props}>
          <path d="M12 3 2 12h3v8h5v-5h4v5h5v-8h3L12 3z" />
        </svg>
      );

    case "user":
      return (
        <svg {...props}>
          <circle cx="12" cy="8" r="4.5" />
          <path d="M3.5 21c0-4.5 3.8-7 8.5-7s8.5 2.5 8.5 7H3.5z" />
        </svg>
      );

    case "group":
      return (
        <svg {...props}>
          <circle cx="9" cy="8" r="3.8" />
          <path d="M1.5 20c0-3.9 3.2-6 7.5-6s7.5 2.1 7.5 6h-15z" />
          <circle cx="17.5" cy="8.5" r="3" />
          <path d="M17.5 14c3.2 0 5 1.7 5 4.5V20h-4.5c0-2.3-.7-4.2-2-5.4.4-.4 1-.6 1.5-.6z" />
        </svg>
      );

    case "tpa":
      return (
        <svg {...props}>
          <path d="M5 2h14a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2zm1.5 5.5v1.8h11V7.5h-11zm0 4v1.8h11v-1.8h-11zm0 4v1.8h7v-1.8h-7z" />
        </svg>
      );

    case "doc":
      return (
        <svg {...props}>
          <path d="M6 2h8l6 6v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2zm7 1.5V9h5.5L13 3.5z" />
        </svg>
      );

    case "logout":
      return (
        <svg
          {...props}
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
          <path d="m16 17 5-5-5-5" />
          <path d="M21 12H9" />
        </svg>
      );

    case "chevron":
      return (
        <svg
          {...props}
          width={18}
          height={18}
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      );

    case "bell":
      return (
        <svg
          {...props}
          width={26}
          height={26}
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
          <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
        </svg>
      );

    case "avatar":
      return (
        <svg
          width={34}
          height={34}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="10" />
          <circle cx="12" cy="10" r="3.2" />
          <path d="M5.8 19c1.2-2.6 3.5-4 6.2-4s5 1.4 6.2 4" />
        </svg>
      );

    default:
      return null;
  }
}

function LineChart({
  chartData,
}: {
  chartData: { bulan: string; short: string; daftar: number }[];
}) {
  const W = 600;
  const H = 180;
  const padL = 38;
  const padB = 25;
  const padT = 10;

  const max = Math.max(
    5,
    ...chartData.map((item) => item.daftar)
  );

  const stepX =
    chartData.length > 1
      ? (W - padL - 10) / (chartData.length - 1)
      : 0;

  const x = (i: number) =>
    chartData.length === 1
      ? W / 2
      : padL + i * stepX;

  const y = (value: number) =>
    padT +
    (H - padT - padB) * (1 - value / max);

  const line = chartData
    .map(
      (item, i) =>
        `${i === 0 ? "M" : "L"}${x(i)},${y(item.daftar)}`
    )
    .join(" ");

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="chart-svg"
      role="img"
      aria-label="Grafik pendaftaran calon siswa"
    >
      {[0, 0.25, 0.5, 0.75, 1].map((fraction) => {
        const value = Math.round(max * fraction);
        const yPos = y(value);

        return (
          <g key={fraction}>
            <line
              x1={padL}
              x2={W - 6}
              y1={yPos}
              y2={yPos}
              className="chart-grid"
            />
            <text
              x={padL - 7}
              y={yPos + 3}
              textAnchor="end"
              className="chart-label"
            >
              {value}
            </text>
          </g>
        );
      })}

      {chartData.length > 0 && (
        <>
          <path
            d={line}
            className="chart-line chart-line--blue"
          />

          {chartData.map((item, i) => (
            <g key={item.bulan}>
              <circle
                cx={x(i)}
                cy={y(item.daftar)}
                r={3}
                className="chart-dot chart-dot--blue"
              />
              <text
                x={x(i)}
                y={H - 4}
                textAnchor="middle"
                className="chart-label"
              >
                {item.short}
              </text>
            </g>
          ))}
        </>
      )}
    </svg>
  );
}

export default function AdminPage() {
  const router = useRouter();

  const [open, setOpen] = useState<Record<string, boolean>>({
    siswa: false,
    tpa: false,
    seleksi: false,
    laporan: false,
  });

  const [sidebarHidden, setSidebarHidden] = useState(false);

  const [dashboard, setDashboard] =
    useState<DashboardData | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [logoutLoading, setLogoutLoading] = useState(false);

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/admin/dashboard", {
        method: "GET",
        cache: "no-store",
        credentials: "same-origin",
      });

      const result = await response.json();

      if (response.status === 401) {
        router.replace("/login");
        return;
      }

      if (response.status === 403) {
        throw new Error("Halaman ini hanya dapat diakses admin.");
      }

      if (!response.ok) {
        throw new Error(
          result.message || "Gagal mengambil data dashboard."
        );
      }

      setDashboard(result);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Terjadi kesalahan saat memuat dashboard."
      );
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    void loadDashboard();
  }, [loadDashboard]);

  const toggle = (key: string) => {
    setOpen((previous) => ({
      ...previous,
      [key]: !previous[key],
    }));
  };

  async function handleLogout() {
    const yakin = window.confirm(
      "Apakah kamu yakin ingin keluar dari akun admin?"
    );

    if (!yakin) return;

    setLogoutLoading(true);

    try {
      // Sesuaikan dengan endpoint logout yang ada di project.
      const response = await fetch("/api/logout", {
        method: "POST",
        credentials: "same-origin",
      });

      if (!response.ok) {
        throw new Error(
          "Logout gagal. Periksa endpoint /api/logout."
        );
      }

      router.replace("/login");
      router.refresh();
    } catch (err) {
      window.alert(
        err instanceof Error
          ? err.message
          : "Terjadi kesalahan saat logout."
      );
    } finally {
      setLogoutLoading(false);
    }
  }

  const chartData = (dashboard?.monthly ?? []).map((item) => {
    const [year, month] = item.periode.split("-").map(Number);

    return {
      bulan: item.periode,
      short: `${bulanNama[month - 1] ?? ""} ${String(year).slice(-2)}`,
      daftar: item.total,
    };
  });

  const stats = [
    {
      label: "Total Calon Siswa",
      value: dashboard?.stats.totalCalonSiswa ?? null,
      tone: "blue",
    },
    {
      label: "Sudah Tes TPA",
      value: null,
      tone: "green",
    },
    {
      label: "Lolos Seleksi",
      value: null,
      tone: "purple",
    },
    {
      label: "Dokumen Lengkap",
      value: null,
      tone: "yellow",
    },
  ];

  const quickActions = [
    {
      label: "Tambah Calon Siswa",
      tone: "blue",
      href: "/register",
    },
    {
      label: "Verifikasi Berkas",
      tone: "green",
      href: "/admin/verifikasi-berkas",
    },
    {
      label: "Kelola Tes TPA",
      tone: "purple",
      href: "/admin/tes-tpa",
    },
    {
      label: "Unduh Laporan",
      tone: "yellow",
      href: "/admin/laporan",
    },
  ];

  return (
    <div
      className={`admin ${
        sidebarHidden ? "admin--collapsed" : ""
      }`}
    >
      <aside className="sidebar">
        <div className="sidebar__brand">
          <Image
            src="/asset/logo cn.png"
            alt="Logo SMK Citra Negara"
            width={60}
            height={60}
            className="sidebar__logo"
          />

          <div>
            <h1 className="sidebar__title">SPMB</h1>
            <p className="sidebar__subtitle">
              SMK Citra Negara
            </p>
          </div>
        </div>

        <nav className="sidebar__nav">
          <a
            href="/admin"
            className="nav-item nav-item--active"
            aria-current="page"
          >
            <Icon name="home" />
            <span>Dashboard</span>
          </a>

          {menu.map((item) => (
            <div className="nav-group" key={item.key}>
              <button
                type="button"
                className="nav-item nav-item--button"
                onClick={() => toggle(item.key)}
                aria-expanded={open[item.key]}
              >
                <Icon name={item.icon} />
                <span>{item.label}</span>

                <span
                  className={`nav-item__chevron ${
                    open[item.key] ? "is-open" : ""
                  }`}
                >
                  <Icon name="chevron" />
                </span>
              </button>

              {open[item.key] && (
                <ul className="nav-sub">
                  {item.children.map((child) => (
                    <li key={child.href}>
                      <a href={child.href}>
                        {child.label}
                      </a>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}

          <button
            type="button"
            className="nav-item nav-item--logout"
            onClick={handleLogout}
            disabled={logoutLoading}
          >
            <Icon name="logout" />
            <span>
              {logoutLoading ? "Memproses..." : "Logout"}
            </span>
          </button>
        </nav>
      </aside>

      <div className="main">
        <header className="topbar">
          <div className="topbar__left">
            <button
              type="button"
              className="topbar__burger"
              aria-label="Buka atau tutup sidebar"
              aria-expanded={!sidebarHidden}
              onClick={() =>
                setSidebarHidden((previous) => !previous)
              }
            >
              <span />
              <span />
              <span />
            </button>

            <h2 className="topbar__title">
              Dashboard Admin
            </h2>
          </div>

          <div className="topbar__right">
            <button
              type="button"
              className="topbar__bell"
              aria-label="Muat ulang data dashboard"
              onClick={() => void loadDashboard()}
              disabled={loading}
              title="Muat ulang data"
            >
              <Icon name="bell" />
            </button>

            <button
              type="button"
              className="topbar__user"
              onClick={() => void loadDashboard()}
              title="Klik untuk memuat ulang data"
            >
              <Icon name="avatar" />
              <span>Admin</span>
              <Icon name="chevron" />
            </button>
          </div>
        </header>

        <main className="content">
          <section className="banner">
            <div className="banner__img">
              <Image
                src="/asset/jurusan.png"
                alt="Gedung SMK Citra Negara"
                fill
                sizes="300px"
                style={{
                  objectFit: "cover",
                  objectPosition: "left bottom",
                }}
              />
            </div>

            <div className="banner__text">
              <div className="banner__wave" aria-hidden="true">
                👋
              </div>

              <div>
                <h3>Selamat Datang, Admin!</h3>
                <p>
                  Kelola data pendaftaran SPMB dengan mudah
                  dan efisien.
                </p>
                <p>SMK Citra Negara</p>
              </div>
            </div>
          </section>

          {error && (
            <section
              className="panel"
              role="alert"
              style={{ marginBottom: 20 }}
            >
              <h4>Data dashboard belum berhasil dimuat</h4>
              <p>{error}</p>

              <button
                type="button"
                onClick={() => void loadDashboard()}
              >
                Coba Lagi
              </button>
            </section>
          )}

          <section className="stats">
            {stats.map((stat) => (
              <article
                className="stat-card"
                key={stat.label}
              >
                <div className="stat-card__head">
                  <span
                    className={`stat-card__icon stat-card__icon--${stat.tone}`}
                  />
                  <span className="stat-card__label">
                    {stat.label}
                  </span>
                </div>

                <strong className="stat-card__value">
                  {loading && stat.value === null
                    ? "Memuat..."
                    : stat.value === null
                      ? "Belum tersedia"
                      : stat.value.toLocaleString("id-ID")}
                </strong>
              </article>
            ))}
          </section>

          <section className="row">
            <article className="panel panel--chart">
              <div className="panel__head">
                <h4>Statistik Pendaftaran</h4>

                <div className="legend">
                  <span>
                    <i className="legend__dot legend__dot--blue" />
                    Pendaftar
                  </span>
                </div>
              </div>

              {loading ? (
                <p>Memuat grafik pendaftaran...</p>
              ) : chartData.length === 0 ? (
                <p>
                  Belum ada data pendaftaran pada periode
                  grafik yang tersedia.
                </p>
              ) : (
                <>
                  <LineChart chartData={chartData} />

                  <div className="table-wrap">
                    <table className="mini-table">
                      <thead>
                        <tr>
                          <th>Bulan</th>
                          <th>Pendaftar</th>
                        </tr>
                      </thead>

                      <tbody>
                        {chartData.map((item) => (
                          <tr key={item.bulan}>
                            <td>{item.bulan}</td>
                            <td>
                              {item.daftar.toLocaleString("id-ID")}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </article>

            <article className="panel panel--quick">
              <h4>Aksi Cepat</h4>

              <div className="quick-grid">
                {quickActions.map((action) => (
                  <button
                    type="button"
                    key={action.label}
                    className={`quick quick--${action.tone}`}
                    onClick={() => router.push(action.href)}
                  >
                    {action.label}
                  </button>
                ))}
              </div>
            </article>
          </section>

          <section className="panel panel--recent">
            <div className="panel__head panel__head--icon">
              <Icon name="group" />
              <h4>Pendaftaran Terbaru</h4>
            </div>

            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>No</th>
                    <th>Nama Calon Siswa</th>
                    <th>NISN</th>
                    <th>Tanggal Daftar</th>
                  </tr>
                </thead>

                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={4}>
                        Memuat data calon siswa...
                      </td>
                    </tr>
                  ) : error ? (
                    <tr>
                      <td colSpan={4}>
                        Data belum dapat ditampilkan.
                      </td>
                    </tr>
                  ) : !dashboard?.recent.length ? (
                    <tr>
                      <td colSpan={4}>
                        Belum ada calon siswa terdaftar.
                      </td>
                    </tr>
                  ) : (
                    dashboard.recent.map((siswa, index) => (
                      <tr key={siswa.id}>
                        <td>{index + 1}</td>
                        <td>{siswa.nama}</td>
                        <td>{siswa.email}</td>
                        <td className="table__date">
                          {siswa.tanggal
                            ? new Date(
                                siswa.tanggal
                              ).toLocaleDateString("id-ID", {
                                day: "2-digit",
                                month: "long",
                                year: "numeric",
                                timeZone: "Asia/Jakarta",
                              })
                            : "-"}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}

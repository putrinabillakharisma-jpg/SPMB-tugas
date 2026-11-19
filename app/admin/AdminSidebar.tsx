
"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";

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
        href: "/admin/calon-siswa?tambah=1",
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
      { label: "Kelola Tes TPA", href: "/admin/tes-tpa" },
      { label: "Lihat Hasil", href: "/admin/tes-tpa/hasil" },
    ],
  },
  {
    key: "seleksi",
    label: "Seleksi Calon Siswa",
    icon: "group",
    children: [
      { label: "Verifikasi Berkas", href: "/admin/verifikasi-berkas" },
      { label: "Hasil Seleksi", href: "/admin/hasil-seleksi" },
    ],
  },
  {
    key: "laporan",
    label: "Laporan Dokumen",
    icon: "doc",
    children: [
      { label: "Data Dokumen", href: "/admin/dokumen" },
      { label: "Unduh Laporan", href: "/admin/laporan" },
    ],
  },
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

    default:
      return null;
  }
}

export default function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const [open, setOpen] = useState<Record<string, boolean>>({
    siswa: pathname.startsWith("/admin/calon-siswa"),
    tpa: pathname.startsWith("/admin/tes-tpa"),
    seleksi:
      pathname.startsWith("/admin/seleksi/verifikasi-berkas") ||
      pathname.startsWith("/admin/hasil-seleksi"),
    laporan:
      pathname.startsWith("/admin/laporan-admin/data-dokumen") ||
      pathname.startsWith("/admin/laporan"),
  });

  const [logoutLoading, setLogoutLoading] = useState(false);

  async function handleLogout() {
    if (
      !window.confirm("Apakah kamu yakin ingin keluar dari akun admin?")
    ) {
      return;
    }

    setLogoutLoading(true);

    try {
      const response = await fetch("/api/logout", {
        method: "POST",
        credentials: "same-origin",
      });

      if (!response.ok) {
        throw new Error("Logout gagal. Periksa endpoint /api/logout.");
      }

      router.replace("/login");
      router.refresh();
    } catch (error) {
      window.alert(
        error instanceof Error
          ? error.message
          : "Terjadi kesalahan saat logout."
      );
    } finally {
      setLogoutLoading(false);
    }
  }

  return (
    <aside className="sidebar">
      <div className="sidebar__brand">
        <img
          src="/asset/logo cn.png"
          alt="Logo SMK Citra Negara"
          width={60}
          height={60}
          className="sidebar__logo"
        />

        <div>
          <h1 className="sidebar__title">SPMB</h1>
          <p className="sidebar__subtitle">SMK Citra Negara</p>
        </div>
      </div>

      <nav className="sidebar__nav">
        <a
          href="/admin"
          className={`nav-item ${
            pathname === "/admin" ? "nav-item--active" : ""
          }`}
          aria-current={pathname === "/admin" ? "page" : undefined}
        >
          <Icon name="home" />
          <span>Dashboard</span>
        </a>

        {menu.map((item) => (
          <div className="nav-group" key={item.key}>
            <button
              type="button"
              className="nav-item nav-item--button"
              onClick={() =>
                setOpen((previous) => ({
                  ...previous,
                  [item.key]: !previous[item.key],
                }))
              }
              aria-expanded={Boolean(open[item.key])}
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
                    <a
                      href={child.href}
                      className={
                        pathname === child.href
                          ? "nav-sub__link--active"
                          : ""
                      }
                      aria-current={
                        pathname === child.href ? "page" : undefined
                      }
                    >
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
          <span>{logoutLoading ? "Memproses..." : "Logout"}</span>
        </button>
      </nav>
    </aside>
  );
}

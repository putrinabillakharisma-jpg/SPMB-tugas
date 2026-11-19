
"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import "./calon.css";

type IconName =
  | "home"
  | "user"
  | "clipboard"
  | "search"
  | "folder"
  | "report"
  | "wallet"
  | "logout";

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
};

function SidebarIcon({
  name,
  size = 22,
}: {
  name: IconName;
  size?: number;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={ICONS[name]} />
    </svg>
  );
}

const MENU: {
  label: string;
  href: string;
  icon: IconName;
}[] = [
  {
    label: "Beranda",
    href: "/calon-siswa",
    icon: "home",
  },
  {
    label: "Data Diri",
    href: "/calon-siswa/data-diri",
    icon: "user",
  },
    {
    label: "Pilihan Jurusan",
    href: "/calon-siswa/pilihan-jurusan",
    icon: "search",
  },
   {
    label: "Pembayaran",
    href: "/calon-siswa/pembayaran",
    icon: "wallet",
  },
  {
    label: "Tes TPA",
    href: "/calon-siswa/tes-tpa",
    icon: "clipboard",
  },

  {
    label: "Upload Dokumen",
    href: "/calon-siswa/upload-dokumen",
    icon: "folder",
  },
  {
    label: "Laporan",
    href: "/calon-siswa/laporan",
    icon: "report",
  },
 
];

export default function CalonSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [logoutLoading, setLogoutLoading] = useState(false);

  async function handleLogout() {
    const yakin = window.confirm("Apakah kamu yakin ingin logout?");

    if (!yakin) return;

    try {
      setLogoutLoading(true);

      const response = await fetch("/api/logout", {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("Logout gagal.");
      }

      router.replace("/login");
      router.refresh();
    } catch (error) {
      console.error("Logout error:", error);
      alert("Logout gagal. Silakan coba kembali.");
      setLogoutLoading(false);
    }
  }

  return (
    <aside className="calon-sidebar">
      {/* BRAND */}
      <div className="calon-brand">
        <div className="calon-brand__logo">SMK</div>

        <div>
          <div className="calon-brand__title">SPMB</div>
          <div className="calon-brand__sub">
            SMK Citra Negara
          </div>
        </div>
      </div>

      {/* MENU */}
      <nav className="calon-nav">
        {MENU.map((item) => {
          const active =
            item.href === "/calon-siswa"
              ? pathname === item.href
              : pathname === item.href ||
                pathname.startsWith(`${item.href}/`);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`calon-nav__item ${
                active ? "is-active" : ""
              }`}
            >
              <SidebarIcon name={item.icon} size={23} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* LOGOUT */}
      <button
        type="button"
        className="calon-logout"
        onClick={handleLogout}
        disabled={logoutLoading}
      >
        <SidebarIcon name="logout" size={22} />
        <span>
          {logoutLoading ? "Sedang Logout..." : "Logout"}
        </span>
      </button>
    </aside>
  );
}

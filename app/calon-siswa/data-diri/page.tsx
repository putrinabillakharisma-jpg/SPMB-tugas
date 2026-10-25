
"use client";

import {
  useState,
  useEffect,
  type ChangeEvent,
  type FormEvent,
} from "react";
import Link from "next/link";
import "./data.css";

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
  | "chevron"
  | "calendar";

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
  chevron: "M6 9l6 6 6-6",
  calendar:
    "M5 5h14a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1zm0 5h15M8 3v4m8-4v4",
};

function Icon({
  name,
  size = 20,
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
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={ICONS[name]} />
    </svg>
  );
}

/* ---------- Sidebar ---------- */

const MENU: {
  label: string;
  href: string;
  icon: IconName;
  active?: boolean;
}[] = [
  { label: "Beranda", href: "/calon-siswa", icon: "home" },
  {
    label: "Data Diri",
    href: "/calon-siswa/data-diri",
    icon: "user",
    active: true,
  },
  {
    label: "Tes TPA",
    href: "/calon-siswa/tes-tpa",
    icon: "clipboard",
  },
  {
    label: "Pilihan Jurusan",
    href: "/calon-siswa/pilihan-jurusan",
    icon: "search",
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
  {
    label: "Pembayaran",
    href: "/calon-siswa/pembayaran",
    icon: "wallet",
  },
];

/* ---------- Konfigurasi form ---------- */

type FieldType =
  | "text"
  | "number"
  | "tel"
  | "email"
  | "date"
  | "select"
  | "file"
  | "textarea";

interface Field {
  name: string;
  label: string;
  type: FieldType;
  placeholder?: string;
  required?: boolean;
  options?: string[];
  full?: boolean;
}

interface Section {
  title: string;
  fields: Field[];
}

type Values = Record<string, string>;
type Errors = Record<string, string>;

const SECTIONS: Section[] = [
  {
    title: "Data Pribadi",
    fields: [
      {
        name: "nama",
        label: "Nama Lengkap",
        type: "text",
        placeholder: "Masukkan nama lengkap",
        required: true,
      },
      {
        name: "nisn",
        label: "NISN",
        type: "number",
        placeholder: "10 digit NISN",
        required: true,
      },
      {
        name: "nik",
        label: "NIK",
        type: "number",
        placeholder: "16 digit NIK",
        required: true,
      },
      {
        name: "tempatLahir",
        label: "Tempat Lahir",
        type: "text",
        placeholder: "Contoh: Depok",
        required: true,
      },
      {
        name: "tanggalLahir",
        label: "Tanggal Lahir",
        type: "date",
        required: true,
      },
      {
        name: "jenisKelamin",
        label: "Jenis Kelamin",
        type: "select",
        placeholder: "Pilih jenis kelamin",
        options: ["Laki-laki", "Perempuan"],
        required: true,
      },
      {
        name: "agama",
        label: "Agama",
        type: "select",
        placeholder: "Pilih agama",
        options: [
          "Islam",
          "Kristen",
          "Katolik",
          "Hindu",
          "Buddha",
          "Konghucu",
        ],
        required: true,
      },
      {
        name: "foto",
        label: "Pas Foto",
        type: "file",
      },
    ],
  },
  {
    title: "Asal Sekolah",
    fields: [
      {
        name: "sekolah",
        label: "Nama Sekolah Asal",
        type: "text",
        placeholder: "Contoh: SMPN 5 Depok",
        required: true,
      },
      {
        name: "tahunLulus",
        label: "Tahun Lulus",
        type: "number",
        placeholder: "Contoh: 2026",
        required: true,
      },
    ],
  },
  {
    title: "Kontak dan Alamat",
    fields: [
      {
        name: "hp",
        label: "No. HP / WhatsApp",
        type: "tel",
        placeholder: "08xxxxxxxxxx",
        required: true,
      },
      {
        name: "email",
        label: "Email",
        type: "email",
        placeholder: "nama@email.com",
      },
      {
        name: "alamat",
        label: "Alamat Lengkap",
        type: "textarea",
        placeholder: "Nama jalan, RT/RW, kelurahan, kecamatan, kota",
        required: true,
        full: true,
      },
    ],
  },
  {
    title: "Data Orang Tua / Wali",
    fields: [
      {
        name: "ayah",
        label: "Nama Ayah",
        type: "text",
        placeholder: "Nama lengkap ayah",
        required: true,
      },
      {
        name: "ibu",
        label: "Nama Ibu",
        type: "text",
        placeholder: "Nama lengkap ibu",
        required: true,
      },
      {
        name: "pekerjaan",
        label: "Pekerjaan Orang Tua / Wali",
        type: "text",
        placeholder: "Contoh: Wiraswasta",
      },
      {
        name: "hpOrtu",
        label: "No. HP Orang Tua / Wali",
        type: "tel",
        placeholder: "08xxxxxxxxxx",
        required: true,
      },
    ],
  },
];

/* ---------- Validasi ---------- */

function validate(values: Values): Errors {
  const errors: Errors = {};

  for (const section of SECTIONS) {
    for (const field of section.fields) {
      if (
        field.required &&
        !values[field.name]?.trim()
      ) {
        errors[field.name] = `${field.label} wajib diisi`;
      }
    }
  }

  if (
    values.nisn &&
    !/^\d{10}$/.test(values.nisn)
  ) {
    errors.nisn = "NISN harus 10 digit angka";
  }

  if (
    values.nik &&
    !/^\d{16}$/.test(values.nik)
  ) {
    errors.nik = "NIK harus 16 digit angka";
  }

  if (
    values.tahunLulus &&
    !/^\d{4}$/.test(values.tahunLulus)
  ) {
    errors.tahunLulus = "Tahun lulus harus 4 digit";
  }

  if (
    values.hp &&
    !/^08\d{8,12}$/.test(values.hp)
  ) {
    errors.hp = "Nomor HP tidak valid (contoh: 08123456789)";
  }

  if (
    values.hpOrtu &&
    !/^08\d{8,12}$/.test(values.hpOrtu)
  ) {
    errors.hpOrtu = "Nomor HP orang tua tidak valid";
  }

  if (
    values.email &&
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)
  ) {
    errors.email = "Format email tidak valid";
  }

  return errors;
}

/* ---------- Page ---------- */

export default function DataDiriPage() {
  const [values, setValues] = useState<Values>({});
  const [errors, setErrors] = useState<Errors>({});
  const [fotoName, setFotoName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<
    "success" | "error" | ""
  >("");

  /* Mengambil biodata dari database */
  useEffect(() => {
    let active = true;

    async function loadBiodata() {
      try {
        const response = await fetch(
          "/api/calon-siswa/biodata",
          {
            method: "GET",
            cache: "no-store",
          }
        );

        const result = await response.json();

        if (!response.ok) {
          throw new Error(
            result.message || "Gagal mengambil data diri."
          );
        }

        if (!active) return;

        const data = result.data;

        setValues({
          nama: data.nama ?? "",
          nisn: data.nisn == null ? "" : String(data.nisn),
          nik: data.nik ?? "",
          tempatLahir: data.tempatLahir ?? "",
          tanggalLahir: data.tanggalLahir
            ? String(data.tanggalLahir).slice(0, 10)
            : "",
          jenisKelamin: data.jenisKelamin ?? "",
          agama: data.agama ?? "",
          foto: data.foto ?? "",
          sekolah: data.sekolah ?? "",
          tahunLulus:
            data.tahunLulus == null
              ? ""
              : String(data.tahunLulus),
          hp: data.hp ?? "",
          email: data.email ?? "",
          alamat: data.alamat ?? "",
          ayah: data.ayah ?? "",
          ibu: data.ibu ?? "",
          pekerjaan: data.pekerjaan ?? "",
          hpOrtu: data.hpOrtu ?? "",
        });

        setFotoName(data.foto ?? "");
      } catch (error) {
        if (!active) return;

        setMessage(
          error instanceof Error
            ? error.message
            : "Gagal mengambil data diri."
        );
        setMessageType("error");
      } finally {
        if (active) setLoadingData(false);
      }
    }

    loadBiodata();

    return () => {
      active = false;
    };
  }, []);

  /* Mengubah nilai input */
  const setValue = (name: string, value: string) => {
    setValues((previous) => ({
      ...previous,
      [name]: value,
    }));

    if (errors[name]) {
      setErrors((previous) => ({
        ...previous,
        [name]: "",
      }));
    }
  };

  const onChange =
    (name: string) =>
    (
      event: ChangeEvent<
        HTMLInputElement |
        HTMLSelectElement |
        HTMLTextAreaElement
      >
    ) => {
      setValue(name, event.target.value);
    };

  /* Memilih foto: upload file belum diaktifkan */
  const onFile = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setMessage("Pilih file gambar untuk pas foto.");
      setMessageType("error");
      event.target.value = "";
      return;
    }

    setFotoName(file.name);
    setValue("foto", file.name);
    setMessage(
      "Nama file dipilih. File foto belum diunggah ke server."
    );
    setMessageType("");
  };

  /* Menyimpan biodata ke database */
  const onSubmit = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    setMessage("");
    setMessageType("");

    const validationErrors = validate(values);
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) {
      const firstError = Object.keys(validationErrors)[0];
      document.getElementById(firstError)?.focus();
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch(
        "/api/calon-siswa/biodata",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "same-origin",
          body: JSON.stringify(values),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.message || "Data diri gagal disimpan."
        );
      }

      setMessage(
        result.message || "Data diri berhasil disimpan."
      );
      setMessageType("success");
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Terjadi kesalahan saat menyimpan data."
      );
      setMessageType("error");
    } finally {
      setSubmitting(false);
    }
  };

  /* Membuat setiap field */
  const renderField = (field: Field) => {
    const error = errors[field.name];

    const common = {
      id: field.name,
      name: field.name,
      "aria-invalid": error ? true : undefined,
      "aria-describedby": error
        ? `${field.name}-error`
        : undefined,
    };

    let control: React.ReactNode;

    if (field.type === "select") {
      control = (
        <div className="fb-select">
          <select
            {...common}
            value={values[field.name] ?? ""}
            onChange={onChange(field.name)}
            className={error ? "is-error" : ""}
            required={field.required}
          >
            <option value="" disabled>
              {field.placeholder}
            </option>

            {field.options?.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>

          <Icon name="chevron" size={16} />
        </div>
      );
    } else if (field.type === "textarea") {
      control = (
        <textarea
          {...common}
          rows={3}
          placeholder={field.placeholder}
          value={values[field.name] ?? ""}
          onChange={onChange(field.name)}
          className={`fb-textarea ${
            error ? "is-error" : ""
          }`}
          required={field.required}
        />
      );
    } else if (field.type === "date") {
      control = (
        <div className="fb-date">
          <input
            {...common}
            type="date"
            value={values[field.name] ?? ""}
            onChange={onChange(field.name)}
            className={error ? "is-error" : ""}
            required={field.required}
          />

          <Icon name="calendar" size={16} />
        </div>
      );
    } else if (field.type === "file") {
      control = (
        <label className="fb-file" htmlFor={field.name}>
          <input
            id={field.name}
            name={field.name}
            type="file"
            accept="image/*"
            onChange={onFile}
          />

          <span>
            {fotoName
              ? fotoName
              : "Pilih berkas... Belum ada berkas dipilih"}
          </span>
        </label>
      );
    } else {
      control = (
        <input
          {...common}
          type={field.type === "number" ? "text" : field.type}
          inputMode={
            field.type === "number" ? "numeric" : undefined
          }
          placeholder={field.placeholder}
          value={values[field.name] ?? ""}
          onChange={onChange(field.name)}
          className={error ? "is-error" : ""}
          required={field.required}
        />
      );
    }

    return (
      <div
        key={field.name}
        className={`fb-field ${
          field.full ? "is-full" : ""
        }`}
      >
        <label htmlFor={field.name} className="fb-label">
          {field.label}{" "}
          {field.required && (
            <span className="fb-req">*</span>
          )}
        </label>

        {control}

        {error && (
          <span
            id={`${field.name}-error`}
            className="fb-error"
            role="alert"
          >
            {error}
          </span>
        )}
      </div>
    );
  };

  return (
    <div className="fb-layout">
      {/* Sidebar */}
      <aside className="fb-sidebar">
        <div className="fb-brand">
          <div className="fb-brand__logo">SMK</div>

          <div>
            <div className="fb-brand__title">SPMB</div>
            <div className="fb-brand__sub">
              SMK Citra Negara
            </div>
          </div>
        </div>

        <nav className="fb-nav">
          {MENU.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className={`fb-nav__item ${
                item.active ? "is-active" : ""
              }`}
            >
              <Icon name={item.icon} size={22} />
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>

        <Link href="/api/logout" className="fb-logout">
          <Icon name="logout" size={22} />
          <span>Logout</span>
        </Link>
      </aside>

      {/* Main */}
      <div className="fb-main">
        <header className="fb-topbar">
          <div className="fb-profile">
            <span className="fb-profile__avatar">
              <Icon name="user" size={18} />
            </span>

            <span>{values.nama || "Calon Siswa"}</span>
            <Icon name="chevron" size={18} />
          </div>
        </header>

        <main className="fb-content">
          <div className="fb-head">
            <nav
              className="fb-breadcrumb"
              aria-label="Breadcrumb"
            >
              <Link href="/calon-siswa/data-diri">
                Data Diri
              </Link>

              <span aria-hidden="true">›</span>
              <b>Daftar Baru</b>
            </nav>

            <h1 className="fb-title">
              Daftar Calon Siswa Baru
            </h1>

            <p className="fb-desc">
              Lengkapi data berikut dengan benar. Kolom
              bertanda <span className="fb-req">*</span>{" "}
              wajib diisi.
            </p>
          </div>

          {message && (
            <div
              role="status"
              aria-live="polite"
              className={`fb-message ${
                messageType === "success"
                  ? "fb-message--success"
                  : messageType === "error"
                    ? "fb-message--error"
                    : ""
              }`}
            >
              {message}
            </div>
          )}

          {loadingData ? (
            <p>Memuat data diri...</p>
          ) : (
            <form
              className="fb-form"
              onSubmit={onSubmit}
              noValidate
            >
              {SECTIONS.map((section, index) => (
                <section
                  key={section.title}
                  className="fb-card"
                >
                  <div className="fb-card__head">
                    <span className="fb-step">
                      {index + 1}
                    </span>

                    <h2>{section.title}</h2>
                  </div>

                  <div className="fb-grid">
                    {section.fields.map(renderField)}
                  </div>
                </section>
              ))}

              <div className="fb-actions">
                <Link
                  href="/calon-siswa"
                  className="fb-btn fb-btn--outline"
                >
                  Batal
                </Link>

                <button
                  type="submit"
                  className="fb-btn fb-btn--primary"
                  disabled={submitting}
                >
                  {submitting
                    ? "Menyimpan..."
                    : "Simpan Data"}
                </button>
              </div>
            </form>
          )}
        </main>
      </div>
    </div>
  );
}

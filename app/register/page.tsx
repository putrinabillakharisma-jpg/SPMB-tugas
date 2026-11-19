
"use client";

import { useState } from "react";
import "./register.css";

export default function RegisterSPMB() {
  const [showPassword, setShowPassword] = useState(false);
  const [nama, setNama] = useState("");
  const [email, setEmail] = useState("");
  const [nisn, setNisn] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [password, setPassword] = useState("");
  const [setuju, setSetuju] = useState(true);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    try {
      const response = await fetch("/api/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          nama,
          email,
          nisn,
          whatsapp,
          password,
          setuju,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        alert(result.message || "Pendaftaran gagal.");
        return;
      }

      alert(result.message);
      window.location.href = "/login";
    } catch (error) {
      console.error("Kesalahan registrasi:", error);
      alert("Tidak dapat terhubung ke server.");
    }
  }

  return (
    <main className="register-page">
      <div className="register-background">
        <div className="register-card">
          {/* PANEL KIRI */}
          <section className="welcome-panel">
            <div className="welcome-content">
              <div className="school-brand">
                <div className="school-seal">
                  <img src="/asset/logo cn.png" alt="Logo sekolah" />
                </div>

                <div className="brand-text">
                  <strong>SPMB</strong>
                  <span>SMK Citra Negara</span>
                </div>
              </div>

              <div className="welcome-copy">
                <p className="welcome-title">SELAMAT DATANG</p>
                <h2>CALON SISWA BARU</h2>

                <p className="welcome-description">
                  Buat akun untuk memulai pendaftaran di
                  <br className="desktop-break" /> SMK Citra Negara.
                  Lengkapi data diri, pilih
                  <br className="desktop-break" /> jurusan, dan pantau
                  hasil seleksi dengan mudah.
                </p>
              </div>
            </div>

            {/* BUBBLE ANIMASI */}
            <div className="bubble bubble-one" />
            <div className="bubble bubble-two" />
            <div className="bubble bubble-three" />
            <div className="bubble bubble-four" />
            <div className="bubble bubble-five" />
          </section>

          {/* PANEL KANAN */}
          <section className="form-panel">
            <div className="form-inner">
              <header className="form-header">
                <h1>Daftar Akun</h1>
                <p>
                  Isi data berikut untuk membuat akun calon siswa baru
                </p>
              </header>

              <form onSubmit={handleSubmit} className="register-form">
                {/* NAMA */}
                <label className="input-group">
                  <span className="sr-only">Nama Lengkap</span>
                  <span className="field-icon">
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                      <circle cx="12" cy="7" r="4" />
                      <path d="M4 21c0-4.2 3.6-7 8-7s8 2.8 8 7" />
                    </svg>
                  </span>

                  <input
                    type="text"
                    placeholder="Nama Lengkap"
                    value={nama}
                    onChange={(e) => setNama(e.target.value)}
                    autoComplete="name"
                    required
                  />
                </label>

                {/* EMAIL BARU */}
                <label className="input-group">
                  <span className="sr-only">Email</span>
                  <span className="field-icon">
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                      <rect x="3" y="5" width="18" height="14" rx="2" />
                      <path d="m3 7 9 6 9-6" />
                    </svg>
                  </span>

                  <input
                    type="email"
                    placeholder="Alamat Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
                    required
                  />
                </label>

                {/* NISN */}
                <label className="input-group">
                  <span className="sr-only">NISN</span>
                  <span className="field-icon">
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                      <rect x="3" y="5" width="18" height="14" rx="3" />
                      <path d="M7 10h10M7 14h5" />
                    </svg>
                  </span>

                  <input
                    type="text"
                    placeholder="NISN"
                    value={nisn}
                    onChange={(e) =>
                      setNisn(e.target.value.replace(/\D/g, "").slice(0, 10))
                    }
                    inputMode="numeric"
                    maxLength={10}
                    required
                  />
                </label>

                {/* WHATSAPP */}
                <label className="input-group">
                  <span className="sr-only">Nomor WhatsApp</span>
                  <span className="field-icon">
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                      <rect x="6" y="2" width="12" height="20" rx="2.5" />
                      <path d="M11 18h2" />
                    </svg>
                  </span>

                  <input
                    type="tel"
                    placeholder="No. WhatsApp"
                    value={whatsapp}
                    onChange={(e) => setWhatsapp(e.target.value)}
                    autoComplete="tel"
                    inputMode="tel"
                    required
                  />
                </label>

                {/* PASSWORD */}
                <label className="input-group password-group">
                  <span className="sr-only">Kata Sandi</span>
                  <span className="field-icon">
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                      <rect x="5" y="10" width="14" height="12" rx="2" />
                      <path d="M8 10V7a4 4 0 0 1 8 0v3" />
                    </svg>
                  </span>

                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Kata Sandi"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="new-password"
                    minLength={8}
                    required
                  />

                  <button
                    type="button"
                    className="show-password"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={
                      showPassword
                        ? "Sembunyikan kata sandi"
                        : "Tampilkan kata sandi"
                    }
                  >
                    {showPassword ? "SEMBUNYIKAN" : "TAMPILKAN"}
                  </button>
                </label>

                {/* PERSETUJUAN */}
                <label className="terms-row">
                  <input
                    type="checkbox"
                    checked={setuju}
                    onChange={(e) => setSetuju(e.target.checked)}
                    required
                  />
                  <span>
                    Saya menyetujui syarat &amp; ketentuan SPMB
                  </span>
                </label>

                <button type="submit" className="register-button">
                  Daftar Sekarang
                </button>

                <div className="form-divider">
                  <span />
                  <p>atau</p>
                  <span />
                </div>

                <a href="/login" className="login-button">
                  Sudah punya akun? Masuk
                </a>

                <p className="help-text">
                  Butuh bantuan?{" "}
                  <a href="mailto:spmb@citranegara.sch.id">
                    Hubungi Panitia SPMB
                  </a>
                </p>
              </form>
            </div>

            <div className="form-decoration" />
          </section>
        </div>

        <footer className="register-footer">
          © 2026 SMK Citra Negara. All rights reserved.
        </footer>
      </div>
    </main>
  );
}

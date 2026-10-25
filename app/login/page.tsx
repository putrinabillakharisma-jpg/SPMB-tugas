
"use client";

import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { useRouter } from "next/navigation";
import "./login.css";

export default function LoginPage() {
  const router = useRouter();

  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const rememberedUsername = localStorage.getItem("rememberedUsername");

    if (rememberedUsername) {
      setUsername(rememberedUsername);
      setRememberMe(true);
    }
  }, []);

  async function handleLogin(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");

    const identifier = username.trim();

    if (!identifier || !password) {
      setError("NISN, username/email, dan kata sandi wajib diisi.");
      return;
    }

    try {
      setLoading(true);

      // NISN calon siswa terdiri dari 10 angka.
      // Selain itu, input dianggap username/email admin atau kepsek.
      const isNisn = /^\d{10}$/.test(identifier);

      const requestBody = isNisn
        ? {
            nisn: identifier,
            password,
          }
        : {
            username: identifier,
            email: identifier,
            password,
          };

      const response = await fetch("/api/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "NISN/username/email atau kata sandi salah.");
        return;
      }

      if (!data.user || !data.user.role) {
        setError("Data pengguna tidak valid.");
        return;
      }

      const role = String(data.user.role).toLowerCase();

      if (!["admin", "calon_siswa", "kepsek"].includes(role)) {
        setError("Role pengguna tidak dikenali.");
        return;
      }

      // Simpan informasi pengguna untuk kebutuhan tampilan aplikasi.
      // Token sesi autentikasi tetap menggunakan cookie dari API.
      localStorage.setItem(
        "user",
        JSON.stringify({
          ...data.user,
          role,
        })
      );

      if (rememberMe) {
        localStorage.setItem("rememberedUsername", identifier);
      } else {
        localStorage.removeItem("rememberedUsername");
      }

      // Arahkan berdasarkan role akun.
      if (role === "admin") {
        router.replace("/admin");
      } else if (role === "calon_siswa") {
        router.replace("calon-siswa");
      } else if (role === "kepsek") {
        router.replace("/dashboard/kepsek");
      }

      router.refresh();
    } catch (err) {
      console.error("LOGIN ERROR:", err);
      setError("Tidak dapat terhubung ke server. Periksa koneksi dan coba lagi.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="login-page">
      {/* BAGIAN KIRI */}
      <section className="login-left">
        <div className="login-brand">
          <div className="brand-logo">

            <img src="/asset/logo cn.png" alt="" />
            <div className="brand-logo-inner" />
          </div>

          <div className="brand-name">
            <strong>SPMB</strong>
            <span>SMK Citra Negara</span>
          </div>
        </div>

        {/* Bubble animasi dari CSS login.css */}
        <div className="bubble bubble-one" />
        <div className="bubble bubble-two" />
        <div className="bubble bubble-three" />
        <div className="bubble bubble-four" />
        <div className="bubble bubble-five" />
        <div className="bubble bubble-six" />

        <div className="small-dot dot-one" />
        <div className="small-dot dot-two" />

        <div className="login-hero">
          <h2>
            Sistem Penerimaan
            <br />
            Murid Baru
          </h2>

          <div className="hero-line" />

          <p>
            Daftar, seleksi, dan pembayaran
            <br />
            dalam satu tempat yang mudah.
          </p>
        </div>
      </section>

      {/* BAGIAN KANAN */}
      <section className="login-right">
        <div className="login-wrapper">
          <div className="login-card">
            <div className="login-icon">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <circle
                  cx="12"
                  cy="8"
                  r="3.2"
                  stroke="currentColor"
                  strokeWidth="1.8"
                />
                <path
                  d="M5.5 19C6.2 15.8 8.4 14.2 12 14.2C15.6 14.2 17.8 15.8 18.5 19"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                />
              </svg>
            </div>

            <h1>Selamat Datang</h1>

            <p className="login-subtitle">
              Masuk ke akun untuk melanjutkan ke dashboard SPMB
            </p>

            <form onSubmit={handleLogin}>
              {/* Input identitas untuk semua role */}
              <div className="form-group">
                <label htmlFor="username">
                  NISN / Username / Email
                </label>

                <div className="input-box">
                  <svg
                    className="input-icon"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <circle
                      cx="12"
                      cy="8"
                      r="3"
                      stroke="currentColor"
                      strokeWidth="1.6"
                    />
                    <path
                      d="M5 19C5.7 15.8 8 14 12 14C16 14 18.3 15.8 19 19"
                      stroke="currentColor"
                      strokeWidth="1.6"
                      strokeLinecap="round"
                    />
                  </svg>

                  <input
                    id="username"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="NISN calon siswa atau username/email"
                    autoComplete="username"
                    required
                  />
                </div>

                <p className="login-subtitle">
                  Calon siswa menggunakan NISN. Admin dan kepsek menggunakan
                  username atau email.
                </p>
              </div>

              {/* Kata sandi */}
              <div className="form-group password-group">
                <label htmlFor="password">Kata Sandi</label>

                <div className="input-box">
                  <svg
                    className="input-icon"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <rect
                      x="5"
                      y="10"
                      width="14"
                      height="10"
                      rx="2"
                      stroke="currentColor"
                      strokeWidth="1.6"
                    />
                    <path
                      d="M8 10V7.5C8 5.3 9.8 3.5 12 3.5C14.2 3.5 16 5.3 16 7.5V10"
                      stroke="currentColor"
                      strokeWidth="1.6"
                    />
                  </svg>

                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Masukkan kata sandi"
                    autoComplete="current-password"
                    required
                  />

                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowPassword((prev) => !prev)}
                    aria-label={
                      showPassword
                        ? "Sembunyikan kata sandi"
                        : "Tampilkan kata sandi"
                    }
                  >
                    {showPassword ? (
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M3 3L21 21"
                          stroke="currentColor"
                          strokeWidth="1.6"
                          strokeLinecap="round"
                        />
                        <path
                          d="M10.6 10.6C10.2 11 10 11.5 10 12C10 13.1 10.9 14 12 14C12.5 14 13 13.8 13.4 13.4"
                          stroke="currentColor"
                          strokeWidth="1.6"
                        />
                        <path
                          d="M9.9 4.8C10.6 4.6 11.3 4.5 12 4.5C17.5 4.5 21 12 21 12C21 12 19.8 14.5 17.5 16.5"
                          stroke="currentColor"
                          strokeWidth="1.6"
                          strokeLinecap="round"
                        />
                        <path
                          d="M6.5 6.5C4.2 8.2 3 12 3 12C3 12 6.5 19.5 12 19.5C13.5 19.5 14.8 19.1 16 18.5"
                          stroke="currentColor"
                          strokeWidth="1.6"
                          strokeLinecap="round"
                        />
                      </svg>
                    ) : (
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M3 12C3 12 6.5 5 12 5C17.5 5 21 12 21 12C21 12 17.5 19 12 19C6.5 19 3 12 3 12Z"
                          stroke="currentColor"
                          strokeWidth="1.6"
                        />
                        <circle
                          cx="12"
                          cy="12"
                          r="3"
                          stroke="currentColor"
                          strokeWidth="1.6"
                        />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              {/* Pesan error */}
              {error && (
                <div className="login-error" role="alert">
                  {error}
                </div>
              )}

              {/* Ingat saya dan lupa kata sandi */}
              <div className="form-options">
                <label className="remember-me">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                  />
                  <span className="custom-checkbox" />
                  <span>Ingat saya</span>
                </label>

                <button
                  type="button"
                  className="forgot-password"
                  onClick={() =>
                    setError(
                      "Silakan hubungi admin untuk bantuan mengatur ulang kata sandi."
                    )
                  }
                >
                  Lupa kata sandi?
                </button>
              </div>

              {/* Tombol masuk */}
              <button
                type="submit"
                className="login-button"
                disabled={loading}
              >
                {loading ? "Memproses..." : "Masuk"}
              </button>
            </form>

            <div className="divider">
              <span />
              <p>atau</p>
              <span />
            </div>

                  <button
                        type="button"
                        className="register-button"
                        onClick={() => router.push("/register")}
                      >
                        Daftar sebagai Calon Siswa
                      </button>

            <p className="help-text">
              Butuh bantuan?{" "}
              <button
                type="button"
                onClick={() =>
                  setError(
                    "Silakan hubungi admin SMK Citra Negara untuk mendapatkan bantuan."
                  )
                }
              >
                Hubungi Admin
              </button>
            </p>
          </div>

          <p className="copyright">
            © 2026 SMK Citra Negara. All rights reserved.
          </p>
        </div>
      </section>
    </main>
  );
}

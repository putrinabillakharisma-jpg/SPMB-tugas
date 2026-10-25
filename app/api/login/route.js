
import pool from "@/lib/db";
import bcrypt from "bcryptjs";
import { SignJWT } from "jose";

export async function POST(request) {
  try {
    const body = await request.json();

    const password = body.password;

    // Tentukan metode login:
    // Calon siswa menggunakan NISN,
    // admin dan kepsek menggunakan email.
    const nisn =
      typeof body.nisn === "string"
        ? body.nisn.trim()
        : "";

    const email =
      typeof body.email === "string"
        ? body.email.trim().toLowerCase()
        : "";

    if (
      typeof password !== "string" ||
      !password ||
      (!nisn && !email)
    ) {
      return Response.json(
        {
          message:
            "NISN atau email dan kata sandi wajib diisi.",
        },
        { status: 400 }
      );
    }

    let user;

    // ==================================
    // LOGIN CALON SISWA MENGGUNAKAN NISN
    // ==================================
    if (nisn) {
      if (!/^\d{10}$/.test(nisn)) {
        return Response.json(
          { message: "NISN harus terdiri dari 10 angka." },
          { status: 400 }
        );
      }

      const [rows] = await pool.execute(
        `SELECT id, nama, nisn, password, role
         FROM calon_siswa
         WHERE nisn = ?
         LIMIT 1`,
        [nisn]
      );

      user = rows[0];

    // ==================================
    // LOGIN ADMIN / KEPSEK MENGGUNAKAN EMAIL
    // ==================================
    } else {
      const [rows] = await pool.execute(
        `SELECT id, nama, email, password, role
         FROM users
         WHERE email = ?
         LIMIT 1`,
        [email]
      );

      user = rows[0];
    }

    // ==================================
    // VERIFIKASI AKUN DAN PASSWORD
    // ==================================
    if (
      !user ||
      typeof user.password !== "string" ||
      !(await bcrypt.compare(password, user.password))
    ) {
      return Response.json(
        { message: "NISN/email atau kata sandi salah." },
        { status: 401 }
      );
    }

    // Pastikan role yang diperbolehkan
    const allowedRoles = [
      "calon_siswa",
      "admin",
      "kepsek",
    ];

    if (!allowedRoles.includes(user.role)) {
      return Response.json(
        { message: "Role akun tidak valid." },
        { status: 403 }
      );
    }

    // ==================================
    // PERIKSA SESSION SECRET
    // ==================================
    const secret = process.env.SESSION_SECRET;

    if (!secret || secret.length < 32) {
      return Response.json(
        { message: "Konfigurasi sesi belum tersedia." },
        { status: 500 }
      );
    }

    // ==================================
    // BUAT TOKEN JWT
    // ==================================
    const token = await new SignJWT({
      nama: user.nama,
      role: user.role,
    })
      .setProtectedHeader({ alg: "HS256" })
      .setSubject(String(user.id))
      .setIssuedAt()
      .setExpirationTime("8h")
      .sign(new TextEncoder().encode(secret));

    // ==================================
    // BUAT COOKIE SESSION
    // ==================================
    const cookie = [
      `spmb_session=${token}`,
      "HttpOnly",
      "Path=/",
      "SameSite=Lax",
      "Max-Age=28800",
    ];

    if (process.env.NODE_ENV === "production") {
      cookie.push("Secure");
    }

    const response = Response.json({
      message: "Login berhasil.",
      user: {
        id: user.id,
        nama: user.nama,
        role: user.role,
      },
    });

    response.headers.append(
      "Set-Cookie",
      cookie.join("; ")
    );

    return response;
  } catch (error) {
    console.error("Login error:", error);

    return Response.json(
      { message: "Terjadi kesalahan pada server." },
      { status: 500 }
    );
  }
}

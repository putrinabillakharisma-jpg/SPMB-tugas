
import pool from "@/lib/db";
import bcrypt from "bcryptjs";
import { SignJWT } from "jose";

export async function POST(request) {
  try {
    const body = await request.json();

    const email =
      typeof body.email === "string"
        ? body.email.trim().toLowerCase()
        : "";

    const password = body.password;

    // Validasi input
    if (
      !email ||
      typeof password !== "string" ||
      !password
    ) {
      return Response.json(
        { message: "Email dan kata sandi wajib diisi." },
        { status: 400 }
      );
    }

    // Cari akun berdasarkan email
    let [rows] = await pool.execute(
      `SELECT id, nama, email, nisn, password, role
       FROM calon_siswa
       WHERE email = ?
       LIMIT 1`,
      [email]
    );

    let user = rows[0];

    // Jika bukan calon siswa, periksa tabel users
    if (!user) {
      [rows] = await pool.execute(
        `SELECT id, nama, email, password, role
         FROM users
         WHERE email = ?
         LIMIT 1`,
        [email]
      );

      user = rows[0];
    }

    // Verifikasi akun dan password
    if (
      !user ||
      typeof user.password !== "string" ||
      !(await bcrypt.compare(password, user.password))
    ) {
      return Response.json(
        { message: "Email atau kata sandi salah." },
        { status: 401 }
      );
    }

    // Role yang diperbolehkan
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

    // Secret JWT
    const secret = process.env.SESSION_SECRET;

    if (!secret || secret.length < 32) {
      return Response.json(
        { message: "Konfigurasi sesi belum tersedia." },
        { status: 500 }
      );
    }

    // Buat JWT
    const token = await new SignJWT({
      id: user.id,
      nama: user.nama,
      email: user.email,
      role: user.role,
    })
      .setProtectedHeader({ alg: "HS256" })
      .setSubject(String(user.id))
      .setIssuedAt()
      .setExpirationTime("8h")
      .sign(new TextEncoder().encode(secret));

    // Buat cookie
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
        email: user.email,
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

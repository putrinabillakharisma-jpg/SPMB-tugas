
import { NextResponse } from "next/server";
import pool from "@/lib/db";
import bcrypt from "bcryptjs";

export async function POST(request) {
  try {
    const body = await request.json();

    const nama = String(body.nama || "").trim();
    const email = String(body.email || "").trim().toLowerCase();
    const nisn = String(body.nisn || "").trim();
    const whatsapp = String(body.whatsapp || "").trim();
    const password = String(body.password || "");
    const setuju = body.setuju;

    // Validasi kolom wajib
    if (!nama || !email || !nisn || !whatsapp || !password) {
      return NextResponse.json(
        { message: "Semua kolom wajib diisi." },
        { status: 400 }
      );
    }

    // Validasi format email
    const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

    if (!emailValid || email.length > 150) {
      return NextResponse.json(
        { message: "Format email tidak valid." },
        { status: 400 }
      );
    }

    // Validasi NISN
    if (!/^\d{10}$/.test(nisn)) {
      return NextResponse.json(
        { message: "NISN harus terdiri dari 10 angka." },
        { status: 400 }
      );
    }

    // Validasi password
    if (password.length < 8) {
      return NextResponse.json(
        { message: "Kata sandi minimal 8 karakter." },
        { status: 400 }
      );
    }

    // Validasi persetujuan
    if (setuju !== true) {
      return NextResponse.json(
        { message: "Kamu harus menyetujui syarat dan ketentuan." },
        { status: 400 }
      );
    }

    // Periksa email yang sudah terdaftar
    const [existingEmail] = await pool.execute(
      "SELECT id FROM calon_siswa WHERE email = ? LIMIT 1",
      [email]
    );

    if (existingEmail.length > 0) {
      return NextResponse.json(
        { message: "Email sudah terdaftar. Gunakan email lain." },
        { status: 409 }
      );
    }

    // Periksa NISN yang sudah terdaftar
    const [existingNisn] = await pool.execute(
      "SELECT id FROM calon_siswa WHERE nisn = ? LIMIT 1",
      [nisn]
    );

    if (existingNisn.length > 0) {
      return NextResponse.json(
        { message: "NISN sudah terdaftar." },
        { status: 409 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Simpan calon siswa
    await pool.execute(
      `INSERT INTO calon_siswa
       (nama, email, nisn, whatsapp, password, role)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [nama, email, nisn, whatsapp, hashedPassword, "calon_siswa"]
    );

    return NextResponse.json(
      {
        message: "Pendaftaran berhasil. Silakan masuk menggunakan email.",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Register API error:", error);

    // Menangani kemungkinan email/NISN duplikat akibat pendaftaran bersamaan
    if (error.code === "ER_DUP_ENTRY") {
      return NextResponse.json(
        { message: "Email atau NISN sudah terdaftar." },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { message: "Terjadi kesalahan server saat mendaftar." },
      { status: 500 }
    );
  }
}

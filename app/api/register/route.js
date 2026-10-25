
import { NextResponse } from "next/server";
import pool from "@/lib/db";
import bcrypt from "bcryptjs";

export async function POST(request) {
  try {
    const body = await request.json();

    const nama = String(body.nama || "").trim();
    const nisn = String(body.nisn || "").trim();
    const whatsapp = String(body.whatsapp || "").trim();
    const password = String(body.password || "");
    const setuju = body.setuju;

    // Validasi data
    if (!nama || !nisn || !whatsapp || !password) {
      return NextResponse.json(
        { message: "Semua kolom wajib diisi." },
        { status: 400 }
      );
    }

    if (!/^\d{10}$/.test(nisn)) {
      return NextResponse.json(
        { message: "NISN harus terdiri dari 10 angka." },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { message: "Kata sandi minimal 8 karakter." },
        { status: 400 }
      );
    }

    if (setuju !== true) {
      return NextResponse.json(
        { message: "Kamu harus menyetujui syarat dan ketentuan." },
        { status: 400 }
      );
    }

    // Periksa apakah NISN sudah terdaftar
    const [existing] = await pool.execute(
      "SELECT id FROM calon_siswa WHERE nisn = ? LIMIT 1",
      [nisn]
    );

    if (existing.length > 0) {
      return NextResponse.json(
        { message: "NISN sudah terdaftar." },
        { status: 409 }
      );
    }

    // Hash kata sandi sebelum menyimpan
    const hashedPassword = await bcrypt.hash(password, 12);

    // Simpan data calon siswa ke database
    await pool.execute(
      `INSERT INTO calon_siswa
       (nama, nisn, whatsapp, password, role)
       VALUES (?, ?, ?, ?, ?)`,
      [nama, nisn, whatsapp, hashedPassword, "calon_siswa"]
    );

    return NextResponse.json(
      { message: "Pendaftaran berhasil. Silakan masuk." },
      { status: 201 }
    );
  } catch (error) {
    console.error("Register API error:", error);

    return NextResponse.json(
      { message: "Terjadi kesalahan server saat mendaftar." },
      { status: 500 }
    );
  }
}

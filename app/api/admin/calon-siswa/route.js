
import { NextResponse } from "next/server";
import pool from "@/lib/db";
import bcrypt from "bcryptjs";
import { jwtVerify } from "jose";

export const dynamic = "force-dynamic";

async function periksaAdmin(request) {
  const token = request.cookies.get("spmb_session")?.value;
  const secret = process.env.SESSION_SECRET;

  if (!token || !secret || secret.length < 32) {
    return false;
  }

  try {
    const { payload } = await jwtVerify(
      token,
      new TextEncoder().encode(secret),
      { algorithms: ["HS256"] }
    );

    return payload.role === "admin";
  } catch {
    return false;
  }
}

function jawabanError(error, status = 400) {
  return NextResponse.json(
    { success: false, message: error },
    { status }
  );
}

// READ: mengambil semua calon siswa
export async function GET(request) {
  if (!(await periksaAdmin(request))) {
    return jawabanError("Sesi admin tidak valid.", 401);
  }

  try {
    const [rows] = await pool.execute(`
      SELECT id, nama, nisn, whatsapp, role, created_at
      FROM calon_siswa
      ORDER BY id DESC
    `);

    return NextResponse.json({
      success: true,
      data: rows,
    });
  } catch (error) {
    console.error("GET calon siswa:", error);
    return jawabanError("Gagal mengambil data calon siswa.", 500);
  }
}

// CREATE: menambahkan calon siswa
export async function POST(request) {
  if (!(await periksaAdmin(request))) {
    return jawabanError("Sesi admin tidak valid.", 401);
  }

  try {
    const body = await request.json();
    const nama = body.nama?.trim();
    const nisn = body.nisn?.trim();
    const whatsapp = body.whatsapp?.trim();
    const password = body.password;

    if (!nama || !nisn || !whatsapp || !password) {
      return jawabanError(
        "Nama, NISN, WhatsApp, dan password wajib diisi."
      );
    }

    if (!/^\d{10}$/.test(nisn)) {
      return jawabanError("NISN harus terdiri dari 10 angka.");
    }

    if (password.length < 8) {
      return jawabanError("Password minimal 8 karakter.");
    }

    const [existing] = await pool.execute(
      "SELECT id FROM calon_siswa WHERE nisn = ? LIMIT 1",
      [nisn]
    );

    if (existing.length > 0) {
      return jawabanError("NISN tersebut sudah terdaftar.");
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const [result] = await pool.execute(
      `INSERT INTO calon_siswa
        (nama, nisn, whatsapp, password, role)
       VALUES (?, ?, ?, ?, ?)`,
      [nama, nisn, whatsapp, passwordHash, "calon_siswa"]
    );

    return NextResponse.json(
      {
        success: true,
        message: "Calon siswa berhasil ditambahkan.",
        id: result.insertId,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST calon siswa:", error);
    return jawabanError("Gagal menambahkan calon siswa.", 500);
  }
}

// UPDATE: mengedit data calon siswa
export async function PUT(request) {
  if (!(await periksaAdmin(request))) {
    return jawabanError("Sesi admin tidak valid.", 401);
  }

  try {
    const body = await request.json();
    const id = Number(body.id);
    const nama = body.nama?.trim();
    const nisn = body.nisn?.trim();
    const whatsapp = body.whatsapp?.trim();

    if (!Number.isInteger(id) || id <= 0) {
      return jawabanError("ID calon siswa tidak valid.");
    }

    if (!nama || !nisn || !whatsapp) {
      return jawabanError("Nama, NISN, dan WhatsApp wajib diisi.");
    }

    if (!/^\d{10}$/.test(nisn)) {
      return jawabanError("NISN harus terdiri dari 10 angka.");
    }

    const [existing] = await pool.execute(
      "SELECT id FROM calon_siswa WHERE nisn = ? AND id <> ? LIMIT 1",
      [nisn, id]
    );

    if (existing.length > 0) {
      return jawabanError("NISN sudah digunakan siswa lain.");
    }

    const [result] = await pool.execute(
      `UPDATE calon_siswa
       SET nama = ?, nisn = ?, whatsapp = ?
       WHERE id = ?`,
      [nama, nisn, whatsapp, id]
    );

    if (result.affectedRows === 0) {
      return jawabanError("Data calon siswa tidak ditemukan.", 404);
    }

    return NextResponse.json({
      success: true,
      message: "Data calon siswa berhasil diperbarui.",
    });
  } catch (error) {
    console.error("PUT calon siswa:", error);
    return jawabanError("Gagal memperbarui data calon siswa.", 500);
  }
}

// DELETE: menghapus calon siswa
export async function DELETE(request) {
  if (!(await periksaAdmin(request))) {
    return jawabanError("Sesi admin tidak valid.", 401);
  }

  try {
    const id = Number(new URL(request.url).searchParams.get("id"));

    if (!Number.isInteger(id) || id <= 0) {
      return jawabanError("ID calon siswa tidak valid.");
    }

    const [result] = await pool.execute(
      "DELETE FROM calon_siswa WHERE id = ?",
      [id]
    );

    if (result.affectedRows === 0) {
      return jawabanError("Data calon siswa tidak ditemukan.", 404);
    }

    return NextResponse.json({
      success: true,
      message: "Calon siswa berhasil dihapus.",
    });
  } catch (error) {
    console.error("DELETE calon siswa:", error);
    return jawabanError("Gagal menghapus calon siswa.", 500);
  }
}

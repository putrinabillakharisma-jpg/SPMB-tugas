
import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { jwtVerify } from "jose";

export const dynamic = "force-dynamic";

export async function GET(request) {
  try {
    // Periksa session admin
    const token = request.cookies.get("spmb_session")?.value;
    const secret = process.env.SESSION_SECRET;

    if (!token || !secret || secret.length < 32) {
      return NextResponse.json(
        { message: "Sesi login tidak valid. Silakan login kembali." },
        { status: 401 }
      );
    }

    let payload;

    try {
      const verified = await jwtVerify(
        token,
        new TextEncoder().encode(secret),
        { algorithms: ["HS256"] }
      );

      payload = verified.payload;
    } catch {
      return NextResponse.json(
        { message: "Sesi login sudah tidak valid." },
        { status: 401 }
      );
    }

    // Hanya admin yang boleh melihat dashboard ini
    if (payload.role !== "admin") {
      return NextResponse.json(
        { message: "Akses hanya untuk admin." },
        { status: 403 }
      );
    }

    // Hitung seluruh calon siswa yang sudah registrasi
    const [countRows] = await pool.execute(`
      SELECT COUNT(*) AS total
      FROM calon_siswa
    `);

    // Ambil lima calon siswa terbaru
    const [recentRows] = await pool.execute(`
      SELECT id, nama, nisn, whatsapp, created_at
      FROM calon_siswa
      ORDER BY created_at DESC, id DESC
      LIMIT 5
    `);

    // Hitung jumlah pendaftar per bulan selama enam bulan terakhir
    const [monthlyRows] = await pool.execute(`
      SELECT
        DATE_FORMAT(created_at, '%Y-%m') AS periode,
        COUNT(*) AS total
      FROM calon_siswa
      WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)
      GROUP BY DATE_FORMAT(created_at, '%Y-%m')
      ORDER BY periode ASC
    `);

    return NextResponse.json({
      success: true,
      stats: {
        totalCalonSiswa: Number(countRows[0].total),
      },
      recent: recentRows.map((row) => ({
        id: row.id,
        nama: row.nama,
        email: row.nisn,
        tanggal: row.created_at,
      })),
      monthly: monthlyRows.map((row) => ({
        periode: row.periode,
        total: Number(row.total),
      })),
    });
  } catch (error) {
    console.error("Dashboard admin error:", error);

    return NextResponse.json(
      { message: "Gagal mengambil data dashboard." },
      { status: 500 }
    );
  }
}

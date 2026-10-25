import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { jwtVerify } from "jose";

export const dynamic = "force-dynamic";

function normalisasiStatus(status) {
  const nilai = String(status ?? "")
    .trim()
    .toLowerCase()
    .replace(/[_-]/g, " ");

  if (
    nilai === "selesai" ||
    nilai === "completed" ||
    nilai === "complete"
  ) {
    return "Selesai";
  }

  if (
    nilai === "sedang mengerjakan" ||
    nilai === "sedang dikerjakan" ||
    nilai === "mengerjakan" ||
    nilai === "berlangsung" ||
    nilai === "in progress"
  ) {
    return "Sedang Mengerjakan";
  }

  return "Belum Mengerjakan";
}

export async function GET(request) {
  try {
    const token = request.cookies.get("spmb_session")?.value;
    const secret = process.env.SESSION_SECRET;

    if (!token || !secret || secret.length < 32) {
      return NextResponse.json(
        {
          message: "Sesi login tidak valid. Silakan login kembali.",
        },
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

    if (payload.role !== "admin") {
      return NextResponse.json(
        { message: "Akses hanya untuk admin." },
        { status: 403 }
      );
    }

    const [rows] = await pool.execute(`
      SELECT
        h.id,
        c.nama,
        c.nisn,
        t.judul AS nama_tes,
        COALESCE(
          h.selesai_at,
          t.tanggal_mulai,
          h.created_at
        ) AS tanggal,
        h.nilai,
        h.status
      FROM hasil_tpa h
      INNER JOIN calon_siswa c
        ON c.id = h.calon_siswa_id
      INNER JOIN tes_tpa t
        ON t.id = h.tes_id
      ORDER BY h.id DESC
    `);

    const data = rows.map((row) => ({
      id: Number(row.id),
      nama: row.nama ?? "-",
      nisn: row.nisn ?? "-",
      tes: row.nama_tes ?? "-",
      tanggal: row.tanggal ?? null,
      nilai:
        row.nilai === null || row.nilai === undefined
          ? null
          : Number(row.nilai),
      status: normalisasiStatus(row.status),
    }));

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error("GET Hasil TPA:", error);

    return NextResponse.json(
      { message: "Gagal mengambil hasil Tes TPA." },
      { status: 500 }
    );
  }
}
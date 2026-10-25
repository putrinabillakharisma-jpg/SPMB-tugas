
import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { jwtVerify } from "jose";

export const dynamic = "force-dynamic";

async function cekAdmin(request) {
  const token = request.cookies.get("spmb_session")?.value;
  const secret = process.env.SESSION_SECRET;

  if (!token || !secret || secret.length < 32) {
    return NextResponse.json(
      { message: "Sesi login tidak valid." },
      { status: 401 }
    );
  }

  try {
    const { payload } = await jwtVerify(
      token,
      new TextEncoder().encode(secret),
      { algorithms: ["HS256"] }
    );

    if (payload.role !== "admin") {
      return NextResponse.json(
        { message: "Akses hanya untuk admin." },
        { status: 403 }
      );
    }

    return null;
  } catch {
    return NextResponse.json(
      { message: "Sesi login tidak valid." },
      { status: 401 }
    );
  }
}

// GET: menampilkan soal berdasarkan tes_id
export async function GET(request) {
  try {
    const authError = await cekAdmin(request);
    if (authError) return authError;

    const { searchParams } = new URL(request.url);
    const tesId = Number(searchParams.get("tesId"));

    if (!Number.isInteger(tesId) || tesId < 1) {
      return NextResponse.json(
        { message: "ID tes tidak valid." },
        { status: 400 }
      );
    }

    const [tes] = await pool.execute(
      "SELECT id FROM tes_tpa WHERE id = ?",
      [tesId]
    );

    if (tes.length === 0) {
      return NextResponse.json(
        { message: "Tes tidak ditemukan." },
        { status: 404 }
      );
    }

    const [rows] = await pool.execute(
      `SELECT id, tes_id, pertanyaan,
              opsi_a, opsi_b, opsi_c, opsi_d,
              kunci_jawaban, urutan
       FROM soal_tpa
       WHERE tes_id = ?
       ORDER BY urutan ASC, id ASC`,
      [tesId]
    );

    return NextResponse.json({
      success: true,
      data: rows,
    });
  } catch (error) {
    console.error("GET Soal TPA:", error);

    return NextResponse.json(
      { message: "Gagal mengambil soal TPA." },
      { status: 500 }
    );
  }
}

// POST: menambahkan satu soal secara manual
export async function POST(request) {
  try {
    const authError = await cekAdmin(request);
    if (authError) return authError;

    const body = await request.json();
    const tesId = Number(body.tesId);
    const pertanyaan = String(body.pertanyaan || "").trim();
    const opsiA = String(body.opsi_a || "").trim();
    const opsiB = String(body.opsi_b || "").trim();
    const opsiC = String(body.opsi_c || "").trim();
    const opsiD = String(body.opsi_d || "").trim();
    const kunci = String(body.kunci_jawaban || "")
      .trim()
      .toUpperCase();

    if (
      !Number.isInteger(tesId) ||
      tesId < 1 ||
      !pertanyaan ||
      !opsiA ||
      !opsiB ||
      !opsiC ||
      !opsiD ||
      !["A", "B", "C", "D"].includes(kunci)
    ) {
      return NextResponse.json(
        {
          message:
            "Tes, pertanyaan, empat opsi, dan kunci jawaban wajib diisi.",
        },
        { status: 400 }
      );
    }

    const [tes] = await pool.execute(
      "SELECT id FROM tes_tpa WHERE id = ?",
      [tesId]
    );

    if (tes.length === 0) {
      return NextResponse.json(
        { message: "Tes tidak ditemukan." },
        { status: 404 }
      );
    }

    const [urutanRows] = await pool.execute(
      "SELECT COALESCE(MAX(urutan), 0) + 1 AS urutan FROM soal_tpa WHERE tes_id = ?",
      [tesId]
    );

    const urutan = Number(urutanRows[0].urutan);

    const [result] = await pool.execute(
      `INSERT INTO soal_tpa
        (tes_id, pertanyaan, opsi_a, opsi_b,
         opsi_c, opsi_d, kunci_jawaban, urutan)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        tesId,
        pertanyaan,
        opsiA,
        opsiB,
        opsiC,
        opsiD,
        kunci,
        urutan,
      ]
    );

    return NextResponse.json(
      {
        success: true,
        message: "Soal berhasil ditambahkan.",
        id: result.insertId,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST Soal TPA:", error);

    return NextResponse.json(
      { message: "Gagal menyimpan soal TPA." },
      { status: 500 }
    );
  }
}

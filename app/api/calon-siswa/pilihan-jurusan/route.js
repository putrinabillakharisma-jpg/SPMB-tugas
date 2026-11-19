
import pool from "@/lib/db";
import { jwtVerify } from "jose";

const DAFTAR_JURUSAN = [
  "PPLG",
  "TJKT",
  "DKV",
  "MPLB",
  "Pemasaran",
  "Perhotelan",
];

async function getCalonSiswaId(request) {
  const cookieHeader = request.headers.get("cookie") || "";

  const sessionCookie = cookieHeader
    .split(";")
    .map((item) => item.trim())
    .find((item) => item.startsWith("spmb_session="));

  const token = sessionCookie?.slice("spmb_session=".length);
  const secret = process.env.SESSION_SECRET;

  if (!token || !secret || secret.length < 32) {
    return null;
  }

  try {
    const { payload } = await jwtVerify(
      token,
      new TextEncoder().encode(secret),
      { algorithms: ["HS256"] }
    );

    if (payload.role !== "calon_siswa" || !payload.sub) {
      return null;
    }

    return Number(payload.sub);
  } catch {
    return null;
  }
}

// GET: mengambil pilihan jurusan milik siswa yang login
export async function GET(request) {
  try {
    const calonSiswaId = await getCalonSiswaId(request);

    if (!calonSiswaId) {
      return Response.json(
        { success: false, message: "Silakan login sebagai calon siswa." },
        { status: 401 }
      );
    }

    const [rows] = await pool.query(
      `SELECT id, calon_siswa_id, jurusan_1, jurusan_2, status
       FROM pilihan_jurusan
       WHERE calon_siswa_id = ?
       LIMIT 1`,
      [calonSiswaId]
    );

    return Response.json({
      success: true,
      data: rows[0] || null,
    });
  } catch (error) {
    console.error("GET PILIHAN JURUSAN:", error);

    return Response.json(
      { success: false, message: "Gagal mengambil pilihan jurusan." },
      { status: 500 }
    );
  }
}

// POST: menyimpan pilihan jurusan
export async function POST(request) {
  try {
    const calonSiswaId = await getCalonSiswaId(request);

    if (!calonSiswaId) {
      return Response.json(
        { success: false, message: "Silakan login sebagai calon siswa." },
        { status: 401 }
      );
    }

    const body = await request.json();

    const jurusan1 = body.jurusan_1?.trim();
    const jurusan2 = body.jurusan_2?.trim() || null;

    if (!jurusan1) {
      return Response.json(
        { success: false, message: "Pilihan jurusan pertama wajib diisi." },
        { status: 400 }
      );
    }

    if (!DAFTAR_JURUSAN.includes(jurusan1)) {
      return Response.json(
        { success: false, message: "Pilihan jurusan pertama tidak valid." },
        { status: 400 }
      );
    }

    if (jurusan2 && !DAFTAR_JURUSAN.includes(jurusan2)) {
      return Response.json(
        { success: false, message: "Pilihan jurusan kedua tidak valid." },
        { status: 400 }
      );
    }

    if (jurusan1 === jurusan2) {
      return Response.json(
        { success: false, message: "Pilihan jurusan tidak boleh sama." },
        { status: 400 }
      );
    }

    await pool.query(
      `INSERT INTO pilihan_jurusan
        (calon_siswa_id, jurusan_1, jurusan_2, status)
       VALUES (?, ?, ?, 'Belum Diproses')
       ON DUPLICATE KEY UPDATE
        jurusan_1 = VALUES(jurusan_1),
        jurusan_2 = VALUES(jurusan_2),
        status = 'Belum Diproses'`,
      [calonSiswaId, jurusan1, jurusan2]
    );

    return Response.json({
      success: true,
      message: "Pilihan jurusan berhasil disimpan.",
    });
  } catch (error) {
    console.error("POST PILIHAN JURUSAN:", error);

    return Response.json(
      { success: false, message: "Gagal menyimpan pilihan jurusan." },
   );
  }
}

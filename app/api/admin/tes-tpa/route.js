
import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { jwtVerify } from "jose";

export const dynamic = "force-dynamic";

async function cekAdmin(request) {
  const token = request.cookies.get("spmb_session")?.value;
  const secret = process.env.SESSION_SECRET;

  if (!token || !secret || secret.length < 32) {
    return {
      error: NextResponse.json(
        { message: "Sesi login tidak valid. Silakan login kembali." },
        { status: 401 }
      ),
    };
  }

  try {
    const { payload } = await jwtVerify(
      token,
      new TextEncoder().encode(secret),
      { algorithms: ["HS256"] }
    );

    if (payload.role !== "admin") {
      return {
        error: NextResponse.json(
          { message: "Akses hanya untuk admin." },
          { status: 403 }
        ),
      };
    }

    return { admin: true };
  } catch {
    return {
      error: NextResponse.json(
        { message: "Sesi login sudah tidak valid." },
        { status: 401 }
      ),
    };
  }
}

function formatTes(row) {
  return {
    id: Number(row.id),
    nama: row.judul,
    deskripsi: row.deskripsi || "",
    durasi: Number(row.durasi_menit),
    jumlahSoal: Number(row.jumlah_soal),
    jadwal: row.tanggal_mulai
      ? String(row.tanggal_mulai).replace(" ", "T").slice(0, 16)
      : "",
    status: row.status,
  };
}

// GET: mengambil seluruh data tes
export async function GET(request) {
  try {
    const auth = await cekAdmin(request);
    if (auth.error) return auth.error;

    const [rows] = await pool.execute(`
      SELECT id, judul, deskripsi, tanggal_mulai,
             durasi_menit, jumlah_soal, status
      FROM tes_tpa
      ORDER BY id DESC
    `);

    return NextResponse.json({
      success: true,
      data: rows.map(formatTes),
    });
  } catch (error) {
    console.error("GET Tes TPA:", error);
    return NextResponse.json(
      { message: "Gagal mengambil data Tes TPA." },
      { status: 500 }
    );
  }
}

// POST: menambahkan tes baru
export async function POST(request) {
  try {
    const auth = await cekAdmin(request);
    if (auth.error) return auth.error;

    const body = await request.json();
    const nama = String(body.nama || "").trim();
    const deskripsi = String(body.deskripsi || "").trim();
    const durasi = Number(body.durasi);
    const jumlahSoal = Number(body.jumlahSoal);
    const status = body.status;
    const jadwal = body.jadwal || null;

    if (!nama) {
      return NextResponse.json(
        { message: "Nama tes wajib diisi." },
        { status: 400 }
      );
    }

    if (
      !Number.isInteger(durasi) ||
      durasi < 1 ||
      !Number.isInteger(jumlahSoal) ||
      jumlahSoal < 1
    ) {
      return NextResponse.json(
        { message: "Durasi dan jumlah soal harus bilangan bulat lebih dari 0." },
        { status: 400 }
      );
    }

    if (!["Draft", "Aktif", "Selesai"].includes(status)) {
      return NextResponse.json(
        { message: "Status tes tidak valid." },
        { status: 400 }
      );
    }

    const [result] = await pool.execute(
      `INSERT INTO tes_tpa
        (judul, deskripsi, tanggal_mulai, durasi_menit, jumlah_soal, status)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [nama, deskripsi || null, jadwal || null, durasi, jumlahSoal, status]
    );

    return NextResponse.json(
      {
        success: true,
        message: "Tes TPA berhasil disimpan ke database.",
        id: result.insertId,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST Tes TPA:", error);
    return NextResponse.json(
      { message: "Gagal menyimpan Tes TPA." },
      { status: 500 }
    );
  }
}

// PUT: mengedit data tes atau mengubah statusnya
export async function PUT(request) {
  try {
    const auth = await cekAdmin(request);
    if (auth.error) return auth.error;

    const id = Number(new URL(request.url).searchParams.get("id"));

    if (!Number.isInteger(id) || id < 1) {
      return NextResponse.json(
        { message: "ID tes tidak valid." },
        { status: 400 }
      );
    }

    const body = await request.json();

    if (body.statusOnly === true) {
      if (!["Draft", "Aktif", "Selesai"].includes(body.status)) {
        return NextResponse.json(
          { message: "Status tes tidak valid." },
          { status: 400 }
        );
      }

      const [result] = await pool.execute(
        "UPDATE tes_tpa SET status = ? WHERE id = ?",
        [body.status, id]
      );

      if (result.affectedRows === 0) {
        return NextResponse.json(
          { message: "Tes tidak ditemukan." },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        message: "Status tes berhasil diperbarui.",
      });
    }

    const nama = String(body.nama || "").trim();
    const deskripsi = String(body.deskripsi || "").trim();
    const durasi = Number(body.durasi);
    const jumlahSoal = Number(body.jumlahSoal);
    const status = body.status;
    const jadwal = body.jadwal || null;

    if (!nama) {
      return NextResponse.json(
        { message: "Nama tes wajib diisi." },
        { status: 400 }
      );
    }

    if (
      !Number.isInteger(durasi) ||
      durasi < 1 ||
      !Number.isInteger(jumlahSoal) ||
      jumlahSoal < 1
    ) {
      return NextResponse.json(
        { message: "Durasi dan jumlah soal harus bilangan bulat lebih dari 0." },
        { status: 400 }
      );
    }

    if (!["Draft", "Aktif", "Selesai"].includes(status)) {
      return NextResponse.json(
        { message: "Status tes tidak valid." },
        { status: 400 }
      );
    }

    const [result] = await pool.execute(
      `UPDATE tes_tpa
       SET judul = ?, deskripsi = ?, tanggal_mulai = ?,
           durasi_menit = ?, jumlah_soal = ?, status = ?
       WHERE id = ?`,
      [nama, deskripsi || null, jadwal || null, durasi, jumlahSoal, status, id]
    );

    if (result.affectedRows === 0) {
      const [rows] = await pool.execute(
        "SELECT id FROM tes_tpa WHERE id = ?",
        [id]
      );

      if (rows.length === 0) {
        return NextResponse.json(
          { message: "Tes tidak ditemukan." },
          { status: 404 }
        );
      }
    }

    return NextResponse.json({
      success: true,
      message: "Tes TPA berhasil diperbarui.",
    });
  } catch (error) {
    console.error("PUT Tes TPA:", error);
    return NextResponse.json(
      { message: "Gagal memperbarui Tes TPA." },
      { status: 500 }
    );
  }
}

// DELETE: menghapus tes
export async function DELETE(request) {
  try {
    const auth = await cekAdmin(request);
    if (auth.error) return auth.error;

    const id = Number(new URL(request.url).searchParams.get("id"));

    if (!Number.isInteger(id) || id < 1) {
      return NextResponse.json(
        { message: "ID tes tidak valid." },
        { status: 400 }
      );
    }

    const [result] = await pool.execute(
      "DELETE FROM tes_tpa WHERE id = ?",
      [id]
    );

    if (result.affectedRows === 0) {
      return NextResponse.json(
        { message: "Tes tidak ditemukan." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Tes TPA berhasil dihapus.",
    });
  } catch (error) {
    console.error("DELETE Tes TPA:", error);
    return NextResponse.json(
      { message: "Gagal menghapus Tes TPA." },
      { status: 500 }
    );
  }
}


import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { jwtVerify } from "jose";
import * as XLSX from "xlsx";

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

export async function POST(request) {
  let connection;

  try {
    const authError = await cekAdmin(request);
    if (authError) return authError;

    const formData = await request.formData();
    const tesId = Number(formData.get("tesId"));
    const file = formData.get("file");

    if (!Number.isInteger(tesId) || tesId < 1) {
      return NextResponse.json(
        { message: "ID tes tidak valid." },
        { status: 400 }
      );
    }

    if (
      !file ||
      typeof file.arrayBuffer !== "function" ||
      !file.name
    ) {
      return NextResponse.json(
        { message: "Pilih file Excel terlebih dahulu." },
        { status: 400 }
      );
    }

    if (!/\.(xlsx|xls)$/i.test(file.name)) {
      return NextResponse.json(
        { message: "File harus berformat .xlsx atau .xls." },
        { status: 400 }
      );
    }

    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { message: "Ukuran file maksimal 5 MB." },
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

    const buffer = Buffer.from(await file.arrayBuffer());
    const workbook = XLSX.read(buffer, {
      type: "buffer",
    });

    const namaSheet = workbook.SheetNames[0];

    if (!namaSheet) {
      return NextResponse.json(
        { message: "File Excel tidak memiliki sheet." },
        { status: 400 }
      );
    }

    const sheet = workbook.Sheets[namaSheet];

    const data = XLSX.utils.sheet_to_json(sheet, {
      defval: "",
      raw: false,
    });

    if (data.length === 0 || data.length > 1000) {
      return NextResponse.json(
        {
          message:
            "File harus berisi 1 sampai 1000 baris soal.",
        },
        { status: 400 }
      );
    }

    const wajib = [
      "pertanyaan",
      "opsi_a",
      "opsi_b",
      "opsi_c",
      "opsi_d",
      "kunci_jawaban",
    ];

    const header = Object.keys(data[0]).map((key) =>
      key.trim().toLowerCase()
    );

    const headerKurang = wajib.filter(
      (kolom) => !header.includes(kolom)
    );

    if (headerKurang.length > 0) {
      return NextResponse.json(
        {
          message: `Kolom Excel belum lengkap: ${headerKurang.join(", ")}.`,
        },
        { status: 400 }
      );
    }

    const soal = [];
    const kesalahan = [];

    data.forEach((row, index) => {
      const normalized = {};

      for (const [key, value] of Object.entries(row)) {
        normalized[key.trim().toLowerCase()] = value;
      }

      const item = {
        pertanyaan: String(normalized.pertanyaan ?? "").trim(),
        opsi_a: String(normalized.opsi_a ?? "").trim(),
        opsi_b: String(normalized.opsi_b ?? "").trim(),
        opsi_c: String(normalized.opsi_c ?? "").trim(),
        opsi_d: String(normalized.opsi_d ?? "").trim(),
        kunci_jawaban: String(
          normalized.kunci_jawaban ?? ""
        )
          .trim()
          .toUpperCase(),
      };

      const lengkap =
        item.pertanyaan &&
        item.opsi_a &&
        item.opsi_b &&
        item.opsi_c &&
        item.opsi_d;

      if (
        !lengkap ||
        !["A", "B", "C", "D"].includes(item.kunci_jawaban)
      ) {
        kesalahan.push(
          `Baris ${index + 2}: pertanyaan, opsi, atau kunci jawaban tidak valid.`
        );
        return;
      }

      soal.push(item);
    });

    if (kesalahan.length > 0) {
      return NextResponse.json(
        {
          message: "Import dibatalkan karena ada data tidak valid.",
          kesalahan: kesalahan.slice(0, 30),
          totalKesalahan: kesalahan.length,
        },
        { status: 400 }
      );
    }

    connection = await pool.getConnection();
    await connection.beginTransaction();

    const [jumlahRows] = await connection.execute(
      "SELECT COALESCE(MAX(urutan), 0) AS terakhir FROM soal_tpa WHERE tes_id = ?",
      [tesId]
    );

    let urutan = Number(jumlahRows[0].terakhir) + 1;

    for (const item of soal) {
      await connection.execute(
        `INSERT INTO soal_tpa
          (tes_id, pertanyaan, opsi_a, opsi_b,
           opsi_c, opsi_d, kunci_jawaban, urutan)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          tesId,
          item.pertanyaan,
          item.opsi_a,
          item.opsi_b,
          item.opsi_c,
          item.opsi_d,
          item.kunci_jawaban,
          urutan++,
        ]
      );
    }

    await connection.commit();

    return NextResponse.json({
      success: true,
      message: `${soal.length} soal berhasil diimpor.`,
      jumlah: soal.length,
    });
  } catch (error) {
    if (connection) {
      await connection.rollback();
    }

    console.error("Import Soal TPA:", error);

    return NextResponse.json(
      { message: "Gagal mengimpor soal Excel." },
      { status: 500 }
    );
  } finally {
    if (connection) {
      connection.release();
    }
  }
}

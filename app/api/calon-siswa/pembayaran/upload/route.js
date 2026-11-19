
import pool from "@/lib/db";
import { jwtVerify } from "jose";
import { mkdir, writeFile, unlink } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";

export const runtime = "nodejs";

const MAX_SIZE = 5 * 1024 * 1024;

// ========================================
// CEK SESSION CALON SISWA
// ========================================
async function getCalonSiswa(request) {
  try {
    const cookieHeader = request.headers.get("cookie") || "";

    const sessionCookie = cookieHeader
      .split(";")
      .map((item) => item.trim())
      .find((item) => item.startsWith("spmb_session="));

    if (!sessionCookie) return null;

    const token = sessionCookie.slice("spmb_session=".length);
    const secret = process.env.SESSION_SECRET;

    if (!secret || secret.length < 32) return null;

    const { payload } = await jwtVerify(
      token,
      new TextEncoder().encode(secret)
    );

    if (
      payload.role !== "calon_siswa" ||
      !payload.id
    ) {
      return null;
    }

    return {
      id: Number(payload.id),
    };
  } catch {
    return null;
  }
}

// ========================================
// VALIDASI FILE
// ========================================
async function validateFile(file) {
  const allowedTypes = [
    "image/jpeg",
    "image/png",
    "application/pdf",
  ];

  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      message: "Format file harus JPG, PNG, atau PDF.",
    };
  }

  if (file.size === 0 || file.size > MAX_SIZE) {
    return {
      valid: false,
      message: "Ukuran file maksimal 5 MB.",
    };
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  // Periksa tanda tangan file agar MIME tidak hanya
  // bergantung pada informasi dari browser.
  const isJpeg =
    buffer.length >= 3 &&
    buffer[0] === 0xff &&
    buffer[1] === 0xd8 &&
    buffer[2] === 0xff;

  const isPng =
    buffer.length >= 8 &&
    buffer.subarray(0, 8).equals(
      Buffer.from([
        0x89, 0x50, 0x4e, 0x47,
        0x0d, 0x0a, 0x1a, 0x0a,
      ])
    );

  const isPdf =
    buffer.length >= 5 &&
    buffer.subarray(0, 5).toString() === "%PDF-";

  const validSignature =
    (file.type === "image/jpeg" && isJpeg) ||
    (file.type === "image/png" && isPng) ||
    (file.type === "application/pdf" && isPdf);

  if (!validSignature) {
    return {
      valid: false,
      message: "Isi file tidak sesuai dengan format yang dipilih.",
    };
  }

  return {
    valid: true,
    buffer,
  };
}

// ========================================
// POST: UPLOAD BUKTI PEMBAYARAN
// ========================================
export async function POST(request) {
  let savedFilePath = null;

  try {
    const user = await getCalonSiswa(request);

    if (!user) {
      return Response.json(
        { message: "Silakan login sebagai calon siswa." },
        { status: 401 }
      );
    }

    const formData = await request.formData();

    const file = formData.get("bukti");
    const pembayaranId = Number(
      formData.get("pembayaran_id")
    );

    if (
      !file ||
      typeof file.arrayBuffer !== "function"
    ) {
      return Response.json(
        { message: "Bukti pembayaran wajib diunggah." },
        { status: 400 }
      );
    }

    if (
      !Number.isSafeInteger(pembayaranId) ||
      pembayaranId <= 0
    ) {
      return Response.json(
        { message: "ID pembayaran tidak valid." },
        { status: 400 }
      );
    }

    const validation = await validateFile(file);

    if (!validation.valid) {
      return Response.json(
        { message: validation.message },
        { status: 400 }
      );
    }

    // Pastikan tagihan memang milik calon siswa ini.
    const [rows] = await pool.execute(
      `SELECT id, status, nominal
       FROM pembayaran
       WHERE id = ?
         AND calon_siswa_id = ?
         AND jenis_pembayaran = ?
       LIMIT 1`,
      [pembayaranId, user.id, "Pendaftaran"]
    );

    if (!rows.length) {
      return Response.json(
        { message: "Tagihan pembayaran tidak ditemukan." },
        { status: 404 }
      );
    }

    const pembayaran = rows[0];
    const status = String(
      pembayaran.status
    ).toLowerCase();

    if (status === "diterima") {
      return Response.json(
        { message: "Pembayaran sudah diterima." },
        { status: 400 }
      );
    }

    if (
      ![
        "menunggu pembayaran",
        "ditolak",
        "gagal",
      ].includes(status)
    ) {
      return Response.json(
        {
          message:
            "Bukti pembayaran sudah dikirim dan sedang diproses.",
        },
        { status: 400 }
      );
    }

    // Buat nama file acak, jangan gunakan nama asli
    // sebagai nama file penyimpanan.
    const extensionByType = {
      "image/jpeg": ".jpg",
      "image/png": ".png",
      "application/pdf": ".pdf",
    };

    const filename =
      `${randomUUID()}${extensionByType[file.type]}`;

    const uploadDirectory = path.join(
      process.cwd(),
      "public",
      "uploads",
      "pembayaran"
    );

    await mkdir(uploadDirectory, {
      recursive: true,
    });

    savedFilePath = path.join(
      uploadDirectory,
      filename
    );

    await writeFile(
      savedFilePath,
      validation.buffer,
      { flag: "wx" }
    );

    const relativePath =
      `/uploads/pembayaran/${filename}`;

    // Update tagihan menjadi menunggu verifikasi.
    await pool.execute(
      `UPDATE pembayaran
       SET bukti_pembayaran = ?,
           metode_pembayaran = ?,
           status = ?,
           tanggal_bayar = NOW(),
           catatan_admin = NULL,
           tanggal_verifikasi = NULL
       WHERE id = ?
         AND calon_siswa_id = ?`,
      [
        relativePath,
        "Transfer Bank Manual",
        "Menunggu Verifikasi",
        pembayaranId,
        user.id,
      ]
    );

    return Response.json({
      message: "Bukti pembayaran berhasil diunggah.",
      pembayaran: {
        id: pembayaranId,
        nominal: pembayaran.nominal,
        status: "Menunggu Verifikasi",
        bukti_pembayaran: relativePath,
      },
    });
  } catch (error) {
    // Hapus file jika proses database gagal.
    if (savedFilePath) {
      try {
        await unlink(savedFilePath);
      } catch {}
    }

    console.error("Upload pembayaran error:", error);

    return Response.json(
      { message: "Gagal mengunggah bukti pembayaran." },
      { status: 500 }
    );
  }
}

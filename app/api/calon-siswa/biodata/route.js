
import pool from "@/lib/db";
import { jwtVerify } from "jose";
import fs from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";

export const runtime = "nodejs";

const UPLOAD_DIR = path.join(process.cwd(), "storage", "berkas-spmb");
const MAX_FILE_SIZE = 5 * 1024 * 1024;

const DOCUMENT_TYPES = {
  foto: {
    jenis: "foto",
    mime: ["image/jpeg", "image/png"],
  },
  kk: {
    jenis: "kk",
    mime: ["image/jpeg", "image/png", "application/pdf"],
  },
  akta: {
    jenis: "akta",
    mime: ["image/jpeg", "image/png", "application/pdf"],
  },
  ijazah: {
    jenis: "ijazah",
    mime: ["image/jpeg", "image/png", "application/pdf"],
  },
};

function getExtension(file) {
  const extensions = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "application/pdf": ".pdf",
  };

  return extensions[file.type] || "";
}

async function getCalonSiswa(request) {
  const cookieHeader = request.headers.get("cookie") || "";

  const sessionCookie = cookieHeader
    .split(";")
    .map((item) => item.trim())
    .find((item) => item.startsWith("spmb_session="));

  if (!sessionCookie) return null;

  const token = sessionCookie.slice("spmb_session=".length);
  const secret = process.env.SESSION_SECRET;

  if (!token || !secret || secret.length < 32) return null;

  try {
    const { payload } = await jwtVerify(
      token,
      new TextEncoder().encode(secret),
      { algorithms: ["HS256"] }
    );

    if (
      payload.role !== "calon_siswa" ||
      !payload.sub ||
      !/^\d+$/.test(payload.sub)
    ) {
      return null;
    }

    return { id: Number(payload.sub) };
  } catch {
    return null;
  }
}

function textValue(value) {
  return typeof value === "string" ? value.trim() : "";
}

async function saveUploadedFile(file, documentKey, userId) {
  if (!file || typeof file.arrayBuffer !== "function" || file.size === 0) {
    return null;
  }

  const config = DOCUMENT_TYPES[documentKey];

  if (!config || !config.mime.includes(file.type)) {
    throw new Error(`Format file ${documentKey} tidak diperbolehkan.`);
  }

  if (file.size > MAX_FILE_SIZE) {
    throw new Error(`Ukuran file ${documentKey} maksimal 5 MB.`);
  }

  const extension = getExtension(file);
  const filename = `${userId}-${documentKey}-${randomUUID()}${extension}`;

  await fs.mkdir(UPLOAD_DIR, { recursive: true });

  const buffer = Buffer.from(await file.arrayBuffer());

  // Pemeriksaan sederhana terhadap signature file.
  if (file.type === "image/jpeg" && !(buffer[0] === 0xff && buffer[1] === 0xd8)) {
    throw new Error(`Isi file ${documentKey} bukan JPEG yang valid.`);
  }

  if (file.type === "image/png" && buffer.subarray(0, 8).toString("hex") !== "89504e470d0a1a0a") {
    throw new Error(`Isi file ${documentKey} bukan PNG yang valid.`);
  }

  if (file.type === "application/pdf" && buffer.subarray(0, 5).toString() !== "%PDF-") {
    throw new Error(`Isi file ${documentKey} bukan PDF yang valid.`);
  }

  const absolutePath = path.join(UPLOAD_DIR, filename);
  await fs.writeFile(absolutePath, buffer, { flag: "wx" });

  return {
    jenis: config.jenis,
    nama: file.name.slice(0, 255),
    path: path.join("storage", "berkas-spmb", filename).replace(/\\/g, "/"),
    absolutePath,
  };
}

// GET: mengambil biodata dan daftar dokumen calon siswa.
export async function GET(request) {
  try {
    const session = await getCalonSiswa(request);

    if (!session) {
      return Response.json(
        { message: "Silakan login sebagai calon siswa." },
        { status: 401 }
      );
    }

    const [rows] = await pool.execute(
      `SELECT
        cs.id,
        cs.nama,
        cs.nisn,
        cs.whatsapp AS hp,
        bs.nik,
        bs.tempat_lahir AS tempatLahir,
        bs.tanggal_lahir AS tanggalLahir,
        bs.jenis_kelamin AS jenisKelamin,
        bs.agama,
        bs.foto,
        bs.sekolah,
        bs.tahun_lulus AS tahunLulus,
        bs.email,
        bs.alamat,
        bs.ayah,
        bs.ibu,
        bs.pekerjaan,
        bs.hp_ortu AS hpOrtu
      FROM calon_siswa cs
      LEFT JOIN biodata_siswa bs
        ON bs.calon_siswa_id = cs.id
      WHERE cs.id = ?
      LIMIT 1`,
      [session.id]
    );

    if (rows.length === 0) {
      return Response.json(
        { message: "Akun calon siswa tidak ditemukan." },
        { status: 404 }
      );
    }

    const [documents] = await pool.execute(
      `SELECT jenis_berkas, nama_file, status_verifikasi
       FROM berkas_calon_siswa
       WHERE user_id = ?
       ORDER BY tanggal_upload DESC`,
      [session.id]
    );

    return Response.json({
      message: "Data diri berhasil diambil.",
      data: rows[0],
      documents,
    });
  } catch (error) {
    console.error("GET biodata error:", error);

    return Response.json(
      { message: "Gagal mengambil data diri." },
      { status: 500 }
    );
  }
}

// POST: menyimpan biodata dan dokumen.
export async function POST(request) {
  let connection;
  const savedFiles = [];

  try {
    const session = await getCalonSiswa(request);

    if (!session) {
      return Response.json(
        { message: "Silakan login sebagai calon siswa." },
        { status: 401 }
      );
    }

    const formData = await request.formData();

    const nama = textValue(formData.get("nama"));
    const nisn = textValue(formData.get("nisn"));
    const hp = textValue(formData.get("hp"));
    const nik = textValue(formData.get("nik"));
    const tempatLahir = textValue(formData.get("tempatLahir"));
    const tanggalLahir = textValue(formData.get("tanggalLahir"));
    const jenisKelamin = textValue(formData.get("jenisKelamin"));
    const agama = textValue(formData.get("agama"));
    const sekolah = textValue(formData.get("sekolah"));
    const tahunLulus = textValue(formData.get("tahunLulus"));
    const email = textValue(formData.get("email")).toLowerCase();
    const alamat = textValue(formData.get("alamat"));
    const ayah = textValue(formData.get("ayah"));
    const ibu = textValue(formData.get("ibu"));
    const pekerjaan = textValue(formData.get("pekerjaan"));
    const hpOrtu = textValue(formData.get("hpOrtu"));

    if (!nama || !nisn || !hp) {
      return Response.json(
        { message: "Nama, NISN, dan nomor WhatsApp wajib diisi." },
        { status: 400 }
      );
    }

    if (!/^\d{10}$/.test(nisn)) {
      return Response.json(
        { message: "NISN harus terdiri dari 10 angka." },
        { status: 400 }
      );
    }

    if (nik && !/^\d{16}$/.test(nik)) {
      return Response.json(
        { message: "NIK harus terdiri dari 16 angka." },
        { status: 400 }
      );
    }

    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return Response.json(
        { message: "Format email tidak valid." },
        { status: 400 }
      );
    }

    if (jenisKelamin && !["Laki-laki", "Perempuan"].includes(jenisKelamin)) {
      return Response.json(
        { message: "Jenis kelamin tidak valid." },
        { status: 400 }
      );
    }

    if (tanggalLahir && !/^\d{4}-\d{2}-\d{2}$/.test(tanggalLahir)) {
      return Response.json(
        { message: "Format tanggal lahir tidak valid." },
        { status: 400 }
      );
    }

    if (tahunLulus && !/^\d{4}$/.test(tahunLulus)) {
      return Response.json(
        { message: "Tahun lulus harus terdiri dari 4 angka." },
        { status: 400 }
      );
    }

    // Validasi akun dan NISN sebelum menyimpan file.
    const [accounts] = await pool.execute(
      `SELECT id, nisn FROM calon_siswa WHERE id = ? LIMIT 1`,
      [session.id]
    );

    if (accounts.length === 0 || accounts[0].nisn !== nisn) {
      return Response.json(
        { message: "NISN tidak sesuai dengan akun yang sedang login." },
        { status: 400 }
      );
    }

    // Simpan file yang dipilih.
    const uploaded = {};

    for (const key of Object.keys(DOCUMENT_TYPES)) {
      const file = formData.get(key);

      if (file && typeof file.arrayBuffer === "function" && file.size > 0) {
        const saved = await saveUploadedFile(file, key, session.id);
        uploaded[key] = saved;
        savedFiles.push(saved);
      }
    }

    connection = await pool.getConnection();
    await connection.beginTransaction();

    await connection.execute(
      `UPDATE calon_siswa
       SET nama = ?, whatsapp = ?
       WHERE id = ?`,
      [nama, hp, session.id]
    );

    const fotoPath = uploaded.foto?.path || null;

    await connection.execute(
      `INSERT INTO biodata_siswa (
        calon_siswa_id,
        nik,
        tempat_lahir,
        tanggal_lahir,
        jenis_kelamin,
        agama,
        foto,
        sekolah,
        tahun_lulus,
        email,
        alamat,
        ayah,
        ibu,
        pekerjaan,
        hp_ortu
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        nik = VALUES(nik),
        tempat_lahir = VALUES(tempat_lahir),
        tanggal_lahir = VALUES(tanggal_lahir),
        jenis_kelamin = VALUES(jenis_kelamin),
        agama = VALUES(agama),
        foto = COALESCE(VALUES(foto), foto),
        sekolah = VALUES(sekolah),
        tahun_lulus = VALUES(tahun_lulus),
        email = VALUES(email),
        alamat = VALUES(alamat),
        ayah = VALUES(ayah),
        ibu = VALUES(ibu),
        pekerjaan = VALUES(pekerjaan),
        hp_ortu = VALUES(hp_ortu)`,
      [
        session.id,
        nik || null,
        tempatLahir || null,
        tanggalLahir || null,
        jenisKelamin || null,
        agama || null,
        fotoPath,
        sekolah || null,
        tahunLulus || null,
        email || null,
        alamat || null,
        ayah || null,
        ibu || null,
        pekerjaan || null,
        hpOrtu || null,
      ]
    );

    // Simpan informasi dokumen. Jika jenis dokumen sudah ada,
    // perbarui berkas terbaru untuk jenis tersebut.
    for (const key of Object.keys(uploaded)) {
      const document = uploaded[key];

      const [existing] = await connection.execute(
        `SELECT id
         FROM berkas_calon_siswa
         WHERE user_id = ? AND jenis_berkas = ?
         ORDER BY tanggal_upload DESC
         LIMIT 1`,
        [session.id, document.jenis]
      );

      if (existing.length > 0) {
        await connection.execute(
          `UPDATE berkas_calon_siswa
           SET nama_file = ?,
               path_file = ?,
               status_verifikasi = 'Belum Diverifikasi',
               catatan_admin = NULL,
               tanggal_upload = CURRENT_TIMESTAMP,
               tanggal_verifikasi = NULL
           WHERE id = ? AND user_id = ?`,
          [document.nama, document.path, existing[0].id, session.id]
        );
      } else {
        await connection.execute(
          `INSERT INTO berkas_calon_siswa
           (user_id, jenis_berkas, nama_file, path_file)
           VALUES (?, ?, ?, ?)`,
          [session.id, document.jenis, document.nama, document.path]
        );
      }
    }

    await connection.commit();

    return Response.json({
      success: true,
      message: "Data diri dan dokumen berhasil disimpan.",
    });
  } catch (error) {
    if (connection) {
      await connection.rollback().catch(() => {});
    }

    // Hapus file baru jika transaksi database gagal.
    await Promise.all(
      savedFiles.map((file) =>
        fs.unlink(file.absolutePath).catch(() => {})
      )
    );

    console.error("POST biodata error:", error);

    return Response.json(
      {
        message: error instanceof Error
          ? error.message
          : "Gagal menyimpan data diri dan dokumen.",
      },
      { status: 500 }
    );
  } finally {
    if (connection) connection.release();
  }
}

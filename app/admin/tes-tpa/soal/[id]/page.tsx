
"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import AdminSidebar from "../../../AdminSidebar";
import "./soal.css";

type Soal = {
  id: number;
  tes_id: number;
  pertanyaan: string;
  opsi_a: string;
  opsi_b: string;
  opsi_c: string;
  opsi_d: string;
  kunci_jawaban: "A" | "B" | "C" | "D";
  urutan: number;
};

export default function KelolaSoalTPA() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const tesId = Number(params.id);

  const [soal, setSoal] = useState<Soal[]>([]);
  const [loading, setLoading] = useState(true);
  const [simpan, setSimpan] = useState(false);
  const [pesan, setPesan] = useState("");
  const [error, setError] = useState("");
  const [file, setFile] = useState<File | null>(null);

  const [pertanyaan, setPertanyaan] = useState("");
  const [opsiA, setOpsiA] = useState("");
  const [opsiB, setOpsiB] = useState("");
  const [opsiC, setOpsiC] = useState("");
  const [opsiD, setOpsiD] = useState("");
  const [kunci, setKunci] = useState<"A" | "B" | "C" | "D">("A");

  async function muatSoal() {
    try {
      setLoading(true);

      const response = await fetch(
        `/api/admin/tes-tpa/soal?tesId=${tesId}`,
        { cache: "no-store" }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Gagal memuat soal.");
      }

      setSoal(data.data || []);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Gagal memuat soal."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!Number.isInteger(tesId) || tesId < 1) {
      setError("ID tes tidak valid.");
      setLoading(false);
      return;
    }

    void muatSoal();
  }, [tesId]);

  async function tambahSoal(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setPesan("");
    setSimpan(true);

    try {
      const response = await fetch("/api/admin/tes-tpa/soal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tesId,
          pertanyaan,
          opsi_a: opsiA,
          opsi_b: opsiB,
          opsi_c: opsiC,
          opsi_d: opsiD,
          kunci_jawaban: kunci,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Gagal menambah soal.");
      }

      setPesan(data.message);
      setPertanyaan("");
      setOpsiA("");
      setOpsiB("");
      setOpsiC("");
      setOpsiD("");
      setKunci("A");

      await muatSoal();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Gagal menambah soal."
      );
    } finally {
      setSimpan(false);
    }
  }

  async function importExcel(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setPesan("");

    if (!file) {
      setError("Pilih file Excel terlebih dahulu.");
      return;
    }

    setSimpan(true);

    try {
      const formData = new FormData();
      formData.append("tesId", String(tesId));
      formData.append("file", file);

      const response = await fetch(
        "/api/admin/tes-tpa/soal/import",
        {
          method: "POST",
          body: formData,
        }
      );

      const data = await response.json();

      if (!response.ok) {
        const detail = Array.isArray(data.kesalahan)
          ? "\n" + data.kesalahan.join("\n")
          : "";

        throw new Error((data.message || "Import gagal.") + detail);
      }

      setPesan(data.message);
      setFile(null);

      const input = document.getElementById(
        "file-excel"
      ) as HTMLInputElement | null;

      if (input) input.value = "";

      await muatSoal();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Import gagal."
      );
    } finally {
      setSimpan(false);
    }
  }

  async function hapusSoal(id: number) {
    if (!window.confirm("Yakin ingin menghapus soal ini?")) return;

    setError("");
    setPesan("");

    try {
      const response = await fetch(
        `/api/admin/tes-tpa/soal/${id}`,
        { method: "DELETE" }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Gagal menghapus soal.");
      }

      setPesan(data.message);
      await muatSoal();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Gagal menghapus soal."
      );
    }
  }

  return (
    <div className="admin soal-layout">
      <AdminSidebar />

      <main className="main soal-main">
        <div className="soal-breadcrumb">
          <Link href="/admin">Dashboard</Link>
          <span>›</span>
          <Link href="/admin/tes-tpa">Tes TPA</Link>
          <span>›</span>
          <strong>Kelola Soal</strong>
        </div>

        <header className="soal-header">
          <div>
            <h1>Kelola Soal TPA</h1>
            <p>
              Tambahkan soal manual atau impor banyak soal
              menggunakan file Excel.
            </p>
          </div>

          <button
            type="button"
            className="soal-button secondary"
            onClick={() => router.push("/admin/tes-tpa")}
          >
            Kembali ke Tes
          </button>
        </header>

        <div className="soal-summary">
          <div>
            <span>ID Tes</span>
            <strong>{tesId}</strong>
          </div>
          <div>
            <span>Total Soal</span>
            <strong>{soal.length}</strong>
          </div>
        </div>

        {pesan && (
          <div className="soal-alert success" role="status">
            {pesan}
          </div>
        )}

        {error && (
          <div className="soal-alert error" role="alert">
            {error}
          </div>
        )}

        <section className="soal-panel">
          <h2>Import Soal dari Excel</h2>
          <p>
            Gunakan kolom pertanyaan, opsi_a, opsi_b, opsi_c,
            opsi_d, dan kunci_jawaban.
          </p>

          <form onSubmit={importExcel} className="soal-import-form">
            <input
              id="file-excel"
              type="file"
              accept=".xlsx,.xls"
              onChange={(event) =>
                setFile(event.target.files?.[0] || null)
              }
              disabled={simpan}
            />

            <button
              type="submit"
              className="soal-button primary"
              disabled={simpan || !file}
            >
              {simpan ? "Memproses..." : "Import Excel"}
            </button>
          </form>

          <p className="soal-note">
            Maksimal 5 MB dan 1.000 soal per file. Import
            menambahkan soal ke daftar yang sudah ada, bukan
            menggantikan soal lama.
          </p>
        </section>

        <section className="soal-panel">
          <h2>Tambah Soal Manual</h2>

          <form onSubmit={tambahSoal} className="soal-form">
            <label>
              Pertanyaan
              <textarea
                required
                value={pertanyaan}
                onChange={(e) => setPertanyaan(e.target.value)}
                placeholder="Tuliskan pertanyaan TPA..."
                rows={3}
              />
            </label>

            <div className="soal-options-grid">
              <label>
                Opsi A
                <input
                  required
                  value={opsiA}
                  onChange={(e) => setOpsiA(e.target.value)}
                />
              </label>

              <label>
                Opsi B
                <input
                  required
                  value={opsiB}
                  onChange={(e) => setOpsiB(e.target.value)}
                />
              </label>

              <label>
                Opsi C
                <input
                  required
                  value={opsiC}
                  onChange={(e) => setOpsiC(e.target.value)}
                />
              </label>

              <label>
                Opsi D
                <input
                  required
                  value={opsiD}
                  onChange={(e) => setOpsiD(e.target.value)}
                />
              </label>
            </div>

            <label>
              Kunci jawaban
              <select
                value={kunci}
                onChange={(e) =>
                  setKunci(e.target.value as "A" | "B" | "C" | "D")
                }
              >
                <option value="A">A</option>
                <option value="B">B</option>
                <option value="C">C</option>
                <option value="D">D</option>
              </select>
            </label>

            <button
              type="submit"
              className="soal-button primary"
              disabled={simpan}
            >
              {simpan ? "Menyimpan..." : "Simpan Soal"}
            </button>
          </form>
        </section>

        <section className="soal-panel">
          <h2>Daftar Soal ({soal.length})</h2>

          {loading ? (
            <p>Memuat soal...</p>
          ) : soal.length === 0 ? (
            <p>Belum ada soal untuk tes ini.</p>
          ) : (
            <div className="soal-list">
              {soal.map((item, index) => (
                <article className="soal-item" key={item.id}>
                  <div className="soal-item-top">
                    <strong>Soal {index + 1}</strong>
                    <button
                      type="button"
                      className="soal-delete"
                      disabled={simpan}
                      onClick={() => void hapusSoal(item.id)}
                    >
                      Hapus
                    </button>
                  </div>

                  <p>{item.pertanyaan}</p>

                  <ol type="A">
                    <li>{item.opsi_a}</li>
                    <li>{item.opsi_b}</li>
                    <li>{item.opsi_c}</li>
                    <li>{item.opsi_d}</li>
                  </ol>

                  <small>
                    Kunci jawaban: {item.kunci_jawaban}
                  </small>
                </article>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

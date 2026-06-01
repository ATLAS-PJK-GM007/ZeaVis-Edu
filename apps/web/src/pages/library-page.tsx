import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { mockDiseases } from "@/data/mock-diseases";

export function LibraryPage() {
  type Disease = (typeof mockDiseases)[number];

  const [filter, setFilter] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [selected, setSelected] = useState<Disease | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const items = useMemo(() => {
    if (!filter) return mockDiseases;
    return mockDiseases.filter((d) =>
      d.name.toLowerCase().includes(filter.toLowerCase()),
    );
  }, [filter]);

  return (
    <main className="p-6">
      <h1 className="text-2xl font-semibold mb-4">Pustaka Penyakit</h1>
      <div className="mb-4">
        <input
          placeholder="Filter penyakit..."
          value={filter ?? ""}
          onChange={(e) => setFilter(e.target.value || null)}
          className="border px-3 py-2 rounded-md w-full max-w-sm"
        />
      </div>

      <div className="grid grid-cols-1 gap-4">
        {items.map((d) => (
          <article key={d.id} className="bg-white p-4 rounded-lg shadow">
            <div className="flex gap-4">
              <img
                src={d.imageUrl}
                alt={d.name}
                className="h-28 w-48 rounded-md object-cover"
              />
              <div className="flex-1">
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="font-semibold text-lg">
                      {d.name}{" "}
                      <span className="text-sm text-muted-foreground">
                        {d.severity}
                      </span>
                    </h2>
                    <p className="text-sm text-muted-foreground mt-2">
                      {d.description}
                    </p>
                    {d.pathogen && (
                      <div className="mt-2 text-sm">
                        <strong>Patogen:</strong> {d.pathogen}
                      </div>
                    )}
                    <div className="mt-3 flex items-center gap-3">
                      <Button
                        variant="default"
                        onClick={() => {
                          setSelected(d);
                          setModalOpen(true);
                        }}
                        className="inline-flex items-center gap-2 bg-green-600 text-white px-3 py-1 rounded"
                      >
                        <BookOpen className="h-4 w-4" />
                        <span className="text-sm">Baca lebih lanjut</span>
                      </Button>
                      <Link
                        to={`/catalog/${d.slug}`}
                        className="text-sm text-muted-foreground"
                      >
                        Lihat halaman katalog
                      </Link>
                    </div>
                  </div>
                  <div>
                    <button
                      className="text-sm text-primary underline"
                      onClick={() =>
                        setExpandedId(expandedId === d.id ? null : d.id)
                      }
                    >
                      {expandedId === d.id ? "Tutup" : "Detail"}
                    </button>
                  </div>
                </div>

                {expandedId === d.id && (
                  <div className="mt-4 grid grid-cols-2 gap-4">
                    <div>
                      <h3 className="font-medium">Gejala</h3>
                      <ul className="list-disc list-inside text-sm mt-2">
                        {(d.symptoms || []).length > 0 ? (
                          d.symptoms.map((s: string, i: number) => (
                            <li key={`${d.id}-symptom-${i}`}>{s}</li>
                          ))
                        ) : (
                          <li>Tidak ada gejala khusus</li>
                        )}
                      </ul>
                    </div>
                    <div>
                      <h3 className="font-medium">Pencegahan</h3>
                      <p className="text-sm mt-2">{d.prevention}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </article>
        ))}
      </div>

      <Modal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setSelected(null);
        }}
        title={selected?.name}
        footer={
          selected && (
            <div className="flex items-center justify-end gap-3">
              <Link
                to={`/catalog/${selected.slug}`}
                className="px-3 py-2 rounded bg-green-600 text-white text-sm"
              >
                Buka halaman katalog
              </Link>
              <button
                onClick={() => {
                  setModalOpen(false);
                  setSelected(null);
                }}
                className="px-3 py-2 rounded bg-gray-200 text-sm"
              >
                Tutup
              </button>
            </div>
          )
        }
      >
        {selected ? (
          <div className="grid grid-cols-1 gap-4">
            <img
              src={selected.imageUrl}
              alt={selected.name}
              className="w-full rounded-md object-cover"
            />
            <div>
              <p className="text-sm text-muted-foreground">
                {selected.description}
              </p>
              {selected.pathogen && (
                <p className="mt-2">
                  <strong>Patogen:</strong> {selected.pathogen}
                </p>
              )}
              <h4 className="mt-3 font-medium">Gejala</h4>
              <ul className="list-disc list-inside text-sm mt-2">
                {(selected.symptoms || []).length > 0 ? (
                  selected.symptoms.map((s: string, i: number) => (
                    <li key={`${selected.id}-symptom-${i}`}>{s}</li>
                  ))
                ) : (
                  <li>Tidak ada gejala khusus</li>
                )}
              </ul>
              <h4 className="mt-3 font-medium">Pencegahan</h4>
              <p className="text-sm mt-2">{selected.prevention}</p>
            </div>
          </div>
        ) : null}
      </Modal>
    </main>
  );
}

import { useState, useEffect, useMemo } from "react";
import { type LabelConfig, LABEL_CONFIG } from "./LabelConfig";
import { getImpressora } from "../service/impressora";
import type { Impressora } from "../types/Impressora";

interface UsePrintConfigReturn {
  impressoras: Impressora[];
  selectedId: string;
  config: LabelConfig;
  loading: boolean;
  setSelectedId: (id: string) => void;
}

export function usePrintConfig(): UsePrintConfigReturn {
  const [impressoras, setImpressoras] = useState<Impressora[]>([]);
  const [selectedId, setSelectedId] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchImpressoras() {
      try {
        const data = await getImpressora();
        const lista: Impressora[] = data.impressoras ?? [];
        setImpressoras(lista);

        const atual = lista.find((i) => i.impressoraId === data.impressoraAtualId);
        const padrao = atual ?? lista[0];
        if (padrao) setSelectedId(padrao.identificacao);
      } catch (err) {
        console.error("Erro ao buscar impressoras:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchImpressoras();
  }, []);

  // Memoizado: só recria o objeto config quando a impressora selecionada muda
  // Isso evita que PrintLabelModal re-gere barcode/PDF a cada render do pai
  const config = useMemo<LabelConfig>(() => {
    const selected = impressoras.find((i) => i.identificacao === selectedId);
    if (!selected) return LABEL_CONFIG;

    return {
      labelW: selected.largura,
      labelH: selected.altura,
      labelsPerPage: selected.qtdPorLinha,
      colGap: selected.espacamento ?? 0,
      previewScale: LABEL_CONFIG.previewScale,
    };
  }, [impressoras, selectedId]);

  return { impressoras, selectedId, config, loading, setSelectedId };
}
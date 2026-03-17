// ─────────────────────────────────────────────────────────────────────────────
//     CONFIGURAÇÃO DE TAMANHO DA ETIQUETA
//     Todas as unidades em mm. Zero CSS string, zero conversão manual.
// ─────────────────────────────────────────────────────────────────────────────

export interface LabelConfig {
  labelW: number;       // largura da etiqueta em mm
  labelH: number;       // altura da etiqueta em mm
  labelsPerPage: number;
  colGap: number;       // espaço entre etiquetas na mesma página (mm)
  previewScale: number; // apenas para preview DOM, não afeta o PDF
}

export const LABEL_CONFIG: LabelConfig = {
  labelW: 33,
  labelH: 22,
  labelsPerPage: 2,
  colGap: 3,
  previewScale: 3,
};


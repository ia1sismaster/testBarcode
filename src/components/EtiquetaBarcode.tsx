//instalar
//npm i jsbarcode
//npm i -D @types/jsbarcode

// exemplo de uso
//import React, { useRef } from 'react';
//import EtiquetaBarcode, {
//  EtiquetaBarcodeHandle,
//} from '@/components/etiquetas/EtiquetaBarcode';
//
//export default function ProdutoEtiquetaPage() {
//  const etiquetaRef = useRef<EtiquetaBarcodeHandle>(null);
//
//  return (
//    <>
//      <button onClick={() => etiquetaRef.current?.print()}>
//        Imprimir etiqueta
//      </button>
//
//      <EtiquetaBarcode
//        ref={etiquetaRef}
//        codigo="7891234567890"
//        descricao="PARAFUSO SEXTAVADO 10MM"
//        preco={19.9}
//        larguraMm={20}
//        alturaMm={30}
//        quantidade={1}
//      />
//    </>
//  );
//}

import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
} from 'react';
import JsBarcode from 'jsbarcode';

export type EtiquetaBarcodeHandle = {
  print: () => void;
};

type EtiquetaBarcodeProps = {
  codigo: string;
  descricao: string;
  preco?: string | number;
  larguraMm?: number;   // padrão 20mm
  alturaMm?: number;    // padrão 30mm
  quantidade?: number;  // quantidade de etiquetas na impressão
  className?: string;
};

const sanitizeCodigo = (valor: string) => String(valor ?? '').trim();

const formatarPreco = (valor?: string | number) => {
  if (valor === undefined || valor === null || valor === '') return '';
  if (typeof valor === 'string') return valor;
  return valor.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
};

export const EtiquetaBarcode = forwardRef<EtiquetaBarcodeHandle, EtiquetaBarcodeProps>(
  (
    {
      codigo,
      descricao,
      preco,
      larguraMm = 20,
      alturaMm = 30,
      quantidade = 1,
      className,
    },
    ref
  ) => {
    const printAreaRef = useRef<HTMLDivElement>(null);
    const svgRefs = useRef<SVGSVGElement[]>([]);

    const codigoLimpo = useMemo(() => sanitizeCodigo(codigo), [codigo]);
    const precoFormatado = useMemo(() => formatarPreco(preco), [preco]);

    useEffect(() => {
      svgRefs.current.forEach((svg) => {
        if (!svg) return;

        JsBarcode(svg, codigoLimpo, {
          format: 'CODE128',
          width: 1,
          height: 16,
          margin: 0,
          displayValue: false,
          valid: (isValid) => {
            if (!isValid) {
              svg.innerHTML = '';
            }
          },
        });
      });
    }, [codigoLimpo, quantidade]);

    const handlePrint = () => {
      const conteudo = printAreaRef.current?.innerHTML;
      if (!conteudo) return;

      const janela = window.open('', '_blank', 'width=800,height=600');
      if (!janela) return;

      const html = `
        <!DOCTYPE html>
        <html lang="pt-BR">
          <head>
            <meta charset="UTF-8" />
            <title>Impressão de Etiqueta</title>
            <style>
              @page {
                size: ${larguraMm}mm ${alturaMm}mm;
                margin: 0;
              }

              * {
                box-sizing: border-box;
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
              }

              html, body {
                margin: 0;
                padding: 0;
              }

              body {
                font-family: Arial, Helvetica, sans-serif;
              }

              .page {
                display: flex;
                flex-direction: column;
                gap: 0;
                margin: 0;
                padding: 0;
              }

              .etiqueta {
                width: ${larguraMm}mm;
                height: ${alturaMm}mm;
                padding: 1mm;
                overflow: hidden;
                display: flex;
                flex-direction: column;
                justify-content: space-between;
                align-items: center;
                page-break-after: always;
                break-after: page;
              }

              .etiqueta:last-child {
                page-break-after: auto;
                break-after: auto;
              }

              .descricao {
                width: 100%;
                text-align: center;
                font-size: 7px;
                line-height: 1.1;
                font-weight: 600;
                display: -webkit-box;
                -webkit-line-clamp: 2;
                -webkit-box-orient: vertical;
                overflow: hidden;
                min-height: 8mm;
              }

              .barcode-wrap {
                width: 100%;
                display: flex;
                justify-content: center;
                align-items: center;
                min-height: 10mm;
              }

              .barcode-svg {
                width: 100%;
                height: 8mm;
              }

              .codigo {
                width: 100%;
                text-align: center;
                font-size: 6px;
                line-height: 1;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
                margin-top: 0.5mm;
              }

              .preco {
                width: 100%;
                text-align: center;
                font-size: 8px;
                font-weight: 700;
                line-height: 1.1;
                min-height: 4mm;
              }

              svg {
                shape-rendering: crispEdges;
              }
            </style>
          </head>
          <body>
            <div class="page">${conteudo}</div>
            <script>
              window.onload = function() {
                window.print();
                window.onafterprint = function() {
                  window.close();
                };
              };
            </script>
          </body>
        </html>
      `;

      janela.document.open();
      janela.document.write(html);
      janela.document.close();
    };

    useImperativeHandle(ref, () => ({
      print: handlePrint,
    }));

    const totalEtiquetas = Math.max(1, quantidade);

    return (
      <div className={className}>
        <div ref={printAreaRef} style={{ display: 'none' }}>
          {Array.from({ length: totalEtiquetas }).map((_, index) => (
            <div className="etiqueta" key={`etq-${index}`}>
              <div className="descricao">{descricao}</div>

              <div className="barcode-wrap">
                <svg
                  ref={(el) => {
                    if (el) svgRefs.current[index] = el;
                  }}
                  className="barcode-svg"
                />
              </div>

              <div className="codigo">{codigoLimpo}</div>

              <div className="preco">{precoFormatado}</div>
            </div>
          ))}
        </div>
      </div>
    );
  }
);

EtiquetaBarcode.displayName = 'EtiquetaBarcode';

export default EtiquetaBarcode;
"use client";

import { useCallback, useState } from "react";

interface StyleBackup {
  element: HTMLElement;
  cssText: string;
}

function applyPdfOverrides(root: HTMLElement): StyleBackup[] {
  const selectors: Array<{ query: string; style: Partial<CSSStyleDeclaration> }> = [
    {
      query: ".pdf-export-panel",
      style: {
        border: "none",
        boxShadow: "none",
        outline: "none",
      },
    },
    {
      query:
        ".pdf-export-table-wrap, .pdf-export-table-shell, .pdf-export-graph-shell",
      style: {
        border: "none",
        boxShadow: "none",
      },
    },
    {
      query: ".pdf-export-table-wrap, .pdf-export-gantt-scroll, [data-slot='table-container']",
      style: {
        overflow: "visible",
      },
    },
    {
      query: ".pdf-export-gantt-inner",
      style: {
        minWidth: "0",
      },
    },
  ];

  const backups: StyleBackup[] = [];

  for (const { query, style } of selectors) {
    const elements = root.querySelectorAll<HTMLElement>(query);
    elements.forEach((element) => {
      backups.push({ element, cssText: element.style.cssText });
      Object.assign(element.style, style);
    });
  }

  return backups;
}

function restoreStyles(backups: StyleBackup[]) {
  backups.forEach(({ element, cssText }) => {
    element.style.cssText = cssText;
  });
}

export function usePdfExport() {
  const [exporting, setExporting] = useState(false);

  const exportPdf = useCallback(
    async (elementId: string, filename = "cpm-wyniki.pdf") => {
      const element = document.getElementById(elementId);
      if (!element) {
        console.warn(`Element #${elementId} not found`);
        return;
      }

      setExporting(true);
      let styleBackups: StyleBackup[] = [];
      try {
        element.classList.add("pdf-export-mode");
        styleBackups = applyPdfOverrides(element);

        await new Promise<void>((resolve) => {
          requestAnimationFrame(() => resolve());
        });

        const [{ default: jsPDF }, { toPng }] =
          await Promise.all([
            import("jspdf"),
            import("html-to-image"),
          ]);

        const dataUrl = await toPng(element, {
          cacheBust: true,
          pixelRatio: 2,
          backgroundColor: "#ffffff",
          style: {
            backgroundColor: "#ffffff",
          },
        });

        const img = new Image();
        img.src = dataUrl;
        await new Promise((resolve, reject) => {
          img.onload = resolve;
          img.onerror = reject;
        });

        const isLandscape = img.width > img.height;

        const pdf = new jsPDF({
          orientation: isLandscape ? "landscape" : "portrait",
          unit: "px",
          format: [img.width / 2, img.height / 2],
        });

        pdf.addImage(dataUrl, "PNG", 0, 0, img.width / 2, img.height / 2);
        pdf.save(filename);
      } catch (err) {
        console.error("PDF export failed:", err);
      } finally {
        restoreStyles(styleBackups);
        element.classList.remove("pdf-export-mode");
        setExporting(false);
      }
    },
    []
  );

  return { exportPdf, exporting };
}
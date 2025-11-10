"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { QRCodeCanvas } from "qrcode.react";

export default function QRPage() {
  const [origin, setOrigin] = useState<string>("");
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setOrigin(window.location.origin);
    }
  }, []);

  const targetUrl = useMemo(() => {
    // Simple: send users to the spinner at the root
    return origin ? `${origin}/` : "";
  }, [origin]);

  function downloadPng() {
    const canvas = document.querySelector<HTMLCanvasElement>("canvas");
    if (!canvas) return;
    const link = document.createElement("a");
    link.download = "spin-qr.png";
    link.href = canvas.toDataURL("image/png");
    link.click();
  }

  function printQR() {
    window.print();
  }

  return (
    <div className="min-h-screen bg-[#f9fafb] px-4 py-10">
      <div className="mx-auto max-w-xl rounded-2xl bg-white p-8 shadow">
        <h1 className="mb-6 text-center text-2xl font-semibold text-[#079964]">
          Event QR Code
        </h1>

        <div className="flex flex-col items-center gap-6">
          <div className="rounded-2xl border border-[#e8fdf3] bg-[#e8fdf3] p-6">
            {targetUrl && (
              <QRCodeCanvas
                value={targetUrl}
                size={256}
                bgColor="#ffffff"
                fgColor="#079964"
                includeMargin
              />
            )}
          </div>
          <p className="text-center text-sm text-[#02281c]/70 break-all">
            {targetUrl || "Generating..."}
          </p>

          <div className="mt-2 flex gap-3">
            <button
              onClick={downloadPng}
              className="rounded-md bg-[#079964] px-4 py-2 text-white hover:bg-[#057852]"
            >
              Download PNG
            </button>
            <button
              onClick={printQR}
              className="rounded-md border border-[#e8fdf3] bg-white px-4 py-2 text-[#079964] hover:bg-[#e8fdf3]"
            >
              Print
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}



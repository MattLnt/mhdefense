"use client";

import { useState, useEffect, useRef } from "react";
import styles from "./Qrcode.module.css";

// Palette MH
const COULEURS = [
  { hex: "#170A11", name: "Nuit" },
  { hex: "#D64C7F", name: "Rose" },
  { hex: "#6E2A3B", name: "Vin" },
  { hex: "#F0699A", name: "Rose clair" },
  { hex: "#000000", name: "Noir" },
];

const BASE_URL =
  typeof window !== "undefined" ? window.location.origin : "https://mhdefense.vercel.app";

const PRESETS = [
  { label: "Réservation", path: "/reservation" },
  { label: "Accueil", path: "/" },
  { label: "Instagram", url: "https://instagram.com/mh_defense" },
];

const STYLES_MODULE = [
  { key: "rounded", label: "Arrondi" },
  { key: "dots", label: "Points" },
  { key: "square", label: "Carré" },
];

export default function QrcodePage() {
  const [destination, setDestination] = useState(`${BASE_URL}/reservation`);
  const [activePreset, setActivePreset] = useState("/reservation");
  const [fgColor, setFgColor] = useState("#170A11");
  const [dotStyle, setDotStyle] = useState("rounded");
  const [withLogo, setWithLogo] = useState(false);

  const previewRef = useRef(null);
  const qrRef = useRef(null);
  const QRLib = useRef(null);

  // Charge la lib + crée l'instance QR une fois
  useEffect(() => {
    let mounted = true;
    import("qr-code-styling").then((mod) => {
      if (!mounted) return;
      QRLib.current = mod.default;
      qrRef.current = new mod.default(buildOptions());
      if (previewRef.current) {
        previewRef.current.innerHTML = "";
        qrRef.current.append(previewRef.current);
      }
    });
    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Met à jour le QR à chaque changement
  useEffect(() => {
    if (qrRef.current) {
      qrRef.current.update(buildOptions());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [destination, fgColor, dotStyle, withLogo]);

  function buildOptions() {
    const dotsType =
      dotStyle === "rounded" ? "rounded" : dotStyle === "dots" ? "dots" : "square";
    return {
      width: 300,
      height: 300,
      type: "svg",
      data: destination || BASE_URL,
      margin: 8,
      dotsOptions: { color: fgColor, type: dotsType },
      cornersSquareOptions: {
        color: fgColor,
        type: dotStyle === "square" ? "square" : "extra-rounded",
      },
      cornersDotOptions: { color: fgColor, type: dotStyle === "dots" ? "dot" : undefined },
      backgroundOptions: { color: "#ffffff" },
      image: withLogo ? "/logo-mark.png" : undefined,
      imageOptions: { crossOrigin: "anonymous", margin: 6, imageSize: 0.4 },
      qrOptions: { errorCorrectionLevel: "H" },
    };
  }

  function choisirPreset(p) {
    if (p.url) {
      setDestination(p.url);
      setActivePreset(p.url);
    } else {
      setDestination(`${BASE_URL}${p.path}`);
      setActivePreset(p.path);
    }
  }

  function onDestinationChange(v) {
    setDestination(v);
    setActivePreset(null);
  }

  function exporter(format) {
    if (qrRef.current) {
      qrRef.current.download({ name: "qr-mh-defense", extension: format });
    }
  }

  return (
    <>
      <div className={styles.head}>
        <div className={styles.title}>QR Code</div>
        <div className={styles.sub}>Générez un QR code personnalisé pour vos supports.</div>
      </div>

      <div className={styles.grid}>
        {/* Configuration */}
        <div className={styles.panel}>
          <div className={styles.panelTitle}>Configuration</div>
          <div className={styles.panelSub}>Personnalisez la destination et l'apparence.</div>

          {/* Destination */}
          <div className={styles.field}>
            <label>Destination</label>
            <input
              type="text"
              value={destination}
              onChange={(e) => onDestinationChange(e.target.value)}
              placeholder="https://…"
            />
            <div className={styles.presets}>
              {PRESETS.map((p) => {
                const val = p.url || p.path;
                return (
                  <button
                    key={p.label}
                    className={`${styles.preset} ${activePreset === val ? styles.on : ""}`}
                    onClick={() => choisirPreset(p)}
                  >
                    {p.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Couleur */}
          <div className={styles.field}>
            <label>Couleur</label>
            <div className={styles.swatches}>
              {COULEURS.map((c) => (
                <button
                  key={c.hex}
                  className={`${styles.swatch} ${fgColor.toLowerCase() === c.hex.toLowerCase() ? styles.on : ""}`}
                  style={{ background: c.hex }}
                  onClick={() => setFgColor(c.hex)}
                  title={c.name}
                />
              ))}
            </div>
            <div className={styles.colorInputRow}>
              <input type="color" value={fgColor} onChange={(e) => setFgColor(e.target.value)} />
              <input type="text" value={fgColor} onChange={(e) => setFgColor(e.target.value)} />
            </div>
          </div>

          {/* Style des modules */}
          <div className={styles.field}>
            <label>Style</label>
            <div className={styles.segRow}>
              {STYLES_MODULE.map((s) => (
                <button
                  key={s.key}
                  className={`${styles.seg} ${dotStyle === s.key ? styles.on : ""}`}
                  onClick={() => setDotStyle(s.key)}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Logo */}
          <div className={styles.field}>
            <label className={styles.checkRow}>
              <input type="checkbox" checked={withLogo} onChange={(e) => setWithLogo(e.target.checked)} />
              Ajouter le logo MH au centre
            </label>
          </div>
        </div>

        {/* Aperçu + export */}
        <div className={styles.previewPanel}>
          <div className={styles.previewBox} ref={previewRef} />
          <div className={styles.exportRow}>
            <button className={`${styles.exportBtn} ${styles.exportPng}`} onClick={() => exporter("png")}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" />
              </svg>
              PNG
            </button>
            <button className={`${styles.exportBtn} ${styles.exportSvg}`} onClick={() => exporter("svg")}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" />
              </svg>
              SVG
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
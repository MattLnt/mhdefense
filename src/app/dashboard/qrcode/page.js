"use client";

import { useState, useEffect, useRef } from "react";
import ColorPicker from "@/components/ColorPicker";
import styles from "./Qrcode.module.css";

// Palette MH
const COULEURS = [
  { hex: "#170A11", name: "Nuit" },
  { hex: "#D64C7F", name: "Rose" },
  { hex: "#6E2A3B", name: "Vin" },
  { hex: "#F0699A", name: "Rose clair" },
  { hex: "#000000", name: "Noir" },
];

// Palette fond (avec option transparent)
const COULEURS_FOND = [
  { hex: "transparent", name: "Transparent" },
  { hex: "#FFFFFF", name: "Blanc" },
  { hex: "#170A11", name: "Nuit" },
  { hex: "#D64C7F", name: "Rose" },
  { hex: "#F0699A", name: "Rose clair" },
  { hex: "#FBF9F8", name: "Crème" },
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

// Polices Google Fonts proposées pour le texte central
const POLICES = [
  { css: "'Inter', sans-serif", label: "Inter", gf: "Inter:wght@400;700;800" },
  { css: "'Playfair Display', serif", label: "Playfair", gf: "Playfair+Display:wght@400;700;900" },
  { css: "'Bebas Neue', sans-serif", label: "Bebas Neue", gf: "Bebas+Neue" },
  { css: "'Montserrat', sans-serif", label: "Montserrat", gf: "Montserrat:wght@400;700;800" },
  { css: "'Oswald', sans-serif", label: "Oswald", gf: "Oswald:wght@400;700" },
  { css: "'Pacifico', cursive", label: "Pacifico", gf: "Pacifico" },
  { css: "'Dancing Script', cursive", label: "Dancing Script", gf: "Dancing+Script:wght@400;700" },
  { css: "'Anton', sans-serif", label: "Anton", gf: "Anton" },
  { css: "'Poppins', sans-serif", label: "Poppins", gf: "Poppins:wght@400;700;800" },
  { css: "'Abril Fatface', serif", label: "Abril Fatface", gf: "Abril+Fatface" },
];

export default function QrcodePage() {
  const [destination, setDestination] = useState(`${BASE_URL}/reservation`);
  const [activePreset, setActivePreset] = useState("/reservation");
  const [fgColor, setFgColor] = useState("#170A11");
  const [dotStyle, setDotStyle] = useState("rounded");

  // Centre : "none" | "logo" | "text"
  const [centerMode, setCenterMode] = useState("none");

  // Logo image
  const [logoData, setLogoData] = useState(null);
  const [logoName, setLogoName] = useState("");
  const fileRef = useRef(null);

  // Texte central
  const [text, setText] = useState("MH");
  const [textFont, setTextFont] = useState(POLICES[0].css);
  const [textColor, setTextColor] = useState("#D64C7F");
  const [textBg, setTextBg] = useState("#FFFFFF");
  const [bgShape, setBgShape] = useState("round"); // "round" | "rect"
  const [textSize, setTextSize] = useState(40);
  const [textBold, setTextBold] = useState(true);

  const previewRef = useRef(null);
  const qrRef = useRef(null);

  // Charge toutes les polices Google une fois
  useEffect(() => {
    const href = `https://fonts.googleapis.com/css2?${POLICES.map((p) => `family=${p.gf}`).join("&")}&display=swap`;
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = href;
    document.head.appendChild(link);
  }, []);

  // Init QR
  useEffect(() => {
    let mounted = true;
    import("qr-code-styling").then((mod) => {
      if (!mounted) return;
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

  // Génère l'image du texte central (canvas → dataURL)
  function buildTextImage() {
    const size = 400;
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, size, size);

    const boxSize = 300;
    const bx = (size - boxSize) / 2;
    const by = (size - boxSize) / 2;

    if (textBg !== "transparent") {
      ctx.fillStyle = textBg;
      if (bgShape === "round") {
        ctx.beginPath();
        ctx.arc(size / 2, size / 2, boxSize / 2, 0, Math.PI * 2);
        ctx.closePath();
        ctx.fill();
      } else {
        const r = 48;
        ctx.beginPath();
        ctx.moveTo(bx + r, by);
        ctx.arcTo(bx + boxSize, by, bx + boxSize, by + boxSize, r);
        ctx.arcTo(bx + boxSize, by + boxSize, bx, by + boxSize, r);
        ctx.arcTo(bx, by + boxSize, bx, by, r);
        ctx.arcTo(bx, by, bx + boxSize, by, r);
        ctx.closePath();
        ctx.fill();
      }
    }

    const weight = textBold ? "800" : "400";
    ctx.font = `${weight} ${textSize * 2}px ${textFont}`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = textColor;
    ctx.fillText(text || "", size / 2, size / 2 + 2);

    return canvas.toDataURL("image/png");
  }

  function buildOptions() {
    const dotsType =
      dotStyle === "rounded" ? "rounded" : dotStyle === "dots" ? "dots" : "square";

    let image;
    if (centerMode === "logo" && logoData) image = logoData;
    else if (centerMode === "text" && text) image = buildTextImage();

    return {
      width: 300,
      height: 300,
      type: "canvas",
      data: destination || BASE_URL,
      margin: 8,
      dotsOptions: { color: fgColor, type: dotsType },
      cornersSquareOptions: {
        color: fgColor,
        type: dotStyle === "square" ? "square" : "extra-rounded",
      },
      cornersDotOptions: { color: fgColor, type: dotStyle === "dots" ? "dot" : undefined },
      backgroundOptions: { color: "#ffffff" },
      image,
      imageOptions: {
        crossOrigin: "anonymous",
        margin: 0,
        imageSize: centerMode === "text" ? 0.55 : 0.4,
        hideBackgroundDots: true,
      },
      qrOptions: { errorCorrectionLevel: "H" },
    };
  }

  // Met à jour à chaque changement
  useEffect(() => {
    if (!qrRef.current) return;
    const t = setTimeout(() => qrRef.current.update(buildOptions()), 60);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [destination, fgColor, dotStyle, centerMode, logoData, text, textFont, textColor, textBg, bgShape, textSize, textBold]);

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

  function onLogoUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogoName(file.name);
    const reader = new FileReader();
    reader.onload = () => setLogoData(reader.result);
    reader.readAsDataURL(file);
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

          {/* Couleur du QR */}
          <div className={styles.field}>
            <label>Couleur du QR</label>
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
            <ColorPicker value={fgColor} onChange={setFgColor} />
          </div>

          {/* Style des modules */}
          <div className={styles.field}>
            <label>Style des modules</label>
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

          <div className={styles.divider} />
          <div className={styles.sectionLabel}>Au centre</div>

          {/* Mode centre */}
          <div className={styles.field}>
            <div className={styles.segRow}>
              {[
                { k: "none", l: "Rien" },
                { k: "logo", l: "Logo" },
                { k: "text", l: "Texte" },
              ].map((m) => (
                <button
                  key={m.k}
                  className={`${styles.seg} ${centerMode === m.k ? styles.on : ""}`}
                  onClick={() => setCenterMode(m.k)}
                >
                  {m.l}
                </button>
              ))}
            </div>
          </div>

          {/* Logo upload */}
          {centerMode === "logo" && (
            <div className={styles.field}>
              <label>Image du logo</label>
              <div className={styles.upload}>
                <button className={styles.uploadBtn} onClick={() => fileRef.current?.click()}>
                  Choisir un fichier
                </button>
                <span className={styles.uploadName}>{logoName || "Aucun fichier"}</span>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  onChange={onLogoUpload}
                  style={{ display: "none" }}
                />
              </div>
            </div>
          )}

          {/* Texte options */}
          {centerMode === "text" && (
            <>
              <div className={styles.field}>
                <label>Texte</label>
                <input
                  type="text"
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="MH"
                  maxLength={12}
                />
              </div>

              <div className={styles.field}>
                <label>Police</label>
                <div className={styles.selectWrap}>
                  <select value={textFont} onChange={(e) => setTextFont(e.target.value)}>
                    {POLICES.map((p) => (
                      <option key={p.label} value={p.css} style={{ fontFamily: p.css }}>
                        {p.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className={styles.field}>
                <label>Couleur du texte</label>
                <div className={styles.swatches}>
                  {COULEURS.map((c) => (
                    <button
                      key={c.hex}
                      className={`${styles.swatch} ${textColor.toLowerCase() === c.hex.toLowerCase() ? styles.on : ""}`}
                      style={{ background: c.hex }}
                      onClick={() => setTextColor(c.hex)}
                      title={c.name}
                    />
                  ))}
                </div>
                <ColorPicker value={textColor} onChange={setTextColor} />
              </div>

              <div className={styles.field}>
                <label>Couleur de fond du centre</label>
                <div className={styles.swatches}>
                  {COULEURS_FOND.map((c) => (
                    <button
                      key={c.hex}
                      className={`${styles.swatch} ${textBg.toLowerCase() === c.hex.toLowerCase() ? styles.on : ""}`}
                      style={
                        c.hex === "transparent"
                          ? {
                              background:
                                "repeating-conic-gradient(#ccc 0% 25%, #fff 0% 50%) 50% / 12px 12px",
                            }
                          : { background: c.hex }
                      }
                      onClick={() => setTextBg(c.hex)}
                      title={c.name}
                    />
                  ))}
                </div>
                {textBg !== "transparent" && (
                  <ColorPicker value={textBg} onChange={setTextBg} />
                )}
              </div>

              {textBg !== "transparent" && (
                <div className={styles.field}>
                  <label>Forme du fond</label>
                  <div className={styles.segRow}>
                    <button
                      className={`${styles.seg} ${bgShape === "round" ? styles.on : ""}`}
                      onClick={() => setBgShape("round")}
                    >
                      Ronde
                    </button>
                    <button
                      className={`${styles.seg} ${bgShape === "rect" ? styles.on : ""}`}
                      onClick={() => setBgShape("rect")}
                    >
                      Carré arrondi
                    </button>
                  </div>
                </div>
              )}

              <div className={styles.field}>
                <label>Taille du texte</label>
                <div className={styles.sliderRow}>
                  <input
                    type="range"
                    min="20"
                    max="60"
                    value={textSize}
                    onChange={(e) => setTextSize(Number(e.target.value))}
                  />
                  <span className={styles.sliderVal}>{textSize}px</span>
                </div>
              </div>

              <div className={styles.field}>
                <label>Graisse</label>
                <div className={styles.segRow}>
                  <button
                    className={`${styles.seg} ${!textBold ? styles.on : ""}`}
                    onClick={() => setTextBold(false)}
                  >
                    Normal
                  </button>
                  <button
                    className={`${styles.seg} ${textBold ? styles.on : ""}`}
                    onClick={() => setTextBold(true)}
                  >
                    Gras
                  </button>
                </div>
              </div>
            </>
          )}
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
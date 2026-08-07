"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import styles from "./ColorPicker.module.css";

/* ---------- Conversions couleur ---------- */

function hexToRgb(hex) {
  const h = hex.replace("#", "");
  const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  const num = parseInt(full, 16);
  if (isNaN(num) || full.length !== 6) return null;
  return { r: (num >> 16) & 255, g: (num >> 8) & 255, b: num & 255 };
}

function rgbToHex(r, g, b) {
  const toHex = (n) => Math.round(n).toString(16).padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase();
}

function rgbToHsv(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const d = max - min;
  let h = 0;
  if (d !== 0) {
    if (max === r) h = ((g - b) / d) % 6;
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h *= 60;
    if (h < 0) h += 360;
  }
  const s = max === 0 ? 0 : d / max;
  const v = max;
  return { h, s, v };
}

function hsvToRgb(h, s, v) {
  const c = v * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = v - c;
  let r = 0, g = 0, b = 0;
  if (h < 60) [r, g, b] = [c, x, 0];
  else if (h < 120) [r, g, b] = [x, c, 0];
  else if (h < 180) [r, g, b] = [0, c, x];
  else if (h < 240) [r, g, b] = [0, x, c];
  else if (h < 300) [r, g, b] = [x, 0, c];
  else [r, g, b] = [c, 0, x];
  return { r: (r + m) * 255, g: (g + m) * 255, b: (b + m) * 255 };
}

/**
 * Color picker complet.
 * @param {string} value  couleur hex (ex "#D64C7F")
 * @param {(hex:string)=>void} onChange
 */
export default function ColorPicker({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const [hsv, setHsv] = useState({ h: 0, s: 1, v: 1 });
  const [hexText, setHexText] = useState(value || "#000000");

  const wrapRef = useRef(null);
  const sbRef = useRef(null);
  const hueRef = useRef(null);
  const draggingSB = useRef(false);
  const draggingHue = useRef(false);

  // Sync depuis la prop value → HSV + champ
  useEffect(() => {
    const rgb = hexToRgb(value || "");
    if (rgb) {
      setHsv(rgbToHsv(rgb.r, rgb.g, rgb.b));
      setHexText((value || "").toUpperCase());
    }
  }, [value]);

  // Fermeture au clic extérieur
  useEffect(() => {
    function onClickOutside(e) {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    }
    if (open) document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [open]);

  // Émet la couleur à partir d'un HSV
  const emit = useCallback(
    (newHsv) => {
      const { r, g, b } = hsvToRgb(newHsv.h, newHsv.s, newHsv.v);
      const hex = rgbToHex(r, g, b);
      setHexText(hex);
      onChange(hex);
    },
    [onChange]
  );

  // --- Zone saturation / valeur ---
  function updateSB(clientX, clientY) {
    const rect = sbRef.current.getBoundingClientRect();
    let x = (clientX - rect.left) / rect.width;
    let y = (clientY - rect.top) / rect.height;
    x = Math.max(0, Math.min(1, x));
    y = Math.max(0, Math.min(1, y));
    const newHsv = { ...hsv, s: x, v: 1 - y };
    setHsv(newHsv);
    emit(newHsv);
  }

  // --- Curseur teinte ---
  function updateHue(clientX) {
    const rect = hueRef.current.getBoundingClientRect();
    let x = (clientX - rect.left) / rect.width;
    x = Math.max(0, Math.min(1, x));
    const newHsv = { ...hsv, h: x * 360 };
    setHsv(newHsv);
    emit(newHsv);
  }

  // Gestion drag globale
  useEffect(() => {
    function onMove(e) {
      const cx = e.touches ? e.touches[0].clientX : e.clientX;
      const cy = e.touches ? e.touches[0].clientY : e.clientY;
      if (draggingSB.current) updateSB(cx, cy);
      if (draggingHue.current) updateHue(cx);
    }
    function onUp() {
      draggingSB.current = false;
      draggingHue.current = false;
    }
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    window.addEventListener("touchmove", onMove, { passive: false });
    window.addEventListener("touchend", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
      window.removeEventListener("touchmove", onMove);
      window.removeEventListener("touchend", onUp);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hsv]);

  function onHexChange(v) {
    let val = v.startsWith("#") ? v : "#" + v;
    setHexText(val.toUpperCase());
    const rgb = hexToRgb(val);
    if (rgb) {
      setHsv(rgbToHsv(rgb.r, rgb.g, rgb.b));
      onChange(rgbToHex(rgb.r, rgb.g, rgb.b));
    }
  }

  // Couleur pure de la teinte (pour le fond de la zone SB)
  const hueColor = (() => {
    const { r, g, b } = hsvToRgb(hsv.h, 1, 1);
    return rgbToHex(r, g, b);
  })();

  return (
    <div className={styles.wrap} ref={wrapRef}>
      <button
        type="button"
        className={styles.trigger}
        onClick={() => setOpen((o) => !o)}
        aria-label="Choisir une couleur"
      >
        <span className={styles.triggerColor} style={{ background: value }} />
      </button>
      <input
        className={styles.hexInput}
        value={hexText}
        onChange={(e) => onHexChange(e.target.value)}
        maxLength={7}
      />

      {open && (
        <div className={styles.pop}>
          {/* Zone saturation / valeur */}
          <div
            className={styles.sbArea}
            ref={sbRef}
            style={{ background: hueColor }}
            onMouseDown={(e) => {
              draggingSB.current = true;
              updateSB(e.clientX, e.clientY);
            }}
            onTouchStart={(e) => {
              draggingSB.current = true;
              updateSB(e.touches[0].clientX, e.touches[0].clientY);
            }}
          >
            <div className={styles.sbWhite} />
            <div className={styles.sbBlack} />
            <div
              className={styles.sbHandle}
              style={{
                left: `${hsv.s * 100}%`,
                top: `${(1 - hsv.v) * 100}%`,
                background: value,
              }}
            />
          </div>

          {/* Curseur de teinte */}
          <div className={styles.hueRow}>
            <div
              className={styles.hue}
              ref={hueRef}
              onMouseDown={(e) => {
                draggingHue.current = true;
                updateHue(e.clientX);
              }}
              onTouchStart={(e) => {
                draggingHue.current = true;
                updateHue(e.touches[0].clientX);
              }}
            >
              <div
                className={styles.hueHandle}
                style={{ left: `${(hsv.h / 360) * 100}%`, color: hueColor }}
              />
            </div>
          </div>

          {/* Hex */}
          <div className={styles.popHexRow}>
            <span>#</span>
            <input
              value={hexText.replace("#", "")}
              onChange={(e) => onHexChange(e.target.value)}
              maxLength={6}
            />
          </div>
        </div>
      )}
    </div>
  );
}
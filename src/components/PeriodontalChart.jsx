import React, { useState, useCallback, useEffect, useRef } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import Peer from 'peerjs';
import QRCode from 'qrcode';
import { QRCodeSVG } from 'qrcode.react';
import DiagnosticParodontal from './DiagnosticParodontal';
import FichePatient from './FichePatient';

const PDF_SHARE_URL = window.location.origin + window.location.pathname;

// Numérotation FDI internationale
const TEETH_UPPER = [18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28];
const TEETH_LOWER = [48, 47, 46, 45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36, 37, 38];

// Dents avec furcation (molaires)
const FURCATION_TEETH = [18, 17, 16, 26, 27, 28, 48, 47, 46, 36, 37, 38];

// Initialisation des données d'une dent
const createToothData = () => ({
  missing: false,
  implant: false,
  mobility: 0,
  furcation: { buccal: 0, lingual: 0, mesial: 0, distal: 0 },
  buccal: {
    probing: [0, 0, 0],
    recession: [0, 0, 0],
    bleeding: [false, false, false],
    plaque: [false, false, false],
    suppuration: [false, false, false]
  },
  lingual: {
    probing: [0, 0, 0],
    recession: [0, 0, 0],
    bleeding: [false, false, false],
    plaque: [false, false, false],
    suppuration: [false, false, false]
  },
  note: ''
});

// Initialisation de toutes les dents
const initializeTeethData = () => {
  const data = {};
  [...TEETH_UPPER, ...TEETH_LOWER].forEach(tooth => {
    data[tooth] = createToothData();
  });
  return data;
};

// Composant pour dessiner une dent SVG anatomiquement réaliste
const ToothSVG = ({ toothNumber, isUpper, data, isSelected, onClick }) => {
  const isMolar = [18, 17, 16, 26, 27, 28, 48, 47, 46, 36, 37, 38].includes(toothNumber);
  const isPremolar = [15, 14, 24, 25, 45, 44, 34, 35].includes(toothNumber);
  const isCanine = [13, 23, 43, 33].includes(toothNumber);
  const isLateralIncisor = [12, 22, 42, 32].includes(toothNumber);
  const isCentralIncisor = [11, 21, 41, 31].includes(toothNumber);

  // Implant SVG
  if (data.implant) {
    return (
      <svg
        width="44"
        height="70"
        viewBox="0 0 44 70"
        onClick={onClick}
        style={{
          cursor: 'pointer',
          filter: isSelected ? 'drop-shadow(0 0 6px #0ea5e9)' : 'drop-shadow(0 2px 3px rgba(0,0,0,0.15))'
        }}
      >
        <defs>
          <linearGradient id={`implantGrad-${toothNumber}`} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#94a3b8" />
            <stop offset="50%" stopColor="#cbd5e1" />
            <stop offset="100%" stopColor="#94a3b8" />
          </linearGradient>
        </defs>
        {isUpper ? (
          <g>
            {/* Couronne prothétique */}
            <path
              d="M12 8 Q12 3 22 3 Q32 3 32 8 L32 18 Q32 22 22 24 Q12 22 12 18 Z"
              fill="url(#implantGrad-${toothNumber})"
              stroke="#64748b"
              strokeWidth="1"
            />
            {/* Pilier */}
            <rect x="18" y="24" width="8" height="8" fill="#78716c" stroke="#57534e" strokeWidth="0.5" />
            {/* Vis d'implant */}
            <path
              d="M16 32 L28 32 L26 38 L18 38 Z M18 38 L26 38 L25 44 L19 44 Z M19 44 L25 44 L24 50 L20 50 Z M20 50 L24 50 L23 56 L21 56 Z M21 56 L23 56 L22 62 L22 62 Z"
              fill="#a8a29e"
              stroke="#78716c"
              strokeWidth="0.5"
            />
            {/* Filetage */}
            {[34, 40, 46, 52].map(y => (
              <line key={y} x1="17" y1={y} x2="27" y2={y} stroke="#78716c" strokeWidth="0.5" />
            ))}
          </g>
        ) : (
          <g>
            {/* Vis d'implant */}
            <path
              d="M16 38 L28 38 L26 32 L18 32 Z M18 32 L26 32 L25 26 L19 26 Z M19 26 L25 26 L24 20 L20 20 Z M20 20 L24 20 L23 14 L21 14 Z M21 14 L23 14 L22 8 L22 8 Z"
              fill="#a8a29e"
              stroke="#78716c"
              strokeWidth="0.5"
            />
            {/* Filetage */}
            {[36, 30, 24, 18].map(y => (
              <line key={y} x1="17" y1={y} x2="27" y2={y} stroke="#78716c" strokeWidth="0.5" />
            ))}
            {/* Pilier */}
            <rect x="18" y="38" width="8" height="8" fill="#78716c" stroke="#57534e" strokeWidth="0.5" />
            {/* Couronne prothétique */}
            <path
              d="M12 62 Q12 67 22 67 Q32 67 32 62 L32 52 Q32 48 22 46 Q12 48 12 52 Z"
              fill={`url(#implantGrad-${toothNumber})`}
              stroke="#64748b"
              strokeWidth="1"
            />
          </g>
        )}
      </svg>
    );
  }

  // Molaires (3 racines maxillaires, 2 racines mandibulaires)
  if (isMolar) {
    return (
      <svg
        width="52"
        height="80"
        viewBox="0 0 52 80"
        onClick={onClick}
        style={{
          cursor: 'pointer',
          opacity: data.missing ? 0.3 : 1,
          filter: isSelected ? 'drop-shadow(0 0 6px #0ea5e9)' : 'drop-shadow(0 2px 3px rgba(0,0,0,0.1))'
        }}
      >
        <defs>
          <linearGradient id={`toothGrad-${toothNumber}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="20%" stopColor="#fafafa" />
            <stop offset="80%" stopColor="#f0f0f0" />
            <stop offset="100%" stopColor="#e8e8e8" />
          </linearGradient>
          <linearGradient id={`rootGrad-${toothNumber}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fef7ed" />
            <stop offset="50%" stopColor="#fde4c8" />
            <stop offset="100%" stopColor="#f5d5a8" />
          </linearGradient>
          <linearGradient id={`crownShade-${toothNumber}`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="rgba(255,255,255,0.6)" />
            <stop offset="100%" stopColor="rgba(0,0,0,0.05)" />
          </linearGradient>
        </defs>
        {isUpper ? (
          <g>
            {/* Racines (3 pour molaires maxillaires) - anatomiquement réalistes */}
            {/* Racine palatine (centrale, plus grosse) */}
            <path
              d="M23 32 C21 38, 20 48, 21 58 C21.5 65, 23 70, 26 72 C29 70, 30.5 65, 31 58 C32 48, 31 38, 29 32"
              fill={`url(#rootGrad-${toothNumber})`}
              stroke="#c9a06c"
              strokeWidth="0.7"
            />
            {/* Racine mésio-vestibulaire (gauche, courbée) */}
            <path
              d="M10 34 C8 40, 6 50, 7 60 C7.5 67, 10 73, 13 75 C15 72, 16 66, 16 58 C16 48, 14 40, 13 34"
              fill={`url(#rootGrad-${toothNumber})`}
              stroke="#c9a06c"
              strokeWidth="0.7"
            />
            {/* Racine disto-vestibulaire (droite, plus courte) */}
            <path
              d="M39 34 C41 40, 43 48, 42 56 C41.5 63, 39 68, 36 70 C34 67, 33 62, 34 55 C35 47, 37 40, 38 34"
              fill={`url(#rootGrad-${toothNumber})`}
              stroke="#c9a06c"
              strokeWidth="0.7"
            />
            {/* Couronne anatomique avec cuspides */}
            <path
              d="M5 6 C5 3, 10 2, 26 2 C42 2, 47 3, 47 6
                 L47 10 C47 12, 45 14, 43 16 L41 18 C40 20, 40 22, 41 24
                 L42 26 C43 28, 43 30, 42 32 L40 34
                 C38 36, 32 37, 26 37 C20 37, 14 36, 12 34
                 L10 32 C9 30, 9 28, 10 26 L11 24 C12 22, 12 20, 11 18
                 L9 16 C7 14, 5 12, 5 10 Z"
              fill={`url(#toothGrad-${toothNumber})`}
              stroke={isSelected ? '#0ea5e9' : '#a0a0a0'}
              strokeWidth={isSelected ? 2 : 1}
            />
            {/* Surface occlusale avec détails anatomiques */}
            <path
              d="M12 8 C12 6, 18 5, 26 5 C34 5, 40 6, 40 8
                 L40 18 C40 22, 36 24, 26 24 C16 24, 12 22, 12 18 Z"
              fill={`url(#crownShade-${toothNumber})`}
              stroke="none"
            />
            {/* Sillons occlusaux principaux */}
            <path d="M15 10 Q20 15 26 12 Q32 9 37 14" fill="none" stroke="#d4d4d4" strokeWidth="1.2" />
            <path d="M20 8 C20 12, 20 16, 22 18" fill="none" stroke="#d4d4d4" strokeWidth="0.8" />
            <path d="M32 8 C32 12, 32 16, 30 18" fill="none" stroke="#d4d4d4" strokeWidth="0.8" />
            {/* Fosse centrale */}
            <ellipse cx="26" cy="13" rx="5" ry="3.5" fill="none" stroke="#d4d4d4" strokeWidth="0.8" />
            <ellipse cx="26" cy="13" rx="2" ry="1.5" fill="#e8e8e8" stroke="none" />
          </g>
        ) : (
          <g>
            {/* Racines (2 pour molaires mandibulaires) */}
            {/* Racine mésiale (gauche, courbée) */}
            <path
              d="M12 48 C10 54, 8 62, 9 70 C9.5 75, 12 78, 15 79 C17 76, 18 72, 18 66 C18 58, 16 52, 15 48"
              fill={`url(#rootGrad-${toothNumber})`}
              stroke="#c9a06c"
              strokeWidth="0.7"
            />
            {/* Racine distale (droite) */}
            <path
              d="M37 48 C39 54, 41 62, 40 70 C39.5 75, 37 78, 34 79 C32 76, 31 72, 32 66 C33 58, 35 52, 36 48"
              fill={`url(#rootGrad-${toothNumber})`}
              stroke="#c9a06c"
              strokeWidth="0.7"
            />
            {/* Couronne anatomique inversée */}
            <path
              d="M5 74 C5 77, 10 78, 26 78 C42 78, 47 77, 47 74
                 L47 70 C47 68, 45 66, 43 64 L41 62 C40 60, 40 58, 41 56
                 L42 54 C43 52, 43 50, 42 48 L40 46
                 C38 44, 32 43, 26 43 C20 43, 14 44, 12 46
                 L10 48 C9 50, 9 52, 10 54 L11 56 C12 58, 12 60, 11 62
                 L9 64 C7 66, 5 68, 5 70 Z"
              fill={`url(#toothGrad-${toothNumber})`}
              stroke={isSelected ? '#0ea5e9' : '#a0a0a0'}
              strokeWidth={isSelected ? 2 : 1}
            />
            {/* Surface occlusale */}
            <path
              d="M12 72 C12 74, 18 75, 26 75 C34 75, 40 74, 40 72
                 L40 62 C40 58, 36 56, 26 56 C16 56, 12 58, 12 62 Z"
              fill={`url(#crownShade-${toothNumber})`}
              stroke="none"
            />
            {/* Sillons occlusaux */}
            <path d="M15 70 Q20 65 26 68 Q32 71 37 66" fill="none" stroke="#d4d4d4" strokeWidth="1.2" />
            <path d="M20 72 C20 68, 20 64, 22 62" fill="none" stroke="#d4d4d4" strokeWidth="0.8" />
            <path d="M32 72 C32 68, 32 64, 30 62" fill="none" stroke="#d4d4d4" strokeWidth="0.8" />
            {/* Fosse centrale */}
            <ellipse cx="26" cy="67" rx="5" ry="3.5" fill="none" stroke="#d4d4d4" strokeWidth="0.8" />
            <ellipse cx="26" cy="67" rx="2" ry="1.5" fill="#e8e8e8" stroke="none" />
          </g>
        )}
        {data.missing && (
          <line
            x1="3" y1={isUpper ? "2" : "78"}
            x2="49" y2={isUpper ? "75" : "5"}
            stroke="#ef4444"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
        )}
      </svg>
    );
  }

  // Prémolaires (1-2 racines)
  if (isPremolar) {
    const isFirstPremolar = [14, 24, 44, 34].includes(toothNumber);
    return (
      <svg
        width="42"
        height="72"
        viewBox="0 0 42 72"
        onClick={onClick}
        style={{
          cursor: 'pointer',
          opacity: data.missing ? 0.3 : 1,
          filter: isSelected ? 'drop-shadow(0 0 6px #0ea5e9)' : 'drop-shadow(0 2px 3px rgba(0,0,0,0.1))'
        }}
      >
        <defs>
          <linearGradient id={`toothGrad-${toothNumber}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="20%" stopColor="#fafafa" />
            <stop offset="80%" stopColor="#f0f0f0" />
            <stop offset="100%" stopColor="#e8e8e8" />
          </linearGradient>
          <linearGradient id={`rootGrad-${toothNumber}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fef7ed" />
            <stop offset="50%" stopColor="#fde4c8" />
            <stop offset="100%" stopColor="#f5d5a8" />
          </linearGradient>
        </defs>
        {isUpper ? (
          <g>
            {/* Racines bifides pour premières prémolaires supérieures */}
            {isFirstPremolar ? (
              <>
                <path
                  d="M14 30 C12 38, 10 48, 11 58 C11.5 64, 14 68, 17 70 C19 66, 19 60, 18.5 52 C18 44, 16 36, 16 30"
                  fill={`url(#rootGrad-${toothNumber})`}
                  stroke="#c9a06c"
                  strokeWidth="0.7"
                />
                <path
                  d="M26 30 C28 38, 30 48, 29 58 C28.5 64, 26 68, 23 70 C21 66, 21 60, 21.5 52 C22 44, 24 36, 24 30"
                  fill={`url(#rootGrad-${toothNumber})`}
                  stroke="#c9a06c"
                  strokeWidth="0.7"
                />
              </>
            ) : (
              <path
                d="M18 30 C16 40, 14 52, 16 62 C17 67, 20 70, 21 70 C22 70, 25 67, 26 62 C28 52, 26 40, 24 30"
                fill={`url(#rootGrad-${toothNumber})`}
                stroke="#c9a06c"
                strokeWidth="0.7"
              />
            )}
            {/* Couronne avec deux cuspides */}
            <path
              d="M7 8 C7 4, 12 2, 21 2 C30 2, 35 4, 35 8
                 L35 12 C35 15, 33 18, 30 20 L28 22 C27 24, 27 26, 28 28
                 L29 30 C30 32, 29 34, 27 35
                 C24 36, 18 36, 15 35 C13 34, 12 32, 13 30
                 L14 28 C15 26, 15 24, 14 22 L12 20 C9 18, 7 15, 7 12 Z"
              fill={`url(#toothGrad-${toothNumber})`}
              stroke={isSelected ? '#0ea5e9' : '#a0a0a0'}
              strokeWidth={isSelected ? 2 : 1}
            />
            {/* Cuspides bicuspides */}
            <path d="M12 10 C14 8, 17 7, 21 9 C25 7, 28 8, 30 10" fill="none" stroke="#d4d4d4" strokeWidth="1" />
            <ellipse cx="14" cy="12" rx="3" ry="4" fill="none" stroke="#d4d4d4" strokeWidth="0.6" />
            <ellipse cx="28" cy="12" rx="3" ry="4" fill="none" stroke="#d4d4d4" strokeWidth="0.6" />
            {/* Sillon central */}
            <path d="M21 6 L21 18" fill="none" stroke="#d4d4d4" strokeWidth="0.8" />
          </g>
        ) : (
          <g>
            {/* Racine unique pour prémolaires inférieures */}
            <path
              d="M18 42 C16 50, 14 58, 16 66 C17 70, 20 72, 21 72 C22 72, 25 70, 26 66 C28 58, 26 50, 24 42"
              fill={`url(#rootGrad-${toothNumber})`}
              stroke="#c9a06c"
              strokeWidth="0.7"
            />
            {/* Couronne inversée */}
            <path
              d="M7 64 C7 68, 12 70, 21 70 C30 70, 35 68, 35 64
                 L35 60 C35 57, 33 54, 30 52 L28 50 C27 48, 27 46, 28 44
                 L29 42 C30 40, 29 38, 27 37
                 C24 36, 18 36, 15 37 C13 38, 12 40, 13 42
                 L14 44 C15 46, 15 48, 14 50 L12 52 C9 54, 7 57, 7 60 Z"
              fill={`url(#toothGrad-${toothNumber})`}
              stroke={isSelected ? '#0ea5e9' : '#a0a0a0'}
              strokeWidth={isSelected ? 2 : 1}
            />
            {/* Cuspides */}
            <path d="M12 62 C14 64, 17 65, 21 63 C25 65, 28 64, 30 62" fill="none" stroke="#d4d4d4" strokeWidth="1" />
            <ellipse cx="14" cy="60" rx="3" ry="4" fill="none" stroke="#d4d4d4" strokeWidth="0.6" />
            <ellipse cx="28" cy="60" rx="3" ry="4" fill="none" stroke="#d4d4d4" strokeWidth="0.6" />
            {/* Sillon central */}
            <path d="M21 66 L21 54" fill="none" stroke="#d4d4d4" strokeWidth="0.8" />
          </g>
        )}
        {data.missing && (
          <line
            x1="5" y1={isUpper ? "2" : "70"}
            x2="37" y2={isUpper ? "70" : "2"}
            stroke="#ef4444"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
        )}
      </svg>
    );
  }

  // Canines (racine longue et pointue)
  if (isCanine) {
    return (
      <svg
        width="38"
        height="80"
        viewBox="0 0 38 80"
        onClick={onClick}
        style={{
          cursor: 'pointer',
          opacity: data.missing ? 0.3 : 1,
          filter: isSelected ? 'drop-shadow(0 0 6px #0ea5e9)' : 'drop-shadow(0 2px 3px rgba(0,0,0,0.1))'
        }}
      >
        <defs>
          <linearGradient id={`toothGrad-${toothNumber}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="20%" stopColor="#fafafa" />
            <stop offset="80%" stopColor="#f0f0f0" />
            <stop offset="100%" stopColor="#e8e8e8" />
          </linearGradient>
          <linearGradient id={`rootGrad-${toothNumber}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fef7ed" />
            <stop offset="50%" stopColor="#fde4c8" />
            <stop offset="100%" stopColor="#f5d5a8" />
          </linearGradient>
        </defs>
        {isUpper ? (
          <g>
            {/* Racine longue et robuste */}
            <path
              d="M15 32 C13 42, 11 54, 12 66 C12.5 72, 16 77, 19 78 C22 77, 25.5 72, 26 66 C27 54, 25 42, 23 32"
              fill={`url(#rootGrad-${toothNumber})`}
              stroke="#c9a06c"
              strokeWidth="0.7"
            />
            {/* Couronne pointue avec cuspide proéminente */}
            <path
              d="M8 14 C8 8, 12 3, 19 3 C26 3, 30 8, 30 14
                 L30 22 C30 26, 28 29, 25 31 L22 33
                 C20 34, 18 34, 16 33 L13 31 C10 29, 8 26, 8 22 Z"
              fill={`url(#toothGrad-${toothNumber})`}
              stroke={isSelected ? '#0ea5e9' : '#a0a0a0'}
              strokeWidth={isSelected ? 2 : 1}
            />
            {/* Cuspide pointue caractéristique */}
            <path d="M12 18 L19 6 L26 18" fill="none" stroke="#d4d4d4" strokeWidth="1.2" />
            {/* Crêtes marginales */}
            <path d="M11 20 C14 22, 17 20, 19 16" fill="none" stroke="#e0e0e0" strokeWidth="0.6" />
            <path d="M27 20 C24 22, 21 20, 19 16" fill="none" stroke="#e0e0e0" strokeWidth="0.6" />
          </g>
        ) : (
          <g>
            {/* Racine longue inférieure */}
            <path
              d="M15 48 C13 56, 11 66, 12 74 C12.5 77, 16 79, 19 79 C22 79, 25.5 77, 26 74 C27 66, 25 56, 23 48"
              fill={`url(#rootGrad-${toothNumber})`}
              stroke="#c9a06c"
              strokeWidth="0.7"
            />
            {/* Couronne inversée */}
            <path
              d="M8 66 C8 72, 12 77, 19 77 C26 77, 30 72, 30 66
                 L30 58 C30 54, 28 51, 25 49 L22 47
                 C20 46, 18 46, 16 47 L13 49 C10 51, 8 54, 8 58 Z"
              fill={`url(#toothGrad-${toothNumber})`}
              stroke={isSelected ? '#0ea5e9' : '#a0a0a0'}
              strokeWidth={isSelected ? 2 : 1}
            />
            {/* Cuspide */}
            <path d="M12 62 L19 74 L26 62" fill="none" stroke="#d4d4d4" strokeWidth="1.2" />
            {/* Crêtes marginales */}
            <path d="M11 60 C14 58, 17 60, 19 64" fill="none" stroke="#e0e0e0" strokeWidth="0.6" />
            <path d="M27 60 C24 58, 21 60, 19 64" fill="none" stroke="#e0e0e0" strokeWidth="0.6" />
          </g>
        )}
        {data.missing && (
          <line
            x1="5" y1={isUpper ? "3" : "77"}
            x2="33" y2={isUpper ? "78" : "2"}
            stroke="#ef4444"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
        )}
      </svg>
    );
  }

  // Incisives centrales (plus larges)
  if (isCentralIncisor) {
    return (
      <svg
        width="40"
        height="68"
        viewBox="0 0 40 68"
        onClick={onClick}
        style={{
          cursor: 'pointer',
          opacity: data.missing ? 0.3 : 1,
          filter: isSelected ? 'drop-shadow(0 0 6px #0ea5e9)' : 'drop-shadow(0 2px 3px rgba(0,0,0,0.1))'
        }}
      >
        <defs>
          <linearGradient id={`toothGrad-${toothNumber}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="20%" stopColor="#fafafa" />
            <stop offset="80%" stopColor="#f0f0f0" />
            <stop offset="100%" stopColor="#e8e8e8" />
          </linearGradient>
          <linearGradient id={`rootGrad-${toothNumber}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fef7ed" />
            <stop offset="50%" stopColor="#fde4c8" />
            <stop offset="100%" stopColor="#f5d5a8" />
          </linearGradient>
        </defs>
        {isUpper ? (
          <g>
            {/* Racine conique */}
            <path
              d="M16 28 C14 38, 12 48, 14 58 C15 63, 18 66, 20 66 C22 66, 25 63, 26 58 C28 48, 26 38, 24 28"
              fill={`url(#rootGrad-${toothNumber})`}
              stroke="#c9a06c"
              strokeWidth="0.7"
            />
            {/* Couronne en pelle - forme caractéristique incisive centrale */}
            <path
              d="M6 8 C6 4, 11 2, 20 2 C29 2, 34 4, 34 8
                 L34 18 C34 24, 31 28, 26 29 L14 29 C9 28, 6 24, 6 18 Z"
              fill={`url(#toothGrad-${toothNumber})`}
              stroke={isSelected ? '#0ea5e9' : '#a0a0a0'}
              strokeWidth={isSelected ? 2 : 1}
            />
            {/* Bord incisif avec mamelons */}
            <line x1="10" y1="5" x2="30" y2="5" stroke="#e8e8e8" strokeWidth="2.5" strokeLinecap="round" />
            {/* Mamelons (sur dents jeunes) */}
            <circle cx="14" cy="9" r="2" fill="#f5f5f5" stroke="#e8e8e8" strokeWidth="0.5" />
            <circle cx="20" cy="9" r="2" fill="#f5f5f5" stroke="#e8e8e8" strokeWidth="0.5" />
            <circle cx="26" cy="9" r="2" fill="#f5f5f5" stroke="#e8e8e8" strokeWidth="0.5" />
            {/* Ligne de développement */}
            <path d="M13 12 L13 22" fill="none" stroke="#e8e8e8" strokeWidth="0.5" />
            <path d="M27 12 L27 22" fill="none" stroke="#e8e8e8" strokeWidth="0.5" />
          </g>
        ) : (
          <g>
            {/* Racine plus fine */}
            <path
              d="M17 40 C15 48, 14 56, 16 62 C17 65, 19 66, 20 66 C21 66, 23 65, 24 62 C26 56, 25 48, 23 40"
              fill={`url(#rootGrad-${toothNumber})`}
              stroke="#c9a06c"
              strokeWidth="0.7"
            />
            {/* Couronne inversée - incisive mandibulaire plus étroite */}
            <path
              d="M8 60 C8 64, 12 66, 20 66 C28 66, 32 64, 32 60
                 L32 50 C32 44, 29 40, 24 39 L16 39 C11 40, 8 44, 8 50 Z"
              fill={`url(#toothGrad-${toothNumber})`}
              stroke={isSelected ? '#0ea5e9' : '#a0a0a0'}
              strokeWidth={isSelected ? 2 : 1}
            />
            {/* Bord incisif */}
            <line x1="11" y1="63" x2="29" y2="63" stroke="#e8e8e8" strokeWidth="2" strokeLinecap="round" />
          </g>
        )}
        {data.missing && (
          <line
            x1="4" y1={isUpper ? "2" : "66"}
            x2="36" y2={isUpper ? "66" : "2"}
            stroke="#ef4444"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
        )}
      </svg>
    );
  }

  // Incisives latérales (plus petites et arrondies)
  return (
    <svg
      width="34"
      height="65"
      viewBox="0 0 34 65"
      onClick={onClick}
      style={{
        cursor: 'pointer',
        opacity: data.missing ? 0.3 : 1,
        filter: isSelected ? 'drop-shadow(0 0 6px #0ea5e9)' : 'drop-shadow(0 2px 3px rgba(0,0,0,0.1))'
      }}
    >
      <defs>
        <linearGradient id={`toothGrad-${toothNumber}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="20%" stopColor="#fafafa" />
          <stop offset="80%" stopColor="#f0f0f0" />
          <stop offset="100%" stopColor="#e8e8e8" />
        </linearGradient>
        <linearGradient id={`rootGrad-${toothNumber}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#fef7ed" />
          <stop offset="50%" stopColor="#fde4c8" />
          <stop offset="100%" stopColor="#f5d5a8" />
        </linearGradient>
      </defs>
      {isUpper ? (
        <g>
          {/* Racine courbée distalement */}
          <path
            d="M14 26 C12 34, 10 44, 12 54 C13 59, 16 63, 17 63 C18 63, 21 59, 22 54 C24 44, 22 34, 20 26"
            fill={`url(#rootGrad-${toothNumber})`}
            stroke="#c9a06c"
            strokeWidth="0.7"
          />
          {/* Couronne plus petite et arrondie */}
          <path
            d="M6 8 C6 4, 10 2, 17 2 C24 2, 28 4, 28 8
               L28 16 C28 22, 25 26, 21 27 L13 27 C9 26, 6 22, 6 16 Z"
            fill={`url(#toothGrad-${toothNumber})`}
            stroke={isSelected ? '#0ea5e9' : '#a0a0a0'}
            strokeWidth={isSelected ? 2 : 1}
          />
          {/* Bord incisif */}
          <line x1="9" y1="5" x2="25" y2="5" stroke="#e8e8e8" strokeWidth="2" strokeLinecap="round" />
          {/* Cingulum (proéminence palatine) */}
          <ellipse cx="17" cy="20" rx="4" ry="3" fill="none" stroke="#e8e8e8" strokeWidth="0.5" />
        </g>
      ) : (
        <g>
          {/* Racine */}
          <path
            d="M14 38 C12 46, 11 52, 13 58 C14 61, 16 63, 17 63 C18 63, 20 61, 21 58 C23 52, 22 46, 20 38"
            fill={`url(#rootGrad-${toothNumber})`}
            stroke="#c9a06c"
            strokeWidth="0.7"
          />
          {/* Couronne */}
          <path
            d="M6 57 C6 61, 10 63, 17 63 C24 63, 28 61, 28 57
               L28 49 C28 43, 25 39, 21 38 L13 38 C9 39, 6 43, 6 49 Z"
            fill={`url(#toothGrad-${toothNumber})`}
            stroke={isSelected ? '#0ea5e9' : '#a0a0a0'}
            strokeWidth={isSelected ? 2 : 1}
          />
          {/* Bord incisif */}
          <line x1="9" y1="60" x2="25" y2="60" stroke="#e8e8e8" strokeWidth="1.5" strokeLinecap="round" />
        </g>
      )}
      {data.missing && (
        <line
          x1="4" y1={isUpper ? "2" : "63"}
          x2="30" y2={isUpper ? "63" : "2"}
          stroke="#ef4444"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
      )}
    </svg>
  );
};

// Composant pour les entrées de sondage
const ProbingInput = ({ values, onChange, label, isRecession = false, autoFocus = false, inputRefs, onEnterPress }) => {
  return (
    <div className="flex items-center gap-1">
      <span className="text-xs text-slate-500 w-10">{label}</span>
      {values.map((val, idx) => (
        <input
          key={idx}
          ref={inputRefs ? (el) => inputRefs[idx] = el : null}
          autoFocus={autoFocus && idx === 0}
          type="number"
          min={isRecession ? -10 : 0}
          max={15}
          value={val}
          onChange={(e) => {
            const newValues = [...values];
            newValues[idx] = parseInt(e.target.value) || 0;
            onChange(newValues);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              if (onEnterPress) {
                onEnterPress(idx);
              }
            }
          }}
          className={`w-10 h-8 text-center text-sm border rounded-md focus:ring-2 focus:ring-sky-500 focus:border-transparent
            ${!isRecession && val >= 5 ? 'bg-red-100 border-red-400 text-red-700' :
              !isRecession && val >= 4 ? 'bg-amber-100 border-amber-400 text-amber-700' :
              'bg-white border-slate-300'}`}
        />
      ))}
    </div>
  );
};

// Composant pour les indicateurs booléens (saignement, plaque, suppuration)
const BooleanIndicators = ({ values, onChange, color, label }) => {
  const colors = {
    bleeding: { active: 'bg-red-500', inactive: 'bg-red-100 border-red-300' },
    plaque: { active: 'bg-amber-500', inactive: 'bg-amber-100 border-amber-300' },
    suppuration: { active: 'bg-purple-500', inactive: 'bg-purple-100 border-purple-300' }
  };
  
  return (
    <div className="flex items-center gap-1">
      <span className="text-xs text-slate-500 w-10">{label}</span>
      {values.map((val, idx) => (
        <button
          key={idx}
          onClick={() => {
            const newValues = [...values];
            newValues[idx] = !newValues[idx];
            onChange(newValues);
          }}
          className={`w-10 h-6 rounded-full border-2 transition-all ${
            val ? colors[color].active + ' border-transparent' : colors[color].inactive
          }`}
        />
      ))}
    </div>
  );
};

// Composant pour les entrées détaillées d'une dent avec navigation clavier
const ToothDetailInputs = ({ selectedTooth, teethData, updateToothData, isUpperTooth }) => {
  const inputRefs = useRef({});

  // Auto-focus on first input (buccal SOND distal) when tooth changes
  useEffect(() => {
    if (selectedTooth) {
      setTimeout(() => {
        const firstRef = inputRefs.current['buccal-probing-0'];
        if (firstRef) {
          firstRef.focus();
          firstRef.select();
        }
      }, 50);
    }
  }, [selectedTooth]);

  // Navigation order: buccal probing (0,1,2) -> buccal recession (0,1,2) -> lingual probing (0,1,2) -> lingual recession (0,1,2)
  const handleEnterPress = (surface, type, idx) => {
    const navOrder = [
      'buccal-probing-0', 'buccal-probing-1', 'buccal-probing-2',
      'buccal-recession-0', 'buccal-recession-1', 'buccal-recession-2',
      'lingual-probing-0', 'lingual-probing-1', 'lingual-probing-2',
      'lingual-recession-0', 'lingual-recession-1', 'lingual-recession-2'
    ];
    const currentKey = `${surface}-${type}-${idx}`;
    const currentIndex = navOrder.indexOf(currentKey);
    if (currentIndex < navOrder.length - 1) {
      const nextKey = navOrder[currentIndex + 1];
      const nextRef = inputRefs.current[nextKey];
      if (nextRef) {
        nextRef.focus();
        nextRef.select();
      }
    }
  };

  return (
    <div className="space-y-3">
      {['buccal', 'lingual'].map(surface => (
        <div key={surface} className="p-3 bg-slate-50 rounded-xl">
          <h4 className="text-xs font-semibold text-slate-700 mb-2">
            {surface === 'buccal' ? 'Vestibulaire' : isUpperTooth ? 'Palatin' : 'Lingual'}
          </h4>
          <div className="space-y-1.5">
            {/* SOND */}
            <div className="flex items-center gap-1">
              <span className="text-xs text-slate-500 w-10">SOND</span>
              {teethData[selectedTooth][surface].probing.map((val, idx) => (
                <input
                  key={idx}
                  ref={(el) => inputRefs.current[`${surface}-probing-${idx}`] = el}
                  type="number"
                  min="0"
                  max="15"
                  value={val}
                  onChange={(e) => {
                    const newValues = [...teethData[selectedTooth][surface].probing];
                    newValues[idx] = parseInt(e.target.value) || 0;
                    updateToothData(selectedTooth, surface, 'probing', newValues);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleEnterPress(surface, 'probing', idx);
                    }
                  }}
                  className={`w-10 h-8 text-center text-sm border rounded-md focus:ring-2 focus:ring-sky-500 focus:border-transparent
                    ${val >= 5 ? 'bg-red-100 border-red-400 text-red-700' :
                      val >= 4 ? 'bg-amber-100 border-amber-400 text-amber-700' :
                      'bg-white border-slate-300'}`}
                />
              ))}
            </div>
            {/* REC */}
            <div className="flex items-center gap-1">
              <span className="text-xs text-slate-500 w-10">REC</span>
              {teethData[selectedTooth][surface].recession.map((val, idx) => (
                <input
                  key={idx}
                  ref={(el) => inputRefs.current[`${surface}-recession-${idx}`] = el}
                  type="number"
                  min="-10"
                  max="15"
                  value={val}
                  onChange={(e) => {
                    const newValues = [...teethData[selectedTooth][surface].recession];
                    newValues[idx] = parseInt(e.target.value) || 0;
                    updateToothData(selectedTooth, surface, 'recession', newValues);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleEnterPress(surface, 'recession', idx);
                    }
                  }}
                  className="w-10 h-8 text-center text-sm border rounded-md focus:ring-2 focus:ring-sky-500 focus:border-transparent bg-white border-slate-300"
                />
              ))}
            </div>
            {/* Boolean indicators */}
            <BooleanIndicators
              values={teethData[selectedTooth][surface].bleeding}
              onChange={(vals) => updateToothData(selectedTooth, surface, 'bleeding', vals)}
              color="bleeding"
              label="Saign."
            />
            <BooleanIndicators
              values={teethData[selectedTooth][surface].plaque}
              onChange={(vals) => updateToothData(selectedTooth, surface, 'plaque', vals)}
              color="plaque"
              label="PLQ"
            />
            <BooleanIndicators
              values={teethData[selectedTooth][surface].suppuration}
              onChange={(vals) => updateToothData(selectedTooth, surface, 'suppuration', vals)}
              color="suppuration"
              label="SUP"
            />
          </div>
        </div>
      ))}
    </div>
  );
};

// Composant pour la mobilité
const MobilitySelector = ({ value, onChange }) => (
  <div className="flex items-center gap-2">
    <span className="text-sm text-slate-600">Mobilité:</span>
    {[0, 1, 2, 3].map(m => (
      <button
        key={m}
        onClick={() => onChange(m)}
        className={`w-8 h-8 rounded-lg text-sm font-medium transition-all ${
          value === m 
            ? 'bg-sky-500 text-white shadow-md' 
            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
        }`}
      >
        {m}
      </button>
    ))}
  </div>
);

// Composant pour la furcation
const FurcationSelector = ({ value, onChange, positions }) => (
  <div className="flex items-center gap-2 flex-wrap">
    <span className="text-sm text-slate-600">Furcation:</span>
    {positions.map(pos => (
      <div key={pos} className="flex items-center gap-1">
        <span className="text-xs text-slate-500 capitalize">{pos}:</span>
        {[0, 1, 2, 3].map(f => (
          <button
            key={f}
            onClick={() => onChange(pos, f)}
            className={`w-6 h-6 rounded text-xs font-medium transition-all ${
              value[pos] === f 
                ? f === 0 ? 'bg-slate-200 text-slate-600' :
                  f === 1 ? 'bg-green-500 text-white' :
                  f === 2 ? 'bg-amber-500 text-white' :
                  'bg-red-500 text-white'
                : 'bg-slate-100 text-slate-400 hover:bg-slate-200'
            }`}
          >
            {f === 0 ? '○' : f === 1 ? '◔' : f === 2 ? '◑' : '●'}
          </button>
        ))}
      </div>
    ))}
  </div>
);

// Composant pour le graphique parodontal d'une arcade
const PerioGraph = ({ teeth, teethData, isUpper, side }) => {
  const graphHeight = 100;
  const toothWidth = 50;
  const baseY = isUpper ? 80 : 20;
  const direction = isUpper ? -1 : 1;
  
  const getPoints = (surfaceKey) => {
    return teeth.map((tooth, i) => {
      const data = teethData[tooth];
      if (data.missing) return null;
      
      const surface = data[surfaceKey];
      const points = surface.probing.map((p, j) => {
        const x = i * toothWidth + (j + 0.5) * (toothWidth / 3);
        const y = baseY + (p * 4 * direction);
        return `${x},${y}`;
      });
      return points.join(' ');
    }).filter(Boolean);
  };
  
  const getRecessionPoints = (surfaceKey) => {
    return teeth.map((tooth, i) => {
      const data = teethData[tooth];
      if (data.missing) return null;
      
      const surface = data[surfaceKey];
      const points = surface.recession.map((r, j) => {
        const x = i * toothWidth + (j + 0.5) * (toothWidth / 3);
        const y = baseY + (r * 4 * direction);
        return `${x},${y}`;
      });
      return points.join(' ');
    }).filter(Boolean);
  };
  
  const bleedingPoints = teeth.flatMap((tooth, i) => {
    const data = teethData[tooth];
    if (data.missing) return [];
    return data[side].bleeding.map((b, j) => {
      if (!b) return null;
      const x = i * toothWidth + (j + 0.5) * (toothWidth / 3);
      const y = baseY + (data[side].probing[j] * 4 * direction);
      return { x, y, tooth, idx: j };
    }).filter(Boolean);
  });

  return (
    <svg width={teeth.length * toothWidth} height={graphHeight} className="bg-slate-50 rounded-lg">
      {/* Lignes de référence */}
      {[0, 3, 5, 7].map(depth => (
        <line
          key={depth}
          x1="0"
          y1={baseY + depth * 4 * direction}
          x2={teeth.length * toothWidth}
          y2={baseY + depth * 4 * direction}
          stroke={depth === 3 ? '#fbbf24' : depth >= 5 ? '#ef4444' : '#e2e8f0'}
          strokeWidth={depth === 3 || depth === 5 ? 1.5 : 0.5}
          strokeDasharray={depth > 0 ? "4,4" : ""}
        />
      ))}
      
      {/* Séparateurs de dents */}
      {teeth.map((_, i) => (
        <line
          key={i}
          x1={i * toothWidth}
          y1="0"
          x2={i * toothWidth}
          y2={graphHeight}
          stroke="#e2e8f0"
          strokeWidth="0.5"
        />
      ))}
      
      {/* Numéros des dents */}
      {teeth.map((tooth, i) => (
        <text
          key={tooth}
          x={i * toothWidth + toothWidth / 2}
          y={isUpper ? 95 : 12}
          textAnchor="middle"
          fontSize="10"
          fill={teethData[tooth].missing ? '#94a3b8' : '#334155'}
          fontWeight="500"
        >
          {tooth}
        </text>
      ))}
      
      {/* Ligne de récession (rouge) */}
      <polyline
        points={getRecessionPoints(side).join(' ')}
        fill="none"
        stroke="#ef4444"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      
      {/* Ligne de sondage (bleu) */}
      <polyline
        points={getPoints(side).join(' ')}
        fill="none"
        stroke="#3b82f6"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      
      {/* Points de saignement */}
      {bleedingPoints.map((point, i) => (
        <circle
          key={i}
          cx={point.x}
          cy={point.y}
          r="4"
          fill="#ef4444"
        />
      ))}
    </svg>
  );
};

// Composant pour la grille de données
const DataGrid = ({ teeth, teethData, surface, onUpdate, isUpper, autoFocus = false }) => {
  const inputRefs = useRef({});

  // Auto-focus on first input (tooth 18, distal) when autoFocus is true
  useEffect(() => {
    if (autoFocus && surface === 'buccal') {
      const firstTooth = teeth[0];
      const refKey = `${firstTooth}-0`;
      if (inputRefs.current[refKey]) {
        inputRefs.current[refKey].focus();
        inputRefs.current[refKey].select();
      }
    }
  }, [autoFocus, surface, teeth]);

  // Handle Enter key navigation
  const handleEnterPress = (tooth, idx) => {
    const toothIndex = teeth.indexOf(tooth);
    let nextTooth, nextIdx;

    if (idx < 2) {
      // Move to next site on same tooth
      nextTooth = tooth;
      nextIdx = idx + 1;
    } else if (toothIndex < teeth.length - 1) {
      // Move to first site of next tooth
      nextTooth = teeth[toothIndex + 1];
      nextIdx = 0;
    } else {
      // End of row - no navigation
      return;
    }

    const refKey = `${nextTooth}-${nextIdx}`;
    if (inputRefs.current[refKey] && !teethData[nextTooth].missing) {
      inputRefs.current[refKey].focus();
      inputRefs.current[refKey].select();
    }
  };

  return (
    <div className="overflow-x-auto">
      <table className="text-xs border-collapse">
        <thead>
          <tr className="bg-slate-100">
            <th className="px-2 py-1 text-left text-slate-600 sticky left-0 bg-slate-100">
              {surface === 'buccal' ? 'Vestibulaire' : 'Lingual/Palatin'}
            </th>
            {teeth.map(tooth => (
              <th key={tooth} colSpan="3" className={`px-1 py-1 text-center border-l border-slate-300 ${teethData[tooth].missing ? 'text-slate-400' : 'text-slate-700'}`}>
                {tooth}
              </th>
            ))}
          </tr>
          <tr className="bg-slate-50">
            <th className="px-2 py-0.5 text-left text-slate-500 sticky left-0 bg-slate-50">Site</th>
            {teeth.map(tooth => (
              <React.Fragment key={tooth}>
                <th className="px-1 py-0.5 text-center text-slate-400 border-l border-slate-200">D</th>
                <th className="px-1 py-0.5 text-center text-slate-400">C</th>
                <th className="px-1 py-0.5 text-center text-slate-400">M</th>
              </React.Fragment>
            ))}
          </tr>
        </thead>
        <tbody>
          {/* Sondage */}
          <tr>
            <td className="px-2 py-1 font-medium text-slate-600 sticky left-0 bg-white">Sondage</td>
            {teeth.map(tooth => {
              const data = teethData[tooth][surface];
              return (
                <React.Fragment key={tooth}>
                  {data.probing.map((val, idx) => (
                    <td key={idx} className={`px-0.5 py-0.5 text-center border-l border-slate-100 ${idx === 0 ? 'border-l-slate-300' : ''}`}>
                      <input
                        ref={(el) => inputRefs.current[`${tooth}-${idx}`] = el}
                        type="number"
                        min="0"
                        max="15"
                        value={val || ''}
                        disabled={teethData[tooth].missing}
                        onChange={(e) => {
                          const newProbing = [...data.probing];
                          newProbing[idx] = parseInt(e.target.value) || 0;
                          onUpdate(tooth, surface, 'probing', newProbing);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleEnterPress(tooth, idx);
                          }
                        }}
                        className={`w-8 h-6 text-center border rounded text-xs
                          ${teethData[tooth].missing ? 'bg-slate-100 text-slate-400' :
                            val >= 5 ? 'bg-red-100 border-red-300 text-red-700 font-bold' :
                            val >= 4 ? 'bg-amber-100 border-amber-300 text-amber-700' :
                            'bg-white border-slate-200'}`}
                      />
                    </td>
                  ))}
                </React.Fragment>
              );
            })}
          </tr>
          
          {/* Récession */}
          <tr>
            <td className="px-2 py-1 font-medium text-slate-600 sticky left-0 bg-white">Récession</td>
            {teeth.map(tooth => {
              const data = teethData[tooth][surface];
              return (
                <React.Fragment key={tooth}>
                  {data.recession.map((val, idx) => (
                    <td key={idx} className={`px-0.5 py-0.5 text-center border-l border-slate-100 ${idx === 0 ? 'border-l-slate-300' : ''}`}>
                      <input
                        type="number"
                        min="-10"
                        max="15"
                        value={val || ''}
                        disabled={teethData[tooth].missing}
                        onChange={(e) => {
                          const newRecession = [...data.recession];
                          newRecession[idx] = parseInt(e.target.value) || 0;
                          onUpdate(tooth, surface, 'recession', newRecession);
                        }}
                        className={`w-8 h-6 text-center border rounded text-xs
                          ${teethData[tooth].missing ? 'bg-slate-100 text-slate-400' : 'bg-white border-slate-200'}`}
                      />
                    </td>
                  ))}
                </React.Fragment>
              );
            })}
          </tr>
          
          {/* Saignement */}
          <tr>
            <td className="px-2 py-1 font-medium text-red-600 sticky left-0 bg-white">Saign.</td>
            {teeth.map(tooth => {
              const data = teethData[tooth][surface];
              return (
                <React.Fragment key={tooth}>
                  {data.bleeding.map((val, idx) => (
                    <td key={idx} className={`px-0.5 py-0.5 text-center border-l border-slate-100 ${idx === 0 ? 'border-l-slate-300' : ''}`}>
                      <button
                        disabled={teethData[tooth].missing}
                        onClick={() => {
                          const newBleeding = [...data.bleeding];
                          newBleeding[idx] = !newBleeding[idx];
                          onUpdate(tooth, surface, 'bleeding', newBleeding);
                        }}
                        className={`w-6 h-6 rounded-full border-2 transition-all
                          ${teethData[tooth].missing ? 'bg-slate-100 border-slate-200' :
                            val ? 'bg-red-500 border-red-500' : 'bg-white border-red-200 hover:border-red-400'}`}
                      />
                    </td>
                  ))}
                </React.Fragment>
              );
            })}
          </tr>
          
          {/* Plaque */}
          <tr>
            <td className="px-2 py-1 font-medium text-amber-600 sticky left-0 bg-white">Plaque</td>
            {teeth.map(tooth => {
              const data = teethData[tooth][surface];
              return (
                <React.Fragment key={tooth}>
                  {data.plaque.map((val, idx) => (
                    <td key={idx} className={`px-0.5 py-0.5 text-center border-l border-slate-100 ${idx === 0 ? 'border-l-slate-300' : ''}`}>
                      <button
                        disabled={teethData[tooth].missing}
                        onClick={() => {
                          const newPlaque = [...data.plaque];
                          newPlaque[idx] = !newPlaque[idx];
                          onUpdate(tooth, surface, 'plaque', newPlaque);
                        }}
                        className={`w-6 h-6 rounded-full border-2 transition-all
                          ${teethData[tooth].missing ? 'bg-slate-100 border-slate-200' :
                            val ? 'bg-amber-500 border-amber-500' : 'bg-white border-amber-200 hover:border-amber-400'}`}
                      />
                    </td>
                  ))}
                </React.Fragment>
              );
            })}
          </tr>
          
          {/* Suppuration */}
          <tr>
            <td className="px-2 py-1 font-medium text-purple-600 sticky left-0 bg-white">Supp.</td>
            {teeth.map(tooth => {
              const data = teethData[tooth][surface];
              return (
                <React.Fragment key={tooth}>
                  {data.suppuration.map((val, idx) => (
                    <td key={idx} className={`px-0.5 py-0.5 text-center border-l border-slate-100 ${idx === 0 ? 'border-l-slate-300' : ''}`}>
                      <button
                        disabled={teethData[tooth].missing}
                        onClick={() => {
                          const newSuppuration = [...data.suppuration];
                          newSuppuration[idx] = !newSuppuration[idx];
                          onUpdate(tooth, surface, 'suppuration', newSuppuration);
                        }}
                        className={`w-6 h-6 rounded-full border-2 transition-all
                          ${teethData[tooth].missing ? 'bg-slate-100 border-slate-200' :
                            val ? 'bg-purple-500 border-purple-500' : 'bg-white border-purple-200 hover:border-purple-400'}`}
                      />
                    </td>
                  ))}
                </React.Fragment>
              );
            })}
          </tr>
        </tbody>
      </table>
    </div>
  );
};

// Composant principal
export default function PeriodontalChart() {
  const [teethData, setTeethData] = useState(initializeTeethData());
  const [selectedTooth, setSelectedTooth] = useState(null);
  const [patientInfo, setPatientInfo] = useState({
    id: '',
    name: '',
    firstName: '',
    date: new Date().toISOString().split('T')[0],
    examiner: ''
  });
  const [contextInfo, setContextInfo] = useState({
    praticienId: '',
    praticienNom: '',
    centreId: '',
    centreNom: ''
  });
  const [activeView, setActiveView] = useState('chart'); // 'chart', 'data', 'diagnostic', 'radio'
  const [showPdfModal, setShowPdfModal] = useState(false);
  const [pdfDataUrl, setPdfDataUrl] = useState(null);
  const [pdfBase64, setPdfBase64] = useState(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [isSendingToVeasy, setIsSendingToVeasy] = useState(false);
  const [radiographs, setRadiographs] = useState([]); // Store captured radiographs
  const [isCapturing, setIsCapturing] = useState(false);
  const [photos, setPhotos] = useState([]); // Store photos from mobile
  const [qrCodeUrl, setQrCodeUrl] = useState(null);
  const [peerStatus, setPeerStatus] = useState('idle'); // idle, waiting, connected
  const chartRef = useRef(null);
  const diagnosticRef = useRef(null);
  const peerRef = useRef(null);
  const connRef = useRef(null);

  // États pour le partage Gmail
  const [showShareModal, setShowShareModal] = useState(false);
  const [gmailLoading, setGmailLoading] = useState(false);
  const [gmailError, setGmailError] = useState(null);
  const [gmailRecipient, setGmailRecipient] = useState('');
  const [showGmailForm, setShowGmailForm] = useState(false);
  const [pdfBlob, setPdfBlob] = useState(null);

  // QR PDF Share (P2P for WhatsApp on desktop)
  const [showQRShare, setShowQRShare] = useState(false);
  const [qrPeerId, setQrPeerId] = useState(null);
  const [qrPeerStatus, setQrPeerStatus] = useState('disconnected'); // disconnected, connecting, waiting, connected
  const [qrTransferStatus, setQrTransferStatus] = useState(null); // null, sending, sent, error
  const qrPeerRef = useRef(null);

  // Panoramic analysis states
  const [showPanoModal, setShowPanoModal] = useState(false);
  const [panoImage, setPanoImage] = useState(null);
  const [panoAnalyzing, setPanoAnalyzing] = useState(false);
  const [panoError, setPanoError] = useState(null);
  const [panoResult, setPanoResult] = useState(null);
  const PANO_WEBHOOK_URL = 'https://n8n.cemedis.app/webhook/radio-panoramique-segmentation1';

  // Gmail OAuth configuration
  const GMAIL_CLIENT_ID = '77466324556-s2siqrgbdj9qt0hu45s9oqsa4n5650in.apps.googleusercontent.com';
  const GMAIL_SCOPES = 'https://www.googleapis.com/auth/gmail.compose';

  // Lecture des paramètres URL au chargement
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);

    // Paramètres du praticien
    const praticienId = params.get('ID_praticien') || '';
    const praticienNom = params.get('Praticien_nom') || '';

    // Paramètres du centre
    const centreId = params.get('ID_centre') || '';
    const centreNom = params.get('Centre_nom') || '';

    // Paramètres du patient
    const patientId = params.get('Patient_id') || '';
    const patientNom = params.get('Patient_nom') || '';
    const patientPrenom = params.get('Patient_prenom') || '';

    // Mise à jour des états
    if (praticienId || praticienNom || centreId || centreNom) {
      setContextInfo({
        praticienId,
        praticienNom: decodeURIComponent(praticienNom).trim(),
        centreId,
        centreNom: decodeURIComponent(centreNom).trim()
      });
    }

    if (patientId || patientNom || patientPrenom) {
      setPatientInfo(prev => ({
        ...prev,
        id: patientId,
        name: decodeURIComponent(patientNom).trim(),
        firstName: decodeURIComponent(patientPrenom).trim(),
        examiner: praticienNom ? decodeURIComponent(praticienNom).trim() : prev.examiner
      }));
    }
  }, []);
  
  // Calcul des statistiques
  const calculateStats = useCallback(() => {
    let totalSites = 0;
    let bleedingSites = 0;
    let plaqueSites = 0;
    let deepPockets = 0;
    let moderatePockets = 0;
    let presentTeeth = 0;
    let maxPocketDepth = 0;

    // Track teeth with pocket depth > 4mm for etendue calculation
    const teethWithDeepPockets = [];
    const incisives = [12, 11, 21, 22, 42, 41, 31, 32]; // Incisives
    const molaires = [18, 17, 16, 26, 27, 28, 48, 47, 46, 36, 37, 38]; // Molaires

    [...TEETH_UPPER, ...TEETH_LOWER].forEach(tooth => {
      const data = teethData[tooth];
      if (data.missing) return;

      presentTeeth++;
      let toothHasDeepPocket = false;

      ['buccal', 'lingual'].forEach(surface => {
        data[surface].probing.forEach((p, i) => {
          totalSites++;
          if (data[surface].bleeding[i]) bleedingSites++;
          if (data[surface].plaque[i]) plaqueSites++;
          if (p >= 5) deepPockets++;
          else if (p >= 4) moderatePockets++;
          if (p > maxPocketDepth) maxPocketDepth = p;
          if (p > 4 && !toothHasDeepPocket) {
            toothHasDeepPocket = true;
            teethWithDeepPockets.push(tooth);
          }
        });
      });
    });

    // Calculate percentage of teeth with deep pockets (>4mm)
    const percentageDeepPockets = presentTeeth > 0 ? (teethWithDeepPockets.length / presentTeeth) * 100 : 0;

    // Determine distribution (incisives/molaires)
    const affectedIncisives = teethWithDeepPockets.filter(t => incisives.includes(t));
    const affectedMolaires = teethWithDeepPockets.filter(t => molaires.includes(t));

    return {
      totalTeeth: presentTeeth,
      totalSites,
      bop: totalSites > 0 ? ((bleedingSites / totalSites) * 100).toFixed(1) : 0,
      plaqueIndex: totalSites > 0 ? ((plaqueSites / totalSites) * 100).toFixed(1) : 0,
      deepPockets,
      moderatePockets,
      maxPocketDepth,
      teethWithDeepPockets,
      percentageDeepPockets,
      hasAffectedIncisives: affectedIncisives.length > 0,
      hasAffectedMolaires: affectedMolaires.length > 0,
      affectedIncisives,
      affectedMolaires
    };
  }, [teethData]);
  
  const stats = calculateStats();
  
  // Mise à jour des données d'une dent
  const updateToothData = (tooth, surface, field, value) => {
    setTeethData(prev => ({
      ...prev,
      [tooth]: {
        ...prev[tooth],
        [surface]: {
          ...prev[tooth][surface],
          [field]: value
        }
      }
    }));
  };
  
  // Toggle dent manquante
  const toggleMissing = (tooth) => {
    setTeethData(prev => ({
      ...prev,
      [tooth]: {
        ...prev[tooth],
        missing: !prev[tooth].missing,
        implant: false
      }
    }));
  };
  
  // Toggle implant
  const toggleImplant = (tooth) => {
    setTeethData(prev => ({
      ...prev,
      [tooth]: {
        ...prev[tooth],
        implant: !prev[tooth].implant,
        missing: false
      }
    }));
  };
  
  // Mise à jour mobilité
  const updateMobility = (tooth, value) => {
    setTeethData(prev => ({
      ...prev,
      [tooth]: {
        ...prev[tooth],
        mobility: value
      }
    }));
  };
  
  // Mise à jour furcation
  const updateFurcation = (tooth, position, value) => {
    setTeethData(prev => ({
      ...prev,
      [tooth]: {
        ...prev[tooth],
        furcation: {
          ...prev[tooth].furcation,
          [position]: value
        }
      }
    }));
  };
  
  // Export JSON
  const exportData = () => {
    const data = {
      patient: patientInfo,
      context: contextInfo,
      teeth: teethData,
      stats,
      exportDate: new Date().toISOString()
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const patientName = patientInfo.name
      ? `${patientInfo.name}${patientInfo.firstName ? '-' + patientInfo.firstName : ''}`
      : 'patient';
    a.download = `perio-chart-${patientName}-${patientInfo.date}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };
  
  // Import JSON
  const importData = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target.result);
          if (data.teeth) setTeethData(data.teeth);
          if (data.patient) setPatientInfo(prev => ({ ...prev, ...data.patient }));
          if (data.context) setContextInfo(prev => ({ ...prev, ...data.context }));
        } catch (err) {
          alert('Erreur lors de l\'import du fichier');
        }
      };
      reader.readAsText(file);
    }
  };
  
  // Reset
  const resetChart = () => {
    if (confirm('Êtes-vous sûr de vouloir réinitialiser le charting ?')) {
      setTeethData(initializeTeethData());
      setSelectedTooth(null);
    }
  };

  // Remplissage aléatoire pour tests (valeurs réalistes sans extrêmes)
  const fillRandomData = () => {
    const molars = [18, 17, 16, 26, 27, 28, 48, 47, 46, 36, 37, 38];
    const allTeeth = [...TEETH_UPPER, ...TEETH_LOWER];

    // Helper pour générer un nombre aléatoire dans une plage
    const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
    const randomBool = (probability = 0.5) => Math.random() < probability;

    // Distribution de probing réaliste (majorité entre 2-4mm)
    const randomProbing = () => {
      const rand = Math.random();
      if (rand < 0.3) return randomInt(1, 2);      // 30% : 1-2mm (sain)
      if (rand < 0.7) return randomInt(3, 4);      // 40% : 3-4mm (léger)
      if (rand < 0.9) return randomInt(5, 6);      // 20% : 5-6mm (modéré)
      return randomInt(7, 8);                       // 10% : 7-8mm (sévère mais pas extrême)
    };

    // Récession réaliste (majorité 0-2mm)
    const randomRecession = () => {
      const rand = Math.random();
      if (rand < 0.5) return 0;                    // 50% : pas de récession
      if (rand < 0.8) return randomInt(1, 2);     // 30% : 1-2mm
      return randomInt(3, 4);                      // 20% : 3-4mm
    };

    const data = {};

    // Choisir quelques dents à marquer comme manquantes (2-4 dents)
    const missingCount = randomInt(2, 4);
    const missingTeeth = new Set();
    while (missingTeeth.size < missingCount) {
      const randomTooth = allTeeth[randomInt(0, allTeeth.length - 1)];
      // Éviter les dents de devant pour plus de réalisme
      if (![11, 21, 31, 41].includes(randomTooth)) {
        missingTeeth.add(randomTooth);
      }
    }

    // Choisir 1-2 implants parmi les dents manquantes
    const implantTeeth = new Set();
    const implantCount = randomInt(1, Math.min(2, missingTeeth.size));
    const missingArray = Array.from(missingTeeth);
    for (let i = 0; i < implantCount; i++) {
      if (missingArray[i]) {
        implantTeeth.add(missingArray[i]);
        missingTeeth.delete(missingArray[i]); // C'est un implant, pas vraiment manquante
      }
    }

    allTeeth.forEach(tooth => {
      const isMissing = missingTeeth.has(tooth);
      const isImplant = implantTeeth.has(tooth);
      const isMolar = molars.includes(tooth);

      if (isMissing) {
        data[tooth] = {
          ...createToothData(),
          missing: true
        };
      } else if (isImplant) {
        data[tooth] = {
          ...createToothData(),
          implant: true,
          buccal: {
            probing: [randomInt(2, 4), randomInt(2, 4), randomInt(2, 4)],
            recession: [0, 0, 0],
            bleeding: [randomBool(0.2), randomBool(0.2), randomBool(0.2)],
            plaque: [randomBool(0.3), randomBool(0.3), randomBool(0.3)],
            suppuration: [false, false, false]
          },
          lingual: {
            probing: [randomInt(2, 4), randomInt(2, 4), randomInt(2, 4)],
            recession: [0, 0, 0],
            bleeding: [randomBool(0.2), randomBool(0.2), randomBool(0.2)],
            plaque: [randomBool(0.3), randomBool(0.3), randomBool(0.3)],
            suppuration: [false, false, false]
          }
        };
      } else {
        data[tooth] = {
          missing: false,
          implant: false,
          mobility: randomBool(0.1) ? randomInt(1, 2) : 0,  // 10% avec mobilité légère
          furcation: isMolar ? {
            buccal: randomBool(0.2) ? randomInt(1, 2) : 0,
            lingual: randomBool(0.15) ? randomInt(1, 2) : 0,
            mesial: 0,
            distal: 0
          } : { buccal: 0, lingual: 0, mesial: 0, distal: 0 },
          buccal: {
            probing: [randomProbing(), randomProbing(), randomProbing()],
            recession: [randomRecession(), randomRecession(), randomRecession()],
            bleeding: [randomBool(0.25), randomBool(0.25), randomBool(0.25)],
            plaque: [randomBool(0.35), randomBool(0.35), randomBool(0.35)],
            suppuration: [randomBool(0.05), randomBool(0.05), randomBool(0.05)]
          },
          lingual: {
            probing: [randomProbing(), randomProbing(), randomProbing()],
            recession: [randomRecession(), randomRecession(), randomRecession()],
            bleeding: [randomBool(0.25), randomBool(0.25), randomBool(0.25)],
            plaque: [randomBool(0.35), randomBool(0.35), randomBool(0.35)],
            suppuration: [randomBool(0.05), randomBool(0.05), randomBool(0.05)]
          },
          note: ''
        };
      }
    });

    setTeethData(data);
    setSelectedTooth(null);
  };

  // Génération du PDF
  const generatePdf = async () => {
    setIsGeneratingPdf(true);
    try {
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 15;
      let yPos = 0;

      // En-tête avec fond coloré
      pdf.setFillColor(0, 75, 99); // Dark teal - professional medical color
      pdf.rect(0, 0, pageWidth, 32, 'F');

      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(18);
      pdf.setFont('helvetica', 'bold');
      pdf.text('HelloParo', margin, 12);

      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      pdf.text(contextInfo.centreNom || 'HelloParo', margin, 20);
      pdf.text('Date: ' + patientInfo.date, margin, 27);

      yPos = 40;

      // Informations patient
      pdf.setTextColor(0, 0, 0);
      pdf.setFillColor(248, 250, 252);
      pdf.rect(margin, yPos, pageWidth - 2 * margin, 25, 'F');
      pdf.setDrawColor(226, 232, 240);
      pdf.rect(margin, yPos, pageWidth - 2 * margin, 25, 'S');

      pdf.setFontSize(11);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Informations Patient', margin + 5, yPos + 7);

      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'normal');
      const patientFullName = ((patientInfo.firstName || '') + ' ' + (patientInfo.name || '')).trim() || 'Non renseigne';
      pdf.text('Patient: ' + patientFullName, margin + 5, yPos + 15);
      pdf.text('ID: ' + (patientInfo.id || 'N/A'), margin + 5, yPos + 21);
      pdf.text('Examinateur: ' + (patientInfo.examiner || contextInfo.praticienNom || 'Non renseigne'), margin + 100, yPos + 15);

      yPos += 32;

      // Statistiques
      pdf.setFillColor(240, 253, 244);
      pdf.rect(margin, yPos, pageWidth - 2 * margin, 18, 'F');
      pdf.setDrawColor(187, 247, 208);
      pdf.rect(margin, yPos, pageWidth - 2 * margin, 18, 'S');

      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(22, 101, 52);
      pdf.text('Statistiques', margin + 5, yPos + 6);

      pdf.setFontSize(8);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(0, 0, 0);
      pdf.text('Dents: ' + stats.totalTeeth + '  |  Sites: ' + stats.totalSites + '  |  Indice de saignement: ' + stats.bop + '%  |  Plaque: ' + stats.plaqueIndex + '%  |  Poches >=5mm: ' + stats.deepPockets + '  |  Poches 4mm: ' + stats.moderatePockets, margin + 5, yPos + 13);

      yPos += 25;

      // Tableau Arcade Maxillaire
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(0, 0, 0);
      pdf.text('Arcade Maxillaire', margin, yPos);
      yPos += 5;

      const colWidth = 10;
      const startX = margin;

      // En-tête
      pdf.setFontSize(6);
      pdf.setFont('helvetica', 'bold');
      pdf.setFillColor(241, 245, 249);
      pdf.rect(startX, yPos, 180, 5, 'F');

      pdf.text('', startX + 2, yPos + 3.5);
      TEETH_UPPER.forEach((tooth, i) => {
        pdf.text(String(tooth), startX + 12 + (i * colWidth), yPos + 3.5);
      });
      yPos += 5;

      // Données PD Vestibulaire
      pdf.setFont('helvetica', 'normal');
      pdf.text('PD V', startX + 2, yPos + 3.5);
      TEETH_UPPER.forEach((tooth, i) => {
        const data = teethData[tooth];
        if (!data.missing) {
          pdf.text(data.buccal.probing.join('-'), startX + 12 + (i * colWidth), yPos + 3.5);
        } else {
          pdf.setTextColor(180, 180, 180);
          pdf.text('X', startX + 14 + (i * colWidth), yPos + 3.5);
          pdf.setTextColor(0, 0, 0);
        }
      });
      yPos += 4;

      // Données PD Palatin
      pdf.text('PD P', startX + 2, yPos + 3.5);
      TEETH_UPPER.forEach((tooth, i) => {
        const data = teethData[tooth];
        if (!data.missing) {
          pdf.text(data.lingual.probing.join('-'), startX + 12 + (i * colWidth), yPos + 3.5);
        }
      });
      yPos += 8;

      // Tableau Arcade Mandibulaire
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Arcade Mandibulaire', margin, yPos);
      yPos += 5;

      pdf.setFontSize(6);
      pdf.setFillColor(241, 245, 249);
      pdf.rect(startX, yPos, 180, 5, 'F');

      pdf.text('', startX + 2, yPos + 3.5);
      TEETH_LOWER.forEach((tooth, i) => {
        pdf.text(String(tooth), startX + 12 + (i * colWidth), yPos + 3.5);
      });
      yPos += 5;

      pdf.setFont('helvetica', 'normal');
      pdf.text('PD V', startX + 2, yPos + 3.5);
      TEETH_LOWER.forEach((tooth, i) => {
        const data = teethData[tooth];
        if (!data.missing) {
          pdf.text(data.buccal.probing.join('-'), startX + 12 + (i * colWidth), yPos + 3.5);
        } else {
          pdf.setTextColor(180, 180, 180);
          pdf.text('X', startX + 14 + (i * colWidth), yPos + 3.5);
          pdf.setTextColor(0, 0, 0);
        }
      });
      yPos += 4;

      pdf.text('PD L', startX + 2, yPos + 3.5);
      TEETH_LOWER.forEach((tooth, i) => {
        const data = teethData[tooth];
        if (!data.missing) {
          pdf.text(data.lingual.probing.join('-'), startX + 12 + (i * colWidth), yPos + 3.5);
        }
      });
      yPos += 10;

      // Capture du graphique
      if (chartRef.current) {
        try {
          const canvas = await html2canvas(chartRef.current, {
            scale: 1.5,
            useCORS: true,
            logging: false,
            backgroundColor: '#ffffff'
          });

          const imgData = canvas.toDataURL('image/jpeg', 0.7);
          const availableWidth = pageWidth - 2 * margin;
          const imgRatio = canvas.width / canvas.height;
          let imgWidth = availableWidth;
          let imgHeight = imgWidth / imgRatio;

          const maxHeight = pageHeight - yPos - 20;
          if (imgHeight > maxHeight) {
            imgHeight = maxHeight;
            imgWidth = imgHeight * imgRatio;
          }

          pdf.addImage(imgData, 'JPEG', margin, yPos, imgWidth, imgHeight);
        } catch (e) {
          console.warn('Capture echouee:', e);
        }
      }

      // Radiographies (nouvelle page si présentes)
      if (radiographs.length > 0) {
        pdf.addPage();

        // En-tête de la page radiographies
        pdf.setFillColor(0, 75, 99);
        pdf.rect(0, 0, pageWidth, 25, 'F');

        pdf.setTextColor(255, 255, 255);
        pdf.setFontSize(14);
        pdf.setFont('helvetica', 'bold');
        pdf.text('Radiographies', margin, 15);

        let radioY = 35;
        const radioWidth = 85;
        const radioHeight = 65;
        let radioX = margin;
        let radioCount = 0;

        for (const radio of radiographs) {
          // Vérifier si on doit passer à une nouvelle ligne ou page
          if (radioCount > 0 && radioCount % 2 === 0) {
            radioY += radioHeight + 15;
            radioX = margin;
          }
          if (radioY + radioHeight > pageHeight - 20) {
            pdf.addPage();
            radioY = 20;
            radioX = margin;
          }

          try {
            pdf.addImage(radio.data, 'PNG', radioX, radioY, radioWidth, radioHeight);

            // Nom de la radiographie
            pdf.setFontSize(8);
            pdf.setFont('helvetica', 'normal');
            pdf.setTextColor(0, 0, 0);
            pdf.text(radio.name, radioX, radioY + radioHeight + 5);
          } catch (e) {
            console.warn('Erreur ajout radiographie:', e);
          }

          radioX += radioWidth + 10;
          radioCount++;
        }
      }

      // Photographies (nouvelle page si présentes)
      if (photos.length > 0) {
        pdf.addPage();

        // En-tête de la page photos
        pdf.setFillColor(0, 75, 99);
        pdf.rect(0, 0, pageWidth, 25, 'F');

        pdf.setTextColor(255, 255, 255);
        pdf.setFontSize(14);
        pdf.setFont('helvetica', 'bold');
        pdf.text('Photographies', margin, 15);

        let photoY = 35;
        const photoWidth = 85;
        const photoHeight = 65;
        let photoX = margin;
        let photoCount = 0;

        for (const photo of photos) {
          if (photoCount > 0 && photoCount % 2 === 0) {
            photoY += photoHeight + 15;
            photoX = margin;
          }
          if (photoY + photoHeight > pageHeight - 20) {
            pdf.addPage();
            photoY = 20;
            photoX = margin;
          }

          try {
            pdf.addImage(photo.data, 'JPEG', photoX, photoY, photoWidth, photoHeight);
            pdf.setFontSize(8);
            pdf.setFont('helvetica', 'normal');
            pdf.setTextColor(0, 0, 0);
            pdf.text(photo.name, photoX, photoY + photoHeight + 5);
          } catch (e) {
            console.warn('Erreur ajout photo:', e);
          }

          photoX += photoWidth + 10;
          photoCount++;
        }
      }

      // Pied de page
      pdf.setFontSize(7);
      pdf.setTextColor(128, 128, 128);
      const dateStr = new Date().toLocaleDateString('fr-FR') + ' ' + new Date().toLocaleTimeString('fr-FR');
      pdf.text('Genere le ' + dateStr + ' - HelloParo', margin, pageHeight - 8);

      // Générer blob URL pour l'affichage
      const pdfBlob = pdf.output('blob');
      const blobUrl = URL.createObjectURL(pdfBlob);

      // Générer base64 pour l'envoi
      const base64Data = pdf.output('datauristring').split(',')[1];

      setPdfDataUrl(blobUrl);
      setPdfBase64(base64Data);
      setShowPdfModal(true);
    } catch (error) {
      console.error('Erreur PDF:', error);
      alert('Erreur lors de la generation du PDF: ' + error.message);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  // Télécharger le PDF
  const downloadPdf = () => {
    if (pdfDataUrl) {
      const link = document.createElement('a');
      link.href = pdfDataUrl;
      const patientName = patientInfo.name
        ? `${patientInfo.name}${patientInfo.firstName ? '-' + patientInfo.firstName : ''}`
        : 'patient';
      link.download = `charting-parodontal-${patientName}-${patientInfo.date}.pdf`;
      link.click();
    }
  };

  // Imprimer le PDF
  const printPdf = () => {
    if (pdfDataUrl) {
      const printWindow = window.open(pdfDataUrl);
      if (printWindow) {
        printWindow.onload = () => {
          printWindow.print();
        };
      }
    }
  };

  // Analyse panoramique IA
  const handlePanoFileImport = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setPanoImage(event.target.result);
        setPanoError(null);
        setPanoResult(null);
      };
      reader.readAsDataURL(file);
    }
    e.target.value = '';
  };

  const handlePanoCapture = async () => {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: { mediaSource: 'screen' }
      });

      const video = document.createElement('video');
      video.srcObject = stream;
      await video.play();

      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0);

      stream.getTracks().forEach(track => track.stop());

      const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
      setPanoImage(dataUrl);
      setPanoError(null);
      setPanoResult(null);
    } catch (error) {
      console.error('Erreur capture:', error);
      setPanoError('Erreur lors de la capture d\'écran');
    }
  };

  const analyzePanorama = async () => {
    if (!panoImage) return;

    setPanoAnalyzing(true);
    setPanoError(null);
    setPanoResult(null);

    try {
      // Extract base64 data from data URL
      const base64Data = panoImage.split(',')[1];

      console.log('Envoi de la panoramique au webhook...');
      console.log('Taille de l\'image (base64):', base64Data.length, 'caractères');

      const response = await fetch(PANO_WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ img_b64: base64Data })
      });

      console.log('Réponse reçue, status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Erreur ${response.status}: ${errorText || response.statusText}`);
      }

      const result = await response.json();
      console.log('Résultat de l\'analyse:', result);

      if (result.success && result.detail_par_dent) {
        setPanoResult(result);
      } else {
        throw new Error(result.error || 'Analyse échouée - format de réponse invalide');
      }
    } catch (error) {
      console.error('Erreur analyse panoramique:', error);

      let errorMessage = error.message;
      if (error.message === 'Failed to fetch') {
        errorMessage = 'Impossible de contacter le serveur d\'analyse. Vérifiez votre connexion internet ou contactez l\'administrateur (erreur CORS possible).';
      }

      setPanoError(errorMessage);
    } finally {
      setPanoAnalyzing(false);
    }
  };

  const applyPanoResult = () => {
    if (!panoResult || !panoResult.detail_par_dent) return;

    const newTeethData = { ...teethData };

    Object.entries(panoResult.detail_par_dent).forEach(([toothNum, data]) => {
      const tooth = parseInt(toothNum);
      if (newTeethData[tooth]) {
        // Update missing status (absent = missing)
        newTeethData[tooth] = {
          ...newTeethData[tooth],
          missing: !data.present,
          implant: data.implant || false
        };
      }
    });

    setTeethData(newTeethData);
    setShowPanoModal(false);
    setPanoImage(null);
    setPanoResult(null);
  };

  // Envoyer à Veasy
  const sendToVeasy = async () => {
    if (!pdfBase64) {
      await generatePdf();
    }

    setIsSendingToVeasy(true);
    try {
      const payload = {
        patient: patientInfo,
        context: contextInfo,
        teeth: teethData,
        stats,
        pdf_base64: pdfBase64,
        exportDate: new Date().toISOString()
      };

      const response = await fetch('https://n8n.cemedis.app/webhook/fc0611a7-63ed-44db-b4e9-d9401957d18a', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        alert('Données envoyées avec succès à Veasy !');
      } else {
        throw new Error(`Erreur ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Erreur lors de l\'envoi à Veasy:', error);
      alert('Erreur lors de l\'envoi à Veasy: ' + error.message);
    } finally {
      setIsSendingToVeasy(false);
    }
  };

  // Helper functions pour le partage
  const getPatientName = () => {
    return `${patientInfo.nom || ''} ${patientInfo.prenom || ''}`.trim() || 'Patient';
  };

  const getFileName = () => {
    const date = new Date().toLocaleDateString('fr-FR').replace(/\//g, '-');
    return `Charting_Parodontal_${getPatientName().replace(/\s+/g, '_')}_${date}.pdf`;
  };

  const canShareFiles = () => {
    return navigator.share && navigator.canShare && navigator.canShare({ files: [new File([''], 'test.pdf', { type: 'application/pdf' })] });
  };

  // Partage par email classique (mailto)
  const shareViaEmail = () => {
    const subject = encodeURIComponent(`Charting Parodontal - ${getPatientName()}`);
    const body = encodeURIComponent(`Bonjour,\n\nVeuillez trouver ci-joint le charting parodontal de ${getPatientName()}.\n\nCordialement`);
    window.open(`mailto:?subject=${subject}&body=${body}`);
  };

  // Detect if on mobile
  const isMobile = () => {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  };

  // Generate unique peer ID for QR sharing
  const generateQrPeerId = () => {
    return 'pdf-' + Math.random().toString(36).substring(2, 10);
  };

  // Initialize P2P connection for QR sharing
  const initializeQrPeer = useCallback(() => {
    if (qrPeerRef.current) {
      qrPeerRef.current.destroy();
    }

    const newPeerId = generateQrPeerId();
    setQrPeerStatus('connecting');
    setQrTransferStatus(null);

    const peer = new Peer(newPeerId, { debug: 0 });

    peer.on('open', (id) => {
      setQrPeerId(id);
      setQrPeerStatus('waiting');
    });

    peer.on('connection', (conn) => {
      setQrPeerStatus('connected');

      conn.on('open', async () => {
        // Send PDF data to mobile
        if (pdfBlob) {
          setQrTransferStatus('sending');
          try {
            const arrayBuffer = await pdfBlob.arrayBuffer();
            const base64Pdf = btoa(
              new Uint8Array(arrayBuffer).reduce((data, byte) => data + String.fromCharCode(byte), '')
            );
            conn.send({
              type: 'pdf',
              data: base64Pdf,
              filename: getFileName(),
              patientName: getPatientName()
            });
            setQrTransferStatus('sent');
          } catch (err) {
            console.error('Error sending PDF:', err);
            setQrTransferStatus('error');
          }
        }
      });

      conn.on('close', () => {
        setQrPeerStatus('waiting');
      });
    });

    peer.on('error', (err) => {
      console.error('QR Peer error:', err);
      setQrPeerStatus('disconnected');
    });

    qrPeerRef.current = peer;
  }, [pdfBlob]);

  // Open QR share modal
  const openQRShare = () => {
    setShowQRShare(true);
    setShowShareModal(false);
    initializeQrPeer();
  };

  // Close QR share modal
  const closeQRShare = () => {
    setShowQRShare(false);
    if (qrPeerRef.current) {
      qrPeerRef.current.destroy();
      qrPeerRef.current = null;
    }
    setQrPeerId(null);
    setQrPeerStatus('disconnected');
    setQrTransferStatus(null);
  };

  // Partage via WhatsApp - P2P sur desktop, natif sur mobile
  const shareViaWhatsApp = async () => {
    if (isMobile()) {
      // Sur mobile, utiliser le partage natif avec fichier
      if (pdfBlob && navigator.share && navigator.canShare) {
        const file = new File([pdfBlob], getFileName(), { type: 'application/pdf' });
        if (navigator.canShare({ files: [file] })) {
          try {
            await navigator.share({
              title: `Charting Parodontal - ${getPatientName()}`,
              text: `Charting Parodontal - ${getPatientName()}`,
              files: [file]
            });
            return;
          } catch (e) {
            console.log('Native share failed:', e);
          }
        }
      }
      // Fallback: ouvrir WhatsApp avec texte
      const text = encodeURIComponent(`Charting Parodontal - ${getPatientName()}`);
      window.open(`https://wa.me/?text=${text}`);
    } else {
      // Sur desktop, ouvrir le QR code pour transfert P2P
      openQRShare();
    }
  };

  // Partage natif (mobile)
  const shareNative = async () => {
    if (!pdfBlob || !navigator.share) return;
    const file = new File([pdfBlob], getFileName(), { type: 'application/pdf' });
    try {
      await navigator.share({ title: 'Charting Parodontal', files: [file] });
    } catch (e) {
      console.error('Share failed:', e);
    }
  };

  // Créer un brouillon Gmail avec pièce jointe et ouvrir Gmail
  const shareViaGmail = async () => {
    if (!pdfBlob) {
      setGmailError('PDF non disponible. Veuillez réessayer.');
      return;
    }

    if (!window.google?.accounts?.oauth2) {
      setGmailError('Service Gmail non disponible. Veuillez rafraîchir la page.');
      return;
    }

    setGmailLoading(true);
    setGmailError(null);

    try {
      const tokenClient = window.google.accounts.oauth2.initTokenClient({
        client_id: GMAIL_CLIENT_ID,
        scope: GMAIL_SCOPES,
        callback: async (tokenResponse) => {
          if (tokenResponse.error) {
            setGmailError('Authentification annulée');
            setGmailLoading(false);
            return;
          }

          try {
            const result = await createGmailDraft(tokenResponse.access_token);
            setGmailLoading(false);
            setShowShareModal(false);
            setShowGmailForm(false);
            setGmailRecipient('');

            // Ouvrir Gmail avec le brouillon prêt à envoyer
            const gmailUrl = `https://mail.google.com/mail/u/0/#drafts?compose=${result.message.id}`;
            window.open(gmailUrl, '_blank');
          } catch (err) {
            console.error('Gmail draft error:', err);
            setGmailError('Erreur lors de la création du brouillon: ' + err.message);
            setGmailLoading(false);
          }
        }
      });

      tokenClient.requestAccessToken();
    } catch (err) {
      console.error('Gmail OAuth error:', err);
      setGmailError('Erreur d\'authentification Gmail');
      setGmailLoading(false);
    }
  };

  const createGmailDraft = async (accessToken) => {
    const subject = `Charting Parodontal - ${getPatientName()}`;
    const toEmail = gmailRecipient || '';
    const body = `Bonjour,

Veuillez trouver ci-joint le charting parodontal de ${getPatientName()}.

Cordialement`;

    // Convert blob to base64
    const arrayBuffer = await pdfBlob.arrayBuffer();
    const base64Pdf = btoa(
      new Uint8Array(arrayBuffer).reduce((data, byte) => data + String.fromCharCode(byte), '')
    );

    // Create MIME message
    const boundary = 'boundary_' + Date.now();
    const mimeLines = [
      'MIME-Version: 1.0',
      `Subject: =?UTF-8?B?${btoa(unescape(encodeURIComponent(subject)))}?=`,
      `Content-Type: multipart/mixed; boundary="${boundary}"`,
    ];

    // Add To header only if recipient is specified
    if (toEmail) {
      mimeLines.splice(1, 0, `To: ${toEmail}`);
    }

    const mimeMessage = [
      ...mimeLines,
      '',
      `--${boundary}`,
      'Content-Type: text/plain; charset=UTF-8',
      'Content-Transfer-Encoding: 7bit',
      '',
      body,
      '',
      `--${boundary}`,
      `Content-Type: application/pdf; name="${getFileName()}"`,
      'Content-Transfer-Encoding: base64',
      `Content-Disposition: attachment; filename="${getFileName()}"`,
      '',
      base64Pdf,
      '',
      `--${boundary}--`
    ].join('\r\n');

    // Encode for Gmail API
    const encodedMessage = btoa(unescape(encodeURIComponent(mimeMessage)))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

    // Create draft via Gmail API
    const response = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/drafts', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message: {
          raw: encodedMessage
        }
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Erreur Gmail API');
    }

    return response.json();
  };

  // Ouvrir la modal de partage
  const handleShare = () => {
    // Créer le blob à partir du dataUrl si nécessaire
    if (pdfDataUrl && !pdfBlob) {
      fetch(pdfDataUrl)
        .then(res => res.blob())
        .then(blob => setPdfBlob(blob))
        .catch(err => console.error('Error creating blob:', err));
    }
    setShowShareModal(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-sky-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              {/* HelloParo Logo SVG */}
              <svg width="120" height="50" viewBox="0 0 180 70" className="flex-shrink-0">
                <defs>
                  {/* Gradient for probing line */}
                  <linearGradient id="probingGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#10B981" />
                    <stop offset="100%" stopColor="#0EA5E9" />
                  </linearGradient>
                  {/* Shadow filter */}
                  <filter id="toothShadow" x="-20%" y="-20%" width="140%" height="140%">
                    <feDropShadow dx="0" dy="1" stdDeviation="1" floodOpacity="0.15" />
                  </filter>
                </defs>

                {/* Three stylized teeth */}
                <g filter="url(#toothShadow)">
                  {/* Left tooth */}
                  <path d="M30 8 C25 8 22 12 22 18 L22 35 C22 42 25 46 28 46 C30 46 31 44 31 44 C31 44 32 46 34 46 C37 46 40 42 40 35 L40 18 C40 12 37 8 32 8 Z"
                        fill="white" stroke="#004B63" strokeWidth="2" />
                  {/* Center tooth (slightly larger) */}
                  <path d="M55 5 C49 5 45 10 45 17 L45 38 C45 46 49 51 53 51 C55 51 56 49 57 49 C58 49 59 51 61 51 C65 51 69 46 69 38 L69 17 C69 10 65 5 59 5 Z"
                        fill="white" stroke="#004B63" strokeWidth="2" />
                  {/* Right tooth */}
                  <path d="M84 8 C79 8 76 12 76 18 L76 35 C76 42 79 46 82 46 C84 46 85 44 85 44 C85 44 86 46 88 46 C91 46 94 42 94 35 L94 18 C94 12 91 8 86 8 Z"
                        fill="white" stroke="#004B63" strokeWidth="2" />
                </g>

                {/* Wavy probing line (smile shape) */}
                <path d="M18 52 Q31 56 45 54 Q57 52 69 55 Q82 58 98 53"
                      fill="none" stroke="url(#probingGradient)" strokeWidth="3" strokeLinecap="round" />

                {/* Colored dots on probing line */}
                <circle cx="25" cy="54" r="2.5" fill="#10B981" />
                <circle cx="45" cy="53" r="2.5" fill="#22C55E" />
                <circle cx="57" cy="53.5" r="2.5" fill="#06B6D4" />
                <circle cx="69" cy="55" r="2.5" fill="#0EA5E9" />
                <circle cx="88" cy="54" r="2.5" fill="#0EA5E9" />

                {/* Typography */}
                <text x="115" y="28" fontFamily="Inter, Montserrat, sans-serif" fontSize="16" fontWeight="300" fill="#004B63">Hello</text>
                <text x="115" y="48" fontFamily="Inter, Montserrat, sans-serif" fontSize="18" fontWeight="700" letterSpacing="3" fill="#004B63">PARO</text>
              </svg>
              <div>
                <p className="text-xs text-slate-500">
                  {contextInfo.centreNom || 'Charting Parodontal'} - Examen parodontal complet
                </p>
              </div>
            </div>

            {/* Praticien Info */}
            {contextInfo.praticienNom && (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-sky-50 rounded-lg border border-sky-200">
                <svg className="w-4 h-4 text-sky-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <span className="text-sm font-medium text-sky-800">{contextInfo.praticienNom}</span>
              </div>
            )}

            {/* Patient Info */}
            <div className="flex items-center gap-3 flex-wrap">
              <input
                type="text"
                placeholder="Nom du patient"
                value={patientInfo.name}
                onChange={(e) => setPatientInfo({ ...patientInfo, name: e.target.value })}
                className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-sky-500 focus:border-transparent w-36"
              />
              <input
                type="text"
                placeholder="Prénom"
                value={patientInfo.firstName}
                onChange={(e) => setPatientInfo({ ...patientInfo, firstName: e.target.value })}
                className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-sky-500 focus:border-transparent w-32"
              />
              <input
                type="date"
                value={patientInfo.date}
                onChange={(e) => setPatientInfo({ ...patientInfo, date: e.target.value })}
                className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-sky-500 focus:border-transparent"
              />
              <input
                type="text"
                placeholder="Examinateur"
                value={patientInfo.examiner}
                onChange={(e) => setPatientInfo({ ...patientInfo, examiner: e.target.value })}
                className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-sky-500 focus:border-transparent w-44"
              />
            </div>
            
            {/* Actions */}
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={generatePdf}
                disabled={isGeneratingPdf}
                className="px-3 py-2 bg-emerald-500 text-white rounded-lg text-sm font-medium hover:bg-emerald-600 transition-colors shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
              >
                {isGeneratingPdf ? (
                  <>
                    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Génération...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                    PDF Charting
                  </>
                )}
              </button>
              <button
                onClick={() => diagnosticRef.current?.generatePdf()}
                className="px-3 py-2 bg-blue-500 text-white rounded-lg text-sm font-medium hover:bg-blue-600 transition-colors shadow-md flex items-center gap-1"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                PDF Diagnostic
              </button>
              <button
                onClick={fillRandomData}
                className="px-3 py-2 bg-purple-100 text-purple-700 rounded-lg text-sm font-medium hover:bg-purple-200 transition-colors"
              >
                Test
              </button>
              <button
                onClick={resetChart}
                className="px-3 py-2 bg-red-100 text-red-700 rounded-lg text-sm font-medium hover:bg-red-200 transition-colors"
              >
                Réinitialiser
              </button>
            </div>
          </div>
        </div>
      </header>
      
      {/* Stats Bar */}
      <div className="bg-white border-b border-slate-200 py-3">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center gap-6 flex-wrap">
            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-500">Dents présentes:</span>
              <span className="font-bold text-slate-800">{stats.totalTeeth}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-500">Sites:</span>
              <span className="font-bold text-slate-800">{stats.totalSites}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-500">Indice de saignement:</span>
              <span className={`font-bold ${stats.bop > 30 ? 'text-red-600' : stats.bop > 10 ? 'text-amber-600' : 'text-green-600'}`}>
                {stats.bop}%
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-500">Indice de plaque:</span>
              <span className={`font-bold ${stats.plaqueIndex > 30 ? 'text-amber-600' : 'text-green-600'}`}>
                {stats.plaqueIndex}%
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-500">Poches ≥5mm:</span>
              <span className="font-bold text-red-600">{stats.deepPockets}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-500">Poches 4mm:</span>
              <span className="font-bold text-amber-600">{stats.moderatePockets}</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* View Toggle */}
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex items-center gap-2 mb-4">
          <button
            onClick={() => setActiveView('chart')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeView === 'chart' 
                ? 'bg-sky-500 text-white shadow-md' 
                : 'bg-white text-slate-600 hover:bg-slate-100'
            }`}
          >
            Vue graphique
          </button>
          <button
            onClick={() => setActiveView('data')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeView === 'data'
                ? 'bg-sky-500 text-white shadow-md'
                : 'bg-white text-slate-600 hover:bg-slate-100'
            }`}
          >
            Vue tableau
          </button>
          <button
            onClick={() => setActiveView('diagnostic')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeView === 'diagnostic'
                ? 'bg-purple-500 text-white shadow-md'
                : 'bg-white text-slate-600 hover:bg-slate-100'
            }`}
          >
            Diagnostic
          </button>
          <button
            onClick={() => setActiveView('radio')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeView === 'radio'
                ? 'bg-teal-500 text-white shadow-md'
                : 'bg-white text-slate-600 hover:bg-slate-100'
            }`}
          >
            Radiographies
          </button>
          <button
            onClick={() => setActiveView('photos')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeView === 'photos'
                ? 'bg-indigo-500 text-white shadow-md'
                : 'bg-white text-slate-600 hover:bg-slate-100'
            }`}
          >
            Photographies
          </button>
          <button
            onClick={() => setActiveView('fichePatient')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeView === 'fichePatient'
                ? 'bg-cyan-500 text-white shadow-md'
                : 'bg-white text-slate-600 hover:bg-slate-100'
            }`}
          >
            Fiche Patient
          </button>
        </div>
        
        {activeView === 'chart' ? (
          <div className="flex gap-6">
            {/* Zone principale - Arcades dentaires */}
            <div ref={chartRef} className={`space-y-6 ${selectedTooth ? 'flex-1' : 'w-full'}`}>
              {/* Bouton Analyse Panoramique */}
              <div className="flex justify-end">
                <button
                  onClick={() => setShowPanoModal(true)}
                  className="px-4 py-2.5 bg-gradient-to-r from-violet-500 to-purple-600 text-white rounded-xl font-medium hover:from-violet-600 hover:to-purple-700 transition-all shadow-lg flex items-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  Mettre a jour le schema a partir d'une panoramique
                </button>
              </div>

              {/* Arcade supérieure */}
              <div className="bg-white rounded-2xl shadow-lg p-6 border border-slate-200">
                <h2 className="text-lg font-semibold text-slate-800 mb-4">Arcade Maxillaire</h2>

                {/* Graphique Vestibulaire */}
                <div className="mb-4">
                  <h3 className="text-sm font-medium text-slate-600 mb-2">Vestibulaire</h3>
                  <PerioGraph teeth={TEETH_UPPER} teethData={teethData} isUpper={true} side="buccal" />
                </div>

                {/* Dents */}
                <div className="flex justify-center gap-1 my-4 overflow-x-auto pb-2">
                  {TEETH_UPPER.map(tooth => (
                    <div key={tooth} className="flex flex-col items-center">
                      <ToothSVG
                        toothNumber={tooth}
                        isUpper={true}
                        data={teethData[tooth]}
                        isSelected={selectedTooth === tooth}
                        onClick={() => setSelectedTooth(selectedTooth === tooth ? null : tooth)}
                      />
                      <span className={`text-xs font-medium mt-1 ${teethData[tooth].missing ? 'text-slate-400' : 'text-slate-700'}`}>
                        {tooth}
                      </span>
                      {teethData[tooth].mobility > 0 && (
                        <span className="text-xs bg-amber-100 text-amber-700 px-1.5 rounded">
                          M{teethData[tooth].mobility}
                        </span>
                      )}
                    </div>
                  ))}
                </div>

                {/* Graphique Palatin */}
                <div className="mt-4">
                  <h3 className="text-sm font-medium text-slate-600 mb-2">Palatin</h3>
                  <PerioGraph teeth={TEETH_UPPER} teethData={teethData} isUpper={true} side="lingual" />
                </div>
              </div>

              {/* Arcade inférieure */}
              <div className="bg-white rounded-2xl shadow-lg p-6 border border-slate-200">
                <h2 className="text-lg font-semibold text-slate-800 mb-4">Arcade Mandibulaire</h2>

                {/* Graphique Lingual */}
                <div className="mb-4">
                  <h3 className="text-sm font-medium text-slate-600 mb-2">Lingual</h3>
                  <PerioGraph teeth={TEETH_LOWER} teethData={teethData} isUpper={false} side="lingual" />
                </div>

                {/* Dents */}
                <div className="flex justify-center gap-1 my-4 overflow-x-auto pb-2">
                  {TEETH_LOWER.map(tooth => (
                    <div key={tooth} className="flex flex-col items-center">
                      <ToothSVG
                        toothNumber={tooth}
                        isUpper={false}
                        data={teethData[tooth]}
                        isSelected={selectedTooth === tooth}
                        onClick={() => setSelectedTooth(selectedTooth === tooth ? null : tooth)}
                      />
                      <span className={`text-xs font-medium mt-1 ${teethData[tooth].missing ? 'text-slate-400' : 'text-slate-700'}`}>
                        {tooth}
                      </span>
                      {teethData[tooth].mobility > 0 && (
                        <span className="text-xs bg-amber-100 text-amber-700 px-1.5 rounded">
                          M{teethData[tooth].mobility}
                        </span>
                      )}
                    </div>
                  ))}
                </div>

                {/* Graphique Vestibulaire */}
                <div className="mt-4">
                  <h3 className="text-sm font-medium text-slate-600 mb-2">Vestibulaire</h3>
                  <PerioGraph teeth={TEETH_LOWER} teethData={teethData} isUpper={false} side="buccal" />
                </div>
              </div>
            </div>

            {/* Panneau latéral - Détail de la dent sélectionnée */}
            {selectedTooth && (
              <div className="w-80 flex-shrink-0">
                <div className="bg-white rounded-2xl shadow-lg p-5 border border-slate-200 sticky top-24">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-slate-800">
                      Dent {selectedTooth}
                    </h2>
                    <button
                      onClick={() => setSelectedTooth(null)}
                      className="text-slate-400 hover:text-slate-600 transition-colors"
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>

                  {/* Contrôles de statut */}
                  <div className="space-y-4 mb-4">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => toggleMissing(selectedTooth)}
                        className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                          teethData[selectedTooth].missing
                            ? 'bg-red-500 text-white'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        Absente
                      </button>
                      <button
                        onClick={() => toggleImplant(selectedTooth)}
                        className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                          teethData[selectedTooth].implant
                            ? 'bg-indigo-500 text-white'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        Implant
                      </button>
                    </div>

                    <MobilitySelector
                      value={teethData[selectedTooth].mobility}
                      onChange={(val) => updateMobility(selectedTooth, val)}
                    />

                    {FURCATION_TEETH.includes(selectedTooth) && (
                      <FurcationSelector
                        value={teethData[selectedTooth].furcation}
                        onChange={(pos, val) => updateFurcation(selectedTooth, pos, val)}
                        positions={['buccal', 'lingual', 'mesial', 'distal']}
                      />
                    )}
                  </div>

                  {/* Sondage détaillé */}
                  <ToothDetailInputs
                    selectedTooth={selectedTooth}
                    teethData={teethData}
                    updateToothData={updateToothData}
                    isUpperTooth={TEETH_UPPER.includes(selectedTooth)}
                  />
                </div>
              </div>
            )}
          </div>
        ) : activeView === 'data' ? (
          /* Vue tableau */
          <div className="space-y-6">
            {/* Arcade supérieure */}
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-slate-200 overflow-x-auto">
              <h2 className="text-lg font-semibold text-slate-800 mb-4">Arcade Maxillaire</h2>
              <DataGrid
                teeth={TEETH_UPPER}
                teethData={teethData}
                surface="buccal"
                onUpdate={updateToothData}
                isUpper={true}
                autoFocus={true}
              />
              <div className="my-4 border-t border-slate-200"></div>
              <DataGrid 
                teeth={TEETH_UPPER} 
                teethData={teethData} 
                surface="lingual" 
                onUpdate={updateToothData}
                isUpper={true}
              />
            </div>
            
            {/* Arcade inférieure */}
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-slate-200 overflow-x-auto">
              <h2 className="text-lg font-semibold text-slate-800 mb-4">Arcade Mandibulaire</h2>
              <DataGrid 
                teeth={TEETH_LOWER} 
                teethData={teethData} 
                surface="buccal" 
                onUpdate={updateToothData}
                isUpper={false}
              />
              <div className="my-4 border-t border-slate-200"></div>
              <DataGrid 
                teeth={TEETH_LOWER} 
                teethData={teethData} 
                surface="lingual" 
                onUpdate={updateToothData}
                isUpper={false}
              />
            </div>
          </div>
        ) : activeView === 'diagnostic' ? (
          /* Vue diagnostic */
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-slate-200">
            <DiagnosticParodontal
              ref={diagnosticRef}
              stats={stats}
              patientInfo={patientInfo}
              contextInfo={contextInfo}
              radiographs={radiographs}
              photos={photos}
              onPdfGenerated={(blobUrl, base64) => {
                setPdfDataUrl(blobUrl);
                setPdfBase64(base64);
                setShowPdfModal(true);
              }}
            />
          </div>
        ) : activeView === 'radio' ? (
          /* Vue radiographies */
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-slate-200">
            <h2 className="text-lg font-semibold text-slate-800 mb-4">Radiographies</h2>

            {/* Boutons d'ajout */}
            <div className="mb-6">
              <div className="flex flex-wrap gap-3 mb-2">
              <button
                onClick={async () => {
                  setIsCapturing(true);
                  try {
                    const stream = await navigator.mediaDevices.getDisplayMedia({
                      video: { mediaSource: 'screen' }
                    });
                    const video = document.createElement('video');
                    video.srcObject = stream;
                    await video.play();

                    const canvas = document.createElement('canvas');
                    canvas.width = video.videoWidth;
                    canvas.height = video.videoHeight;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(video, 0, 0);

                    stream.getTracks().forEach(track => track.stop());

                    const imageData = canvas.toDataURL('image/png');
                    const newRadio = {
                      id: Date.now(),
                      data: imageData,
                      name: `Radiographie ${radiographs.length + 1}`,
                      date: new Date().toLocaleDateString('fr-FR')
                    };
                    setRadiographs(prev => [...prev, newRadio]);
                  } catch (err) {
                    if (err.name !== 'AbortError') {
                      console.error('Erreur de capture:', err);
                      alert('Erreur lors de la capture d\'écran');
                    }
                  } finally {
                    setIsCapturing(false);
                  }
                }}
                disabled={isCapturing}
                className="px-4 py-3 bg-teal-500 text-white rounded-lg font-medium hover:bg-teal-600 transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                {isCapturing ? (
                  <>
                    <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Capture en cours...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    Capturer une radiographie
                  </>
                )}
              </button>

              {/* Bouton d'import local */}
              <label className="px-4 py-3 bg-slate-500 text-white rounded-lg font-medium hover:bg-slate-600 transition-colors flex items-center gap-2 cursor-pointer inline-flex">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
                Importer depuis l'appareil
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={(e) => {
                    const files = Array.from(e.target.files);
                    files.forEach((file, idx) => {
                      const reader = new FileReader();
                      reader.onload = (event) => {
                        const newRadio = {
                          id: Date.now() + idx,
                          data: event.target.result,
                          name: file.name.replace(/\.[^/.]+$/, '') || `Radiographie ${radiographs.length + idx + 1}`,
                          date: new Date().toLocaleDateString('fr-FR')
                        };
                        setRadiographs(prev => [...prev, newRadio]);
                      };
                      reader.readAsDataURL(file);
                    });
                    e.target.value = '';
                  }}
                />
              </label>
              </div>

              <p className="text-xs text-slate-500">
                Capturez une fenêtre ou importez des images depuis votre appareil
              </p>
            </div>

            {/* Grille des radiographies */}
            {radiographs.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {radiographs.map((radio, index) => (
                  <div key={radio.id} className="relative group">
                    <div className="aspect-square bg-slate-100 rounded-lg overflow-hidden border border-slate-200">
                      <img
                        src={radio.data}
                        alt={radio.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="mt-2">
                      <input
                        type="text"
                        value={radio.name}
                        onChange={(e) => {
                          const updated = [...radiographs];
                          updated[index].name = e.target.value;
                          setRadiographs(updated);
                        }}
                        className="w-full text-sm font-medium text-slate-700 bg-transparent border-b border-transparent hover:border-slate-300 focus:border-sky-500 focus:outline-none px-1"
                      />
                      <p className="text-xs text-slate-500 px-1">{radio.date}</p>
                    </div>
                    <button
                      onClick={() => {
                        if (confirm('Supprimer cette radiographie ?')) {
                          setRadiographs(prev => prev.filter(r => r.id !== radio.id));
                        }
                      }}
                      className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-slate-500">
                <svg className="w-16 h-16 mx-auto mb-4 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <p className="font-medium">Aucune radiographie</p>
                <p className="text-sm">Utilisez le bouton ci-dessus pour capturer une radiographie</p>
              </div>
            )}
          </div>
        ) : activeView === 'photos' ? (
          /* Vue photographies */
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-slate-200">
            <h2 className="text-lg font-semibold text-slate-800 mb-4">Photographies</h2>

            {/* Section QR Code */}
            <div className="mb-6 p-6 bg-indigo-50 rounded-xl border border-indigo-200">
              <div className="flex flex-col md:flex-row items-center gap-6">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-indigo-900 mb-2">
                    Ajouter une photo depuis votre téléphone
                  </h3>
                  <p className="text-sm text-indigo-700 mb-4">
                    Scannez le QR code avec votre téléphone pour prendre une photo qui sera automatiquement ajoutée au dossier patient.
                  </p>

                  {peerStatus === 'idle' && (
                    <button
                      onClick={async () => {
                        setPeerStatus('waiting');

                        // Create peer
                        const peer = new Peer();
                        peerRef.current = peer;

                        peer.on('open', async (id) => {
                          // Generate QR code with URL
                          const url = `https://charting.cemedis.app/?photo=1&peer=${id}`;
                          const qrDataUrl = await QRCode.toDataURL(url, {
                            width: 200,
                            margin: 2,
                            color: { dark: '#4f46e5', light: '#ffffff' }
                          });
                          setQrCodeUrl(qrDataUrl);
                        });

                        peer.on('connection', (conn) => {
                          connRef.current = conn;
                          setPeerStatus('connected');

                          conn.on('data', (data) => {
                            if (data.type === 'photo') {
                              const newPhoto = {
                                id: Date.now(),
                                data: data.data,
                                name: `Photo ${photos.length + 1}`,
                                date: new Date().toLocaleDateString('fr-FR')
                              };
                              setPhotos(prev => [...prev, newPhoto]);
                            }
                          });

                          conn.on('close', () => {
                            setPeerStatus('waiting');
                          });
                        });

                        peer.on('error', (err) => {
                          console.error('Peer error:', err);
                          setPeerStatus('idle');
                          setQrCodeUrl(null);
                        });
                      }}
                      className="px-4 py-3 bg-indigo-500 text-white rounded-lg font-medium hover:bg-indigo-600 transition-colors flex items-center gap-2"
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      Générer un QR Code
                    </button>
                  )}

                  {peerStatus === 'waiting' && (
                    <div className="flex items-center gap-2 text-indigo-600">
                      <svg className="animate-pulse w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <circle cx="12" cy="12" r="10" />
                      </svg>
                      <span className="font-medium">En attente de connexion...</span>
                    </div>
                  )}

                  {peerStatus === 'connected' && (
                    <div className="flex items-center gap-2 text-green-600">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="font-medium">Téléphone connecté !</span>
                    </div>
                  )}

                  {(peerStatus === 'waiting' || peerStatus === 'connected') && (
                    <button
                      onClick={() => {
                        if (connRef.current) connRef.current.close();
                        if (peerRef.current) peerRef.current.destroy();
                        setPeerStatus('idle');
                        setQrCodeUrl(null);
                      }}
                      className="mt-3 px-3 py-1.5 text-sm text-indigo-600 hover:text-indigo-800 transition-colors"
                    >
                      Fermer la connexion
                    </button>
                  )}
                </div>

                {/* QR Code display */}
                {qrCodeUrl && (
                  <div className="flex flex-col items-center">
                    <div className="bg-white p-3 rounded-xl shadow-md">
                      <img src={qrCodeUrl} alt="QR Code" className="w-48 h-48" />
                    </div>
                    <p className="text-xs text-indigo-600 mt-2 text-center">
                      Scannez avec votre téléphone
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Section import local */}
            <div className="mb-6 p-4 bg-slate-50 rounded-xl border border-slate-200">
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-slate-700 mb-1">
                    Importer depuis votre appareil
                  </h3>
                  <p className="text-xs text-slate-500">
                    Sélectionnez des photos depuis votre ordinateur ou appareil
                  </p>
                </div>
                <label className="px-4 py-2.5 bg-slate-600 text-white rounded-lg font-medium hover:bg-slate-700 transition-colors flex items-center gap-2 cursor-pointer">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                  </svg>
                  Choisir des photos
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={(e) => {
                      const files = Array.from(e.target.files);
                      files.forEach((file, idx) => {
                        const reader = new FileReader();
                        reader.onload = (event) => {
                          const newPhoto = {
                            id: Date.now() + idx,
                            data: event.target.result,
                            name: file.name.replace(/\.[^/.]+$/, '') || `Photo ${photos.length + idx + 1}`,
                            date: new Date().toLocaleDateString('fr-FR')
                          };
                          setPhotos(prev => [...prev, newPhoto]);
                        };
                        reader.readAsDataURL(file);
                      });
                      e.target.value = '';
                    }}
                  />
                </label>
              </div>
            </div>

            {/* Grille des photos */}
            {photos.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {photos.map((photo, index) => (
                  <div key={photo.id} className="relative group">
                    <div className="aspect-square bg-slate-100 rounded-lg overflow-hidden border border-slate-200">
                      <img
                        src={photo.data}
                        alt={photo.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="mt-2">
                      <input
                        type="text"
                        value={photo.name}
                        onChange={(e) => {
                          const updated = [...photos];
                          updated[index].name = e.target.value;
                          setPhotos(updated);
                        }}
                        className="w-full text-sm font-medium text-slate-700 bg-transparent border-b border-transparent hover:border-slate-300 focus:border-indigo-500 focus:outline-none px-1"
                      />
                      <p className="text-xs text-slate-500 px-1">{photo.date}</p>
                    </div>
                    <button
                      onClick={() => {
                        if (confirm('Supprimer cette photo ?')) {
                          setPhotos(prev => prev.filter(p => p.id !== photo.id));
                        }
                      }}
                      className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-slate-500">
                <svg className="w-16 h-16 mx-auto mb-4 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <p className="font-medium">Aucune photo</p>
                <p className="text-sm">Générez un QR code ci-dessus pour ajouter des photos depuis votre téléphone</p>
              </div>
            )}
          </div>
        ) : activeView === 'fichePatient' ? (
          /* Vue Fiche Patient */
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-slate-200">
            <FichePatient patientInfo={patientInfo} contextInfo={contextInfo} />
          </div>
        ) : null}

        {/* Légende */}
        <div className="mt-6 bg-white rounded-2xl shadow-lg p-6 border border-slate-200">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">Légende</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-blue-500"></div>
              <span className="text-sm text-slate-600">Profondeur de sondage</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-red-500"></div>
              <span className="text-sm text-slate-600">Récession / Saignement</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-amber-500"></div>
              <span className="text-sm text-slate-600">Plaque / Poches 4mm</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-purple-500"></div>
              <span className="text-sm text-slate-600">Suppuration</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm">○ ◔ ◑ ●</span>
              <span className="text-sm text-slate-600">Furcation (0-3)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">M0-M3</span>
              <span className="text-sm text-slate-600">Mobilité</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-1 bg-amber-400"></div>
              <span className="text-sm text-slate-600">Seuil 3mm</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-1 bg-red-400"></div>
              <span className="text-sm text-slate-600">Seuil 5mm</span>
            </div>
          </div>
        </div>
      </div>

      {/* Modal PDF Viewer */}
      {showPdfModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col">
            {/* Header de la modal */}
            <div className="flex items-center justify-between p-4 border-b border-slate-200">
              <h3 className="text-lg font-semibold text-slate-800">Aperçu du PDF</h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={downloadPdf}
                  className="px-4 py-2 bg-emerald-500 text-white rounded-lg text-sm font-medium hover:bg-emerald-600 transition-colors flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Télécharger
                </button>
                <button
                  onClick={printPdf}
                  className="px-4 py-2 bg-sky-500 text-white rounded-lg text-sm font-medium hover:bg-sky-600 transition-colors flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                  </svg>
                  Imprimer
                </button>
                <button
                  onClick={sendToVeasy}
                  disabled={isSendingToVeasy}
                  className="px-4 py-2 bg-violet-500 text-white rounded-lg text-sm font-medium hover:bg-violet-600 transition-colors flex items-center gap-2 disabled:opacity-50"
                >
                  {isSendingToVeasy ? (
                    <>
                      <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Envoi...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                      Import Veasy
                    </>
                  )}
                </button>
                <button
                  onClick={handleShare}
                  className="px-4 py-2 bg-amber-500 text-white rounded-lg text-sm font-medium hover:bg-amber-600 transition-colors flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                  </svg>
                  Partager
                </button>
                <button
                  onClick={() => setShowPdfModal(false)}
                  className="p-2 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Contenu - PDF Viewer */}
            <div className="flex-1 overflow-auto p-4 bg-slate-100">
              {pdfDataUrl && (
                <iframe
                  src={pdfDataUrl}
                  className="w-full h-full min-h-[70vh] rounded-lg border border-slate-300"
                  title="Aperçu PDF"
                />
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal de partage */}
      {showShareModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-amber-50">
              <h3 className="text-lg font-semibold text-slate-800">Partager le PDF</h3>
              <button
                onClick={() => {
                  setShowShareModal(false);
                  setShowGmailForm(false);
                  setGmailError(null);
                }}
                className="p-2 text-slate-400 hover:text-slate-600 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Contenu */}
            <div className="p-6">
              {gmailError && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm text-center">
                  {gmailError}
                </div>
              )}

              <div className="space-y-3">
                {/* Gmail - Crée un brouillon avec pièce jointe */}
                <button
                  onClick={shareViaGmail}
                  disabled={gmailLoading}
                  className="w-full flex items-center gap-3 px-4 py-3 bg-red-50 hover:bg-red-100 rounded-lg transition-colors disabled:opacity-50"
                >
                  <div className="w-10 h-10 bg-gradient-to-br from-red-500 via-yellow-500 to-green-500 rounded-full flex items-center justify-center">
                    {gmailLoading ? (
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M24 5.457v13.909c0 .904-.732 1.636-1.636 1.636h-3.819V11.73L12 16.64l-6.545-4.91v9.273H1.636A1.636 1.636 0 0 1 0 19.366V5.457c0-2.023 2.309-3.178 3.927-1.964L5.455 4.64 12 9.548l6.545-4.91 1.528-1.145C21.69 2.28 24 3.434 24 5.457z"/>
                      </svg>
                    )}
                  </div>
                  <div className="flex-1 text-left">
                    <span className="text-red-700 font-medium block">Ouvrir dans Gmail</span>
                    <span className="text-red-500 text-xs">Brouillon avec PDF joint, prêt à envoyer</span>
                  </div>
                </button>

                {/* Email classique - mailto */}
                <button
                  onClick={shareViaEmail}
                  className="w-full flex items-center gap-3 px-4 py-3 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                >
                  <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div className="flex-1 text-left">
                    <span className="text-blue-700 font-medium block">Autre client email</span>
                    <span className="text-blue-500 text-xs">Ouvre votre app email (sans PJ)</span>
                  </div>
                </button>

                {/* WhatsApp */}
                <button
                  onClick={shareViaWhatsApp}
                  className="w-full flex items-center gap-3 px-4 py-3 bg-green-50 hover:bg-green-100 rounded-lg transition-colors"
                >
                  <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                    </svg>
                  </div>
                  <div className="flex-1 text-left">
                    <span className="text-green-700 font-medium block">WhatsApp</span>
                    <span className="text-green-500 text-xs">
                      {isMobile()
                        ? (canShareFiles() ? 'Avec fichier PDF' : 'Message texte')
                        : 'Scanner le QR code avec votre téléphone'}
                    </span>
                  </div>
                </button>

                {/* Partage natif (mobile) */}
                {typeof navigator !== 'undefined' && navigator.share && (
                  <button
                    onClick={shareNative}
                    className="w-full flex items-center gap-3 px-4 py-3 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors"
                  >
                    <div className="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center">
                      <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                      </svg>
                    </div>
                    <div className="flex-1 text-left">
                      <span className="text-purple-700 font-medium block">Autres options</span>
                      <span className="text-purple-500 text-xs">Partage système avec fichier</span>
                    </div>
                  </button>
                )}
              </div>

              <button
                onClick={() => {
                  setShowShareModal(false);
                  setShowGmailForm(false);
                  setGmailError(null);
                }}
                className="w-full mt-6 px-4 py-2 text-slate-500 hover:text-slate-700 transition-colors"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal QR Code P2P Share */}
      {showQRShare && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[70] p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            {/* Header */}
            <div className="bg-green-500 text-white px-6 py-4 flex items-center justify-between">
              <h3 className="font-semibold text-lg">Partager via WhatsApp</h3>
              <button onClick={closeQRShare} className="hover:bg-white/20 rounded-lg p-1 transition-colors">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Contenu */}
            <div className="p-6">
              {qrPeerStatus === 'connecting' && (
                <div className="text-center py-8">
                  <div className="animate-spin w-12 h-12 border-4 border-green-200 border-t-green-500 rounded-full mx-auto mb-4"></div>
                  <p className="text-green-600 font-medium">Connexion en cours...</p>
                </div>
              )}

              {qrPeerStatus === 'waiting' && qrPeerId && (
                <div className="text-center">
                  <div className="bg-white p-4 rounded-xl inline-block mb-4 shadow-lg border border-gray-100">
                    <QRCodeSVG
                      value={`${PDF_SHARE_URL}?pdf=1&peer=${qrPeerId}`}
                      size={200}
                      level="M"
                      includeMargin={true}
                    />
                  </div>
                  <p className="text-green-700 font-medium mb-2">
                    Scannez avec votre téléphone
                  </p>
                  <p className="text-sm text-gray-500 mb-4">
                    Le PDF sera transféré sur votre mobile pour le partager via WhatsApp
                  </p>
                  <div className="flex items-center justify-center gap-2 text-amber-600 text-sm">
                    <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse"></div>
                    En attente de connexion...
                  </div>
                </div>
              )}

              {qrPeerStatus === 'connected' && (
                <div className="text-center py-4">
                  {qrTransferStatus === 'sending' && (
                    <>
                      <div className="animate-spin w-12 h-12 border-4 border-green-200 border-t-green-500 rounded-full mx-auto mb-4"></div>
                      <p className="text-green-700 font-medium">Transfert du PDF en cours...</p>
                    </>
                  )}
                  {qrTransferStatus === 'sent' && (
                    <>
                      <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <p className="text-green-700 font-medium mb-2">PDF transféré avec succès !</p>
                      <p className="text-sm text-gray-500">Partagez-le maintenant depuis votre téléphone</p>
                    </>
                  )}
                  {qrTransferStatus === 'error' && (
                    <>
                      <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </div>
                      <p className="text-red-700 font-medium">Erreur lors du transfert</p>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 bg-gray-50 flex justify-end">
              <button
                onClick={closeQRShare}
                className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Analyse Panoramique */}
      {showPanoModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-gradient-to-r from-violet-500 to-purple-600">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                Analyse IA de panoramique
              </h3>
              <button
                onClick={() => {
                  setShowPanoModal(false);
                  setPanoImage(null);
                  setPanoResult(null);
                  setPanoError(null);
                }}
                className="text-white hover:text-slate-200 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {!panoImage ? (
                /* Step 1: Import or Capture */
                <div className="space-y-6">
                  <p className="text-slate-600 text-center">
                    Importez une radiographie panoramique ou capturez-en une depuis votre ecran pour mettre a jour automatiquement le schema dentaire.
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Import option */}
                    <label className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-violet-300 rounded-2xl bg-violet-50 hover:bg-violet-100 cursor-pointer transition-colors">
                      <svg className="w-16 h-16 text-violet-500 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                      </svg>
                      <span className="text-lg font-semibold text-violet-800 mb-1">Importer une radio</span>
                      <span className="text-sm text-violet-600">Cliquez pour selectionner un fichier</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handlePanoFileImport}
                      />
                    </label>

                    {/* Capture option */}
                    <button
                      onClick={handlePanoCapture}
                      className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-purple-300 rounded-2xl bg-purple-50 hover:bg-purple-100 transition-colors"
                    >
                      <svg className="w-16 h-16 text-purple-500 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <span className="text-lg font-semibold text-purple-800 mb-1">Capture d'ecran</span>
                      <span className="text-sm text-purple-600">Capturez depuis votre ecran</span>
                    </button>
                  </div>
                </div>
              ) : (
                /* Step 2: Image loaded - Analyze */
                <div className="space-y-6">
                  {/* Image preview with animation overlay */}
                  <div className="relative rounded-xl overflow-hidden border border-slate-200">
                    <img
                      src={panoImage}
                      alt="Panoramique"
                      className={`w-full h-auto max-h-[400px] object-contain bg-black ${panoAnalyzing ? 'opacity-50' : ''}`}
                    />

                    {/* Analyzing animation overlay */}
                    {panoAnalyzing && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center bg-black bg-opacity-50">
                        <div className="relative">
                          {/* Scanning line animation */}
                          <div className="w-64 h-1 bg-violet-500 rounded-full animate-pulse mb-4"></div>
                          <div className="absolute inset-0 w-full h-full">
                            <div className="w-full h-1 bg-gradient-to-r from-transparent via-violet-400 to-transparent animate-[scan_2s_ease-in-out_infinite]"></div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 text-white">
                          <svg className="animate-spin h-8 w-8" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                          </svg>
                          <span className="text-lg font-medium">Analyse IA en cours...</span>
                        </div>
                        <p className="text-violet-200 text-sm mt-2">Detection des dents, implants et anomalies</p>
                      </div>
                    )}
                  </div>

                  {/* Error message */}
                  {panoError && (
                    <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700">
                      <p className="font-medium">Erreur lors de l'analyse</p>
                      <p className="text-sm">{panoError}</p>
                    </div>
                  )}

                  {/* Results */}
                  {panoResult && (
                    <div className="space-y-4">
                      {/* Alert if any */}
                      {panoResult.alerte && (
                        <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-800">
                          <p className="font-medium flex items-center gap-2">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                            {panoResult.alerte.message}
                          </p>
                        </div>
                      )}

                      {/* Statistics */}
                      <div className="bg-slate-50 rounded-xl p-4">
                        <h4 className="font-semibold text-slate-800 mb-3">Resultats de l'analyse</h4>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div className="text-center p-3 bg-white rounded-lg">
                            <div className="text-2xl font-bold text-green-600">{panoResult.resume?.dents_presentes || 0}</div>
                            <div className="text-xs text-slate-600">Dents présentes</div>
                          </div>
                          <div className="text-center p-3 bg-white rounded-lg">
                            <div className="text-2xl font-bold text-red-600">{panoResult.resume?.dents_absentes || 0}</div>
                            <div className="text-xs text-slate-600">Dents absentes</div>
                          </div>
                          <div className="text-center p-3 bg-white rounded-lg">
                            <div className="text-2xl font-bold text-blue-600">{panoResult.resume?.implants || 0}</div>
                            <div className="text-xs text-slate-600">Implants</div>
                          </div>
                          <div className="text-center p-3 bg-white rounded-lg">
                            <div className="text-2xl font-bold text-amber-600">{panoResult.resume?.taux_presence || '0%'}</div>
                            <div className="text-xs text-slate-600">Taux présence</div>
                          </div>
                        </div>

                        {/* Details */}
                        {panoResult.listes?.absentes?.length > 0 && (
                          <div className="mt-3 text-sm">
                            <span className="text-slate-600">Dents absentes: </span>
                            <span className="font-medium text-slate-800">{panoResult.listes.absentes.join(', ')}</span>
                          </div>
                        )}
                        {panoResult.listes?.implants?.length > 0 && (
                          <div className="mt-1 text-sm">
                            <span className="text-slate-600">Implants: </span>
                            <span className="font-medium text-slate-800">{panoResult.listes.implants.join(', ')}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-3 justify-end">
                    <button
                      onClick={() => {
                        setPanoImage(null);
                        setPanoResult(null);
                        setPanoError(null);
                      }}
                      className="px-4 py-2 text-slate-600 hover:text-slate-800 font-medium"
                    >
                      Changer d'image
                    </button>

                    {!panoResult ? (
                      <button
                        onClick={analyzePanorama}
                        disabled={panoAnalyzing}
                        className="px-6 py-2.5 bg-gradient-to-r from-violet-500 to-purple-600 text-white rounded-xl font-medium hover:from-violet-600 hover:to-purple-700 transition-all disabled:opacity-50 flex items-center gap-2"
                      >
                        {panoAnalyzing ? (
                          <>
                            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                            </svg>
                            Analyse en cours...
                          </>
                        ) : (
                          <>
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                            </svg>
                            Lancer l'analyse IA
                          </>
                        )}
                      </button>
                    ) : (
                      <button
                        onClick={applyPanoResult}
                        className="px-6 py-2.5 bg-green-500 text-white rounded-xl font-medium hover:bg-green-600 transition-all flex items-center gap-2"
                      >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Appliquer au schema
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="mt-8 py-6 bg-slate-800 text-center">
        <p className="text-slate-400 text-sm">
          HelloParo © {new Date().getFullYear()}
        </p>
      </footer>
    </div>
  );
}

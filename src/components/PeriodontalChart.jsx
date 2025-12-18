import React, { useState, useCallback, useEffect, useRef } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import DiagnosticParodontal from './DiagnosticParodontal';

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
        width="48" 
        height="75" 
        viewBox="0 0 48 75"
        onClick={onClick}
        style={{ 
          cursor: 'pointer',
          opacity: data.missing ? 0.3 : 1,
          filter: isSelected ? 'drop-shadow(0 0 6px #0ea5e9)' : 'drop-shadow(0 2px 3px rgba(0,0,0,0.1))'
        }}
      >
        <defs>
          <linearGradient id={`toothGrad-${toothNumber}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fefefe" />
            <stop offset="30%" stopColor="#f8f9fa" />
            <stop offset="100%" stopColor="#e9ecef" />
          </linearGradient>
          <linearGradient id={`rootGrad-${toothNumber}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fff5e6" />
            <stop offset="100%" stopColor="#ffe4c4" />
          </linearGradient>
        </defs>
        {isUpper ? (
          <g>
            {/* Racines (3 pour molaires maxillaires) */}
            {/* Racine palatine */}
            <path 
              d="M22 28 Q20 35 21 50 Q21 58 23 62 Q25 58 25 50 Q26 35 24 28"
              fill={`url(#rootGrad-${toothNumber})`}
              stroke="#d4a574"
              strokeWidth="0.8"
            />
            {/* Racine mésio-vestibulaire */}
            <path 
              d="M12 30 Q10 38 9 48 Q8 56 10 60 Q13 56 14 48 Q15 38 14 30"
              fill={`url(#rootGrad-${toothNumber})`}
              stroke="#d4a574"
              strokeWidth="0.8"
            />
            {/* Racine disto-vestibulaire */}
            <path 
              d="M34 30 Q36 38 37 48 Q38 56 36 60 Q33 56 32 48 Q31 38 32 30"
              fill={`url(#rootGrad-${toothNumber})`}
              stroke="#d4a574"
              strokeWidth="0.8"
            />
            {/* Couronne */}
            <path 
              d="M6 8 Q6 3 14 2 L34 2 Q42 3 42 8 L42 24 Q42 32 36 34 L30 34 Q24 36 24 36 Q24 36 18 34 L12 34 Q6 32 6 24 Z"
              fill={`url(#toothGrad-${toothNumber})`}
              stroke={isSelected ? '#0ea5e9' : '#94a3b8'}
              strokeWidth={isSelected ? 2 : 1.2}
            />
            {/* Sillons occlusaux */}
            <path d="M14 12 Q24 18 34 12" fill="none" stroke="#cbd5e1" strokeWidth="1" />
            <path d="M18 8 L18 16" fill="none" stroke="#cbd5e1" strokeWidth="0.8" />
            <path d="M30 8 L30 16" fill="none" stroke="#cbd5e1" strokeWidth="0.8" />
            <ellipse cx="24" cy="14" rx="4" ry="3" fill="none" stroke="#cbd5e1" strokeWidth="0.8" />
          </g>
        ) : (
          <g>
            {/* Racines (2 pour molaires mandibulaires) */}
            {/* Racine mésiale */}
            <path 
              d="M14 45 Q12 52 11 60 Q10 68 13 72 Q16 68 17 60 Q18 52 16 45"
              fill={`url(#rootGrad-${toothNumber})`}
              stroke="#d4a574"
              strokeWidth="0.8"
            />
            {/* Racine distale */}
            <path 
              d="M32 45 Q34 52 35 60 Q36 68 33 72 Q30 68 29 60 Q28 52 30 45"
              fill={`url(#rootGrad-${toothNumber})`}
              stroke="#d4a574"
              strokeWidth="0.8"
            />
            {/* Couronne */}
            <path 
              d="M6 67 Q6 72 14 73 L34 73 Q42 72 42 67 L42 51 Q42 43 36 41 L30 41 Q24 39 24 39 Q24 39 18 41 L12 41 Q6 43 6 51 Z"
              fill={`url(#toothGrad-${toothNumber})`}
              stroke={isSelected ? '#0ea5e9' : '#94a3b8'}
              strokeWidth={isSelected ? 2 : 1.2}
            />
            {/* Sillons occlusaux */}
            <path d="M14 63 Q24 57 34 63" fill="none" stroke="#cbd5e1" strokeWidth="1" />
            <path d="M18 67 L18 59" fill="none" stroke="#cbd5e1" strokeWidth="0.8" />
            <path d="M30 67 L30 59" fill="none" stroke="#cbd5e1" strokeWidth="0.8" />
            <ellipse cx="24" cy="61" rx="4" ry="3" fill="none" stroke="#cbd5e1" strokeWidth="0.8" />
          </g>
        )}
        {data.missing && (
          <line 
            x1="3" y1={isUpper ? "2" : "73"} 
            x2="45" y2={isUpper ? "65" : "5"} 
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
    return (
      <svg 
        width="40" 
        height="70" 
        viewBox="0 0 40 70"
        onClick={onClick}
        style={{ 
          cursor: 'pointer',
          opacity: data.missing ? 0.3 : 1,
          filter: isSelected ? 'drop-shadow(0 0 6px #0ea5e9)' : 'drop-shadow(0 2px 3px rgba(0,0,0,0.1))'
        }}
      >
        <defs>
          <linearGradient id={`toothGrad-${toothNumber}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fefefe" />
            <stop offset="30%" stopColor="#f8f9fa" />
            <stop offset="100%" stopColor="#e9ecef" />
          </linearGradient>
          <linearGradient id={`rootGrad-${toothNumber}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fff5e6" />
            <stop offset="100%" stopColor="#ffe4c4" />
          </linearGradient>
        </defs>
        {isUpper ? (
          <g>
            {/* Racine (peut être bifide) */}
            <path 
              d="M16 28 Q14 38 13 50 Q12 60 16 66 Q20 62 20 50 Q20 38 18 28"
              fill={`url(#rootGrad-${toothNumber})`}
              stroke="#d4a574"
              strokeWidth="0.8"
            />
            <path 
              d="M22 28 Q24 38 25 50 Q26 60 22 66 Q18 62 18 50 Q18 38 20 28"
              fill={`url(#rootGrad-${toothNumber})`}
              stroke="#d4a574"
              strokeWidth="0.8"
            />
            {/* Couronne */}
            <path 
              d="M8 6 Q8 2 20 2 Q32 2 32 6 L32 22 Q32 30 26 32 Q20 34 20 34 Q20 34 14 32 Q8 30 8 22 Z"
              fill={`url(#toothGrad-${toothNumber})`}
              stroke={isSelected ? '#0ea5e9' : '#94a3b8'}
              strokeWidth={isSelected ? 2 : 1.2}
            />
            {/* Cuspides */}
            <path d="M12 10 Q20 16 28 10" fill="none" stroke="#cbd5e1" strokeWidth="1" />
            <circle cx="15" cy="12" r="2" fill="none" stroke="#cbd5e1" strokeWidth="0.6" />
            <circle cx="25" cy="12" r="2" fill="none" stroke="#cbd5e1" strokeWidth="0.6" />
          </g>
        ) : (
          <g>
            {/* Racine unique */}
            <path 
              d="M17 42 Q15 50 14 58 Q13 66 18 70 Q23 66 22 58 Q21 50 19 42"
              fill={`url(#rootGrad-${toothNumber})`}
              stroke="#d4a574"
              strokeWidth="0.8"
            />
            {/* Couronne */}
            <path 
              d="M8 64 Q8 68 20 68 Q32 68 32 64 L32 48 Q32 40 26 38 Q20 36 20 36 Q20 36 14 38 Q8 40 8 48 Z"
              fill={`url(#toothGrad-${toothNumber})`}
              stroke={isSelected ? '#0ea5e9' : '#94a3b8'}
              strokeWidth={isSelected ? 2 : 1.2}
            />
            {/* Cuspides */}
            <path d="M12 60 Q20 54 28 60" fill="none" stroke="#cbd5e1" strokeWidth="1" />
            <circle cx="15" cy="58" r="2" fill="none" stroke="#cbd5e1" strokeWidth="0.6" />
            <circle cx="25" cy="58" r="2" fill="none" stroke="#cbd5e1" strokeWidth="0.6" />
          </g>
        )}
        {data.missing && (
          <line 
            x1="5" y1={isUpper ? "2" : "68"} 
            x2="35" y2={isUpper ? "68" : "2"} 
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
        width="36" 
        height="75" 
        viewBox="0 0 36 75"
        onClick={onClick}
        style={{ 
          cursor: 'pointer',
          opacity: data.missing ? 0.3 : 1,
          filter: isSelected ? 'drop-shadow(0 0 6px #0ea5e9)' : 'drop-shadow(0 2px 3px rgba(0,0,0,0.1))'
        }}
      >
        <defs>
          <linearGradient id={`toothGrad-${toothNumber}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fefefe" />
            <stop offset="30%" stopColor="#f8f9fa" />
            <stop offset="100%" stopColor="#e9ecef" />
          </linearGradient>
          <linearGradient id={`rootGrad-${toothNumber}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fff5e6" />
            <stop offset="100%" stopColor="#ffe4c4" />
          </linearGradient>
        </defs>
        {isUpper ? (
          <g>
            {/* Racine longue */}
            <path 
              d="M14 28 Q12 42 11 55 Q10 68 18 73 Q26 68 25 55 Q24 42 22 28"
              fill={`url(#rootGrad-${toothNumber})`}
              stroke="#d4a574"
              strokeWidth="0.8"
            />
            {/* Couronne pointue */}
            <path 
              d="M8 10 Q8 3 18 2 Q28 3 28 10 L28 22 Q28 28 23 30 L18 32 L13 30 Q8 28 8 22 Z"
              fill={`url(#toothGrad-${toothNumber})`}
              stroke={isSelected ? '#0ea5e9' : '#94a3b8'}
              strokeWidth={isSelected ? 2 : 1.2}
            />
            {/* Cuspide pointue */}
            <path d="M12 14 L18 6 L24 14" fill="none" stroke="#cbd5e1" strokeWidth="1" />
          </g>
        ) : (
          <g>
            {/* Racine longue */}
            <path 
              d="M14 47 Q12 55 11 63 Q10 71 18 73 Q26 71 25 63 Q24 55 22 47"
              fill={`url(#rootGrad-${toothNumber})`}
              stroke="#d4a574"
              strokeWidth="0.8"
            />
            {/* Couronne */}
            <path 
              d="M8 65 Q8 72 18 73 Q28 72 28 65 L28 53 Q28 47 23 45 L18 43 L13 45 Q8 47 8 53 Z"
              fill={`url(#toothGrad-${toothNumber})`}
              stroke={isSelected ? '#0ea5e9' : '#94a3b8'}
              strokeWidth={isSelected ? 2 : 1.2}
            />
            {/* Cuspide */}
            <path d="M12 61 L18 69 L24 61" fill="none" stroke="#cbd5e1" strokeWidth="1" />
          </g>
        )}
        {data.missing && (
          <line 
            x1="5" y1={isUpper ? "2" : "73"} 
            x2="31" y2={isUpper ? "73" : "2"} 
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
        width="38" 
        height="65" 
        viewBox="0 0 38 65"
        onClick={onClick}
        style={{ 
          cursor: 'pointer',
          opacity: data.missing ? 0.3 : 1,
          filter: isSelected ? 'drop-shadow(0 0 6px #0ea5e9)' : 'drop-shadow(0 2px 3px rgba(0,0,0,0.1))'
        }}
      >
        <defs>
          <linearGradient id={`toothGrad-${toothNumber}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fefefe" />
            <stop offset="30%" stopColor="#f8f9fa" />
            <stop offset="100%" stopColor="#e9ecef" />
          </linearGradient>
          <linearGradient id={`rootGrad-${toothNumber}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fff5e6" />
            <stop offset="100%" stopColor="#ffe4c4" />
          </linearGradient>
        </defs>
        {isUpper ? (
          <g>
            {/* Racine conique */}
            <path 
              d="M15 26 Q13 36 12 46 Q11 56 19 62 Q27 56 26 46 Q25 36 23 26"
              fill={`url(#rootGrad-${toothNumber})`}
              stroke="#d4a574"
              strokeWidth="0.8"
            />
            {/* Couronne en pelle */}
            <path 
              d="M6 8 Q6 2 19 2 Q32 2 32 8 L32 20 Q32 28 26 28 L12 28 Q6 28 6 20 Z"
              fill={`url(#toothGrad-${toothNumber})`}
              stroke={isSelected ? '#0ea5e9' : '#94a3b8'}
              strokeWidth={isSelected ? 2 : 1.2}
            />
            {/* Bord incisif */}
            <line x1="10" y1="6" x2="28" y2="6" stroke="#e2e8f0" strokeWidth="2" strokeLinecap="round" />
            {/* Mamelons */}
            <circle cx="13" cy="10" r="1.5" fill="#f1f5f9" stroke="#e2e8f0" strokeWidth="0.5" />
            <circle cx="19" cy="10" r="1.5" fill="#f1f5f9" stroke="#e2e8f0" strokeWidth="0.5" />
            <circle cx="25" cy="10" r="1.5" fill="#f1f5f9" stroke="#e2e8f0" strokeWidth="0.5" />
          </g>
        ) : (
          <g>
            {/* Racine */}
            <path 
              d="M15 39 Q13 47 12 55 Q11 61 19 63 Q27 61 26 55 Q25 47 23 39"
              fill={`url(#rootGrad-${toothNumber})`}
              stroke="#d4a574"
              strokeWidth="0.8"
            />
            {/* Couronne */}
            <path 
              d="M6 57 Q6 63 19 63 Q32 63 32 57 L32 45 Q32 37 26 37 L12 37 Q6 37 6 45 Z"
              fill={`url(#toothGrad-${toothNumber})`}
              stroke={isSelected ? '#0ea5e9' : '#94a3b8'}
              strokeWidth={isSelected ? 2 : 1.2}
            />
            {/* Bord incisif */}
            <line x1="10" y1="59" x2="28" y2="59" stroke="#e2e8f0" strokeWidth="2" strokeLinecap="round" />
          </g>
        )}
        {data.missing && (
          <line 
            x1="3" y1={isUpper ? "2" : "63"} 
            x2="35" y2={isUpper ? "63" : "2"} 
            stroke="#ef4444" 
            strokeWidth="2.5"
            strokeLinecap="round"
          />
        )}
      </svg>
    );
  }
  
  // Incisives latérales (plus petites)
  return (
    <svg 
      width="32" 
      height="62" 
      viewBox="0 0 32 62"
      onClick={onClick}
      style={{ 
        cursor: 'pointer',
        opacity: data.missing ? 0.3 : 1,
        filter: isSelected ? 'drop-shadow(0 0 6px #0ea5e9)' : 'drop-shadow(0 2px 3px rgba(0,0,0,0.1))'
      }}
    >
      <defs>
        <linearGradient id={`toothGrad-${toothNumber}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#fefefe" />
          <stop offset="30%" stopColor="#f8f9fa" />
          <stop offset="100%" stopColor="#e9ecef" />
        </linearGradient>
        <linearGradient id={`rootGrad-${toothNumber}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#fff5e6" />
          <stop offset="100%" stopColor="#ffe4c4" />
        </linearGradient>
      </defs>
      {isUpper ? (
        <g>
          {/* Racine */}
          <path 
            d="M13 24 Q11 34 10 44 Q9 54 16 60 Q23 54 22 44 Q21 34 19 24"
            fill={`url(#rootGrad-${toothNumber})`}
            stroke="#d4a574"
            strokeWidth="0.8"
          />
          {/* Couronne plus petite et arrondie */}
          <path 
            d="M6 8 Q6 2 16 2 Q26 2 26 8 L26 18 Q26 26 21 26 L11 26 Q6 26 6 18 Z"
            fill={`url(#toothGrad-${toothNumber})`}
            stroke={isSelected ? '#0ea5e9' : '#94a3b8'}
            strokeWidth={isSelected ? 2 : 1.2}
          />
          {/* Bord incisif */}
          <line x1="9" y1="6" x2="23" y2="6" stroke="#e2e8f0" strokeWidth="1.5" strokeLinecap="round" />
        </g>
      ) : (
        <g>
          {/* Racine */}
          <path 
            d="M13 38 Q11 46 10 52 Q9 58 16 60 Q23 58 22 52 Q21 46 19 38"
            fill={`url(#rootGrad-${toothNumber})`}
            stroke="#d4a574"
            strokeWidth="0.8"
          />
          {/* Couronne */}
          <path 
            d="M6 54 Q6 60 16 60 Q26 60 26 54 L26 44 Q26 36 21 36 L11 36 Q6 36 6 44 Z"
            fill={`url(#toothGrad-${toothNumber})`}
            stroke={isSelected ? '#0ea5e9' : '#94a3b8'}
            strokeWidth={isSelected ? 2 : 1.2}
          />
          {/* Bord incisif */}
          <line x1="9" y1="56" x2="23" y2="56" stroke="#e2e8f0" strokeWidth="1.5" strokeLinecap="round" />
        </g>
      )}
      {data.missing && (
        <line 
          x1="3" y1={isUpper ? "2" : "60"} 
          x2="29" y2={isUpper ? "60" : "2"} 
          stroke="#ef4444" 
          strokeWidth="2.5"
          strokeLinecap="round"
        />
      )}
    </svg>
  );
};

// Composant pour les entrées de sondage
const ProbingInput = ({ values, onChange, label, isRecession = false }) => {
  return (
    <div className="flex items-center gap-1">
      <span className="text-xs text-slate-500 w-6">{label}</span>
      {values.map((val, idx) => (
        <input
          key={idx}
          type="number"
          min={isRecession ? -10 : 0}
          max={15}
          value={val}
          onChange={(e) => {
            const newValues = [...values];
            newValues[idx] = parseInt(e.target.value) || 0;
            onChange(newValues);
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
      <span className="text-xs text-slate-500 w-6">{label}</span>
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
const DataGrid = ({ teeth, teethData, surface, onUpdate, isUpper }) => {
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
  const [activeView, setActiveView] = useState('chart'); // 'chart' or 'data'
  const [showPdfModal, setShowPdfModal] = useState(false);
  const [pdfDataUrl, setPdfDataUrl] = useState(null);
  const [pdfBase64, setPdfBase64] = useState(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [isSendingToVeasy, setIsSendingToVeasy] = useState(false);
  const chartRef = useRef(null);

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
    
    [...TEETH_UPPER, ...TEETH_LOWER].forEach(tooth => {
      const data = teethData[tooth];
      if (data.missing) return;
      
      presentTeeth++;
      ['buccal', 'lingual'].forEach(surface => {
        data[surface].probing.forEach((p, i) => {
          totalSites++;
          if (data[surface].bleeding[i]) bleedingSites++;
          if (data[surface].plaque[i]) plaqueSites++;
          if (p >= 5) deepPockets++;
          else if (p >= 4) moderatePockets++;
        });
      });
    });
    
    return {
      totalTeeth: presentTeeth,
      totalSites,
      bop: totalSites > 0 ? ((bleedingSites / totalSites) * 100).toFixed(1) : 0,
      plaqueIndex: totalSites > 0 ? ((plaqueSites / totalSites) * 100).toFixed(1) : 0,
      deepPockets,
      moderatePockets
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
      pdf.setFillColor(14, 165, 233);
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

      const response = await fetch('https://n8n.cemedis.app/webhook-test/fc0611a7-63ed-44db-b4e9-d9401957d18a', {
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-sky-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-sky-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C9.5 2 7.5 3.5 7 5.5C6.5 4 5 3 3.5 3C2.5 3 2 4 2 5C2 7 4 9 6 10C5.5 12 5 15 6 18C7 21 9 22 10.5 22C11.5 22 12 21 12 21C12 21 12.5 22 13.5 22C15 22 17 21 18 18C19 15 18.5 12 18 10C20 9 22 7 22 5C22 4 21.5 3 20.5 3C19 3 17.5 4 17 5.5C16.5 3.5 14.5 2 12 2Z" />
                </svg>
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-800">HelloParo</h1>
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
              <label className="px-3 py-2 bg-slate-100 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-200 cursor-pointer transition-colors">
                Importer
                <input type="file" accept=".json" onChange={importData} className="hidden" />
              </label>
              <button
                onClick={exportData}
                className="px-3 py-2 bg-sky-500 text-white rounded-lg text-sm font-medium hover:bg-sky-600 transition-colors shadow-md"
              >
                Exporter
              </button>
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
                    PDF
                  </>
                )}
              </button>
              <button
                onClick={sendToVeasy}
                disabled={isSendingToVeasy}
                className="px-3 py-2 bg-violet-500 text-white rounded-lg text-sm font-medium hover:bg-violet-600 transition-colors shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
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
        </div>
        
        {activeView === 'chart' ? (
          <div className="flex gap-6">
            {/* Zone principale - Arcades dentaires */}
            <div ref={chartRef} className={`space-y-6 ${selectedTooth ? 'flex-1' : 'w-full'}`}>
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
                  <div className="space-y-3">
                    {['buccal', 'lingual'].map(surface => (
                      <div key={surface} className="p-3 bg-slate-50 rounded-xl">
                        <h4 className="text-xs font-semibold text-slate-700 mb-2">
                          {surface === 'buccal' ? 'Vestibulaire' : TEETH_UPPER.includes(selectedTooth) ? 'Palatin' : 'Lingual'}
                        </h4>
                        <div className="space-y-1.5">
                          <ProbingInput
                            values={teethData[selectedTooth][surface].probing}
                            onChange={(vals) => updateToothData(selectedTooth, surface, 'probing', vals)}
                            label="PD"
                          />
                          <ProbingInput
                            values={teethData[selectedTooth][surface].recession}
                            onChange={(vals) => updateToothData(selectedTooth, surface, 'recession', vals)}
                            label="REC"
                            isRecession
                          />
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
                            label="PLI"
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
        ) : (
          /* Vue diagnostic */
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-slate-200">
            <DiagnosticParodontal
              stats={stats}
              patientInfo={patientInfo}
              contextInfo={contextInfo}
              onPdfGenerated={(blobUrl, base64) => {
                setPdfDataUrl(blobUrl);
                setPdfBase64(base64);
                setShowPdfModal(true);
              }}
            />
          </div>
        )}

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

      {/* Footer */}
      <footer className="mt-8 py-6 bg-slate-800 text-center">
        <p className="text-slate-400 text-sm">
          HelloParo © {new Date().getFullYear()}
        </p>
      </footer>
    </div>
  );
}

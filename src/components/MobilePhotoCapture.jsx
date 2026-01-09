import React, { useState, useEffect, useRef } from 'react';
import Peer from 'peerjs';

export default function MobilePhotoCapture({ peerId }) {
  const [status, setStatus] = useState('connecting'); // connecting, connected, sending, sent, error
  const [error, setError] = useState(null);
  const [photoTaken, setPhotoTaken] = useState(null);

  // Camera controls state
  const [showGrid, setShowGrid] = useState(false);
  const [flashEnabled, setFlashEnabled] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);

  // Capabilities state
  const [capabilities, setCapabilities] = useState({
    zoom: { supported: false, min: 1, max: 1 },
    torch: { supported: false },
    focusMode: { supported: false }
  });

  const peerRef = useRef(null);
  const connRef = useRef(null);
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const trackRef = useRef(null);

  useEffect(() => {
    // Initialize peer connection
    const peer = new Peer();
    peerRef.current = peer;

    peer.on('open', () => {
      // Connect to desktop peer
      const conn = peer.connect(peerId, { reliable: true });
      connRef.current = conn;

      conn.on('open', () => {
        setStatus('connected');
        startCamera();
      });

      conn.on('error', (err) => {
        setError('Erreur de connexion: ' + err.message);
        setStatus('error');
      });
    });

    peer.on('error', (err) => {
      setError('Erreur: ' + err.message);
      setStatus('error');
    });

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      if (connRef.current) {
        connRef.current.close();
      }
      if (peerRef.current) {
        peerRef.current.destroy();
      }
    };
  }, [peerId]);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment',
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        },
        audio: false
      });
      streamRef.current = stream;

      const videoTrack = stream.getVideoTracks()[0];
      trackRef.current = videoTrack;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }

      // Get track capabilities
      if (videoTrack && typeof videoTrack.getCapabilities === 'function') {
        const caps = videoTrack.getCapabilities();

        const newCapabilities = {
          zoom: { supported: false, min: 1, max: 1 },
          torch: { supported: false },
          focusMode: { supported: false }
        };

        // Check zoom support
        if (caps.zoom) {
          newCapabilities.zoom = {
            supported: true,
            min: caps.zoom.min || 1,
            max: caps.zoom.max || 1
          };
          setZoomLevel(caps.zoom.min || 1);
        }

        // Check torch/flash support
        if (caps.torch !== undefined) {
          newCapabilities.torch = { supported: true };
        }

        // Check focus mode support
        if (caps.focusMode && caps.focusMode.includes('continuous')) {
          newCapabilities.focusMode = { supported: true };
          // Enable continuous autofocus
          try {
            await videoTrack.applyConstraints({
              advanced: [{ focusMode: 'continuous' }]
            });
          } catch (e) {
            console.log('Could not enable continuous autofocus:', e);
          }
        }

        setCapabilities(newCapabilities);
      }
    } catch (err) {
      setError('Impossible d\'accéder à la caméra: ' + err.message);
      setStatus('error');
    }
  };

  // Handle zoom change
  const handleZoomChange = async (newZoom) => {
    if (!trackRef.current || !capabilities.zoom.supported) return;

    try {
      await trackRef.current.applyConstraints({
        advanced: [{ zoom: newZoom }]
      });
      setZoomLevel(newZoom);
    } catch (err) {
      console.log('Could not change zoom:', err);
    }
  };

  // Handle flash/torch toggle
  const toggleFlash = async () => {
    if (!trackRef.current || !capabilities.torch.supported) return;

    try {
      const newFlashState = !flashEnabled;
      await trackRef.current.applyConstraints({
        advanced: [{ torch: newFlashState }]
      });
      setFlashEnabled(newFlashState);
    } catch (err) {
      console.log('Could not toggle flash:', err);
    }
  };

  const takePhoto = () => {
    if (!videoRef.current || !streamRef.current) return;

    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(videoRef.current, 0, 0);

    const imageData = canvas.toDataURL('image/jpeg', 0.85);
    setPhotoTaken(imageData);

    // Turn off flash when photo is taken
    if (flashEnabled && trackRef.current) {
      trackRef.current.applyConstraints({
        advanced: [{ torch: false }]
      }).catch(() => {});
      setFlashEnabled(false);
    }
  };

  const retakePhoto = () => {
    setPhotoTaken(null);
  };

  const sendPhoto = () => {
    if (!connRef.current || !photoTaken) return;

    setStatus('sending');
    try {
      connRef.current.send({
        type: 'photo',
        data: photoTaken,
        timestamp: Date.now()
      });
      setStatus('sent');

      // Stop camera after sending
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    } catch (err) {
      setError('Erreur d\'envoi: ' + err.message);
      setStatus('error');
    }
  };

  const takeAnotherPhoto = () => {
    setPhotoTaken(null);
    setStatus('connected');
    startCamera();
  };

  const closeCapture = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    if (connRef.current) {
      connRef.current.close();
    }
    window.close();
  };

  // Rule of thirds grid overlay
  const GridOverlay = () => (
    <div className="absolute inset-0 pointer-events-none">
      {/* Vertical lines */}
      <div className="absolute left-1/3 top-0 bottom-0 w-px bg-white/40"></div>
      <div className="absolute left-2/3 top-0 bottom-0 w-px bg-white/40"></div>
      {/* Horizontal lines */}
      <div className="absolute top-1/3 left-0 right-0 h-px bg-white/40"></div>
      <div className="absolute top-2/3 left-0 right-0 h-px bg-white/40"></div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col">
      {/* Header */}
      <header className="bg-teal-600 text-white p-3 text-center">
        <h1 className="text-lg font-bold">HelloParo</h1>
        <p className="text-xs text-teal-100">Capture photo patient</p>
      </header>

      {/* Main content */}
      <div className="flex-1 flex flex-col items-center justify-center p-2">
        {status === 'connecting' && (
          <div className="text-center text-white">
            <svg className="animate-spin w-12 h-12 mx-auto mb-4 text-teal-400" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p className="text-lg">Connexion en cours...</p>
            <p className="text-sm text-slate-400 mt-2">Veuillez patienter</p>
          </div>
        )}

        {status === 'error' && (
          <div className="text-center text-white">
            <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <p className="text-lg font-medium text-red-400">Erreur</p>
            <p className="text-sm text-slate-400 mt-2">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 px-6 py-2 bg-teal-500 rounded-lg font-medium"
            >
              Réessayer
            </button>
          </div>
        )}

        {status === 'connected' && !photoTaken && (
          <div className="w-full max-w-md">
            {/* Camera view with controls */}
            <div className="relative rounded-2xl overflow-hidden bg-black mb-3">
              {/* Top bar with grid and flash buttons */}
              <div className="absolute top-0 left-0 right-0 z-20 flex justify-between items-center p-2">
                {/* Grid toggle button */}
                <button
                  onClick={() => setShowGrid(!showGrid)}
                  className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                    showGrid ? 'bg-white/30' : 'bg-black/30'
                  }`}
                >
                  <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 12h16M4 18h16M8 4v16M16 4v16" />
                  </svg>
                </button>

                {/* Flash toggle button - only show if supported */}
                {capabilities.torch.supported && (
                  <button
                    onClick={toggleFlash}
                    className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                      flashEnabled ? 'bg-yellow-400' : 'bg-black/30'
                    }`}
                  >
                    <svg className={`w-6 h-6 ${flashEnabled ? 'text-slate-900' : 'text-white'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </button>
                )}
              </div>

              {/* Zoom slider - only show if supported */}
              {capabilities.zoom.supported && capabilities.zoom.max > capabilities.zoom.min && (
                <div className="absolute left-2 top-1/2 -translate-y-1/2 z-20 flex flex-col items-center gap-1 bg-black/40 rounded-full py-3 px-1">
                  <span className="text-white text-[10px] font-medium">{zoomLevel.toFixed(1)}x</span>
                  <input
                    type="range"
                    min={capabilities.zoom.min}
                    max={capabilities.zoom.max}
                    step={0.1}
                    value={zoomLevel}
                    onChange={(e) => handleZoomChange(parseFloat(e.target.value))}
                    className="h-24 appearance-none bg-transparent cursor-pointer"
                    style={{
                      writingMode: 'vertical-lr',
                      direction: 'rtl',
                      WebkitAppearance: 'slider-vertical',
                      width: '24px'
                    }}
                  />
                  <svg className="w-4 h-4 text-white/70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                  </svg>
                </div>
              )}

              {/* Video element */}
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full"
              />

              {/* Grid overlay */}
              {showGrid && <GridOverlay />}
            </div>

            {/* Bottom controls */}
            <div className="flex items-center justify-center gap-6">
              {/* Retake/Cancel button */}
              <button
                onClick={closeCapture}
                className="w-12 h-12 rounded-full bg-slate-700 flex items-center justify-center active:bg-slate-600"
              >
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

              {/* Capture button */}
              <button
                onClick={takePhoto}
                className="w-16 h-16 rounded-full bg-white flex items-center justify-center active:bg-slate-200 ring-4 ring-white/30"
              >
                <div className="w-12 h-12 rounded-full bg-white border-4 border-slate-900"></div>
              </button>

              {/* Switch camera placeholder (for future) */}
              <button
                onClick={() => {}}
                className="w-12 h-12 rounded-full bg-slate-700 flex items-center justify-center active:bg-slate-600"
              >
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
            </div>
          </div>
        )}

        {status === 'connected' && photoTaken && (
          <div className="w-full max-w-md">
            <div className="relative rounded-2xl overflow-hidden bg-black mb-4">
              <img src={photoTaken} alt="Photo prise" className="w-full" />
            </div>
            <div className="flex gap-3">
              <button
                onClick={retakePhoto}
                className="flex-1 py-4 bg-slate-600 text-white rounded-xl font-bold text-lg active:bg-slate-700"
              >
                Reprendre
              </button>
              <button
                onClick={sendPhoto}
                className="flex-1 py-4 bg-teal-500 text-white rounded-xl font-bold text-lg flex items-center justify-center gap-2 active:bg-teal-600"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
                Envoyer
              </button>
            </div>
          </div>
        )}

        {status === 'sending' && (
          <div className="text-center text-white">
            <svg className="animate-spin w-12 h-12 mx-auto mb-4 text-teal-400" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p className="text-lg">Envoi en cours...</p>
          </div>
        )}

        {status === 'sent' && (
          <div className="text-center text-white">
            <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="text-lg font-medium text-green-400">Photo envoyée !</p>
            <p className="text-sm text-slate-400 mt-2">La photo a été ajoutée au dossier patient</p>
            <button
              onClick={takeAnotherPhoto}
              className="mt-6 px-6 py-3 bg-teal-500 rounded-xl font-medium"
            >
              Prendre une autre photo
            </button>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="p-2 text-center text-slate-500 text-xs">
        HelloParo - CEMEDIS
      </footer>
    </div>
  );
}

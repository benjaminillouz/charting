import React, { useState, useEffect, useRef } from 'react';
import Peer from 'peerjs';

export default function MobilePhotoCapture({ peerId }) {
  const [status, setStatus] = useState('connecting'); // connecting, connected, sending, sent, error
  const [error, setError] = useState(null);
  const [photoTaken, setPhotoTaken] = useState(null);
  const peerRef = useRef(null);
  const connRef = useRef(null);
  const videoRef = useRef(null);
  const streamRef = useRef(null);

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
        video: { facingMode: 'environment', width: { ideal: 1920 }, height: { ideal: 1080 } },
        audio: false
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      setError('Impossible d\'accéder à la caméra: ' + err.message);
      setStatus('error');
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

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col">
      {/* Header */}
      <header className="bg-teal-600 text-white p-4 text-center">
        <h1 className="text-xl font-bold">HelloParo</h1>
        <p className="text-sm text-teal-100">Capture photo patient</p>
      </header>

      {/* Main content */}
      <div className="flex-1 flex flex-col items-center justify-center p-4">
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
            <div className="relative rounded-2xl overflow-hidden bg-black mb-4">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full"
              />
            </div>
            <button
              onClick={takePhoto}
              className="w-full py-4 bg-teal-500 text-white rounded-xl font-bold text-lg flex items-center justify-center gap-2 active:bg-teal-600"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Prendre la photo
            </button>
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
      <footer className="p-4 text-center text-slate-500 text-sm">
        HelloParo - CEMEDIS
      </footer>
    </div>
  );
}

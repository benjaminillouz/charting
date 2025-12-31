import { useState, useEffect, useRef } from 'react'
import Peer from 'peerjs'

export default function MobilePDFReceiver({ peerId }) {
  const [status, setStatus] = useState('connecting') // connecting, connected, receiving, received, error
  const [pdfData, setPdfData] = useState(null)
  const [filename, setFilename] = useState('')
  const [patientName, setPatientName] = useState('')
  const peerRef = useRef(null)
  const connRef = useRef(null)

  useEffect(() => {
    if (!peerId) {
      setStatus('error')
      return
    }

    const peer = new Peer(undefined, { debug: 0 })

    peer.on('open', () => {
      // Connect to the desktop peer
      const conn = peer.connect(peerId)
      connRef.current = conn

      conn.on('open', () => {
        setStatus('connected')
      })

      conn.on('data', (data) => {
        if (data.type === 'pdf') {
          setStatus('receiving')
          setPdfData(data.data)
          setFilename(data.filename || 'charting-parodontal.pdf')
          setPatientName(data.patientName || 'Patient')
          setStatus('received')
        }
      })

      conn.on('error', (err) => {
        console.error('Connection error:', err)
        setStatus('error')
      })
    })

    peer.on('error', (err) => {
      console.error('Peer error:', err)
      setStatus('error')
    })

    peerRef.current = peer

    return () => {
      if (connRef.current) connRef.current.close()
      if (peerRef.current) peerRef.current.destroy()
    }
  }, [peerId])

  const base64ToBlob = (base64, type = 'application/pdf') => {
    const binaryString = atob(base64)
    const bytes = new Uint8Array(binaryString.length)
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i)
    }
    return new Blob([bytes], { type })
  }

  const shareViaWhatsApp = async () => {
    if (!pdfData) return

    const blob = base64ToBlob(pdfData)
    const file = new File([blob], filename, { type: 'application/pdf' })

    // Try native share with file
    if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({
          title: `Charting Parodontal - ${patientName}`,
          text: `Charting Parodontal - ${patientName}`,
          files: [file]
        })
        return
      } catch (e) {
        console.log('Native share failed:', e)
      }
    }

    // Fallback: open WhatsApp with text
    const text = encodeURIComponent(`Charting Parodontal - ${patientName}`)
    window.open(`https://wa.me/?text=${text}`)
  }

  const downloadPDF = () => {
    if (!pdfData) return

    const blob = base64ToBlob(pdfData)
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const shareNative = async () => {
    if (!pdfData) return

    const blob = base64ToBlob(pdfData)
    const file = new File([blob], filename, { type: 'application/pdf' })

    if (navigator.share) {
      try {
        await navigator.share({
          title: `Charting Parodontal - ${patientName}`,
          files: [file]
        })
      } catch (e) {
        console.log('Share cancelled')
      }
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
        <div className="bg-green-500 text-white px-6 py-4 text-center">
          <h1 className="text-xl font-bold">Partage WhatsApp</h1>
        </div>

        <div className="p-6">
          {status === 'connecting' && (
            <div className="text-center py-8">
              <div className="animate-spin w-12 h-12 border-4 border-green-200 border-t-green-500 rounded-full mx-auto mb-4"></div>
              <p className="text-green-600 font-medium">Connexion en cours...</p>
              <p className="text-sm text-gray-500 mt-2">Veuillez patienter</p>
            </div>
          )}

          {status === 'connected' && (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="text-green-700 font-medium">Connecté !</p>
              <p className="text-sm text-gray-500 mt-2">Réception du PDF en cours...</p>
              <div className="animate-spin w-6 h-6 border-2 border-green-200 border-t-green-500 rounded-full mx-auto mt-4"></div>
            </div>
          )}

          {status === 'receiving' && (
            <div className="text-center py-8">
              <div className="animate-spin w-12 h-12 border-4 border-green-200 border-t-green-500 rounded-full mx-auto mb-4"></div>
              <p className="text-green-600 font-medium">Réception du PDF...</p>
            </div>
          )}

          {status === 'received' && (
            <div className="text-center">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-10 h-10 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <p className="text-green-700 font-bold text-lg mb-1">PDF reçu !</p>
              <p className="text-gray-600 mb-6">{patientName}</p>

              <div className="space-y-3">
                {/* WhatsApp button */}
                <button
                  onClick={shareViaWhatsApp}
                  className="w-full flex items-center justify-center gap-3 px-4 py-4 bg-green-500 text-white rounded-xl hover:bg-green-600 transition-colors"
                >
                  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
                  <span className="font-semibold text-lg">Partager via WhatsApp</span>
                </button>

                {/* Other share options */}
                {navigator.share && (
                  <button
                    onClick={shareNative}
                    className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                    </svg>
                    <span className="font-medium">Autres options de partage</span>
                  </button>
                )}

                {/* Download button */}
                <button
                  onClick={downloadPDF}
                  className="w-full flex items-center justify-center gap-3 px-4 py-3 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  <span className="font-medium">Télécharger le PDF</span>
                </button>
              </div>
            </div>
          )}

          {status === 'error' && (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <p className="text-red-700 font-medium">Erreur de connexion</p>
              <p className="text-sm text-gray-500 mt-2">Veuillez rescanner le QR code</p>
              <button
                onClick={() => window.location.reload()}
                className="mt-4 px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
              >
                Réessayer
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

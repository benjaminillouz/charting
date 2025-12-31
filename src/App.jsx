import { useEffect, useState } from 'react'
import PeriodontalChart from './components/PeriodontalChart'
import MobilePhotoCapture from './components/MobilePhotoCapture'
import MobilePDFReceiver from './components/MobilePDFReceiver'

function App() {
  const [mode, setMode] = useState('desktop') // 'desktop', 'mobile-photo', 'mobile-pdf'
  const [peerId, setPeerId] = useState(null)

  useEffect(() => {
    // Check URL parameters for mobile modes
    const params = new URLSearchParams(window.location.search)
    const photoMode = params.get('photo')
    const pdfMode = params.get('pdf')
    const peerIdParam = params.get('peer')

    if (photoMode === '1' && peerIdParam) {
      setMode('mobile-photo')
      setPeerId(peerIdParam)
    } else if (pdfMode === '1' && peerIdParam) {
      setMode('mobile-pdf')
      setPeerId(peerIdParam)
    }
  }, [])

  if (mode === 'mobile-photo' && peerId) {
    return <MobilePhotoCapture peerId={peerId} />
  }

  if (mode === 'mobile-pdf' && peerId) {
    return <MobilePDFReceiver peerId={peerId} />
  }

  return <PeriodontalChart />
}

export default App

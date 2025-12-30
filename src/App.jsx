import { useEffect, useState } from 'react'
import PeriodontalChart from './components/PeriodontalChart'
import MobilePhotoCapture from './components/MobilePhotoCapture'

function App() {
  const [mode, setMode] = useState('desktop') // 'desktop' or 'mobile-photo'
  const [peerId, setPeerId] = useState(null)

  useEffect(() => {
    // Check URL parameters for mobile photo mode
    const params = new URLSearchParams(window.location.search)
    const photoMode = params.get('photo')
    const peerIdParam = params.get('peer')

    if (photoMode === '1' && peerIdParam) {
      setMode('mobile-photo')
      setPeerId(peerIdParam)
    }
  }, [])

  if (mode === 'mobile-photo' && peerId) {
    return <MobilePhotoCapture peerId={peerId} />
  }

  return <PeriodontalChart />
}

export default App

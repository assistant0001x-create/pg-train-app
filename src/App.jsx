import { useState } from 'react'
import { useTrainApp } from './hooks/useTrainApp'
import Header from './components/Header'
import StatusMessage from './components/StatusMessage'
import HomeOptions from './components/HomeOptions'
import TrainList from './components/TrainList'
import TransportModal from './components/TransportModal'

export default function App() {
  const app = useTrainApp()
  const [activeModal, setActiveModal] = useState(null)

  return (
    <div className="min-h-screen bg-animated text-slate-100 relative overflow-x-hidden">
      {/* Animated background blobs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-20 left-10 w-72 h-72 bg-pink-500/10 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }} />
      </div>

      <div className="max-w-4xl mx-auto p-4 sm:p-6 relative z-10">
        <Header
          currentMode={app.currentMode}
          setMode={app.setMode}
          isLoading={app.isLoading}
          fetchTrains={app.fetchTrains}
          lastUpdate={app.lastUpdate}
          walkingInfo={app.walkingInfo}
          autoRefreshEnabled={app.autoRefreshEnabled}
          setAutoRefreshEnabled={app.setAutoRefreshEnabled}
          notificationsGranted={app.notificationsGranted}
          requestNotifications={app.requestNotifications}
          clearCacheAndReload={app.clearCacheAndReload}
        />

        <StatusMessage status={app.status} />

        {app.currentMode === 'home' && (
          <HomeOptions homeRoutingInfo={app.homeRoutingInfo} onOpenModal={setActiveModal} />
        )}

        <TrainList
          trains={app.trains}
          isLoading={app.isLoading}
          trackedServiceID={app.trackedServiceID}
          onTrack={app.trackTrain}
          currentMode={app.currentMode}
          homeRoutingInfo={app.homeRoutingInfo}
        />
      </div>

      <TransportModal
        activeModal={activeModal}
        onClose={() => setActiveModal(null)}
        trains={app.trains}
        walkingInfo={app.walkingInfo}
        homeRoutingInfo={app.homeRoutingInfo}
        trackedServiceID={app.trackedServiceID}
        onTrack={app.trackTrain}
      />
    </div>
  )
}

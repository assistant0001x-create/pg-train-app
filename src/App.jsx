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
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <div className="max-w-3xl mx-auto p-4 sm:p-6">
        <Header
          currentMode={app.currentMode}
          setMode={app.setMode}
          isLoading={app.isLoading}
          fetchTrains={app.fetchTrains}
          lastUpdate={app.lastUpdate}
          walkingInfo={app.walkingInfo}
          notificationsGranted={app.notificationsGranted}
          requestNotifications={app.requestNotifications}
          clearCacheAndReload={app.clearCacheAndReload}
        />

        <StatusMessage status={app.status} />

        {app.currentMode === 'home' && (
          <HomeOptions routeOptions={app.routeOptions} isLoading={app.isLoading} />
        )}

        {app.currentMode === 'out' && (
          <TrainList
            trains={app.trains}
            isLoading={app.isLoading}
            trackedServiceID={app.trackedServiceID}
            onTrack={app.trackTrain}
            currentMode={app.currentMode}
            homeRoutingInfo={app.homeRoutingInfo}
          />
        )}
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

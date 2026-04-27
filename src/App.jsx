import { useTrainApp } from './hooks/useTrainApp'
import Header from './components/Header'
import StatusMessage from './components/StatusMessage'
import HomeOptions from './components/HomeOptions'
import TrainList from './components/TrainList'

export default function App() {
  const app = useTrainApp()

  return (
    <div className="app">
      <div className="app-bg" />
      <div className="app-inner">
        <Header
          currentMode={app.currentMode}
          setMode={app.setMode}
          isLoading={app.isLoading}
          fetchTrains={app.fetchTrains}
          lastUpdate={app.lastUpdate}
          notificationsGranted={app.notificationsGranted}
          requestNotifications={app.requestNotifications}
        />

        <StatusMessage status={app.status} />

        {app.currentMode === 'home' && (
          <HomeOptions
            routeOptions={app.routeOptions}
            isLoading={app.isLoading}
            userLocation={app.homeRoutingInfo?.location ?? null}
          />
        )}

        {app.currentMode === 'out' && (
          <TrainList
            trains={app.trains}
            isLoading={app.isLoading}
            trackedServiceID={app.trackedServiceID}
            onTrack={app.trackTrain}
          />
        )}
      </div>
    </div>
  )
}

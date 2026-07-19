import { useState } from 'react'
import { useTrainApp } from './hooks/useTrainApp'
import { useTweaks, ACCENT_VARS } from './hooks/useTweaks'
import Header from './components/Header'
import StatusMessage from './components/StatusMessage'
import HomeOptions from './components/HomeOptions'
import TrainList from './components/TrainList'
import TweaksDrawer from './components/TweaksDrawer'

export default function App() {
  const app = useTrainApp()
  const [tweaks, setTweak] = useTweaks()
  const [tweaksOpen, setTweaksOpen] = useState(false)

  const accentVar = ACCENT_VARS[tweaks.accent] || ACCENT_VARS.amber

  return (
    <div className="app" style={{ '--accent': accentVar }}>
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
          headerStyle={tweaks.headerStyle}
          locationLabel={app.locationLabel}
        />

        <StatusMessage status={app.status} />

        {app.currentMode === 'home' && (
          <HomeOptions
            routeOptions={app.routeOptions}
            isLoading={app.isLoading}
            userLocation={app.homeRoutingInfo?.location ?? null}
            mockLocation={app.mockLocation}
          />
        )}

        {app.currentMode === 'out' && (
          <TrainList
            trains={app.trains}
            isLoading={app.isLoading}
            trackedServiceID={app.trackedServiceID}
            onTrack={app.trackTrain}
            cardStyle={tweaks.cardStyle}
          />
        )}
      </div>

      <TweaksDrawer
        tweaks={tweaks}
        setTweak={setTweak}
        open={tweaksOpen}
        onClose={() => setTweaksOpen((x) => !x)}
      />
    </div>
  )
}

import { EnvironmentManagerComponent } from './components/EnvironmentManager'
import { Toaster } from "@/components/ui/toaster"
import { ThemeProvider } from './contexts/ThemeContext'

function App() {
  return (
    <ThemeProvider>
      <div className="flex justify-center items-center">
        <EnvironmentManagerComponent />
        <Toaster />
      </div>
    </ThemeProvider>
  )
}

export default App

import { createRoot } from 'react-dom/client'
import App from './App'
import '../toolbar.css'

createRoot(document.querySelector<HTMLDivElement>('#root')!).render(<App />)

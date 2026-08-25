import { createRoot } from 'react-dom/client'
import App from './App'
import './styles/global.css'
import './styles/app.css'
import 'react-quill-new/dist/quill.snow.css'
import './styles/quill-content.css'

createRoot(document.getElementById('root')!).render(
  // <StrictMode>
    <App />
  // </StrictMode>
)

import { Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import BrowserApiPage from './features/browser-api/BrowserApiPage';
import DeepgramPage from './features/deepgram/DeepgramPage';

function App() {
  return (
    <Routes>
      <Route path="/" element={<MainLayout />}>
        <Route index element={<Navigate to="/browser-api" replace />} />
        <Route path="browser-api" element={<BrowserApiPage />} />
        <Route path="deepgram" element={<DeepgramPage />} />
      </Route>
    </Routes>
  );
}

export default App;

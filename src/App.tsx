import { Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import BrowserApiPage from './features/browser-api/BrowserApiPage';
import DeepgramPage from './features/deepgram/DeepgramPage';
import WhisperPage from './features/whisper/WhisperPage';
import GroqPage from './features/groq/GroqPage';
import AssemblyaiPage from './features/assemblyai/AssemblyaiPage';
import SpeechmaticsPage from './features/speechmatics/SpeechmaticsPage';
import GladiaPage from './features/gladia/GladiaPage';
import ComparisonPage from './features/comparison/ComparisonPage';

function App() {
  return (
    <Routes>
      <Route path="/" element={<MainLayout />}>
        <Route index element={<Navigate to="/browser-api" replace />} />
        <Route path="browser-api" element={<BrowserApiPage />} />
        <Route path="deepgram" element={<DeepgramPage />} />
        <Route path="whisper" element={<WhisperPage />} />
        <Route path="groq" element={<GroqPage />} />
        <Route path="assemblyai" element={<AssemblyaiPage />} />
        <Route path="speechmatics" element={<SpeechmaticsPage />} />
        <Route path="gladia" element={<GladiaPage />} />
        <Route path="comparison" element={<ComparisonPage />} />
      </Route>
    </Routes>
  );
}

export default App;

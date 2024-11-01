import { Routes, Route } from 'react-router-dom';
import { UIProvider } from './contexts/ui-context';
import Dashboard from './pages/dashboard';
import Calls from './pages/calls';

export default function App() {
  return (
    <UIProvider>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/calls" element={<Calls />} />
      </Routes>
    </UIProvider>
  );
}
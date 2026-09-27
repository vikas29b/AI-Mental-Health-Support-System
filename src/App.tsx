/**
 * AegisMind - Enterprise Mental Health AI Support System
 * Main Application Shell
 */

import { useState } from 'react';
import { Navbar, AppView } from './components/Navbar.tsx';
import { ChatInterface } from './components/ChatInterface.tsx';
import { PipelineInspector } from './components/PipelineInspector.tsx';
import { PowerBiDashboard } from './components/PowerBiDashboard.tsx';
import { SimulationWorkbench } from './components/SimulationWorkbench.tsx';
import { ApiDocs } from './components/ApiDocs.tsx';
import { CrisisModal } from './components/CrisisModal.tsx';
import { GroundingTool } from './components/GroundingTool.tsx';
import { CRISIS_RESOURCES } from '../server/guardrails/crisisDetector.ts';
import { ChatResponsePayload } from '../server/types.ts';

export default function App() {
  const [currentView, setCurrentView] = useState<AppView>('chat');
  const [isCrisisModalOpen, setIsCrisisModalOpen] = useState(false);
  const [isGroundingOpen, setIsGroundingOpen] = useState(false);
  const [lastTrace, setLastTrace] = useState<{
    response: ChatResponsePayload;
    rawText: string;
  } | null>(null);

  const handleMessageProcessed = (response: ChatResponsePayload, userRawText: string) => {
    setLastTrace({ response, rawText: userRawText });
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-teal-500 selection:text-white">
      {/* Navigation Bar */}
      <Navbar
        currentView={currentView}
        setCurrentView={setCurrentView}
        onOpenCrisisHelp={() => setIsCrisisModalOpen(true)}
      />

      {/* Main View Router */}
      <main className="flex-1">
        {currentView === 'chat' && (
          <ChatInterface
            onOpenGrounding={() => setIsGroundingOpen(true)}
            onOpenCrisisModal={() => setIsCrisisModalOpen(true)}
            onMessageProcessed={handleMessageProcessed}
          />
        )}

        {currentView === 'inspector' && (
          <PipelineInspector lastTrace={lastTrace} />
        )}

        {currentView === 'powerbi' && <PowerBiDashboard />}

        {currentView === 'workbench' && <SimulationWorkbench />}

        {currentView === 'api' && <ApiDocs />}
      </main>

      {/* Overlays / Modals */}
      <CrisisModal
        isOpen={isCrisisModalOpen}
        onClose={() => setIsCrisisModalOpen(false)}
        resources={CRISIS_RESOURCES}
        sessionId={lastTrace?.response?.session_id}
      />

      {isGroundingOpen && (
        <GroundingTool onClose={() => setIsGroundingOpen(false)} />
      )}
    </div>
  );
}

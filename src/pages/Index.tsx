import { GameProvider } from '@/context/GameContext';
import { TopBar } from '@/components/game/TopBar';
import { GameTabs } from '@/components/game/GameTabs';
import { useWageNotifications } from '@/hooks/useWageNotifications';

function GameContent() {
  useWageNotifications();
  
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <TopBar />
      <GameTabs />
    </div>
  );
}

const Index = () => {
  return (
    <GameProvider>
      <GameContent />
    </GameProvider>
  );
};

export default Index;

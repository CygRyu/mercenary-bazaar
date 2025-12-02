import { GameProvider } from '@/context/GameContext';
import { TopBar } from '@/components/game/TopBar';
import { GameTabs } from '@/components/game/GameTabs';

const Index = () => {
  return (
    <GameProvider>
      <div className="min-h-screen bg-background flex flex-col">
        <TopBar />
        <GameTabs />
      </div>
    </GameProvider>
  );
};

export default Index;

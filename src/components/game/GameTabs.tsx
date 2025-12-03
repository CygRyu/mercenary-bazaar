import { useState } from 'react';
import { useGame } from '@/context/GameContext';
import { MarketView } from './MarketView';
import { BarracksView } from './BarracksView';
import { QuestHallView } from './QuestHallView';
import { StatsView } from './StatsView';
import { SettingsView } from './SettingsView';
import { Store, Users, Swords, BarChart3, Settings } from 'lucide-react';

type TabId = 'market' | 'barracks' | 'quests' | 'stats' | 'settings';

const TABS: { id: TabId; label: string; icon: typeof Store }[] = [
  { id: 'market', label: 'Market', icon: Store },
  { id: 'barracks', label: 'Barracks', icon: Users },
  { id: 'quests', label: 'Quest Hall', icon: Swords },
  { id: 'stats', label: 'Statistics', icon: BarChart3 },
  { id: 'settings', label: 'Settings', icon: Settings },
];

export function GameTabs() {
  const [activeTab, setActiveTab] = useState<TabId>('market');
  const { state, getPendingAchievements } = useGame();

  const pendingAchievements = getPendingAchievements();
  const questingCount = state.activeQuests.length;

  const renderBadge = (tabId: TabId) => {
    if (tabId === 'stats' && pendingAchievements.length > 0) {
      return (
        <span className="absolute -top-1 -right-1 w-4 h-4 bg-primary text-primary-foreground text-xs rounded-full flex items-center justify-center">
          {pendingAchievements.length}
        </span>
      );
    }
    if (tabId === 'quests' && questingCount > 0) {
      return (
        <span className="absolute -top-1 -right-1 w-4 h-4 bg-status-info text-background text-xs rounded-full flex items-center justify-center">
          {questingCount}
        </span>
      );
    }
    return null;
  };

  return (
    <div className="flex flex-col h-full">
      {/* Tab Navigation */}
      <nav className="border-b border-border bg-card/50">
        <div className="max-w-6xl mx-auto flex">
          {TABS.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  relative flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors
                  ${isActive 
                    ? 'text-primary border-b-2 border-primary -mb-px' 
                    : 'text-muted-foreground hover:text-foreground'
                  }
                `}
              >
                <Icon className="w-4 h-4" />
                <span className="hidden sm:inline">{tab.label}</span>
                {renderBadge(tab.id)}
              </button>
            );
          })}
        </div>
      </nav>

      {/* Tab Content */}
      <main className="flex-1 overflow-auto p-4 sm:p-6">
        <div className="max-w-6xl mx-auto">
          {activeTab === 'market' && <MarketView />}
          {activeTab === 'barracks' && <BarracksView />}
          {activeTab === 'quests' && <QuestHallView />}
          {activeTab === 'stats' && <StatsView />}
          {activeTab === 'settings' && <SettingsView />}
        </div>
      </main>
    </div>
  );
}

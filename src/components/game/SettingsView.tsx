import { useState } from 'react';
import { useGame } from '@/context/GameContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Save, Download, Upload, RotateCcw, AlertTriangle,
  Copy, Check
} from 'lucide-react';
import { toast } from 'sonner';

export function SettingsView() {
  const { state, dispatch, manualSave, exportSave, importSave, resetGame } = useGame();
  const [importText, setImportText] = useState('');
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [resetConfirmText, setResetConfirmText] = useState('');
  const [copied, setCopied] = useState(false);

  const handleManualSave = () => {
    manualSave();
    toast.success('Game saved!');
  };

  const handleExport = async () => {
    const saveData = exportSave();
    try {
      await navigator.clipboard.writeText(saveData);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast.success('Save copied to clipboard!');
    } catch {
      toast.error('Failed to copy. Please copy manually.');
    }
  };

  const handleImport = () => {
    if (!importText.trim()) {
      toast.error('Please paste a save code');
      return;
    }
    
    const success = importSave(importText.trim());
    if (success) {
      setImportText('');
      toast.success('Save imported successfully!');
    } else {
      toast.error('Invalid save code');
    }
  };

  const handleReset = () => {
    if (resetConfirmText !== 'RESET') {
      toast.error('Type RESET to confirm');
      return;
    }
    
    resetGame();
    setShowResetConfirm(false);
    setResetConfirmText('');
    toast.success('Game reset!');
  };

  const formatPlayTime = () => {
    const ms = Date.now() - state.gameStartTime;
    const days = Math.floor(ms / (24 * 60 * 60 * 1000));
    const hours = Math.floor((ms % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
    return `${days}d ${hours}h`;
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold">Settings</h2>
        <p className="text-muted-foreground">Manage your save data</p>
      </div>

      {/* Game Info */}
      <div className="bg-card rounded-lg p-4 space-y-2">
        <h3 className="font-semibold">Game Info</h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-muted-foreground">Play Time:</span>
            <span className="ml-2 font-mono">{formatPlayTime()}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Total Pulls:</span>
            <span className="ml-2 font-mono">{state.totalPulls}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Roster:</span>
            <span className="ml-2 font-mono">{state.roster.length}/{state.rosterSlots}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Quests Completed:</span>
            <span className="ml-2 font-mono">{state.totalQuestsCompleted}</span>
          </div>
        </div>
      </div>

      {/* Manual Save */}
      <div className="bg-card rounded-lg p-4 space-y-4">
        <div>
          <h3 className="font-semibold">Manual Save</h3>
          <p className="text-sm text-muted-foreground">
            Game auto-saves every 5 seconds. Use this to force an immediate save.
          </p>
        </div>
        <Button onClick={handleManualSave} className="w-full sm:w-auto">
          <Save className="w-4 h-4 mr-2" />
          Save Now
        </Button>
      </div>

      {/* Export Save */}
      <div className="bg-card rounded-lg p-4 space-y-4">
        <div>
          <h3 className="font-semibold">Export Save</h3>
          <p className="text-sm text-muted-foreground">
            Copy your save data as a Base64 code. Store it somewhere safe!
          </p>
        </div>
        <Button onClick={handleExport} variant="secondary" className="w-full sm:w-auto">
          {copied ? (
            <>
              <Check className="w-4 h-4 mr-2" />
              Copied!
            </>
          ) : (
            <>
              <Copy className="w-4 h-4 mr-2" />
              Copy Save Code
            </>
          )}
        </Button>
      </div>

      {/* Import Save */}
      <div className="bg-card rounded-lg p-4 space-y-4">
        <div>
          <h3 className="font-semibold">Import Save</h3>
          <p className="text-sm text-muted-foreground">
            Paste a save code to restore your progress. This will overwrite your current game!
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <Input
            placeholder="Paste save code here..."
            value={importText}
            onChange={(e) => setImportText(e.target.value)}
            className="flex-1 font-mono text-sm"
          />
          <Button onClick={handleImport} variant="secondary">
            <Upload className="w-4 h-4 mr-2" />
            Import
          </Button>
        </div>
      </div>

      {/* Reset Game */}
      <div className="bg-card rounded-lg p-4 space-y-4 border border-destructive/30">
        <div>
          <h3 className="font-semibold text-destructive flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            Reset Game
          </h3>
          <p className="text-sm text-muted-foreground">
            Permanently delete all progress and start fresh. This cannot be undone!
          </p>
        </div>
        
        {!showResetConfirm ? (
          <Button 
            onClick={() => setShowResetConfirm(true)} 
            variant="destructive"
            className="w-full sm:w-auto"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Reset Game
          </Button>
        ) : (
          <div className="space-y-3 p-3 bg-destructive/10 rounded-lg">
            <p className="text-sm font-medium text-destructive">
              Type "RESET" to confirm:
            </p>
            <div className="flex flex-col sm:flex-row gap-2">
              <Input
                placeholder="Type RESET"
                value={resetConfirmText}
                onChange={(e) => setResetConfirmText(e.target.value.toUpperCase())}
                className="flex-1 font-mono"
              />
              <div className="flex gap-2">
                <Button 
                  onClick={handleReset} 
                  variant="destructive"
                  disabled={resetConfirmText !== 'RESET'}
                >
                  Confirm Reset
                </Button>
                <Button 
                  onClick={() => {
                    setShowResetConfirm(false);
                    setResetConfirmText('');
                  }} 
                  variant="ghost"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
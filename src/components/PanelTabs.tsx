import { NotebookTabs, Settings } from 'lucide-react';
import type { PanelId } from '../types';

type PanelTabsProps = {
  activePanel: PanelId;
  onChange: (panel: PanelId) => void;
};

export function PanelTabs({ activePanel, onChange }: PanelTabsProps) {
  return (
    <div className="panel-tabs" role="tablist" aria-label="사이드 패널">
      <button className={activePanel === 'plan' ? 'active' : ''} onClick={() => onChange('plan')} type="button">
        <NotebookTabs size={17} />
        <span>계획 노트</span>
      </button>
      <button className={activePanel === 'settings' ? 'active' : ''} onClick={() => onChange('settings')} type="button">
        <Settings size={17} />
        <span>설정</span>
      </button>
    </div>
  );
}

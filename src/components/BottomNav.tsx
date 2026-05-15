import { MessageCircle, NotebookTabs, Settings } from 'lucide-react';
import type { TabId } from '../types';

type BottomNavProps = {
  activeTab: TabId;
  onChange: (tab: TabId) => void;
};

const tabs = [
  { id: 'chat' as const, label: '채팅', icon: MessageCircle },
  { id: 'plan' as const, label: '계획 노트', icon: NotebookTabs },
  { id: 'settings' as const, label: '설정', icon: Settings },
];

export function BottomNav({ activeTab, onChange }: BottomNavProps) {
  return (
    <nav className="bottom-nav" aria-label="주요 탭">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        return (
          <button className={activeTab === tab.id ? 'active' : ''} key={tab.id} onClick={() => onChange(tab.id)} type="button">
            <Icon size={20} />
            <span>{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
}

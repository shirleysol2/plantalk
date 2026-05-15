import { Bell, UsersRound, WandSparkles } from 'lucide-react';
import type { Member } from '../types';

type SettingsViewProps = {
  members: Member[];
  summaryStyles: string[];
  summaryStyle: string;
  onSummaryStyleChange: (style: string) => void;
};

export function SettingsView({ members, summaryStyles, summaryStyle, onSummaryStyleChange }: SettingsViewProps) {
  return (
    <div className="settings-view">
      <div className="panel-heading">
        <p className="eyebrow">설정</p>
        <h2>방 설정</h2>
      </div>

      <section className="plan-card">
        <div className="card-title">
          <UsersRound size={18} />
          <h3>멤버</h3>
        </div>
        <div className="member-list">
          {members.map((member) => (
            <div className="member-item" key={member.id}>
              <div className="avatar">{member.initials}</div>
              <div>
                <strong>{member.name}</strong>
                <span>{member.role}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="plan-card">
        <div className="card-title">
          <Bell size={18} />
          <h3>알림</h3>
        </div>
        <label className="toggle-row">
          <span>결정 필요 알림</span>
          <input defaultChecked type="checkbox" />
        </label>
        <label className="toggle-row">
          <span>마감 전 리마인드</span>
          <input defaultChecked type="checkbox" />
        </label>
      </section>

      <section className="plan-card">
        <div className="card-title">
          <WandSparkles size={18} />
          <h3>AI 요약 스타일</h3>
        </div>
        <div className="segmented">
          {summaryStyles.map((style) => (
            <button
              className={style === summaryStyle ? 'selected' : ''}
              key={style}
              onClick={() => onSummaryStyleChange(style)}
              type="button"
            >
              {style}
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}

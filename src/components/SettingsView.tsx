import { Bell, Image, UsersRound, WandSparkles } from 'lucide-react';
import { useRef } from 'react';
import type { Member, Profile } from '../types';

type SettingsViewProps = {
  members: Member[];
  profile: Profile;
  summaryStyles: string[];
  summaryStyle: string;
  userCode: string;
  onProfileChange: (updates: Partial<Pick<Profile, 'nickname' | 'image'>>) => void;
  onSummaryStyleChange: (style: string) => void;
};

const profileImages = ['☁️', '✈️', '🌴', '🍋', '🧳'];

export function SettingsView({
  members,
  profile,
  summaryStyles,
  summaryStyle,
  userCode,
  onProfileChange,
  onSummaryStyleChange,
}: SettingsViewProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageFile = (file?: File) => {
    if (!file || !file.type.startsWith('image/')) return;

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        onProfileChange({ image: reader.result });
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="settings-view">
      <div className="panel-heading">
        <p className="eyebrow">설정</p>
        <h2>방 설정</h2>
      </div>

      <section className="plan-card profile-edit-card">
        <div className="card-title">
          <Image size={18} />
          <h3>내 프로필</h3>
        </div>
        <div className="profile-edit-row">
          <button
            aria-label="프로필 이미지 변경"
            className="profile-edit-image"
            onClick={() => fileInputRef.current?.click()}
            type="button"
          >
            {profile.image.startsWith('data:') ? <img src={profile.image} alt="" /> : profile.image}
          </button>
          <input
            ref={fileInputRef}
            accept="image/*"
            className="sr-only"
            type="file"
            onChange={(event) => handleImageFile(event.target.files?.[0])}
          />
          <label>
            닉네임
            <input
              maxLength={12}
              value={profile.nickname}
              onChange={(event) => onProfileChange({ nickname: event.target.value })}
            />
          </label>
        </div>
        <div className="profile-image-grid compact">
          {profileImages.map((image) => (
            <button
              className={profile.image === image ? 'selected' : ''}
              key={image}
              onClick={() => onProfileChange({ image })}
              type="button"
            >
              {image}
            </button>
          ))}
        </div>
      </section>

      <section className="plan-card">
        <div className="card-title">
          <UsersRound size={18} />
          <h3>내 페이지 코드</h3>
        </div>
        <div className="user-code-card">{userCode}</div>
      </section>

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

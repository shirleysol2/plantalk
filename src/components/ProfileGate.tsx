import { Image, LogIn } from 'lucide-react';
import { FormEvent, useState } from 'react';
import type { Profile } from '../types';

type ProfileGateProps = {
  onComplete: (profile: Profile) => void;
};

const profileImages = ['☁️', '✈️', '🌴', '🍋', '🧳'];

export function ProfileGate({ onComplete }: ProfileGateProps) {
  const [nickname, setNickname] = useState('솔');
  const [selectedImage, setSelectedImage] = useState(profileImages[1]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedName = nickname.trim();

    if (!trimmedName) return;

    onComplete({
      nickname: trimmedName,
      image: selectedImage,
    });
  };

  return (
    <main className="profile-gate">
      <div className="sky-sticker cloud-one" />
      <div className="sky-sticker cloud-two" />
      <div className="plane-sticker" />
      <form className="profile-card" onSubmit={handleSubmit}>
        <span className="profile-label">여행방 입장 전</span>
        <h1>
          <span>프로필 설정</span>
          <em>PlanTalk</em>
        </h1>
        <label className="profile-field">
          <span>닉네임</span>
          <input value={nickname} onChange={(event) => setNickname(event.target.value)} maxLength={12} />
        </label>
        <div className="profile-field">
          <span>
            <Image size={18} />
            프로필 이미지
          </span>
          <div className="profile-image-grid">
            {profileImages.map((image) => (
              <button
                className={selectedImage === image ? 'selected' : ''}
                key={image}
                onClick={() => setSelectedImage(image)}
                type="button"
              >
                {image}
              </button>
            ))}
          </div>
        </div>
        <button className="profile-submit" type="submit">
          <LogIn size={18} />
          채팅방 입장
        </button>
      </form>
    </main>
  );
}

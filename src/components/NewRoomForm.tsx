import { Plus, X } from 'lucide-react';
import { FormEvent, useState } from 'react';

type NewRoomFormProps = {
  onCreateRoom: (input: { title: string; destination: string; period: string }) => void;
};

export function NewRoomForm({ onCreateRoom }: NewRoomFormProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [destination, setDestination] = useState('');
  const [period, setPeriod] = useState('');

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!title.trim() || !destination.trim() || !period.trim()) return;

    onCreateRoom({
      title: title.trim(),
      destination: destination.trim(),
      period: period.trim(),
    });
    setTitle('');
    setDestination('');
    setPeriod('');
    setIsOpen(false);
  };

  if (!isOpen) {
    return (
      <button className="new-room-toggle" onClick={() => setIsOpen(true)} type="button">
        <Plus size={17} />
        새 채팅방
      </button>
    );
  }

  return (
    <form className="new-room-form" onSubmit={handleSubmit}>
      <div>
        <strong>새 채팅방</strong>
        <button aria-label="닫기" onClick={() => setIsOpen(false)} type="button">
          <X size={16} />
        </button>
      </div>
      <input aria-label="방 이름" placeholder="방 이름" value={title} onChange={(event) => setTitle(event.target.value)} />
      <input
        aria-label="여행지"
        placeholder="여행지 예: Busan"
        value={destination}
        onChange={(event) => setDestination(event.target.value)}
      />
      <input
        aria-label="일정"
        placeholder="일정 예: 6월 7일~6월 8일"
        value={period}
        onChange={(event) => setPeriod(event.target.value)}
      />
      <button type="submit">만들기</button>
    </form>
  );
}

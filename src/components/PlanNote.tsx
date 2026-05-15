import { CalendarCheck2, CheckCircle2, Circle, Clock3, Coins, ListTodo, MapPinned, Send, Vote } from 'lucide-react';
import type { BudgetItem, ChatRoom, DecisionItem, FinalPlan, ScheduleItem, TaskItem } from '../types';

type PlanNoteProps = {
  room: ChatRoom;
  rooms: ChatRoom[];
  activeRoomId: string;
  finalPlan: FinalPlan;
  scheduleItems: ScheduleItem[];
  tasks: TaskItem[];
  decisions: DecisionItem[];
  budgetItems: BudgetItem[];
  onSelectRoom: (roomId: string) => void;
  onToggleTask: (taskId: number) => void;
};

export function PlanNote({
  room,
  rooms,
  activeRoomId,
  finalPlan,
  scheduleItems,
  tasks,
  decisions,
  budgetItems,
  onSelectRoom,
  onToggleTask,
}: PlanNoteProps) {
  const total = budgetItems.reduce((sum, item) => sum + Number(item.amount.replace(/[^0-9]/g, '')), 0);

  return (
    <div className="plan-note">
      <div className="panel-heading">
        <p className="eyebrow">방금 정리된</p>
        <h2>{room.destination} 일정표</h2>
      </div>

      <div className="plan-room-switcher" aria-label="계획 노트 채팅방 선택">
        {rooms.map((item) => (
          <button
            className={activeRoomId === item.id ? 'active' : ''}
            key={item.id}
            onClick={() => onSelectRoom(item.id)}
            type="button"
          >
            <span>{item.destination.slice(0, 1)}</span>
            {item.title}
          </button>
        ))}
      </div>

      <section className="briefing-card">
        <div className="briefing-status">
          <span>{finalPlan.status}</span>
          <strong>{finalPlan.period}</strong>
        </div>
        <div className="briefing-title">
          <CalendarCheck2 size={22} />
          <div>
            <h3>{finalPlan.title}</h3>
            <p>{finalPlan.members} · 1인 예상 {total.toLocaleString('ko-KR')}원</p>
          </div>
        </div>
        <p className="briefing-summary">{finalPlan.summary}</p>
        <div className="day-brief-list">
          {finalPlan.days.map((day) => (
            <article className="day-brief" key={day.id}>
              <span>{day.day}</span>
              <strong>{day.title}</strong>
              <p>{day.route}</p>
              <div>
                {day.highlights.map((highlight) => (
                  <em key={highlight}>{highlight}</em>
                ))}
              </div>
            </article>
          ))}
        </div>
        <div className="share-briefing">
          <Send size={16} />
          <span>{finalPlan.shareText}</span>
        </div>
      </section>

      <section className="plan-card accent">
        <div className="card-title">
          <MapPinned size={18} />
          <h3>일정</h3>
        </div>
        <div className="timeline">
          {scheduleItems.map((item) => (
            <div className="timeline-item" key={item.id}>
              <span>{item.date}</span>
              <strong>{item.title}</strong>
              <em>{item.status}</em>
            </div>
          ))}
        </div>
      </section>

      <section className="plan-card">
        <div className="card-title">
          <ListTodo size={18} />
          <h3>할 일</h3>
        </div>
        <div className="task-list">
          {tasks.map((task) => (
            <button className={`task-item ${task.done ? 'done' : ''}`} key={task.id} onClick={() => onToggleTask(task.id)} type="button">
              {task.done ? <CheckCircle2 size={18} /> : <Circle size={18} />}
              <span>{task.title}</span>
              <small>{task.owner}</small>
            </button>
          ))}
        </div>
      </section>

      <section className="plan-card">
        <div className="card-title">
          <Vote size={18} />
          <h3>결정 필요</h3>
        </div>
        <div className="decision-list">
          {decisions.map((decision) => (
            <div className="decision-item" key={decision.id}>
              <strong>{decision.question}</strong>
              <div>
                {decision.options.map((option) => (
                  <span key={option}>{option}</span>
                ))}
              </div>
              <small>{decision.state}</small>
            </div>
          ))}
        </div>
      </section>

      <section className="plan-card">
        <div className="card-title">
          <Coins size={18} />
          <h3>예산</h3>
        </div>
        <div className="budget-total">
          <Clock3 size={16} />
          <span>1인 예상 {total.toLocaleString('ko-KR')}원</span>
        </div>
        <div className="budget-grid">
          {budgetItems.map((item) => (
            <div className="budget-item" key={item.id}>
              <span>{item.category}</span>
              <strong>{item.amount}</strong>
              <small>{item.note}</small>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

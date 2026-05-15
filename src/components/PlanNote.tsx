import { CheckCircle2, Circle, Clock3, Coins, ListTodo, MapPinned, Vote } from 'lucide-react';
import type { BudgetItem, DecisionItem, ScheduleItem, TaskItem } from '../types';

type PlanNoteProps = {
  scheduleItems: ScheduleItem[];
  tasks: TaskItem[];
  decisions: DecisionItem[];
  budgetItems: BudgetItem[];
  onToggleTask: (taskId: number) => void;
};

export function PlanNote({ scheduleItems, tasks, decisions, budgetItems, onToggleTask }: PlanNoteProps) {
  const total = budgetItems.reduce((sum, item) => sum + Number(item.amount.replace(/[^0-9]/g, '')), 0);

  return (
    <div className="plan-note">
      <div className="panel-heading">
        <p className="eyebrow">계획 노트</p>
        <h2>대화에서 정리된 계획</h2>
      </div>

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

export type TabId = 'chat' | 'plan' | 'settings';

export type PanelId = 'plan' | 'settings';

export type Message = {
  id: number;
  sender: string;
  initials: string;
  time: string;
  text: string;
  mine?: boolean;
  extraction?: {
    label: string;
    tone: 'schedule' | 'decision' | 'budget' | 'task';
  };
};

export type ScheduleItem = {
  id: number;
  date: string;
  title: string;
  status: string;
};

export type TaskItem = {
  id: number;
  title: string;
  owner: string;
  done: boolean;
};

export type DecisionItem = {
  id: number;
  question: string;
  options: string[];
  state: string;
};

export type BudgetItem = {
  id: number;
  category: string;
  amount: string;
  note: string;
};

export type FinalPlanDay = {
  id: number;
  day: string;
  title: string;
  route: string;
  highlights: string[];
};

export type FinalPlan = {
  title: string;
  period: string;
  members: string;
  status: string;
  summary: string;
  shareText: string;
  days: FinalPlanDay[];
};

export type Member = {
  id: number;
  name: string;
  initials: string;
  role: string;
};

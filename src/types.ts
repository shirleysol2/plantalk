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

export type AnalysisCandidateType = 'schedule' | 'task' | 'decision' | 'budget' | 'insight';

export type AnalysisCandidateStatus = 'pending' | 'confirmed' | 'held';

export type AnalysisCandidate = {
  id: number;
  type: AnalysisCandidateType;
  title: string;
  detail: string;
  sourceMessageId: number;
  sourceText: string;
  status: AnalysisCandidateStatus;
};

export type AnalyzeMessageInput = {
  message: Message;
  destination: string;
  nickname: string;
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

export type ChatRoom = {
  id: string;
  shareCode: string;
  createdByUserCode: string;
  joinedUserCodes: string[];
  title: string;
  subtitle: string;
  destination: string;
  period: string;
  coverTone: 'sky' | 'coral' | 'yellow';
  unread: number;
  lastMessage: string;
  messages: Message[];
  analysisCandidates: AnalysisCandidate[];
  scheduleItems: ScheduleItem[];
  tasks: TaskItem[];
  decisions: DecisionItem[];
  budgetItems: BudgetItem[];
  finalPlan: FinalPlan;
  members: Member[];
};

export type Profile = {
  nickname: string;
  image: string;
  userCode: string;
};

export type InfoLogEntry = {
  id: string;
  userCode: string;
  roomCode?: string;
  action: 'profile_created' | 'room_created' | 'room_opened' | 'share_link_copied' | 'message_applied';
  message: string;
  createdAt: string;
};

export type MessageApplyTarget = 'schedule' | 'task' | 'decision' | 'budget';

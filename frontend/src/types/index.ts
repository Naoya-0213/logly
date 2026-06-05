export type User = {
  id: string;
  email: string;
  display_name: string | null;
  created_at: string;
};

export type Category = {
  id: number;
  user_id: string;
  name: string;
  color: string;
  created_at: string;
};

export type StudyRecord = {
  id: number;
  user_id: string;
  category_id: number | null;
  study_date: string;
  duration_minutes: number;
  content: string | null;
  created_at: string;
  categories?: Category;
};

export type StudyStats = {
  total_minutes: number;
  this_month_minutes: number;
  today_minutes: number;
  streak_days: number;
};

export type Todo = {
  id: number;
  user_id: string;
  category_id: number | null;
  title: string;
  description: string | null;
  due_date: string | null;
  is_completed: boolean;
  created_at: string;
  categories?: Category;
};

export type Friendship = {
  id: number;
  requester_id: string;
  receiver_id: string;
  status: "pending" | "accepted";
  created_at: string;
  requester?: User;
  receiver?: User;
};

export type FriendWithStats = {
  id: string;
  display_name: string | null;
  email: string;
  monthly_minutes: number;
};

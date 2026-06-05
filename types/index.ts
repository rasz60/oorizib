export type { Database } from "./database";

export interface Profile {
  id: string;
  email: string;
  displayName: string;
  avatarUrl: string | null;
  pushToken: string | null;
}

export interface Group {
  id: string;
  name: string;
  description: string | null;
  inviteCode: string;
  ownerId: string;
  members: GroupMember[];
}

export interface GroupMember {
  id: string;
  groupId: string;
  userId: string;
  role: "owner" | "member";
  profile: Profile;
}

export interface Schedule {
  id: string;
  groupId: string;
  creatorId: string;
  title: string;
  description: string | null;
  startAt: string;
  endAt: string | null;
  isAllDay: boolean;
  isPersonal: boolean;
  color: string;
  remindOptions: RemindOption[];
  participants: Profile[];
}

export type RemindOption = "1day" | "30min" | "10min";

export interface Transaction {
  id: string;
  groupId: string;
  bankAccountId: string | null;
  type: "income" | "expense";
  amount: number;
  description: string;
  merchantName: string | null;
  category: string;
  tags: string[];
  transactedAt: string;
  isManual: boolean;
}

export interface Settlement {
  id: string;
  groupId: string;
  requesterId: string;
  targetUserId: string;
  transactionIds: string[];
  totalAmount: number;
  status: "pending" | "sender_confirmed" | "completed" | "cancelled";
  senderProofUrl: string | null;
  requesterProofUrl: string | null;
}

export interface WishlistItem {
  id: string;
  groupId: string;
  creatorId: string;
  title: string;
  reason: string | null;
  estimatedPrice: number | null;
  link: string | null;
  voteDeadline: string | null;
  purchaseDate: string | null;
  status: "voting" | "approved" | "rejected" | "purchased";
  voters: Profile[];
  votes: WishlistVote[];
}

export interface WishlistVote {
  userId: string;
  vote: "approve" | "reject";
}

export interface StockWatchlistItem {
  id: string;
  symbol: string;
  name: string;
  market: "KR" | "US";
  currentPrice?: number;
  changeRate?: number;
  changeAmount?: number;
}

export interface MyStock {
  id: string;
  symbol: string;
  name: string;
  market: "KR" | "US";
  purchasePrice: number;
  quantity: number;
  currentPrice?: number;
  profitRate?: number;
  dayChangeRate?: number;
}

export interface WhenAreYouComing {
  id: string;
  senderId: string;
  receiverId: string;
  expectedAt: string | null;
  status: "pending" | "responded" | "arrived" | "missed";
  isKept: boolean | null;
  senderProfile: Profile;
  receiverProfile: Profile;
}

export interface DidYouDo {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  scheduledDate: string | null;
  scheduledTime: string | null;
  status: "pending" | "responded";
  responseCheck: boolean | null;
  responseMemo: string | null;
}

export interface WhatToEat {
  id: string;
  groupId: string;
  creatorId: string;
  participantIds: string[];
  mealDate: string;
  mealType: "breakfast" | "lunch" | "dinner" | "latenight" | "snack";
  status: "collecting" | "tournament" | "done";
  winner: string | null;
  entries: WhatToEatEntry[];
}

export interface WhatToEatEntry {
  id: string;
  userId: string;
  foodName: string;
  isEliminated: boolean;
}

import { AppList, ExpenseLog, PaymentCard, SavingsAsset, User } from '../types';

/**
 * Checks whether a given user has permission to view and edit a specific list.
 * 
 * Rules:
 * 1. Owner: User is the creator (ownerId === user.id).
 * 2. Explicit Member: User is listed in list.members (via invite code or direct invitation).
 * 3. Family Member: The list is marked as a Family / Shared list (isShared !== false)
 *    AND both the user and the list belong to the same family (user.familyId === list.familyId).
 * 
 * If none of these conditions are met, the user CANNOT access the list.
 */
export function canUserAccessList(list: AppList | null | undefined, user: User | null | undefined): boolean {
  if (!list || !user) return false;

  // 1. Direct ownership
  if (list.ownerId === user.id) return true;

  // 2. Explicit member in list members array (by userId or matching username)
  if (list.members && Array.isArray(list.members)) {
    if (list.members.some((m) => m.userId === user.id || (user.username && (m as any).username === user.username))) {
      return true;
    }
  }

  // 3. Shared family list:
  const isListShared = list.isShared !== false;
  if (isListShared) {
    // Both belong to same family
    if (user.familyId && list.familyId && user.familyId === list.familyId) {
      return true;
    }
    // Shared list created without explicit familyId
    if (!list.familyId) {
      return true;
    }
  }

  return false;
}

/**
 * Checks whether a list is a Family / Shared list for the user.
 * Any accessible list that is marked as shared or not explicitly marked private is a shared/family list.
 */
export function isFamilyListForUser(list: AppList, user: User): boolean {
  if (!canUserAccessList(list, user)) return false;
  return list.isShared !== false;
}

/**
 * Checks whether a list is a Personal / Private list for the user.
 */
export function isPersonalListForUser(list: AppList, user: User): boolean {
  if (!canUserAccessList(list, user)) return false;
  return list.isShared === false;
}

/**
 * Filters a list collection to return only lists accessible by the user.
 */
export function getAccessibleLists(lists: AppList[], user: User): AppList[] {
  if (!lists || !Array.isArray(lists) || !user) return [];
  return lists.filter((l) => canUserAccessList(l, user));
}

/**
 * Checks whether a user can access a specific expense entry.
 */
export function canUserAccessExpense(expense: ExpenseLog | null | undefined, user: User | null | undefined): boolean {
  if (!expense || !user) return false;

  // Owner
  if (expense.userId === user.id) return true;

  // Shared family expense with matching familyId
  const isShared = expense.isShared !== false;
  if (isShared && user.familyId && expense.familyId && user.familyId === expense.familyId) {
    return true;
  }

  // Explicit sharedWith list
  if (expense.sharedWith && Array.isArray(expense.sharedWith) && expense.sharedWith.includes(user.id)) {
    return true;
  }

  return false;
}

/**
 * Filters expenses to return only those accessible by the user.
 */
export function getAccessibleExpenses(expenses: ExpenseLog[], user: User): ExpenseLog[] {
  if (!expenses || !Array.isArray(expenses) || !user) return [];
  return expenses.filter((e) => canUserAccessExpense(e, user));
}

/**
 * Checks whether a user can access a specific savings asset.
 */
export function canUserAccessSavings(savings: SavingsAsset | null | undefined, user: User | null | undefined): boolean {
  if (!savings || !user) return false;

  // Owner
  if (savings.userId === user.id) return true;

  // Shared family savings with matching familyId
  const isShared = savings.isShared !== false;
  if (isShared && user.familyId && savings.familyId && user.familyId === savings.familyId) {
    return true;
  }

  // Explicit sharedWith list
  if (savings.sharedWith && Array.isArray(savings.sharedWith) && savings.sharedWith.includes(user.id)) {
    return true;
  }

  return false;
}

/**
 * Filters savings goals/assets to return only those accessible by the user.
 */
export function getAccessibleSavings(savings: SavingsAsset[], user: User): SavingsAsset[] {
  if (!savings || !Array.isArray(savings) || !user) return [];
  return savings.filter((s) => canUserAccessSavings(s, user));
}

/**
 * Checks whether a user can access a specific payment card.
 */
export function canUserAccessCard(card: PaymentCard | null | undefined, user: User | null | undefined): boolean {
  if (!card || !user) return false;

  // Owner
  if (card.userId === user.id) return true;

  // Shared family card with matching familyId
  const isShared = card.isShared !== false;
  if (isShared && user.familyId && card.familyId && user.familyId === card.familyId) {
    return true;
  }

  return false;
}

/**
 * Filters cards to return only those accessible by the user.
 */
export function getAccessibleCards(cards: PaymentCard[], user: User): PaymentCard[] {
  if (!cards || !Array.isArray(cards) || !user) return [];
  return cards.filter((c) => canUserAccessCard(c, user));
}


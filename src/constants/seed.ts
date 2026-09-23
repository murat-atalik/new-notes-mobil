import { strings } from '../strings/tr';
import type { AppList } from '../types';
import { uid } from '../utils/id';

const seedStrings = strings.seed;

export const initialLists: AppList[] = [
  {
    id: 'shopping',
    title: seedStrings.shoppingTitle,
    description: seedStrings.shoppingDescription,
    type: 'SHOPPING',
    isShared: true,
    updatedAt: seedStrings.today,
    items: [
      {
        id: uid(),
        title: seedStrings.milk,
        quantity: 2,
        price: 80,
        isCompleted: false,
      },
      {
        id: uid(),
        title: seedStrings.eggs,
        quantity: 1,
        price: 120,
        isCompleted: true,
      },
      {
        id: uid(),
        title: seedStrings.bread,
        quantity: 2,
        price: 40,
        isCompleted: false,
      },
    ],
  },
  {
    id: 'todos',
    title: seedStrings.todosTitle,
    description: seedStrings.todosDescription,
    type: 'TODO',
    isShared: true,
    updatedAt: seedStrings.yesterday,
    items: [
      { id: uid(), title: seedStrings.payBills, priority: 'HIGH', isCompleted: false },
      { id: uid(), title: seedStrings.foldLaundry, priority: 'MEDIUM', isCompleted: true },
    ],
  },
  {
    id: 'notes',
    title: seedStrings.notesTitle,
    description: seedStrings.notesDescription,
    type: 'NOTE',
    isShared: false,
    updatedAt: seedStrings.notesDate,
    items: [
      {
        id: uid(),
        title: seedStrings.weekendPlan,
        content: seedStrings.weekendPlanContent,
        isPinned: true,
        isCompleted: false,
      },
      {
        id: uid(),
        title: seedStrings.bookIdeas,
        content: seedStrings.bookIdeasContent,
        isPinned: false,
        isCompleted: false,
      },
    ],
  },
];

import { Frequency } from "./frequency.enum"

export interface RecurringExpenseRead {
    id: string,
    amount: number,
    description?: string,
    frequency: Frequency,
    nextDueDate?: string,
    categoryId: string,
    categoryName: string,
    categoryColor: string
}

export interface RecurringExpenseDue {
    id: string,
    amount: number,
    description?: string,
    frequency: Frequency,
    categoryId: string,
    categoryName: string,
    categoryColor: string
}

export interface RecurringExpenseCreate {
    amount: number,
    description?: string,
    frequency: Frequency,
    startDate: Date,
    categoryId: string
}

export interface RecurringExpenseConfirm {
    amount: number,
    description: string,
    updateTemplate: boolean
}

export interface RecurringExpenseUpdate {
    amount?: number,
    description?: string,
    frequency?: Frequency
}
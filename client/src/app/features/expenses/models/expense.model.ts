import { Frequency } from "@features/recurring-expenses/models/frequency.enum"

export interface ExpenseRead
{
    id: string,
    amount: number,
    description?: string,
    date: Date, //DateOnly
    createdAt: Date,
    categoryId: string,
    categoryName: string,
    categoryColor: string
}

export interface ExpenseCreate 
{
    amount: number,
    description?: string,
    date: Date, //DateOnly,
    categoryId: string,
    frequency: Frequency
}

export interface ExpenseUpdate 
{
    amount?: number,
    description?: string,
    date?: Date, //DateOnly,
    categoryId?: string,
}
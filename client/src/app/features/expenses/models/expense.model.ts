export interface ExpenseRead
{
    id: string,
    amount: number,
    description?: string,
    date: Date, //DateOnly
    createdAt: Date,
    categoryId: string,
    categoryName: string
}

export interface ExpenseCreate 
{
    amount: number,
    description?: string,
    date: Date, //DateOnly,
    categoryId: string,
}

export interface ExpenseUpdate 
{
    amount?: number,
    description?: string,
    date?: Date, //DateOnly,
    categoryId?: string,
}
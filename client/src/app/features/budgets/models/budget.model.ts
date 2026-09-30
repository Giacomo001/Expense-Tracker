export interface BudgetRead {
    id: string,
    amount: number,
    categoryId: string,
    categoryName: string,
    categoryColor: string
}

export interface BudgetCreate {
    amount: number,
    categoryId: string
}

export interface BudgetUpdate {
    amount?: number
}
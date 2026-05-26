export interface CategoryRead {
    id: string,
    name: string
}

export interface CategoryCreate {
    name: string
}

export interface CategoryUpdate {
    name?: string
}
export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export interface Database {
    public: {
        Tables: {
            inventory: {
                Row: {
                    id: string
                    item_name: string
                    item_id: string
                    zone: string
                    quantity: number
                    min_stock: number | null
                    created_at: string | null
                    updated_at: string | null
                }
                Insert: {
                    id?: string
                    item_name: string
                    item_id: string
                    zone: string
                    quantity?: number
                    min_stock?: number | null
                    created_at?: string | null
                    updated_at?: string | null
                }
                Update: {
                    id?: string
                    item_name?: string
                    item_id?: string
                    zone?: string
                    quantity?: number
                    min_stock?: number | null
                    created_at?: string | null
                    updated_at?: string | null
                }
                Relationships: []
            }
            movements: {
                Row: {
                    id: string
                    worker_id: string
                    item_id: string
                    from_zone: string
                    to_zone: string
                    approved: boolean | null
                    risk_level: string | null
                    time: string | null
                    created_at: string | null
                }
                Insert: {
                    id?: string
                    worker_id: string
                    item_id: string
                    from_zone: string
                    to_zone: string
                    approved?: boolean | null
                    risk_level?: string | null
                    time?: string | null
                    created_at?: string | null
                }
                Update: {
                    id?: string
                    worker_id?: string
                    item_id?: string
                    from_zone?: string
                    to_zone?: string
                    approved?: boolean | null
                    risk_level?: string | null
                    time?: string | null
                    created_at?: string | null
                }
                Relationships: []
            }
            alerts: {
                Row: {
                    id: string
                    type: string
                    message: string
                    level: string
                    related_item_id: string | null
                    related_worker_id: string | null
                    created_at: string | null
                }
                Insert: {
                    id?: string
                    type: string
                    message: string
                    level: string
                    related_item_id?: string | null
                    related_worker_id?: string | null
                    created_at?: string | null
                }
                Update: {
                    id?: string
                    type?: string
                    message?: string
                    level?: string
                    related_item_id?: string | null
                    related_worker_id?: string | null
                    created_at?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "alerts_related_item_id_fkey"
                        columns: ["related_item_id"]
                        referencedRelation: "inventory"
                        referencedColumns: ["id"]
                    }
                ]
            }
            user_roles: {
                Row: {
                    id: string
                    role: string
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id: string
                    role?: string
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    role?: string
                    created_at?: string
                    updated_at?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "user_roles_id_fkey"
                        columns: ["id"]
                        referencedRelation: "users"
                        referencedColumns: ["id"]
                    }
                ]
            }
            profiles: {
                Row: {
                    id: string
                    email: string
                    full_name: string | null
                    phone: string | null
                    role: string | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id: string
                    email: string
                    full_name?: string | null
                    phone?: string | null
                    role?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    email?: string
                    full_name?: string | null
                    phone?: string | null
                    role?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "profiles_id_fkey"
                        columns: ["id"]
                        referencedRelation: "users"
                        referencedColumns: ["id"]
                    }
                ]
            }
            dprs: {
                Row: {
                    id: string
                    date: string
                    work_done: string
                    labor_count: number | null
                    materials_used: string | null
                    issues: string | null
                    photos: string[] | null
                    videos: string[] | null
                    full_text: string | null
                    short_summary: string | null
                    created_by: string | null
                    project: string | null
                    created_at: string | null
                    updated_at: string | null
                }
                Insert: {
                    id?: string
                    date: string
                    work_done: string
                    labor_count?: number | null
                    materials_used?: string | null
                    issues?: string | null
                    photos?: string[] | null
                    videos?: string[] | null
                    full_text?: string | null
                    short_summary?: string | null
                    created_by?: string | null
                    project?: string | null
                    created_at?: string | null
                    updated_at?: string | null
                }
                Update: {
                    id?: string
                    date?: string
                    work_done?: string
                    labor_count?: number | null
                    materials_used?: string | null
                    issues?: string | null
                    photos?: string[] | null
                    videos?: string[] | null
                    full_text?: string | null
                    short_summary?: string | null
                    created_by?: string | null
                    project?: string | null
                    created_at?: string | null
                    updated_at?: string | null
                }
                Relationships: []
            }
            attendance_requests: {
                Row: {
                    id: string
                    worker_id: string
                    worker_name: string
                    worker_email: string
                    request_date: string
                    request_time: string | null
                    location_lat: number
                    location_lng: number
                    is_within_zone: boolean
                    status: string | null
                    approved_by: string | null
                    approved_at: string | null
                    created_at: string | null
                    updated_at: string | null
                }
                Insert: {
                    id?: string
                    worker_id: string
                    worker_name: string
                    worker_email: string
                    request_date?: string
                    request_time?: string | null
                    location_lat: number
                    location_lng: number
                    is_within_zone?: boolean
                    status?: string | null
                    approved_by?: string | null
                    approved_at?: string | null
                    created_at?: string | null
                    updated_at?: string | null
                }
                Update: {
                    id?: string
                    worker_id?: string
                    worker_name?: string
                    worker_email?: string
                    request_date?: string
                    request_time?: string | null
                    location_lat?: number
                    location_lng?: number
                    is_within_zone?: boolean
                    status?: string | null
                    approved_by?: string | null
                    approved_at?: string | null
                    created_at?: string | null
                    updated_at?: string | null
                }
                Relationships: []
            }
            daily_attendance: {
                Row: {
                    id: string
                    attendance_date: string
                    present_worker_ids: string[]
                    total_workers_present: number | null
                    marked_by: string
                    marked_at: string | null
                    created_at: string | null
                    updated_at: string | null
                }
                Insert: {
                    id?: string
                    attendance_date: string
                    present_worker_ids?: string[]
                    total_workers_present?: number | null
                    marked_by: string
                    marked_at?: string | null
                    created_at?: string | null
                    updated_at?: string | null
                }
                Update: {
                    id?: string
                    attendance_date?: string
                    present_worker_ids?: string[]
                    total_workers_present?: number | null
                    marked_by?: string
                    marked_at?: string | null
                    created_at?: string | null
                    updated_at?: string | null
                }
                Relationships: []
            }
        }
        Views: {
            [_ in never]: never
        }
        Functions: {
            [_ in never]: never
        }
        Enums: {
            [_ in never]: never
        }
        CompositeTypes: {
            [_ in never]: never
        }
    }
}

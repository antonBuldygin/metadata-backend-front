
import { TableDef, FieldDef, EntityRecord } from './types';
// ...


const API_URL = "http://localhost:8080/api";

// ==================== ТАБЛИЦЫ ====================

export async function getTables(): Promise<TableDef[]> {
    const res = await fetch(`${API_URL}/tables`, { cache: 'no-store' });
    if (!res.ok) throw new Error("Ошибка загрузки таблиц");
    return res.json();
}

export async function createTable(data: TableDef): Promise<TableDef> {
    const res = await fetch(`${API_URL}/tables`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Ошибка создания таблицы");
    return res.json();
}

export async function getTable(id: string): Promise<TableDef> {
    const res = await fetch(`${API_URL}/tables/${id}`, { cache: 'no-store' });
    if (!res.ok) throw new Error("Ошибка загрузки таблицы");
    return res.json();
}

// ==================== ПОЛЯ (КОЛОНКИ) ====================

export async function getFields(tableId: string): Promise<FieldDef[]> {
    const res = await fetch(`${API_URL}/tables/${tableId}/fields`, { cache: 'no-store' });
    if (!res.ok) throw new Error("Ошибка загрузки полей");
    return res.json();
}

export async function createField(tableId: string, data: FieldDef): Promise<FieldDef> {
    const res = await fetch(`${API_URL}/tables/${tableId}/fields`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
    });
    if (!res.ok) {
        const errorText = await res.text();
        console.error(`Ошибка бэкенда (${res.status}):`, errorText);
        throw new Error("Ошибка создания поля");
    }
    return res.json();
}

export async function updateField(tableId: string, fieldId: number, data: FieldDef): Promise<FieldDef> {
    const res = await fetch(`${API_URL}/tables/${tableId}/fields/${fieldId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Ошибка обновления поля");
    return res.json();
}

export async function deleteField(tableId: string, fieldId: number): Promise<void> {
    const res = await fetch(`${API_URL}/tables/${tableId}/fields/${fieldId}`, {
        method: "DELETE",
    });
    if (!res.ok) throw new Error("Ошибка удаления поля");
}

// ==================== ЗАПИСИ (ДАННЫЕ) ====================

export async function getRecords(tableName: string): Promise<EntityRecord[]> {
    const res = await fetch(`${API_URL}/data/${tableName}`, { cache: 'no-store' });
    if (!res.ok) {
        const errorText = await res.text();
        console.error(`Ошибка бэкенда (${res.status}):`, errorText);
        throw new Error("Ошибка загрузки записей");
    }
    return res.json();
}

export async function createRecord(tableName: string, data: Record<string, unknown>): Promise<void> {
    const res = await fetch(`${API_URL}/data/${tableName}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
    });
    if (!res.ok) {
        const errorText = await res.text();
        console.error(`Ошибка бэкенда (${res.status}):`, errorText);
        throw new Error("Ошибка сохранения записи");
    }
}

export async function updateRecord(tableName: string, id: number, data: Record<string, unknown>): Promise<void> {
    const res = await fetch(`${API_URL}/data/${tableName}/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
    });
    if (!res.ok) {
        const errorText = await res.text();
        console.error(`Ошибка бэкенда (${res.status}):`, errorText);
        throw new Error("Ошибка обновления записи");
    }
}

export async function deleteRecord(tableName: string, id: number): Promise<void> {
    const res = await fetch(`${API_URL}/data/${tableName}/${id}`, {
        method: "DELETE",
    });
    if (!res.ok) throw new Error("Ошибка удаления записи");
}
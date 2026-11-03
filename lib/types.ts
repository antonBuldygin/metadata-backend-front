export type FieldType = 'STRING' | 'TEXT' | 'INTEGER' | 'LONG' | 'DECIMAL' | 'BOOLEAN' | 'DATE' | 'DATETIME' | 'RELATION';

export interface TableDef {
    id?: number;
    systemName: string;
    displayName: string;
    fields?: FieldDef[];
}

export interface FieldDef {
    id?: number;
    systemName: string;
    displayName: string;
    type: FieldType;
    visibleOnDetails: boolean;
    visibleOnList: boolean;
    // Новые поля для связей
    targetTableName?: string | null;
    targetDisplayField?: string | null;
}

// Тип для значения поля в записи (строка, число, булево или null)
export type EntityValue = string | number | boolean | null;

// Тип для самой записи (динамический объект с id и version)
export interface EntityRecord {
    id?: number;
    version?: number;
    [key: string]: EntityValue | undefined;
}
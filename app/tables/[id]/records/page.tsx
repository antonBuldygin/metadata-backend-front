"use client";

import { Suspense, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { getTable, getFields, getRecords, createRecord, updateRecord, deleteRecord } from "../../../../lib/api";
import { TableDef, FieldDef, EntityRecord, EntityValue } from "../../../../lib/types";

function TableRecordsContent() {
    const params = useParams();
    const id = params.id as string;

    const [table, setTable] = useState<TableDef | null>(null);
    const [fields, setFields] = useState<FieldDef[]>([]);
    const [records, setRecords] = useState<EntityRecord[]>([]);
    const [relationOptions, setRelationOptions] = useState<Record<string, EntityRecord[]>>({});
    const [isLoading, setIsLoading] = useState(true);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formData, setFormData] = useState<EntityRecord>({});
    const [editingId, setEditingId] = useState<number | null>(null);

    const loadRecords = async (tableName: string) => {
        try {
            const data = await getRecords(tableName);
            setRecords(data);
        } catch (error) {
            console.error("Ошибка загрузки записей:", error);
        }
    };

    useEffect(() => {
        if (!id) return;
        let ignore = false;

        const fetchData = async () => {
            try {
                const tableData = await getTable(id);
                const fieldsData = await getFields(id);

                if (!ignore) {
                    setTable(tableData);
                    setFields(fieldsData);

                    const optionsData: Record<string, EntityRecord[]> = {};
                    const relationFields = fieldsData.filter((f: FieldDef) => f.type === 'RELATION');
                    for (const rf of relationFields) {
                        if (rf.targetTableName) {
                            try {
                                optionsData[rf.systemName] = await getRecords(rf.targetTableName);
                            } catch (e) { console.error(e); }
                        }
                    }
                    setRelationOptions(optionsData);
                    await loadRecords(tableData.systemName);
                    setIsLoading(false);
                }
            } catch (error) {
                if (!ignore) setIsLoading(false);
            }
        };
        fetchData();
        return () => { ignore = true; };
    }, [id]);

    const openCreateModal = () => { setFormData({}); setEditingId(null); setIsModalOpen(true); };
    const openEditModal = (record: EntityRecord) => { setFormData(record); setEditingId(record.id as number); setIsModalOpen(true); };
    const closeModal = () => { setIsModalOpen(false); setFormData({}); setEditingId(null); };

    const handleInputChange = (fieldName: string, value: EntityValue) => {
        setFormData((prev) => ({ ...prev, [fieldName]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!table) return;
        try {
            if (editingId) await updateRecord(table.systemName, editingId, formData);
            else await createRecord(table.systemName, formData);
            closeModal();
            await loadRecords(table.systemName);
        } catch (error) {
            alert(error instanceof Error ? error.message : "Ошибка");
        }
    };

    const handleDelete = async (recordId: number) => {
        if (!table || !confirm("Удалить запись?")) return;
        try {
            await deleteRecord(table.systemName, recordId);
            await loadRecords(table.systemName);
        } catch (error) { alert("Ошибка удаления"); }
    };

    if (isLoading || !table) return <div className="p-8 text-center">Загрузка...</div>;

    const fieldsForList = fields.filter(f => f.visibleOnList);

    return (
        <div className="p-8 max-w-6xl mx-auto font-sans">
            <div className="mb-6">
                <Link href={`/tables/${id}`} className="text-blue-600 hover:underline mb-2 inline-block">← Назад к настройкам</Link>
                <div className="flex justify-between items-center">
                    <h1 className="text-2xl font-bold">Записи: {table.displayName}</h1>
                    <button onClick={openCreateModal} className="bg-blue-600 text-white px-5 py-2 rounded shadow hover:bg-blue-700">+ Добавить запись</button>
                </div>
            </div>

            <div className="overflow-x-auto border rounded-lg shadow-sm">
                <table className="w-full border-collapse bg-white">
                    <thead className="bg-gray-50 border-b">
                    <tr>
                        <th className="p-4 text-left text-sm text-gray-500 font-semibold w-16">ID</th>
                        {fieldsForList.map((field) => (
                            <th key={field.id} className="p-4 text-left text-sm text-gray-700 font-semibold">{field.displayName}</th>
                        ))}
                        <th className="p-4 text-center text-sm text-gray-700 font-semibold w-32">Действия</th>
                    </tr>
                    </thead>
                    <tbody>
                    {records.map((rec) => (
                        <tr key={rec.id} className="border-b hover:bg-gray-50 last:border-0">
                            <td className="p-4 text-sm text-gray-500">{rec.id}</td>
                            {fieldsForList.map((field) => {
                                // БЭКЕНД УЖЕ ВСЕ СДЕЛАЛ ЗА НАС
                                let val = rec[field.systemName + "_display"] || rec[field.systemName];
                                if (typeof val === 'boolean') val = val ? "Да" : "Нет";
                                return <td key={field.id} className="p-4 text-sm">{String(val ?? "")}</td>;
                            })}
                            <td className="p-4 text-sm flex justify-center gap-3">
                                <button onClick={() => openEditModal(rec)} className="text-blue-600 hover:underline">Ред.</button>
                                <button onClick={() => handleDelete(rec.id!)} className="text-red-600 hover:underline">Удал.</button>
                            </td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-lg shadow-xl w-[600px] max-h-[90vh] overflow-y-auto">
                        <h2 className="text-xl font-bold mb-6">{editingId ? `Редактировать #${editingId}` : "Добавить запись"}</h2>
                        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                            {editingId && (
                                <div>
                                    <label className="block text-sm text-gray-500 mb-1">ID (системное)</label>
                                    <input type="text" className="w-full border p-2 rounded bg-gray-100" value={editingId} disabled />
                                </div>
                            )}
                            {fields.filter(f => f.visibleOnDetails).map((field) => {
                                const actualKey = Object.keys(formData).find(k => k.toLowerCase() === field.systemName.toLowerCase());
                                const fieldValue = actualKey ? formData[actualKey] : "";

                                return (
                                    <div key={field.id}>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">{field.displayName}</label>
                                        {field.type === "RELATION" ? (
                                            <select className="w-full border p-2 rounded bg-white" value={(fieldValue as string | number) || ""} onChange={(e) => handleInputChange(field.systemName, e.target.value)}>
                                                <option value="">-- Выберите значение --</option>
                                                {(relationOptions[field.systemName] || []).map((opt: EntityRecord) => {
                                                    // Здесь тоже используем _display от бэкенда, если он есть
                                                    const displayValue = opt[field.targetDisplayField + "_display"] || opt[field.targetDisplayField || 'id'];
                                                    return <option key={opt.id} value={opt.id}>{String(displayValue)}</option>;
                                                })}
                                            </select>
                                        ) : field.type === "BOOLEAN" ? (
                                            <input type="checkbox" className="w-5 h-5" checked={(fieldValue as boolean) || false} onChange={(e) => handleInputChange(field.systemName, e.target.checked)} />
                                        ) : field.type === "DATE" || field.type === "DATETIME" ? (
                                            <input type={field.type === "DATE" ? "date" : "datetime-local"} className="w-full border p-2 rounded" value={(fieldValue as string | number) || ""} onChange={(e) => handleInputChange(field.systemName, e.target.value)} />
                                        ) : (
                                            <input type={field.type === "INTEGER" || field.type === "DECIMAL" ? "number" : "text"} className="w-full border p-2 rounded" value={(fieldValue as string | number) || ""} onChange={(e) => handleInputChange(field.systemName, e.target.value)} />
                                        )}
                                    </div>
                                );
                            })}
                            <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
                                <button type="button" onClick={closeModal} className="px-4 py-2 border rounded">Отмена</button>
                                <button type="submit" className="bg-blue-600 text-white px-6 py-2 rounded">Сохранить</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

export default function TableRecordsPage() {
    return (
        <Suspense fallback={<div className="p-8 text-center">Загрузка страницы...</div>}>
            <TableRecordsContent />
        </Suspense>
    );
}
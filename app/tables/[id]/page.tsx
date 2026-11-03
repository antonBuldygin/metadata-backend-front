"use client";

import { Suspense, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { TableDef, FieldDef, FieldType } from "../../../lib/types";
import { getTable, getFields, createField, getTables, updateField, deleteField } from "../../../lib/api";

function TableDetailsContent() {
    const params = useParams();
    const router = useRouter();
    const id = params.id as string;

    const [isEditingField, setIsEditingField] = useState(false);
    const [editingFieldId, setEditingFieldId] = useState<number | null>(null);
    const [table, setTable] = useState<TableDef | null>(null);
    const [fields, setFields] = useState<FieldDef[]>([]);
    const [allTables, setAllTables] = useState<TableDef[]>([]);
    const [targetTableFields, setTargetTableFields] = useState<FieldDef[]>([]);
    const [activeTab, setActiveTab] = useState<"fields" | "info">("fields");
    const [showCreateField, setShowCreateField] = useState(false);

    const [fieldForm, setFieldForm] = useState<FieldDef>({
        systemName: "", displayName: "", type: "STRING",
        visibleOnDetails: true, visibleOnList: true,
        targetTableName: "", targetDisplayField: "",
    });

    const refreshData = async () => {
        if (!id) return;
        try {
            const tableData = await getTable(id);
            const fieldsData = await getFields(id);
            const tablesData = await getTables();
            setTable(tableData);
            setFields(fieldsData);
            setAllTables(tablesData);
        } catch (error) { console.error(error); }
    };

    useEffect(() => {
        if (!id) return;
        let ignore = false;
        const fetchData = async () => {
            try {
                const tableData = await getTable(id);
                const fieldsData = await getFields(id);
                const tablesData = await getTables();
                if (!ignore) {
                    setTable(tableData);
                    setFields(fieldsData);
                    setAllTables(tablesData);
                }
            } catch (error) {
                if (!ignore) router.push("/");
            }
        };
        fetchData();
        return () => { ignore = true; };
    }, [id, router]);

    const handleSaveField = async () => {
        if (!fieldForm.systemName || !fieldForm.displayName) return alert("Заполните все поля");
        if (!isEditingField && !/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(fieldForm.systemName)) {
            return alert("Системное имя должно начинаться с буквы и содержать только латинские буквы, цифры и _");
        }

        try {
            if (isEditingField && editingFieldId) {
                await updateField(id, editingFieldId, fieldForm);
            } else {
                if (fieldForm.type === "RELATION" && (!fieldForm.targetTableName || !fieldForm.targetDisplayField)) {
                    return alert("Для связи укажите таблицу и поле отображения");
                }
                await createField(id, fieldForm);
            }
            closeFieldModal();
            await refreshData();
        } catch (error) { console.error(error); }
    };

    const openEditField = (field: FieldDef) => {
        setFieldForm(field);
        setEditingFieldId(field.id!);
        setIsEditingField(true);
        setShowCreateField(true);
        if (field.type === "RELATION" && field.targetTableName) {
            const tableObj = allTables.find(t => t.systemName === field.targetTableName);
            if (tableObj && tableObj.id) {
                getFields(tableObj.id.toString()).then(setTargetTableFields);
            }
        }
    };

    const handleDeleteField = async (fieldId: number) => {
        if (!confirm("Вы уверены, что хотите удалить это поле?")) return;
        try {
            await deleteField(id, fieldId);
            await refreshData();
        } catch (error) { alert("Ошибка удаления поля"); }
    };

    const openCreateField = () => {
        closeFieldModal();
        setShowCreateField(true);
    };

    const closeFieldModal = () => {
        setShowCreateField(false);
        setIsEditingField(false);
        setEditingFieldId(null);
        setFieldForm({ systemName: "", displayName: "", type: "STRING", visibleOnDetails: true, visibleOnList: true, targetTableName: "", targetDisplayField: "" });
        setTargetTableFields([]);
    };

    if (!table) return <div className="p-8 text-center">Загрузка...</div>;

    return (
        <div className="p-8 max-w-5xl mx-auto font-sans">
            <div className="mb-6">
                <Link href="/" className="text-blue-600 hover:underline mb-2 inline-block">← Назад к списку таблиц</Link>
                <div className="flex justify-between items-end">
                    <h1 className="text-2xl font-bold">{table.displayName} <span className="text-gray-500 text-lg font-normal">({table.systemName})</span></h1>
                    <Link href={`/tables/${id}/records`} className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700">Перейти к данным →</Link>
                </div>
            </div>

            <div className="border-b border-gray-300 mb-4 flex gap-4">
                <button onClick={() => setActiveTab("fields")} className={`pb-2 px-4 font-semibold ${activeTab === "fields" ? "border-b-2 border-blue-600 text-blue-600" : "text-gray-500"}`}>Поля</button>
                <button onClick={() => setActiveTab("info")} className={`pb-2 px-4 font-semibold ${activeTab === "info" ? "border-b-2 border-blue-600 text-blue-600" : "text-gray-500"}`}>Информация</button>
            </div>

            {activeTab === "fields" && (
                <div>
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-semibold">Список полей</h2>
                        <button onClick={openCreateField} className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">+ Создать поле</button>
                    </div>
                    <table className="w-full border-collapse border border-gray-300">
                        <thead className="bg-gray-100">
                        <tr>
                            <th className="border p-2 text-left">Системное имя</th>
                            <th className="border p-2 text-left">Название</th>
                            <th className="border p-2 text-left">Тип</th>
                            <th className="border p-2 text-center">В карточке</th>
                            <th className="border p-2 text-center">В списке</th>
                            <th className="border p-2 text-center">Действия</th>
                        </tr>
                        </thead>
                        <tbody>
                        {fields.map((f) => (
                            <tr key={f.id} className="hover:bg-gray-50">
                                <td className="border p-2">{f.systemName}</td>
                                <td className="border p-2">{f.displayName}</td>
                                <td className="border p-2">{f.type} {f.type === 'RELATION' && <span className="text-gray-500 text-sm ml-2">→ {f.targetTableName} ({f.targetDisplayField})</span>}</td>
                                <td className="border p-2 text-center">{f.visibleOnDetails ? "✅" : "❌"}</td>
                                <td className="border p-2 text-center">{f.visibleOnList ? "✅" : "❌"}</td>
                                <td className="border p-2 text-center">
                                    <div className="flex justify-center gap-2">
                                        <button onClick={() => openEditField(f)} className="text-blue-600 hover:underline">Ред.</button>
                                        <button onClick={() => handleDeleteField(f.id!)} className="text-red-600 hover:underline">Удал.</button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {fields.length === 0 && (
                            <tr>
                                <td colSpan={6} className="border p-4 text-center text-gray-500">У этой таблицы пока нет полей.</td>
                            </tr>
                        )}
                        </tbody>
                    </table>
                </div>
            )}

            {activeTab === "info" && (
                <div className="bg-gray-50 p-4 rounded border">
                    <p><strong>ID таблицы:</strong> {table.id}</p>
                    <p><strong>Системное имя:</strong> {table.systemName}</p>
                </div>
            )}

            {/* МОДАЛЬНОЕ ОКНО (ВОТ ЕГО НЕ ХВАТАЛО) */}
            {showCreateField && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded shadow-lg w-[500px] max-h-[90vh] overflow-y-auto">
                        <h2 className="text-xl font-bold mb-4">{isEditingField ? "Редактировать поле" : "Новое поле"}</h2>

                        <div className="grid grid-cols-2 gap-4 mb-4">
                            <div>
                                <label className="block text-sm mb-1">Системное имя (англ.)</label>
                                <input className="w-full border p-2 rounded disabled:bg-gray-200" value={fieldForm.systemName} onChange={(e) => setFieldForm({ ...fieldForm, systemName: e.target.value })} disabled={isEditingField} placeholder="например, order_date" />
                            </div>
                            <div>
                                <label className="block text-sm mb-1">Название для пользователя</label>
                                <input className="w-full border p-2 rounded" value={fieldForm.displayName} onChange={(e) => setFieldForm({ ...fieldForm, displayName: e.target.value })} placeholder="например, Дата заказа" />
                            </div>
                        </div>

                        <div className="mb-4">
                            <label className="block text-sm mb-1">Тип поля</label>
                            <select className="w-full border p-2 rounded disabled:bg-gray-200" value={fieldForm.type} onChange={(e) => setFieldForm({ ...fieldForm, type: e.target.value as FieldType })} disabled={isEditingField}>
                                <option value="STRING">STRING (Строка)</option>
                                <option value="TEXT">TEXT (Текст)</option>
                                <option value="INTEGER">INTEGER (Целое число)</option>
                                <option value="LONG">LONG (Длинное число)</option>
                                <option value="DECIMAL">DECIMAL (Дробное)</option>
                                <option value="BOOLEAN">BOOLEAN (Да/Нет)</option>
                                <option value="DATE">DATE (Дата)</option>
                                <option value="DATETIME">DATETIME (Дата и время)</option>
                                <option value="RELATION">RELATION (Связь с таблицей)</option>
                            </select>
                        </div>

                        {fieldForm.type === "RELATION" && (
                            <div className="bg-blue-50 p-3 rounded mb-4 border border-blue-200">
                                <div className="mb-3">
                                    <label className="block text-sm mb-1 text-blue-800 font-semibold">Связанная таблица</label>
                                    <select className="w-full border p-2 rounded disabled:bg-gray-100" value={fieldForm.targetTableName || ""} disabled={isEditingField} onChange={async (e) => {
                                        const selectedTableName = e.target.value;
                                        setFieldForm({ ...fieldForm, targetTableName: selectedTableName, targetDisplayField: "" });
                                        if (selectedTableName) {
                                            const tableObj = allTables.find(t => t.systemName === selectedTableName);
                                            if (tableObj && tableObj.id) {
                                                try {
                                                    const fields = await getFields(tableObj.id.toString());
                                                    setTargetTableFields(fields);
                                                } catch (error) { console.error("Ошибка загрузки полей", error); }
                                            }
                                        } else { setTargetTableFields([]); }
                                    }}>
                                        <option value="">-- Выберите таблицу --</option>
                                        {allTables.filter(t => t.id?.toString() !== id).map(t => (
                                            <option key={t.id} value={t.systemName}>{t.displayName} ({t.systemName})</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm mb-1 text-blue-800 font-semibold">Поле для отображения</label>
                                    <select className="w-full border p-2 rounded bg-white disabled:bg-gray-100" disabled={!fieldForm.targetTableName} value={fieldForm.targetDisplayField || ""} onChange={(e) => setFieldForm({ ...fieldForm, targetDisplayField: e.target.value })}>
                                        <option value="">-- Выберите поле --</option>
                                        {targetTableFields.map(f => (
                                            <option key={f.id} value={f.systemName}>{f.displayName} ({f.systemName})</option>
                                        ))}
                                    </select>
                                    {!fieldForm.targetTableName && <p className="text-xs text-gray-500 mt-1">Сначала выберите связанную таблицу.</p>}
                                </div>
                            </div>
                        )}

                        <div className="flex flex-col gap-2 mb-6">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input type="checkbox" checked={fieldForm.visibleOnDetails} onChange={(e) => setFieldForm({ ...fieldForm, visibleOnDetails: e.target.checked })} className="w-4 h-4" /> Видимо на странице details
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input type="checkbox" checked={fieldForm.visibleOnList} onChange={(e) => setFieldForm({ ...fieldForm, visibleOnList: e.target.checked })} className="w-4 h-4" /> Видимо в списке
                            </label>
                        </div>

                        <div className="flex justify-end gap-2">
                            <button onClick={closeFieldModal} className="px-4 py-2 border rounded hover:bg-gray-50">Отмена</button>
                            <button onClick={handleSaveField} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Сохранить</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default function TableDetails() {
    return (
        <Suspense fallback={<div className="p-8 text-center">Загрузка страницы...</div>}>
            <TableDetailsContent />
        </Suspense>
    );
}
"use client"; // Важно для использования useState и useEffect

import { useEffect, useState } from "react";
import Link from "next/link";
import { getTables, createTable } from "../lib/api"; // Проверьте путь до api.ts
import { TableDef } from "../lib/types"; // <-- Импортируем тип

export default function Home() {
  const [tables, setTables] = useState<TableDef[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ systemName: "", displayName: "" });

  const loadTables = () => {
    getTables().then(setTables).catch(console.error);
  };

  useEffect(() => {
    let ignore = false; // Флаг для предотвращения утечек памяти

    getTables().then((data) => {
      if (!ignore) {
        setTables(data);
      }
    }).catch(console.error);

    // Функция очистки: если компонент размонтируется, игнорируем результат
    return () => {
      ignore = true;
    };
  }, []);
  const handleCreate = async () => {
    if (!form.systemName || !form.displayName) return alert("Заполните все поля");
    await createTable(form);
    setShowCreate(false);
    setForm({ systemName: "", displayName: "" });
    loadTables(); // Обновляем список
  };

  return (
      <div className="p-8 max-w-4xl mx-auto font-sans">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Метаданные: Таблицы</h1>
          <button
              onClick={() => setShowCreate(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Создать таблицу
          </button>
        </div>

        <table className="w-full border-collapse border border-gray-300">
          <thead className="bg-gray-100">
          <tr>
            <th className="border p-2 text-left">Системное имя (в БД)</th>
            <th className="border p-2 text-left">Название для пользователя</th>
            <th className="border p-2 text-left">Действия</th>
          </tr>
          </thead>
          <tbody>
          {tables.map((t) => (
              <tr key={t.id} className="hover:bg-gray-50">
                <td className="border p-2">{t.systemName}</td>
                <td className="border p-2">{t.displayName}</td>
                <td className="border p-2">
                  <Link href={`/tables/${t.id}`} className="text-blue-600 hover:underline">
                    Открыть детали
                  </Link>
                </td>
              </tr>
          ))}
          {tables.length === 0 && (
              <tr>
                <td colSpan={3} className="border p-4 text-center text-gray-500">
                  Таблиц пока нет. Создайте первую!
                </td>
              </tr>
          )}
          </tbody>
        </table>

        {/* Модальное окно создания */}
        {showCreate && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
              <div className="bg-white p-6 rounded shadow-lg w-96">
                <h2 className="text-xl font-bold mb-4">Новая таблица</h2>
                <div className="mb-4">
                  <label className="block text-sm mb-1">Системное имя (англ.)</label>
                  <input
                      className="w-full border p-2 rounded"
                      value={form.systemName}
                      onChange={(e) => setForm({...form, systemName: e.target.value})}
                      placeholder="например, custom_orders"
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-sm mb-1">Название (рус.)</label>
                  <input
                      className="w-full border p-2 rounded"
                      value={form.displayName}
                      onChange={(e) => setForm({...form, displayName: e.target.value})}
                      placeholder="например, Заказы"
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <button onClick={() => setShowCreate(false)} className="px-4 py-2 border rounded">Отмена</button>
                  <button onClick={handleCreate} className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">Сохранить</button>
                </div>
              </div>
            </div>
        )}
      </div>
  );
}
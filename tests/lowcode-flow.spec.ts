import { test, expect } from '@playwright/test';

test('Полный цикл с RELATION связью', async ({ page }) => {
    await page.goto('/');

    const timestamp = Date.now();
    const targetTableName = `target_table_${timestamp}`;
    const mainTableName = `main_table_${timestamp}`;

    // ==========================================
    // ЧАСТЬ 1: Создаем таблицу-СПРАВОЧНИК (Target)
    // ==========================================
    await page.getByRole('button', { name: 'Создать таблицу' }).click();
    await page.getByPlaceholder('например, custom_orders').fill(targetTableName);
    await page.getByPlaceholder('например, Заказы').fill('Справочник');
    await page.getByRole('button', { name: 'Сохранить' }).click();
    await expect(page.locator('tr', { hasText: targetTableName })).toBeVisible();

    // Заходим в справочник и создаем поле для отображения
    await page.locator('tr', { hasText: targetTableName }).getByRole('link', { name: 'Открыть детали' }).click();
    await expect(page).toHaveURL(/.*\/tables\/\d+/);

    await page.getByRole('button', { name: '+ Создать поле' }).click();
    await page.getByPlaceholder('например, order_date').fill('target_name');
    await page.getByPlaceholder('например, Дата заказа').fill('Название в справочнике');
    await page.getByRole('button', { name: 'Сохранить' }).click();
    await expect(page.locator('tr', { hasText: 'target_name' })).toBeVisible();

    // Добавим запись в справочник, чтобы было что выбирать
    await page.getByRole('link', { name: 'Перейти к данным →' }).click();
    await expect(page).toHaveURL(/.*\/records/);
    await page.getByRole('button', { name: '+ Добавить запись' }).click();
    await page.getByLabel('Название в справочнике').fill('Значение из справочника');
    await page.getByRole('button', { name: 'Сохранить' }).click();
    await expect(page.locator('table').first()).toContainText('Значение из справочника');

    // ==========================================
    // ЧАСТЬ 2: Создаем ОСНОВНУЮ таблицу (Main)
    // ==========================================
    await page.goto('/'); // Возвращаемся на главную
    await page.getByRole('button', { name: 'Создать таблицу' }).click();
    await page.getByPlaceholder('например, custom_orders').fill(mainTableName);
    await page.getByPlaceholder('например, Заказы').fill('Основная таблица');
    await page.getByRole('button', { name: 'Сохранить' }).click();
    await expect(page.locator('tr', { hasText: mainTableName })).toBeVisible();

    // Заходим в основную таблицу
    await page.locator('tr', { hasText: mainTableName }).getByRole('link', { name: 'Открыть детали' }).click();
    await expect(page).toHaveURL(/.*\/tables\/\d+/);

    // ==========================================
    // ЧАСТЬ 3: Добавляем поле типа RELATION
    // ==========================================
    await page.getByRole('button', { name: '+ Создать поле' }).click();

    await page.getByPlaceholder('например, order_date').fill('relation_field');
    await page.getByPlaceholder('например, Дата заказа').fill('Связь со справочником');

    // Выбираем тип RELATION (это первый select в модальном окне)
    await page.locator('select').first().selectOption('RELATION');

    // Ждем появления блока настроек связи
    await expect(page.getByText('Связанная таблица')).toBeVisible();

    // Выбираем нашу таблицу-справочник (второй select)
    await page.locator('select').nth(1).selectOption({ label: `Справочник (${targetTableName})` });

    // Ждем загрузки полей справочника и выбираем поле для отображения (третий select)
    await expect(page.locator('select').nth(2)).toBeEnabled();
    await page.locator('select').nth(2).selectOption('target_name'); // Выбираем системное имя поля

    // Сохраняем поле
    await page.getByRole('button', { name: 'Сохранить' }).click();
    await expect(page.locator('tr', { hasText: 'relation_field' })).toBeVisible();

    // ==========================================
    // ЧАСТЬ 4: Проверяем работу связи
    // ==========================================
    await page.getByRole('link', { name: 'Перейти к данным →' }).click();
    await expect(page).toHaveURL(/.*\/records/);

    // Создаем запись в основной таблице
    await page.getByRole('button', { name: '+ Добавить запись' }).click();

    // В выпадающем списке должен быть текст из справочника, а не ID
    const relationSelect = page.getByLabel('Связь со справочником');
    await expect(relationSelect).toBeVisible();

    // Проверяем, что в селекте есть опция с текстом "Значение из справочника"
    await expect(relationSelect.locator('option', { hasText: 'Значение из справочника' })).toBeAttached();

    // Выбираем эту опцию
    await relationSelect.selectOption({ label: 'Значение из справочника' });

    await page.getByRole('button', { name: 'Сохранить' }).click();

    // Проверяем, что в таблице записей отображается текст, а не ID
    await expect(page.locator('table').first()).toContainText('Значение из справочника');
});
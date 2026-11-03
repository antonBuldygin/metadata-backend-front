import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import TableRecordsPage from './page';
import * as api from '../../../../lib/api';

// Мокаем Next.js navigation
jest.mock('next/navigation', () => ({
    useParams: () => ({ id: '1' }),
    useRouter: () => ({ push: jest.fn() }),
}));

// Мокаем наш API
jest.mock('../../../../lib/api');

describe('Страница записей (TableRecordsPage)', () => {
    beforeEach(() => {
        // Настраиваем фейковые ответы от бэкенда
        (api.getTable as jest.Mock).mockResolvedValue({ id: 1, systemName: 'test', displayName: 'Тест' });
        (api.getFields as jest.Mock).mockResolvedValue([
            { id: 1, systemName: 'name', displayName: 'Имя', type: 'STRING', visibleOnList: true, visibleOnDetails: true }
        ]);
        (api.getRecords as jest.Mock).mockResolvedValue([]);
    });

    it('должен открывать модальное окно при клике на "Добавить запись"', async () => {
        render(<TableRecordsPage />);

        // Ждем, пока загрузятся данные
        await waitFor(() => {
            expect(screen.getByText('Записи: Тест')).toBeInTheDocument();
        });

        // Изначально модального окна нет
        expect(screen.queryByText('Добавить запись')).not.toBeInTheDocument(); // Заголовок в модалке

        // Кликаем по кнопке
        const addButton = screen.getByRole('button', { name: /\+ Добавить запись/i });
        fireEvent.click(addButton);

        // Проверяем, что модальное окно открылось и в нем есть поле "Имя"
        expect(screen.getByText('Добавить запись')).toBeInTheDocument();
        expect(screen.getByLabelText('Имя')).toBeInTheDocument();
    });

    it('должен отправлять данные при сохранении', async () => {
        (api.createRecord as jest.Mock).mockResolvedValue(undefined);
        render(<TableRecordsPage />);

        await waitFor(() => {
            expect(screen.getByText('Записи: Тест')).toBeInTheDocument();
        });

        fireEvent.click(screen.getByRole('button', { name: /\+ Добавить запись/i }));

        // Вводим текст в поле
        const input = screen.getByLabelText('Имя');
        fireEvent.change(input, { target: { value: 'Иван' } });

        // Кликаем "Сохранить"
        fireEvent.click(screen.getByRole('button', { name: 'Сохранить' }));

        // Проверяем, что вызвался API
        await waitFor(() => {
            expect(api.createRecord).toHaveBeenCalledWith('test', expect.objectContaining({ name: 'Иван' }));
        });
    });
});
// Показываем выпадающий список для выбранной группы
document.getElementById('group-select').addEventListener('change', function () {
    const group = this.value; // Определяем переменную group
    const placeholderSelects = document.querySelectorAll('.placeholder-select');

    // Скрываем все выпадающие списки
    placeholderSelects.forEach(select => {
        select.style.display = 'none';
    });

    // Показываем выпадающий список для выбранной группы
    if (group) {
        document.getElementById(`${group}-select`).style.display = 'inline-block';
    }
});

// Функция для вставки заполнителя
function insertPlaceholder() {
    const group = document.getElementById('group-select').value;
    if (!group) {
        alert('Выберите группу!');
        return;
    }

    const placeholderSelect = document.getElementById(`${group}-select`);
    if (!placeholderSelect) {
        alert('Заполнитель не найден!');
        return;
    }

    const placeholder = placeholderSelect.value;
    if (!placeholder) {
        alert('Выберите заполнитель!');
        return;
    }

    const selection = window.getSelection();
    if (selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        const placeholderNode = document.createTextNode(placeholder);
        range.deleteContents();
        range.insertNode(placeholderNode);
    }
}

// Функция для скачивания HTML
function downloadHtml() {
    const content = document.getElementById('content').innerHTML;
    const blob = new Blob([content], { type: 'text/html' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = 'document.html';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// Добавляем обработчик для кнопки скачивания
document.getElementById('download-button').addEventListener('click', downloadHtml);
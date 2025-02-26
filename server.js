const express = require('express');
const multer = require('multer');
const mammoth = require('mammoth');
const path = require('path');
const fs = require('fs');

const app = express();
const upload = multer({ dest: 'uploads/' });

app.use(express.static(path.join(__dirname, 'static')));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'templates', 'index.html'));
});

const placeholders = {
    patient: ["{{пациент.номер_договора}}", "{{пациент.дата_договора}}", "{{пациент.фамилия}}", "{{пациент.имя}}", "{{пациент.отчество}}", "{{пациент.дата_рождения}}"],
    representative: ["{{пациент.представитель_фио}}", "{{пациент.представитель_документ_тип}}", "{{пациент.представитель_адрес}}"],
    document: ["{{документ.текущая_дата}}", "{{документ.номер}}", "{{документ.текущая_дата_дд_мм_гггг}}"],
    visit: ["{{счет.номер}}", "{{счет.дата}}", "{{счет.услуги_итого_сумма}}"]
};

app.post('/upload', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).send('Файл не загружен.');
        }

        const { value: htmlContent } = await mammoth.convertToHtml({ path: req.file.path });
        fs.unlinkSync(req.file.path);

        const sanitizedHtmlContent = htmlContent
            .replace(/\$/g, "&#36;")
            .replace(/`/g, "&#96;")
            .replace(/<table>/g, '<table style="width: 100%; border-collapse: collapse; border: 2px solid black;">')
            .replace(/<th>/g, '<th style="border: 2px solid black; background-color: #007bff; color: white; text-align: center; padding: 10px;">')
            .replace(/<td>/g, '<td style="border: 2px solid black; text-align: center; padding: 10px;">');

        res.send(`
            <!DOCTYPE html>
            <html lang="ru">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Результат</title>
                <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css">
                <style>
                    body { background-color: #f4f4f4; font-family: Arial, sans-serif; }
                    .container { max-width: 900px; background: white; padding: 20px; border-radius: 8px; box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1); margin-top: 20px; }
                    .toolbar { display: flex; gap: 10px; margin-bottom: 15px; justify-content: center; }
                    h1 { text-align: center; color: #007bff; }
                    #content { min-height: 300px; border: 2px solid #ccc; padding: 15px; background: white; font-size: 16px; line-height: 1.5; }
                    table { width: 100%; border-collapse: collapse; margin-top: 15px; background-color: white; }
                    table, th, td { border: 2px solid black; text-align: center; padding: 10px; }
                    th { background-color: #007bff; color: white; font-weight: bold; }
                    button { margin-top: 10px; }
                </style>
            </head>
            <body>
                <div class="container">
                    <h1>Результат</h1>
                    <div class="toolbar">
                        <select id="group-select" class="form-select w-auto">
                            <option value="">Выберите группу</option>
                            <option value="patient">Пациент</option>
                            <option value="representative">Представитель</option>
                            <option value="document">Документ</option>
                            <option value="visit">Визит</option>
                        </select>
                        <select id="subgroup-select" class="form-select w-auto" style="display: none;"></select>
                        <button id="insert-button" class="btn btn-primary">Вставить</button>
                        <button id="save-button" class="btn btn-success">Сохранить</button>
                    </div>
                    <div id="content" contenteditable="true">${sanitizedHtmlContent}</div>
                    <button onclick="window.location.href='/'" class="btn btn-secondary mt-3">Назад</button>
                </div>

                <script>
                    const placeholders = ${JSON.stringify(placeholders)};

                    document.getElementById('group-select').addEventListener('change', function () {
                        const group = this.value;
                        const subgroupSelect = document.getElementById('subgroup-select');

                        if (group && placeholders[group]) {
                            subgroupSelect.innerHTML = placeholders[group].map(p => 
                                \`<option value="\${p}">\${p}</option>\`
                            ).join('');
                            subgroupSelect.style.display = "inline-block";
                        } else {
                            subgroupSelect.style.display = "none";
                        }
                    });

                    document.getElementById('insert-button').addEventListener('click', function () {
                        insertSelectedPlaceholder();
                    });

                    document.addEventListener("keydown", function (event) {
                        if (event.ctrlKey && (event.key.toLowerCase() === "v" || event.key.toLowerCase() === "м")) {
                            event.preventDefault();
                            insertSelectedPlaceholder();
                        }
                    });

                    function insertSelectedPlaceholder() {
                        const placeholder = document.getElementById('subgroup-select').value;
                        if (!placeholder) {
                            alert('Выберите заполнитель!');
                            return;
                        }
                        
                        const contentDiv = document.getElementById('content');
                        const selection = window.getSelection();
                        if (selection.rangeCount > 0) {
                            const range = selection.getRangeAt(0);
                            const parentElement = range.commonAncestorContainer.parentElement;

                            if (!contentDiv.contains(parentElement)) {
                                alert("Заполнители можно вставлять только в текстовую область!");
                                return;
                            }

                            range.deleteContents();
                            range.insertNode(document.createTextNode(placeholder));
                        } else {
                            contentDiv.appendChild(document.createTextNode(' ' + placeholder));
                        }
                    }

                    document.addEventListener("paste", function (event) {
                        event.preventDefault();
                        alert("Используйте кнопку 'Вставить' для добавления заполнителей.");
                    });
                </script>
            </body>
            </html>
        `);
    } catch (err) {
        console.error('Ошибка при обработке файла:', err);
        res.status(500).send('Ошибка при обработке файла.');
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Сервер запущен на http://localhost:${PORT}`);
});

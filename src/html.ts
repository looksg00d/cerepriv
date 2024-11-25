export const html = `
<!DOCTYPE html>
<html>
<head>
    <title>HEIC to PNG Converter</title>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body {
            font-family: Arial, sans-serif;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f5f5f5;
        }

        h1 {
            text-align: center;
            color: #333;
            margin-bottom: 30px;
        }

        .upload-area {
            border: 2px dashed #ccc;
            border-radius: 8px;
            padding: 40px;
            text-align: center;
            margin: 20px auto;
            max-width: 500px;
            cursor: pointer;
            transition: all 0.3s ease;
            background-color: white;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }

        .dragging {
            background-color: #e1e1e1;
            border-color: #999;
        }

        .error {
            color: #d32f2f;
            margin: 10px;
            padding: 10px;
            background-color: #ffebee;
            border-radius: 4px;
        }

        .success {
            color: #2e7d32;
            margin: 10px;
            padding: 10px;
            background-color: #e8f5e9;
            border-radius: 4px;
        }

        #result {
            text-align: center;
            margin: 20px;
        }

        .loading {
            display: inline-block;
            width: 20px;
            height: 20px;
            border: 3px solid #f3f3f3;
            border-top: 3px solid #3498db;
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin-right: 10px;
        }

        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }

        a {
            color: #2196f3;
            text-decoration: none;
            padding: 5px 10px;
            border-radius: 4px;
            transition: background-color 0.3s;
        }

        a:hover {
            background-color: #e3f2fd;
        }
    </style>
</head>
<body>
    <h1>HEIC to PNG Converter</h1>
    <div id="uploadArea" class="upload-area">
        <input type="file" id="fileInput" accept=".heic" style="display: none">
        <p>Drag and drop a HEIC file here, or click to select</p>
    </div>
    <div id="result"></div>

    <script>
        const uploadArea = document.getElementById('uploadArea');
        const fileInput = document.getElementById('fileInput');
        const result = document.getElementById('result');

        // Добавляем логи для отладки
        console.log('Script initialized');

        uploadArea.onclick = () => {
            console.log('Upload area clicked');
            fileInput.click();
        };

        uploadArea.ondragover = (e) => {
            e.preventDefault();
            uploadArea.classList.add('dragging');
        };

        uploadArea.ondragleave = () => {
            uploadArea.classList.remove('dragging');
        };

        uploadArea.ondrop = (e) => {
            e.preventDefault();
            uploadArea.classList.remove('dragging');
            
            const file = e.dataTransfer.files[0];
            console.log('File dropped:', file?.name);
            
            if (file?.name.toLowerCase().endsWith('.heic')) {
                handleFile(file);
            } else {
                result.innerHTML = '<p class="error">Please upload a HEIC file</p>';
            }
        };

        fileInput.onchange = (e) => {
            const file = e.target.files[0];
            console.log('File selected:', file?.name);
            if (file) handleFile(file);
        };

        async function handleFile(file) {
            result.innerHTML = '<div class="loading"></div><p>Converting...</p>';
            const formData = new FormData();
            formData.append('image', file);

            try {
                console.log('Starting upload...');
                const response = await fetch('/upload', {
                    method: 'POST',
                    body: formData
                });
                
                console.log('Upload response received');
                const data = await response.json();
                
                if (data.success) {
                    console.log('Conversion successful');
                    result.innerHTML = \`
                        <p class="success">Conversion successful!</p>
                        <p>Original: <a href="\${data.originalUrl}" target="_blank">Download HEIC</a></p>
                        <p>Converted: <a href="\${data.processedUrl}" target="_blank">Download PNG</a></p>
                    \`;
                } else {
                    console.error('Conversion failed:', data.error);
                    result.innerHTML = \`<p class="error">Error: \${data.error}</p>\`;
                }
            } catch (error) {
                console.error('Upload error:', error);
                result.innerHTML = '<p class="error">Error uploading file. Please try again.</p>';
            }
        }

        // Проверяем, что страница загружена успешно
        console.log('Page loaded successfully');
    </script>
</body>
</html>
`;
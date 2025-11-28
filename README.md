### 1. Ejecuta los comandos. Se crean: package.json, carpeta node_modules y las dependencias instaladas localmente.

npm init -y

npm install firebase-admin csv-parser

### 2. Crea el archivo importar_coches_github.js y serviceAccountKey.json

### 3. Coloca el archivo coches.cs en la misma carpeta

### 4. Ejecuta la importación
node importar_coches_github.js

### En Firestore tendrás la colección coches llena.

### X Borrar documentos de la colección
node delete.js

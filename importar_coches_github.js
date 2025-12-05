const admin = require("firebase-admin");
const csv = require("csv-parser");
const fs = require("fs");
const fetch = (...args) =>
  import("node-fetch").then(({ default: fetch }) => fetch(...args));

// Inicializar Firebase
// Asegúrate de que el archivo serviceAccountKey.json está en la misma carpeta
admin.initializeApp({
  credential: admin.credential.cert("./serviceAccountKey.json"),
});

const db = admin.firestore();

// GitHub
const GITHUB_USER = "AnthonyGuanga";
const GITHUB_REPO = "coches-angular";
const BASE_URL = `https://raw.githubusercontent.com/${GITHUB_USER}/${GITHUB_REPO}/main/img`;

// Mapeo marcas -> carpetas en GitHub
const carpetas = {
  Audi: "Audi",
  Honda: "Honda",
  Hyundai: "Hyundai",
  KIA: "KIA",
  "Mercedes Benz": "Mercedes",
  Nissan: "Nissan",
  Toyota: "Toyota",
};

// Comprueba si una imagen existe en GitHub
async function existeImagen(url) {
  try {
    const res = await fetch(url);
    return res.status === 200;
  } catch (error) {
    return false;
  }
}

async function procesarFila(row) {
  const marca = row["marca"];
  const nombreBase = row["nombreimagen"];

  const carpeta = carpetas[marca];

  if (!carpeta) {
    console.log("❌ Marca desconocida o carpeta no definida:", marca);
    return;
  }

  // --- Lógica de Imágenes ---
  const fotos = [];
  let fotoPrincipal = null;
  const extensiones = [".png", ".PNG", ".jpg", ".JPG", ".jpeg"]; // Agregué JPG por si acaso

  // Buscamos la imagen principal (índice 0) y secundarias (1 al 5)
  for (let i = 0; i <= 5; i++) {
    let encontrada = false;
    for (const ext of extensiones) {
      const nombreArchivo = `${nombreBase}_${i}${ext}`;
      const url = `${BASE_URL}/${carpeta}/${nombreArchivo}`;

      if (await existeImagen(url)) {
        if (i === 0) {
          fotoPrincipal = url;
        } else {
          fotos.push(url);
        }
        encontrada = true;
        break; // Si encontramos .png, no buscamos .PNG para el mismo número
      }
    }
    // Si falla la 1, asumimos que no hay 2, 3, etc. (opcional, depende de tus archivos)
    if (!encontrada && i > 0) break;
  }

  if (!fotoPrincipal) {
    console.log(
      `⚠️ Advertencia: No existe imagen principal para ${nombreBase}`
    );
    // Aún así lo guardamos, o puedes poner 'return' si prefieres no guardarlo.
  }

  // --- CORRECCIÓN IMPORTANTE AQUÍ ---
  // Convertimos "hatchback, sedán" -> ["hatchback", "sedán"]
  let tiposArray = [];
  if (row["tipo"]) {
    tiposArray = row["tipo"]
      .split(",") // Cortar por comas
      .map((t) => t.trim()) // Quitar espacios (" sedán" -> "sedán")
      .map((t) => t.toLowerCase()); // Convertir a minúsculas ("Sedán" -> "sedán")
  }

  // Guardar en Firestore colección: coches
  await db.collection("coches").add({
    marca: row["marca"],
    modelo: row["modelo"],
    nombreImagen: row["nombreimagen"],
    combustible: row["combustible"],
    kilometraje: Number(row["kilometraje"]), // Aseguramos que sea número
    anio: Number(row["anio"]),
    precio: Number(row["precio"]),
    motor: row["motor"],
    cambio: row["cambio"],

    // 👇 Usamos el array procesado
    tipo: tiposArray,

    reserva: row["reserva"] ? row["reserva"] : null,
    fotoPrincipal: fotoPrincipal || "", // String vacío si no hay foto
    fotos,
  });

  console.log(
    `✔ Importado: ${row["marca"]} ${row["modelo"]} [Tipos: ${tiposArray.join(
      ", "
    )}]`
  );
}

console.log("⏳ Importando coches desde CSV...\n");

// Leemos el CSV
const filas = [];
fs.createReadStream("coches.csv")
  .pipe(csv())
  .on("data", (row) => filas.push(row))
  .on("end", async () => {
    // Procesamos uno a uno para no saturar y ver los logs en orden
    for (const fila of filas) {
      await procesarFila(fila);
    }
    console.log("\n🔥 Importación completada.");
  });

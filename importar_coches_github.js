const admin = require("firebase-admin");
const csv = require("csv-parser");
const fs = require("fs");
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

// Inicializar Firebase
admin.initializeApp({
  credential: admin.credential.cert("./serviceAccountKey.json")
});

const db = admin.firestore();

// GitHub
const GITHUB_USER = "AnthonyGuanga";
const GITHUB_REPO = "coches-angular";
const BASE_URL = `https://raw.githubusercontent.com/${GITHUB_USER}/${GITHUB_REPO}/main/img`;

// Mapeo marcas -> carpetas en GitHub
const carpetas = {
  "Audi": "Audi",
  "Honda": "Honda",
  "Hyundai": "Hyundai",
  "KIA": "KIA",
  "Mercedes Benz": "Mercedes",
  "Nissan": "Nissan",
  "Toyota": "Toyota"
};

// Comprueba si una imagen existe en GitHub
async function existeImagen(url) {
  const res = await fetch(url);
  return res.status === 200;
}

async function procesarFila(row) {
  const marca = row["marca"];
  const nombreBase = row["nombreimagen"];

  const carpeta = carpetas[marca];

  if (!carpeta) {
    console.log("❌ Marca desconocida:", marca);
    return;
  }

  const fotos = [];
  let fotoPrincipal = null;

const extensiones = [".png", ".PNG"]; // prueba ambos

for (let i = 0; i <=5; i++) {
    let encontrada = false;
    for (const ext of extensiones) {
        const nombreArchivo = `${nombreBase}_${i}${ext}`;
        const url = `${BASE_URL}/${carpeta}/${nombreArchivo}`;
        if (await existeImagen(url)) {
            if (i === 0) fotoPrincipal = url;
            else fotos.push(url);
            encontrada = true;
            break;
        }
    }
    if (!encontrada) break; // no hay más imágenes
}


  if (!fotoPrincipal) {
    console.log(`❌ No existe imagen principal para ${nombreBase}`);
    return;
  }

  // Guardar en Firestore colección: coches
  await db.collection("coches").add({
    marca: row["marca"],
    modelo: row["modelo"],
    nombreImagen: row["nombreimagen"],
    combustible: row["combustible"],
    kilometraje: Number(row["kilometraje"]),
    anio: Number(row["anio"]),
    precio: Number(row["precio"]),
    motor: row["motor"],
    cambio: row["cambio"],
    tipo: row["tipo"],
    reserva: row["reserva"] ? row["reserva"] : null,
    fotoPrincipal,
    fotos
  });

  console.log(`✔ Importado: ${row["marca"]} ${row["modelo"]}`);
}

console.log("⏳ Importando coches desde CSV...\n");

fs.createReadStream("coches.csv")
  .pipe(csv())
  .on("data", procesarFila)
  .on("end", () => console.log("\n🔥 Importación completada."));

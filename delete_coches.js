const admin = require("firebase-admin");

// Inicializar Firebase
admin.initializeApp({
  credential: admin.credential.cert("./serviceAccountKey.json")
});

const db = admin.firestore();

async function crearAdmin() {
  let adminAuth;

  try {
    // Verificar si el usuario admin ya existe en Firebase Auth
    adminAuth = await admin.auth().getUserByEmail("admin@tusitio.com");
    console.log("Usuario admin ya existe:", adminAuth.uid);
  } catch (error) {
    if (error.code === "auth/user-not-found") {
      // Crear el usuario admin en Firebase Auth
      adminAuth = await admin.auth().createUser({
        email: "admin@tusitio.com",
        password: "contraseñaSegura",
        displayName: "Administrador Sistema"
      });
      console.log("✔ Admin creado en Auth con uid:", adminAuth.uid);
    } else {
      throw error;
    }
  }

  // Crear documento en Firestore con el mismo uid
  await db.collection("usuarios").doc(adminAuth.uid).set({
    usuario: "admin",
    nombre: "Administrador",
    apellidos: "Sistema",
    correo: "admin@tusitio.com",
    telefono: "600000000"
  });

  console.log("✔ Documento admin creado/actualizado en Firestore con uid:", adminAuth.uid);
}

// Ejecutar la función
crearAdmin().catch(console.error);

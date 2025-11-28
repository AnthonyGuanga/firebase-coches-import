const admin = require("firebase-admin");

admin.initializeApp({
  credential: admin.credential.cert("./serviceAccountKey.json"),
});

const db = admin.firestore();

async function deleteCollection(collectionPath) {
  const collectionRef = db.collection(collectionPath);
  const snapshot = await collectionRef.get();

  console.log(`🔍 Encontrados ${snapshot.size} documentos. Borrando...`);
  
  const batchSize = 500;
  let batch = db.batch();

  let count = 0;
  snapshot.forEach((doc) => {
    batch.delete(doc.ref);
    count++;

    if (count % batchSize === 0) {
      batch.commit();
      batch = db.batch();
    }
  });

  await batch.commit();
  console.log("🔥 Colección borrada COMPLETAMENTE");
}

deleteCollection("coches");

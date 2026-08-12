const { MongoClient } = require('mongodb');

const LOCAL_URI = 'mongodb://localhost:27017';
const ATLAS_URI = 'mongodb://ch123:Chandra%402708@cluster0-shard-00-00.fyjn9.mongodb.net:27017,cluster0-shard-00-01.fyjn9.mongodb.net:27017,cluster0-shard-00-02.fyjn9.mongodb.net:27017/?ssl=true&replicaSet=atlas-7c4zbg-shard-0&authSource=admin';
const DB_NAME = 'meridian_banking';

async function migrate() {
  console.log('Connecting to local MongoDB...');
  const localClient = new MongoClient(LOCAL_URI);
  await localClient.connect();
  const localDb = localClient.db(DB_NAME);

  console.log('Connecting to MongoDB Atlas...');
  const atlasClient = new MongoClient(ATLAS_URI);
  await atlasClient.connect();
  const atlasDb = atlasClient.db(DB_NAME);

  try {
    const collections = await localDb.listCollections().toArray();
    
    for (let collectionInfo of collections) {
      const collectionName = collectionInfo.name;
      console.log(`\nMigrating collection: ${collectionName}...`);
      
      const localCollection = localDb.collection(collectionName);
      const atlasCollection = atlasDb.collection(collectionName);
      
      const documents = await localCollection.find({}).toArray();
      
      if (documents.length === 0) {
        console.log(`- Collection ${collectionName} is empty, skipping.`);
        continue;
      }
      
      console.log(`- Found ${documents.length} documents.`);
      
      // We will try to insert documents one by one to handle duplicates gracefully
      let inserted = 0;
      let duplicates = 0;
      
      for (const doc of documents) {
        try {
          await atlasCollection.insertOne(doc);
          inserted++;
        } catch (err) {
          if (err.code === 11000) { // Duplicate key error
            duplicates++;
          } else {
            console.error(`- Error inserting document ${doc._id}:`, err.message);
          }
        }
      }
      
      console.log(`- Successfully inserted ${inserted} documents. Skipped ${duplicates} duplicates.`);
    }
    
    console.log('\nMigration completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await localClient.close();
    await atlasClient.close();
  }
}

migrate();

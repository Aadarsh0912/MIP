import pymongo
import certifi

client = pymongo.MongoClient(
    "mongodb+srv://promptmaster:Batman%23%4012345@database1.1ihoiz2.mongodb.net/?appName=Database1",
    tlsCAFile=certifi.where()
)

db = client["Database1"]
print("Connected:", db.list_collection_names())



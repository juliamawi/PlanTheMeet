const {MongoClient, Collection} = require("mongodb")
require("dotenv").config({path: "./config.env"}) //hides sensitive data

async function main(){
    const Db = process.env.ATLAS_URI
    const client = new MongoClient(Db)

    try{
        await client.connect()
        const collections = await client.db("PlanTheMeet").collections()
        collections.forEach((collection) => console.log(collection.s.namespace.collection))

    } catch(e){
        console.error(e)
    } finally{
        await client.close()
    }
   
    
}

main()
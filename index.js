const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config()
const app = express();
const port = process.env.PORT || 5300;

// middleware
app.use(cors());
app.use(express.json());


console.log(process.env.DB_PASS);


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.4dyvkgp.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();

    const webdevCollection = client.db('category').collection('webdev');
    const bidWebdevCollection = client.db('category').collection('bidWebdev');

    app.get('/webdev', async(req, res) => {
      const cursor = webdevCollection.find();
      const result = await cursor.toArray();
      res.send(result);
    })
    app.get('/webdev/:id', async(req, res) => {
      const id = req.params.id;
      const query = {_id: new ObjectId(id)}
      const options = {
        projection: {job_title: 1, price_range:1, category:1, img:1, deadline:1, short_description:1 },
      }
      const result = await webdevCollection.findOne(query, options);
      res.send(result);
    })

    //bids

    app.get('/bidWebdev', async(req, res) => {
      console.log(req.query.email);
      let query = {};
      if(req.query?.email){
        query = {email:req.query.email}
      }
      const result = await webdevCollection.find().toArray();
      res.send(result);
    })


    app.post('/bidWebdev', async(req, res) => {
      const bids = req.body;
      console.log(bids);
      const result = await bidWebdevCollection.insertOne(bids);
      res.send(result);
    })


    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);





app.get('/', (req, res) => {
    res.send('I cant take the pressure anymore')
})

app.listen(port, () => {
    console.log(`server is running on port ${port}`);
})
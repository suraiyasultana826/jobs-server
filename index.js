const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config()
const app = express();
const port = process.env.PORT || 5300;

// middleware
app.use(cors({
  origin: [
    'http://localhost:5173',
    'https://assignment-eleven-36f1f.web.app'
  ],
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());


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

//middlewares
const logger = (req, res, next) => {
  console.log('log: info',req.method, req.url);
  next();
}

const verifyToken = (req, res, next) => {
  const token = req?.cookies?.token;
  console.log('token', token);
  next();
}

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();

    const webdevCollection = client.db('category').collection('webdev');
    const postedJobCollection = client.db('category').collection('postedJob');
    const bidWebdevCollection = client.db('category').collection('bidWebdev');


    //auth related api

    app.post('/jwt', logger, async(req, res) => {
      const user = req.body;
      console.log('user for token', user);
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {expiresIn: '1hr'});
      res.cookie('token', token, {
        httpOnly: true,
        secure: true,
        sameSite: 'none'
      })
      .send({success: true});

    })

    app.post('/logout', async(req, res) => {
      const user = req.body;
      console.log('logging out' , user);
      res.clearCookie('token', {max: 0}).send({success: true});
      
    })


    app.get('/webdev', async(req, res) => {
      const cursor = webdevCollection.find();
      const result = await cursor.toArray();
      res.send(result);
    })


    app.post('/postedJob', async(req, res) => {
      const newJob = req.body;
      console.log(newJob);
      const result = await postedJobCollection.insertOne(newJob);
      res.send(result);
    })

    app.get('/postedJob', async(req, res) => {
      const cursor = postedJobCollection.find();
      const result = await cursor.toArray();
      res.send(result);
    })


    app.put('/postedJob/:id', async(req, res) => {
      const id = req.params.id;
      const filter = {_id: new ObjectId(id)}
      const options = { upsert: true };
      const updatedJob = req.body;
      const job = {
        $set: {
          email: updatedJob.email,
          jobTitle: updatedJob.jobTitle,
          deadline: updatedJob.deadline,
          description: updatedJob.description,
          category: updatedJob.category,
          img: updatedJob.img,
          minPrice: updatedJob.minPrice, 
          maxPrice: updatedJob.maxPrice
        }
      }
      const result = await postedJobCollection.updateOne(filter, job, options);
      res.send(result);
    })



    app.delete('/postedJob/:id', async(req, res) => {
      const id = req.params.id;
      const query = {_id:new ObjectId(id)}
      const result = await postedJobCollection.deleteOne(query);
      res.send(result);
    })

    app.get('/postedJob/:id', async(req, res) => {
      const id = req.params.id;
      const query = {_id: new ObjectId(id)}
      const result = await postedJobCollection.findOne(query);
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

    app.get('/bidWebdev', logger,verifyToken, async(req, res) => {
      console.log(req.query.email);
      // console.log('cookies', req.cookies);
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
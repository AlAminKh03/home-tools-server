const express = require('express')
const app = express()
const port = process.env.PORT || 5000;
const cors = require('cors')
require('dotenv').config()
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

app.use(cors())
app.use(express.json())


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.vwvvi.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

async function run() {
    try {
        await client.connect();
        const productCollection = client.db('home-tools').collection('products')
        const orderCollection = client.db('home-tools').collection('orders')
        const reviewCollection = client.db('home-tools').collection('reviews')
        // Products/
        app.get('/products', async (req, res) => {
            const query = {}
            const cursor = productCollection.find(query)
            const products = await cursor.toArray()
            res.send(products)
        })

        // reviews
        app.get('/reviews', async (req, res) => {
            const query = {}
            const cursor = reviewCollection.find(query)
            const reviews = await cursor.toArray()
            res.send(reviews)
        })

        // single product

        app.get('/product/:id', async (req, res) => {
            const id = req.params.id;
            console.log(id)
            const query = { _id: ObjectId(id) }
            const result = await productCollection.findOne(query)
            res.send(result)
        })

        // product order 
        app.post('/orders', async (req, res) => {
            const orders = req.body;
            const result = await orderCollection.insertOne(orders)
            res.send(result)
        })

        // get order 
        app.get('/orders', async (req, res) => {
            const user = await orderCollection.find().toArray()
            res.send(user)

        })

        // get product order 
        app.get('/orders', async (req, res) => {
            const email = req.query.email;
            const query = { email: email }
            const order = await orderCollection.find(query).toArray()
            res.send(order)
        })
    }
    finally {

    }
}

run().catch(console.dir)

app.get('/', (req, res) => {
    res.send('Hello from home tools')
})

app.listen(port, () => {
    console.log(`Home tool listening on port ${port}`)
})
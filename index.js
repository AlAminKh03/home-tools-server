const express = require('express')
const app = express()
const port = process.env.PORT || 5000;
const cors = require('cors')
require('dotenv').config()
var jwt = require('jsonwebtoken');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

app.use(cors())
app.use(express.json())


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.vwvvi.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

function verifyJWT(req, res, next) {
    const authHeader = req.headers.authorization
    if (!authHeader) {
        return res.status(401).send({ message: 'UnAuthorized access' });
    }

    const token = authHeader.split(' ')[1];
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, function (err, decoded) {
        console.log(decoded)
        if (err) {
            return res.status(403).send({ message: 'Forbidden access' })
        }
        req.decoded = decoded;

        next();
    });
}




async function run() {
    try {
        await client.connect();
        const productCollection = client.db('home-tools').collection('products')
        const orderCollection = client.db('home-tools').collection('orders')
        const reviewCollection = client.db('home-tools').collection('reviews')
        const userCollection = client.db('home-tools').collection('users')
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
        app.get('/orders/:email', verifyJWT, async (req, res) => {
            const email = req.params.email;
            console.log(email)
            const decodedEmail = req.decoded.email;
            console.log(decodedEmail)
            if (email === decodedEmail) {
                const query = { email: email }
                const order = await orderCollection.find(query).toArray()
                return res.send(order)
            }
            else {
                return res.status(403).send({ message: 'forbidden access' })
            }
        })

        // putting users 
        app.put('/user/:email', async (req, res) => {
            const email = req.params.email;
            const user = req.body;
            const filter = { email: email }
            const options = { upsert: true }
            const updateDoc = {
                $set: user,
            }
            const result = await userCollection.updateOne(filter, updateDoc, options)
            const token = jwt.sign({ email: email }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '30d' })
            res.send({ result, token });
        });


        app.get('/user', async (req, res) => {
            const query = {}
            const result = await userCollection.find(query).toArray()
            res.send(result)
        })

        app.put('/user/makeadmin/:email', async (req, res) => {
            const email = req.params.email
            const filter = { email: email }
            const updateDoc = {
                $set: { role: 'admin' }
            }
            const result = await userCollection.updateOne(filter, updateDoc)
            res.send(result)
        })

        app.get('/user/admin/:email', async (req, res) => {
            const userEmail = req.params.email
            const user = await userCollection.findOne({ email: userEmail })
            const isAdmin = user.role === 'admin'
            res.send({ admin: isAdmin })
        })


        app.delete('/orders/:id', async (req, res) => {
            const id = req.params.id
            const filter = { _id: ObjectId(id) }
            const result = await orderCollection.deleteOne(filter)
            res.send(result)
        })
        // profile update 
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
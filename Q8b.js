const express = require('express');
const { MongoClient } = require('mongodb');
const path = require('path');

const app = express();
const uri = 'mongodb://127.0.0.1:27017';
const dbName = 'productDB';
const collectionName = 'products';

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve HTML form
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'form.html'));
});

// POST: Insert product and calculate Final Price
app.post('/add-product', async (req, res) => {
  const { product_id, name, price, discount, stock } = req.body;

  const priceNum = parseFloat(price);
  const discountNum = parseFloat(discount);
  const stockNum = parseInt(stock);

  if (!product_id || !name || isNaN(priceNum) || isNaN(discountNum) || isNaN(stockNum)) {
    return res.send('Please fill all fields correctly.');
  }

  const finalPrice = priceNum - (priceNum * discountNum / 100);

  const client = new MongoClient(uri);
  try {
    await client.connect();
    const collection = client.db(dbName).collection(collectionName);

    await collection.insertOne({
      product_id,
      name,
      price: priceNum,
      discount: discountNum,
      stock: stockNum,
      final_price: finalPrice
    });

    res.send(`Product added. Final Price: ₹${finalPrice}<br><a href="/">Back</a>`);
  } catch (err) {
    console.error(err);
    res.status(500).send('Error inserting product.');
  } finally {
    await client.close();
  }
});

// GET: Products with final_price < 21000
app.get('/low-price-products', async (req, res) => {
  const client = new MongoClient(uri);
  try {
    await client.connect();
    const collection = client.db(dbName).collection(collectionName);

    const products = await collection.find({ final_price: { $lt: 21000 } }).toArray();

    if (products.length === 0) {
      return res.send('No products found with Final Price < 21000. <a href="/">Back</a>');
    }

    res.json(products);
  } catch (err) {
    console.error(err);
    res.status(500).send('Error fetching products.');
  } finally {
    await client.close();
  }
});

app.listen(3000, () => {
  console.log('Product Management App running at http://localhost:3000');
});


<!DOCTYPE html>
<html>
<head>
  <title>Product Entry</title>
</head>
<body>
  <h2>Add Product</h2>
  <form action="/add-product" method="POST">
    <label>Product ID:</label><br>
    <input type="text" name="product_id" required><br><br>

    <label>Name:</label><br>
    <input type="text" name="name" required><br><br>

    <label>Price:</label><br>
    <input type="number" step="0.01" name="price" required><br><br>

    <label>Discount (%):</label><br>
    <input type="number" step="0.01" name="discount" required><br><br>

    <label>Stock:</label><br>
    <input type="number" name="stock" required><br><br>

    <button type="submit">Add Product</button>
  </form>

  <hr>
  <h2>List of low price products</h2>
  <form action="/low-price-products" method="Get">
    <button type="submit">Searxh</button>
  </form>
</body>
</html>


// install node_modules (folder) + node_mongo_2024 (folder)
// make sure mongodb is running in your system
// gedit server.js (add given content)
// gedit form.html (add the respective given code below) 
// node server.js
// visit localhost:3000 (on any browser)
// Visit http://localhost:3000/cse-professors to see all.

sudo systemctl start mongod (to start mongodb)

--------------------------------------------------------

// server.js

const express = require('express');
const { MongoClient } = require('mongodb');
const path = require('path');

const app = express();
const uri = 'mongodb://127.0.0.1:27017';
const dbName = 'startupDB';
const collectionName = 'ideas';

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'form.html'));
});

app.post('/submit', async (req, res) => {
  const { id, team_name, title, domain, funding_required } = req.body;
  const funding = parseFloat(funding_required);

  if (!id || !team_name || !title || !domain || isNaN(funding)) {
    return res.send('Please fill all fields correctly.');
  }

  const client = new MongoClient(uri);
  try {
    await client.connect();
    const db = client.db(dbName);
    const collection = db.collection(collectionName);

    await collection.insertOne({
      id,
      team_name,
      title,
      domain,
      funding_required: funding
    });

    res.send('Startup idea submitted! <a href="/">Submit another</a> | <a href="/edtech">View EdTech ideas</a>');
  } catch (err) {
    console.error(err);
    res.status(500).send('Error saving idea.');
  } finally {
    await client.close();
  }
});

app.get('/edtech', async (req, res) => {
  const client = new MongoClient(uri);
  try {
    await client.connect();
    const db = client.db(dbName);
    const collection = db.collection(collectionName);

    const results = await collection.find({
      domain: "EdTech",
      funding_required: { $gt: 75 }
    }).toArray();

    if (results.length === 0) {
      return res.send('No EdTech ideas with funding > 75 lakhs found. <a href="/">Back</a>');
    }

    let html = '<h2>EdTech Startups with Funding > 75 Lakhs</h2><ul>';
    for (const idea of results) {
      html += `<li><strong>${idea.title}</strong> by ${idea.team_name} (ID: ${idea.id}) – Funding: ₹${idea.funding_required} Lakhs</li>`;
    }
    html += '</ul><a href="/">Back</a>';
    res.send(html);
  } catch (err) {
    console.error(err);
    res.status(500).send('Error fetching ideas.');
  } finally {
    await client.close();
  }
});

app.listen(3000, () => {
  console.log('Server is running at http://localhost:3000');
});


-------------------------------------------------------------

// form.html

<!DOCTYPE html>
<html>
<body>
  <h2>Student Startup Idea Submission</h2>
  <form action="/submit" method="POST">
    <label>ID:</label><br>
    <input type="text" name="id" required><br><br>

    <label>Team Name:</label><br>
    <input type="text" name="team_name" required><br><br>

    <label>Title:</label><br>
    <input type="text" name="title" required><br><br>

    <label>Domain:</label><br>
    <input type="text" name="domain" required><br><br>

    <label>Funding Required (Lakhs):</label><br>
    <input type="number" name="funding_required" required><br><br>

    <button type="submit">Submit Idea</button>
  </form>

  <br>
  <a href="/edtech">View EdTech Startups (Funding > 75L)</a>
</body>
</html>

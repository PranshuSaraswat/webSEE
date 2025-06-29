const express = require('express');
const { MongoClient } = require('mongodb');
const path = require('path');

const app = express();
const uri = 'mongodb://127.0.0.1:27017';
const dbName = 'complaintDB';
const collectionName = 'complaints';

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// POST - Add new complaint
app.post('/complaint', async (req, res) => {
  const { complaint_id, user_name, issue } = req.body;
  if (!complaint_id || !user_name || !issue) {
    return res.status(400).send('All fields are required');
  }

  const client = new MongoClient(uri);
  try {
    await client.connect();
    const collection = client.db(dbName).collection(collectionName);

    await collection.insertOne({
      complaint_id,
      user_name,
      issue,
      status: 'Pending'
    });

    res.send('Complaint submitted successfully. <a href="/">Back</a>');
  } catch (err) {
    console.error(err);
    res.status(500).send('Error submitting complaint');
  } finally {
    await client.close();
  }
});

// PUT - Update complaint status using complaint_id
app.put('/complaint', async (req, res) => {
  const { id, status } = req.body;

  if (!id || !status) {
    return res.status(400).send('Complaint ID and status are required.');
  }

  const client = new MongoClient(uri);
  try {
    await client.connect();
    const collection = client.db(dbName).collection(collectionName);

    const result = await collection.updateOne(
      { complaint_id: id },
      { $set: { status } }
    );

    if (result.modifiedCount === 0) {
      return res.status(404).send('Complaint not found or already updated.');
    }

    res.send('Status updated successfully.');
  } catch (err) {
    console.error(err);
    res.status(500).send('Error updating complaint status.');
  } finally {
    await client.close();
  }
});

// GET - Get all pending complaints
app.get('/complaints/pending', async (req, res) => {
  const client = new MongoClient(uri);

  try {
    await client.connect();
    const db = client.db(dbName);
    const collection = db.collection(collectionName);

    const pending = await collection.find({ status: "Pending" }).toArray();

    if (pending.length === 0) {
      return res.send('<p>No pending complaints found.</p><a href="/">Go Back</a>');
    }

    res.json(pending);
  } catch (err) {
    console.error(err);
    res.status(500).send('Error fetching pending complaints');
  } finally {
    await client.close();
  }
});

app.listen(3000, () => {
  console.log('Server running at http://localhost:3000');
});



<------------------------------------------->




<!DOCTYPE html>
<html>
<head>
  <title>Complaint Management Portal</title>
</head>
<body>
  <h2>Submit a Complaint</h2>
  <form action="/complaint" method="POST">
    <label>Complaint ID:</label><br>
    <input type="text" name="complaint_id" placeholder="C123" required><br><br>

    <label>User Name:</label><br>
    <input type="text" name="user_name" placeholder="User Name" required><br><br>

    <label>Issue:</label><br>
    <input type="text" name="issue" placeholder="Issue" required><br><br>

    <button type="submit">Submit Complaint</button>
  </form>

  <hr>

  <h2>Update Complaint Status</h2>
  <label>Complaint ID:</label><br>
  <input type="text" id="complaintId" placeholder="C123"><br><br>

  <label>Status:</label><br>
  <select id="status">
    <option value="In Progress">In Progress</option>
    <option value="Resolved">Resolved</option>
  </select><br><br>

  <button onclick="updateStatus()">Update Status</button>
  <p id="updateResult"></p>

  <hr>

  <h2>View Pending Complaints</h2>
  <a href="/complaints/pending">Click here to view complaints with status "Pending"</a>

  <script>
    async function updateStatus() {
      const id = document.getElementById('complaintId').value;
      const status = document.getElementById('status').value;

      try {
        const res = await fetch('/complaint', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id, status })
        });

        const data = await res.text();
        document.getElementById('updateResult').innerText = data;
      } catch (err) {
        document.getElementById('updateResult').innerText = 'Error: ' + err.message;
      }
    }
  </script>
</body>
</html>


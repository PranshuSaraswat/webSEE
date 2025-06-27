const express = require('express');
const { MongoClient } = require('mongodb');
const path = require('path');

const app = express();
const uri = 'mongodb://127.0.0.1:27017';
const dbName = 'studentDB';
const collectionName = 'records';

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'form.html'));
});

// POST: Store student data
app.post('/submit', async (req, res) => {
  const { name, usn, department, grade } = req.body;

  if (!name || !usn || !department || !grade) {
    return res.send('All fields are required.');
  }

  const client = new MongoClient(uri);
  try {
    await client.connect();
    const collection = client.db(dbName).collection(collectionName);

    await collection.insertOne({ name, usn, department, grade });
    res.send('Student record added successfully. <a href="/">Back</a>');
  } catch (err) {
    console.error(err);
    res.status(500).send('Error saving student record.');
  } finally {
    await client.close();
  }
});

// PUT: Update grade by name
app.put('/update', async (req, res) => {
  const { name, grade } = req.body;

  if (!name || !grade) {
    return res.status(400).send('Name and new grade are required.');
  }

  const client = new MongoClient(uri);
  try {
    await client.connect();
    const collection = client.db(dbName).collection(collectionName);

    const result = await collection.updateOne(
      { name },
      { $set: { grade } }
    );

    if (result.modifiedCount === 0) {
      return res.status(404).send('Student not found or grade already updated.');
    }

    res.send('Grade updated successfully.');
  } catch (err) {
    console.error(err);
    res.status(500).send('Error updating grade.');
  } finally {
    await client.close();
  }
});

// GET: Display all student records
app.get('/students', async (req, res) => {
  const client = new MongoClient(uri);
  try {
    await client.connect();
    const collection = client.db(dbName).collection(collectionName);

    const students = await collection.find({}).toArray();

    if (students.length === 0) {
      return res.send('No student records found.');
    }

    let html = '<h2>All Student Records</h2><ul>';
    students.forEach(s => {
      html += `<li>${s.name} (USN: ${s.usn}) - Dept: ${s.department}, Grade: ${s.grade}</li>`;
    });
    html += '</ul><a href="/">Back</a>';

    res.send(html);
  } catch (err) {
    console.error(err);
    res.status(500).send('Error fetching records.');
  } finally {
    await client.close();
  }
});

app.listen(3000, () => {
  console.log('Student Records App running at http://localhost:3000');
});


//form.html
<!DOCTYPE html>
<html>
<head>
  <title>Student Record Manager</title>
</head>
<body>
  <h2>Add Student</h2>
  <form action="/submit" method="POST">
    <label>Name:</label><br>
    <input type="text" name="name" required><br><br>

    <label>USN:</label><br>
    <input type="text" name="usn" required><br><br>

    <label>Department:</label><br>
    <input type="text" name="department" required><br><br>

    <label>Grade:</label><br>
    <input type="text" name="grade" required><br><br>

    <button type="submit">Add Student</button>
  </form>

  <hr>

  <h2>Update Student Grade</h2>
  <input type="text" id="name" placeholder="Student Name"><br><br>
  <input type="text" id="newGrade" placeholder="New Grade"><br><br>
  <button onclick="updateGrade()">Update Grade</button>
  <p id="updateMsg"></p>

  <hr>

  <a href="/students">View All Students</a>

  <script>
    async function updateGrade() {
      const name = document.getElementById('name').value;
      const grade = document.getElementById('newGrade').value;

      const response = await fetch('/update', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, grade })
      });

      const msg = await response.text();
      document.getElementById('updateMsg').innerText = msg;
    }
  </script>
</body>
</html>

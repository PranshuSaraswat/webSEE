const express = require('express');
const { MongoClient, ObjectId } = require('mongodb');
const path = require('path');

const app = express();
const uri = 'mongodb://127.0.0.1:27017';
const dbName = 'internshipDB';
const collectionName = 'internships';

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'form.html'));
});

// POST: Add internship data
app.post('/submit', async (req, res) => {
  const { student_id, name, company, duration, status } = req.body;

  if (!student_id || !name || !company || !duration || !status) {
    return res.send('Please fill all fields correctly.');
  }

  const client = new MongoClient(uri);
  try {
    await client.connect();
    const collection = client.db(dbName).collection(collectionName);

    await collection.insertOne({
      student_id,
      name,
      company,
      duration,
      status
    });

    res.send('Internship record added successfully. <a href="/">Back</a>');
  } catch (err) {
    console.error(err);
    res.status(500).send('Error saving internship data.');
  } finally {
    await client.close();
  }
});

// GET: Show students interning at Infosys
app.get('/infosys', async (req, res) => {
  const client = new MongoClient(uri);
  try {
    await client.connect();
    const collection = client.db(dbName).collection(collectionName);

    const result = await collection.find({ company: "Infosys" }).toArray();

    if (result.length === 0) {
      return res.send('No students interning at Infosys.');
    }

    let html = '<h2>Infosys Interns</h2><ul>';
    result.forEach(s => {
      html += `<li>${s.name} (ID: ${s.student_id}) - Duration: ${s.duration}, Status: ${s.status}, ID: ${s._id}</li>`;
    });
    html += '</ul><a href="/">Back</a>';

    res.send(html);
  } catch (err) {
    console.error(err);
    res.status(500).send('Error retrieving data.');
  } finally {
    await client.close();
  }
});

// PUT: Mark internship as completed
app.put('/complete', async (req, res) => {
  const { student_id } = req.body;

  if (!student_id) return res.status(400).send('Student ID is required.');

  const client = new MongoClient(uri);
  try {
    await client.connect();
    const collection = client.db(dbName).collection(collectionName);

    const result = await collection.updateOne(
      { student_id: student_id },
      { $set: { status: "Completed" } }
    );

    if (result.modifiedCount === 0) {
      return res.status(404).send('Student not found or already marked as completed.');
    }

    res.send('Internship status updated to Completed.');
  } catch (err) {
    console.error(err);
    res.status(500).send('Error updating status.');
  } finally {
    await client.close();
  }
});


app.listen(3000, () => {
  console.log('Internship Tracker running on http://localhost:3000');
});





<!DOCTYPE html>
<html>
<head>
  <title>Internship Tracker</title>
</head>
<body>
  <h2>Add Internship</h2>
  <form action="/submit" method="POST">
    <label>Student ID:</label><br>
    <input type="text" name="student_id" placeholder="e.g. 1RV23CS001" required><br><br>

    <label>Name:</label><br>
    <input type="text" name="name" required><br><br>

    <label>Company:</label><br>
    <input type="text" name="company" required><br><br>

    <label>Duration:</label><br>
    <input type="text" name="duration" placeholder="e.g. 8 weeks" required><br><br>

    <label>Status:</label><br>
    <input type="text" name="status" placeholder="e.g. Ongoing" required><br><br>

    <button type="submit">Submit Internship</button>
  </form>

  <hr>

  <h2>Mark Internship as Completed</h2>
  <label>Enter Student ID:</label><br>
  <input type="text" id="studentId" placeholder="Student ID"><br><br>
  <button onclick="markCompleted()">Mark as Completed</button>
  <p id="updateMsg"></p>

  <hr>

  <a href="/infosys">View Infosys Interns</a>

  <script>
  async function markCompleted() {
    const student_id = document.getElementById('studentId').value;
    const output = document.getElementById('updateMsg');

    try {
      const response = await fetch('/complete', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ student_id })
      });

      const text = await response.text();
      output.innerText = text;
    } catch (err) {
      output.innerText = "Error updating status.";
    }
  }
</script>

</body>
</html>

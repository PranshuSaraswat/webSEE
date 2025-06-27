const express = require('express');
const { MongoClient } = require('mongodb');
const path = require('path');

const app = express();
const uri = 'mongodb://127.0.0.1:27017';
const dbName = 'enrollmentDB';
const collectionName = 'courses';

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve HTML form
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'form.html'));
});

// POST: Store enrollment data
app.post('/enroll', async (req, res) => {
  const { student_id, name, course_name, duration, status } = req.body;

  if (!student_id || !name || !course_name || !duration || !status) {
    return res.send('All fields are required.');
  }

  const client = new MongoClient(uri);
  try {
    await client.connect();
    const collection = client.db(dbName).collection(collectionName);

    await collection.insertOne({ student_id, name, course_name, duration, status });
    res.send('Enrollment saved successfully. <a href="/">Back</a>');
  } catch (err) {
    console.error(err);
    res.status(500).send('Error saving enrollment.');
  } finally {
    await client.close();
  }
});

// GET: Show all active enrollments
app.get('/active', async (req, res) => {
  const client = new MongoClient(uri);
  try {
    await client.connect();
    const collection = client.db(dbName).collection(collectionName);

    const active = await collection.find({ status: "active" }).toArray();

    if (active.length === 0) {
      return res.send('No active enrollments found. <a href="/">Back</a>');
    }

    let html = '<h2>Active Enrollments</h2><ul>';
    active.forEach(e => {
      html += `<li>${e.name} (${e.student_id}) - ${e.course_name} - ${e.duration}</li>`;
    });
    html += '</ul><a href="/">Back</a>';

    res.send(html);
  } catch (err) {
    console.error(err);
    res.status(500).send('Error retrieving enrollments.');
  } finally {
    await client.close();
  }
});

// PUT: Update enrollment to completed by Student_ID or Course_Name
app.put('/complete', async (req, res) => {
  const { student_id, course_name } = req.body;

  if (!student_id && !course_name) {
    return res.status(400).send('Provide Student_ID or Course_Name to update.');
  }

  const filter = student_id ? { student_id } : { course_name };

  const client = new MongoClient(uri);
  try {
    await client.connect();
    const collection = client.db(dbName).collection(collectionName);

    const result = await collection.updateOne(
      filter,
      { $set: { status: "completed" } }
    );

    if (result.modifiedCount === 0) {
      return res.status(404).send('No matching active enrollment found.');
    }

    res.send('Enrollment status updated to completed.');
  } catch (err) {
    console.error(err);
    res.status(500).send('Error updating enrollment.');
  } finally {
    await client.close();
  }
});

app.listen(3000, () => {
  console.log('Course Enrollment App running at http://localhost:3000');
});


//form.html

<!DOCTYPE html>
<html>
<head>
  <title>Course Enrollment</title>
</head>
<body>
  <h2>Enroll in a Course</h2>
  <form action="/enroll" method="POST">
    <label>Student ID:</label><br>
    <input type="text" name="student_id" required><br><br>

    <label>Name:</label><br>
    <input type="text" name="name" required><br><br>

    <label>Course Name:</label><br>
    <input type="text" name="course_name" required><br><br>

    <label>Duration:</label><br>
    <input type="text" name="duration" required><br><br>

    <label>Status:</label><br>
    <input type="text" name="status" placeholder="active" required><br><br>

    <button type="submit">Submit</button>
  </form>

  <hr>

  <h2>Mark Enrollment as Completed</h2>
  <input type="text" id="studentId" placeholder="Student ID (optional)"><br><br>
  <input type="text" id="courseName" placeholder="Course Name (optional)"><br><br>
  <button onclick="markCompleted()">Update Status</button>
  <p id="updateMsg"></p>

  <hr>

  <a href="/active">View Active Enrollments</a>

  <script>
    async function markCompleted() {
      const student_id = document.getElementById('studentId').value;
      const course_name = document.getElementById('courseName').value;

      const response = await fetch('/complete', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ student_id, course_name })
      });

      const msg = await response.text();
      document.getElementById('updateMsg').innerText = msg;
    }
  </script>
</body>
</html>

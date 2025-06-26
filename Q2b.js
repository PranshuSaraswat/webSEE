const express = require('express');
const { MongoClient } = require('mongodb');
const path = require('path');

const app = express();
const uri = 'mongodb://127.0.0.1:27017';
const dbName = 'examDB';
const collectionName = 'students';

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve form
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'form.html'));
});

// Store student data
app.post('/submit', async (req, res) => {
  const { student_name, usn, semester, exam_fee } = req.body;
  const semesterNum = parseInt(semester);
  const examFeeNum = exam_fee ? parseFloat(exam_fee) : 0;

  if (!student_name || !usn || isNaN(semesterNum)) {
    return res.send('Invalid input. Please fill all fields.');
  }

  const client = new MongoClient(uri);
  try {
    await client.connect();
    const collection = client.db(dbName).collection(collectionName);

    await collection.insertOne({
      student_name,
      usn,
      semester: semesterNum,
      exam_fee: examFeeNum
    });

    res.send('Student added successfully. <a href="/">Back</a>');
  } catch (err) {
    console.error(err);
    res.status(500).send('Error adding student.');
  } finally {
    await client.close();
  }
});

// Delete students who haven't paid
app.post('/delete-unpaid', async (req, res) => {
  const client = new MongoClient(uri);
  try {
    await client.connect();
    const collection = client.db(dbName).collection(collectionName);

    const result = await collection.deleteMany({
      $or: [
        { exam_fee: 0 },
        { exam_fee: null }
      ]
    });

    res.send(`${result.deletedCount} unpaid student(s) deleted.<br><a href="/">Back</a>`);
  } catch (err) {
    console.error(err);
    res.status(500).send('Error deleting unpaid students.');
  } finally {
    await client.close();
  }
});

app.listen(3000, () => {
  console.log('Server running at http://localhost:3000');
});


<!DOCTYPE html>
<html>
<head>
  <title>Student Exam Fee Management</title>
</head>
<body>
  <h2>Enter Student Details</h2>
  <form action="/submit" method="POST">
    <label>Student Name:</label><br>
    <input type="text" name="student_name" required><br><br>

    <label>USN:</label><br>
    <input type="text" name="usn" required><br><br>

    <label>Semester:</label><br>
    <input type="number" name="semester" required><br><br>

    <label>Exam Fee (₹):</label><br>
    <input type="number" name="exam_fee"><br><br>

    <button type="submit">Submit</button>
  </form>

  <hr>

  <h2>Delete Students Who Have Not Paid Exam Fee</h2>
  <form action="/delete-unpaid" method="POST">
    <button type="submit">Delete Unpaid Students</button>
  </form>
</body>
</html>

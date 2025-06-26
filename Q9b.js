const express = require('express');
const { MongoClient } = require('mongodb');
const path = require('path');

const app = express();
const uri = 'mongodb://127.0.0.1:27017';
const dbName = 'studentDB';
const collectionName = 'details';

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'form.html'));
});

app.post('/submit', async (req, res) => {
  const { user_name, branch, semester } = req.body;
  const semesterNum = parseInt(semester);

  if (!user_name || !branch || isNaN(semesterNum)) {
    return res.send('Please fill all fields correctly.');
  }

  const client = new MongoClient(uri);
  try {
    await client.connect();
    const db = client.db(dbName);
    const collection = db.collection(collectionName);

    await collection.insertOne({
      user_name,
      branch,
      semester: semesterNum
    });

    res.send('Student record saved. <a href="/">Add More</a> | <a href="/filter">View CSE 6th Sem Students</a>');
  } catch (err) {
    console.error(err);
    res.status(500).send('Error saving data.');
  } finally {
    await client.close();
  }
});

app.get('/filter', async (req, res) => {
  const client = new MongoClient(uri);
  try {
    await client.connect();
    const db = client.db(dbName);
    const collection = db.collection(collectionName);

    const result = await collection.find({
      branch: 'CSE',
      semester: 6
    }).toArray();

    if (result.length === 0) {
      return res.send('No CSE 6th semester students found. <a href="/">Back</a>');
    }

    let html = '<h2>CSE - 6th Semester Students</h2><ul>';
    for (const student of result) {
      html += `<li>${student.user_name} - Branch: ${student.branch}, Semester: ${student.semester}</li>`;
    }
    html += '</ul><a href="/">Back</a>';

    res.send(html);
  } catch (err) {
    console.error(err);
    res.status(500).send('Error fetching data.');
  } finally {
    await client.close();
  }
});

app.listen(3000, () => {
  console.log('Server running at http://localhost:3000');
});



<-------------html---------->


<!DOCTYPE html>
<html>
<body>
  <h2>Student Form</h2>
  <form action="/submit" method="POST">
    <label>User Name:</label><br>
    <input type="text" name="user_name" required><br><br>

    <label>Branch:</label><br>
    <input type="text" name="branch" required><br><br>

    <label>Semester:</label><br>
    <input type="number" name="semester" required><br><br>

    <button type="submit">Submit</button>
  </form>
  <br>
  <a href="/filter">View CSE 6th Sem Students</a>
</body>
</html>

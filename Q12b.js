
// install node_modules (folder) + node_mongo_2024 (folder)
// make sure mongodb is running in your system
// gedit server.js (add given content)
// gedit form.html (add the respective given code below) 
// node server.js
// visit localhost:3000 (on any browser)

sudo systemctl start mongod (to start mongodb)

----------------------------------------------
// server.js

const express = require('express');
const { MongoClient } = require('mongodb');
const path = require('path');

const app = express();
const uri = 'mongodb://127.0.0.1:27017';
const dbName = 'examDB';
const collectionName = 'students';

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/', (req, res) => {res.sendFile(path.join(__dirname, 'form.html'));});

app.post('/submit', async (req, res) => {
  const { name, usn, dept, marks } = req.body;
  const marksNum = parseInt(marks, 10);

  if (!name || !usn || !dept || isNaN(marksNum)) {
    return res.send('Invalid input. Please fill all fields correctly.');
  }

  const status = marksNum >= 20 ? 'Eligible' : 'Not Eligible';  // ✅ determine eligibility

  const client = new MongoClient(uri);

  try {
    await client.connect();
    const db = client.db(dbName);
    const collection = db.collection(collectionName);

    await collection.insertOne({
      name,
      usn,
      dept,
      marks: marksNum,
      status  // ✅ save eligibility status
    });

    res.send('Student details saved!');
  } catch (err) {
    console.error(err);
    res.status(500).send('Failed to save student.');
  } finally {
    await client.close();
  }
});


app.get('/not-eligible', async (req, res) => {
  const client = new MongoClient(uri);

  try {
    await client.connect();
    const db = client.db(dbName);
    const collection = db.collection(collectionName);

    const notEligible = await collection.find({ status : "Not Eligible" }).toArray();

    if (notEligible.length === 0) {
      return res.send('No students are not eligible (marks < 20). <a href="/">Go back</a>');
    }

    let html = '<h2>Not Eligible Students (Marks < 20)</h2><ul>';
    for (const student of notEligible) {
  html += `<li>Name: ${student.name}, USN: ${student.usn}, Dept: ${student.dept}, Marks: ${student.marks}</li>`;
}
    html += '</ul><a href="/">Go back</a>';

    res.send(html);
  } catch (err) {
  } finally {
    await client.close();
  }
});
//option
app.get('/not-eligible', async (req, res) => {
  const client = new MongoClient(uri);

  try {
    await client.connect();
    const db = client.db(dbName);
    const collection = db.collection(collectionName);

    const notEligible = await collection.find({ status: "Not Eligible" }).toArray();

    if (notEligible.length === 0) {
      return res.json({ message: 'No students are not eligible (marks < 20).' });
    }

    res.json(notEligible);  // ✅ raw JSON response
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch students.' });
  } finally {
    await client.close();
  }
});


app.listen(3000, () => {
  console.log('Server running at http://localhost:3000');
});


----------------------------------------------
// form.html

<html>
<body>
  <form action="/submit" method="POST">
    <label>Name:</label><br />
    <input type="text" name="name" required /><br /><br />

    <label>USN:</label><br />
    <input type="text" name="usn" required /><br /><br />

    <label>Department:</label><br />
    <input type="text" name="dept" required /><br /><br />

    <label>Marks:</label><br />
    <input type="number" name="marks" min="0" max="100" required /><br /><br />

    <button type="submit">Submit</button>
  </form>
  <hr>
  <h2>List of students Not eligible</h2>
  <form action="/not-eligible" method="Get">
    <button type="submit">Searxh</button>
  </form>
</body>
</html>
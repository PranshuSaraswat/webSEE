
// install node_modules (folder) + node_mongo_2024 (folder)
// make sure mongodb is running in your system
// gedit server.js (add given content)
// gedit form.html (add the respective given code below) 
// cd ..
// node server.js
// visit localhost:3000 (on any browser)

sudo systemctl start mongod (to start mongodb)

------------------------------------------------------

// server.js

const express = require('express');
const { MongoClient } = require('mongodb');
const path = require('path');

const app = express();
const uri = 'mongodb://127.0.0.1:27017';
const dbName = 'attendanceDB';
const collectionName = 'students';

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'form.html'));
});

app.post('/submit', async (req, res) => {
  const { name, usn, dept, totalClasses, attendedClasses } = req.body;

  const total = parseInt(totalClasses);
  const attended = parseInt(attendedClasses);

  if (!name || !usn || !dept || isNaN(total) || isNaN(attended) || total <= 0 || attended < 0 || attended > total) {
    return res.send('Invalid input. Please enter valid attendance data.');
  }

  const attendancePercent = ((attended / total) * 100).toFixed(2); // ✅ calculated

  const client = new MongoClient(uri);
  try {
    await client.connect();
    const db = client.db(dbName);
    const collection = db.collection(collectionName);

    await collection.insertOne({
      name,
      usn,
      dept,
      totalClasses: total,
      attendedClasses: attended,
      attendancePercent: parseFloat(attendancePercent)
    });

    res.send(`Student data saved! Attendance: ${attendancePercent}%<br><a href="/">Add More</a> | <a href="/not-eligible">View Not Eligible</a>`);
  } catch (err) {
    console.error(err);
    res.status(500).send('Error saving data.');
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

    const notEligible = await collection.find({ attendancePercent: { $lt: 75 } }).toArray();

    if (notEligible.length === 0) {
      return res.send('All students are eligible. <a href="/">Go back</a>');
    }

    let html = '<h2>Not Eligible Students (Attendance < 75%)</h2><ul>';
    for (const student of notEligible) {
      html += `<li>Name: ${student.name}, USN: ${student.usn}, Dept: ${student.dept}, Attendance: ${student.attendancePercent}%</li>`;
    }
    html += '</ul><a href="/">Go back</a>';

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


----------------------------------------------------

// form.html

<html lang="en">
<body>
  <h1>Student Attendance Entry</h1>
  <form action="/submit" method="POST">
    <label>Name:</label><br>
    <input type="text" name="name" required /><br><br>

    <label>USN:</label><br>
    <input type="text" name="usn" required /><br><br>

    <label>Department:</label><br>
    <input type="text" name="dept" required /><br><br>

    <label>Attendance (%):</label><br>
    <input type="number" name="attendance" min="0" max="100" step="0.01" required /><br><br>

    <button type="submit">Submit</button>
  </form>
  <a href="/low-attendance">View Students Below 75% Attendance</a>
</body>
</html>
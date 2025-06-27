const express = require('express');
const { MongoClient } = require('mongodb');
const path = require('path');

const app = express();
const uri = 'mongodb://127.0.0.1:27017';
const dbName = 'Hr';
const collectionName = 'employees';

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve HTML form
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'form.html'));
});

// Handle form submission
app.post('/submit', async (req, res) => {
  const { emp_name, email, phone, hire_date, job_title, salary } = req.body;
  const salaryNum = parseFloat(salary);

  if (!emp_name || !email || !phone || !hire_date || !job_title || isNaN(salaryNum)) {
    return res.send('Please fill all fields correctly.');
  }

  const client = new MongoClient(uri);
  try {
    await client.connect();
    const db = client.db(dbName);
    const collection = db.collection(collectionName);

    await collection.insertOne({
      emp_name,
      email,
      phone,
      hire_date,
      job_title,
      salary: salaryNum
    });

    res.send('Employee record added successfully. <a href="/">Add Another</a>');
  } catch (err) {
    console.error(err);
    res.status(500).send('Error saving employee.');
  } finally {
    await client.close();
  }
});

// GET: Show employees with salary > 50000
app.get('/high-salary', async (req, res) => {
  const client = new MongoClient(uri);
  try {
    await client.connect();
    const db = client.db(dbName);
    const collection = db.collection(collectionName);

    const employees = await collection.find({ salary: { $gt: 50000 } }).toArray();

    if (employees.length === 0) {
      return res.send('No employees with salary > 50,000. <a href="/">Back</a>');
    }

    let html = '<h2>Employees with Salary > ₹50,000</h2><ul>';
    employees.forEach(emp => {
      html += `<li>${emp.emp_name} - ${emp.job_title} - ₹${emp.salary} - Hired: ${emp.hire_date}</li>`;
    });
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

-------------------------------
//form.html
<!DOCTYPE html>
<html>
<head>
  <title>Employee Form</title>
</head>
<body>
  <h2>Enter Employee Details</h2>
  <form action="/submit" method="POST">
    <label>Employee Name:</label><br>
    <input type="text" name="emp_name" required><br><br>

    <label>Email:</label><br>
    <input type="email" name="email" required><br><br>

    <label>Phone:</label><br>
    <input type="text" name="phone" required><br><br>

    <label>Hire Date:</label><br>
    <input type="date" name="hire_date" required><br><br>

    <label>Job Title:</label><br>
    <input type="text" name="job_title" required><br><br>

    <label>Salary:</label><br>
    <input type="number" name="salary" required><br><br>

    <button type="submit">Submit</button>
  </form>

  <br>
  <a href="/high-salary">View Employees with Salary > 50,000</a>
</body>
</html>

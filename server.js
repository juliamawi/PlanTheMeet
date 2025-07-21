import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import { Pool } from 'pg';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import 'dotenv/config'; //allows for env use

const app = express();
const PORT = process.env.PORT || 8080;

app.use(cors());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// PostgreSQL pool setup
const db = new Pool({
  connectionString: process.env.DATABASE_URL,  
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});


db.connect()
  .then(() => console.log('Connected to PostgreSQL database'))
  .catch(err => console.error('PostgreSQL connection error:', err.stack));


db.query('SELECT * FROM users')
  .then(results => {
    console.table(results.rows);
  })
  .catch(err => {
    console.error('Query failed:', err.message);
  });


app.post('/processsignup', async (req, res) => {
  const { email, password } = req.body;

  try {
    const userCheck = await db.query('SELECT * FROM users WHERE email = $1', [email]);

    if (userCheck.rows.length > 0) {
      return res.status(409).json({ message: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await db.query(
      'INSERT INTO users (email, password) VALUES ($1, $2)',
      [email, hashedPassword]
    );

    res.status(201).json({ message: 'User created successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Database error', details: err.message });
  }
});


app.post('/processlogin', async (req, res) => {
  const { email, password } = req.body;

  try {
    const userResult = await db.query('SELECT * FROM users WHERE email = $1', [email]);

    if (userResult.rows.length === 0) {
      return res.status(404).json({ message: 'User does not exist' });
    }

    const user = userResult.rows[0];

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({ message: 'Wrong password' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '5m' }
    );

    res.status(200).json({ token });
  } catch (err) {
    res.status(500).json({ error: 'Login failed', details: err.message });
  }
});


app.post('/createEvent', async (req, res) => {
  const { name, startDate, endDate, startTime, endTime, invitees, creatorEmail } = req.body;

  try {
    const eventCheck = await db.query('SELECT * FROM events WHERE name = $1', [name]);

    if (eventCheck.rows.length > 0) {
      return res.status(409).json({ message: 'Event already exists' });
    }

    await db.query(
      `INSERT INTO events (name, start_date, end_date, start_time, end_time, invitees, creator_email)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [name, startDate, endDate, startTime, endTime, invitees, creatorEmail]
    );

    res.status(200).json({ message: 'Event created successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Insert error', error: err.message });
  }
});

app.get('/getEventByName', async (req, res) => {
  const { name, user_email } = req.query;

  if (!name || !user_email) {
    return res.status(400).json({ message: 'Missing event name or user email' });
  }

  try {
    const eventRes = await db.query('SELECT * FROM events WHERE name = $1', [name]);

    if (eventRes.rows.length === 0) {
      return res.status(404).json({ message: 'Event not found' });
    }

    const event = eventRes.rows[0];

    const availRes = await db.query('SELECT * FROM availability WHERE event_name = $1', [name]);

    const availabilityMap = {};
    for (const row of availRes.rows) {
      if (row.user_email === user_email) {
        const key = `${row.date}-${row.time_slot}`;
        availabilityMap[key] = row.status;
      }
    }
    event.availability = availabilityMap;

    const groupAvailQuery = `
      SELECT date, time_slot,
        COUNT(CASE WHEN status = 'available' THEN 1 ELSE NULL END) AS available_count
      FROM availability
      WHERE event_name = $1
      GROUP BY date, time_slot;
    `;

    const groupAvailRes = await db.query(groupAvailQuery, [name]);

    const groupAvailabilityMap = {};
    for (const row of groupAvailRes.rows) {
      const key = `${row.date}-${row.time_slot}`;
      groupAvailabilityMap[key] = parseInt(row.available_count, 10);
    }

    event.groupAvailability = groupAvailabilityMap;
    res.status(200).json(event);
  } catch (err) {
    res.status(500).json({ message: 'DB error', error: err.message });
  }
});


app.post('/updateAvailability', async (req, res) => {
  const { event_name, user_email, date, time_slot, status } = req.body;

  if (!event_name || !user_email || !date || !time_slot || !status) {
    return res.status(400).json({ message: 'Missing required fields' });
  }

  try {
    const checkRes = await db.query(
      `SELECT * FROM availability WHERE event_name = $1 AND user_email = $2 AND date = $3 AND time_slot = $4`,
      [event_name, user_email, date, time_slot]
    );

    if (checkRes.rows.length > 0) {
      await db.query(
        `UPDATE availability SET status = $1 WHERE event_name = $2 AND user_email = $3 AND date = $4 AND time_slot = $5`,
        [status, event_name, user_email, date, time_slot]
      );

      res.status(200).json({ message: 'Availability updated' });
    } else {
      await db.query(
        `INSERT INTO availability (event_name, user_email, date, time_slot, status) VALUES ($1, $2, $3, $4, $5)`,
        [event_name, user_email, date, time_slot, status]
      );

      res.status(201).json({ message: 'Availability saved' });
    }
  } catch (err) {
    res.status(500).json({ message: 'Database error', error: err.message });
  }
});

app.get('/getAllEvents', async (req, res) => {
  try {
    const results = await db.query('SELECT * FROM events');
    res.status(200).json(results.rows);
  } catch (err) {
    res.status(500).json({ message: 'Database error', error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

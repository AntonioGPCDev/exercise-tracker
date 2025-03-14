const express = require('express')
const app = express()
const cors = require('cors')
const bodyParser = require('body-parser');
const sequelize = require('./config/database');
const User = require('./models/User');
const Exercise = require('./models/Exercise');
const req = require('express/lib/request');
require('dotenv').config()

app.use(cors())
app.use(express.static('public'))
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

//Sincronize the model with the SQLite database
sequelize.sync({ force:true }) // force the tables creation (delete the previous ones if they exist)
  .then(()=>console.log('Database syncronized!'))
  .catch(err => console.log('Error syncing database: ', err));

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

// Create user
app.post('/api/users', async (req, res) => {
  console.log(req.body);
  const { username } = req.body;
  try {
    const user = await User.create({ username });
    res.json({
      username: user.username,
      _id: user.id
    });
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(400).json({ error: 'Error creating user' });
  }
});

// Get all users
app.get('/api/users', async (req, res) => {
  try {
    const users = await User.findAll();
    const usersList = users.map(user => ({
      _id: user.id,
      username: user.username,
      __v: 0
    }));

    res.json(usersList);
  } catch (error) {
    res.status(400).json({ error: 'Error retrieving users' });
  }
});

// Add an exercise to a user
app.post('/api/users/:_id/exercises', async (req, res) => {
  const { description, duration, date = new Date().toDateString() } = req.body;
  try {
    const user = await User.findByPk(req.params._id);
    if (!user) return res.status(400).json({ error: 'User not found' });

    const exercise = await Exercise.create({
      description,
      duration,
      date,
      userId: user.id,
    });

    res.json({
      username: user.username,
      _id: user.id,
      description,
      duration,
      date,
    });
  } catch (error) {
    res.status(400).json({ error: 'Error adding exercise' });
  }
});

// Get all users's exercises
app.get('/api/users/:_id/logs', async (req, res) => {
  const { from, to, limit } = req.query;
  try {
    const user = await User.findByPk(req.params._id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const exercises = await Exercise.findAll({
      where: {
        userId: user.id,
        ...(from && { date: { [Sequelize.Op.gte]: new Date(from) } }),
        ...(to && { date: { [Sequelize.Op.lte]: new Date(to) } }),
      },
      limit: limit ? parseInt(limit) : undefined,
    });

    res.json({
      username: user.username,
      count: exercises.length,
      _id: user.id,
      log: exercises.map(ex => ({
        description: ex.description,
        duration: ex.duration,
        date: ex.date,
      })),
    });
  } catch (error) {
    res.status(400).json({ error: 'Error retrieving logs' });
  }
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
});

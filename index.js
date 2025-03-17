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
      _id: user.id.toString(),
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
  try {
    const { description, duration } = req.body;
    let { date } = req.body;

    date = date ? new Date(date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]; // yyyy-mm-dd

    const user = await User.findByPk(req.params._id);
    if (!user) return res.status(400).json({ error: 'User not found' });

    const exercise = await Exercise.create({
      description,
      duration,
      date,
      userId: user.id,
    });

    res.json({
      _id: user.id.toString(),
      username: user.username,
      date,
      duration: Number(duration),
      description
    });
  } catch (error) {
    console.error(error);
    res.status(400).json({ error: 'Error adding exercise' });
  }
});


// Get users's exercises
const { Op } = require('sequelize');

app.get('/api/users/:_id/logs', async (req, res) => {
  try {
    const { from, to, limit } = req.query;

    // Convertir las fechas 'from' y 'to' al formato 'yyyy-mm-dd'
    const fromDate = from ? new Date(from).toISOString().split('T')[0] : null;
    const toDate = to ? new Date(to).toISOString().split('T')[0] : null;

    const user = await User.findByPk(req.params._id);
    if (!user) return res.status(400).json({ error: 'User not found' });

    let whereClause = { userId: user.id };

    // Si se proporciona 'from' o 'to', agregar las condiciones de fecha
    if (fromDate || toDate) {
      whereClause.date = {};

      if (fromDate) whereClause.date[Op.gte] = fromDate; // A partir de 'from'
      if (toDate) whereClause.date[Op.lte] = toDate; // Hasta 'to'
    }

    // Realizar la consulta
    const exercises = await Exercise.findAll({
      where: whereClause,
      limit: limit ? parseInt(limit, 10) : undefined,
      order: [['date', 'ASC']], // Ordenar por fecha
    });

    // Enviar respuesta con el formato requerido (DateString())
    res.json({
      _id: user.id.toString(),
      username: user.username,
      count: exercises.length,
      log: exercises.map(ex => ({
        description: ex.description,
        duration: Number(ex.duration),
        date: new Date(ex.date).toDateString(), // Convertir la fecha de 'yyyy-mm-dd' a 'DateString()'
      })),
    });

  } catch (error) {
    console.error(error);
    res.status(400).json({ error: 'Error retrieving logs' });
  }
});


const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
});

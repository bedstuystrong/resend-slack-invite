require('dotenv').config();

const isSameDay = require('date-fns/isSameDay');
const express = require('express');
const bodyParser = require('body-parser');
const bearerToken = require('express-bearer-token');

const { createActiveUser } = require('./slack');
const { resendInvite } = require('./invite');

const app = express();
app.use(bodyParser.json());
app.use(bearerToken());

const PORT = process.env.PORT || 3000;
const API_SECRET = process.env.API_SECRET;

app.use((req, res, next) => {
  if (!!API_SECRET && req.token !== API_SECRET) {
    res.status(401).send('Unauthorized');
  } else {
    next();
  }
});

app.post('/user', async (req, res) => {
  const email = req.body.email;
  const name = req.body.name;

  if (!(name && email)) {
    res.status(400).send('Bad request');
    return;
  }
  
  try {
    const user = await createActiveUser({email, name});
    console.log('created or updated SCIM user', { id: user.id });

    const createdAt = new Date(user.meta.created);
    const response = {user};
    
    if (isSameDay(createdAt, new Date())) {
      const invited = await resendInvite(email);
      response.invited = invited;
      console.log('attempted to send invite for user', { id: user.id, invited: invited });
    } else {
      response.invited = false;
    }

    res.status(200).json(response);
  } catch (e) {
    console.error(e);
    res.status(500).send(e.message);
  }
});

app.listen(PORT, () => {
  console.log(`Listening on ${PORT}`);
});

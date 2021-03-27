const crypto = require('crypto');
const fetch = require('make-fetch-happen');

const SCIM_TOKEN = process.env.SCIM_TOKEN;
const MAX_RETRIES = 5;

const generatePassword = () => new Promise((resolve, reject) => {
  crypto.randomBytes(32, (err, buffer) => {
    if (err) {
      reject(err);
    } else {
      resolve(buffer.toString('hex'));
    }
  });
});

const createScimUser = async ({email, name, username = email} = {}) => {
  const body = {
    schemas: [
      'urn:scim:schemas:core:1.0',
      'urn:scim:schemas:extension:enterprise:1.0'
    ],
    emails: [{ value: email, primary: true }],
    userName: username,
    displayName: name,
    active: true,
    password: await generatePassword(),
  };
  const response = await fetch('https://api.slack.com/scim/v1/Users/', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${SCIM_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  const json = await response.json();
  if (response.ok) {
    return json;
  } else {
    const error = new Error(json.Errors.description);
    error.json = json.Errors;
    throw error;
  }
};

const extractUsernameError = (error) => {
  if (!error.message.includes('username')) return false;

  const matches = error.message.match(/(\S+)\s\(username=(.*)\)/i);
  error.code = matches[1];
  error.username = matches[2];

  return error;
};

const fixUsernameError = (error) => {
  const {code, username} = error;

  switch (code) {
    case 'username_too_long':
      return username.substring(0, 21);
    case 'username_taken':
      return username.substr(0, 20) + Math.random().toString().substr(2, 1);
    default:
      console.warn('Unhandled SCIM username error', error.message);
      return username;
  }
}

const createUser = async ({email, name}) => {
  let retries = 0;
  let username = email;

  while (retries <= MAX_RETRIES) {
    try {
      return await createScimUser({ email, name, username });
    } catch (error) {
      const usernameError = extractUsernameError(error);

      if (usernameError) {
        username = fixUsernameError(error);
        retries++;
        continue;
      } else {
        throw error;
      }
    }
  }
};

module.exports = {
  createUser,
};
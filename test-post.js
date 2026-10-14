import http from 'http';

const data = JSON.stringify({
  playerId: 'TEST-SCRIPT-ID',
  displayName: 'TESTER',
  avatar: '🚀',
  raceTime: 99999,
  topSpeed: 100,
  designScore: 10,
  liveryThumb: ''
});

const dataBuffer = Buffer.from(data, 'utf-8');

const options = {
  hostname: 'localhost',
  port: 4000,
  path: '/leaderboard',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': dataBuffer.length
  }
};

const req = http.request(options, res => {
  console.log(`statusCode: ${res.statusCode}`);
  let responseData = '';
  res.on('data', d => {
    responseData += d;
  });
  res.on('end', () => {
    console.log(responseData);
  });
});

req.on('error', error => {
  console.error(error);
});

req.write(dataBuffer);
req.end();

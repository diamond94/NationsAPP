/* eslint-disable no-console */
const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Central place for all uncaught exeptions(all bugs that occured in synchronus code but not handlled anywhere)
process.on('uncaughtException', (err) => {
  console.error(`uncaughtException!💥 Shutting Down...`);
  console.error(`Error Name : ${err.name}\nError Message : ${err.message}`);
  process.exit(1);
});

dotenv.config({ path: './config.env' });
const app = require('./app');

const DB = process.env.DATABASE.replace('<PASSWORD>', process.env.DATABASE_PASSWORD);
const DBConnect = async () => {
  await mongoose.connect(DB, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: true,
    useUnifiedTopology: true,
  });
  console.log(`connected to DATABASE`);
};
DBConnect();

const port = process.env.PORT;
const ip = process.env.IP;
const server = app.listen(port, ip, () => {
  console.log(`APP Running on ${ip} IP & Port ${port}...`);
});

// Central Place for all unhandledRejection in our APP (Async Code)
process.on('unhandledRejection', (err) => {
  console.error(`Error Name : ${err.name}\nError Message : ${err.message}`);
  console.error(`unhandledRejection!💥 Shutting Down...`);
  server.close(() => {
    // by doing this we give the server time to finish all the requests that are stil pending or being handleld
    process.exit(1); // 0 for success & 1 for uncaught exeptions
  });
});

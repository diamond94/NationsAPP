/* eslint-disable no-console */
const fs = require('fs');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Country = require('../../models/countryModel');

dotenv.config({ path: './config.env' });

const DB = process.env.DATABASE.replace('<PASSWORD>', process.env.DATABASE_PASSWORD);

const DBConnect = async () => {
  try {
    await mongoose.connect(DB, {
      useNewUrlParser: true,
      useCreateIndex: true,
      useFindAndModify: true,
      useUnifiedTopology: true,
    });
    console.log(`connected to DATABASE`);
  } catch (err) {
    console.log(`can't connect to DB`);
  }
};
DBConnect();

const countries = JSON.parse(
  fs.readFileSync(`${__dirname}/countries.json`, 'utf-8')
);

const importData = async () => {
  try {
    await Country.create(countries);
    console.log(`DATA Successfully loaded!`);
  } catch (err) {
    console.log(err);
  }
  process.exit();
};

const deleteData = async () => {
  try {
    await Country.deleteMany();
    console.log(`DATA Successfully Deleted`);
  } catch (err) {
    console.log(err);
  }
  process.exit();
};

if (process.argv[2] === '--import') {
  importData();
} else if (process.argv[2] === '--delete') {
  deleteData();
}

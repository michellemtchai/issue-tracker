const mongoose = require('mongoose');
module.exports = (action) => {
  mongoose
    .connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      useCreateIndex: true,
      useFindAndModify: false,
    })
    .then(() => {
      console.log('MongoDB Connected');
      action();
    })
    .catch((err) => console.log('Database Error', err));
};

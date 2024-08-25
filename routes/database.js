const mongoose = require('mongoose');
module.exports = (action)=>{
  mongoose.connect(process.env.DB, {
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
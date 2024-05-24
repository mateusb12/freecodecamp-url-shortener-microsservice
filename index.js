require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const shortId = require('shortid');
const validUrl = require('valid-url');

const port = process.env.PORT || 3000;

// Connect to database
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });

// Schema for URL
const urlSchema = new mongoose.Schema({
  original_url: String,
  short_url: String
});

const URL = mongoose.model('URL', urlSchema);

app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
app.use('/public', express.static(`${process.cwd()}/public`));

app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

app.post('/api/shorturl', async function(req, res) {
  const { url } = req.body; // Assuming you have a form input named 'url'
  const urlCode = shortId.generate();

  if (!validUrl.isWebUri(url)) {
    res.json({ error: 'invalid url' });
  } else {
    try {
      let findOne = await URL.findOne({ original_url: url });
      if (findOne) {
        res.json({ original_url: findOne.original_url, short_url: findOne.short_url });
      } else {
        findOne = new URL({ original_url: url, short_url: urlCode });
        await findOne.save();
        res.json({ original_url: url, short_url: urlCode });
      }
    } catch (err) {
      console.error(err);
      res.status(500).json('Server error');
    }
  }
});

app.get('/api/shorturl/:short_url', async function(req, res) {
  try {
    const urlParams = await URL.findOne({ short_url: req.params.short_url });
    if (urlParams) {
      return res.redirect(urlParams.original_url);
    } else {
      return res.status(404).json('No URL found');
    }
  } catch (err) {
    console.error(err);
    res.status(500).json('Server error');
  }
});

app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});

const express = require('express');
// use env
require('dotenv').config();
const PORT = process.env.PORT || 3000;
const IP = process.env.IP || 'localhost';

SITE_POLL_TIMER = 3600000; // 1 hour
DB_UPDATE_TIMER = 60000; // 1 minute

const app = express();
const fs = require('fs');
// check if db.json exists
if (!fs.existsSync('./public/db.json')) {
    fs.writeFileSync('./public/db.json', '{}');
}
const site_statuses = JSON.parse(fs.readFileSync('./public/db.json').toString());

app.use(express.static('public'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/', (req, res) => {
    res.render('index.html');
});

const FETCH_HEADER = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Safari/537.36' // <---
}

async function update_sites() {
    console.log("Updating site statuses...");
    // get list of sites from sites.txt and return a dict of their url:status
    const fs = require('fs');
    const sites = fs.readFileSync('./public/sites.txt').toString().split('\n');
    for(s in sites){
        const index = s
        fetch(sites[index], FETCH_HEADER).then(response => {
            console.log(`Resonse from ${sites[index]}: ${response.status}`);
            site_statuses[sites[index]] = response.status
        }).catch(e => {
            console.log(e)
            site_statuses[sites[index]] = "Timeout"
        });
        if(s % 10 == 0){
            await new Promise(r => setTimeout(r, 5000));
        }
    }
}

async function update_db(db_json_file){
    // look at the site_statuses and update the db file
    console.log("DB updating");
    fs.writeFileSync(db_json_file, JSON.stringify(site_statuses));
    console.log("DB updated");
}

app.get('/api/sites', (req, res) => {
    // return site_statuses
    console.log("GET /api/sites");
    // console.log(site_statuses);
    res.json(site_statuses);
});

app.post('/api/sites', (req, res) => {
    // update site_statuses
    console.log("POST /api/sites");
    update_sites();
    res.json(site_statuses);
});

setTimeout(update_sites, SITE_POLL_TIMER); // update every hour
setTimeout(update_db, DB_UPDATE_TIMER, './public/db.json'); // update every minute, just in case the user requests an update

app.listen(PORT, IP, () => {
    console.log(`Server is running on http://${IP}:${PORT}`);
});
const express = require('express');
// use env
require('dotenv').config();
const PORT = process.env.PORT || 3000;
const IP = process.env.IP || 'localhost';

const app = express();
site_statuses = {};

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

update_sites();
setTimeout(update_sites, 3600000); // update every hour

app.listen(PORT, IP, () => {
    console.log(`Server is running on http://${IP}:${PORT}`);
});
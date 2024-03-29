
const express = require('express')
const ical = require('ical')
const got = require('got')
const traverse = require('traverse')
const ics = require('ics')
const moment = require('moment')

const app = express()
const port = 3000

const cals = {
    'U14A': 'https://www.basketplan.ch/exportTeamGamesICAL.do?teamId=557&seasonId=26'
}

app.get('/cals/:cal', (req, res) => {
    console.log("request on "+req.params.cal+" from "+req.ip)
    result = got(cals[req.params.cal]).then(result => {
        var cal = ical.parseICS(result.body)
        var output = []
        traverse(cal).forEach(node => {
            if(node && node.type == 'VEVENT') {
                var teams = node.summary.match(/.*'(.*)'.*'(.*)'/)
                var home = teams[1].indexOf('MJ Union') != -1
                var opponent = home ? teams[2] : teams[1]
                opponent = opponent.split(' ')
                    .filter(s => s != "Basket")
                    .filter(s => s != "Club")
                    .filter(s => s != "US")
                    .filter(s => s != "ES")
                    .filter(s => s != "Union")
                    .filter(s => s.indexOf("U14") != 0)
                    .slice(0,2).join(' ')
                output.push({
                    uid: node.uid + "-ucal-" + req.params.cal,
                    title : '🏀 ' + req.params.cal + (home ? ' < ' : ' > ') + opponent,
                    description : node.summary,
                    location: node.location,
                    start : moment(node.start).format('YYYY-M-D-H-m').split("-"),
                    end : moment(node.end).format('YYYY-M-D-H-m').split("-")
                })
            }
        })
        res.set('Content-Type', 'text/calendar')
        res.send(ics.createEvents(output).value)
    })
})

app.listen(port, () => {
    console.log(`UCAL listening at http://localhost:${port}`)
})

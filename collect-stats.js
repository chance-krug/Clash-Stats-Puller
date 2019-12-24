const auth = require('./auth.json');
const statObject = require('./stats.json');
const axios = require('axios');
const fs = require('fs');
const schedule = require('node-schedule');
const config = {
    headers: {
        Accept: 'application/json',
        authorization: 'Bearer ' + auth.clashToken
    }
};
console.log('Starting at: ' + new Date());
let j = schedule.scheduleJob('*/15 * * * *', function(fireDate){
    console.log('Stats Loaded at: ' + new Date());
    //Fetches the current war data and compares it to what is already in the stat json. Adding all new attacks and skipping duplicates
    axios.get('https://api.clashofclans.com/v1/clans/%232R0Q8YV0/currentwar', config)
        .then(response => {
            let members = response.data.clan.members;
            let opponentMembers = response.data.opponent.members;
            for (let i = 0; i < members.length; i++){
                let statObjectOne = {
                    "name": null,
                    "tag": null,
                    "stars": null,
                    "thLevel": null,
                    "enemyTHLevel": null,
                    "enemyTag": null
                };
                let statObjectTwo= {
                    "name": null,
                    "tag": null,
                    "stars": null,
                    "thLevel": null,
                    "enemyTHLevel": null,
                    "enemyTag": null
                };
                //If we have attacks attempt to add them to the stats
                if(typeof members[i].attacks !== "undefined"){
                    statObjectOne.tag = members[i].attacks[0].attackerTag;
                    statObjectOne.stars = members[i].attacks[0].stars;
                    statObjectOne.thLevel = members[i].townhallLevel;
                    statObjectOne.name = members[i].name;
                    statObjectOne.enemyTag = members[i].attacks[0].defenderTag;
                    statObjectOne.enemyTHLevel = findEnemyTHLevel(opponentMembers, members[i].attacks[0].defenderTag);
                    //Only add to stats if its not a duplicate record
                    if(!isDuplicate(statObjectOne)){
                        statObject.stats.push(statObjectOne);
                    }
                    //If we have a second attack attempt to add it to the stats
                    if(typeof members[i].attacks[1] !== "undefined") {
                        statObjectTwo.tag = members[i].attacks[1].attackerTag;
                        statObjectTwo.stars = members[i].attacks[1].stars;
                        statObjectTwo.thLevel = members[i].townhallLevel;
                        statObjectTwo.name = members[i].name;
                        statObjectTwo.enemyTag = members[i].attacks[1].defenderTag;
                        statObjectTwo.enemyTHLevel = findEnemyTHLevel(opponentMembers, members[i].attacks[1].defenderTag);
                        //Only add to stats if its not a duplicate record
                        if (!isDuplicate(statObjectTwo)){
                            statObject.stats.push(statObjectTwo);
                        }
                    }
                }
                //Output the data to the stats.json file for use by other applications
                let data = JSON.stringify(statObject);
                fs.writeFileSync('stats.json', data);
            }

        })
        .catch(error => {
            console.log(error);
        });
});


/**
 * Finds the enemy town hall level given their tag and the list of opponent members
 * @param members - The opponents member list in json format
 * @param tag - The tag of the enemy player we are trying to lookup
 * @returns townHallLevel - The integer town hall level of the opponent
 */
function findEnemyTHLevel(members, tag){
    for (let i = 0; i < members.length; i++) {
        if(members[i].tag === tag){
            return members[i].townhallLevel;
        }
    }
}

/**
 * Checks if the new data we have has already been stored
 * @param obj - The stat object we are attempting to add
 * @returns isDuplicate - If we are a duplicate or not
 */
function isDuplicate(obj){
    for (let i = 0; i < statObject.stats.length; i++) {
        if(statObject.stats[i].tag === obj.tag && statObject.stats[i].enemyTag === obj.enemyTag){
            return true;
        }
    }
    return false;
}

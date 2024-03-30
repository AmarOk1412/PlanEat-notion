const cron = require('node-cron');
const axios = require('axios');
const cheerio = require('cheerio');

const ricardo = require('./connectors/ricardo');
const chacuit = require('./connectors/chacuit');

require("dotenv").config()
const app = require('./notion');
const PlanEat = require('./planeat');


// Create a function that will parse recipes and add them to your Notion database
async function parseAndAddRecipes() {
  console.log('Parsing and adding recipes');
  const params = process.argv.slice(2);
  const ricardoSearchResults = await ricardo.search(params);
  console.log(`Found ${ricardoSearchResults.length} results`);
  if (ricardoSearchResults.length > 0) {
    const ricardoRecipe = await ricardo.getRecipe(ricardoSearchResults[0]);
    console.log(ricardoRecipe);
  }
}

// Schedule this function to run every hour using node-cron
//cron.schedule('* * * * *', parseAndAddRecipes);
//chacuit.search('poulet');


// TO determine. bootstrap?
// TODO DELETE DB (DELETE /blocks)
const planeat = new PlanEat();


async function fillRecipes() {
  // Get the tasks currently in the database.
  console.log("\nFetching tasks from Notion DB...")
  const currentTasks = await planeat.getTasksFromNotionDatabase()
}

setInterval(fillRecipes, 5000)

// listen for requests :)
//const listener = app.listen(process.env.PORT, function () {
//  console.log("Your app is listening on port " + listener.address().port)
//})
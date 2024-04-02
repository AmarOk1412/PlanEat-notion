const axios = require('axios');
const cheerio = require('cheerio');
const https = require('https');

exports.handleUrl = function(url) {
    return url.includes('cha-cu.it');
}

exports.search = async function(searchTerm) {
    const recipes = [];
    try {
        const searchTermEscaped = encodeURIComponent(searchTerm);
        const url = `https://cha-cu.it/recettes`;
        const agent = new https.Agent({ family: 4 });
        const response = await axios.get(url, {httpAgent: agent, httpsAgent: agent});
        const $ = cheerio.load(response.data);

        // Get url and title from div with class "p-2"
        $('.p-2').each((i, element) => {
            const url = $(element).find('a').attr('href');
            const title = $(element).find('.my-2.text-xl.font-semibold').text();

            // Check if the title matches the searchTerm or is similar
            if (title.toLowerCase().includes(searchTerm.toLowerCase())) {
                recipes.push({ url, title });
            }
        });

    } catch (error) {
        console.error(error);
    }
    return recipes;
}

exports.getRecipe = async function(recipe) {
    try {
        const agent = new https.Agent({ family: 4 });
        const response = await axios.get(recipe.url, {httpAgent: agent, httpsAgent: agent});
        const $ = cheerio.load(response.data);

        const name = $('meta[property="og:title"]').attr('content');

        const durationElement = $('h5:contains("Temps de préparation")');
        const durationText = durationElement.text();
        const durationMatch = durationText.match(/Temps de préparation : (\d+)min/);
        const duration = durationMatch ? parseInt(durationMatch[1]) : 0;

        const keywordsMeta = $('meta[itemprop="keywords"]').attr('content');
        const tags = keywordsMeta ? keywordsMeta.split(',') : [];

        const firstImage = $('.rounded-lg.shadow-sm.w-full.object-contain').attr('src');
        const imageUrl = `https://cha-cu.it${firstImage}`

        const ingredients = [];
        const equipment = [];

        // Extract ingredients
        $('#ingrédients + ul li').each((i, element) => {
            const ingredient = $(element).text();
            ingredients.push(ingredient);
        });

        // Extract equipment
        $('#équipement + ul li').each((i, element) => {
            const item = $(element).text();
            equipment.push(item);
        });

        const steps = [];
        $('ol li').each((i, element) => {
            const step = $(element).text();
            steps.push(step);
        });


        recipe = { ...recipe, name, duration, ingredients, equipment, steps, tags, imageUrl };
    } catch (error) {
        console.error(error);
    }
    return recipe;
  }
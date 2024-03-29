const axios = require('axios');
const cheerio = require('cheerio');

exports.search = async function() {
    // Your code to search for recipes goes here
    return 'ChaCuit search results';
}

exports.getRecipe = async function(recipe) {
    try {
        const response = await axios.get(recipe.url);
        const $ = cheerio.load(response.data);


        const title = $('.title-selector').text();
        const prepTime = $('.prepTime-selector').text();
        const ingredients = $('.ingredient-selector').map((i, element) => $(element).text()).get();
        const equipment = $('.equipment-selector').map((i, element) => $(element).text()).get();
        const steps = $('.step-selector').map((i, element) => $(element).text()).get();
        const keywords = $('.keywords-selector').map((i, element) => $(element).text()).get();
        const firstImage = $('.image-selector').attr('src');

        console.log({ title, prepTime, ingredients, equipment, steps, keywords, firstImage });

    } catch (error) {
        console.error(error);
    }
    return recipe;
  }
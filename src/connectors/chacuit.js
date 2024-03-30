const axios = require('axios');
const cheerio = require('cheerio');

exports.search = async function(searchTerm) {
    const recipes = [];
    try {
        const searchTermEscaped = encodeURIComponent(searchTerm);
        const url = `https://cha-cu.it/recettes`;
        const response = await axios.get(url);
        const $ = cheerio.load(response.data);
        console.log(response.data);
//
//        const $ = cheerio.load(response.data);
//
//        const scriptContent = $('script[id="react-bridge-bootstrap"]').html();
//        const data = getRouteProps(scriptContent);
//
//        if (data.status === "success" && data.content.results.rows) {
//            data.content.results.rows.forEach(result => {
//                const title = result.title;
//                const url = `https://www.ricardocuisine.com/recettes/${result.url}`;
//                const imageUrl = result.thumbnail;
//                recipes.push({ title, url, imageUrl });
//            });
//        }

    } catch (error) {
        console.error(error);
    }
    return recipes;
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
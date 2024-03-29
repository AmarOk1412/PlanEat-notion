const axios = require('axios');
const cheerio = require('cheerio');

exports.search = async function(searchTerm) {
    const recipes = [];
    try {
        const searchTermEscaped = encodeURIComponent(searchTerm);
        const url = `https://www.marmiton.org/recettes/recherche.aspx?aqt=${searchTermEscaped}`;
        const response = await axios.get(url);
        const $ = cheerio.load(response.data);

        $('.recipe-card-algolia').each((index, element) => {
            const title = $(element).find('.recipe-card__title').text();
            const relurl = $(element).find('.recipe-card-link').attr('href');
            const url = `https://www.marmiton.org${relurl}`;
            const imageUrl = $(element).find('.recipe-card__picture img').attr('data-srcset').split(',')[0].split(' ')[0];
            recipes.push({ title, url, imageUrl });
        });
    } catch (error) {
        console.error(error);
    }
    return recipes;
}

exports.getRecipe = async function(recipe) {
    try {
        const response = await axios.get(recipe.url);
        const $ = cheerio.load(response.data);

        let recipeData = null;

        $('script[type="application/ld+json"]').each((index, element) => {
            const scriptContent = $(element).html();
            const data = JSON.parse(scriptContent);

            if (data['@type'] === 'Recipe') {
                recipeData = data;
                return false; // break the loop
            }
        });

        if (recipeData) {
            const name = recipeData.name;
            let tags = []
            if (recipeData.recipeCuisine) {
                tags = [recipeData.recipeCuisine];
            }
            if (recipeData.keywords) {
                tags = recipeData.keywords.split(', ');
            } else if (recipeData.recipeCategory) {
                tags = recipeData.recipeCategory.split(', ');
            }

            const durationInMinutes = parseInt(recipeData.totalTime.replace(/\D/g, ''));
            const duration = `${durationInMinutes} min`;
            const ingredients = recipeData.recipeIngredient;
            const steps = recipeData.recipeInstructions.map(instruction => instruction.text);

            recipe = { ...recipe, name, tags, duration, ingredients, steps };
        }

    } catch (error) {
        console.error(error);
    }
    return recipe;
}
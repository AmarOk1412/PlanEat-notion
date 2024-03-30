const axios = require('axios');
const cheerio = require('cheerio');

getRouteProps = function(scriptContent) {
    let startPos = scriptContent.indexOf('routeProps:') + 'routeProps:'.length;
    let braceStack = [];
    let endPos;

    for (let i = startPos; i < scriptContent.length; i++) {
        if (scriptContent[i] === '{') {
            braceStack.push('{');
        } else if (scriptContent[i] === '}') {
            if (braceStack.length === 0) {
                throw new Error('Invalid scriptContent: unexpected }');
            }
            braceStack.pop();
            if (braceStack.length === 0) {
                endPos = i;
                break;
            }
        }
    }

    if (braceStack.length !== 0) {
        throw new Error('Invalid scriptContent: unmatched {');
    }

    let routePropsStr = scriptContent.substring(startPos, endPos + 1);
    let routeProps = JSON.parse(routePropsStr);

    return routeProps;
}

exports.search = async function(searchTerm) {
    const recipes = [];
    try {
        const searchTermEscaped = encodeURIComponent(searchTerm);
        const url = `https://www.ricardocuisine.com/recherche?sort=score&searchValue=${searchTermEscaped}&content-type=recipe&currentPage=1`;
        const response = await axios.get(url);
        const $ = cheerio.load(response.data);

        const scriptContent = $('script[id="react-bridge-bootstrap"]').html();
        const data = getRouteProps(scriptContent);

        if (data.status === "success" && data.content.results.rows) {
            data.content.results.rows.forEach(result => {
                const title = result.title;
                const url = `https://www.ricardocuisine.com/recettes/${result.url}`;
                const imageUrl = result.thumbnail;
                recipes.push({ title, url, imageUrl });
            });
        }

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

            const duration = parseInt(recipeData.totalTime.replace(/\D/g, ''));
            const ingredients = recipeData.recipeIngredient;
            const steps = recipeData.recipeInstructions[0].itemListElement.map(instruction => instruction.text);

            recipe = { ...recipe, name, tags, duration, ingredients, steps };
        }

    } catch (error) {
        console.error(error);
    }
    return recipe;
}
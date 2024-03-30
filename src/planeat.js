const fs = require('fs');
const path = require('path');
const notion = require('./notion')
const marmiton = require('./connectors/marmiton');

class PlanEat {

    constructor() {
        this.data = {
            recipes_db: '',
            recipes_page: ''
        };
        // Load JSON file
        const filePath = path.join(__dirname, 'data', 'ids.json');

        if (fs.existsSync(filePath)) {
            try {
                console.log(`Load data from ${filePath}`)
                this.data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
                return
            } catch (error) {
                console.warning(error)
            }
        }
        // Create data directory if it doesn't exist
        const dataDir = path.join(__dirname, 'data');
        if (!fs.existsSync(dataDir)) {
            fs.mkdirSync(dataDir);
        }
        this.createRecipeDb().then(()=>{
            //this.createRecipePage().then(()=> {
                fs.writeFileSync(filePath, JSON.stringify(this.data));
            //});
        });
    }

    async createRecipeDb() {
        // TODO create in dedicated page + good type
        let properties = {
            Title: {
                id: "title",
                title: {}
            },
            Source: {
                id: "url",
                type: "url",
                url: {}
            },
            Type: {
                id: "type",
                type: "select",
                select: {
                    options: [{
                        "name": "Breakfast"
                    },
                    {
                        "name": "Lunch"
                    },
                    {
                        "name": "Dinner"
                    }]
                }
            },
            Tags: {
                id: "tags",
                type: "multi_select",
                multi_select: {}
            },
            CookingTime: {
                id: "cookingtime",
                type: "number",
                number: {
                    format: "number",
                },
                name: "Cooking time"
            },
            TimeOfTheYear: {
                id: "timeoftheyear",
                type: "select",
                name: "Time of the year",
                select: {
                    options: [{
                        "name": "Summer"
                    },
                    {
                        "name": "Autumn"
                    },
                    {
                        "name": "Winter"
                    },
                    {
                        "name": "Spring"
                    }]
                }
            },
            Ingredients: {
                id: "ingredients",
                type: "rich_text",
                rich_text: {}
            },
            Steps: {
                id: "steps",
                type: "rich_text",
                rich_text: {}
            },
        }
        const db = await notion.newDatabase(process.env.NOTION_PAGE_ID, "recipes_db", properties)
        this.data.recipes_db = db.id
        console.log(`New recipe database - ${db.id}`)
    }

    async createRecipePage() {
        // NOTE: TODO this is a recipe not main page
        const page = await notion.newPage(this.data.recipes_db, "Recipes")
        this.data.recipes_page = page.id
        console.warn(page)
        console.log(`New recipe page - ${page.id}`)
    }

    recipeToPage(recipe) {
        return {
            Title: {
                type: "title",
                title: [{
                    type: "text",
                    text: {
                        content: recipe.title,
                    }
                }]
            },
            Source: {
                url: recipe.url
            },
            CookingTime: {
                id: "cookingtime",
                type: "number",
                number: recipe.duration,
            },
            Ingredients: {
                id: "ingredients",
                type: "rich_text",
                rich_text: recipe.ingredients.map(step => ({
                    type: "text",
                    text: {
                        content: step
                    }
                }))
            },
            Steps: {
                id: "steps",
                type: "rich_text",
                rich_text: recipe.steps.map(step => ({
                    type: "text",
                    text: {
                        content: step
                    }
                }))
            },
        }
    }

    /**
     * Gets tasks from the database.
     */
    async getTasksFromNotionDatabase() {
        const pages = []
        let cursor = undefined

        const shouldContinue = true
        while (shouldContinue) {
            const { results, next_cursor } = await notion.databases().query({
                database_id: this.data.recipes_db,
                start_cursor: cursor,
            })
            pages.push(...results)
            if (!next_cursor) {
                break
            }
            cursor = next_cursor
        }
        console.log(`${pages.length} pages successfully fetched.`)

        const tasks = []
        for (const page of pages) {
            const titlePage = page.properties["Title"].title
            let title = ""
            if (titlePage.length > 0)
                title = titlePage[0].plain_text
            const source = page.properties["Source"].url
            if (!source && title.length > 0) {
                console.log(`Finding best recipe for ${title}`)
                marmiton.search(title).then((recipes)=>{
                    if (recipes.length > 0) {
                        marmiton.getRecipe(recipes[0]).then((recipe) => {
                            notion.updatePage(page.id, this.recipeToPage(recipe))
                        })
                    }
                })
            } else if (source && title.length === 0) {
                console.log(`Parsing ${source}`)
                marmiton.getRecipe({url: source}).then((recipe)=> {
                    notion.updatePage(page.id, this.recipeToPage(recipe))
                })
            }
        }

        return tasks
    }
}

module.exports = PlanEat;

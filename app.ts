// Oak https://deno.land/x/oak/mod.ts

// View Engine https://deno.land/x/view_engine/mod.ts

// Multi Parser https://raw.githubusercontent.com/deligenius/multiparser/master/mod.ts

// Mongo https://deno.land/x/mongo@v0.7.0/mod.ts

// SHORT UUID https://cdn.jsdelivr.net/npm/short-unique-id@latest/short_uuid/mod.ts

// Importing Modules

import {Application, Router} from 'https://deno.land/x/oak/mod.ts';

import {viewEngine,
        engineFactory,
        adapterFactory} from 'https://deno.land/x/view_engine/mod.ts';

import {multiParser} from 'https://raw.githubusercontent.com/deligenius/multiparser/master/mod.ts';

import {MongoClient} from 'https://deno.land/x/mongo@v0.7.0/mod.ts';

import ShortUniqueId from 'https://cdn.jsdelivr.net/npm/short-unique-id@latest/short_uuid/mod.ts';

// Initiating App and Router

const app = new Application();

const router = new Router();

// Setting up View Engine

const ejsEngine = engineFactory.getEjsEngine();

const oakAdapter = adapterFactory.getOakAdapter();

app.use(viewEngine(oakAdapter,ejsEngine));

// Setting up mongo client

const client = new MongoClient();

client.connectWithUri('mongodb://localhost:27017');

const db = client.database('shortener');

const urlCollection = db.collection('url');

const UUID = new ShortUniqueId();


router.get('/',async (ctx) => {
    const allURL = await urlCollection.find({})
    ctx.render('index.ejs',{data: allURL});
})
.post('/post',async (ctx)=>{
    const formData:any = await multiParser(ctx.request.serverRequest);
    const urlObject = {
        fullURL: formData.url,
        shortURL: UUID(),
        click: 0
    }
    await urlCollection.insertOne(urlObject);
    ctx.response.redirect('/')
})
.get('/:shortId', async(ctx) => {
    const shortURLId = ctx.params.shortId;
    const isURL = await urlCollection.findOne({shortURL: shortURLId}); 
    if(isURL) {
        ctx.response.status = 301;
        await urlCollection.updateOne({_id: isURL._id},{$set: {click: isURL.click+1}})
        ctx.response.redirect(`${isURL.fullURL}`);
    }else{
        ctx.response.status = 404;
        ctx.response.body = "Sorry no page found";
    }
})
;

app.use(router.routes());

app.use(router.allowedMethods());

console.log('App is listening to port 8000');

await app.listen({port: 8000});
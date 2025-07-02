import { Hono } from 'hono';

import { DurableObject } from 'cloudflare:workers';
import puppeteer, { Browser } from '@cloudflare/puppeteer';

const KEEP_BROWSER_ALIVE_IN_SECONDS = 60;

/**
 * Welcome to Cloudflare Workers! This is your first Durable Objects application.
 *
 * - Run `npm run dev` in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your Durable Object in action
 * - Run `npm run deploy` to publish your application
 *
 * Bind resources to your worker in `wrangler.jsonc`. After adding bindings, a type definition for the
 * `Env` object can be regenerated with `npm run cf-typegen`.
 *
 * Learn more at https://developers.cloudflare.com/durable-objects
 */

/** A Durable Object's behavior is defined in an exported Javascript class */
export class RsDurableObject extends DurableObject<Env> {
	private browser: Browser | null = null;
	private keptAliveInSeconds: number = 0;
	private storage: DurableObjectStorage;

	/**
	 * The constructor is invoked once upon creation of the Durable Object, i.e. the first call to
	 * 	`DurableObjectStub::get` for a given identifier (no-op constructors can be omitted)
	 *
	 * @param ctx - The interface for interacting with Durable Object state
	 * @param env - The interface to reference bindings declared in wrangler.jsonc
	 */
	constructor(ctx: DurableObjectState, env: Env) {
		super(ctx, env);
		this.storage = ctx.storage;
	}

	/**
	 * The Durable Object exposes an RPC method sayHello which will be invoked when when a Durable
	 *  Object instance receives a request from a Worker via the same method invocation on the stub
	 *
	 * @param name - The name provided to a Durable Object instance from a Worker
	 * @returns The greeting to be sent back to the Worker
	 */
	async sayHello(name: string): Promise<string> {
		return `Hello, ${name}!`;
	}

	async initBrowser() {
		if (!this.browser || !this.browser.isConnected()) {
			console.log(`Browser Manager: Starting new instance`);
			try {
				this.browser = await puppeteer.launch(this.env.RS_BROWSER);
			} catch (e) {
				console.log(`Browser Manager: Could not start browser instance. Error: ${e}`);
				throw e;
			}
		}
		return this.browser;
	}

	async fetch(request: Request) {
		if (!this.browser || !this.browser.connected) {
			try {
				this.browser = await puppeteer.launch(this.env.RS_BROWSER);
			} catch (e: any) {
				return new Response(JSON.stringify({ error: e.message }), { status: 500 });
			}
		}
		return new Response(JSON.stringify({ status: 'ok' }));
	}

	async alarm() {
		this.keptAliveInSeconds += 10;

		// Extend browser DO life
		if (this.keptAliveInSeconds < KEEP_BROWSER_ALIVE_IN_SECONDS) {
			console.log(`Browser DO: has been kept alive for ${this.keptAliveInSeconds} seconds. Extending lifespan.`);
			await this.storage.setAlarm(Date.now() + 10 * 1000);
			// You could ensure the ws connection is kept alive by requesting something
			// or just let it close automatically when there  is no work to be done
			// for example, `await this.browser.version()`
		} else {
			console.log(`Browser DO: exceeded life of ${KEEP_BROWSER_ALIVE_IN_SECONDS}s.`);
			if (this.browser) {
				console.log(`Closing browser.`);
				await this.browser.close();
			}
		}
	}

	async cleanup() {
		if (this.browser) {
			console.log('Closing browser.');
			await this.browser.close();
		}
	}
}

// export default {
// 	/**
// 	 * This is the standard fetch handler for a Cloudflare Worker
// 	 *
// 	 * @param request - The request submitted to the Worker from the client
// 	 * @param env - The interface to reference bindings declared in wrangler.jsonc
// 	 * @param ctx - The execution context of the Worker
// 	 * @returns The response to be sent back to the client
// 	 */
// 	async fetch(request, env, ctx): Promise<Response> {
// 		// Create a `DurableObjectId` for an instance of the `MyDurableObject`
// 		// class named "foo". Requests from all Workers to the instance named
// 		// "foo" will go to a single globally unique Durable Object instance.
// 		const id: DurableObjectId = env.RS_DURABLE_OBJECT.idFromName('foo');

// 		// Create a stub to open a communication channel with the Durable
// 		// Object instance.
// 		const stub = env.RS_DURABLE_OBJECT.get(id);

// 		// Call the `sayHello()` RPC method on the stub to invoke the method on
// 		// the remote Durable Object instance
// 		const greeting = await stub.sayHello('world');

// 		return new Response(greeting);
// 	},
// } satisfies ExportedHandler<Env>;

const app = new Hono<{ Bindings: Env }>();

app.get('/', (c) =>
	c.json({
		status: 'ok',
		message: 'You should probably not be here',
	})
);

export default app;
